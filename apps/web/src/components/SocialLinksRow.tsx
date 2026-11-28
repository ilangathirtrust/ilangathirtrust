'use client';

import { useState } from 'react';
import { Globe } from 'lucide-react';
import type { SocialLinkItem } from '@ilangathir/shared';
import { useLanguage } from './LanguageProvider';

function SocialIconImg({ src, alt }: { src: string; alt: string }) {
  const [errored, setErrored] = useState(false);

  if (!src || errored) {
    return <Globe className="h-4 w-4 shrink-0" />;
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setErrored(true)}
      className="h-4 w-4 shrink-0 object-contain"
    />
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
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
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
                ? `inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition active:scale-[0.98] ${
                    variant === 'dark'
                      ? 'border-white/15 bg-white/10 text-white hover:border-saffron-400/50 hover:bg-white/20'
                      : 'border-sand-200 bg-sand-50 text-brand-900 hover:border-saffron-300 hover:bg-saffron-50'
                  }`
                : `inline-flex h-9 w-9 items-center justify-center rounded-xl border transition active:scale-95 ${
                    variant === 'dark'
                      ? 'border-white/15 bg-white/95 text-brand-900 shadow-xs hover:border-saffron-400 hover:bg-saffron-400'
                      : 'border-sand-200 bg-white text-brand-900 shadow-xs hover:border-saffron-300 hover:bg-saffron-50'
                  }`
            }
          >
            <span
              className={
                showLabels
                  ? 'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/95 text-brand-900'
                  : 'inline-flex items-center justify-center'
              }
            >
              <SocialIconImg src={item.icon_url} alt={label} />
            </span>
            {showLabels && <span className="truncate">{label}</span>}
          </a>
        );
      })}
    </div>
  );
}
