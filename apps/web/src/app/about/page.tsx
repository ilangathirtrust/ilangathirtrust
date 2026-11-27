import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Eye, HeartHandshake, Target, Users } from 'lucide-react';
import { getUi } from '@/lib/i18n';
import { getServerLang } from '@/lib/lang-server';
import { buildBreadcrumbJsonLd, buildPageMetadata } from '@/lib/seo';
import {
  HOME_FAQS,
  PERMANENT_PAGES,
  SITE_SETTINGS,
  STATIC_ASSETS,
  pickText
} from '@/lib/site-content';
import { PageHeader } from '@/components/PageHeader';
import { FaqSection } from '@/components/FaqSection';
import { AboutTeamSection } from '@/components/DynamicSections';
import { CardGridSkeleton } from '@/components/Skeletons';

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ lang?: string }> }): Promise<Metadata> {
  const lang = await getServerLang((await searchParams).lang);
  const p = PERMANENT_PAGES.about;
  return buildPageMetadata({
    title: lang === 'ta' ? p.seo_title_ta : p.seo_title_en,
    description: lang === 'ta' ? p.seo_description_ta : p.seo_description_en,
    path: '/about',
    lang
  });
}

export default async function AboutPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const lang = await getServerLang((await searchParams).lang);
  const ui = getUi(lang);
  const p = PERMANENT_PAGES.about;

  const founderName = pickText(SITE_SETTINGS.founder_name, lang);
  const founderRole = pickText(SITE_SETTINGS.founder_role, lang);
  const founderBio = pickText(SITE_SETTINGS.founder_bio, lang);
  const mission = pickText(SITE_SETTINGS.mission_statement, lang);
  const vision = pickText(SITE_SETTINGS.vision_statement, lang);

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: ui.home, path: '/' },
    { name: ui.about, path: '/about' }
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <PageHeader
        crumbs={[{ label: ui.about }]}
        eyebrow={lang === 'ta' ? p.eyebrow_ta : p.eyebrow_en}
        title={lang === 'ta' ? p.title_ta : p.title_en}
        subtitle={lang === 'ta' ? p.subtitle_ta : p.subtitle_en}
        icon={HeartHandshake}
      />

      <section className="border-b border-slate-200 bg-white py-14 lg:py-16">
        <div className="container-max grid items-center gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-3">
              <img
                src={STATIC_ASSETS.founder}
                alt={founderName}
                loading="eager"
                decoding="async"
                className="h-96 w-full rounded-xl object-cover object-top"
              />
            </div>
          </div>
          <div className="space-y-6 lg:col-span-7">
            <span className="section-kicker">{ui.founderEyebrow}</span>
            <h2 className="font-heading text-3xl font-bold text-slate-900">{founderName}</h2>
            <p className="text-sm font-bold text-brand-700">{founderRole}</p>
            <p className="text-base leading-relaxed text-slate-600">{founderBio}</p>

            <div className="grid gap-4 pt-2 sm:grid-cols-2">
              <div className="editorial-card flex flex-col p-5">
                <Eye className="h-6 w-6 text-brand-700" />
                <h3 className="mt-3 font-heading text-base font-bold text-slate-900">{ui.visionTitle}</h3>
                <p className="mt-1.5 flex-1 text-sm text-slate-600">{vision}</p>
              </div>
              <div className="editorial-card flex flex-col p-5">
                <Target className="h-6 w-6 text-slate-700" />
                <h3 className="mt-3 font-heading text-base font-bold text-slate-900">{ui.missionTitle}</h3>
                <p className="mt-1.5 flex-1 text-sm text-slate-600">{mission}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="team" className="bg-white py-14 lg:py-16">
        <div className="container-max">
          <div className="mb-8 flex items-center gap-3">
            <Users className="h-6 w-6 text-brand-700" />
            <h2 className="font-heading text-2xl font-bold text-slate-900 sm:text-3xl">
              {lang === 'ta' ? 'அறங்காவலர்கள் & குழுவினர்' : 'Trustees & Team'}
            </h2>
          </div>

          <Suspense fallback={<CardGridSkeleton count={3} />}>
            <AboutTeamSection lang={lang} />
          </Suspense>
        </div>
      </section>

      <FaqSection faqs={HOME_FAQS} />
    </>
  );
}
