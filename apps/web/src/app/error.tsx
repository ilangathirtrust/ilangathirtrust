'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, Home, RotateCcw } from 'lucide-react';

export default function RouteError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Web Route Error]', error);
  }, [error]);

  return (
    <section className="container-max flex min-h-[60vh] items-center justify-center py-16">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h1 className="mt-5 font-heading text-2xl font-extrabold text-slate-900">
          We ran into a temporary issue
        </h1>
        <p className="mt-2.5 text-sm leading-relaxed text-slate-600">
          This page could not be loaded cleanly right now. Please try refreshing or return to the homepage.
        </p>
        <p className="mt-1 text-xs font-medium text-slate-500">
          இந்தப் பக்கத்தைத் திறப்பதில் தற்காலிகப் பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700"
          >
            <RotateCcw className="h-4 w-4" />
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-stone-100"
          >
            <Home className="h-4 w-4" />
            Return Home
          </Link>
        </div>
      </div>
    </section>
  );
}
