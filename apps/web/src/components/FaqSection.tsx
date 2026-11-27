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
    <section className="border-t border-sand-200 bg-sand-50 py-11 sm:py-14 lg:py-16">
      <div className="container-max">
        <div className="mx-auto max-w-3xl text-center">
          <span className="section-kicker">{ui.faqEyebrow}</span>
          <h2 className="mt-2 font-heading text-xl font-bold text-brand-900 min-[360px]:text-2xl sm:text-3xl">
            {ui.faqTitle}
          </h2>
        </div>

        <div className="mx-auto mt-8 max-w-3xl space-y-3 sm:mt-10">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            const q = lang === 'ta' && faq.question_ta ? faq.question_ta : faq.question_en;
            const a = lang === 'ta' && faq.answer_ta ? faq.answer_ta : faq.answer_en;
            return (
              <div
                key={idx}
                className="overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-xs transition"
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left font-heading text-sm font-bold text-brand-900 transition hover:bg-sand-50/70 min-[360px]:px-5 sm:px-6 sm:text-base"
                >
                  <span className="min-w-0 break-words">{q}</span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-saffron-600 transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="border-t border-sand-100 bg-white px-4 py-4 text-sm leading-relaxed text-slate-600 min-[360px]:px-5 sm:px-6">
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
