'use client';

import { useState } from 'react';
import { Expand, Images, Play } from 'lucide-react';
import { pickLocalized, type GalleryItem } from '@ilangathir/shared';
import { useLanguage } from './LanguageProvider';
import { getUi } from '@/lib/i18n';
import { MediaLightbox } from './MediaLightbox';

export function FolderItemsViewer({ items }: { items: GalleryItem[] }) {
  const { lang } = useLanguage();
  const ui = getUi(lang);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (!items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <Images className="mx-auto h-12 w-12 text-slate-400" />
        <p className="mt-4 text-sm font-medium text-slate-600">{ui.emptyGalleryItems}</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {items.map((item, idx) => {
          const title = pickLocalized(item as unknown as Record<string, unknown>, 'title', lang);
          const caption = pickLocalized(item as unknown as Record<string, unknown>, 'caption', lang);
          const alt = pickLocalized(item as unknown as Record<string, unknown>, 'alt_text', lang) || title || caption || 'Gallery item';
          const thumb = item.thumbnail_url || item.file_url;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className="group relative flex aspect-[4/3] w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {item.media_type === 'video' && !item.thumbnail_url ? (
                <video
                  src={item.file_url}
                  muted
                  preload="metadata"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              ) : (
                <img
                  src={thumb}
                  alt={alt}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent opacity-80 transition group-hover:opacity-100" />

              {item.media_type === 'video' ? (
                <span className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-600/90 text-white shadow-md">
                  <Play className="h-4 w-4 fill-current" />
                </span>
              ) : (
                <span className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition group-hover:opacity-100">
                  <Expand className="h-4 w-4" />
                </span>
              )}

              {(title || caption) && (
                <div className="absolute inset-x-0 bottom-0 p-3.5">
                  <p className="line-clamp-2 text-xs font-semibold text-white">
                    {title || caption}
                  </p>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {activeIndex !== null && (
        <MediaLightbox
          items={items}
          currentIndex={activeIndex}
          onClose={() => setActiveIndex(null)}
          onChangeIndex={setActiveIndex}
        />
      )}
    </>
  );
}
