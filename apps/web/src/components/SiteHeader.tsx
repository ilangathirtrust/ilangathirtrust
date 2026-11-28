'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  CalendarDays,
  ChevronRight,
  Heart,
  HeartHandshake,
  Home,
  Images,
  Mail,
  Menu,
  MessageCircle,
  Phone,
  Sparkles,
  Users,
  X
} from 'lucide-react';
import type { NavigationItem, SocialLinkItem } from '@ilangathir/shared';
import { useLanguage } from './LanguageProvider';
import { SocialLinksRow } from './SocialLinksRow';
import { getUi } from '@/lib/i18n';
import { trackEvent } from '@/lib/analytics';
import { STATIC_ASSETS } from '@/lib/site-content';

const DRAWER_ICON_MAP: Record<string, typeof Home> = {
  '/': Home,
  '/about': HeartHandshake,
  '/activities': Sparkles,
  '/events': CalendarDays,
  '/gallery': Images,
  '/blog': BookOpen,
  '/volunteer': Users,
  '/contact': Mail,
  '/donate': Heart
};

interface SiteHeaderProps {
  logoUrl?: string;
  trustNameEn: string;
  trustNameTa: string;
  phone: string;
  email: string;
  navItems: NavigationItem[];
  donationsEnabled: boolean;
  socialLinks?: SocialLinkItem[];
}

