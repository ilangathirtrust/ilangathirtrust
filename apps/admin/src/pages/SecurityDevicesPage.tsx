import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  KeyRound,
  Laptop,
  Loader2,
  LogOut,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Tablet,
  Trash2
} from 'lucide-react';
import { adminApi } from '../lib/api';
import { getSupabaseClient } from '../lib/supabase';

interface DeviceSession {
  id: string;
  device_id: string;
  device_name: string;
  device_type: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  browser: string;
  os: string;
  ip_address: string;
  geo_label: string;
  is_trusted: boolean;
  is_revoked: boolean;
  revoked_at: string | null;
  revoked_reason: string;
  last_active_at: string;
  created_at: string;
  signature_verified?: boolean;
  signature_fingerprint?: string;
}

interface SecurityEventItem {
  id: string;
  event_type: string;
  severity: 'info' | 'warning' | 'critical';
  device_name: string;
  ip_address: string;
  geo_label: string;
  created_at: string;
}

interface SecurityOverviewResponse {
  migrationRequired: boolean;
  currentSessionId: string | null;
  sessions: DeviceSession[];
  events: SecurityEventItem[];
}

interface MfaFactor {
  id: string;
  friendly_name?: string;
  status: string;
  factor_type: string;
}

function DeviceIcon({ type }: { type: string }) {
  if (type === 'mobile') return <Smartphone className="h-5 w-5" />;
  if (type === 'tablet') return <Tablet className="h-5 w-5" />;
  return <Laptop className="h-5 w-5" />;
}

function formatEventLabel(eventType: string): string {
  const labels: Record<string, string> = {
    login_success: 'Signed in',
    new_device_detected: 'New device sign-in detected',
    session_revoked: 'Device signed out remotely',
    revoke_all_other_sessions: 'Signed out all other devices',
    device_trusted: 'Marked device as trusted',
    device_untrusted: 'Removed trusted device status',
    mfa_enrolled: 'Two-factor authentication enabled',
    mfa_removed: 'Two-factor authentication disabled',
    password_changed: 'Account password updated'
  };
  return labels[eventType] || eventType.replace(/_/g, ' ');
}

