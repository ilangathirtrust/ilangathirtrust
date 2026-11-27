import Link from 'next/link';
import { ArrowRight, Compass, Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <section className="container-max flex min-h-[60vh] items-center justify-center py-16">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
          <Compass className="h-7 w-7" />
        </div>
        <p className="mt-4 text-xs font-extrabold uppercase tracking-widest text-brand-700">404 — Page Not Found</p>
        <h1 className="mt-2 font-heading text-3xl font-extrabold text-slate-900">
          We could not find that page
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          The page you are looking for may have moved or been updated. Explore our initiatives, events, or return home.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700"
          >
            <Home className="h-4 w-4" />
            Back to Home
          </Link>
          <Link
            href="/activities"
            className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-stone-100"
          >
            Explore Activities
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
