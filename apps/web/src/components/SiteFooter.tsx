'use client';

import Link from 'next/link';
import { Heart, Mail, MapPin, Phone, ShieldCheck } from 'lucide-react';
import { useLanguage } from './LanguageProvider';
import { getUi } from '@/lib/i18n';

interface SiteFooterProps {
  logoUrl: string;
  trustNameEn: string;
  trustNameTa: string;
  footerDescEn: string;
  footerDescTa: string;
  phone: string;
  email: string;
  addressEn: string;
  addressTa: string;
}

export function SiteFooter(props: SiteFooterProps) {
  const { lang } = useLanguage();
  const ui = getUi(lang);

  return (
    <footer className="border-t border-slate-200 bg-slate-50 pb-24 pt-14 text-slate-600 lg:pb-10">
      <div className="container-max">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-4">
            <Link href="/" className="flex items-center gap-3">
              <img
                src={props.logoUrl || '/assets/ilangathir-logo.jpg'}
                alt={props.trustNameEn}
                className="h-12 w-12 rounded-full border border-slate-200 object-cover"
              />
              <div>
                <p className="font-heading text-base font-bold text-slate-900">
                  {lang === 'ta' ? props.trustNameTa : props.trustNameEn}
                </p>
                <p className="text-xs font-semibold text-brand-700">
                  {lang === 'ta' ? props.trustNameEn : props.trustNameTa}
                </p>
              </div>
            </Link>
            <p className="text-sm leading-relaxed text-slate-600">
              {lang === 'ta' ? props.footerDescTa : props.footerDescEn}
            </p>
          </div>

          <div className="lg:col-span-2">
            <h3 className="font-heading text-xs font-bold uppercase tracking-widest text-slate-900">
              {ui.footerExplore}
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><Link href="/about" className="transition hover:text-brand-700">{ui.about}</Link></li>
              <li><Link href="/activities" className="transition hover:text-brand-700">{ui.activities}</Link></li>
              <li><Link href="/events" className="transition hover:text-brand-700">{ui.events}</Link></li>
              <li><Link href="/gallery" className="transition hover:text-brand-700">{ui.gallery}</Link></li>
              <li><Link href="/blog" className="transition hover:text-brand-700">{ui.blog}</Link></li>
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h3 className="font-heading text-xs font-bold uppercase tracking-widest text-slate-900">
              {ui.footerSupport}
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link href="/donate" className="inline-flex items-center gap-1.5 font-semibold text-brand-700 transition hover:text-brand-900">
                  <Heart className="h-3.5 w-3.5" />
                  <span>{ui.donateNow}</span>
                </Link>
              </li>
              <li><Link href="/contact#volunteer" className="transition hover:text-brand-700">{ui.volunteer}</Link></li>
              <li><Link href="/contact" className="transition hover:text-brand-700">{ui.contact}</Link></li>
              <li>
                <a
                  href={process.env.NEXT_PUBLIC_ADMIN_URL || 'https://admin.ilangathirtrust.org'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-slate-500 transition hover:text-brand-700"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>{lang === 'ta' ? 'நிர்வாகப் பக்கம்' : 'Admin Portal'}</span>
                </a>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-4">
            <h3 className="font-heading text-xs font-bold uppercase tracking-widest text-slate-900">
              {ui.footerContact}
            </h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <a
                  href={`tel:${props.phone.replace(/[^\d+]/g, '')}`}
                  className="flex items-start gap-2.5 transition hover:text-brand-700"
                >
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" />
                  <span>{props.phone}</span>
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${props.email}`}
                  className="flex items-start gap-2.5 break-all transition hover:text-brand-700"
                >
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" />
                  <span>{props.email}</span>
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" />
                <span>{lang === 'ta' ? props.addressTa : props.addressEn}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-slate-200 pt-6 text-center text-xs text-slate-500 sm:flex-row sm:text-left">
          <p>
            © {new Date().getFullYear()} {lang === 'ta' ? props.trustNameTa : props.trustNameEn}. {ui.allRightsReserved}
          </p>
          <p>{ui.trustNotice}</p>
        </div>
      </div>
    </footer>
  );
}
