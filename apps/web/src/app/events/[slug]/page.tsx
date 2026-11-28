import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowUpRight, Calendar, Clock, Images, MapPin } from 'lucide-react';
import { pickLocalized } from '@ilangathir/shared';
import { getEventBySlug } from '@/lib/api';
import { getUi } from '@/lib/i18n';
import { getServerLang } from '@/lib/lang-server';
import { buildBreadcrumbJsonLd, buildEventJsonLd, buildPageMetadata } from '@/lib/seo';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { FolderItemsViewer } from '@/components/FolderItemsViewer';
import { FormattedContent } from '@/components/FormattedContent';
import { LazyImage } from '@/components/LazyPrimitives';
import { ShareActionsBar } from '@/components/ShareActionsBar';

export async function generateMetadata({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const lang = await getServerLang((await searchParams).lang);
  const event = await getEventBySlug(slug);
  if (!event) return { title: 'Event Not Found | Ilangathir Trust' };

  const title = `${pickLocalized(event as unknown as Record<string, unknown>, 'title', lang)} | Ilangathir Trust`;
  const description = pickLocalized(event as unknown as Record<string, unknown>, 'summary', lang);

  return buildPageMetadata({
    title,
    description,
    path: `/events/${slug}`,
    lang,
    ogImage: event.banner_url || undefined
  });
}

export default async function EventDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { slug } = await params;
  const lang = await getServerLang((await searchParams).lang);
  const ui = getUi(lang);

  const event = await getEventBySlug(slug);
  if (!event) notFound();

  const title = pickLocalized(event as unknown as Record<string, unknown>, 'title', lang);
  const description = pickLocalized(event as unknown as Record<string, unknown>, 'description', lang);
  const location = pickLocalized(event as unknown as Record<string, unknown>, 'location', lang);
  const folderMeta = (event as unknown as { gallery_folders?: { slug: string } | null }).gallery_folders;

  const eventJsonLd = buildEventJsonLd(event, lang);
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: ui.home, path: '/' },
    { name: ui.events, path: '/events' },
    { name: title, path: `/events/${slug}` }
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <article className="bg-sand-50 py-10 sm:py-14 lg:py-16">
        <div className="container-max">
          <Breadcrumbs items={[{ label: ui.events, href: '/events' }, { label: title }]} />

          <Link href="/events" className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-800 hover:text-saffron-600">
            <ArrowLeft className="h-4 w-4" />
            <span>{ui.backToEvents}</span>
          </Link>

          <div className="mt-6 grid gap-8 lg:grid-cols-12">
            <div className="min-w-0 rounded-3xl border border-sand-200 bg-white p-5 shadow-xs sm:p-8 lg:col-span-8">
              <span className="rounded-full bg-saffron-50 px-3 py-1 text-xs font-bold text-saffron-700">
                {event.category}
              </span>
              <h1 className="mt-3 font-heading text-2xl font-extrabold text-brand-900 min-[360px]:text-3xl sm:text-4xl">
                {title}
              </h1>

              {event.banner_url && (
                <LazyImage
                  src={event.banner_url}
                  alt={title}
                  wrapperClassName="mt-6 rounded-2xl border border-sand-200 bg-sand-100"
                  className="max-h-[460px] w-full object-cover"
                />
              )}

              <div className="mt-7">
                <FormattedContent text={description} />
              </div>

              <div className="mt-7 border-t border-sand-200 pt-5">
                <ShareActionsBar
                  title={title}
                  path={`/events/${slug}`}
                  calendar={{
                    title,
                    description: pickLocalized(event as unknown as Record<string, unknown>, 'summary', lang) || description,
                    location,
                    eventDate: event.event_date,
                    startTime: event.start_time,
                    endTime: event.end_time
                  }}
                />
              </div>
            </div>

            <aside className="min-w-0 lg:col-span-4">
              <div className="sticky top-28 space-y-4 rounded-3xl border border-sand-200 bg-white p-5 shadow-xs sm:p-6">
                <h2 className="font-heading text-lg font-bold text-brand-900">
                  {lang === 'ta' ? 'நிகழ்வு விவரங்கள்' : 'Event Information'}
                </h2>
                <div className="space-y-3 text-sm text-slate-700">
                  <div className="flex items-start gap-2.5">
                    <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" />
                    <span>{event.event_date}</span>
                  </div>
                  {event.start_time && (
                    <div className="flex items-start gap-2.5">
                      <Clock className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" />
                      <span>
                        {event.start_time.slice(0, 5)}
                        {event.end_time ? ` - ${event.end_time.slice(0, 5)}` : ''}
                      </span>
                    </div>
                  )}
                  {location && (
                    <div className="flex items-start gap-2.5">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-saffron-600" />
                      <span>{location}</span>
                    </div>
                  )}
                </div>

                {event.registration_enabled && (
                  <Link
                    href="/volunteer"
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-saffron-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-saffron-700"
                  >
                    <span>{ui.participate}</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                )}

                {folderMeta?.slug && (
                  <Link
                    href={`/gallery/${folderMeta.slug}`}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-sand-200 bg-sand-50 px-5 py-3 text-sm font-bold text-brand-900 transition hover:bg-sand-100"
                  >
                    <Images className="h-4 w-4 text-saffron-600" />
                    <span>{ui.openGalleryFolder}</span>
                  </Link>
                )}
              </div>
            </aside>
          </div>

          {event.gallery_preview_items && event.gallery_preview_items.length > 0 && (
            <div className="mt-14 border-t border-sand-200 pt-10">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <h2 className="font-heading text-xl font-bold text-brand-900 sm:text-2xl">{ui.linkedGallery}</h2>
                {folderMeta?.slug && (
                  <Link href={`/gallery/${folderMeta.slug}`} className="inline-flex items-center gap-1 text-sm font-bold text-brand-800 hover:text-saffron-600">
                    <span>{ui.openGalleryFolder}</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
              <FolderItemsViewer items={event.gallery_preview_items} />
            </div>
          )}
        </div>
      </article>
    </>
  );
}
