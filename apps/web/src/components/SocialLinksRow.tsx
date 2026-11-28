'use client';

import { useState } from 'react';
import { Globe } from 'lucide-react';
import { LUCIDE_ICON_CDN, type SocialLinkItem } from '@ilangathir/shared';
import { useLanguage } from './LanguageProvider';

interface BrandStyle {
  bgClass: string;
  svg: React.ReactNode;
}

const BRAND_ICONS: Record<string, BrandStyle> = {
  instagram: {
    bgClass:
      'bg-[radial-gradient(circle_at_30%_107%,#fdf497_0%,#fdf497_5%,#fd5949_45%,#d6249f_60%,#285AEB_90%)] text-white ring-1 ring-white/20',
    svg: (
      <svg viewBox="1.5 1.5 21 21" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="5.5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.2" cy="6.8" r="1.2" fill="currentColor" stroke="none" />
      </svg>
    )
  },
  whatsapp: {
    bgClass: 'bg-[#25D366] text-white ring-1 ring-white/20',
    svg: (
      <svg viewBox="2.5 2.5 27 27" className="h-[24px] w-[24px]" fill="currentColor" aria-hidden="true">
        <path d="M16.04 4C9.42 4 4.04 9.38 4.04 16c0 2.12.56 4.19 1.62 6.01L4 28l6.16-1.61A11.95 11.95 0 0 0 16.04 28C22.66 28 28.04 22.62 28.04 16S22.66 4 16.04 4Zm0 21.81c-1.84 0-3.65-.5-5.22-1.44l-.37-.22-3.66.96.98-3.57-.24-.39a9.77 9.77 0 0 1-1.5-5.15c0-5.41 4.4-9.81 9.81-9.81s9.81 4.4 9.81 9.81-4.4 9.81-9.61 9.81Zm5.38-7.35c-.3-.15-1.74-.86-2.01-.96-.27-.1-.46-.15-.66.15-.2.3-.76.96-.94 1.15-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.65-2.05-.17-.3-.02-.46.13-.6.13-.13.3-.35.44-.52.15-.17.2-.3.3-.49.1-.2.05-.37-.02-.52-.08-.15-.66-1.59-.9-2.18-.24-.58-.48-.5-.66-.51h-.56c-.2 0-.52.07-.79.37-.27.3-1.03 1.01-1.03 2.46s1.06 2.85 1.21 3.05c.15.2 2.08 3.18 5.04 4.46.7.3 1.25.49 1.68.62.71.22 1.35.19 1.86.12.57-.09 1.74-.71 1.98-1.4.25-.69.25-1.28.17-1.4-.07-.12-.27-.2-.57-.35Z" />
      </svg>
    )
  },
  youtube: {
    bgClass: 'bg-[#FF0000] text-white ring-1 ring-white/20',
    svg: (
      <svg viewBox="1 3.5 22 17" className="h-[23px] w-[23px]" aria-hidden="true">
        <path
          fill="#FFFFFF"
          d="M21.58 7.19a2.51 2.51 0 0 0-1.77-1.77C18.25 5 12 5 12 5s-6.25 0-7.81.42a2.51 2.51 0 0 0-1.77 1.77C2 8.75 2 12 2 12s0 3.25.42 4.81a2.51 2.51 0 0 0 1.77 1.77C5.75 19 12 19 12 19s6.25 0 7.81-.42a2.51 2.51 0 0 0 1.77-1.77C22 15.25 22 12 22 12s0-3.25-.42-4.81Z"
        />
        <path fill="#FF0000" d="M10 15.02 15.22 12 10 8.98v6.04Z" />
      </svg>
    )
  },
  facebook: {
    bgClass: 'bg-[#1877F2] text-white ring-1 ring-white/20',
    svg: (
      <svg viewBox="6 1.5 13 21" className="h-[22px] w-[22px] translate-y-[0.5px]" fill="currentColor" aria-hidden="true">
        <path d="M14.2 21.5v-8.4h2.8l.42-3.28H14.2V7.73c0-.95.26-1.6 1.62-1.6h1.73V3.2c-.3-.04-1.33-.13-2.52-.13-2.5 0-4.21 1.52-4.21 4.33v2.42H8v3.28h2.82v8.4h3.38Z" />
      </svg>
    )
  },
  x: {
    bgClass: 'bg-[#000000] text-white ring-1 ring-white/25',
    svg: (
      <svg viewBox="2 1 20 22" className="h-[20px] w-[20px]" fill="currentColor" aria-hidden="true">
        <path d="M18.9 2.25h3.07l-6.7 7.66 7.88 10.42h-6.17l-4.83-6.32-5.53 6.32H3.55l7.17-8.19-7.56-9.89h6.33l4.37 5.77 5.04-5.77Zm-1.08 16.25h1.7L6.7 4.02H4.88l12.94 14.48Z" />
      </svg>
    )
  },
  threads: {
    bgClass: 'bg-[#000000] text-white ring-1 ring-white/25',
    svg: (
      <svg viewBox="2 2 20 20" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth="2.05" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M19.5 10.5C18.8 6.5 15.8 4 12 4c-4.4 0-8 3.6-8 8s3.6 8 8 8c3.3 0 6-1.9 7.2-4.8" />
        <path d="M15.2 12.2v1.6c0 1.4.8 2.3 2 2.3 1.3 0 2.3-1.1 2.3-3.1 0-1-.2-1.8-.5-2.5" />
        <path d="M15.2 12.2c0-2-1.3-3.3-3.3-3.3-1.5 0-2.7.8-3.2 2" />
        <path d="M15.2 12.6c-.4 1.6-1.6 2.5-3.2 2.5-1.5 0-2.6-.9-2.6-2.1 0-1.3 1.1-2.1 2.7-2.1 1.2 0 2.3.4 3.1 1.1" />
      </svg>
    )
  },
  linkedin: {
    bgClass: 'bg-[#0A66C2] text-white ring-1 ring-white/20',
    svg: (
      <svg viewBox="4 4 16 16" className="h-[21px] w-[21px]" fill="currentColor" aria-hidden="true">
        <path d="M6.94 8.5a1.56 1.56 0 1 1 0-3.12 1.56 1.56 0 0 1 0 3.12ZM5.6 18.4V9.8h2.68v8.6H5.6Zm4.65 0V9.8h2.57v1.18h.04c.36-.68 1.24-1.4 2.55-1.4 2.73 0 3.23 1.8 3.23 4.13v4.69h-2.68v-4.16c0-.99-.02-2.27-1.38-2.27-1.39 0-1.6 1.08-1.6 2.2v4.23h-2.73Z" />
      </svg>
    )
  },
  telegram: {
    bgClass: 'bg-[#26A5E4] text-white ring-1 ring-white/20',
    svg: (
      <svg viewBox="1.5 2.5 20.5 18.5" className="h-[21px] w-[21px] -translate-x-[0.5px]" fill="currentColor" aria-hidden="true">
        <path d="M21.2 4.4a1.1 1.1 0 0 0-1.15-.16L3.25 11.1a1.05 1.05 0 0 0 .08 1.97l4.2 1.34 1.65 5.15a.9.9 0 0 0 1.53.36l2.37-2.45 4.4 3.24a1.1 1.1 0 0 0 1.73-.67l2.58-14.5a1.1 1.1 0 0 0-.59-1.14ZM9.7 14.3l8.15-6.65-6.2 7.8-.42 2.8-1.53-3.95Z" />
      </svg>
    )
  }
};

