import type { Metadata } from 'next';
import { BookOpen } from 'lucide-react';
import { pickLocalized } from '@ilangathir/shared';
import { getBlogs, getPageContent } from '@/lib/api';
import { getUi } from '@/lib/i18n';
import { getServerLang } from '@/lib/lang-server';
import { buildBreadcrumbJsonLd, buildPageMetadata } from '@/lib/seo';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { BlogExplorer } from '@/components/BlogExplorer';

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ lang?: string }> }): Promise<Metadata> {
  const lang = await getServerLang((await searchParams).lang);
  const page = await getPageContent('blog');
  return buildPageMetadata({
    title: (page && pickLocalized(page as unknown as Record<string, unknown>, 'seo_title', lang)) || (lang === 'ta' ? 'கட்டுரைகள் & செய்திகள் | இளங்கதிர் அறக்கட்டளை' : 'Blog & Stories | Ilangathir Trust'),
    description: (page && pickLocalized(page as unknown as Record<string, unknown>, 'seo_description', lang)) || (lang === 'ta' ? 'இளங்கதிர் அறக்கட்டளையின் களச் செய்திகள் மற்றும் கட்டுரைகள்.' : 'Community stories, updates, and awareness articles by Ilangathir Trust.'),
    path: '/blog',
    lang
  });
}

export default async function BlogPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const lang = await getServerLang((await searchParams).lang);
  const ui = getUi(lang);

  const [pageContent, blogsData] = await Promise.all([
    getPageContent('blog'),
    getBlogs({ page: 1, pageSize: 9 })
  ]);

  const heroTitle = (pageContent && pickLocalized(pageContent as unknown as Record<string, unknown>, 'hero_title', lang)) || ui.blogTitle;
  const heroSub = (pageContent && pickLocalized(pageContent as unknown as Record<string, unknown>, 'hero_subtitle', lang)) || '';

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: ui.home, path: '/' },
    { name: ui.blog, path: '/blog' }
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <section className="border-b border-slate-200 bg-white py-12 lg:py-16">
        <div className="container-max">
          <Breadcrumbs items={[{ label: ui.blog }]} />
          <span className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-brand-600">
            <BookOpen className="h-4 w-4" />
            {ui.blogEyebrow}
          </span>
          <h1 className="mt-3 max-w-3xl font-heading text-3xl font-extrabold text-slate-900 sm:text-5xl">
            {heroTitle}
          </h1>
          {heroSub && <p className="mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">{heroSub}</p>}
        </div>
      </section>

      <section className="bg-slate-50 py-14 lg:py-20">
        <div className="container-max">
          <BlogExplorer initialData={blogsData} />
        </div>
      </section>
    </>
  );
}
