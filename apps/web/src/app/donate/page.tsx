import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Check, Heart, Lock, ShieldCheck } from 'lucide-react';
import { isDonationsEnabled, parseDonationConfig } from '@ilangathir/shared';
import { getBootstrap } from '@/lib/api';
import { getUi } from '@/lib/i18n';
import { getServerLang } from '@/lib/lang-server';
import { buildBreadcrumbJsonLd, buildFaqJsonLd, buildPageMetadata, buildWebPageJsonLd } from '@/lib/seo';
import { DONATE_FAQS, PERMANENT_PAGES } from '@/lib/site-content';
import { PageHeader } from '@/components/PageHeader';
import { DonationCheckout } from '@/components/DonationCheckout';
import { FaqSection } from '@/components/FaqSection';

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ lang?: string }> }): Promise<Metadata> {
  const [lang, bootstrap] = await Promise.all([getServerLang((await searchParams).lang), getBootstrap()]);
  const donationsEnabled = isDonationsEnabled(bootstrap.settings);
  if (!donationsEnabled) {
    return buildPageMetadata({
      title: 'Page Not Found | Ilangathir Trust',
      description: 'This page is currently unavailable.',
      path: '/donate',
      lang,
      noIndex: true
    });
  }

  const p = PERMANENT_PAGES.donate;
  return buildPageMetadata({
    title: lang === 'ta' ? p.seo_title_ta : p.seo_title_en,
    description: lang === 'ta' ? p.seo_description_ta : p.seo_description_en,
    keywords: lang === 'ta' ? p.keywords_ta : p.keywords_en,
    path: '/donate',
    lang
  });
}

export default async function DonatePage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const [lang, bootstrap] = await Promise.all([getServerLang((await searchParams).lang), getBootstrap()]);
  const donationsEnabled = isDonationsEnabled(bootstrap.settings);

  // Completely hide the donations page when disabled from the admin backend
  if (!donationsEnabled) {
    notFound();
  }

  const ui = getUi(lang);
  const p = PERMANENT_PAGES.donate;
  const donationCfg = parseDonationConfig(bootstrap.settings);

  const faqJsonLd = buildFaqJsonLd(DONATE_FAQS, lang);
  const webPageJsonLd = buildWebPageJsonLd({
    title: lang === 'ta' ? p.seo_title_ta : p.seo_title_en,
    description: lang === 'ta' ? p.seo_description_ta : p.seo_description_en,
    path: '/donate',
    lang
  });
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: ui.home, path: '/' },
    { name: ui.donateNow, path: '/donate' }
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}

      <PageHeader
        crumbs={[{ label: ui.donateNow }]}
        eyebrow={lang === 'ta' ? p.eyebrow_ta : p.eyebrow_en}
        title={lang === 'ta' ? p.title_ta : p.title_en}
        subtitle={lang === 'ta' ? p.subtitle_ta : p.subtitle_en}
        icon={Heart}
      />

      <section className="bg-sand-50 py-12 sm:py-14 lg:py-16">
        <div className="container-max grid gap-8 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-8">
            <DonationCheckout
              suggestedAmounts={donationCfg.suggested_amounts}
              purposes={donationCfg.purposes}
            />
          </div>

          <aside className="min-w-0 space-y-5 lg:col-span-4">
            <div className="trust-card p-5 sm:p-6">
              <ShieldCheck className="h-7 w-7 text-forest-600" />
              <h2 className="mt-3 font-heading text-lg font-bold text-brand-900">
                {lang === 'ta' ? 'பாதுகாப்பான நன்கொடை' : 'Safe & Direct Contributions'}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {lang === 'ta'
                  ? 'UPI, டெபிட்/கிரெடிட் கார்டு மற்றும் நெட் பேங்கிங் மூலம் எளிதாகவும் பாதுகாப்பாகவும் நன்கொடை வழங்கலாம். உடனே ரசீது எண் கிடைக்கும்.'
                  : 'Payments work smoothly via UPI, debit/credit cards, and netbanking, with instant verified receipt numbers generated automatically.'}
              </p>
            </div>

            <div className="trust-card p-5 sm:p-6">
              <Lock className="h-6 w-6 text-saffron-600" />
              <h3 className="mt-3 font-heading text-base font-bold text-brand-900">
                {lang === 'ta' ? 'உங்கள் உதவி சேரும் இடங்கள்' : 'Where Funds Are Used'}
              </h3>
              <ul className="mt-3 space-y-2.5 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-forest-600" />
                  <span>{lang === 'ta' ? 'பள்ளி மாணவர்களுக்குப் புத்தகம் & கல்வி உதவி' : 'School supplies and student support'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-forest-600" />
                  <span>{lang === 'ta' ? 'கிராமப்புற இலவச மருத்துவ & கண் முகாம்' : 'Free village medical and eye care camps'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-forest-600" />
                  <span>{lang === 'ta' ? 'மரம் நடுதல் & அவசர கால நிவாரண உதவி' : 'Tree planting and community relief'}</span>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </section>

      <FaqSection faqs={DONATE_FAQS} />
    </>
  );
}
