'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, Mail, Menu, Phone, X } from 'lucide-react';
import type { NavigationItem } from '@ilangathir/shared';
import { useLanguage } from './LanguageProvider';
import { getUi } from '@/lib/i18n';
import { trackEvent } from '@/lib/analytics';

interface SiteHeaderProps {
  logoUrl: string;
  trustNameEn: string;
  trustNameTa: string;
  phone: string;
  email: string;
  navItems: NavigationItem[];
  donationsEnabled: boolean;
}

function splitTrustName(fullName: string, fallbackTop: string, fallbackBottom: string): [string, string] {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return [parts[0], parts.slice(1).join(' ')];
  }
  return [fullName.trim() || fallbackTop, fallbackBottom];
}

export function SiteHeader({
  logoUrl,
  trustNameEn,
  trustNameTa,
  phone,
  email,
  navItems,
  donationsEnabled
}: SiteHeaderProps) {
  const { lang, setLang } = useLanguage();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const ui = getUi(lang);

  const headerLinks = navItems.filter((item) => {
    if (item.menu_location !== 'header') return false;
    if (!donationsEnabled && item.href.startsWith('/donate')) return false;
    return true;
  });

  const [enTop, enBottom] = splitTrustName(trustNameEn, 'Ilangathir', 'Trust');
  const [taTop, taBottom] = splitTrustName(trustNameTa, 'இளங்கதிர்', 'அறக்கட்டளை');
  const mobileTop = lang === 'ta' ? taTop : enTop;
  const mobileBottom = lang === 'ta' ? taBottom : enBottom;

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-brand-900 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        {ui.skipToContent}
      </a>

      {/* Top utility strip (Desktop) */}
      <div className="hidden border-b border-sand-200 bg-brand-950 text-xs text-sand-100 md:block">
        <div className="container-max flex h-9 items-center justify-between gap-4">
          <p className="truncate font-medium text-sand-200">
            {lang === 'ta'
              ? 'பதிவு பெற்ற மக்கள் நல அறக்கட்டளை • V. கல்லுப்பட்டி, திண்டுக்கல்'
              : 'Registered Charitable Trust • V. Kallupatti, Dindigul, Tamil Nadu'}
          </p>
          <div className="flex shrink-0 items-center gap-4">
            <a
              href={`tel:${phone.replace(/[^\d+]/g, '')}`}
              className="inline-flex items-center gap-1.5 text-sand-100 transition hover:text-saffron-400"
            >
              <Phone className="h-3.5 w-3.5 text-saffron-400" />
              <span>{phone}</span>
            </a>
            <span className="text-brand-700">|</span>
            <a
              href={`mailto:${email}`}
              className="inline-flex items-center gap-1.5 text-sand-100 transition hover:text-saffron-400"
            >
              <Mail className="h-3.5 w-3.5 text-saffron-400" />
              <span>{email}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Sticky Header */}
      <header className="sticky top-0 z-40 border-b border-sand-200 bg-white/95 shadow-[0_2px_12px_rgba(11,24,46,0.04)] backdrop-blur-md">
        <div className="container-max">
          {/* Mobile Header (< lg): Left bare menu icon | Logo + single-lang stacked name | Right full "En" "த" toggle | NO donate icon */}
          <div className="flex h-16 items-center justify-between gap-1.5 lg:hidden">
            <div className="flex min-w-0 items-center gap-2 min-[360px]:gap-2.5">
              <button
                type="button"
                onClick={() => setDrawerOpen((v) => !v)}
                aria-label={drawerOpen ? ui.close : ui.menu}
                aria-expanded={drawerOpen}
                className="-ml-1 inline-flex h-9 w-9 shrink-0 items-center justify-center bg-transparent p-0 text-brand-900 transition hover:text-saffron-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
              >
                {drawerOpen ? <X className="h-6 w-6" strokeWidth={2.2} /> : <Menu className="h-6 w-6" strokeWidth={2.2} />}
              </button>

              <Link
                href="/"
                className="flex min-w-0 items-center gap-2"
                aria-label={lang === 'ta' ? trustNameTa : trustNameEn}
              >
                <img
                  src={logoUrl || '/assets/logo.webp'}
                  alt={lang === 'ta' ? trustNameTa : trustNameEn}
                  className="h-9 w-9 shrink-0 rounded-full border border-sand-200 object-cover shadow-xs min-[360px]:h-10 min-[360px]:w-10"
                />
                <span className="flex min-w-0 flex-col leading-none">
                  <span
                    className={`truncate font-heading font-extrabold text-brand-900 ${lang === 'ta'
                        ? 'text-[12.5px] min-[360px]:text-[13.5px]'
                        : 'text-[13.5px] min-[360px]:text-[15px]'
                      }`}
                  >
                    {mobileTop}
                  </span>
                  <span
                    className={`mt-0.5 truncate font-semibold text-saffron-600 ${lang === 'ta'
                        ? 'text-[10px] min-[360px]:text-[11px]'
                        : 'text-[10.5px] tracking-wide uppercase min-[360px]:text-[11px]'
                      }`}
                  >
                    {mobileBottom}
                  </span>
                </span>
              </Link>
            </div>

            {/* Full Segmented Language Toggle ("En" / "த") */}
            <div
              role="group"
              aria-label="Language switcher"
              className="inline-flex shrink-0 items-center rounded-full border border-sand-200 bg-sand-50 p-0.5 shadow-xs"
            >
              <button
                type="button"
                onClick={() => setLang('en')}
                aria-pressed={lang === 'en'}
                aria-label="Switch to English"
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition min-[360px]:px-3 min-[360px]:text-xs ${lang === 'en'
                    ? 'bg-brand-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-brand-900'
                  }`}
              >
                En
              </button>
              <button
                type="button"
                onClick={() => setLang('ta')}
                aria-pressed={lang === 'ta'}
                aria-label="தமிழுக்கு மாற்று"
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition min-[360px]:px-3 min-[360px]:text-xs ${lang === 'ta'
                    ? 'bg-brand-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-brand-900'
                  }`}
              >
                த
              </button>
            </div>
          </div>

          {/* Desktop Header (>= lg): Shows BOTH Tamil & English Trust Names */}
          <div className="hidden h-20 items-center justify-between gap-4 lg:flex">
            <Link href="/" className="flex shrink-0 items-center gap-3">
              <img
                src={logoUrl || '/assets/logo.webp'}
                alt={trustNameEn}
                className="h-12 w-12 rounded-full border border-sand-200 object-cover shadow-xs"
              />
              <div className="flex flex-col">
                <span className="font-heading text-base font-extrabold text-brand-900 whitespace-nowrap">
                  {lang === 'ta' ? trustNameTa : trustNameEn}
                </span>
                <span className="text-xs font-semibold text-saffron-600 whitespace-nowrap">
                  {lang === 'ta' ? trustNameEn : trustNameTa}
                </span>
              </div>
            </Link>

            <nav aria-label="Main navigation" className="flex items-center gap-0.5 xl:gap-1">
              {headerLinks.map((item) => {
                const isActive =
                  item.href === '/'
                    ? pathname === '/'
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);
                const label = lang === 'ta' ? item.label_ta : item.label_en;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`rounded-xl px-2.5 py-2 font-semibold whitespace-nowrap transition xl:px-3 ${lang === 'ta' ? 'text-[12.5px]' : 'text-[13.5px]'
                      } ${isActive
                        ? 'bg-sand-100 text-brand-900 font-bold'
                        : 'text-slate-700 hover:bg-sand-50 hover:text-brand-900'
                      }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex shrink-0 items-center gap-2.5">
              {/* Full Segmented Language Toggle ("En" / "த") */}
              <div
                role="group"
                aria-label="Language switcher"
                className="inline-flex items-center rounded-full border border-sand-200 bg-sand-50 p-1 shadow-xs"
              >
                <button
                  type="button"
                  onClick={() => setLang('en')}
                  aria-pressed={lang === 'en'}
                  aria-label="Switch to English"
                  className={`rounded-full px-3 py-1 text-xs font-bold transition ${lang === 'en' ? 'bg-brand-900 text-white shadow-xs' : 'text-slate-600 hover:text-brand-900'
                    }`}
                >
                  En
                </button>
                <button
                  type="button"
                  onClick={() => setLang('ta')}
                  aria-pressed={lang === 'ta'}
                  aria-label="தமிழுக்கு மாற்று"
                  className={`rounded-full px-3 py-1 text-xs font-bold transition ${lang === 'ta' ? 'bg-brand-900 text-white shadow-xs' : 'text-slate-600 hover:text-brand-900'
                    }`}
                >
                  த
                </button>
              </div>

              {donationsEnabled && (
                <Link
                  href="/donate"
                  onClick={() => trackEvent('nav_donate_click', { location: 'desktop_header' })}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-saffron-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-saffron-700 xl:text-sm"
                >
                  <Heart className="h-4 w-4 shrink-0" />
                  <span className="whitespace-nowrap">{ui.donateNow}</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Drawer */}
        {drawerOpen && (
          <nav
            aria-label="Mobile navigation"
            className="border-t border-sand-200 bg-white px-4 pb-6 pt-3 shadow-xl lg:hidden"
          >
            <div className="flex flex-col gap-1">
              {headerLinks.map((item) => {
                const isActive =
                  item.href === '/'
                    ? pathname === '/'
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);
                const label = lang === 'ta' ? item.label_ta : item.label_en;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setDrawerOpen(false)}
                    className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${isActive
                        ? 'bg-sand-100 text-brand-900 font-bold'
                        : 'text-slate-700 hover:bg-sand-50'
                      }`}
                  >
                    {label}
                  </Link>
                );
              })}
              {donationsEnabled && (
                <Link
                  href="/donate"
                  onClick={() => {
                    setDrawerOpen(false);
                    trackEvent('nav_donate_click', { location: 'mobile_drawer' });
                  }}
                  className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-saffron-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-saffron-700"
                >
                  <Heart className="h-4 w-4" />
                  <span>{ui.donateNow}</span>
                </Link>
              )}
            </div>
          </nav>
        )}
      </header>
    </>
  );
}
