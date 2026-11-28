import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type AdminLang = 'en' | 'ta';
export type AdminTheme = 'light' | 'dark';

interface AdminUiContextValue {
  lang: AdminLang;
  setLang: (lang: AdminLang) => void;
  theme: AdminTheme;
  setTheme: (theme: AdminTheme) => void;
  toggleTheme: () => void;
  tr: (en: string, ta: string) => string;
}

const AdminUiContext = createContext<AdminUiContextValue>({
  lang: 'en',
  setLang: () => {},
  theme: 'light',
  setTheme: () => {},
  toggleTheme: () => {},
  tr: (en) => en
});

const LANG_KEY = 'ilangathir_admin_lang';
const THEME_KEY = 'ilangathir_admin_theme';

export function AdminUiProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<AdminLang>(() => {
    if (typeof window === 'undefined') return 'en';
    try {
      return localStorage.getItem(LANG_KEY) === 'ta' ? 'ta' : 'en';
    } catch {
      return 'en';
    }
  });

  const [theme, setThemeState] = useState<AdminTheme>(() => {
    if (typeof window === 'undefined') return 'light';
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch {
      // ignore
    }
  }, [lang]);

  useEffect(() => {
    const isDark = theme === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', isDark ? '#18191B' : '#0D1B35');
    }
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const setLang = (next: AdminLang) => setLangState(next);
  const setTheme = (next: AdminTheme) => setThemeState(next);
  const toggleTheme = () => setThemeState((t) => (t === 'dark' ? 'light' : 'dark'));
  const tr = (en: string, ta: string) => (lang === 'ta' ? ta : en);

  return (
    <AdminUiContext.Provider value={{ lang, setLang, theme, setTheme, toggleTheme, tr }}>
      {children}
    </AdminUiContext.Provider>
  );
}

export function useAdminUi() {
  return useContext(AdminUiContext);
}
