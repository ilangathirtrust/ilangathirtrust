import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Clock, ExternalLink, HeartHandshake, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { getEnabledSocialLinks, TRUST_INFO } from '@ilangathir/shared';
import { getBootstrap } from '@/lib/api';
import { getUi } from '@/lib/i18n';
import { getServerLang } from '@/lib/lang-server';
import { buildBreadcrumbJsonLd, buildPageMetadata, buildWebPageJsonLd } from '@/lib/seo';
import { PERMANENT_PAGES, SITE_SETTINGS, pickText } from '@/lib/site-content';
import { PageHeader } from '@/components/PageHeader';
import { ContactEnquiryForm } from '@/components/ContactForms';
import { SocialLinksRow } from '@/components/SocialLinksRow';

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ lang?: string }> }): Promise<Metadata> {
  const lang = await getServerLang((await searchParams).lang);
  const p = PERMANENT_PAGES.contact;
  return buildPageMetadata({
    title: lang === 'ta' ? p.seo_title_ta : p.seo_title_en,
    description: lang === 'ta' ? p.seo_description_ta : p.seo_description_en,
    keywords: lang === 'ta' ? p.keywords_ta : p.keywords_en,
    path: '/contact',
    lang
  });
}

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const [lang, bootstrap] = await Promise.all([getServerLang((await searchParams).lang), getBootstrap()]);
  const ui = getUi(lang);
  const p = PERMANENT_PAGES.contact;
  const socialLinks = getEnabledSocialLinks(bootstrap.settings);

  const phone = SITE_SETTINGS.phone.value_en;
  const email = SITE_SETTINGS.email.value_en;
  const address = pickText(SITE_SETTINGS.address, lang);
  const hours = pickText(SITE_SETTINGS.office_hours, lang);
  const mapsDirectionsUrl = 'https://www.google.com/maps/search/?api=1&query=V.+Kallupatti,+Dindigul,+Tamil+Nadu+624307';
  const mapsEmbedUrl = 'https://maps.google.com/maps?q=V.%20Kallupatti,%20Dindigul,%20Tamil%20Nadu%20624307&t=&z=13&ie=UTF8&iwloc=&output=embed';

  const webPageJsonLd = buildWebPageJsonLd({
    title: lang === 'ta' ? p.seo_title_ta : p.seo_title_en,
    description: lang === 'ta' ? p.seo_description_ta : p.seo_description_en,
    path: '/contact',
    lang,
    type: 'ContactPage'
  });
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: ui.home, path: '/' },
    { name: ui.contact, path: '/contact' }
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <PageHeader
        crumbs={[{ label: ui.contact }]}
        eyebrow={lang === 'ta' ? p.eyebrow_ta : p.eyebrow_en}
        title={lang === 'ta' ? p.title_ta : p.title_en}
        subtitle={lang === 'ta' ? p.subtitle_ta : p.subtitle_en}
        icon={Mail}
      />

      <section className="bg-sand-50 py-12 sm:py-14 lg:py-16">
        <div className="container-max space-y-10 sm:space-y-12">
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="min-w-0 space-y-4 lg:col-span-5">
              <div className="trust-card p-5">
                <div className="flex items-start gap-3.5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-saffron-50 text-saffron-600">
                    <Phone className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      {lang === 'ta' ? 'தொலைபேசி' : 'Call Us'}
                    </p>
                    <a href={`tel:${phone.replace(/[^\d+]/g, '')}`} className="mt-1 block font-heading text-base font-bold text-brand-900 hover:text-saffron-600">
                      {phone}
                    </a>
                  </div>
                </div>
              </div>

              <div className="trust-card p-5">
                <div className="flex items-start gap-3.5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-800">
                    <Mail className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      {lang === 'ta' ? 'மின்னஞ்சல்' : 'Email Us'}
                    </p>
                    <a href={`mailto:${email}`} className="mt-1 block break-all font-heading text-base font-bold text-brand-900 hover:text-saffron-600">
                      {email}
                    </a>
                  </div>
                </div>
              </div>

              <div className="trust-card p-5">
                <div className="flex items-start gap-3.5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-forest-50 text-forest-700">
                    <MapPin className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      {lang === 'ta' ? 'முகவரி' : 'Trust Address'}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">{address}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-sand-200 bg-sand-100/80 p-5 text-sm text-slate-700">
                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-5 w-5 shrink-0 text-saffron-600" />
                  <p className="font-medium">{hours}</p>
                </div>
              </div>

              <div className="trust-card p-5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    {lang === 'ta' ? 'விரைவு வாட்ஸ்அப் & சமூக வலைதளங்கள்' : 'WhatsApp & Social Channels'}
                  </p>
                  <span className="text-[11px] font-bold text-saffron-700">{TRUST_INFO.handle}</span>
                </div>
                <a
                  href="https://wa.me/919363015050"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-xs transition hover:bg-emerald-700 active:scale-[0.99]"
                >
                  <MessageCircle className="h-4 w-4 shrink-0" />
                  <span>{ui.chatWhatsapp} (+91 93630 15050)</span>
                </a>
                {socialLinks.length > 0 && (
                  <SocialLinksRow links={socialLinks} showLabels className="mt-3" />
                )}
              </div>
            </div>

            <div className="min-w-0 lg:col-span-7">
              <ContactEnquiryForm />
            </div>
          </div>

          {/* Embedded Location Map for V. Kallupatti, Dindigul */}
          <div className="trust-card overflow-hidden p-4 sm:p-6">
            <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div className="min-w-0">
                <span className="section-kicker">{lang === 'ta' ? 'எங்கள் இருப்பிடம்' : 'OFFICE LOCATION'}</span>
                <h2 className="mt-1 font-heading text-lg font-bold text-brand-900 sm:text-xl">
                  {lang === 'ta' ? 'V. கல்லுப்பட்டி, திண்டுக்கல் — 624307' : 'V. Kallupatti, Dindigul — 624307, Tamil Nadu'}
                </h2>
              </div>
              <a
                href={mapsDirectionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-xs font-bold text-brand-900 transition hover:bg-brand-100"
              >
                <MapPin className="h-4 w-4 text-saffron-600" />
                <span>{ui.openInMaps}</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
            <div className="overflow-hidden rounded-2xl border border-sand-200 bg-sand-100">
              <iframe
                title="Ilangathir Trust Location — V. Kallupatti, Dindigul"
                src={mapsEmbedUrl}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-64 w-full border-0 sm:h-80"
              />
            </div>
          </div>

          {/* Separate Volunteer Page Invitation Card */}
          <div className="flex flex-col items-start justify-between gap-5 rounded-3xl border border-brand-200 bg-gradient-to-r from-brand-900 to-brand-950 p-6 text-white shadow-md sm:flex-row sm:items-center sm:p-8">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-saffron-500/20 text-saffron-400">
                <HeartHandshake className="h-6 w-6" />
              </span>
              <div className="min-w-0">
                <h2 className="font-heading text-lg font-bold text-white sm:text-xl">
                  {lang === 'ta' ? 'தன்னார்வலராக இணைய விரும்புகிறீர்களா?' : 'Want to Join Us as a Volunteer?'}
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-sand-200/90 sm:text-sm">
                  {lang === 'ta'
                    ? 'திண்டுக்கல் மற்றும் சுற்றியுள்ள பகுதிகளில் கல்வி, மருத்துவ முகாம் மற்றும் மரம் நடுதல் பணிகளில் இணையுங்கள்.'
                    : 'Register on our dedicated Volunteer page to support education drives, medical camps, and relief across Dindigul.'}
                </p>
              </div>
            </div>
            <Link
              href="/volunteer"
              className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-saffron-500 px-5 py-3 text-sm font-bold text-brand-950 transition hover:bg-saffron-400 sm:w-auto"
            >
              <span>{ui.volunteer}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
