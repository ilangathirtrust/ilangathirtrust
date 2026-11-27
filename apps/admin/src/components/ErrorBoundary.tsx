import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

/**
 * Catches unexpected rendering errors in the Admin Console so the user
 * sees a clear recovery screen instead of a blank page.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || 'An unexpected interface error occurred.'
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[Admin UI ErrorBoundary]', error, info.componentStack);
  }

  private handleReload = () => {
    this.setState({ hasError: false, message: '' });
    window.location.reload();
  };

  private handleResetSession = async () => {
    try {
      if (isSupabaseConfigured()) {
        await getSupabaseClient().auth.signOut();
      }
    } catch {
      // ignore storage cleanup issues
    }
    this.setState({ hasError: false, message: '' });
    window.location.href = '/';
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-white p-4">
        <div className="w-full max-w-lg rounded-3xl border border-red-200 bg-white p-8 text-center shadow-xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-xl font-extrabold text-slate-900">Something went wrong</h1>
          <p className="mt-2 text-sm text-slate-600">
            The admin console ran into an unexpected error while rendering this view. Your saved data is safe.
          </p>
          {this.state.message && (
            <div className="mt-4 rounded-xl border border-red-100 bg-red-50/80 px-4 py-2.5 text-left text-xs font-medium text-red-800">
              {this.state.message}
            </div>
          )}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={this.handleReload}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700"
            >
              <RotateCcw className="h-4 w-4" />
              Reload Console
            </button>
            <button
              type="button"
              onClick={this.handleResetSession}
              className="rounded-xl border border-stone-200 bg-stone-50 px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-stone-100"
            >
              Sign Out & Reset
            </button>
          </div>
        </div>
      </div>
    );
  }
}
