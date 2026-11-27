'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { pickLocalized, type MarqueeItem } from '@ilangathir/shared';
import { useLanguage } from './LanguageProvider';
import { getUi } from '@/lib/i18n';

export function ActivityMarquee({ items }: { items: MarqueeItem[] }) {
  const { lang } = useLanguage();
  const ui = getUi(lang);

  if (!items.length) return null;

  // Duplicate list once for seamless infinite CSS scroll
  const trackItems = [...items, ...items];

  return (
    <section className="overflow-hidden border-y border-slate-200/80 bg-white py-14">
      <div className="container-max mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <span className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-brand-600">
            <span className="h-2 w-2 rounded-full bg-amberwarm-500" />
            {ui.marqueeEyebrow}
          </span>
          <h2 className="mt-2 font-heading text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {ui.marqueeTitle}
          </h2>
        </div>
        <Link
          href="/gallery"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-600 transition hover:text-brand-700"
        >
          <span>{ui.viewAll}</span>
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="relative w-full overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-white to-transparent sm:w-20" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-white to-transparent sm:w-20" />

        <div className="marquee-track flex w-max animate-marquee gap-5 px-4">
          {trackItems.map((item, idx) => {
            const title = pickLocalized(item as unknown as Record<string, unknown>, 'title', lang);
            const alt = pickLocalized(item as unknown as Record<string, unknown>, 'alt_text', lang) || title || 'Ilangathir Trust activity';
            return (
              <Link
                key={`${item.id}-${idx}`}
                href={item.link_url || '/gallery'}
                className="group relative h-52 w-72 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm transition hover:-translate-y-1 hover:shadow-lg sm:h-60 sm:w-80"
              >
                <img
                  src={item.image_url}
                  alt={alt}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                {title && (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/85 via-slate-950/40 to-transparent p-4 pt-10">
                    <p className="line-clamp-2 text-sm font-semibold text-white">{title}</p>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
