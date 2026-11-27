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
      className="fixed bottom-3 left-2.5 right-2.5 z-40 mx-auto max-w-md rounded-2xl border border-slate-200/90 bg-white/95 px-1.5 py-1.5 shadow-[0_12px_36px_rgba(12,21,74,0.16)] backdrop-blur-xl lg:hidden"
    >
      <ul className="grid grid-cols-5 items-center gap-0.5">
        {items.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const IconComponent =
            ICON_MAP[(item.icon_name as keyof typeof ICON_MAP) || 'Home'] || Home;
          const label = lang === 'ta' ? item.label_ta : item.label_en;
          const isDonate = item.href === '/donate';

          return (
            <li key={item.id}>
              <Link
                href={item.href}
                className={`flex flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-center transition ${
                  isDonate
                    ? isActive
                      ? 'bg-brand-700 text-white shadow-sm'
                      : 'bg-brand-600 text-white shadow-sm'
                    : isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <IconComponent className="h-4 w-4 shrink-0" strokeWidth={2.2} />
                <span className="max-w-full truncate text-[10px] font-semibold leading-tight">
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
