'use client';

import { useEffect, useState } from 'react';

export function Preloader({ logoUrl }: { logoUrl: string }) {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem('ilg_preloaded') === '1') {
        setVisible(false);
        return;
      }
      sessionStorage.setItem('ilg_preloaded', '1');
    } catch {
      // ignore
    }

    const fadeTimer = setTimeout(() => setFading(true), 280);
    const hideTimer = setTimeout(() => setVisible(false), 600);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white transition-opacity duration-300 ${
        fading ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      <div className="relative flex h-20 w-20 items-center justify-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-brand-600/15" />
        <span className="absolute inset-0 animate-spin rounded-full border-2 border-brand-100 border-t-brand-600" />
        <img
          src={logoUrl || '/assets/ilangathir-logo.jpg'}
          alt="Ilangathir Trust"
          className="h-14 w-14 rounded-full object-cover shadow-md"
        />
      </div>
      <p className="mt-4 font-heading text-sm font-bold tracking-wide text-brand-900">
        Ilangathir Trust
      </p>
      <p className="text-xs font-medium text-brand-600">இளங்கதிர் அறக்கட்டளை</p>
    </div>
  );
}
