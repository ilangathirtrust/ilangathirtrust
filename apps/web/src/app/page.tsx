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

  const founderName = pickText(SITE_SETTINGS.founder_name, lang);
  const founderRole = pickText(SITE_SETTINGS.founder_role, lang);
  const founderBio = pickText(SITE_SETTINGS.founder_bio, lang);
  const founderImg = STATIC_ASSETS.founder;
  const mission = pickText(SITE_SETTINGS.mission_statement, lang);
  const vision = pickText(SITE_SETTINGS.vision_statement, lang);

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

      {/* 1. HERO: Full-Bleed Background Photography with High-Contrast Heritage Overlay */}
      <section className="relative isolate overflow-hidden border-b border-brand-900 bg-brand-950 text-white">
        <div className="absolute inset-0 -z-10">
          <img
            src={STATIC_ASSETS.hero}
            alt=""
            aria-hidden="true"
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="h-full w-full object-cover object-center sm:object-[center_35%]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-brand-950/90 via-brand-950/80 to-brand-950/94 lg:bg-gradient-to-r lg:from-brand-950/95 lg:via-brand-950/82 lg:to-brand-950/45" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.16),transparent_52%)]" />
        </div>

        <div className="container-max py-10 min-[360px]:py-12 sm:py-16 lg:py-20 xl:py-24">
          <div className="max-w-3xl space-y-5 sm:space-y-6">
            <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-saffron-400/35 bg-brand-950/70 px-3.5 py-1.5 text-[11px] font-bold text-saffron-300 shadow-xs backdrop-blur-md sm:text-xs">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-saffron-400" />
              <span className="truncate">{heroEyebrow}</span>
            </span>

            <h1
              className={`font-heading font-extrabold text-white drop-shadow-xs ${
                lang === 'ta'
                  ? 'text-[22px] leading-[1.36] min-[360px]:text-[25px] sm:text-4xl lg:text-[42px]'
                  : 'text-[25px] leading-[1.15] tracking-tight min-[360px]:text-3xl sm:text-5xl lg:text-[50px]'
              }`}
            >
              {heroTitle}
            </h1>

            <p className="max-w-2xl text-sm leading-relaxed text-sand-100/90 min-[360px]:text-base sm:text-lg">
              {heroSubtitle}
            </p>

            {/* Dynamic CTAs responsive to Donations Enabled / Disabled */}
            <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:flex-wrap sm:items-center">
              {donationsEnabled ? (
                <>
                  <Link
                    href="/donate"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-saffron-500 px-6 py-3.5 text-sm font-bold text-brand-950 shadow-[0_8px_24px_rgba(217,119,6,0.32)] transition hover:bg-saffron-400 sm:w-auto"
                  >
                    <Heart className="h-4 w-4 shrink-0" />
                    <span>{primaryCtaLabel}</span>
                  </Link>
                  <Link
                    href="/activities"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-bold text-white backdrop-blur-md transition hover:border-white/50 hover:bg-white/20 sm:w-auto"
                  >
                    <span>{secondaryCtaLabel}</span>
                    <ArrowRight className="h-4 w-4 shrink-0" />
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/activities"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-saffron-500 px-6 py-3.5 text-sm font-bold text-brand-950 shadow-[0_8px_24px_rgba(217,119,6,0.32)] transition hover:bg-saffron-400 sm:w-auto"
                  >
                    <span>{secondaryCtaLabel}</span>
                    <ArrowRight className="h-4 w-4 shrink-0" />
                  </Link>
                  <Link
                    href="/contact#volunteer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-bold text-white backdrop-blur-md transition hover:border-white/50 hover:bg-white/20 sm:w-auto"
                  >
                    <Users className="h-4 w-4 shrink-0 text-saffron-300" />
                    <span>{ui.volunteer}</span>
                  </Link>
                </>
              )}
            </div>

            <div
              className={`grid gap-3 rounded-2xl border border-white/15 bg-brand-950/65 p-4 backdrop-blur-md sm:gap-5 sm:p-5 ${
                donationsEnabled ? 'grid-cols-1 min-[360px]:grid-cols-2 sm:grid-cols-3' : 'grid-cols-1 min-[360px]:grid-cols-2'
              }`}
            >
              <div className="min-w-0">
                <p className="font-heading text-sm font-bold text-white sm:text-base">
                  {lang === 'ta' ? 'பதிவு பெற்ற அறக்கட்டளை' : 'Registered Trust'}
                </p>
                <p className="mt-0.5 text-xs font-medium text-sand-200/90">
                  {lang === 'ta' ? 'V. கல்லுப்பட்டி, திண்டுக்கல்' : 'V. Kallupatti, Dindigul'}
                </p>
              </div>
              <div className="min-w-0">
                <p className="font-heading text-sm font-bold text-white sm:text-base">
                  {lang === 'ta' ? 'முக்கியப் பணிகள்' : 'Core Focus'}
                </p>
                <p className="mt-0.5 text-xs font-medium text-sand-200/90">
                  {lang === 'ta' ? 'கல்வி • மருத்துவம் • உதவி' : 'Education • Health • Relief'}
                </p>
              </div>
              {donationsEnabled && (
                <div className="min-w-0 min-[360px]:col-span-2 sm:col-span-1">
                  <p className="font-heading text-sm font-bold text-white sm:text-base">
                    {lang === 'ta' ? 'முறையான ரசீது' : 'Direct Receipts'}
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-sand-200/90">
                    {lang === 'ta' ? 'பாதுகாப்பான ஆன்லைன் உதவி' : 'Verified Online Donations'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2. FOUR PRINCIPLES: Elevated White Cards on Warm Sand Surface */}
      <section className="border-b border-sand-200 bg-sand-100/80 py-9 sm:py-12">
        <div className="container-max">
          <div className="grid gap-3.5 min-[360px]:gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Heart, title: ui.valCompassionTitle, desc: ui.valCompassionDesc, tone: 'bg-saffron-50 text-saffron-600', accent: 'border-t-saffron-500' },
              { icon: ShieldCheck, title: ui.valEqualityTitle, desc: ui.valEqualityDesc, tone: 'bg-brand-50 text-brand-700', accent: 'border-t-brand-700' },
              { icon: Users, title: ui.valCommunityTitle, desc: ui.valCommunityDesc, tone: 'bg-forest-50 text-forest-700', accent: 'border-t-forest-600' },
              { icon: HeartHandshake, title: ui.valTransparencyTitle, desc: ui.valTransparencyDesc, tone: 'bg-saffron-50 text-saffron-700', accent: 'border-t-saffron-600' }
            ].map((val, i) => {
              const Icon = val.icon;
              return (
                <div key={i} className={`trust-card flex h-full items-start gap-3.5 border-t-[3px] ${val.accent} p-4 min-[360px]:p-5`}>
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
      <section className="lazy-section border-b border-sand-200 bg-sand-100/70 py-11 sm:py-14 lg:py-16">
        <div className="container-max">
          <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-10">
            <LazyReveal className="lg:col-span-5">
              <div className="mx-auto max-w-md overflow-hidden rounded-3xl border border-sand-200 bg-white p-2.5 shadow-[0_12px_32px_rgba(11,24,46,0.06)] lg:max-w-none">
                <LazyImage
                  src={founderImg}
                  alt={founderName}
                  loading="eager"
                  fetchPriority="high"
                  wrapperClassName="h-64 w-full rounded-2xl min-[360px]:h-72 sm:h-96"
                  className="h-full w-full object-cover object-top"
                />
                <div className="mt-2.5 rounded-2xl bg-sand-50 px-3.5 py-2.5">
                  <p className="font-heading text-base font-bold text-brand-900">{founderName}</p>
                  <p className="mt-0.5 text-xs font-semibold text-saffron-600">{founderRole}</p>
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
                <div className="trust-card flex flex-col border-t-[3px] border-t-brand-700 p-4 min-[360px]:p-5">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-800">
                    <Eye className="h-5 w-5" />
                  </span>
                  <h3 className="mt-3 font-heading text-base font-bold text-brand-900">{ui.visionTitle}</h3>
                  <p className="mt-1.5 flex-1 text-sm text-slate-600">{vision}</p>
                </div>
                <div className="trust-card flex flex-col border-t-[3px] border-t-saffron-500 p-4 min-[360px]:p-5">
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
      <section className="lazy-section border-t border-sand-200 bg-sand-100/70 py-11 sm:py-14">
        <div className="container-max">
          <div className="relative overflow-hidden flex flex-col items-start justify-between gap-7 rounded-3xl bg-gradient-to-br from-brand-900 via-brand-900 to-brand-950 p-5 text-white shadow-xl min-[360px]:p-6 sm:p-10 lg:flex-row lg:items-center lg:p-12">
            <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-saffron-500/10 blur-2xl" />
            <div className="relative max-w-2xl">
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
            <div className="relative flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
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
