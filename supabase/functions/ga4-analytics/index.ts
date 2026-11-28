import { createClient } from 'npm:@supabase/supabase-js@2';
import { decryptSecret, encryptSecret, signOAuthState, verifyOAuthState } from './crypto.ts';
import {
  Ga4EdgeError,
  queryGa4CoreReports,
  queryGa4RealtimeReport,
  validateAndResolveQuery
} from './ga4.ts';

const OWNER_EMAIL = 'ilangathirtrust@gmail.com';
const GA4_SCOPE = 'https://www.googleapis.com/auth/analytics.readonly';

const ALLOWED_ADMIN_ORIGINS = new Set([
  'https://admin.ilangathirtrust.org',
  'https://ilangathir-admin.vercel.app',
  'http://localhost:3001',
  'http://127.0.0.1:3001'
]);

const reportCache = new Map<string, { value: unknown; expiresAt: number }>();

function getEnvConfig() {
  const supabaseUrl = (Deno.env.get('SUPABASE_URL') || '').trim().replace(/\/+$/, '');
  const serviceRoleKey = (Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '').trim();
  const googleClientId = (Deno.env.get('GOOGLE_CLIENT_ID') || '').trim();
  const googleClientSecret = (Deno.env.get('GOOGLE_CLIENT_SECRET') || '').trim();
  const ga4PropertyId = (Deno.env.get('GA4_PROPERTY_ID') || '').trim().replace(/^properties\//i, '');
  const adminSiteUrl = (Deno.env.get('ADMIN_SITE_URL') || 'https://admin.ilangathirtrust.org').trim().replace(/\/+$/, '');
  const encryptionSecret = (Deno.env.get('GA4_TOKEN_ENCRYPTION_KEY') || serviceRoleKey).trim();

  if (adminSiteUrl) {
    ALLOWED_ADMIN_ORIGINS.add(adminSiteUrl);
  }

  const redirectUri = `${supabaseUrl}/functions/v1/ga4-analytics/callback`;

  return {
    supabaseUrl,
    serviceRoleKey,
    googleClientId,
    googleClientSecret,
    ga4PropertyId,
    adminSiteUrl,
    encryptionSecret,
    redirectUri
  };
}

function corsHeadersFor(req: Request): Record<string, string> {
  const origin = (req.headers.get('origin') || '').trim().replace(/\/+$/, '');
  const allowedOrigin = ALLOWED_ADMIN_ORIGINS.has(origin) ? origin : 'https://admin.ilangathirtrust.org';
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Device-Id, apikey',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin'
  };
}

function jsonResponse(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeadersFor(req),
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}

function resolveSafeReturnOrigin(candidate: string | null | undefined, fallback: string): string {
  const clean = (candidate || '').trim().replace(/\/+$/, '');
  if (ALLOWED_ADMIN_ORIGINS.has(clean)) return clean;
  return fallback;
}

function createSupabaseAdmin() {
  const cfg = getEnvConfig();
  return createClient(cfg.supabaseUrl, cfg.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

async function requireAdmin(req: Request) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) {
    throw new Ga4EdgeError('Authentication required.', 401, 'UNAUTHORIZED');
  }

  const supabase = createSupabaseAdmin();
  const { data: userRes, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !userRes?.user) {
    throw new Ga4EdgeError('Invalid or expired session token.', 401, 'INVALID_SESSION');
  }

  const user = userRes.user;
  const email = (user.email || '').toLowerCase();
  const { data: adminRow, error: rowErr } = await supabase
    .from('admin_users')
    .select('id, email, full_name, role, is_active')
    .eq('id', user.id)
    .maybeSingle();

  if (rowErr || !adminRow || !adminRow.is_active) {
    throw new Ga4EdgeError('Admin access is disabled or unauthorized.', 403, 'FORBIDDEN');
  }

  const effectiveRole = email === OWNER_EMAIL ? 'super_admin' : String(adminRow.role);
  return {
    id: String(adminRow.id),
    email,
    role: effectiveRole,
    supabase
  };
}

