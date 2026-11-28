import crypto from 'node:crypto';
import type { Request } from 'express';
import { env } from '../config/env.js';
import { getSupabaseAdmin } from '../config/supabase.js';

export interface DeviceMetadata {
  deviceId: string;
  deviceName: string;
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  browser: string;
  os: string;
  ipAddress: string;
  geoLabel: string;
  userAgent: string;
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim().slice(0, 80);
  }
  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp.trim()) {
    return realIp.trim().slice(0, 80);
  }
  return (req.ip || 'unknown').slice(0, 80);
}

export function parseDeviceMetadata(req: Request): DeviceMetadata {
  const ua = String(req.headers['user-agent'] || '').slice(0, 400);
  const ip = getClientIp(req);

  let browser = 'Browser';
  if (/Edg\//i.test(ua)) browser = 'Microsoft Edge';
  else if (/OPR\/|Opera/i.test(ua)) browser = 'Opera';
  else if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) browser = 'Chrome';
  else if (/Firefox\//i.test(ua)) browser = 'Firefox';
  else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browser = 'Safari';
  else if (/node|undici|curl/i.test(ua)) browser = 'API Client';

  let os = 'Unknown OS';
  if (/Windows NT/i.test(ua)) os = 'Windows';
  else if (/iPhone/i.test(ua)) os = 'iPhone (iOS)';
  else if (/iPad/i.test(ua)) os = 'iPadOS';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/Mac OS X|Macintosh/i.test(ua)) os = 'macOS';
  else if (/Linux/i.test(ua)) os = 'Linux';

  let deviceType: DeviceMetadata['deviceType'] = 'desktop';
  if (/iPad|Tablet|PlayBook|Silk/i.test(ua)) deviceType = 'tablet';
  else if (/Mobile|iPhone|Android.*Mobile/i.test(ua)) deviceType = 'mobile';
  else if (!ua) deviceType = 'unknown';

  const city = String(req.headers['x-vercel-ip-city'] || '').trim();
  const region = String(req.headers['x-vercel-ip-country-region'] || '').trim();
  const country = String(req.headers['x-vercel-ip-country'] || '').trim();
  const geoParts = [city, region, country].map((s) => decodeURIComponentSafe(s)).filter(Boolean);
  const geoLabel = geoParts.join(', ') || (ip.startsWith('127.') || ip === '::1' ? 'Localhost' : 'Unknown location');

  const rawDeviceHeader = String(req.headers['x-device-id'] || '').trim().replace(/[^a-zA-Z0-9_-]/g, '');
  const deviceId =
    rawDeviceHeader.length >= 8
      ? rawDeviceHeader.slice(0, 64)
      : `ua_${crypto.createHash('sha256').update(`${browser}|${os}|${ip}`).digest('hex').slice(0, 24)}`;

  return {
    deviceId,
    deviceName: `${browser} on ${os}`,
    deviceType,
    browser,
    os,
    ipAddress: ip,
    geoLabel,
    userAgent: ua
  };
}

function decodeURIComponentSafe(val: string): string {
  if (!val) return '';
  try {
    return decodeURIComponent(val);
  } catch {
    return val;
  }
}

export function extractJwtSessionHash(token: string, deviceId: string): string {
  const parts = token.split('.');
  if (parts.length === 3) {
    try {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as {
        session_id?: string;
        sub?: string;
      };
      if (payload.session_id) {
        return crypto.createHash('sha256').update(`${payload.session_id}:${deviceId}`).digest('hex');
      }
    } catch {
      // fall back below
    }
  }
  return crypto.createHash('sha256').update(`${token}:${deviceId}`).digest('hex');
}

function getSessionSigningKey(): Buffer {
  return crypto
    .createHmac('sha256', env.SUPABASE_SERVICE_ROLE_KEY || 'ilangathir-local-session-secret')
    .update('ilangathir-admin-session-signature-v1')
    .digest();
}

export function signSessionPayload(params: {
  userId: string;
  deviceId: string;
  tokenHash: string;
}): string {
  const canonical = `${params.userId}|${params.deviceId}|${params.tokenHash}`;
  return crypto.createHmac('sha256', getSessionSigningKey()).update(canonical).digest('hex');
}

