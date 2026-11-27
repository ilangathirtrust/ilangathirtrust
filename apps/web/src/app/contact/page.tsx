import type { Metadata } from 'next';
import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import { pickLocalized } from '@ilangathir/shared';
import { getBootstrap, getPageContent } from '@/lib/api';
import { getUi } from '@/lib/i18n';
import { getServerLang } from '@/lib/lang-server';
import { buildBreadcrumbJsonLd, buildPageMetadata } from '@/lib/seo';
import { PageHeader } from '@/components/PageHeader';
import { ContactEnquiryForm, VolunteerForm } from '@/components/ContactForms';

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ lang?: string }> }): Promise<Metadata> {
  const lang = await getServerLang((await searchParams).lang);
  const page = await getPageContent('contact');
  return buildPageMetadata({
    title: (page && pickLocalized(page as unknown as Record<string, unknown>, 'seo_title', lang)) || (lang === 'ta' ? 'தொடர்பு & தன்னார்வலர் | இளங்கதிர் அறக்கட்டளை' : 'Contact & Volunteer | Ilangathir Trust'),
    description: (page && pickLocalized(page as unknown as Record<string, unknown>, 'seo_description', lang)) || (lang === 'ta' ? 'இளங்கதிர் அறக்கட்டளையைத் தொடர்பு கொள்ளவும் அல்லது தன்னார்வலராக இணையவும்.' : 'Contact Ilangathir Trust or apply to volunteer in Tamil Nadu.'),
    path: '/contact',
    lang
  });
}

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const lang = await getServerLang((await searchParams).lang);
  const ui = getUi(lang);

  const [bootstrap, pageContent] = await Promise.all([
    getBootstrap(),
    getPageContent('contact')
  ]);

  const { settings } = bootstrap;
  const phone = settings.phone?.value_en || '+91 93630 15050';
  const email = settings.email?.value_en || 'ilangathirtrust@gmail.com';
  const address = (lang === 'ta' ? settings.address?.value_ta : settings.address?.value_en) || '';
  const hours = (lang === 'ta' ? settings.office_hours?.value_ta : settings.office_hours?.value_en) || '';

  const heroTitle = (pageContent && pickLocalized(pageContent as unknown as Record<string, unknown>, 'hero_title', lang)) || ui.contact;
  const heroSub = (pageContent && pickLocalized(pageContent as unknown as Record<string, unknown>, 'hero_subtitle', lang)) || '';

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: ui.home, path: '/' },
    { name: ui.contact, path: '/contact' }
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <PageHeader
        crumbs={[{ label: ui.contact }]}
        eyebrow={ui.contact}
        title={heroTitle}
        subtitle={heroSub}
        icon={Mail}
      />

      <section className="bg-ivory-100 py-14 lg:py-20">
        <div className="container-max space-y-12">
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-5">
              <div className="editorial-card p-5">
                <div className="flex items-start gap-3.5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                    <Phone className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
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
                    <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
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
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amberwarm-50 text-amberwarm-700">
                    <MapPin className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                      {lang === 'ta' ? 'முகவரி' : 'Trust Address'}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">{address}</p>
                  </div>
                </div>
              </div>

              {hours && (
                <div className="rounded-2xl border border-amberwarm-200 bg-amberwarm-50 p-5 text-sm text-amberwarm-900">
                  <div className="flex items-start gap-3">
                    <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amberwarm-700" />
                    <p className="font-medium">{hours}</p>
                  </div>
                </div>
              )}
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