async function getValidGoogleAccessToken(supabase: ReturnType<typeof createSupabaseAdmin>): Promise<{
  propertyId: string;
  accessToken: string;
}> {
  const cfg = getEnvConfig();
  if (!cfg.googleClientId || !cfg.googleClientSecret || !/^\d{5,16}$/.test(cfg.ga4PropertyId)) {
    throw new Ga4EdgeError('Missing GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, or numeric GA4_PROPERTY_ID.', 503, 'OAUTH_SECRETS_MISSING');
  }

  const { data: conn, error } = await supabase
    .from('ga4_oauth_connections')
    .select('*')
    .eq('id', 'default')
    .maybeSingle();

  if (error) {
    if (error.code === '42P01' || error.code === 'PGRST205') {
      throw new Ga4EdgeError('Database migration v016_ga4_oauth_tokens.sql has not been applied yet.', 503, 'MIGRATION_REQUIRED');
    }
    throw new Ga4EdgeError(error.message, 500, 'DB_ERROR');
  }

  if (!conn || !conn.refresh_token_enc) {
    throw new Ga4EdgeError('Google Analytics is not authorized yet. Connect your Google account first.', 401, 'GA4_NOT_CONNECTED');
  }

  const nowMs = Date.now();
  if (conn.access_token_enc && conn.access_token_expires_at) {
    const expMs = new Date(conn.access_token_expires_at).getTime();
    if (expMs - 120_000 > nowMs) {
      const cachedAccess = await decryptSecret(String(conn.access_token_enc), cfg.encryptionSecret);
      if (cachedAccess) {
        return { propertyId: cfg.ga4PropertyId, accessToken: cachedAccess };
      }
    }
  }

  const refreshToken = await decryptSecret(String(conn.refresh_token_enc), cfg.encryptionSecret);
  if (!refreshToken) {
    throw new Ga4EdgeError('Stored refresh token could not be decrypted. Please reconnect Google Analytics.', 401, 'GA4_REAUTH_REQUIRED');
  }

  const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: cfg.googleClientId,
      client_secret: cfg.googleClientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    })
  });

  const tokenJson = (await tokenResp.json().catch(() => ({}))) as {
    access_token?: string;
    expires_in?: number;
    refresh_token?: string;
    error?: string;
    error_description?: string;
  };

  if (!tokenResp.ok || !tokenJson.access_token) {
    if (tokenJson.error === 'invalid_grant') {
      await supabase.from('ga4_oauth_connections').delete().eq('id', 'default');
      throw new Ga4EdgeError('Google authorization expired or was revoked. Please connect again.', 401, 'GA4_REAUTH_REQUIRED');
    }
    throw new Ga4EdgeError(
      tokenJson.error_description || tokenJson.error || 'Unable to refresh Google OAuth access token.',
      502,
      'GA4_TOKEN_REFRESH_FAILED'
    );
  }

  const expiresAt = new Date(nowMs + Math.max(300, Number(tokenJson.expires_in || 3600)) * 1000).toISOString();
  const nextAccessEnc = await encryptSecret(tokenJson.access_token, cfg.encryptionSecret);
  const nextRefreshEnc = tokenJson.refresh_token
    ? await encryptSecret(tokenJson.refresh_token, cfg.encryptionSecret)
    : conn.refresh_token_enc;

  await supabase
    .from('ga4_oauth_connections')
    .update({
      access_token_enc: nextAccessEnc,
      access_token_expires_at: expiresAt,
      refresh_token_enc: nextRefreshEnc,
      property_id: cfg.ga4PropertyId,
      updated_at: new Date().toISOString()
    })
    .eq('id', 'default');

  return { propertyId: cfg.ga4PropertyId, accessToken: tokenJson.access_token };
}

