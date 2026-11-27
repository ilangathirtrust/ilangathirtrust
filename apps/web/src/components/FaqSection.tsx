'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { BilingualFaq } from '@ilangathir/shared';
import { useLanguage } from './LanguageProvider';
import { getUi } from '@/lib/i18n';

export function FaqSection({ faqs }: { faqs: BilingualFaq[] }) {
  const { lang } = useLanguage();
  const ui = getUi(lang);
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  if (!faqs || !faqs.length) return null;

  return (
    <section className="bg-slate-50 py-16 lg:py-20">
      <div className="container-max">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-brand-600">
            <span className="h-2 w-2 rounded-full bg-amberwarm-500" />
            {ui.faqEyebrow}
          </span>
          <h2 className="mt-2 font-heading text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {ui.faqTitle}
          </h2>
        </div>

        <div className="mx-auto mt-10 max-w-3xl space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            const q = lang === 'ta' && faq.question_ta ? faq.question_ta : faq.question_en;
            const a = lang === 'ta' && faq.answer_ta ? faq.answer_ta : faq.answer_en;
            return (
              <div
                key={idx}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition"
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-heading text-base font-bold text-slate-900 transition hover:bg-slate-50 sm:px-6"
                >
                  <span>{q}</span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-brand-600 transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="border-t border-slate-100 px-5 py-4 text-sm leading-relaxed text-slate-600 sm:px-6">
                    {a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
