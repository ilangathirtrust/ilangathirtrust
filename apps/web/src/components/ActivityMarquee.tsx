'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { pickLocalized, type MarqueeItem } from '@ilangathir/shared';
import { useLanguage } from './LanguageProvider';
import { getUi } from '@/lib/i18n';
import { LazyImage } from './LazyPrimitives';

export function ActivityMarquee({ items }: { items: MarqueeItem[] }) {
  const { lang } = useLanguage();
  const ui = getUi(lang);

  if (!items.length) return null;

  const trackItems = [...items, ...items];

  return (
    <section className="overflow-hidden border-y border-sand-200 bg-white py-12 sm:py-14">
      <div className="container-max mb-7 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <span className="section-kicker">{ui.marqueeEyebrow}</span>
          <h2 className="mt-1.5 font-heading text-xl font-bold text-brand-900 min-[360px]:text-2xl sm:text-3xl">
            {ui.marqueeTitle}
          </h2>
        </div>
        <Link
          href="/gallery"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-800 transition hover:text-saffron-600"
        >
          <span>{ui.viewAll}</span>
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="relative w-full overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-white to-transparent sm:w-20" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-white to-transparent sm:w-20" />

        <div className="marquee-track flex w-max animate-marquee gap-4 px-3 sm:gap-5 sm:px-4">
          {trackItems.map((item, idx) => {
            const title = pickLocalized(item as unknown as Record<string, unknown>, 'title', lang);
            const alt = pickLocalized(item as unknown as Record<string, unknown>, 'alt_text', lang) || title || 'Ilangathir Trust activity';
            return (
              <Link
                key={`${item.id}-${idx}`}
                href={item.link_url || '/gallery'}
                className="group relative h-48 w-64 shrink-0 overflow-hidden rounded-2xl border border-sand-200 bg-sand-100 shadow-xs transition hover:-translate-y-1 hover:shadow-lg sm:h-60 sm:w-80"
              >
                <LazyImage
                  src={item.image_url}
                  alt={alt}
                  wrapperClassName="h-full w-full"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                {title && (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-brand-950/90 via-brand-950/45 to-transparent p-3.5 pt-10">
                    <p className="line-clamp-2 text-xs font-semibold text-white sm:text-sm">{title}</p>
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
