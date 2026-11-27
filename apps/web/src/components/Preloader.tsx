'use client';

import { useEffect, useState } from 'react';
import { STATIC_ASSETS } from '@/lib/site-content';

export function Preloader() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    try {
      if (sessionStorage.getItem('ilg_preloaded') === '1' || prefersReduced) {
        setVisible(false);
        return;
      }
      sessionStorage.setItem('ilg_preloaded', '1');
    } catch {
      // ignore storage restrictions
    }

    const fadeTimer = setTimeout(() => setFading(true), 320);
    const hideTimer = setTimeout(() => setVisible(false), 680);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-sand-50 px-4 transition-opacity duration-300 ${
        fading ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      <div className="relative flex h-24 w-24 items-center justify-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-saffron-400/20" />
        <span className="absolute inset-0 animate-spin rounded-full border-[2.5px] border-sand-200 border-t-saffron-600 border-r-brand-700" />
        <div className="flex h-[74px] w-[74px] items-center justify-center rounded-full bg-white p-1.5 shadow-md ring-1 ring-sand-200">
          <img
            src={STATIC_ASSETS.circularIcon}
            alt="Ilangathir Trust"
            className="h-full w-full object-contain"
          />
        </div>
      </div>

      <div className="mt-5 text-center">
        <p className="font-heading text-base font-extrabold tracking-tight text-brand-900">
          Ilangathir Trust
        </p>
        <p className="mt-0.5 text-xs font-semibold text-saffron-600">
          இளங்கதிர் அறக்கட்டளை
        </p>
      </div>
    </div>
  );
}