function getRouteSubpath(reqUrl: string): string {
  const url = new URL(reqUrl);
  const idx = url.pathname.indexOf('/ga4-analytics');
  if (idx >= 0) {
    return url.pathname.slice(idx + '/ga4-analytics'.length).replace(/\/+$/, '') || '/';
  }
  return url.pathname.replace(/\/+$/, '') || '/';
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeadersFor(req) });
  }

  const cfg = getEnvConfig();
  const subPath = getRouteSubpath(req.url);
  const url = new URL(req.url);

  try {
    // -------------------- 1. OAUTH CALLBACK (Browser redirect from Google) --------------------
    if (req.method === 'GET' && subPath === '/callback') {
      const errorParam = url.searchParams.get('error');
      const code = url.searchParams.get('code') || '';
      const rawState = url.searchParams.get('state') || '';

      const state = await verifyOAuthState<{
        uid: string;
        email: string;
        returnOrigin: string;
        exp: number;
      }>(rawState, cfg.encryptionSecret);

      const returnOrigin = resolveSafeReturnOrigin(state?.returnOrigin, cfg.adminSiteUrl);

      if (errorParam) {
        return Response.redirect(
          `${returnOrigin}/analytics?ga4_error=${encodeURIComponent(errorParam)}`,
          302
        );
      }

      if (!state || !state.uid || Date.now() > Number(state.exp || 0)) {
        return Response.redirect(
          `${returnOrigin}/analytics?ga4_error=${encodeURIComponent('invalid_or_expired_oauth_state')}`,
          302
        );
      }

      if (!code) {
        return Response.redirect(
          `${returnOrigin}/analytics?ga4_error=${encodeURIComponent('missing_authorization_code')}`,
          302
        );
      }

      const supabase = createSupabaseAdmin();
      const { data: adminCheck } = await supabase
        .from('admin_users')
        .select('id, email, role, is_active')
        .eq('id', state.uid)
        .maybeSingle();

      const adminRole =
        String(adminCheck?.email || '').toLowerCase() === OWNER_EMAIL ? 'super_admin' : String(adminCheck?.role || '');

      if (!adminCheck?.is_active || !['super_admin', 'admin'].includes(adminRole)) {
        return Response.redirect(
          `${returnOrigin}/analytics?ga4_error=${encodeURIComponent('unauthorized_admin_account')}`,
          302
        );
      }

      const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: cfg.googleClientId,
          client_secret: cfg.googleClientSecret,
          redirect_uri: cfg.redirectUri,
          grant_type: 'authorization_code'
        })
      });

      const tokenJson = (await tokenResp.json().catch(() => ({}))) as {
        access_token?: string;
        refresh_token?: string;
        expires_in?: number;
        scope?: string;
        error?: string;
        error_description?: string;
      };

      if (!tokenResp.ok || !tokenJson.access_token) {
        const msg = tokenJson.error_description || tokenJson.error || 'token_exchange_failed';
        return Response.redirect(`${returnOrigin}/analytics?ga4_error=${encodeURIComponent(msg)}`, 302);
      }

      let refreshToStore = tokenJson.refresh_token || '';
      if (!refreshToStore) {
        const { data: existing } = await supabase
          .from('ga4_oauth_connections')
          .select('refresh_token_enc')
          .eq('id', 'default')
          .maybeSingle();
        if (existing?.refresh_token_enc) {
          refreshToStore = await decryptSecret(String(existing.refresh_token_enc), cfg.encryptionSecret);
        }
      }

      if (!refreshToStore) {
        return Response.redirect(
          `${returnOrigin}/analytics?ga4_error=${encodeURIComponent('no_refresh_token_received_revoke_app_in_google_and_retry')}`,
          302
        );
      }

      const refreshEnc = await encryptSecret(refreshToStore, cfg.encryptionSecret);
      const accessEnc = await encryptSecret(tokenJson.access_token, cfg.encryptionSecret);
      const expiresAt = new Date(Date.now() + Math.max(300, Number(tokenJson.expires_in || 3600)) * 1000).toISOString();

      const { error: upsertErr } = await supabase.from('ga4_oauth_connections').upsert(
        {
          id: 'default',
          property_id: cfg.ga4PropertyId,
          refresh_token_enc: refreshEnc,
          access_token_enc: accessEnc,
          access_token_expires_at: expiresAt,
          scope: tokenJson.scope || GA4_SCOPE,
          connected_by: adminCheck.id,
          connected_by_email: String(adminCheck.email || state.email),
          updated_at: new Date().toISOString()
        },
        { onConflict: 'id' }
      );

      if (upsertErr) {
        return Response.redirect(
          `${returnOrigin}/analytics?ga4_error=${encodeURIComponent(upsertErr.message)}`,
          302
        );
      }

      reportCache.clear();
      return Response.redirect(`${returnOrigin}/analytics?ga4_connected=1`, 302);
    }

    // All remaining endpoints strictly require verified Admin JWT
    const admin = await requireAdmin(req);

    // -------------------- 2. CONNECTION STATUS --------------------
    if (req.method === 'GET' && (subPath === '/status' || subPath === '/')) {
      const hasClientId = Boolean(cfg.googleClientId);
      const hasClientSecret = Boolean(cfg.googleClientSecret);
      const hasPropertyId = /^\d{5,16}$/.test(cfg.ga4PropertyId);
      const secretsReady = hasClientId && hasClientSecret && hasPropertyId;

      const { data: conn, error } = await admin.supabase
        .from('ga4_oauth_connections')
        .select('property_id, connected_by_email, updated_at, scope')
        .eq('id', 'default')
        .maybeSingle();

      const migrationRequired = error?.code === '42P01' || error?.code === 'PGRST205';

      return jsonResponse(req, {
        configured: Boolean(secretsReady && conn && !migrationRequired),
        secretsReady,
        migrationRequired: Boolean(migrationRequired),
        hasClientId,
        hasClientSecret,
        hasPropertyId,
        connected: Boolean(conn && !migrationRequired),
        connectedByEmail: conn?.connected_by_email || null,
        connectedAt: conn?.updated_at || null,
        redirectUri: cfg.redirectUri,
        measurementId: 'G-VNPQW61EYH',
        timezone: 'Asia/Kolkata'
      });
    }

    // -------------------- 3. OAUTH AUTHORIZATION URL START --------------------
    if ((req.method === 'POST' || req.method === 'GET') && subPath === '/oauth/start') {
      if (!['super_admin', 'admin'].includes(admin.role)) {
        throw new Ga4EdgeError('Only Admins and Super Admins can connect Google Analytics.', 403, 'FORBIDDEN');
      }
      if (!cfg.googleClientId || !cfg.googleClientSecret || !/^\d{5,16}$/.test(cfg.ga4PropertyId)) {
        throw new Ga4EdgeError(
          'Missing GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, or numeric GA4_PROPERTY_ID in Supabase Edge Secrets.',
          503,
          'OAUTH_SECRETS_MISSING'
        );
      }

      let bodyReturnOrigin = '';
      if (req.method === 'POST') {
        try {
          const b = (await req.json()) as { returnOrigin?: string };
          bodyReturnOrigin = String(b?.returnOrigin || '');
        } catch {
          // optional body
        }
      }

      const originHeader = req.headers.get('origin') || bodyReturnOrigin;
      const returnOrigin = resolveSafeReturnOrigin(originHeader, cfg.adminSiteUrl);

      const stateToken = await signOAuthState(
        {
          uid: admin.id,
          email: admin.email,
          returnOrigin,
          nonce: crypto.randomUUID(),
          exp: Date.now() + 10 * 60_000
        },
        cfg.encryptionSecret
      );

      const authParams = new URLSearchParams({
        client_id: cfg.googleClientId,
        redirect_uri: cfg.redirectUri,
        response_type: 'code',
        scope: GA4_SCOPE,
        access_type: 'offline',
        prompt: 'consent select_account',
        include_granted_scopes: 'true',
        state: stateToken
      });

      return jsonResponse(req, {
        authUrl: `https://accounts.google.com/o/oauth2/v2/auth?${authParams.toString()}`,
        redirectUri: cfg.redirectUri
      });
    }

    // -------------------- 4. DISCONNECT OAUTH --------------------
    if (req.method === 'POST' && subPath === '/disconnect') {
      if (!['super_admin', 'admin'].includes(admin.role)) {
        throw new Ga4EdgeError('Only Admins and Super Admins can disconnect Google Analytics.', 403, 'FORBIDDEN');
      }

      const { data: conn } = await admin.supabase
        .from('ga4_oauth_connections')
        .select('refresh_token_enc')
        .eq('id', 'default')
        .maybeSingle();

      if (conn?.refresh_token_enc) {
        const refresh = await decryptSecret(String(conn.refresh_token_enc), cfg.encryptionSecret).catch(() => '');
        if (refresh) {
          await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(refresh)}`, {
            method: 'POST'
          }).catch(() => {});
        }
      }

      await admin.supabase.from('ga4_oauth_connections').delete().eq('id', 'default');
      reportCache.clear();
      return jsonResponse(req, { disconnected: true });
    }

    // -------------------- 5. CORE GA4 REPORTS --------------------
    if (req.method === 'GET' && subPath === '/reports') {
      const filters = validateAndResolveQuery(url.searchParams);
      const forceRefresh = url.searchParams.get('refresh') === 'true';

      // Fast status check before querying GA4
      const { data: connRow, error: connErr } = await admin.supabase
        .from('ga4_oauth_connections')
        .select('id, property_id, connected_by_email, updated_at')
        .eq('id', 'default')
        .maybeSingle();

      const migrationRequired = connErr?.code === '42P01' || connErr?.code === 'PGRST205';
      const hasClientId = Boolean(cfg.googleClientId);
      const hasClientSecret = Boolean(cfg.googleClientSecret);
      const hasPropertyId = /^\d{5,16}$/.test(cfg.ga4PropertyId);
      const secretsReady = hasClientId && hasClientSecret && hasPropertyId;

      if (migrationRequired || !secretsReady || !connRow) {
        return jsonResponse(req, {
          configured: false,
          configStatus: {
            configured: false,
            oauthMode: true,
            secretsReady,
            migrationRequired: Boolean(migrationRequired),
            hasClientId,
            hasClientSecret,
            hasPropertyId,
            connected: Boolean(connRow && !migrationRequired),
            redirectUri: cfg.redirectUri,
            measurementId: 'G-VNPQW61EYH',
            timezone: 'Asia/Kolkata'
          }
        });
      }

      const cacheKey = `rep:${cfg.ga4PropertyId}:${JSON.stringify(filters)}`;
      if (!forceRefresh) {
        const cached = reportCache.get(cacheKey);
        if (cached && cached.expiresAt > Date.now()) {
          return jsonResponse(req, cached.value);
        }
      }

      const { propertyId, accessToken } = await getValidGoogleAccessToken(admin.supabase);
      const data = await queryGa4CoreReports(propertyId, accessToken, filters);

      reportCache.set(cacheKey, { value: data, expiresAt: Date.now() + 300_000 });
      return jsonResponse(req, data);
    }

    // -------------------- 6. REALTIME GA4 REPORT --------------------
    if (req.method === 'GET' && subPath === '/realtime') {
      const forceRefresh = url.searchParams.get('refresh') === 'true';
      const cacheKey = `rt:${cfg.ga4PropertyId}`;

      if (!forceRefresh) {
        const cached = reportCache.get(cacheKey);
        if (cached && cached.expiresAt > Date.now()) {
          return jsonResponse(req, cached.value);
        }
      }

      const { propertyId, accessToken } = await getValidGoogleAccessToken(admin.supabase);
      const data = await queryGa4RealtimeReport(propertyId, accessToken);

      reportCache.set(cacheKey, { value: data, expiresAt: Date.now() + 15_000 });
      return jsonResponse(req, data);
    }

    return jsonResponse(req, { error: 'Analytics route not found.', code: 'NOT_FOUND' }, 404);
  } catch (err) {
    if (err instanceof Ga4EdgeError) {
      return jsonResponse(req, { error: err.message, code: err.code }, err.status);
    }
    return jsonResponse(
      req,
      { error: err instanceof Error ? err.message : 'Unexpected analytics server error.', code: 'INTERNAL_ERROR' },
      500
    );
  }
});
