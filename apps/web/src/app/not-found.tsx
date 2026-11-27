'use client';

import Link from 'next/link';
import { ArrowRight, Compass, Home } from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';

export default function NotFoundPage() {
  const { lang } = useLanguage();

  return (
    <section className="container-max flex min-h-[60vh] items-center justify-center py-12 sm:py-16">
      <div className="w-full max-w-2xl rounded-3xl border border-sand-200 bg-white p-6 text-center shadow-xs sm:p-12">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-saffron-50 text-saffron-600">
          <Compass className="h-7 w-7" />
        </div>
        <p className="mt-4 text-xs font-extrabold uppercase tracking-widest text-saffron-600">
          {lang === 'ta' ? '404 — பக்கம் கிடைக்கவில்லை' : '404 — Page Not Found'}
        </p>
        <h1 className="mt-2 font-heading text-2xl font-extrabold text-brand-900 sm:text-3xl">
          {lang === 'ta' ? 'நீங்கள் தேடும் பக்கம் இல்லை' : 'We could not find that page'}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          {lang === 'ta'
            ? 'இந்தப் பக்கம் மாற்றப்பட்டிருக்கலாம் அல்லது தற்போது பயன்பாட்டில் இல்லாமல் இருக்கலாம். முகப்புப் பக்கத்திற்கோ அல்லது எங்கள் பணிகள் பக்கத்திற்கோ செல்லலாம்.'
            : 'The page you are looking for may have moved or is currently unavailable. Explore our programmes or return home.'}
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-800"
          >
            <Home className="h-4 w-4" />
            <span>{lang === 'ta' ? 'முகப்புக்குச் செல்ல' : 'Back to Home'}</span>
          </Link>
          <Link
            href="/activities"
            className="inline-flex items-center gap-2 rounded-xl border border-sand-200 bg-sand-50 px-5 py-2.5 text-sm font-bold text-brand-900 transition hover:bg-sand-100"
          >
            <span>{lang === 'ta' ? 'பணிகளைப் பார்க்க' : 'Explore Activities'}</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
