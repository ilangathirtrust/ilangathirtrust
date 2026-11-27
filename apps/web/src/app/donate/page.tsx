import type { Metadata } from 'next';
import { Heart, Lock, ShieldCheck, Sparkles } from 'lucide-react';
import { pickLocalized } from '@ilangathir/shared';
import { getBootstrap, getPageContent } from '@/lib/api';
import { getUi } from '@/lib/i18n';
import { getServerLang } from '@/lib/lang-server';
import { buildBreadcrumbJsonLd, buildFaqJsonLd, buildPageMetadata } from '@/lib/seo';
import { Breadcrumbs } from '@/components/Breadcrumbs';
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

      <section className="bg-gradient-to-br from-brand-950 via-brand-900 to-brand-700 py-12 text-white lg:py-16">
        <div className="container-max">
          <div className="text-slate-300 [&_a]:text-slate-200 [&_span]:text-white">
            <Breadcrumbs items={[{ label: ui.donateNow }]} />
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-amberwarm-300">
            <Heart className="h-3.5 w-3.5" />
            <span>{lang === 'ta' ? 'உதவிக்கரம் நீட்டுங்கள்' : 'MAKE AN IMPACT'}</span>
          </span>
          <h1 className="mt-3 max-w-3xl font-heading text-3xl font-extrabold text-white sm:text-5xl">
            {heroTitle}
          </h1>
          <p className="mt-4 max-w-2xl text-base text-slate-200 sm:text-lg">{heroSub}</p>
        </div>
      </section>

      <section className="bg-slate-50 py-14 lg:py-20">
        <div className="container-max grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <DonationCheckout suggestedAmounts={suggestedAmounts} purposes={purposes} />
          </div>

          <aside className="space-y-5 lg:col-span-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <ShieldCheck className="h-8 w-8 text-emerald-600" />
              <h2 className="mt-3 font-heading text-lg font-bold text-slate-900">
                {lang === 'ta' ? 'பாதுகாப்பான & வெளிப்படையான நன்கொடை' : 'Safe & Transparent Giving'}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {lang === 'ta'
                  ? 'அனைத்து ஆன்லைன் பரிவர்த்தனைகளும் Razorpay மூலம் UPI, கார்டு மற்றும் நெட் பேங்கிங் வழியாக சர்வர் சரிபார்ப்புடன் பாதுகாக்கப்படுகின்றன.'
                  : 'Every transaction is processed over encrypted Razorpay Checkout (UPI, Cards, NetBanking) with server-side signature verification and instant receipt numbers.'}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <Lock className="h-7 w-7 text-brand-600" />
              <h3 className="mt-3 font-heading text-base font-bold text-slate-900">
                {lang === 'ta' ? 'நேரடி சமூகப் பயன்பாடு' : 'Direct Community Utilization'}
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amberwarm-600" />
                  <span>{lang === 'ta' ? 'மாணவர் கல்வி & எழுதுபொருள் உதவி' : 'Student school supplies & scholarships'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amberwarm-600" />
                  <span>{lang === 'ta' ? 'இலவச மருத்துவ & கண் சிகிச்சை முகாம்கள்' : 'Free rural medical & eye care camps'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amberwarm-600" />
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
