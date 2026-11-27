'use client';

import Link from 'next/link';
import { Heart, Mail, MapPin, Phone } from 'lucide-react';
import { useLanguage } from './LanguageProvider';
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
}

export function SiteFooter(props: SiteFooterProps) {
  const { lang } = useLanguage();
  const ui = getUi(lang);

  const mobileWhiteLogo = lang === 'ta' ? STATIC_ASSETS.logoWhiteTam : STATIC_ASSETS.logoWhiteEng;

  return (
    <footer className="border-t border-brand-800 bg-brand-950 pb-24 pt-14 text-sand-200 lg:pb-10">
      <div className="container-max">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-5">
            <Link
              href="/"
              className="inline-flex items-center"
              aria-label={lang === 'ta' ? props.trustNameTa : props.trustNameEn}
            >
              <img
                src={mobileWhiteLogo}
                alt={lang === 'ta' ? props.trustNameTa : props.trustNameEn}
                className="h-11 w-auto object-contain object-left lg:hidden"
              />
              <img
                src={STATIC_ASSETS.logoWhite}
                alt={`${props.trustNameEn} | ${props.trustNameTa}`}
                className="hidden h-16 w-auto object-contain object-left lg:block xl:h-[72px]"
              />
            </Link>
            <p className="max-w-md text-sm leading-relaxed text-sand-200/85">
              {lang === 'ta' ? props.footerDescTa : props.footerDescEn}
            </p>
          </div>

          <div className="lg:col-span-2">
            <h3 className="font-heading text-xs font-bold uppercase tracking-widest text-saffron-400">
              {ui.footerExplore}
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><Link href="/about" className="text-sand-200/90 transition hover:text-white">{ui.about}</Link></li>
              <li><Link href="/activities" className="text-sand-200/90 transition hover:text-white">{ui.activities}</Link></li>
              <li><Link href="/events" className="text-sand-200/90 transition hover:text-white">{ui.events}</Link></li>
              <li><Link href="/gallery" className="text-sand-200/90 transition hover:text-white">{ui.gallery}</Link></li>
              <li><Link href="/blog" className="text-sand-200/90 transition hover:text-white">{ui.blog}</Link></li>
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h3 className="font-heading text-xs font-bold uppercase tracking-widest text-saffron-400">
              {ui.footerSupport}
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {props.donationsEnabled && (
                <li>
                  <Link href="/donate" className="inline-flex items-center gap-1.5 font-semibold text-saffron-400 transition hover:text-saffron-300">
                    <Heart className="h-3.5 w-3.5" />
                    <span>{ui.donateNow}</span>
                  </Link>
                </li>
              )}
              <li><Link href="/contact#volunteer" className="text-sand-200/90 transition hover:text-white">{ui.volunteer}</Link></li>
              <li><Link href="/contact" className="text-sand-200/90 transition hover:text-white">{ui.contact}</Link></li>
            </ul>
          </div>

          <div className="lg:col-span-3">
            <h3 className="font-heading text-xs font-bold uppercase tracking-widest text-saffron-400">
              {ui.footerContact}
            </h3>
            <ul className="mt-4 space-y-3 text-sm">
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

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-center text-xs text-sand-300/75 sm:flex-row sm:text-left">
          <p>
            © {new Date().getFullYear()} {lang === 'ta' ? props.trustNameTa : props.trustNameEn}. {ui.allRightsReserved}
          </p>
          <p>{ui.trustNotice}</p>
        </div>
      </div>
    </footer>
  );
}
