import type { Metadata } from 'next';
import { Images } from 'lucide-react';
import { pickLocalized } from '@ilangathir/shared';
import { getGalleryFolders, getPageContent } from '@/lib/api';
import { getUi } from '@/lib/i18n';
import { getServerLang } from '@/lib/lang-server';
import { buildBreadcrumbJsonLd, buildPageMetadata } from '@/lib/seo';
import { PageHeader } from '@/components/PageHeader';
import { GalleryExplorer } from '@/components/GalleryExplorer';

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ lang?: string }> }): Promise<Metadata> {
  const lang = await getServerLang((await searchParams).lang);
  const page = await getPageContent('gallery');
  return buildPageMetadata({
    title: (page && pickLocalized(page as unknown as Record<string, unknown>, 'seo_title', lang)) || (lang === 'ta' ? 'புகைப்பட & காணொளித் தொகுப்பு | இளங்கதிர் அறக்கட்டளை' : 'Gallery | Ilangathir Trust'),
    description: (page && pickLocalized(page as unknown as Record<string, unknown>, 'seo_description', lang)) || (lang === 'ta' ? 'நிகழ்வுகள் வாரியான புகைப்படங்கள் மற்றும் காணொளிகள்.' : 'Event-based photo and video gallery of Ilangathir Trust.'),
    path: '/gallery',
    lang
  });
}

export default async function GalleryPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const lang = await getServerLang((await searchParams).lang);
  const ui = getUi(lang);

  const [pageContent, foldersData] = await Promise.all([
    getPageContent('gallery'),
    getGalleryFolders({ page: 1, pageSize: 12 })
  ]);

  const heroTitle = (pageContent && pickLocalized(pageContent as unknown as Record<string, unknown>, 'hero_title', lang)) || ui.galleryTitle;
  const heroSub = (pageContent && pickLocalized(pageContent as unknown as Record<string, unknown>, 'hero_subtitle', lang)) || '';

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: ui.home, path: '/' },
    { name: ui.gallery, path: '/gallery' }
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <PageHeader
        crumbs={[{ label: ui.gallery }]}
        eyebrow={ui.galleryEyebrow}
        title={heroTitle}
        subtitle={heroSub}
        icon={Images}
      />

      <section className="bg-white py-14 lg:py-16">
        <div className="container-max">
          <GalleryExplorer initialData={foldersData} />
        </div>
      </section>
    </>
  );
}
