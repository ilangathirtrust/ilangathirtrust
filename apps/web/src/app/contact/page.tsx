import type { Metadata } from 'next';
import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import { getUi } from '@/lib/i18n';
import { getServerLang } from '@/lib/lang-server';
import { buildBreadcrumbJsonLd, buildPageMetadata } from '@/lib/seo';
import { PERMANENT_PAGES, SITE_SETTINGS, pickText } from '@/lib/site-content';
import { PageHeader } from '@/components/PageHeader';
import { ContactEnquiryForm, VolunteerForm } from '@/components/ContactForms';

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ lang?: string }> }): Promise<Metadata> {
  const lang = await getServerLang((await searchParams).lang);
  const p = PERMANENT_PAGES.contact;
  return buildPageMetadata({
    title: lang === 'ta' ? p.seo_title_ta : p.seo_title_en,
    description: lang === 'ta' ? p.seo_description_ta : p.seo_description_en,
    path: '/contact',
    lang
  });
}

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const lang = await getServerLang((await searchParams).lang);
  const ui = getUi(lang);
  const p = PERMANENT_PAGES.contact;

  const phone = SITE_SETTINGS.phone.value_en;
  const email = SITE_SETTINGS.email.value_en;
  const address = pickText(SITE_SETTINGS.address, lang);
  const hours = pickText(SITE_SETTINGS.office_hours, lang);

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: ui.home, path: '/' },
    { name: ui.contact, path: '/contact' }
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <PageHeader
        crumbs={[{ label: ui.contact }]}
        eyebrow={lang === 'ta' ? p.eyebrow_ta : p.eyebrow_en}
        title={lang === 'ta' ? p.title_ta : p.title_en}
        subtitle={lang === 'ta' ? p.subtitle_ta : p.subtitle_en}
        icon={Mail}
      />

      <section className="bg-white py-14 lg:py-16">
        <div className="container-max space-y-12">
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-5">
              <div className="editorial-card p-5">
                <div className="flex items-start gap-3.5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                    <Phone className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      {lang === 'ta' ? 'தொலைபேசி' : 'Call Us'}
                    </p>
                    <a href={`tel:${phone.replace(/[^\d+]/g, '')}`} className="mt-1 block font-heading text-base font-bold text-slate-900 hover:text-brand-700">
                      {phone}
                    </a>
                  </div>
                </div>
              </div>

              <div className="editorial-card p-5">
                <div className="flex items-start gap-3.5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                    <Mail className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      {lang === 'ta' ? 'மின்னஞ்சல்' : 'Email Us'}
                    </p>
                    <a href={`mailto:${email}`} className="mt-1 block break-all font-heading text-base font-bold text-slate-900 hover:text-brand-700">
                      {email}
                    </a>
                  </div>
                </div>
              </div>

              <div className="editorial-card p-5">
                <div className="flex items-start gap-3.5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                    <MapPin className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      {lang === 'ta' ? 'முகவரி' : 'Trust Address'}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">{address}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" />
                  <p className="font-medium">{hours}</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <ContactEnquiryForm />
            </div>
          </div>

          <VolunteerForm />
        </div>
      </section>
    </>
  );
}
