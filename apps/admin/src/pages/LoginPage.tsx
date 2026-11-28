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
      setError(err instanceof Error ? err.message : tr('Unable to sign in.', 'உள்ள நுழைய முடியலைங்க.'));
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
      setError(err instanceof Error ? err.message : tr('Invalid 2FA verification code.', '2FA கோடு தப்பா இருக்குங்க.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F6F7F9] p-4 dark:bg-[#0F1117]">
      <div className="w-full max-w-md rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm dark:border-[#262A34] dark:bg-[#161920] sm:p-8">
        <div className="mb-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? tr('Switch to light mode', 'லைட் மோட்') : tr('Switch to dark mode', 'டார்க் மோட்')}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-700 dark:border-[#2C313D] dark:bg-[#1C2029] dark:text-amber-300"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 p-0.5 dark:border-[#2C313D] dark:bg-[#1C2029]">
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                lang === 'en' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              En
            </button>
            <button
              type="button"
              onClick={() => setLang('ta')}
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                lang === 'ta' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              த
            </button>
          </div>
        </div>

        <div className="text-center">
          <img
            src={theme === 'dark' ? '/logos/logo-white.webp' : '/logos/logo.webp'}
            alt="Ilangathir Trust"
            className="mx-auto h-12 w-auto object-contain"
          />
          <span className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-700">
            <Lock className="h-3 w-3" />
            {tr('Authorized Access Only', 'அனுமதி உள்ளவங்க மட்டும்')}
          </span>
          <h1 className="mt-3 text-xl font-extrabold text-slate-900">
            {tr('Admin Ilangathir Trust', 'இளங்கதிர் அட்மின் பக்கம்')}
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            {mfaStep
              ? tr('Enter your 6-digit authenticator code', 'ஆதென்டிகேட்டர் ஆப்பில் உள்ள 6 நம்பரை போடுங்க')
              : tr('Protected by 2FA, Device Signatures & RBAC', '2FA, டிவைஸ் சிக்னேச்சர் & ரோல் பாதுகாப்பு')}
          </p>
        </div>

        {!isSupabaseConfigured() && (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs font-medium text-amber-900">
            {tr(
              'Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable sign-in.',
              'உள்ள நுழைய சுப்பபேஸ் அமைப்புகள் தேவைப்படுதுங்க.'
            )}
          </div>
        )}

        {mfaStep ? (
          <form onSubmit={handleMfaSubmit} className="mt-6 space-y-4">
            <label className="admin-label">
              <span>{tr('Authenticator Code', 'ஆதென்டிகேட்டர் கோடு')}</span>
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
                      {tr('Retry access check', 'மறுபடியும் செக் பண்ணு')}
                    </button>
                    {onSignOut && (
                      <button
                        type="button"
                        onClick={() => onSignOut()}
                        className="rounded-lg px-2 py-1 text-[11px] font-bold text-red-800 underline hover:no-underline"
                      >
                        {tr('Sign out & switch account', 'வெளியேறி வேற அக்கவுண்ட் போடு')}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="admin-btn-primary w-full py-2.5 text-sm"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              <span>{loading ? tr('Verifying…', 'சரிபார்க்குது…') : tr('Verify & Continue', 'சரிபார்த்து உள்ள போ')}</span>
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
              {tr('Use a different account', 'வேற ஈமெயில் வச்சு உள்ள போ')}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="admin-label">
              <span>{tr('Account Email', 'ஈமெயில் அட்ரஸ்')}</span>
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
              <span>{tr('Password', 'பாஸ்வேர்டு')}</span>
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
                  aria-label={tr('Toggle password visibility', 'பாஸ்வேர்டு காட்டு')}
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
                      {tr('Retry access check', 'மறுபடியும் செக் பண்ணு')}
                    </button>
                    {onSignOut && (
                      <button
                        type="button"
                        onClick={() => onSignOut()}
                        className="rounded-lg px-2 py-1 text-[11px] font-bold text-red-800 underline hover:no-underline"
                      >
                        {tr('Sign out & switch account', 'வெளியேறி வேற அக்கவுண்ட் போடு')}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="admin-btn-primary w-full py-3 text-sm"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{loading ? tr('Signing in…', 'உள்ள போகுது…') : tr('Sign in securely', 'பாதுகாப்பா உள்ள போ')}</span>
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <a href={PUBLIC_SITE_URL} className="text-xs font-semibold text-slate-500 hover:text-blue-600">
            {tr('← Return to public website', '← வெப்சைட்டுக்கு திரும்பிப் போ')}
          </a>
        </div>
      </div>
    </div>
  );
}
