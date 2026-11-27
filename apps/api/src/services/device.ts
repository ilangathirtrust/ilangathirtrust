import crypto from 'node:crypto';
import type { Request } from 'express';
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
}): Promise<{ allowed: boolean; sessionId?: string; device: DeviceMetadata; reason?: string }> {
  const device = parseDeviceMetadata(params.req);
  const tokenHash = extractJwtSessionHash(params.token, device.deviceId);

  try {
    const supabase = getSupabaseAdmin();
    const { data: existing, error } = await supabase
      .from('admin_sessions')
      .select('id, session_token_hash, is_revoked, revoked_reason, last_active_at, expires_at')
      .eq('user_id', params.userId)
      .eq('device_id', device.deviceId)
      .maybeSingle();

    if (error) {
      // Gracefully pass if v011 migration has not been applied yet
      if (error.code === '42P01' || error.code === 'PGRST205') {
        return { allowed: true, device };
      }
      return { allowed: true, device };
    }

    if (existing) {
      const expired = existing.expires_at && new Date(existing.expires_at).getTime() < Date.now();
      const sameRevokedLogin = existing.is_revoked && existing.session_token_hash === tokenHash;

      if (sameRevokedLogin || expired) {
        return {
          allowed: false,
          sessionId: existing.id,
          device,
          reason: existing.revoked_reason || 'This device session was signed out remotely.'
        };
      }

      // If this is a brand new login on the same browser (different JWT session_id) or stale > 60s heartbeat
      const isNewLoginOnDevice = existing.session_token_hash !== tokenHash;
      const lastActiveMs = existing.last_active_at ? new Date(existing.last_active_at).getTime() : 0;
      const shouldUpdate = isNewLoginOnDevice || Date.now() - lastActiveMs > 60_000;

      if (shouldUpdate) {
        await supabase
          .from('admin_sessions')
          .update({
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
          })
          .eq('id', existing.id);

        if (isNewLoginOnDevice) {
          await recordSecurityEvent({
            userId: params.userId,
            email: params.email,
            eventType: 'login_success',
            severity: 'info',
            device
          });
        }
      }

      return { allowed: true, sessionId: existing.id, device };
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

    await recordSecurityEvent({
      userId: params.userId,
      email: params.email,
      eventType: 'new_device_detected',
      severity: 'warning',
      device
    });

    return { allowed: true, sessionId: inserted?.id, device };
  } catch {
    return { allowed: true, device };
  }
}
