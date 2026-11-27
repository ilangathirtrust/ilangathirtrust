import type { Metadata } from 'next';
import { Check, Heart, Lock, ShieldCheck } from 'lucide-react';
import { pickLocalized } from '@ilangathir/shared';
import { getBootstrap, getPageContent } from '@/lib/api';
import { getUi } from '@/lib/i18n';
import { getServerLang } from '@/lib/lang-server';
import { buildBreadcrumbJsonLd, buildFaqJsonLd, buildPageMetadata } from '@/lib/seo';
import { PageHeader } from '@/components/PageHeader';
import { DonationCheckout } from '@/components/DonationCheckout';
import { FaqSection } from '@/components/FaqSection';

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ lang?: string }> }): Promise<Metadata> {
  const lang = await getServerLang((await searchParams).lang);
  const page = await getPageContent('donate');
  return buildPageMetadata({
    title: (page && pickLocalized(page as unknown as Record<string, unknown>, 'seo_title', lang)) || (lang === 'ta' ? 'நன்கொடை | இளங்கதிர் அறக்கட்டளை' : 'Donate | Ilangathir Trust'),
    description: (page && pickLocalized(page as unknown as Record<string, unknown>, 'seo_description', lang)) || (lang === 'ta' ? 'இளங்கதிர் அறக்கட்டளைக்கு பாதுகாப்பாக ஆன்லைன் நன்கொடை வழங்கவும்.' : 'Support Ilangathir Trust education, healthcare, and community programmes online.'),
    path: '/donate',
    lang
  });
}

export default async function DonatePage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const lang = await getServerLang((await searchParams).lang);
  const ui = getUi(lang);

  const [bootstrap, pageContent] = await Promise.all([
    getBootstrap(),
    getPageContent('donate')
  ]);

  const donationCfg = (bootstrap.settings.donation_config?.json_value || {}) as {
    suggested_amounts?: number[];
    purposes?: string[];
  };

  const suggestedAmounts = donationCfg.suggested_amounts?.length
    ? donationCfg.suggested_amounts
    : [500, 1000, 2500, 5000, 10000];
  const purposes = donationCfg.purposes?.length
    ? donationCfg.purposes
    : ['General Welfare', 'Education Support', 'Medical Relief', 'Environmental Care'];

  const heroTitle = (pageContent && pickLocalized(pageContent as unknown as Record<string, unknown>, 'hero_title', lang)) || ui.donateTitle;
  const heroSub = (pageContent && pickLocalized(pageContent as unknown as Record<string, unknown>, 'hero_subtitle', lang)) || ui.donateSubtitle;
  const faqs = pageContent?.faqs || [];
  const faqJsonLd = buildFaqJsonLd(faqs, lang);
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: ui.home, path: '/' },
    { name: ui.donateNow, path: '/donate' }
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}

      <PageHeader
        crumbs={[{ label: ui.donateNow }]}
        eyebrow={lang === 'ta' ? 'நன்கொடை' : 'CONTRIBUTE'}
        title={heroTitle}
        subtitle={heroSub}
        icon={Heart}
      />

      <section className="bg-white py-14 lg:py-16">
        <div className="container-max grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <DonationCheckout suggestedAmounts={suggestedAmounts} purposes={purposes} />
          </div>

          <aside className="space-y-5 lg:col-span-4">
            <div className="editorial-card p-6">
              <ShieldCheck className="h-7 w-7 text-brand-700" />
              <h2 className="mt-3 font-heading text-lg font-bold text-slate-900">
                {lang === 'ta' ? 'பாதுகாப்பான நன்கொடை' : 'Safe & Direct Contributions'}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {lang === 'ta'
                  ? 'UPI, டெபிட்/கிரெடிட் கார்டு மற்றும் நெட் பேங்கிங் மூலம் எளிதாகவும் பாதுகாப்பாகவும் நன்கொடை வழங்கலாம். உடனே ரசீது எண் கிடைக்கும்.'
                  : 'Payments work smoothly via UPI, debit/credit cards, and netbanking, with instant verified receipt numbers generated automatically.'}
              </p>
            </div>

            <div className="editorial-card p-6">
              <Lock className="h-6 w-6 text-brand-700" />
              <h3 className="mt-3 font-heading text-base font-bold text-slate-900">
                {lang === 'ta' ? 'உங்கள் உதவி சேரும் இடங்கள்' : 'Where Funds Are Used'}
              </h3>
              <ul className="mt-3 space-y-2.5 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-brand-700" />
                  <span>{lang === 'ta' ? 'பள்ளி மாணவர்களுக்குப் புத்தகம் & கல்வி உதவி' : 'School supplies and student support'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-brand-700" />
                  <span>{lang === 'ta' ? 'கிராமப்புற இலவச மருத்துவ & கண் முகாம்' : 'Free village medical and eye care camps'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-brand-700" />
                  <span>{lang === 'ta' ? 'மரம் நடுதல் & அவசர கால நிவாரண உதவி' : 'Tree planting and community relief'}</span>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </section>

      <FaqSection faqs={faqs} />
    </>
  );
}