function isDefaultLucideUrl(url: string): boolean {
  const clean = (url || '').trim();
  return !clean || clean.startsWith(LUCIDE_ICON_CDN);
}

function getPlatformKey(item: SocialLinkItem): string {
  const p = (item.platform || '').trim().toLowerCase();
  if (p in BRAND_ICONS) return p;
  if (p === 'twitter') return 'x';
  return p;
}

function SocialBadgeIcon({ item }: { item: SocialLinkItem }) {
  const [errored, setErrored] = useState(false);
  const key = getPlatformKey(item);
  const brand = BRAND_ICONS[key];

  if (item.icon_url && !isDefaultLucideUrl(item.icon_url) && !errored) {
    return (
      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white p-1.5 shadow-sm transition-transform duration-200 group-hover:scale-105">
        <img
          src={item.icon_url}
          alt={item.name_en}
          loading="lazy"
          decoding="async"
          onError={() => setErrored(true)}
          className="h-6 w-6 object-contain"
        />
      </span>
    );
  }

  if (brand) {
    return (
      <span
        className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-md transition-transform duration-200 group-hover:scale-110 ${brand.bgClass}`}
      >
        {brand.svg}
      </span>
    );
  }

  if (item.icon_url && !errored) {
    return (
      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-sand-200 bg-white text-brand-900 shadow-sm">
        <img
          src={item.icon_url}
          alt={item.name_en}
          loading="lazy"
          decoding="async"
          onError={() => setErrored(true)}
          className="h-6 w-6 object-contain"
        />
      </span>
    );
  }

  return (
    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-700 text-white shadow-sm ring-1 ring-white/20">
      <Globe className="h-5 w-5" />
    </span>
  );
}

export function SocialLinksRow({
  links,
  variant = 'light',
  showLabels = false,
  className = ''
}: {
  links: SocialLinkItem[];
  variant?: 'dark' | 'light';
  showLabels?: boolean;
  className?: string;
}) {
  const { lang } = useLanguage();
  const active = links.filter((l) => l.enabled && l.url);

  if (!active.length) return null;

  return (
    <div className={`flex flex-wrap items-center gap-2.5 ${className}`}>
      {active.map((item) => {
        const label = lang === 'ta' && item.name_ta ? item.name_ta : item.name_en;
        return (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${label}${item.handle ? ` (${item.handle})` : ''}`}
            title={`${label}${item.handle ? ` • ${item.handle}` : ''}`}
            className={
              showLabels
                ? `group inline-flex items-center gap-2.5 rounded-full border pr-4 p-1 text-xs font-bold transition active:scale-[0.98] ${
                    variant === 'dark'
                      ? 'border-white/15 bg-white/10 text-white hover:border-white/30 hover:bg-white/15'
                      : 'border-sand-200 bg-white text-brand-900 shadow-xs hover:border-sand-300 hover:bg-sand-50'
                  }`
                : 'group inline-flex items-center justify-center rounded-full transition hover:-translate-y-0.5 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-saffron-400'
            }
          >
            <SocialBadgeIcon item={item} />
            {showLabels && <span className="truncate">{label}</span>}
          </a>
        );
      })}
    </div>
  );
}
