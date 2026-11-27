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
import { getUi } from '@/lib/i18n';
import { getServerLang } from '@/lib/lang-server';
import { buildFaqJsonLd, buildPageMetadata } from '@/lib/seo';
import {
  HOME_FAQS,
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
  const lang = await getServerLang(sp.lang);
  const ui = getUi(lang);
  const p = PERMANENT_PAGES.home;

  const heroEyebrow = lang === 'ta' ? p.eyebrow_ta : p.eyebrow_en;
  const heroTitle = lang === 'ta' ? p.title_ta : p.title_en;
  const heroSubtitle = lang === 'ta' ? p.subtitle_ta : p.subtitle_en;
  const primaryCtaLabel = lang === 'ta' ? p.primary_cta_ta : p.primary_cta_en;
  const secondaryCtaLabel = lang === 'ta' ? p.secondary_cta_ta : p.secondary_cta_en;

  const founderName = pickText(SITE_SETTINGS.founder_name, lang);
  const founderRole = pickText(SITE_SETTINGS.founder_role, lang);
  const founderBio = pickText(SITE_SETTINGS.founder_bio, lang);
  const mission = pickText(SITE_SETTINGS.mission_statement, lang);
  const vision = pickText(SITE_SETTINGS.vision_statement, lang);
  const faqJsonLd = buildFaqJsonLd(HOME_FAQS, lang);

  return (
    <>
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}

      {/* 1. INSTANT HERO (Zero API Wait, Permanent Frontend Assets) */}
      <section className="border-b border-slate-200 bg-white">
        <div className="container-max py-10 sm:py-14 lg:py-16">
          <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="space-y-6 lg:col-span-7">
              <p className="text-xs font-bold uppercase tracking-wider text-brand-700">
                {heroEyebrow}
              </p>

              <h1
                className={`font-heading font-extrabold text-slate-900 ${
                  lang === 'ta'
                    ? 'text-2xl leading-[1.38] sm:text-4xl lg:text-[42px]'
                    : 'text-3xl leading-[1.15] tracking-tight sm:text-5xl lg:text-[50px]'
                }`}
              >
                {heroTitle}
              </h1>

              <p className="max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
                {heroSubtitle}
              </p>

              <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:flex-wrap sm:items-center">
                <Link
                  href="/donate"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-brand-700"
                >
                  <Heart className="h-4 w-4 shrink-0" />
                  <span>{primaryCtaLabel}</span>
                </Link>
                <Link
                  href="/activities"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-bold text-slate-800 transition hover:border-brand-400 hover:text-brand-700"
                >
                  <span>{secondaryCtaLabel}</span>
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-5 border-t border-slate-200 pt-6 sm:grid-cols-3">
                <div>
                  <p className="font-heading text-base font-bold text-slate-900">
                    {lang === 'ta' ? 'பதிவு பெற்ற அறக்கட்டளை' : 'Registered Trust'}
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-slate-600">
                    {lang === 'ta' ? 'திண்டுக்கல், தமிழ்நாடு' : 'V. Kallupatti, Dindigul'}
                  </p>
                </div>
                <div>
                  <p className="font-heading text-base font-bold text-slate-900">
                    {lang === 'ta' ? 'முக்கியப் பணிகள்' : 'Core Focus'}
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-slate-600">
                    {lang === 'ta' ? 'கல்வி • மருத்துவம் • உதவி' : 'Education • Health • Relief'}
                  </p>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <p className="font-heading text-base font-bold text-slate-900">
                    {lang === 'ta' ? 'முறையான ரசீது' : 'Direct Receipts'}
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-slate-600">
                    {lang === 'ta' ? 'பாதுகாப்பான ஆன்லைன் உதவி' : 'Verified Online Donations'}
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="mx-auto max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm lg:max-w-none">
                <img
                  src={STATIC_ASSETS.hero}
                  alt={heroTitle}
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  className="h-72 w-full object-cover sm:h-[420px]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. INSTANT FOUR PRINCIPLES */}
      <section className="border-b border-slate-200 bg-white py-10">
        <div className="container-max">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Heart, title: ui.valCompassionTitle, desc: ui.valCompassionDesc },
              { icon: ShieldCheck, title: ui.valEqualityTitle, desc: ui.valEqualityDesc },
              { icon: Users, title: ui.valCommunityTitle, desc: ui.valCommunityDesc },
              { icon: HeartHandshake, title: ui.valTransparencyTitle, desc: ui.valTransparencyDesc }
            ].map((val, i) => {
              const Icon = val.icon;
              return (
                <div key={i} className="flex items-start gap-3.5 rounded-2xl border border-slate-200 bg-white p-5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="font-heading text-sm font-bold text-slate-900">{val.title}</h2>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">{val.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. STREAMING MARQUEE (Dynamic Uploaded Highlights) */}
      <Suspense fallback={<MarqueeSkeleton />}>
        <HomeMarqueeSection />
      </Suspense>

      {/* 4. INSTANT FOUNDER, VISION & MISSION */}
      <section className="lazy-section border-b border-slate-200 bg-white py-14 lg:py-16">
        <div className="container-max">
          <div className="grid items-center gap-10 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-3">
                <img
                  src={STATIC_ASSETS.founder}
                  alt={founderName}
                  loading="lazy"
                  decoding="async"
                  className="h-80 w-full rounded-xl object-cover object-top sm:h-96"
                />
                <div className="mt-3 px-2 pb-1">
                  <p className="font-heading text-base font-bold text-slate-900">{founderName}</p>
                  <p className="text-xs font-semibold text-brand-700">{founderRole}</p>
                </div>
              </div>
            </div>

            <div className="space-y-6 lg:col-span-7">
              <div>
                <span className="section-kicker">{ui.founderEyebrow}</span>
                <h2 className="mt-2 font-heading text-2xl font-bold text-slate-900 sm:text-3xl">
                  {ui.founderTitle}
                </h2>
                <p className="mt-3 text-base leading-relaxed text-slate-600">{founderBio}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="editorial-card flex flex-col p-5">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                    <Eye className="h-5 w-5" />
                  </span>
                  <h3 className="mt-3 font-heading text-base font-bold text-slate-900">{ui.visionTitle}</h3>
                  <p className="mt-1.5 flex-1 text-sm text-slate-600">{vision}</p>
                </div>
                <div className="editorial-card flex flex-col p-5">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-800">
                    <Target className="h-5 w-5" />
                  </span>
                  <h3 className="mt-3 font-heading text-base font-bold text-slate-900">{ui.missionTitle}</h3>
                  <p className="mt-1.5 flex-1 text-sm text-slate-600">{mission}</p>
                </div>
              </div>

              <Link
                href="/about"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 transition hover:text-brand-900"
              >
                <span>{ui.learnMore}</span>
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
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

      {/* 9. INSTANT FAQ */}
      <FaqSection faqs={HOME_FAQS} />

      {/* 10. INSTANT CTA SECTION */}
      <section className="lazy-section border-t border-slate-200 bg-white py-14">
        <div className="container-max">
          <div className="flex flex-col items-start justify-between gap-8 rounded-2xl border border-slate-200 bg-slate-50 p-8 sm:p-12 lg:flex-row lg:items-center">
            <div className="max-w-2xl">
              <span className="section-kicker">{ui.ctaBannerEyebrow}</span>
              <h2 className="mt-2 font-heading text-2xl font-bold text-slate-900 sm:text-3xl">
                {ui.ctaBannerTitle}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
                {ui.ctaBannerSubtitle}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/donate"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-brand-700"
              >
                <Heart className="h-4 w-4 shrink-0" />
                <span>{ui.donateNow}</span>
              </Link>
              <Link
                href="/contact#volunteer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-bold text-slate-800 transition hover:border-brand-400 hover:text-brand-700"
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
