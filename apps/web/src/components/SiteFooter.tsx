'use client';

import Link from 'next/link';
import { Heart, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { type SocialLinkItem } from '@ilangathir/shared';
import { useLanguage } from './LanguageProvider';
import { SocialLinksRow } from './SocialLinksRow';
import { getUi } from '@/lib/i18n';
import { STATIC_ASSETS } from '@/lib/site-content';

interface SiteFooterProps {
  trustNameEn: string;
  trustNameTa: string;
  footerDescEn: string;
  footerDescTa: string;
  phone: string;
  email: string;
  addressEn: string;
  addressTa: string;
  donationsEnabled: boolean;
  socialLinks: SocialLinkItem[];
}

export function SiteFooter(props: SiteFooterProps) {
  const { lang } = useLanguage();
  const ui = getUi(lang);

  return (
    <footer className="print:hidden border-t border-brand-800 bg-brand-950 pb-24 pt-10 text-sand-200 sm:pt-14 lg:pb-10">
      <div className="container-max">
        <div className="grid gap-8 sm:gap-10 lg:grid-cols-12">
          {/* Brand Logo Card (uses /logos/logo.webp on both Mobile and Desktop) */}
          <div className="space-y-4 lg:col-span-4">
            <Link
              href="/"
              className="inline-flex items-center rounded-2xl bg-white px-3.5 py-2 shadow-sm transition hover:opacity-95"
              aria-label={`${props.trustNameEn} | ${props.trustNameTa}`}
            >
              <img
                src={STATIC_ASSETS.logo}
                alt={`${props.trustNameEn} | ${props.trustNameTa}`}
                className="h-11 w-auto max-w-[220px] object-contain object-left sm:h-12 sm:max-w-none"
              />
            </Link>

            <p className="max-w-md text-xs leading-relaxed text-sand-200/85 sm:text-sm">
              {lang === 'ta' ? props.footerDescTa : props.footerDescEn}
            </p>

            {props.socialLinks.length > 0 && (
              <div className="pt-1">
                <p className="mb-2.5 text-[11px] font-bold uppercase tracking-widest text-saffron-400">
                  {ui.followUs}
                </p>
                <SocialLinksRow links={props.socialLinks} variant="dark" />
              </div>
            )}
          </div>

          {/* Mobile: Compact 2-Column Pages & Support | Desktop: Split Columns */}
          <div className="grid grid-cols-2 gap-6 sm:gap-8 lg:col-span-5">
            <div>
              <h3 className="font-heading text-xs font-bold uppercase tracking-widest text-saffron-400">
                {ui.footerExplore}
              </h3>
              <ul className="mt-3.5 space-y-2 text-xs sm:space-y-2.5 sm:text-sm">
                <li><Link href="/about" className="text-sand-200/90 transition hover:text-white">{ui.about}</Link></li>
                <li><Link href="/activities" className="text-sand-200/90 transition hover:text-white">{ui.activities}</Link></li>
                <li><Link href="/events" className="text-sand-200/90 transition hover:text-white">{ui.events}</Link></li>
                <li><Link href="/gallery" className="text-sand-200/90 transition hover:text-white">{ui.gallery}</Link></li>
                <li><Link href="/blog" className="text-sand-200/90 transition hover:text-white">{ui.blog}</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-heading text-xs font-bold uppercase tracking-widest text-saffron-400">
                {ui.footerSupport}
              </h3>
              <ul className="mt-3.5 space-y-2 text-xs sm:space-y-2.5 sm:text-sm">
                {props.donationsEnabled && (
                  <li>
                    <Link href="/donate" className="inline-flex items-center gap-1.5 font-semibold text-saffron-400 transition hover:text-saffron-300">
                      <Heart className="h-3.5 w-3.5 shrink-0" />
                      <span>{ui.donateNow}</span>
                    </Link>
                  </li>
                )}
                <li><Link href="/contact#volunteer" className="text-sand-200/90 transition hover:text-white">{ui.volunteer}</Link></li>
                <li><Link href="/contact" className="text-sand-200/90 transition hover:text-white">{ui.contact}</Link></li>
                <li className="pt-2 text-[10px] font-bold uppercase tracking-widest text-saffron-400/90 sm:text-[11px]">
                  {ui.footerLegal}
                </li>
                <li><Link href="/privacy-policy" className="text-sand-200/90 transition hover:text-white">{ui.privacyPolicy}</Link></li>
                <li><Link href="/terms" className="text-sand-200/90 transition hover:text-white">{ui.termsConditions}</Link></li>
                <li><Link href="/refund-policy" className="text-sand-200/90 transition hover:text-white">{ui.refundPolicy}</Link></li>
              </ul>
            </div>
          </div>

          {/* Structured Contact Card */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-5 lg:col-span-3 lg:border-0 lg:bg-transparent lg:p-0">
            <h3 className="font-heading text-xs font-bold uppercase tracking-widest text-saffron-400">
              {ui.footerContact}
            </h3>
            <ul className="mt-3.5 space-y-2.5 text-xs sm:space-y-3 sm:text-sm">
              <li>
                <a
                  href={`tel:${props.phone.replace(/[^\d+]/g, '')}`}
                  className="flex items-start gap-2.5 text-sand-200/90 transition hover:text-white"
                >
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-saffron-400" />
                  <span>{props.phone}</span>
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/919363015050"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2.5 font-semibold text-emerald-300 transition hover:text-emerald-200"
                >
                  <MessageCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{ui.chatWhatsapp}</span>
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${props.email}`}
                  className="flex items-start gap-2.5 break-all text-sand-200/90 transition hover:text-white"
                >
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-saffron-400" />
                  <span>{props.email}</span>
                </a>
              </li>
              <li className="flex items-start gap-2.5 text-sand-200/90">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-saffron-400" />
                <span>{lang === 'ta' ? props.addressTa : props.addressEn}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-9 flex flex-col items-center justify-between gap-2 border-t border-white/10 pt-5 text-center text-[11px] text-sand-300/75 sm:mt-12 sm:flex-row sm:pt-6 sm:text-left sm:text-xs">
          <p>
            © {new Date().getFullYear()} {lang === 'ta' ? props.trustNameTa : props.trustNameEn}. {ui.allRightsReserved}
          </p>
          <p>{ui.trustNotice}</p>
        </div>
      </div>
    </footer>
  );
}
