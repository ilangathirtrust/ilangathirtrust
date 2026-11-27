'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, X } from 'lucide-react';
import { pickLocalized, type GalleryItem } from '@ilangathir/shared';
import { useLanguage } from './LanguageProvider';
import { getUi } from '@/lib/i18n';

interface MediaLightboxProps {
  items: GalleryItem[];
  currentIndex: number;
  onClose: () => void;
  onChangeIndex: (nextIndex: number) => void;
}

export function MediaLightbox({
  items,
  currentIndex,
  onClose,
  onChangeIndex
}: MediaLightboxProps) {
  const { lang } = useLanguage();
  const ui = getUi(lang);
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const wheelLock = useRef(false);

  const item = items[currentIndex];

  const goPrev = useCallback(() => {
    setMediaLoaded(false);
    onChangeIndex((currentIndex - 1 + items.length) % items.length);
  }, [currentIndex, items.length, onChangeIndex]);

  const goNext = useCallback(() => {
    setMediaLoaded(false);
    onChangeIndex((currentIndex + 1) % items.length);
  }, [currentIndex, items.length, onChangeIndex]);

  useEffect(() => {
    setMediaLoaded(false);
  }, [currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [goNext, goPrev, onClose]);

  if (!item) return null;

  const title = pickLocalized(item as unknown as Record<string, unknown>, 'title', lang);
  const caption = pickLocalized(item as unknown as Record<string, unknown>, 'caption', lang);
  const alt = pickLocalized(item as unknown as Record<string, unknown>, 'alt_text', lang) || title || caption || 'Gallery item';

  const handleWheel = (e: React.WheelEvent) => {
    if (wheelLock.current || items.length <= 1) return;
    const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    if (Math.abs(delta) < 18) return;
    wheelLock.current = true;
    if (delta > 0) goNext();
    else goPrev();
    setTimeout(() => {
      wheelLock.current = false;
    }, 320);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Media viewer'}
      onWheel={handleWheel}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null || items.length <= 1) return;
        const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
        const diff = touchStartX.current - endX;
        if (diff > 45) goNext();
        else if (diff < -45) goPrev();
        touchStartX.current = null;
      }}
      className="fixed inset-0 z-[90] flex flex-col bg-slate-950/95 text-white backdrop-blur-xl"
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-400">
            {currentIndex + 1} / {items.length}
          </p>
          {title && <h3 className="truncate font-heading text-sm font-bold text-white sm:text-base">{title}</h3>}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={ui.close}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Main Viewer Area */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden p-4 sm:p-10">
        {items.length > 1 && (
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous media"
            className="absolute left-2 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md transition hover:bg-black/80 sm:left-5 sm:h-12 sm:w-12"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        <div className="relative flex max-h-full max-w-5xl items-center justify-center">
          {!mediaLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
            </div>
          )}

          {item.media_type === 'video' ? (
            <video
              key={item.id}
              src={item.file_url}
              poster={item.thumbnail_url || undefined}
              controls
              autoPlay
              playsInline
              onLoadedData={() => setMediaLoaded(true)}
              className="max-h-[74vh] max-w-full rounded-xl bg-black shadow-2xl transition-opacity duration-300"
            />
          ) : (
            <img
              key={item.id}
              src={item.file_url}
              alt={alt}
              onLoad={() => setMediaLoaded(true)}
              className={`max-h-[74vh] max-w-full rounded-xl object-contain shadow-2xl transition-all duration-300 ${
                mediaLoaded ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
              }`}
            />
          )}
        </div>

        {items.length > 1 && (
          <button
            type="button"
            onClick={goNext}
            aria-label="Next media"
            className="absolute right-2 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md transition hover:bg-black/80 sm:right-5 sm:h-12 sm:w-12"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Caption & Navigation Hint */}
      <div className="border-t border-white/10 bg-black/40 px-4 py-3 text-center sm:px-6">
        {caption && <p className="mx-auto max-w-2xl text-sm text-slate-200">{caption}</p>}
        <p className="mt-1 text-[11px] text-slate-400">{ui.viewerHint}</p>
      </div>
    </div>
  );
}
