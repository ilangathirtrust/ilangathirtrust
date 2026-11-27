'use client';

import Link from 'next/link';
import { ArrowRight, Compass, Home } from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';

export default function NotFoundPage() {
  const { lang } = useLanguage();

  return (
    <section className="container-max flex min-h-[60vh] items-center justify-center py-16">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
          <Compass className="h-7 w-7" />
        </div>
        <p className="mt-4 text-xs font-extrabold uppercase tracking-widest text-brand-700">
          {lang === 'ta' ? '404 — பக்கம் கிடைக்கவில்லை' : '404 — Page Not Found'}
        </p>
        <h1 className="mt-2 font-heading text-3xl font-extrabold text-slate-900">
          {lang === 'ta' ? 'நீங்கள் தேடும் பக்கம் இல்லை' : 'We could not find that page'}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          {lang === 'ta'
            ? 'இந்தப் பக்கம் மாற்றப்பட்டிருக்கலாம் அல்லது நீக்கப்பட்டிருக்கலாம். முகப்புப் பக்கத்திற்கோ அல்லது எங்கள் பணிகள் பக்கத்திற்கோ செல்லலாம்.'
            : 'The page you are looking for may have moved or been updated. Explore our initiatives, events, or return home.'}
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700"
          >
            <Home className="h-4 w-4" />
            <span>{lang === 'ta' ? 'முகப்புக்குச் செல்ல' : 'Back to Home'}</span>
          </Link>
          <Link
            href="/activities"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
          >
            <span>{lang === 'ta' ? 'பணிகளைப் பார்க்க' : 'Explore Activities'}</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