export function verifySessionSignature(params: {
  userId: string;
  deviceId: string;
  tokenHash: string;
  signature?: string | null;
}): boolean {
  if (!params.signature) return false;
  const expected = signSessionPayload(params);
  const a = Buffer.from(params.signature, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function recordSecurityEvent(params: {
  userId?: string | null;
  email?: string;
  eventType: string;
  severity?: 'info' | 'warning' | 'critical';
  device?: DeviceMetadata;
  details?: Record<string, unknown>;
}): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    await supabase.from('security_events').insert({
      user_id: params.userId || null,
      email: params.email || '',
      event_type: params.eventType,
      severity: params.severity || 'info',
      device_id: params.device?.deviceId || '',
      device_name: params.device?.deviceName || '',
      ip_address: params.device?.ipAddress || '',
      geo_label: params.device?.geoLabel || '',
      details: params.details || {}
    });
  } catch {
    // Non-fatal if v011 security tables are not migrated yet
  }
}

export async function verifyAndSyncAdminSession(params: {
  req: Request;
  userId: string;
  email: string;
  token: string;
}): Promise<{ allowed: boolean; sessionId?: string; device: DeviceMetadata; signatureVerified: boolean; reason?: string }> {
  const device = parseDeviceMetadata(params.req);
  const tokenHash = extractJwtSessionHash(params.token, device.deviceId);
  const expectedSig = signSessionPayload({ userId: params.userId, deviceId: device.deviceId, tokenHash });

  try {
    const supabase = getSupabaseAdmin();
    const { data: existing, error } = await supabase
      .from('admin_sessions')
      .select('id, session_token_hash, is_revoked, revoked_reason, last_active_at, expires_at')
      .eq('user_id', params.userId)
      .eq('device_id', device.deviceId)
      .maybeSingle();

    if (error) {
      return { allowed: true, device, signatureVerified: false };
    }

    if (existing) {
      const expired = existing.expires_at && new Date(existing.expires_at).getTime() < Date.now();
      const sameRevokedLogin = existing.is_revoked && existing.session_token_hash === tokenHash;

      if (sameRevokedLogin || expired) {
        return {
          allowed: false,
          sessionId: existing.id,
          device,
          signatureVerified: false,
          reason: existing.revoked_reason || 'This device session was signed out remotely.'
        };
      }

      // Refresh every 5 min (instead of every 60s) to keep request path fast
      const isNewLoginOnDevice = existing.session_token_hash !== tokenHash;
      const lastActiveMs = existing.last_active_at ? new Date(existing.last_active_at).getTime() : 0;
      const shouldUpdate = isNewLoginOnDevice || Date.now() - lastActiveMs > 300_000;

      if (shouldUpdate) {
        const updatePayload: Record<string, unknown> = {
          session_token_hash: tokenHash,
          device_name: device.deviceName,
          device_type: device.deviceType,
          browser: device.browser,
          os: device.os,
          ip_address: device.ipAddress,
          geo_label: device.geoLabel,
          user_agent: device.userAgent,
          is_revoked: false,
          revoked_at: null,
          revoked_reason: '',
          last_active_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        };

        void supabase
          .from('admin_sessions')
          .update(updatePayload)
          .eq('id', existing.id)
          .then(() => {
            if (isNewLoginOnDevice) {
              void recordSecurityEvent({
                userId: params.userId,
                email: params.email,
                eventType: 'login_success',
                severity: 'info',
                device
              });
            }
          });
      }

      return {
        allowed: true,
        sessionId: existing.id,
        device,
        signatureVerified: verifySessionSignature({
          userId: params.userId,
          deviceId: device.deviceId,
          tokenHash,
          signature: expectedSig
        })
      };
    }

    // First time seeing this device for this admin account
    const { data: inserted } = await supabase
      .from('admin_sessions')
      .insert({
        user_id: params.userId,
        session_token_hash: tokenHash,
        device_id: device.deviceId,
        device_name: device.deviceName,
        device_type: device.deviceType,
        browser: device.browser,
        os: device.os,
        ip_address: device.ipAddress,
        geo_label: device.geoLabel,
        user_agent: device.userAgent
      })
      .select('id')
      .maybeSingle();

    void recordSecurityEvent({
      userId: params.userId,
      email: params.email,
      eventType: 'new_device_detected',
      severity: 'warning',
      device
    });

    return { allowed: true, sessionId: inserted?.id, device, signatureVerified: true };
  } catch {
    return { allowed: true, device, signatureVerified: false };
  }
}
