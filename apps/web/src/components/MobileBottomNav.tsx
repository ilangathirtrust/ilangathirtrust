'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  CalendarDays,
  Heart,
  Home,
  Images,
  Mail,
  Sparkles,
  HeartHandshake
} from 'lucide-react';
import type { NavigationItem } from '@ilangathir/shared';
import { useLanguage } from './LanguageProvider';

const ICON_MAP = {
  Home,
  CalendarDays,
  Images,
  BookOpen,
  Heart,
  Mail,
  Sparkles,
  HeartHandshake
} as const;

const COMPACT_TA_LABELS: Record<string, string> = {
  '/': 'முகப்பு',
  '/events': 'நிகழ்வு',
  '/gallery': 'படங்கள்',
  '/blog': 'செய்திகள்',
  '/donate': 'உதவி',
  '/activities': 'பணிகள்',
  '/contact': 'தொடர்பு'
};

export function MobileBottomNav({
  navItems,
  donationsEnabled
}: {
  navItems: NavigationItem[];
  donationsEnabled: boolean;
}) {
  const pathname = usePathname();
  const { lang } = useLanguage();

  const items = navItems
    .filter((i) => {
      if (i.menu_location !== 'mobile_bottom') return false;
      if (!donationsEnabled && i.href.startsWith('/donate')) return false;
      return true;
    })
    .slice(0, 5);

  if (!items.length) return null;

  return (
    <nav
      aria-label="Mobile bottom navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-sand-200 bg-white/95 shadow-[0_-4px_20px_rgba(11,24,46,0.08)] backdrop-blur-lg pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul
        className="grid items-stretch"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const IconComponent =
            ICON_MAP[(item.icon_name as keyof typeof ICON_MAP) || 'Home'] || Home;
          const label =
            lang === 'ta'
              ? COMPACT_TA_LABELS[item.href] || item.label_ta
              : item.label_en;
          const isDonate = item.href === '/donate';

          return (
            <li key={item.id} className="min-w-0">
              <Link
                href={item.href}
                className={`relative flex h-full min-h-[58px] flex-col items-center justify-center gap-1 px-1 py-1.5 text-center transition ${
                  isDonate
                    ? isActive
                      ? 'bg-saffron-600/10 text-saffron-700 font-bold'
                      : 'text-saffron-600 hover:bg-saffron-50'
                    : isActive
                    ? 'bg-brand-50/70 text-brand-900 font-bold'
                    : 'text-slate-600 hover:bg-sand-50 hover:text-brand-900'
                }`}
              >
                {isActive && (
                  <span
                    aria-hidden="true"
                    className={`absolute inset-x-3 top-0 h-[2.5px] rounded-b-full ${
                      isDonate ? 'bg-saffron-600' : 'bg-brand-900'
                    }`}
                  />
                )}
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${
                    isDonate
                      ? 'bg-saffron-600 text-white shadow-xs'
                      : isActive
                      ? 'text-brand-900'
                      : 'text-slate-500'
                  }`}
                >
                  <IconComponent className="h-[17px] w-[17px] shrink-0" strokeWidth={2.2} />
                </span>
                <span
                  className={`w-full truncate text-center font-bold leading-tight ${
                    lang === 'ta'
                      ? 'text-[9.5px] min-[360px]:text-[10.5px]'
                      : 'text-[10px] min-[360px]:text-[11px]'
                  }`}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
