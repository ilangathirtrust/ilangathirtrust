import type { Metadata } from 'next';
import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import { getBootstrap } from '@/lib/api';
import { getUi } from '@/lib/i18n';
import { getServerLang } from '@/lib/lang-server';
import { buildBreadcrumbJsonLd, buildPageMetadata, buildWebPageJsonLd } from '@/lib/seo';
import { PERMANENT_PAGES, SITE_SETTINGS, pickText } from '@/lib/site-content';
import { PageHeader } from '@/components/PageHeader';
import { ContactEnquiryForm, VolunteerForm } from '@/components/ContactForms';

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
  const settings = bootstrap.settings;

  const phone = settings.phone?.value_en || SITE_SETTINGS.phone.value_en;
  const email = settings.email?.value_en || SITE_SETTINGS.email.value_en;
  const address = pickText(settings.address || SITE_SETTINGS.address, lang);
  const hours = pickText(settings.office_hours || SITE_SETTINGS.office_hours, lang);

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
            </div>

            <div className="min-w-0 lg:col-span-7">
              <ContactEnquiryForm />
            </div>
          </div>

          <VolunteerForm />
        </div>
      </section>
    </>
  );
}
