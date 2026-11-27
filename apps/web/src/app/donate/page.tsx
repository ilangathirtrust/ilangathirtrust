import type { Metadata } from 'next';
import { Heart, Lock, ShieldCheck, Sparkles } from 'lucide-react';
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
    title: (page && pickLocalized(page as unknown as Record<string, unknown>, 'seo_title', lang)) || (lang === 'ta' ? 'நன்கொடை வழங்க | இளங்கதிர் அறக்கட்டளை' : 'Donate | Ilangathir Trust'),
    description: (page && pickLocalized(page as unknown as Record<string, unknown>, 'seo_description', lang)) || (lang === 'ta' ? 'Razorpay மூலம் பாதுகாப்பாக நன்கொடை வழங்குங்கள்.' : 'Support Ilangathir Trust securely online via Razorpay.'),
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
        eyebrow={lang === 'ta' ? 'உதவிக்கரம் நீட்டுங்கள்' : 'MAKE AN IMPACT'}
        title={heroTitle}
        subtitle={heroSub}
        icon={Heart}
        dark
      />

      <section className="bg-ivory-100 py-14 lg:py-20">
        <div className="container-max grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <DonationCheckout suggestedAmounts={suggestedAmounts} purposes={purposes} />
          </div>

          <aside className="space-y-5 lg:col-span-4">
            <div className="editorial-card p-6">
              <ShieldCheck className="h-8 w-8 text-tealcare-700" />
              <h2 className="mt-3 font-heading text-lg font-bold text-slate-900">
                {lang === 'ta' ? 'பாதுகாப்பான & வெளிப்படையான நன்கொடை' : 'Safe & Transparent Giving'}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {lang === 'ta'
                  ? 'அனைத்து ஆன்லைன் பரிவர்த்தனைகளும் Razorpay மூலம் UPI, கார்டு மற்றும் நெட் பேங்கிங் வழியாக சர்வர் சரிபார்ப்புடன் பாதுகாக்கப்படுகின்றன.'
                  : 'Every transaction is processed over encrypted Razorpay Checkout (UPI, Cards, NetBanking) with server-side signature verification and instant receipt numbers.'}
              </p>
            </div>

            <div className="editorial-card p-6">
              <Lock className="h-7 w-7 text-brand-700" />
              <h3 className="mt-3 font-heading text-base font-bold text-slate-900">
                {lang === 'ta' ? 'நேரடி சமூகப் பயன்பாடு' : 'Direct Community Utilization'}
              </h3>
              <ul className="mt-3 space-y-2.5 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <Sparkles className="mt-1 h-4 w-4 shrink-0 text-amberwarm-600" />
                  <span>{lang === 'ta' ? 'மாணவர் கல்வி & எழுதுபொருள் உதவி' : 'Student school supplies & scholarships'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles className="mt-1 h-4 w-4 shrink-0 text-amberwarm-600" />
                  <span>{lang === 'ta' ? 'இலவச மருத்துவ & கண் சிகிச்சை முகாம்கள்' : 'Free rural medical & eye care camps'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles className="mt-1 h-4 w-4 shrink-0 text-amberwarm-600" />
                  <span>{lang === 'ta' ? 'மரம் நடுதல் & பேரிடர் நிவாரணம்' : 'Tree plantation & community relief drives'}</span>
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
