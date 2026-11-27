import { useState } from 'react';
import { AlertCircle, Eye, EyeOff, Loader2, Lock, ShieldCheck } from 'lucide-react';
import { getSupabaseClient, isSupabaseConfigured, PUBLIC_SITE_URL } from '../lib/supabase';

export function LoginPage({
  onSuccess,
  onSignOut,
  externalError
}: {
  onSuccess: () => Promise<void> | void;
  onSignOut?: () => Promise<void> | void;
  externalError?: string;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Two-Factor (MFA TOTP) step state
  const [mfaStep, setMfaStep] = useState<{ factorId: string } | null>(null);
  const [mfaCode, setMfaCode] = useState('');

  const displayError = error || externalError || '';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const supabase = getSupabaseClient();
      const { error: authErr } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      });
      if (authErr) throw authErr;

      // Enforce Authenticator 2FA when enrolled on this admin account
      const aal = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal.data?.currentLevel === 'aal1' && aal.data?.nextLevel === 'aal2') {
        const factorsRes = await supabase.auth.mfa.listFactors();
        const verifiedTotp = (factorsRes.data?.totp || []).find((f) => f.status === 'verified');
        if (verifiedTotp) {
          setMfaStep({ factorId: verifiedTotp.id });
          return;
        }
      }

      await onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  }

  async function handleMfaSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!mfaStep) return;
    setError('');
    setLoading(true);
    try {
      const supabase = getSupabaseClient();
      const { error: mfaErr } = await supabase.auth.mfa.challengeAndVerify({
        factorId: mfaStep.factorId,
        code: mfaCode.trim()
      });
      if (mfaErr) throw mfaErr;
      await onSuccess();
      setMfaStep(null);
      setMfaCode('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid 2FA verification code.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
        <div className="text-center">
          <img
            src="/ilangathir-logo.jpg"
            alt="Ilangathir Trust"
            className="mx-auto h-16 w-16 rounded-full border border-slate-200 object-cover"
          />
          <span className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-brand-700">
            <Lock className="h-3 w-3" />
            admin.ilangathirtrust.com
          </span>
          <h1 className="mt-3 text-2xl font-extrabold text-slate-900">Trust Admin Console</h1>
          <p className="mt-1 text-sm text-slate-500">
            {mfaStep ? 'Enter your 6-digit authenticator code' : 'Protected by Supabase Authentication, 2FA & RBAC'}
          </p>
        </div>

        {!isSupabaseConfigured() && (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs font-medium text-amber-900">
            Configure <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to enable admin sign-in.
          </div>
        )}

        {mfaStep ? (
          <form onSubmit={handleMfaSubmit} className="mt-6 space-y-4">
            <label className="admin-label">
              <span>Authenticator Code</span>
              <input
                type="text"
                inputMode="numeric"
                required
                autoFocus
                maxLength={6}
                pattern="[0-9]{6}"
                placeholder="123456"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                className="admin-input text-center font-mono text-lg tracking-[0.4em]"
              />
            </label>

            {displayError && (
              <div className="space-y-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{displayError}</span>
                </div>
                {externalError && (
                  <div className="flex flex-wrap gap-2 pl-6 pt-1">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={async () => {
                        setLoading(true);
                        try {
                          await onSuccess();
                        } finally {
                          setLoading(false);
                        }
                      }}
                      className="rounded-lg bg-white px-2.5 py-1 text-[11px] font-bold text-slate-800 ring-1 ring-red-200 hover:bg-red-100/50"
                    >
                      Retry access check
                    </button>
                    {onSignOut && (
                      <button
                        type="button"
                        onClick={() => onSignOut()}
                        className="rounded-lg px-2 py-1 text-[11px] font-bold text-red-800 underline hover:no-underline"
                      >
                        Sign out &amp; switch account
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-700 disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              <span>{loading ? 'Verifying…' : 'Verify & Continue'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMfaStep(null);
                setMfaCode('');
                setError('');
              }}
              className="w-full text-center text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Use a different account
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="admin-label">
              <span>Admin Email</span>
              <input
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ilangathirtrust@gmail.com"
                className="admin-input"
              />
            </label>

            <label className="admin-label">
              <span>Password</span>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="admin-input pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  aria-label="Toggle password visibility"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>

            {displayError && (
              <div className="space-y-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{displayError}</span>
                </div>
                {externalError && (
                  <div className="flex flex-wrap gap-2 pl-6 pt-1">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={async () => {
                        setLoading(true);
                        try {
                          await onSuccess();
                        } finally {
                          setLoading(false);
                        }
                      }}
                      className="rounded-lg bg-white px-2.5 py-1 text-[11px] font-bold text-slate-800 ring-1 ring-red-200 hover:bg-red-100/50"
                    >
                      Retry access check
                    </button>
                    {onSignOut && (
                      <button
                        type="button"
                        onClick={() => onSignOut()}
                        className="rounded-lg px-2 py-1 text-[11px] font-bold text-red-800 underline hover:no-underline"
                      >
                        Sign out &amp; switch account
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-700 disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{loading ? 'Signing in…' : 'Sign in securely'}</span>
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <a href={PUBLIC_SITE_URL} className="text-xs font-semibold text-slate-500 hover:text-brand-700">
            ← Return to public website
          </a>
        </div>
      </div>
    </div>
  );
}
