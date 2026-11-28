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
    bgClass: 'bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white border-transparent',
    svg: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
        <circle cx="12" cy="12" r="4.2" />
        <circle cx="17.5" cy="6.5" r="1.1" fill="currentColor" stroke="none" />
      </svg>
    )
  },
  whatsapp: {
    bgClass: 'bg-[#25D366] text-white border-transparent',
    svg: (
      <svg viewBox="0 0 24 24" className="h-[19px] w-[19px]" fill="currentColor" aria-hidden="true">
        <path d="M12.03 2a9.97 9.97 0 0 0-8.65 14.95L2 22l5.2-1.36A9.98 9.98 0 1 0 12.03 2Zm0 18.14a8.18 8.18 0 0 1-4.17-1.14l-.3-.18-3.09.81.82-3.01-.2-.31a8.18 8.18 0 1 1 7.04 3.83Zm4.49-6.13c-.25-.12-1.46-.72-1.69-.8-.22-.08-.39-.12-.55.12-.17.25-.64.8-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.48-1.39-1.73-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.15.16-.25.25-.42.08-.16.04-.31-.02-.43-.06-.12-.55-1.33-.76-1.82-.2-.48-.4-.41-.55-.42h-.47c-.17 0-.43.06-.66.31-.22.25-.86.84-.86 2.05s.88 2.38 1 2.54c.13.17 1.74 2.66 4.22 3.73.59.25 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.46-.6 1.67-1.18.21-.58.21-1.08.15-1.18-.07-.11-.23-.17-.48-.29Z" />
      </svg>
    )
  },
  youtube: {
    bgClass: 'bg-[#FF0000] text-white border-transparent',
    svg: (
      <svg viewBox="0 0 24 24" className="h-[19px] w-[19px]" fill="currentColor" aria-hidden="true">
        <path d="M23.1 7.1a2.95 2.95 0 0 0-2.08-2.09C19.18 4.5 12 4.5 12 4.5s-7.18 0-9.02.51A2.95 2.95 0 0 0 .9 7.1C.4 8.95.4 12 .4 12s0 3.05.5 4.9a2.95 2.95 0 0 0 2.08 2.09c1.84.51 9.02.51 9.02.51s7.18 0 9.02-.51a2.95 2.95 0 0 0 2.08-2.09c.5-1.85.5-4.9.5-4.9s0-3.05-.5-4.9ZM9.7 15.1V8.9l5.9 3.1-5.9 3.1Z" />
      </svg>
    )
  },
  facebook: {
    bgClass: 'bg-[#1877F2] text-white border-transparent',
    svg: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor" aria-hidden="true">
        <path d="M13.6 22v-8.8h2.95l.44-3.43H13.6V7.58c0-.99.28-1.67 1.7-1.67h1.81V2.84c-.31-.04-1.39-.14-2.64-.14-2.62 0-4.41 1.6-4.41 4.53v2.54H7.1v3.43h2.96V22h3.54Z" />
      </svg>
    )
  },
  x: {
    bgClass: 'bg-[#0F1419] text-white border-white/20',
    svg: (
      <svg viewBox="0 0 24 24" className="h-[16px] w-[16px]" fill="currentColor" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.451-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
      </svg>
    )
  },
  threads: {
    bgClass: 'bg-[#101010] text-white border-white/20',
    svg: (
      <svg viewBox="0 0 24 24" className="h-[17px] w-[17px]" fill="currentColor" aria-hidden="true">
        <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.781 3.631 2.695 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.96-.065-1.182.408-2.256 1.332-3.023.812-.674 1.928-1.077 3.23-1.166.93-.064 1.82-.01 2.656.144-.08-.776-.315-1.39-.705-1.832-.517-.584-1.304-.883-2.342-.89h-.027c-.81 0-1.918.234-2.611 1.258l-1.766-1.196C7.688 6.46 9.188 5.71 10.97 5.71h.041c3.21.02 5.063 1.95 5.206 5.43.13.053.26.108.387.166 1.26.584 2.256 1.497 2.81 2.677.772 1.646.89 4.38-1.298 6.522-1.842 1.805-4.084 2.572-7.33 2.495Zm-1.044-6.982c.99 0 1.81-.34 2.382-.987.484-.548.807-1.326.963-2.323-.692-.147-1.442-.202-2.226-.15-1.712.116-2.587.848-2.536 1.808.05.94.96 1.652 2.417 1.652Z" />
      </svg>
    )
  },
  linkedin: {
    bgClass: 'bg-[#0A66C2] text-white border-transparent',
    svg: (
      <svg viewBox="0 0 24 24" className="h-[17px] w-[17px]" fill="currentColor" aria-hidden="true">
        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77Z" />
      </svg>
    )
  },
  telegram: {
    bgClass: 'bg-[#26A5E4] text-white border-transparent',
    svg: (
      <svg viewBox="0 0 24 24" className="h-[17px] w-[17px]" fill="currentColor" aria-hidden="true">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0h-.056Zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635Z" />
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

  // If custom uploaded icon or custom non-default URL was provided by admin, render it cleanly
  if (item.icon_url && !isDefaultLucideUrl(item.icon_url) && !errored) {
    return (
      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white p-1 shadow-xs">
        <img
          src={item.icon_url}
          alt={item.name_en}
          loading="lazy"
          decoding="async"
          onError={() => setErrored(true)}
          className="h-5 w-5 object-contain"
        />
      </span>
    );
  }

  if (brand) {
    return (
      <span
        className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border shadow-sm transition-transform duration-200 group-hover:scale-105 ${brand.bgClass}`}
      >
        {brand.svg}
      </span>
    );
  }

  // Fallback for custom platforms still using a lucide-static URL
  if (item.icon_url && !errored) {
    return (
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-sand-200 bg-white text-brand-900 shadow-xs">
        <img
          src={item.icon_url}
          alt={item.name_en}
          loading="lazy"
          decoding="async"
          onError={() => setErrored(true)}
          className="h-[18px] w-[18px] object-contain"
        />
      </span>
    );
  }

  return (
    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-700 text-white shadow-xs">
      <Globe className="h-[18px] w-[18px]" />
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
                ? `group inline-flex items-center gap-2.5 rounded-2xl border pr-3.5 p-1 text-xs font-bold transition active:scale-[0.98] ${
                    variant === 'dark'
                      ? 'border-white/15 bg-white/10 text-white hover:border-white/30 hover:bg-white/15'
                      : 'border-sand-200 bg-white text-brand-900 shadow-xs hover:border-sand-300 hover:bg-sand-50'
                  }`
                : 'group inline-flex items-center justify-center rounded-xl transition hover:-translate-y-0.5 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-saffron-400'
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