export function SiteHeader({
  trustNameEn,
  trustNameTa,
  phone,
  email,
  navItems,
  donationsEnabled,
  socialLinks = []
}: SiteHeaderProps) {
  const { lang, setLang } = useLanguage();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const ui = getUi(lang);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [drawerOpen]);

  const headerLinks = navItems.filter((item) => {
    if (item.menu_location !== 'header') return false;
    if (!donationsEnabled && item.href.startsWith('/donate')) return false;
    return true;
  });

  const mobileLogoSrc = lang === 'ta' ? STATIC_ASSETS.logoTam : STATIC_ASSETS.logoEng;
  const desktopLogoSrc = STATIC_ASSETS.logo;

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-brand-900 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        {ui.skipToContent}
      </a>

      {/* Top utility strip (Desktop) */}
      <div className="print:hidden hidden border-b border-sand-200 bg-brand-950 text-xs text-sand-100 md:block">
        <div className="container-max flex h-9 items-center justify-between gap-4">
          <p className="truncate font-medium text-sand-200">
            {lang === 'ta'
              ? 'பதிவு பெற்ற அறக்கட்டளை (Book - 4/47/2024) • V. கல்லுப்பட்டி, திண்டுக்கல்'
              : 'Registered Charitable Trust (Book - 4/47/2024) • V. Kallupatti, Dindigul, Tamil Nadu'}
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

      {/* Main Sticky Header (opaque + GPU-composited to prevent scroll jitter) */}
      <header className="print:hidden sticky top-0 z-40 transform-gpu border-b border-sand-200 bg-white shadow-[0_2px_12px_rgba(11,24,46,0.04)]">
        <div className="container-max">
          {/* Mobile Header (< lg): Left bare menu icon | Balanced centered language-switched logo | Right full "En" "த" toggle | NO donate icon */}
          <div className="grid h-[66px] grid-cols-[auto_1fr_auto] items-center gap-2 min-[360px]:h-[70px] lg:hidden">
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
              className="flex min-w-0 justify-self-center items-center justify-center"
              aria-label={lang === 'ta' ? trustNameTa : trustNameEn}
            >
              <img
                src={mobileLogoSrc}
                alt={lang === 'ta' ? trustNameTa : trustNameEn}
                className="h-10 w-auto max-w-[144px] object-contain object-center min-[360px]:h-11 min-[360px]:max-w-[180px] sm:h-12 sm:max-w-[210px]"
              />
            </Link>

            {/* Full Segmented Language Toggle ("En" / "த") */}
            <div
              role="group"
              aria-label="Language switcher"
              className="inline-flex shrink-0 items-center rounded-full border border-sand-200 bg-sand-100 p-0.5 shadow-xs"
            >
              <button
                type="button"
                onClick={() => setLang('en')}
                aria-pressed={lang === 'en'}
                aria-label="Switch to English"
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition min-[360px]:px-3 min-[360px]:text-xs ${
                  lang === 'en'
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
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition min-[360px]:px-3 min-[360px]:text-xs ${
                  lang === 'ta'
                    ? 'bg-brand-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-brand-900'
                }`}
              >
                த
              </button>
            </div>
          </div>

          {/* Desktop Header (>= lg): Primary /logos/logo.webp with original aspect ratio */}
          <div className="hidden h-[84px] items-center justify-between gap-4 lg:flex">
            <Link
              href="/"
              className="flex shrink-0 items-center"
              aria-label={`${trustNameEn} | ${trustNameTa}`}
            >
              <img
                src={desktopLogoSrc}
                alt={`${trustNameEn} | ${trustNameTa}`}
                className="h-[54px] w-auto object-contain object-left xl:h-[62px]"
              />
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
                    className={`rounded-xl px-2.5 py-2 font-semibold whitespace-nowrap transition xl:px-3 ${
                      lang === 'ta' ? 'text-[12.5px]' : 'text-[13.5px]'
                    } ${
                      isActive
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
                className="inline-flex items-center rounded-full border border-sand-200 bg-sand-100 p-1 shadow-xs"
              >
                <button
                  type="button"
                  onClick={() => setLang('en')}
                  aria-pressed={lang === 'en'}
                  aria-label="Switch to English"
                  className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                    lang === 'en' ? 'bg-brand-900 text-white shadow-xs' : 'text-slate-600 hover:text-brand-900'
                  }`}
                >
                  En
                </button>
                <button
                  type="button"
                  onClick={() => setLang('ta')}
                  aria-pressed={lang === 'ta'}
                  aria-label="தமிழுக்கு மாற்று"
                  className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                    lang === 'ta' ? 'bg-brand-900 text-white shadow-xs' : 'text-slate-600 hover:text-brand-900'
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
      </header>

      {/* Full-Height Mobile Left Slide-In Drawer (outside transformed <header> for true 100dvh) */}
      <div
        aria-hidden={!drawerOpen}
        className={`print:hidden fixed inset-0 z-50 lg:hidden ${
          drawerOpen ? 'pointer-events-auto visible' : 'pointer-events-none invisible delay-300'
        }`}
      >
        {/* Smooth Fade Backdrop */}
        <div
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
          className={`fixed inset-0 bg-brand-950/55 backdrop-blur-xs transition-opacity duration-300 ease-out ${
            drawerOpen ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Smooth Left-Slide Panel */}
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
          className={`fixed inset-y-0 left-0 flex h-[100dvh] w-[min(86vw,340px)] flex-col border-r border-sand-200 bg-white shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            drawerOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Drawer Brand Top Bar */}
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-sand-200 bg-sand-50/70 px-4 py-3.5">
            <Link
              href="/"
              onClick={() => setDrawerOpen(false)}
              className="flex min-w-0 items-center"
              aria-label={lang === 'ta' ? trustNameTa : trustNameEn}
            >
              <img
                src={mobileLogoSrc}
                alt={lang === 'ta' ? trustNameTa : trustNameEn}
                className="h-10 w-auto max-w-[190px] object-contain object-left"
              />
            </Link>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label={ui.close}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-sand-200 bg-white text-brand-900 shadow-xs transition hover:bg-sand-100 active:scale-95"
            >
              <X className="h-5 w-5" strokeWidth={2.2} />
            </button>
          </div>

          {/* Scrollable Links + Actions */}
          <nav className="flex-1 overflow-y-auto overscroll-contain px-3.5 py-4">
            <div className="flex flex-col gap-1">
              {headerLinks.map((item) => {
                const isActive =
                  item.href === '/'
                    ? pathname === '/'
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);
                const label = lang === 'ta' ? item.label_ta : item.label_en;
                const Icon = DRAWER_ICON_MAP[item.href] || ChevronRight;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setDrawerOpen(false)}
                    className={`group flex items-center justify-between gap-3 rounded-2xl px-3.5 py-3 text-sm font-semibold transition active:scale-[0.99] ${
                      isActive
                        ? 'bg-brand-900 font-bold text-white shadow-sm'
                        : 'text-slate-700 hover:bg-sand-100 hover:text-brand-900'
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition ${
                          isActive ? 'bg-white/15 text-saffron-300' : 'bg-sand-100 text-brand-800 group-hover:bg-white'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="truncate">{label}</span>
                    </span>
                    <ChevronRight className={`h-4 w-4 shrink-0 ${isActive ? 'text-white/80' : 'text-slate-400'}`} />
                  </Link>
                );
              })}

              {/* Dedicated Volunteer Link */}
              <Link
                href="/volunteer"
                onClick={() => setDrawerOpen(false)}
                className={`group flex items-center justify-between gap-3 rounded-2xl px-3.5 py-3 text-sm font-semibold transition active:scale-[0.99] ${
                  pathname === '/volunteer'
                    ? 'bg-brand-900 font-bold text-white shadow-sm'
                    : 'text-slate-700 hover:bg-sand-100 hover:text-brand-900'
                }`}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition ${
                      pathname === '/volunteer' ? 'bg-white/15 text-saffron-300' : 'bg-sand-100 text-brand-800 group-hover:bg-white'
                    }`}
                  >
                    <Users className="h-4 w-4" />
                  </span>
                  <span className="truncate">{ui.volunteer}</span>
                </span>
                <ChevronRight className={`h-4 w-4 shrink-0 ${pathname === '/volunteer' ? 'text-white/80' : 'text-slate-400'}`} />
              </Link>
            </div>

            {donationsEnabled && (
              <Link
                href="/donate"
                onClick={() => {
                  setDrawerOpen(false);
                  trackEvent('nav_donate_click', { location: 'mobile_drawer' });
                }}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-saffron-600 px-4 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-saffron-700 active:scale-[0.99]"
              >
                <Heart className="h-4 w-4 shrink-0" />
                <span>{ui.donateNow}</span>
              </Link>
            )}

            {/* Quick Contact + Social Media Icons */}
            <div className="mt-5 space-y-3.5 border-t border-sand-200 pt-4">
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`tel:${phone.replace(/[^\d+]/g, '')}`}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-sand-200 bg-sand-50 px-3 py-2.5 text-xs font-bold text-brand-900 transition hover:bg-sand-100"
                >
                  <Phone className="h-3.5 w-3.5 text-saffron-600" />
                  <span>{lang === 'ta' ? 'அழைக்க' : 'Call'}</span>
                </a>
                <a
                  href="https://wa.me/919363015050"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span>WhatsApp</span>
                </a>
              </div>

              {socialLinks.length > 0 && (
                <div>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    {ui.followUs}
                  </p>
                  <SocialLinksRow links={socialLinks} variant="light" />
                </div>
              )}
            </div>
          </nav>

          {/* Drawer Sticky Footer Bar */}
          <div className="shrink-0 border-t border-sand-200 bg-sand-50/90 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold text-slate-600">
              <span className="truncate">{ui.trustNotice}</span>
              <div className="flex items-center gap-2.5 font-bold text-brand-800">
                <Link href="/privacy-policy" onClick={() => setDrawerOpen(false)} className="hover:underline">
                  {lang === 'ta' ? 'தனியுரிமை' : 'Privacy'}
                </Link>
                <Link href="/terms" onClick={() => setDrawerOpen(false)} className="hover:underline">
                  {lang === 'ta' ? 'விதிகள்' : 'Terms'}
                </Link>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
