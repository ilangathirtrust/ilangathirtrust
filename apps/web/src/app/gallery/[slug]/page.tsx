import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Calendar, Images, MapPin } from 'lucide-react';
import { pickLocalized } from '@ilangathir/shared';
import { getGalleryFolderDetail } from '@/lib/api';
import { getUi } from '@/lib/i18n';
import { getServerLang } from '@/lib/lang-server';
import { buildBreadcrumbJsonLd, buildPageMetadata } from '@/lib/seo';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { FolderItemsViewer } from '@/components/FolderItemsViewer';

export async function generateMetadata({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const lang = await getServerLang((await searchParams).lang);
  const data = await getGalleryFolderDetail(slug, 1, 24);
  if (!data) return { title: 'Gallery Folder Not Found | Ilangathir Trust' };

  const title = pickLocalized(data.folder as unknown as Record<string, unknown>, 'title', lang);
  const desc = pickLocalized(data.folder as unknown as Record<string, unknown>, 'description', lang) || title;

  return buildPageMetadata({
    title: `${title} | Ilangathir Trust`,
    description: desc,
    path: `/gallery/${slug}`,
    lang,
    ogImage: data.folder.cover_image_url || data.folder.preview_images?.[0] || undefined
  });
}

export default async function GalleryFolderPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string; page?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const lang = await getServerLang(sp.lang);
  const ui = getUi(lang);
  const page = Math.max(1, Number(sp.page) || 1);

  const data = await getGalleryFolderDetail(slug, page, 24);
  if (!data) notFound();

  const { folder, items, totalPages } = data;
  const title = pickLocalized(folder as unknown as Record<string, unknown>, 'title', lang);
  const desc = pickLocalized(folder as unknown as Record<string, unknown>, 'description', lang);
  const location = pickLocalized(folder as unknown as Record<string, unknown>, 'location', lang);

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: ui.home, path: '/' },
    { name: ui.gallery, path: '/gallery' },
    { name: title, path: `/gallery/${slug}` }
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <section className="border-b border-slate-200 bg-white py-10 lg:py-14">
        <div className="container-max">
          <Breadcrumbs items={[{ label: ui.gallery, href: '/gallery' }, { label: title }]} />
          <Link href="/gallery" className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-600 hover:text-brand-700">
            <ArrowLeft className="h-4 w-4" />
            <span>{ui.backToGallery}</span>
          </Link>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">
              {folder.category}
            </span>
            {folder.event_date && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600">
                <Calendar className="h-3.5 w-3.5 text-brand-600" />
                {folder.event_date}
              </span>
            )}
            {location && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600">
                <MapPin className="h-3.5 w-3.5 text-amberwarm-600" />
                {location}
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700">
              <Images className="h-3.5 w-3.5 text-brand-600" />
              {folder.item_count} {ui.itemsCount}
            </span>
          </div>

          <h1 className="mt-3 font-heading text-3xl font-extrabold text-slate-900 sm:text-4xl">
            {title}
          </h1>
          {desc && <p className="mt-3 max-w-3xl text-base text-slate-600">{desc}</p>}
        </div>
      </section>

      <section className="bg-slate-50 py-12 lg:py-16">
        <div className="container-max">
          <FolderItemsViewer items={items} />

          {totalPages > 1 && (
            <div className="mt-10 flex justify-center gap-2">
              {Array.from({ length: totalPages }).map((_, idx) => {
                const p = idx + 1;
                return (
                  <Link
                    key={p}
                    href={`/gallery/${slug}?page=${p}`}
                    className={`inline-flex h-10 min-w-[40px] items-center justify-center rounded-xl px-3 text-sm font-bold ${
                      p === page ? 'bg-brand-600 text-white' : 'border border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    {p}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
