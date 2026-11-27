import type { Metadata } from 'next';
import { BookOpen } from 'lucide-react';
import { pickLocalized } from '@ilangathir/shared';
import { getBlogs, getPageContent } from '@/lib/api';
import { getUi } from '@/lib/i18n';
import { getServerLang } from '@/lib/lang-server';
import { buildBreadcrumbJsonLd, buildPageMetadata } from '@/lib/seo';
import { PageHeader } from '@/components/PageHeader';
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

      <PageHeader
        crumbs={[{ label: ui.blog }]}
        eyebrow={ui.blogEyebrow}
        title={heroTitle}
        subtitle={heroSub}
        icon={BookOpen}
      />

      <section className="bg-white py-14 lg:py-16">
        <div className="container-max">
          <BlogExplorer initialData={blogsData} />
        </div>
      </section>
    </>
  );
}
