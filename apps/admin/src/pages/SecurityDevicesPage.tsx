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
import { useAdminUi } from '../lib/admin-ui';
import { SecuritySkeleton } from '../components/PageSkeletons';

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

export function SecurityDevicesPage({
  onNotify
}: {
  onNotify: (msg: string, isErr?: boolean) => void;
}) {
  const { lang, tr } = useAdminUi();
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

  function formatEventLabel(eventType: string): string {
    const labelsEn: Record<string, string> = {
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
    const labelsTa: Record<string, string> = {
      login_success: 'லாகின் ஆச்சு',
      new_device_detected: 'புது டிவைஸ்ல லாகின் ஆயிருக்கு',
      session_revoked: 'மத்த டிவைஸ் லாக் அவுட் பண்ணியாச்சு',
      revoke_all_other_sessions: 'மத்த எல்லா டிவைஸையும் லாக் அவுட் பண்ணியாச்சு',
      device_trusted: 'நம்பகமான டிவைஸா சேர்த்தாச்சு',
      device_untrusted: 'நம்பகமான பட்டியல்ல இருந்து நீக்கியாச்சு',
      mfa_enrolled: '2FA பாதுகாப்பு ஆன் பண்ணியாச்சு',
      mfa_removed: '2FA பாதுகாப்பு நீக்கியாச்சு',
      password_changed: 'பாஸ்வேர்டு மாத்தியாச்சு'
    };
    const dict = lang === 'ta' ? labelsTa : labelsEn;
    return dict[eventType] || eventType.replace(/_/g, ' ');
  }

  function formatRelativeTime(iso: string): string {
    const diffSec = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
    if (diffSec < 60) return tr('Active now', 'இப்போ ஆக்டிவ்');
    const mins = Math.floor(diffSec / 60);
    if (mins < 60) return lang === 'ta' ? `${mins} நிமிஷம் முன்ன` : `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return lang === 'ta' ? `${hrs} மணி நேரம் முன்ன` : `${hrs}h ago`;
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

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
      onNotify(
        err instanceof Error ? err.message : tr('Unable to load security overview.', 'செக்யூரிட்டி விவரம் லோடு ஆகலைங்க.'),
        true
      );
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
      onNotify(
        session.is_trusted
          ? tr('Trusted status removed.', 'நம்பகமான டிவைஸ் பட்டியல்ல இருந்து நீக்கியாச்சு.')
          : tr('Device marked as trusted.', 'நம்பகமான டிவைஸா சேர்த்தாச்சு.')
      );
      await loadSecurityData();
    } catch (err) {
      onNotify(err instanceof Error ? err.message : tr('Failed to update device trust.', 'மாத்த முடியலைங்க.'), true);
    } finally {
      setBusyId(null);
    }
  }

  async function handleRevokeSession(session: DeviceSession) {
    setBusyId(session.id);
    try {
      await adminApi(`/security/sessions/${session.id}`, { method: 'DELETE' });
      onNotify(tr(`Signed out "${session.device_name}".`, `"${session.device_name}" லாக் அவுட் ஆச்சுங்க.`));
      await loadSecurityData();
    } catch (err) {
      onNotify(err instanceof Error ? err.message : tr('Failed to sign out device.', 'லாக் அவுட் ஆகலைங்க.'), true);
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
      onNotify(tr('All other devices have been signed out.', 'மத்த எல்லா டிவைஸும் லாக் அவுட் ஆச்சுங்க.'));
      await loadSecurityData();
    } catch (err) {
      onNotify(err instanceof Error ? err.message : tr('Failed to sign out other devices.', 'மத்த டிவைஸை நிறுத்த முடியலைங்க.'), true);
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
      onNotify(err instanceof Error ? err.message : tr('Failed to start 2FA setup.', '2FA தொடங்க முடியலைங்க.'), true);
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
      onNotify(tr('Two-factor authentication is now enabled on your account.', 'உங்க அக்கவுண்டுக்கு 2FA பாதுகாப்பு ஆன் ஆயிடுச்சுங்க.'));
      await loadSecurityData();
    } catch (err) {
      onNotify(err instanceof Error ? err.message : tr('Invalid verification code.', '2FA கோடு தப்பா இருக்குங்க.'), true);
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
      onNotify(tr('Authenticator 2FA removed.', '2FA நீக்கியாச்சுங்க.'));
      await loadSecurityData();
    } catch (err) {
      onNotify(err instanceof Error ? err.message : tr('Unable to remove 2FA factor.', '2FA நீக்க முடியலைங்க.'), true);
    } finally {
      setBusyId(null);
    }
  }

  async function handlePasswordUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 10) {
      onNotify(tr('Choose a strong password of at least 10 characters.', 'குறைஞ்சது 10 எழுத்து உள்ள ஸ்ட்ராங் பாஸ்வேர்டு போடுங்க.'), true);
      return;
    }
    if (newPassword !== confirmPassword) {
      onNotify(tr('Passwords do not match.', 'ரெண்டு பாஸ்வேர்டும் ஒன்னா இல்லீங்க.'), true);
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
      onNotify(tr('Password updated successfully.', 'புது பாஸ்வேர்டு சேவ் ஆயிடுச்சுங்க.'));
      await loadSecurityData();
    } catch (err) {
      onNotify(err instanceof Error ? err.message : tr('Unable to update password.', 'பாஸ்வேர்டு மாத்த முடியலைங்க.'), true);
    } finally {
      setSavingPwd(false);
    }
  }

  if (loading && !overview) {
    return <SecuritySkeleton />;
  }

  const verifiedFactors = factors.filter((f) => f.status === 'verified');
  const activeSessions = (overview?.sessions || []).filter((s) => !s.is_revoked);
  const revokedSessions = (overview?.sessions || []).filter((s) => s.is_revoked);
  const otherActiveCount = activeSessions.filter((s) => s.id !== overview?.currentSessionId).length;

  return (
    <div className="space-y-4">
      {overview?.migrationRequired && (
        <div className="admin-card border-amber-200 bg-amber-50 text-xs font-medium text-amber-900">
          {tr(
            'Run supabase/migrations/v011_sessions_and_security.sql in Supabase SQL Editor to enable full cross-device session history.',
            'எல்லா டிவைஸ் விவரமும் பார்க்க சுப்பபேஸ் SQL எடிட்டர்ல மைக்ரேஷன் ரன் பண்ணுங்க.'
          )}
        </div>
      )}

      {/* Security Checkup Summary */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="admin-card p-4">
          <div className="flex items-center gap-3">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${verifiedFactors.length ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
              {verifiedFactors.length ? <ShieldCheck className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{tr('Two-Factor Auth', '2FA பாதுகாப்பு')}</p>
              <p className="truncate text-sm font-extrabold text-slate-900 sm:text-base">
                {verifiedFactors.length ? tr('Enabled (Authenticator)', 'ஆன்-ல இருக்கு') : tr('Not Enabled', 'ஆன் பண்ணல')}
              </p>
            </div>
          </div>
        </div>

        <div className="admin-card p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
              <Laptop className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{tr('Active Sessions', 'ஆக்டிவ் டிவைஸ்கள்')}</p>
              <p className="text-sm font-extrabold text-slate-900 sm:text-base">
                {activeSessions.length} {tr('active device(s)', 'டிவைஸ்')}
              </p>
            </div>
          </div>
        </div>

        <div className="admin-card p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{tr('Trusted Devices', 'நம்பகமான டிவைஸ்')}</p>
              <p className="text-sm font-extrabold text-slate-900 sm:text-base">
                {activeSessions.filter((s) => s.is_trusted).length} {tr('trusted', 'நம்பகமானது')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Sessions + Digital Signature Verification */}
      <section className="admin-card">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 sm:text-lg">
              {tr('Your Devices & Active Sessions', 'உங்க டிவைஸ்கள் & ஆக்டிவ் செஷன்')}
            </h2>
            <p className="text-xs text-slate-500">
              {tr(
                'Manage where your admin account is signed in and revoke unfamiliar devices immediately.',
                'எங்கெல்லாம் லாகின் பண்ணியிருக்கீங்கனு பாருங்க, தெரியாத டிவைஸ் இருந்தா உடனே நிறுத்துங்க.'
              )}
            </p>
          </div>
          {otherActiveCount > 0 && (
            <button
              type="button"
              onClick={handleRevokeAllOthers}
              disabled={busyId === 'revoke-all'}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
            >
              {busyId === 'revoke-all' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
              <span>{tr(`Sign out all other (${otherActiveCount})`, `மத்த எல்லாத்தையும் நிறுத்து (${otherActiveCount})`)}</span>
            </button>
          )}
        </div>

        <div className="mt-3 divide-y divide-slate-100">
          {activeSessions.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-500">
              {tr('No active device sessions found.', 'இப்போதைக்கு எந்த செஷனும் இல்லீங்க.')}
            </p>
          ) : (
            activeSessions.map((session) => {
              const isCurrent = session.id === overview?.currentSessionId;
              return (
                <div key={session.id} className="flex flex-col justify-between gap-3 py-3.5 sm:flex-row sm:items-center">
                  <div className="flex items-start gap-3">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isCurrent ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-slate-700'}`}>
                      <DeviceIcon type={session.device_type} />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="text-sm font-bold text-slate-900">{session.device_name}</p>
                        {isCurrent && (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                            {tr('This device', 'இந்த டிவைஸ்')}
                          </span>
                        )}
                        {session.is_trusted && (
                          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700">
                            {tr('Trusted', 'நம்பகமானது')}
                          </span>
                        )}
                        {session.signature_verified && (
                          <span
                            className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-700"
                            title={tr('Cryptographically signed HMAC-SHA256 device session', 'டிஜிட்டல் சிக்னேச்சர் சரிபார்க்கப்பட்டது')}
                          >
                            <ShieldCheck className="h-3 w-3 text-emerald-600" />
                            SIG:{session.signature_fingerprint || 'VERIFIED'}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {session.geo_label || tr('Unknown location', 'தெரியாத இடம்')}
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
                      className="admin-btn-secondary py-1.5 px-3"
                    >
                      {session.is_trusted ? tr('Untrust', 'நம்பிக்கை நீக்கு') : tr('Trust device', 'நம்பகமானதாக்கு')}
                    </button>
                    {!isCurrent && (
                      <button
                        type="button"
                        disabled={busyId === session.id}
                        onClick={() => handleRevokeSession(session)}
                        className="rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-100"
                      >
                        {tr('Sign out', 'வெளியேற்று')}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {revokedSessions.length > 0 && (
          <div className="mt-4 border-t border-slate-100 pt-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {tr('Recently Signed Out Devices', 'சமீபத்துல வெளியேற்றிய டிவைஸ்கள்')}
            </p>
            <div className="mt-2 space-y-1.5">
              {revokedSessions.slice(0, 5).map((s) => (
                <div key={s.id} className="flex items-center justify-between text-xs text-slate-500">
                  <span className="truncate">{s.device_name} • {s.geo_label} ({s.ip_address})</span>
                  <span className="shrink-0">{s.revoked_at ? formatRelativeTime(s.revoked_at) : ''}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Two-Factor Authentication + Password Management */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="admin-card">
          <h2 className="text-base font-extrabold text-slate-900 sm:text-lg">
            {tr('Two-Factor Authentication (2FA)', 'இரட்டைப் பாதுகாப்பு (2FA)')}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {tr(
              'Protect your account with a 6-digit authenticator app code.',
              'கூகுள் ஆதென்டிகேட்டர் ஆப் மூலமா 6 நம்பர் கோடு பாதுகாப்பு போடுங்க.'
            )}
          </p>

          {verifiedFactors.length > 0 && (
            <div className="mt-4 space-y-2">
              {verifiedFactors.map((factor) => (
                <div key={factor.id} className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3">
                  <div>
                    <p className="text-sm font-bold text-emerald-900">{factor.friendly_name || tr('Authenticator App', 'ஆதென்டிகேட்டர் ஆப்')}</p>
                    <p className="text-xs text-emerald-700">{tr('Active verification', 'ஆக்டிவ்ல இருக்கு')}</p>
                  </div>
                  <button
                    type="button"
                    disabled={busyId === factor.id}
                    onClick={() => handleRemoveMfa(factor.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>{tr('Remove', 'நீக்கு')}</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {enrollData ? (
            <form onSubmit={handleVerifyMfa} className="admin-subcard mt-4 space-y-3">
              <p className="text-xs font-bold text-slate-800">
                {tr('1. Scan this QR code in your authenticator app:', '1. இந்த QR கோடை ஆப்ல ஸ்கேன் பண்ணுங்க:')}
              </p>
              <div className="flex justify-center rounded-xl bg-white p-3">
                <img src={enrollData.qrCode} alt="2FA QR Code" className="h-36 w-36" />
              </div>
              <p className="break-all rounded-lg bg-white px-3 py-2 font-mono text-[11px] text-slate-600">
                {tr('Secret key:', 'சீக்ரெட் கீ:')} {enrollData.secret}
              </p>
              <label className="admin-label">
                <span>{tr('2. Enter 6-digit code to activate', '2. 6 நம்பர் கோடை போட்டு ஆன் பண்ணுங்க')}</span>
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
                <button type="submit" disabled={enrolling} className="admin-btn-primary">
                  {enrolling ? tr('Verifying…', 'சரிபார்க்குது…') : tr('Verify & Enable', 'ஆன் பண்ணு')}
                </button>
                <button type="button" onClick={() => setEnrollData(null)} className="admin-btn-secondary">
                  {tr('Cancel', 'வேண்டாம்')}
                </button>
              </div>
            </form>
          ) : verifiedFactors.length === 0 ? (
            <button
              type="button"
              disabled={enrolling}
              onClick={handleStartMfa}
              className="admin-btn-primary mt-4 py-2.5"
            >
              {enrolling ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              <span>{tr('Set up Authenticator App (2FA)', '2FA பாதுகாப்பு செட் பண்ணு')}</span>
            </button>
          ) : null}
        </section>

        <section className="admin-card">
          <h2 className="flex items-center gap-2 text-base font-extrabold text-slate-900 sm:text-lg">
            <KeyRound className="h-5 w-5 text-blue-600" />
            <span>{tr('Change Password', 'பாஸ்வேர்டு மாத்து')}</span>
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {tr(
              'Use at least 10 characters with letters, numbers, and symbols.',
              'குறைஞ்சது 10 எழுத்துல நம்பர், சிம்பல் கலந்து புது பாஸ்வேர்டு போடுங்க.'
            )}
          </p>

          <form onSubmit={handlePasswordUpdate} className="mt-4 space-y-3">
            <label className="admin-label">
              <span>{tr('New Password', 'புது பாஸ்வேர்டு')}</span>
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
              <span>{tr('Confirm New Password', 'மறுபடியும் போடுங்க')}</span>
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
                className="h-4 w-4 rounded accent-blue-600"
              />
              <span>{tr('Sign out all other devices after changing password', 'பாஸ்வேர்டு மாத்துனதும் மத்த டிவைஸ் எல்லாம் லாக் அவுட் பண்ணு')}</span>
            </label>
            <button
              type="submit"
              disabled={savingPwd || newPassword.length < 10 || newPassword !== confirmPassword}
              className="admin-btn-primary py-2.5"
            >
              {savingPwd ? tr('Updating…', 'சேவ் ஆகுது…') : tr('Update Password', 'பாஸ்வேர்டு மாத்து')}
            </button>
          </form>
        </section>
      </div>

      {/* Security Event Activity Timeline */}
      <section className="admin-card">
        <h2 className="text-base font-extrabold text-slate-900 sm:text-lg">
          {tr('Recent Security Activity', 'சமீபத்திய செக்யூரிட்டி நிகழ்வுகள்')}
        </h2>
        <div className="mt-3 divide-y divide-slate-100">
          {(overview?.events || []).length === 0 ? (
            <p className="py-5 text-center text-xs text-slate-500">
              {tr('No security events recorded yet.', 'இன்னும் எந்த செக்யூரிட்டி பதிவும் இல்லீங்க.')}
            </p>
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
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800">{formatEventLabel(ev.event_type)}</p>
                    <p className="truncate text-xs text-slate-500">
                      {ev.device_name || tr('Unknown device', 'தெரியாத டிவைஸ்')} • {ev.geo_label || tr('Unknown location', 'தெரியாத இடம்')} ({ev.ip_address || '—'})
                    </p>
                  </div>
                </div>
                <span className="shrink-0 text-xs text-slate-400">{formatRelativeTime(ev.created_at)}</span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
