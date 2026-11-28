import { useState } from 'react';
import { AlertCircle, Eye, EyeOff, Loader2, Lock, Moon, ShieldCheck, Sun } from 'lucide-react';
import { getSupabaseClient, isSupabaseConfigured, PUBLIC_SITE_URL } from '../lib/supabase';
import { useAdminUi } from '../lib/admin-ui';

export function LoginPage({
  onSuccess,
  onSignOut,
  externalError
}: {
  onSuccess: () => Promise<void> | void;
  onSignOut?: () => Promise<void> | void;
  externalError?: string;
}) {
  const { lang, setLang, theme, toggleTheme, tr } = useAdminUi();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    <div className="flex min-h-screen items-center justify-center bg-sand-50 dark:bg-[#18191B] sm:p-6">
      <div className="w-full min-h-screen sm:min-h-0 max-w-md sm:rounded-3xl border-0 sm:border border-sand-200 dark:border-[#31343B] bg-white dark:bg-[#212225] p-6 sm:shadow-[0_14px_40px_rgba(11,24,46,0.06)] sm:p-9">
        <div className="mb-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-sand-200 bg-sand-100 text-slate-700 dark:border-[#363940] dark:bg-[#292B30] dark:text-amber-300"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <div className="inline-flex items-center rounded-full border border-sand-200 bg-sand-100 p-0.5 dark:border-[#363940] dark:bg-[#292B30]">
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                lang === 'en' ? 'bg-brand-900 text-white dark:bg-blue-600' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              En
            </button>
            <button
              type="button"
              onClick={() => setLang('ta')}
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                lang === 'ta' ? 'bg-brand-900 text-white dark:bg-blue-600' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              த
            </button>
          </div>
        </div>
        <div className="text-center">
          <img
            src="/logos/logo.webp"
            alt="Ilangathir Trust"
            className="mx-auto h-14 w-auto object-contain"
          />
          <span className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-saffron-500/20 bg-saffron-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-saffron-700">
            <Lock className="h-3 w-3" />
            {tr('Authorized Access Only', 'அனுமதி பெற்ற Admin மட்டும்')}
          </span>
          <h1 className="mt-3 text-xl font-extrabold text-brand-900 sm:text-2xl">
            {tr('Admin Ilangathir Trust', 'Ilangathir Admin பக்கம்')}
          </h1>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            {mfaStep
              ? tr('Enter your 6-digit authenticator code', '6-digit Authenticator Code போடுங்க')
              : tr('Protected by Supabase Authentication, 2FA & RBAC', 'Supabase Security, 2FA & RBAC பாதுகாப்பு')}
          </p>
        </div>

        {!isSupabaseConfigured() && (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs font-medium text-amber-900">
            Configure <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to enable sign-in.
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
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-800 disabled:opacity-60"
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
              <span>Account Email</span>
              <input
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@ilangathirtrust.org"
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
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-800 disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{loading ? 'Signing in…' : 'Sign in securely'}</span>
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <a href={PUBLIC_SITE_URL} className="text-xs font-semibold text-slate-500 hover:text-brand-800">
            ← Return to public website
          </a>
        </div>
      </div>
    </div>
  );
}
