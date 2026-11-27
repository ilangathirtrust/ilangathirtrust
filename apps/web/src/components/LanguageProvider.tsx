'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Language } from '@ilangathir/shared';
import { trackEvent } from '@/lib/analytics';

interface LanguageContextValue {
  lang: Language;
  setLang: (next: Language) => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'en',
  setLang: () => {}
});

export function LanguageProvider({
  initialLang,
  children
}: {
  initialLang: Language;
  children: React.ReactNode;
}) {
  const [lang, setLangState] = useState<Language>(initialLang);
  const router = useRouter();

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (next: Language) => {
    if (next === lang) return;
    setLangState(next);
    document.documentElement.lang = next;
    document.cookie = `ilangathir_lang=${next}; path=/; max-age=31536000; SameSite=Lax`;
    try {
      localStorage.setItem('ilangathir_lang', next);
    } catch {
      // ignore storage errors
    }
    trackEvent('language_change', { language: next });
    router.refresh();
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
