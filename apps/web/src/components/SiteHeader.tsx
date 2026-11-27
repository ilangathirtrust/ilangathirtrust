'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, Menu, X, Globe, Phone, Mail } from 'lucide-react';
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
}

export function SiteHeader({
  logoUrl,
  trustNameEn,
  trustNameTa,
  phone,
  email,
  navItems
}: SiteHeaderProps) {
  const { lang, setLang } = useLanguage();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const ui = getUi(lang);

  const headerLinks = navItems.filter((item) => item.menu_location === 'header');

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        {ui.skipToContent}
      </a>

      {/* Top utility bar (hidden on compact mobile to avoid 300px clutter) */}
      <div className="hidden border-b border-brand-900/20 bg-brand-950 text-xs text-slate-200 md:block">
        <div className="container-max flex h-9 items-center justify-between gap-4">
          <p className="truncate font-medium text-slate-300">
            {lang === 'ta'
              ? 'கருணையுடன் கூடிய சமூக சேவை • தமிழ்நாடு, இந்தியா'
              : 'Serving communities with compassion • Tamil Nadu, India'}
          </p>
          <div className="flex items-center gap-4">
            <a
              href={`tel:${phone.replace(/[^\d+]/g, '')}`}
              className="inline-flex items-center gap-1.5 transition hover:text-white"
            >
              <Phone className="h-3.5 w-3.5 text-amberwarm-400" />
              <span>{phone}</span>
            </a>
            <span className="text-slate-600">|</span>
            <a
              href={`mailto:${email}`}
              className="inline-flex items-center gap-1.5 transition hover:text-white"
            >
              <Mail className="h-3.5 w-3.5 text-amberwarm-400" />
              <span>{email}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Sticky Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-lg">
        <div className="container-max">
          {/* Mobile Header (< lg): Left Menu | Center Logo | Right Lang & Donate */}
          <div className="grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-1 lg:hidden">
            <div className="flex items-center justify-start">
              <button
                type="button"
                onClick={() => setDrawerOpen((v) => !v)}
                aria-label={drawerOpen ? ui.close : ui.menu}
                aria-expanded={drawerOpen}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-800 transition hover:bg-brand-50 hover:text-brand-600"
              >
                {drawerOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>

            <Link
              href="/"
              className="flex items-center justify-center gap-2 justify-self-center"
              aria-label={lang === 'ta' ? trustNameTa : trustNameEn}
            >
              <img
                src={logoUrl || '/assets/ilangathir-logo.jpg'}
                alt={trustNameEn}
                className="h-10 w-10 rounded-full border-2 border-brand-100 object-cover shadow-sm"
              />
              <span className="hidden min-[360px]:flex flex-col leading-tight">
                <span className="font-heading text-xs font-bold text-slate-900">
                  {lang === 'ta' ? trustNameTa : trustNameEn}
                </span>
                <span className="text-[10px] font-semibold text-brand-600">
                  {lang === 'ta' ? trustNameEn : trustNameTa}
                </span>
              </span>
            </Link>

            <div className="flex items-center justify-end gap-1.5">
              <button
                type="button"
                onClick={() => setLang(lang === 'en' ? 'ta' : 'en')}
                aria-label="Toggle language"
                className="inline-flex h-9 items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2.5 text-[11px] font-bold text-slate-800 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
              >
                <Globe className="h-3.5 w-3.5 text-brand-600" />
                <span>{lang === 'en' ? 'தமிழ்' : 'EN'}</span>
              </button>
              <Link
                href="/donate"
                aria-label={ui.donateNow}
                onClick={() => trackEvent('nav_donate_click', { location: 'mobile_header' })}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-white shadow-sm transition hover:bg-brand-700"
              >
                <Heart className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Desktop Header (>= lg) */}
          <div className="hidden h-20 items-center justify-between gap-6 lg:flex">
            <Link href="/" className="flex shrink-0 items-center gap-3">
              <img
                src={logoUrl || '/assets/ilangathir-logo.jpg'}
                alt={trustNameEn}
                className="h-12 w-12 rounded-full border-2 border-brand-100 object-cover shadow-sm"
              />
              <div className="flex flex-col">
                <span className="font-heading text-base font-bold text-slate-900">
                  {lang === 'ta' ? trustNameTa : trustNameEn}
                </span>
                <span className="text-xs font-semibold text-brand-600">
                  {lang === 'ta' ? trustNameEn : trustNameTa}
                </span>
              </div>
            </Link>

            <nav aria-label="Main navigation" className="flex items-center gap-1 xl:gap-2">
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
                    className={`rounded-lg px-3 py-2 text-sm font-semibold whitespace-nowrap transition ${
                      isActive
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-brand-600'
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex shrink-0 items-center gap-3">
              <div
                role="group"
                aria-label="Language switcher"
                className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 p-1"
              >
                <button
                  type="button"
                  onClick={() => setLang('en')}
                  aria-pressed={lang === 'en'}
                  className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                    lang === 'en'
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setLang('ta')}
                  aria-pressed={lang === 'ta'}
                  className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                    lang === 'ta'
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  தமிழ்
                </button>
              </div>

              <Link
                href="/donate"
                onClick={() => trackEvent('nav_donate_click', { location: 'desktop_header' })}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-brand-600/20 transition hover:-translate-y-0.5 hover:bg-brand-700"
              >
                <Heart className="h-4 w-4" />
                <span className="whitespace-nowrap">{ui.donateNow}</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile Slide-down Navigation Drawer */}
        {drawerOpen && (
          <nav
            aria-label="Mobile navigation"
            className="border-t border-slate-200 bg-white px-4 pb-6 pt-3 shadow-xl lg:hidden"
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
                    className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                      isActive
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
              <Link
                href="/donate"
                onClick={() => {
                  setDrawerOpen(false);
                  trackEvent('nav_donate_click', { location: 'mobile_drawer' });
                }}
                className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-bold text-white shadow-sm"
              >
                <Heart className="h-4 w-4" />
                <span>{ui.donateNow}</span>
              </Link>
            </div>
          </nav>
        )}
      </header>
    </>
  );
}
