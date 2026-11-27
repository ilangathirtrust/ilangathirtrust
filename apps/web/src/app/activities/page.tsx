import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Sparkles } from 'lucide-react';
import { getUi } from '@/lib/i18n';
import { getServerLang } from '@/lib/lang-server';
import { buildBreadcrumbJsonLd, buildPageMetadata, buildWebPageJsonLd } from '@/lib/seo';
import { PERMANENT_PAGES } from '@/lib/site-content';
import { PageHeader } from '@/components/PageHeader';
import { ActivitiesListSection } from '@/components/DynamicSections';
import { CardGridSkeleton } from '@/components/Skeletons';

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ lang?: string }> }): Promise<Metadata> {
  const lang = await getServerLang((await searchParams).lang);
  const p = PERMANENT_PAGES.activities;
  return buildPageMetadata({
    title: lang === 'ta' ? p.seo_title_ta : p.seo_title_en,
    description: lang === 'ta' ? p.seo_description_ta : p.seo_description_en,
    keywords: lang === 'ta' ? p.keywords_ta : p.keywords_en,
    path: '/activities',
    lang
  });
}

export default async function ActivitiesPage({
  searchParams
}: {
  searchParams: Promise<{ lang?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const lang = await getServerLang(sp.lang);
  const ui = getUi(lang);
  const p = PERMANENT_PAGES.activities;
  const currentPage = Math.max(1, Number(sp.page) || 1);

  const webPageJsonLd = buildWebPageJsonLd({
    title: lang === 'ta' ? p.seo_title_ta : p.seo_title_en,
    description: lang === 'ta' ? p.seo_description_ta : p.seo_description_en,
    path: '/activities',
    lang,
    type: 'CollectionPage'
  });
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: ui.home, path: '/' },
    { name: ui.activities, path: '/activities' }
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <PageHeader
        crumbs={[{ label: ui.activities }]}
        eyebrow={lang === 'ta' ? p.eyebrow_ta : p.eyebrow_en}
        title={lang === 'ta' ? p.title_ta : p.title_en}
        subtitle={lang === 'ta' ? p.subtitle_ta : p.subtitle_en}
        icon={Sparkles}
      />

      <section className="bg-sand-50 py-12 sm:py-14 lg:py-16">
        <div className="container-max">
          <Suspense key={currentPage} fallback={<CardGridSkeleton count={6} />}>
            <ActivitiesListSection lang={lang} page={currentPage} />
          </Suspense>
        </div>
      </section>
    </>
  );
}
