import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Eye, HeartHandshake, Target, Users } from 'lucide-react';
import { isDonationsEnabled } from '@ilangathir/shared';
import { getBootstrap } from '@/lib/api';
import { getUi } from '@/lib/i18n';
import { getServerLang } from '@/lib/lang-server';
import { buildBreadcrumbJsonLd, buildFaqJsonLd, buildPageMetadata, buildWebPageJsonLd } from '@/lib/seo';
import {
  getHomeFaqs,
  PERMANENT_PAGES,
  SITE_SETTINGS,
  STATIC_ASSETS,
  pickText
} from '@/lib/site-content';
import { PageHeader } from '@/components/PageHeader';
import { FaqSection } from '@/components/FaqSection';
import { AboutTeamSection } from '@/components/DynamicSections';
import { LazyImage } from '@/components/LazyPrimitives';
import { CardGridSkeleton } from '@/components/Skeletons';

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ lang?: string }> }): Promise<Metadata> {
  const lang = await getServerLang((await searchParams).lang);
  const p = PERMANENT_PAGES.about;
  return buildPageMetadata({
    title: lang === 'ta' ? p.seo_title_ta : p.seo_title_en,
    description: lang === 'ta' ? p.seo_description_ta : p.seo_description_en,
    keywords: lang === 'ta' ? p.keywords_ta : p.keywords_en,
    path: '/about',
    lang
  });
}

export default async function AboutPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const [lang, bootstrap] = await Promise.all([getServerLang((await searchParams).lang), getBootstrap()]);
  const ui = getUi(lang);
  const p = PERMANENT_PAGES.about;
  const settings = bootstrap.settings;
  const donationsEnabled = isDonationsEnabled(settings);

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
    path: '/about',
    lang,
    type: 'AboutPage'
  });
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: ui.home, path: '/' },
    { name: ui.about, path: '/about' }
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}

      <PageHeader
        crumbs={[{ label: ui.about }]}
        eyebrow={lang === 'ta' ? p.eyebrow_ta : p.eyebrow_en}
        title={lang === 'ta' ? p.title_ta : p.title_en}
        subtitle={lang === 'ta' ? p.subtitle_ta : p.subtitle_en}
        icon={HeartHandshake}
      />

      <section className="border-b border-sand-200 bg-sand-50 py-12 sm:py-14 lg:py-16">
        <div className="container-max grid items-center gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5">
            <div className="overflow-hidden rounded-3xl border border-sand-200 bg-white p-3 shadow-xs">
              <LazyImage
                src={founderImg}
                alt={founderName}
                wrapperClassName="h-80 w-full rounded-2xl sm:h-96"
                className="h-full w-full object-cover object-top"
              />
            </div>
          </div>
          <div className="min-w-0 space-y-5 lg:col-span-7">
            <span className="section-kicker">{ui.founderEyebrow}</span>
            <h2 className="font-heading text-2xl font-bold text-brand-900 sm:text-3xl">{founderName}</h2>
            <p className="text-sm font-bold text-saffron-600">{founderRole}</p>
            <p className="text-sm leading-relaxed text-slate-600 sm:text-base">{founderBio}</p>

            <div className="grid gap-4 pt-2 sm:grid-cols-2">
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
          </div>
        </div>
      </section>

      <section id="team" className="bg-sand-100/50 py-12 sm:py-14 lg:py-16">
        <div className="container-max">
          <div className="mb-8 flex items-center gap-3">
            <Users className="h-6 w-6 shrink-0 text-saffron-600" />
            <h2 className="font-heading text-xl font-bold text-brand-900 min-[360px]:text-2xl sm:text-3xl">
              {lang === 'ta' ? 'அறங்காவலர்கள் & குழுவினர்' : 'Trustees & Team'}
            </h2>
          </div>

          <Suspense fallback={<CardGridSkeleton count={3} />}>
            <AboutTeamSection lang={lang} />
          </Suspense>
        </div>
      </section>

      <FaqSection faqs={faqs} />
    </>
  );
}
