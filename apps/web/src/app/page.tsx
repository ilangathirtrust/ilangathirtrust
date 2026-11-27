import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  Eye,
  Heart,
  HeartHandshake,
  ShieldCheck,
  Target,
  Users
} from 'lucide-react';
import { isDonationsEnabled } from '@ilangathir/shared';
import { getBootstrap } from '@/lib/api';
import { getUi } from '@/lib/i18n';
import { getServerLang } from '@/lib/lang-server';
import { buildFaqJsonLd, buildPageMetadata, buildWebPageJsonLd } from '@/lib/seo';
import {
  getHomeFaqs,
  PERMANENT_PAGES,
  SITE_SETTINGS,
  STATIC_ASSETS,
  pickText
} from '@/lib/site-content';
import { FaqSection } from '@/components/FaqSection';
import {
  HomeActivitiesSection,
  HomeBlogsSection,
  HomeEventsSection,
  HomeGallerySection,
  HomeMarqueeSection
} from '@/components/DynamicSections';
import { LazyImage, LazyReveal } from '@/components/LazyPrimitives';
import {
  MarqueeSkeleton,
  SectionCardGridSkeleton,
  SectionFolderGridSkeleton
} from '@/components/Skeletons';

export async function generateMetadata({
  searchParams
}: {
  searchParams: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const lang = await getServerLang(sp.lang);
  const p = PERMANENT_PAGES.home;

  return buildPageMetadata({
    title: lang === 'ta' ? p.seo_title_ta : p.seo_title_en,
    description: lang === 'ta' ? p.seo_description_ta : p.seo_description_en,
    keywords: lang === 'ta' ? p.keywords_ta : p.keywords_en,
    path: '/',
    lang,
    ogImage: STATIC_ASSETS.logo
  });
}

export default async function HomePage({
  searchParams
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const sp = await searchParams;
  const [lang, bootstrap] = await Promise.all([getServerLang(sp.lang), getBootstrap()]);
  const ui = getUi(lang);
  const p = PERMANENT_PAGES.home;
  const settings = bootstrap.settings;
  const donationsEnabled = isDonationsEnabled(settings);

  const heroEyebrow = lang === 'ta' ? p.eyebrow_ta : p.eyebrow_en;
  const heroTitle = lang === 'ta' ? p.title_ta : p.title_en;
  const heroSubtitle = lang === 'ta' ? p.subtitle_ta : p.subtitle_en;
  const primaryCtaLabel = lang === 'ta' ? p.primary_cta_ta : p.primary_cta_en;
  const secondaryCtaLabel = lang === 'ta' ? p.secondary_cta_ta : p.secondary_cta_en;

  const founderName = pickText(settings.founder_name || SITE_SETTINGS.founder_name, lang);
  const founderRole = pickText(settings.founder_role || SITE_SETTINGS.founder_role, lang);
  const rawBio = pickText(settings.founder_bio || SITE_SETTINGS.founder_bio, lang);
  const founderBio =
    !rawBio || rawBio.includes('admin portal') || rawBio.includes('நிர்வாகப் பக்கத்தில்')
      ? pickText(SITE_SETTINGS.founder_bio, lang)
      : rawBio;
  const founderImg = settings.founder_image_url?.value_en || STATIC_ASSETS.founder;
  const mission = pickText(settings.mission_statement || SITE_SETTINGS.mission_statement, lang);
  const vision = pickText(settings.vision_statement || SITE_SETTINGS.vision_statement, lang);

  const faqs = getHomeFaqs(donationsEnabled);
  const faqJsonLd = buildFaqJsonLd(faqs, lang);
  const webPageJsonLd = buildWebPageJsonLd({
    title: lang === 'ta' ? p.seo_title_ta : p.seo_title_en,
    description: lang === 'ta' ? p.seo_description_ta : p.seo_description_en,
    path: '/',
    lang
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}

      {/* 1. HERO: Warm Sandstone Editorial Canvas with Crisp Mat Imagery */}
      <section className="relative overflow-hidden border-b border-sand-200 bg-gradient-to-br from-sand-100 via-sand-50 to-saffron-50/50">
        <div className="container-max py-9 sm:py-14 lg:py-16">
          <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-12">
            <div className="min-w-0 space-y-5 lg:col-span-7">
              <span className="inline-flex items-center gap-2 rounded-full border border-saffron-200 bg-white/90 px-3 py-1 text-[11px] font-bold text-saffron-700 shadow-2xs">
                <span className="h-1.5 w-1.5 rounded-full bg-saffron-600" />
                <span>{heroEyebrow}</span>
              </span>

              <h1
                className={`font-heading font-extrabold text-brand-900 ${
                  lang === 'ta'
                    ? 'text-[22px] leading-[1.38] min-[360px]:text-2xl sm:text-4xl lg:text-[40px]'
                    : 'text-[26px] leading-[1.16] tracking-tight min-[360px]:text-3xl sm:text-5xl lg:text-[48px]'
                }`}
              >
                {heroTitle}
              </h1>

              <p className="max-w-2xl text-sm leading-relaxed text-slate-600 min-[360px]:text-base sm:text-lg">
                {heroSubtitle}
              </p>

              {/* Dynamic CTAs responsive to Donations Enabled / Disabled */}
              <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:flex-wrap sm:items-center">
                {donationsEnabled ? (
                  <>
                    <Link
                      href="/donate"
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-saffron-600 px-6 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-saffron-700"
                    >
                      <Heart className="h-4 w-4 shrink-0" />
                      <span>{primaryCtaLabel}</span>
                    </Link>
                    <Link
                      href="/activities"
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-sand-300 bg-white px-6 py-3.5 text-sm font-bold text-brand-900 transition hover:border-brand-700"
                    >
                      <span>{secondaryCtaLabel}</span>
                      <ArrowRight className="h-4 w-4 shrink-0" />
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/activities"
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-900 px-6 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-800"
                    >
                      <span>{secondaryCtaLabel}</span>
                      <ArrowRight className="h-4 w-4 shrink-0" />
                    </Link>
                    <Link
                      href="/contact#volunteer"
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-sand-300 bg-white px-6 py-3.5 text-sm font-bold text-brand-900 transition hover:border-saffron-500"
                    >
                      <Users className="h-4 w-4 shrink-0 text-saffron-600" />
                      <span>{ui.volunteer}</span>
                    </Link>
                  </>
                )}
              </div>

              <div
                className={`grid gap-4 border-t border-sand-200 pt-5 ${
                  donationsEnabled ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-1 min-[360px]:grid-cols-2'
                }`}
              >
                <div>
                  <p className="font-heading text-sm font-bold text-brand-900 sm:text-base">
                    {lang === 'ta' ? 'பதிவு பெற்ற அறக்கட்டளை' : 'Registered Trust'}
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-slate-600">
                    {lang === 'ta' ? 'V. கல்லுப்பட்டி, திண்டுக்கல்' : 'V. Kallupatti, Dindigul'}
                  </p>
                </div>
                <div>
                  <p className="font-heading text-sm font-bold text-brand-900 sm:text-base">
                    {lang === 'ta' ? 'முக்கியப் பணிகள்' : 'Core Focus'}
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-slate-600">
                    {lang === 'ta' ? 'கல்வி • மருத்துவம் • உதவி' : 'Education • Health • Relief'}
                  </p>
                </div>
                {donationsEnabled && (
                  <div className="col-span-2 sm:col-span-1">
                    <p className="font-heading text-sm font-bold text-brand-900 sm:text-base">
                      {lang === 'ta' ? 'முறையான ரசீது' : 'Direct Receipts'}
                    </p>
                    <p className="mt-0.5 text-xs font-medium text-slate-600">
                      {lang === 'ta' ? 'பாதுகாப்பான ஆன்லைன் உதவி' : 'Verified Online Donations'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="min-w-0 lg:col-span-5">
              <div className="mx-auto max-w-md rounded-3xl border border-sand-200 bg-white p-2.5 shadow-[0_14px_40px_rgba(19,41,75,0.09)] lg:max-w-none">
                <div className="overflow-hidden rounded-2xl bg-sand-100">
                  <img
                    src={STATIC_ASSETS.hero}
                    alt={heroTitle}
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                    className="h-60 w-full object-cover min-[360px]:h-72 sm:h-[410px]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FOUR PRINCIPLES: Elevated White Cards on Warm Sand Surface */}
      <section className="border-b border-sand-200 bg-sand-100/60 py-10 sm:py-12">
        <div className="container-max">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Heart, title: ui.valCompassionTitle, desc: ui.valCompassionDesc, tone: 'bg-saffron-50 text-saffron-600' },
              { icon: ShieldCheck, title: ui.valEqualityTitle, desc: ui.valEqualityDesc, tone: 'bg-brand-50 text-brand-700' },
              { icon: Users, title: ui.valCommunityTitle, desc: ui.valCommunityDesc, tone: 'bg-forest-50 text-forest-700' },
              { icon: HeartHandshake, title: ui.valTransparencyTitle, desc: ui.valTransparencyDesc, tone: 'bg-saffron-50 text-saffron-700' }
            ].map((val, i) => {
              const Icon = val.icon;
              return (
                <div key={i} className="trust-card flex items-start gap-3.5 p-4 min-[360px]:p-5">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${val.tone}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="font-heading text-sm font-bold text-brand-900">{val.title}</h2>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">{val.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. STREAMING MARQUEE (White Accent Band) */}
      <Suspense fallback={<MarqueeSkeleton />}>
        <HomeMarqueeSection />
      </Suspense>

      {/* 4. FOUNDER, VISION & MISSION (Warm Sandstone Band with White Elevated Cards) */}
      <section className="lazy-section border-b border-sand-200 bg-sand-100/50 py-12 sm:py-14 lg:py-16">
        <div className="container-max">
          <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-10">
            <LazyReveal className="lg:col-span-5">
              <div className="overflow-hidden rounded-3xl border border-sand-200 bg-white p-3 shadow-xs">
                <LazyImage
                  src={founderImg}
                  alt={founderName}
                  wrapperClassName="h-72 w-full rounded-2xl sm:h-96"
                  className="h-full w-full object-cover object-top"
                />
                <div className="mt-3 px-2 pb-1">
                  <p className="font-heading text-base font-bold text-brand-900">{founderName}</p>
                  <p className="text-xs font-semibold text-saffron-600">{founderRole}</p>
                </div>
              </div>
            </LazyReveal>

            <LazyReveal delayMs={90} className="space-y-6 lg:col-span-7">
              <div>
                <span className="section-kicker">{ui.founderEyebrow}</span>
                <h2 className="mt-2 font-heading text-xl font-bold text-brand-900 min-[360px]:text-2xl sm:text-3xl">
                  {ui.founderTitle}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 min-[360px]:text-base">{founderBio}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="trust-card flex flex-col p-5">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-800">
                    <Eye className="h-5 w-5" />
                  </span>
                  <h3 className="mt-3 font-heading text-base font-bold text-brand-900">{ui.visionTitle}</h3>
                  <p className="mt-1.5 flex-1 text-sm text-slate-600">{vision}</p>
                </div>
                <div className="trust-card flex flex-col p-5">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-saffron-50 text-saffron-600">
                    <Target className="h-5 w-5" />
                  </span>
                  <h3 className="mt-3 font-heading text-base font-bold text-brand-900">{ui.missionTitle}</h3>
                  <p className="mt-1.5 flex-1 text-sm text-slate-600">{mission}</p>
                </div>
              </div>

              <Link
                href="/about"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-800 transition hover:text-saffron-600"
              >
                <span>{ui.learnMore}</span>
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </LazyReveal>
          </div>
        </div>
      </section>

      {/* 5. STREAMING ACTIVITIES */}
      <Suspense fallback={<SectionCardGridSkeleton count={3} />}>
        <HomeActivitiesSection lang={lang} />
      </Suspense>

      {/* 6. STREAMING EVENTS */}
      <Suspense fallback={<SectionCardGridSkeleton count={3} />}>
        <HomeEventsSection lang={lang} />
      </Suspense>

      {/* 7. STREAMING GALLERY */}
      <Suspense fallback={<SectionFolderGridSkeleton count={3} />}>
        <HomeGallerySection lang={lang} />
      </Suspense>

      {/* 8. STREAMING BLOGS */}
      <Suspense fallback={<SectionCardGridSkeleton count={3} />}>
        <HomeBlogsSection lang={lang} />
      </Suspense>

      {/* 9. FAQ (AEO/GEO Ready) */}
      <FaqSection faqs={faqs} />

      {/* 10. HIGH-CONTRAST HERITAGE CTA BAND */}
      <section className="lazy-section border-t border-sand-200 bg-sand-50 py-12 sm:py-14">
        <div className="container-max">
          <div className="flex flex-col items-start justify-between gap-7 rounded-3xl bg-brand-900 p-6 text-white shadow-lg sm:p-10 lg:flex-row lg:items-center lg:p-12">
            <div className="max-w-2xl">
              <span className="text-xs font-bold uppercase tracking-widest text-saffron-400">
                {ui.ctaBannerEyebrow}
              </span>
              <h2 className="mt-2 font-heading text-xl font-bold text-white min-[360px]:text-2xl sm:text-3xl">
                {ui.ctaBannerTitle}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-sand-200/90 sm:text-base">
                {donationsEnabled
                  ? ui.ctaBannerSubtitle
                  : lang === 'ta'
                  ? 'திண்டுக்கல் மற்றும் சுற்றியுள்ள பகுதிகளில் எங்கள் சேவைப் பணிகளில் தன்னார்வலராக இணையலாம்.'
                  : 'Join our volunteer network or partner with us across Dindigul and neighbouring districts.'}
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
              {donationsEnabled && (
                <Link
                  href="/donate"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-saffron-500 px-6 py-3.5 text-sm font-bold text-brand-950 transition hover:bg-saffron-400"
                >
                  <Heart className="h-4 w-4 shrink-0" />
                  <span>{ui.donateNow}</span>
                </Link>
              )}
              <Link
                href="/contact#volunteer"
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold transition ${
                  donationsEnabled
                    ? 'border border-white/25 bg-white/10 text-white hover:bg-white/20'
                    : 'bg-saffron-500 text-brand-950 hover:bg-saffron-400'
                }`}
              >
                <span>{ui.volunteer}</span>
                <ArrowRight className="h-4 w-4 shrink-0" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
