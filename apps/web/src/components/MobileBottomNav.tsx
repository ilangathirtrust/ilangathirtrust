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

// Compact Tamil mobile bottom labels so nothing ever clips or overflows at 300px+
const COMPACT_TA_LABELS: Record<string, string> = {
  '/': 'முகப்பு',
  '/events': 'நிகழ்வு',
  '/gallery': 'படங்கள்',
  '/blog': 'கட்டுரை',
  '/donate': 'உதவி'
};

export function MobileBottomNav({ navItems }: { navItems: NavigationItem[] }) {
  const pathname = usePathname();
  const { lang } = useLanguage();

  const items = navItems
    .filter((i) => i.menu_location === 'mobile_bottom')
    .slice(0, 5);

  if (!items.length) return null;

  return (
    <nav
      aria-label="Mobile bottom navigation"
      className="fixed bottom-3 left-2 right-2 z-40 mx-auto max-w-md rounded-2xl border border-stone-200/90 bg-white/95 px-1 py-1.5 shadow-[0_12px_34px_rgba(8,16,48,0.16)] backdrop-blur-xl lg:hidden"
    >
      <ul className="grid grid-cols-5 items-stretch gap-1">
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
                className={`flex h-full flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-1.5 text-center transition ${
                  isDonate
                    ? isActive
                      ? 'bg-brand-700 text-white shadow-sm'
                      : 'bg-brand-600 text-white shadow-sm'
                    : isActive
                    ? 'bg-ivory-200 text-brand-900 font-bold'
                    : 'text-slate-600 hover:bg-ivory-100 hover:text-slate-900'
                }`}
              >
                <IconComponent className="h-4 w-4 shrink-0" strokeWidth={2.2} />
                <span className="w-full text-center text-[9.5px] font-bold leading-tight whitespace-nowrap sm:text-[10.5px]">
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