function formatRelativeTime(iso: string): string {
  const diffSec = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (diffSec < 60) return 'Active now';
  const mins = Math.floor(diffSec / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function SecurityDevicesPage({
  onNotify
}: {
  onNotify: (msg: string, isErr?: boolean) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<SecurityOverviewResponse | null>(null);
  const [factors, setFactors] = useState<MfaFactor[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  // MFA enrollment wizard state
  const [enrollData, setEnrollData] = useState<{ factorId: string; qrCode: string; secret: string } | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [enrolling, setEnrolling] = useState(false);

  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [signOutOthersOnPwd, setSignOutOthersOnPwd] = useState(true);
  const [savingPwd, setSavingPwd] = useState(false);

  async function loadSecurityData() {
    setLoading(true);
    try {
      const supabase = getSupabaseClient();
      const [apiRes, mfaRes] = await Promise.all([
        adminApi<SecurityOverviewResponse>('/security/overview'),
        supabase.auth.mfa.listFactors()
      ]);
      setOverview(apiRes);
      const totpFactors = (mfaRes.data?.totp || []) as MfaFactor[];
      setFactors(totpFactors);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Unable to load security overview.', true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSecurityData();
  }, []);

  async function handleTrustToggle(session: DeviceSession) {
    setBusyId(session.id);
    try {
      await adminApi(`/security/sessions/${session.id}/trust`, {
        method: 'POST',
        body: JSON.stringify({ is_trusted: !session.is_trusted })
      });
      onNotify(session.is_trusted ? 'Trusted status removed.' : 'Device marked as trusted.');
      await loadSecurityData();
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Failed to update device trust.', true);
    } finally {
      setBusyId(null);
    }
  }

  async function handleRevokeSession(session: DeviceSession) {
    setBusyId(session.id);
    try {
      await adminApi(`/security/sessions/${session.id}`, { method: 'DELETE' });
      onNotify(`Signed out "${session.device_name}".`);
      await loadSecurityData();
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Failed to sign out device.', true);
    } finally {
      setBusyId(null);
    }
  }

  async function handleRevokeAllOthers() {
    setBusyId('revoke-all');
    try {
      const supabase = getSupabaseClient();
      await Promise.all([
        adminApi('/security/sessions/revoke-others', { method: 'POST' }),
        supabase.auth.signOut({ scope: 'others' })
      ]);
      onNotify('All other devices have been signed out.');
      await loadSecurityData();
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Failed to sign out other devices.', true);
    } finally {
      setBusyId(null);
    }
  }

  async function handleStartMfa() {
    setEnrolling(true);
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Ilangathir Authenticator'
      });
      if (error || !data) throw error || new Error('Could not initialize authenticator setup.');
      setEnrollData({
        factorId: data.id,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret
      });
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Failed to start 2FA setup.', true);
    } finally {
      setEnrolling(false);
    }
  }

  async function handleVerifyMfa(e: React.FormEvent) {
    e.preventDefault();
    if (!enrollData) return;
    setEnrolling(true);
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: enrollData.factorId,
        code: mfaCode.trim()
      });
      if (error) throw error;
      await adminApi('/security/events/record', {
        method: 'POST',
        body: JSON.stringify({ event_type: 'mfa_enrolled', severity: 'info' })
      }).catch(() => {});
      setEnrollData(null);
      setMfaCode('');
      onNotify('Two-factor authentication is now enabled on your account.');
      await loadSecurityData();
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Invalid verification code.', true);
    } finally {
      setEnrolling(false);
    }
  }

  async function handleRemoveMfa(factorId: string) {
    setBusyId(factorId);
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) throw error;
      await adminApi('/security/events/record', {
        method: 'POST',
        body: JSON.stringify({ event_type: 'mfa_removed', severity: 'warning' })
      }).catch(() => {});
      onNotify('Authenticator 2FA removed.');
      await loadSecurityData();
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Unable to remove 2FA factor.', true);
    } finally {
      setBusyId(null);
    }
  }

  async function handlePasswordUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 10) {
      onNotify('Choose a strong password of at least 10 characters.', true);
      return;
    }
    if (newPassword !== confirmPassword) {
      onNotify('Passwords do not match.', true);
      return;
    }
    setSavingPwd(true);
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      await adminApi('/security/events/record', {
        method: 'POST',
        body: JSON.stringify({ event_type: 'password_changed', severity: 'warning' })
      }).catch(() => {});

      if (signOutOthersOnPwd) {
        await Promise.all([
          adminApi('/security/sessions/revoke-others', { method: 'POST' }).catch(() => {}),
          supabase.auth.signOut({ scope: 'others' }).catch(() => {})
        ]);
      }

      setNewPassword('');
      setConfirmPassword('');
      onNotify('Password updated successfully.');
      await loadSecurityData();
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Unable to update password.', true);
    } finally {
      setSavingPwd(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-28 animate-pulse rounded-2xl bg-stone-200" />
        <div className="h-64 animate-pulse rounded-2xl bg-stone-200" />
      </div>
    );
  }

  const verifiedFactors = factors.filter((f) => f.status === 'verified');
  const activeSessions = (overview?.sessions || []).filter((s) => !s.is_revoked);
  const revokedSessions = (overview?.sessions || []).filter((s) => s.is_revoked);
  const otherActiveCount = activeSessions.filter((s) => s.id !== overview?.currentSessionId).length;

  return (
    <div className="space-y-6">
      {overview?.migrationRequired && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900">
          Run <code>supabase/migrations/v011_sessions_and_security.sql</code> in Supabase SQL Editor to enable full cross-device session history and security event logs.
        </div>
      )}

      {/* Security Checkup Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${verifiedFactors.length ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
              {verifiedFactors.length ? <ShieldCheck className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Two-Factor Auth</p>
              <p className="text-base font-extrabold text-slate-900">
                {verifiedFactors.length ? 'Enabled (Authenticator)' : 'Not Enabled'}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
              <Laptop className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Sessions</p>
              <p className="text-base font-extrabold text-slate-900">{activeSessions.length} active device(s)</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Trusted Devices</p>
              <p className="text-base font-extrabold text-slate-900">
                {activeSessions.filter((s) => s.is_trusted).length} trusted
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Where You're Signed In + Digital Signature Verification */}
      <section className="admin-card">
        <div className="flex flex-col justify-between gap-4 border-b border-stone-100 pb-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Your Devices & Active Sessions</h2>
            <p className="text-xs text-slate-500">
              Manage where your admin account is currently signed in and revoke unfamiliar devices immediately.
            </p>
          </div>
          {otherActiveCount > 0 && (
            <button
              type="button"
              onClick={handleRevokeAllOthers}
              disabled={busyId === 'revoke-all'}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
            >
              {busyId === 'revoke-all' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
              Sign out all other devices ({otherActiveCount})
            </button>
          )}
        </div>

        <div className="mt-4 divide-y divide-stone-100">
          {activeSessions.map((session) => {
            const isCurrent = session.id === overview?.currentSessionId;
            return (
              <div key={session.id} className="flex flex-col justify-between gap-4 py-4 sm:flex-row sm:items-center">
                <div className="flex items-start gap-3.5">
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${isCurrent ? 'bg-brand-50 text-brand-700' : 'bg-stone-100 text-slate-700'}`}>
                    <DeviceIcon type={session.device_type} />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-slate-900">{session.device_name}</p>
                      {isCurrent && (
                        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                          This device
                        </span>
                      )}
                      {session.is_trusted && (
                        <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-bold text-brand-700">
                          Trusted
                        </span>
                      )}
                      {session.signature_verified && (
                        <span
                          className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-700"
                          title="Cryptographically signed HMAC-SHA256 device session"
                        >
                          <ShieldCheck className="h-3 w-3 text-emerald-600" />
                          SIG:{session.signature_fingerprint || 'VERIFIED'}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {session.geo_label || 'Unknown location'}
                      </span>
                      <span>IP: {session.ip_address}</span>
                      <span>{formatRelativeTime(session.last_active_at)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    disabled={busyId === session.id}
                    onClick={() => handleTrustToggle(session)}
                    className="rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-stone-50"
                  >
                    {session.is_trusted ? 'Untrust' : 'Trust device'}
                  </button>
                  {!isCurrent && (
                    <button
                      type="button"
                      disabled={busyId === session.id}
                      onClick={() => handleRevokeSession(session)}
                      className="rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-100"
                    >
                      Sign out
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {revokedSessions.length > 0 && (
          <div className="mt-4 border-t border-stone-100 pt-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Recently Signed Out Devices</p>
            <div className="mt-2 space-y-2">
              {revokedSessions.slice(0, 5).map((s) => (
                <div key={s.id} className="flex items-center justify-between text-xs text-slate-500">
                  <span>{s.device_name} • {s.geo_label} ({s.ip_address})</span>
                  <span>Revoked {s.revoked_at ? formatRelativeTime(s.revoked_at) : ''}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Two-Factor Authentication + Password Management */}
      <div className="grid gap-3 lg:grid-cols-2 lg:gap-6">
        <section className="admin-card">
          <h2 className="text-lg font-extrabold text-slate-900">Two-Factor Authentication (2FA)</h2>
          <p className="mt-1 text-xs text-slate-500">
            Protect your account with a 6-digit authenticator app code (Google Authenticator, Authy, 1Password).
          </p>

          {verifiedFactors.length > 0 && (
            <div className="mt-4 space-y-2">
              {verifiedFactors.map((factor) => (
                <div key={factor.id} className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3">
                  <div>
                    <p className="text-sm font-bold text-emerald-900">{factor.friendly_name || 'Authenticator App'}</p>
                    <p className="text-xs text-emerald-700">Active TOTP verification</p>
                  </div>
                  <button
                    type="button"
                    disabled={busyId === factor.id}
                    onClick={() => handleRemoveMfa(factor.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          {enrollData ? (
            <form onSubmit={handleVerifyMfa} className="mt-4 space-y-4 rounded-xl border border-stone-200 bg-stone-50 p-4">
              <p className="text-xs font-bold text-slate-800">
                1. Scan this QR code in your authenticator app:
              </p>
              <div className="flex justify-center rounded-xl bg-white p-3">
                <img src={enrollData.qrCode} alt="2FA QR Code" className="h-40 w-40" />
              </div>
              <p className="break-all rounded-lg bg-white px-3 py-2 font-mono text-[11px] text-slate-600">
                Secret key: {enrollData.secret}
              </p>
              <label className="admin-label">
                <span>2. Enter 6-digit code to activate</span>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  maxLength={6}
                  pattern="[0-9]{6}"
                  placeholder="123456"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  className="admin-input font-mono tracking-widest"
                />
              </label>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={enrolling}
                  className="rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white hover:bg-brand-700"
                >
                  {enrolling ? 'Verifying…' : 'Verify & Enable'}
                </button>
                <button
                  type="button"
                  onClick={() => setEnrollData(null)}
                  className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : verifiedFactors.length === 0 ? (
            <button
              type="button"
              disabled={enrolling}
              onClick={handleStartMfa}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-brand-700"
            >
              {enrolling ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              Set up Authenticator App (2FA)
            </button>
          ) : null}
        </section>

        <section className="admin-card">
          <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900">
            <KeyRound className="h-5 w-5 text-brand-700" />
            Change Password
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Use at least 10 characters with a mix of letters, numbers, and symbols.
          </p>

          <form onSubmit={handlePasswordUpdate} className="mt-4 space-y-3">
            <label className="admin-label">
              <span>New Password</span>
              <input
                type="password"
                required
                minLength={10}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="admin-input"
              />
            </label>
            <label className="admin-label">
              <span>Confirm New Password</span>
              <input
                type="password"
                required
                minLength={10}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="admin-input"
              />
            </label>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <input
                type="checkbox"
                checked={signOutOthersOnPwd}
                onChange={(e) => setSignOutOthersOnPwd(e.target.checked)}
                className="h-4 w-4 rounded accent-brand-600"
              />
              <span>Sign out all other devices after changing password</span>
            </label>
            <button
              type="submit"
              disabled={savingPwd || newPassword.length < 10 || newPassword !== confirmPassword}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {savingPwd ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </section>
      </div>

      {/* Security Event Activity Timeline */}
      <section className="admin-card">
        <h2 className="text-lg font-extrabold text-slate-900">Recent Security Activity</h2>
        <div className="mt-4 divide-y divide-stone-100">
          {(overview?.events || []).length === 0 ? (
            <p className="py-4 text-xs text-slate-500">No security events recorded yet.</p>
          ) : (
            overview!.events.map((ev) => (
              <div key={ev.id} className="flex flex-col justify-between gap-2 py-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      ev.severity === 'warning' || ev.severity === 'critical'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {ev.severity === 'warning' || ev.severity === 'critical' ? (
                      <AlertTriangle className="h-4 w-4" />
                    ) : (
                      <ShieldCheck className="h-4 w-4" />
                    )}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{formatEventLabel(ev.event_type)}</p>
                    <p className="text-xs text-slate-500">
                      {ev.device_name || 'Unknown device'} • {ev.geo_label || 'Unknown location'} ({ev.ip_address || '—'})
                    </p>
                  </div>
                </div>
                <span className="text-xs text-slate-400">{formatRelativeTime(ev.created_at)}</span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
