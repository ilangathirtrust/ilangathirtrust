'use client';

import Link from 'next/link';
import { Calendar, FolderOpen, Images, MapPin } from 'lucide-react';
import { pickLocalized, type GalleryFolder } from '@ilangathir/shared';
import { useLanguage } from './LanguageProvider';
import { getUi } from '@/lib/i18n';
import { LazyImage } from './LazyPrimitives';

export function GalleryFolderCard({ folder }: { folder: GalleryFolder }) {
  const { lang } = useLanguage();
  const ui = getUi(lang);

  const title = pickLocalized(folder as unknown as Record<string, unknown>, 'title', lang);
  const desc = pickLocalized(folder as unknown as Record<string, unknown>, 'description', lang);
  const location = pickLocalized(folder as unknown as Record<string, unknown>, 'location', lang);
  const previews = (folder.preview_images && folder.preview_images.length > 0)
    ? folder.preview_images.slice(0, 4)
    : folder.cover_image_url
    ? [folder.cover_image_url]
    : [];

  return (
    <Link
      href={`/gallery/${folder.slug}`}
      className="trust-card group flex h-full flex-col overflow-hidden"
    >
      <div className="relative h-56 overflow-hidden bg-sand-100 p-2">
        {previews.length >= 3 ? (
          <div className="grid h-full grid-cols-2 grid-rows-2 gap-1.5 overflow-hidden rounded-xl">
            {previews.slice(0, 4).map((src, i) => (
              <LazyImage
                key={i}
                src={src}
                alt={`${title} preview ${i + 1}`}
                wrapperClassName="h-full w-full bg-sand-200"
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
            ))}
          </div>
        ) : previews.length === 2 ? (
          <div className="grid h-full grid-cols-2 gap-1.5 overflow-hidden rounded-xl">
            {previews.map((src, i) => (
              <LazyImage
                key={i}
                src={src}
                alt={`${title} preview ${i + 1}`}
                wrapperClassName="h-full w-full bg-sand-200"
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
            ))}
          </div>
        ) : previews.length === 1 ? (
          <LazyImage
            src={previews[0]}
            alt={title}
            wrapperClassName="h-full w-full rounded-xl bg-sand-200"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <FolderOpen className="h-12 w-12" />
          </div>
        )}

        <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-brand-950/80 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
          <span>{folder.category}</span>
        </div>

        <div className="absolute bottom-4 right-4 inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-brand-900 shadow-md">
          <Images className="h-3.5 w-3.5 text-saffron-600" />
          <span>{folder.item_count} {ui.itemsCount}</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4 min-[360px]:p-5">
        <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-500">
          {folder.event_date && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-brand-700" />
              {new Date(folder.event_date).toLocaleDateString(lang === 'ta' ? 'ta-IN' : 'en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </span>
          )}
          {location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-saffron-600" />
              <span className="truncate">{location}</span>
            </span>
          )}
        </div>

        <h3 className="mt-2.5 font-heading text-base font-bold text-brand-900 transition group-hover:text-saffron-600 sm:text-lg">
          {title}
        </h3>
        {desc && <p className="mt-2 line-clamp-2 text-sm text-slate-600">{desc}</p>}
      </div>
    </Link>
  );
}
