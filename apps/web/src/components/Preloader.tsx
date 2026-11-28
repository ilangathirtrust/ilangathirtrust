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
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-sand-50 px-6 transition-opacity duration-300 ${
        fading ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center text-center">
        <img
          src={STATIC_ASSETS.icon}
          alt="Ilangathir Trust"
          className="h-16 w-16 object-contain sm:h-20 sm:w-20"
        />

        <div className="mt-4 space-y-1">
          <p className="font-heading text-lg font-extrabold tracking-tight text-brand-900">
            Ilangathir Trust
          </p>
          <p className="text-xs font-semibold text-saffron-600">
            இளங்கதிர் அறக்கட்டளை
          </p>
        </div>

        <div className="mt-5 h-1 w-32 overflow-hidden rounded-full bg-sand-200">
          <div className="h-full w-1/2 animate-preloaderBar rounded-full bg-gradient-to-r from-brand-800 via-saffron-500 to-brand-800" />
        </div>
      </div>
    </div>
  );
}
