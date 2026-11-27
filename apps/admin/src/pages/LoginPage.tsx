import { useState } from 'react';
import { AlertCircle, Eye, EyeOff, Loader2, Lock } from 'lucide-react';
import { getSupabaseClient, isSupabaseConfigured, PUBLIC_SITE_URL } from '../lib/supabase';

export function LoginPage({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-950 via-brand-900 to-brand-700 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
        <div className="text-center">
          <img
            src="/ilangathir-logo.jpg"
            alt="Ilangathir Trust"
            className="mx-auto h-16 w-16 rounded-full border-2 border-brand-100 object-cover shadow"
          />
          <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-brand-700">
            <Lock className="h-3 w-3" />
            admin.ilangathirtrust.com
          </span>
          <h1 className="mt-3 text-2xl font-extrabold text-slate-900">Admin Portal Sign In</h1>
          <p className="mt-1 text-sm text-slate-500">Protected by Supabase Authentication & RBAC</p>
        </div>

        {!isSupabaseConfigured() && (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs font-medium text-amber-900">
            Configure <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in <code>.env</code> to enable admin sign-in.
          </div>
        )}

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

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>{loading ? 'Verifying session…' : 'Sign in securely'}</span>
          </button>
        </form>

        <div className="mt-6 text-center">
          <a href={PUBLIC_SITE_URL} className="text-xs font-semibold text-slate-500 hover:text-brand-600">
            ← Return to public website
          </a>
        </div>
      </div>
    </div>
  );
}
