'use client';

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { useLanguage } from './LanguageProvider';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PwaInstallBanner() {
  const { lang } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
    }

    try {
      if (localStorage.getItem('ilg_pwa_dismissed') === '1') return;
    } catch {
      // ignore
    }

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (isStandalone) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setDismissed(false);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (dismissed || !deferredPrompt) return null;

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setDismissed(true);
  }

  function handleDismiss() {
    setDismissed(true);
    try {
      localStorage.setItem('ilg_pwa_dismissed', '1');
    } catch {
      // ignore
    }
  }

  return (
    <div className="fixed bottom-[70px] left-3 right-3 z-30 mx-auto flex max-w-md items-center justify-between gap-2.5 rounded-2xl border border-sand-300 bg-white/95 px-3.5 py-2.5 shadow-lg backdrop-blur-md lg:bottom-5 lg:left-auto lg:right-5">
      <div className="flex min-w-0 items-center gap-2.5">
        <img
          src="/logos/icon.png"
          alt="Ilangathir Trust"
          className="h-9 w-9 shrink-0 rounded-xl border border-sand-200 bg-white p-0.5 object-contain"
        />
        <div className="min-w-0">
          <p className="truncate text-xs font-bold text-brand-900">
            {lang === 'ta' ? 'இளங்கதிர் செயலி' : 'Install Ilangathir App'}
          </p>
          <p className="truncate text-[11px] text-slate-600">
            {lang === 'ta' ? 'மொபைலில் எளிதாகப் பயன்படுத்த' : 'Quick access from home screen'}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={handleInstall}
          className="inline-flex items-center gap-1 rounded-xl bg-brand-900 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-brand-800"
        >
          <Download className="h-3.5 w-3.5" />
          <span>{lang === 'ta' ? 'நிறுவு' : 'Install'}</span>
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss install prompt"
          className="rounded-lg p-1.5 text-slate-400 hover:bg-sand-100 hover:text-slate-700"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
