import { useEffect, useState } from 'react';
import {
  Activity,
  BookOpen,
  CalendarDays,
  Compass,
  Download,
  ExternalLink,
  FileCode2,
  FolderOpen,
  Heart,
  Image as ImageIcon,
  Inbox,
  IndianRupee,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Navigation,
  Settings,
  Shield,
  ShieldCheck,
  Sparkles,
  Sun,
  Users,
  X
} from 'lucide-react';
import { adminApi, clearAdminApiCache } from './lib/api';
import { useAdminUi } from './lib/admin-ui';
import { getSupabaseClient, isSupabaseConfigured, PUBLIC_SITE_URL } from './lib/supabase';
import { LoginPage } from './pages/LoginPage';
import { OverviewPage } from './pages/OverviewPage';
import { SiteSettingsPage } from './pages/SiteSettingsPage';
import { PagesSeoPage } from './pages/PagesSeoPage';
import { NavigationMarqueePage } from './pages/NavigationMarqueePage';
import { MediaLibraryPage } from './pages/MediaLibraryPage';
import { GalleryManagerPage } from './pages/GalleryManagerPage';
import { EventsActivitiesPage } from './pages/EventsActivitiesPage';
import { BlogManagerPage } from './pages/BlogManagerPage';
import { DonationsPage, InboxAndAuditPage } from './pages/DonationsInboxPage';
import { SecurityDevicesPage } from './pages/SecurityDevicesPage';

interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const NAV_ITEMS = [
  { id: 'overview', label: 'Dashboard', labelTa: 'Dashboard', shortLabel: 'Home', shortLabelTa: 'முகப்பு', icon: LayoutDashboard, group: 'Workspace', groupTa: 'பணிப்பகுதி' },
  { id: 'enquiries', label: 'Contact Enquiries', labelTa: 'Enquiries & மெசேஜ்', shortLabel: 'Enquiries', shortLabelTa: 'Enquiries', icon: Inbox, group: 'Operations', groupTa: 'நிர்வாகம்' },
  { id: 'events', label: 'Events Management', labelTa: 'Events மேலாண்மை', shortLabel: 'Events', shortLabelTa: 'Events', icon: CalendarDays, group: 'Content CMS', groupTa: 'Content மேலாண்மை' },
  { id: 'gallery', label: 'Gallery Folders', labelTa: 'Gallery ஃபோல்டர்', shortLabel: 'Gallery', shortLabelTa: 'Gallery', icon: FolderOpen, group: 'Media & Blog', groupTa: 'Media & Blog' },
  { id: 'donations', label: 'Donations & Payments', labelTa: 'நன்கொடை & Payment', shortLabel: 'Donate', shortLabelTa: 'நன்கொடை', icon: IndianRupee, group: 'Operations', groupTa: 'நிர்வாகம்' },
  { id: 'pages', label: 'Pages & Hero', labelTa: 'Pages & Banner', shortLabel: 'Pages', shortLabelTa: 'Pages', icon: FileCode2, group: 'Content CMS', groupTa: 'Content மேலாண்மை' },
  { id: 'settings', label: 'Site Settings & Brand', labelTa: 'Site Settings', shortLabel: 'Settings', shortLabelTa: 'Settings', icon: Settings, group: 'Content CMS', groupTa: 'Content மேலாண்மை' },
  { id: 'navigation', label: 'Menus & Marquee', labelTa: 'Menu & Marquee', shortLabel: 'Menus', shortLabelTa: 'Menus', icon: Navigation, group: 'Content CMS', groupTa: 'Content மேலாண்மை' },
  { id: 'activities', label: 'Activities & Services', labelTa: 'நலப்பணிகள் & Activities', shortLabel: 'Activities', shortLabelTa: 'பணிகள்', icon: Sparkles, group: 'Content CMS', groupTa: 'Content மேலாண்மை' },
  { id: 'media', label: 'Media Library', labelTa: 'Media ஃபைல்கள்', shortLabel: 'Media', shortLabelTa: 'Media', icon: ImageIcon, group: 'Media & Blog', groupTa: 'Media & Blog' },
  { id: 'blogs', label: 'Blog & Articles', labelTa: 'Blog கட்டுரைகள்', shortLabel: 'Blog', shortLabelTa: 'Blog', icon: BookOpen, group: 'Media & Blog', groupTa: 'Media & Blog' },
  { id: 'team', label: 'Team & Trustees', labelTa: 'Team & அறங்காவலர்கள்', shortLabel: 'Team', shortLabelTa: 'Team', icon: Users, group: 'Media & Blog', groupTa: 'Media & Blog' },
  { id: 'volunteers', label: 'Volunteers', labelTa: 'Volunteers விண்ணப்பம்', shortLabel: 'Volunteers', shortLabelTa: 'தன்னார்வலர்', icon: Heart, group: 'Operations', groupTa: 'நிர்வாகம்' },
  { id: 'security', label: 'Security & Devices', labelTa: 'Security & Device', shortLabel: 'Security', shortLabelTa: 'Security', icon: ShieldCheck, group: 'Security', groupTa: 'பாதுகாப்பு' },
  { id: 'audit', label: 'Audit Logs', labelTa: 'Audit Log', shortLabel: 'Audit', shortLabelTa: 'Audit', icon: Activity, group: 'Security', groupTa: 'பாதுகாப்பு' },
  { id: 'users', label: 'Admin Roles', labelTa: 'Admin Roles', shortLabel: 'Roles', shortLabelTa: 'Roles', icon: Shield, group: 'Security', groupTa: 'பாதுகாப்பு' }
];

const VALID_TAB_IDS = new Set(NAV_ITEMS.map((item) => item.id));
const MOBILE_BOTTOM_IDS = ['overview', 'enquiries', 'events', 'gallery', 'donations'];

function resolveRouteTab(pathname: string): string | null {
  const clean = pathname.replace(/\/+$/, '') || '/';
  if (clean === '/') return 'overview';
  const segment = clean.slice(1);
  return VALID_TAB_IDS.has(segment) ? segment : null;
}

export default function App() {
  const { lang, setLang, theme, toggleTheme, tr } = useAdminUi();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState<string | null>(() =>
    typeof window !== 'undefined' ? resolveRouteTab(window.location.pathname) : 'overview'
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState<{ text: string; isErr?: boolean } | null>(null);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  const notify = (text: string, isErr = false) => {
    setToast({ text, isErr });
    if (!isErr) {
      setTimeout(() => setToast(null), 5000);
    }
  };

  function navigateTab(tabId: string) {
    const safeTab = VALID_TAB_IDS.has(tabId) ? tabId : 'overview';
    setActiveTab(safeTab);
    setSidebarOpen(false);
    if (typeof window !== 'undefined') {
      const targetPath = safeTab === 'overview' ? '/' : `/${safeTab}`;
      if (window.location.pathname !== targetPath) {
        window.history.pushState(null, '', targetPath);
      }
    }
  }

  async function verifySession() {
    setAuthError('');
    if (!isSupabaseConfigured()) {
      setCheckingAuth(false);
      return;
    }
    try {
      const supabase = getSupabaseClient();
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setAdminUser(null);
        return;
      }
      const res = await adminApi<{ admin: AdminUser }>('/me');
      setAuthError('');
      setAdminUser(res.admin);
    } catch (err) {
      setAdminUser(null);
      setAuthError(err instanceof Error ? err.message : 'Unable to verify admin access.');
    } finally {
      setCheckingAuth(false);
    }
  }

  useEffect(() => {
    verifySession();

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);

    const onPopState = () => {
      setActiveTab(resolveRouteTab(window.location.pathname));
    };
    window.addEventListener('popstate', onPopState);

    const handleExpired = (evt: Event) => {
      const custom = evt as CustomEvent<{ message?: string; code?: string } | string | undefined>;
      const detail = custom.detail;
      const msg = typeof detail === 'string' ? detail : detail?.message;
      const code = typeof detail === 'object' && detail ? detail.code : undefined;

      if (code === 'SESSION_REVOKED' && isSupabaseConfigured()) {
        getSupabaseClient().auth.signOut({ scope: 'local' }).catch(() => { });
      }
      setAdminUser(null);
      setAuthError(msg || 'Your session expired. Please sign in again.');
    };
    window.addEventListener('ilangathir:session-expired', handleExpired);

    if (!isSupabaseConfigured()) {
      return () => {
        window.removeEventListener('beforeinstallprompt', onBeforeInstall);
        window.removeEventListener('popstate', onPopState);
        window.removeEventListener('ilangathir:session-expired', handleExpired);
      };
    }

    const supabase = getSupabaseClient();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) setAdminUser(null);
    });
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('popstate', onPopState);
      window.removeEventListener('ilangathir:session-expired', handleExpired);
      sub.subscription.unsubscribe();
    };
  }, []);

  async function handleInstallApp() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  }

  async function handleSignOut() {
    clearAdminApiCache();
    try {
      const supabase = getSupabaseClient();
      await supabase.auth.signOut({ scope: 'local' });
    } catch {
      // ignore
    }
    setAdminUser(null);
    setAuthError('');
  }

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-sand-50 p-6 text-center">
        <img
          src="/logos/icon.webp"
          alt="Ilangathir Trust"
          className="h-16 w-16 object-contain"
        />
        <p className="mt-4 text-sm font-bold text-brand-900">Loading Operations Console…</p>
        <div className="mt-4 h-1 w-32 overflow-hidden rounded-full bg-sand-200">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-gradient-to-r from-brand-800 via-saffron-500 to-brand-800" />
        </div>
      </div>
    );
  }

  if (activeTab === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sand-50 p-4">
        <div className="w-full max-w-md rounded-3xl border border-sand-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-saffron-50 text-saffron-600">
            <Compass className="h-7 w-7" />
          </div>
          <p className="mt-4 text-xs font-extrabold uppercase tracking-widest text-saffron-600">
            404 — Page Not Found
          </p>
          <h1 className="mt-2 text-2xl font-extrabold text-brand-900">
            Admin page not found
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            The requested route does not exist.
          </p>
          <button
            type="button"
            onClick={() => navigateTab('overview')}
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-brand-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-800"
          >
            {adminUser ? 'Go to Dashboard' : 'Go to Sign In'}
          </button>
        </div>
      </div>
    );
  }

  if (!adminUser) {
    return <LoginPage onSuccess={verifySession} onSignOut={handleSignOut} externalError={authError} />;
  }

  const currentNav = NAV_ITEMS.find((n) => n.id === activeTab) || NAV_ITEMS[0];
  const primaryBottomItems = MOBILE_BOTTOM_IDS
    .map((id) => NAV_ITEMS.find((n) => n.id === id))
    .filter((item): item is (typeof NAV_ITEMS)[number] => Boolean(item));
  const groups = ['Workspace', 'Content CMS', 'Media & Blog', 'Operations', 'Security'];

  return (
    <div className="flex min-h-screen bg-sand-50 dark:bg-[#18191B]">
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
        />
      )}

      {/* Desktop Fixed Independent Left Rail & Mobile Drawer */}
      <aside
        aria-label="Admin navigation menu"
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-[#121316] text-slate-200 shadow-2xl transition-transform duration-200 lg:w-64 lg:border-r lg:border-white/10 lg:translate-x-0 lg:shadow-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 px-5 py-4">
          <button
            type="button"
            onClick={() => navigateTab('overview')}
            className="min-w-0 text-left focus:outline-none"
            aria-label="Ilangathir Trust Dashboard"
          >
            <img src="/logos/logo-white.webp" alt="Ilangathir Trust" className="h-12 w-auto object-contain object-left" />
          </button>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label={tr('Close menu', 'Menu மூடு')}
            className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="admin-sidebar-scroll min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-3 py-4">
          {groups.map((grp) => {
            const grpItems = NAV_ITEMS.filter((i) => i.group === grp);
            const grpLabel = grpItems[0]?.groupTa || grp;
            return (
              <div key={grp}>
                <p className="px-3 pb-1.5 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                  {lang === 'ta' ? grpLabel : grp}
                </p>
                <div className="space-y-1">
                  {grpItems.map((item) => {
                    const Icon = item.icon;
                    const active = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => navigateTab(item.id)}
                        className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-xs font-semibold transition ${
                          active
                            ? 'bg-saffron-600 text-white shadow-xs'
                            : 'text-slate-300 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{lang === 'ta' ? item.labelTa : item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="shrink-0 space-y-2 border-t border-white/10 p-4">
          {installPrompt && (
            <button
              type="button"
              onClick={handleInstallApp}
              className="flex w-full items-center justify-between rounded-xl bg-saffron-600 px-3.5 py-2.5 text-xs font-bold text-white transition hover:bg-saffron-700"
            >
              <span>{tr('Install Admin App', 'Admin App நிறுவு')}</span>
              <Download className="h-3.5 w-3.5" />
            </button>
          )}
          <a
            href={PUBLIC_SITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-xl bg-white/5 px-3.5 py-2.5 text-xs font-semibold text-slate-200 hover:bg-white/10"
          >
            <span>{tr('Public Website', 'Website பாரு')}</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 rounded-xl bg-red-500/15 px-3.5 py-2.5 text-xs font-bold text-red-200 hover:bg-red-500/25"
          >
            <LogOut className="h-4 w-4" />
            <span>{tr('Sign Out', 'Logout பண்ணு')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-30 transform-gpu border-b border-sand-200 bg-white px-3 py-2.5 dark:border-[#31343B] dark:bg-[#212225] min-[360px]:px-3.5 lg:px-8 lg:py-3">
          {/* Mobile Header (< lg) */}
          <div className="flex items-center justify-between gap-2 lg:hidden">
            <div className="flex min-w-0 items-center gap-1.5 min-[360px]:gap-2">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open admin menu"
                className="-ml-1 inline-flex h-9 w-9 shrink-0 items-center justify-center bg-transparent p-0 text-brand-900 hover:text-saffron-600 focus:outline-none dark:text-slate-100"
              >
                <Menu className="h-6 w-6" strokeWidth={2.2} />
              </button>
              <img src="/logos/icon.webp" alt="Ilangathir Trust" className="hidden h-7 w-7 shrink-0 object-contain min-[380px]:block" />
              <div className="min-w-0">
                <p className="truncate text-xs font-extrabold text-brand-900 dark:text-slate-100">
                  {lang === 'ta' ? currentNav.labelTa : currentNav.label}
                </p>
                <p className="truncate text-[10px] font-bold uppercase text-saffron-600 dark:text-amber-400">
                  {lang === 'ta' ? currentNav.groupTa : currentNav.group}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              {/* Theme toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-sand-200 bg-sand-100 text-slate-700 transition hover:text-brand-900 dark:border-[#363940] dark:bg-[#292B30] dark:text-amber-300"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>

              {/* Segmented En / த Toggle */}
              <div
                role="group"
                aria-label="Language switcher"
                className="inline-flex items-center rounded-full border border-sand-200 bg-sand-100 p-0.5 dark:border-[#363940] dark:bg-[#292B30]"
              >
                <button
                  type="button"
                  onClick={() => setLang('en')}
                  aria-pressed={lang === 'en'}
                  className={`rounded-full px-2 py-0.5 text-[11px] font-bold transition ${
                    lang === 'en'
                      ? 'bg-brand-900 text-white dark:bg-blue-600'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  En
                </button>
                <button
                  type="button"
                  onClick={() => setLang('ta')}
                  aria-pressed={lang === 'ta'}
                  className={`rounded-full px-2 py-0.5 text-[11px] font-bold transition ${
                    lang === 'ta'
                      ? 'bg-brand-900 text-white dark:bg-blue-600'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  த
                </button>
              </div>

              {installPrompt && (
                <button
                  type="button"
                  onClick={handleInstallApp}
                  aria-label="Install Admin App"
                  className="inline-flex h-8 items-center gap-1 rounded-full bg-saffron-600 px-2.5 text-[11px] font-bold text-white"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span className="hidden min-[420px]:inline">App</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => navigateTab('security')}
                aria-label="Security & Sessions"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-900 text-xs font-bold text-white dark:bg-blue-600"
              >
                {adminUser.email.slice(0, 2).toUpperCase()}
              </button>
            </div>
          </div>

          {/* Desktop Header */}
          <div className="hidden items-center justify-between gap-4 lg:flex">
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-saffron-600 dark:text-amber-400">
                {lang === 'ta' ? currentNav.groupTa : currentNav.group}
              </p>
              <h1 className="truncate text-xl font-extrabold text-brand-900 dark:text-slate-100">
                {lang === 'ta' ? currentNav.labelTa : currentNav.label}
              </h1>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Theme toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                title={theme === 'dark' ? tr('Light Mode', 'Light Theme') : tr('Dark Mode', 'Dark Theme')}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-sand-200 bg-sand-100 text-slate-700 transition hover:border-brand-700 dark:border-[#363940] dark:bg-[#292B30] dark:text-amber-300"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>

              {/* Segmented En / த Toggle */}
              <div
                role="group"
                aria-label="Language switcher"
                className="inline-flex items-center rounded-full border border-sand-200 bg-sand-100 p-0.5 dark:border-[#363940] dark:bg-[#292B30]"
              >
                <button
                  type="button"
                  onClick={() => setLang('en')}
                  aria-pressed={lang === 'en'}
                  className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                    lang === 'en'
                      ? 'bg-brand-900 text-white shadow-xs dark:bg-blue-600'
                      : 'text-slate-600 hover:text-brand-900 dark:text-slate-300'
                  }`}
                >
                  En
                </button>
                <button
                  type="button"
                  onClick={() => setLang('ta')}
                  aria-pressed={lang === 'ta'}
                  className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                    lang === 'ta'
                      ? 'bg-brand-900 text-white shadow-xs dark:bg-blue-600'
                      : 'text-slate-600 hover:text-brand-900 dark:text-slate-300'
                  }`}
                >
                  த
                </button>
              </div>

              {installPrompt && (
                <button
                  type="button"
                  onClick={handleInstallApp}
                  className="inline-flex items-center gap-1.5 rounded-full border border-saffron-500/30 bg-saffron-50 px-3.5 py-1.5 text-xs font-bold text-saffron-700 transition hover:bg-saffron-100 dark:bg-amber-500/15 dark:text-amber-300"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>{tr('Install App', 'App நிறுவு')}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => navigateTab('security')}
                className="flex items-center gap-2.5 rounded-full border border-sand-200 bg-sand-50 px-3.5 py-1.5 transition hover:border-brand-700 dark:border-[#363940] dark:bg-[#292B30]"
                title={tr('Manage Security & Active Sessions', 'Security & Active Device விவரங்கள்')}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-900 text-xs font-bold text-white dark:bg-blue-600">
                  {adminUser.email.slice(0, 2).toUpperCase()}
                </span>
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{adminUser.email}</p>
                  <p className="text-[10px] font-semibold uppercase text-saffron-600 dark:text-amber-400">{adminUser.role}</p>
                </div>
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1400px] flex-1 px-0 pt-2 pb-28 sm:px-4 sm:pt-4 lg:p-8 lg:pb-12">
          {toast && (
            <div
              role={toast.isErr ? 'alert' : 'status'}
              className={`mx-3 mb-4 flex items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-sm lg:mx-0 lg:mb-6 ${
                toast.isErr
                  ? 'border-red-200 bg-red-50 text-red-800'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-800'
              }`}
            >
              <span>{toast.text}</span>
              <button
                type="button"
                onClick={() => setToast(null)}
                aria-label="Dismiss message"
                className="shrink-0 rounded-lg px-2 py-0.5 text-xs font-bold opacity-70 transition hover:bg-black/5 hover:opacity-100"
              >
                {tr('Dismiss', 'மூடு')}
              </button>
            </div>
          )}

          {activeTab === 'overview' && <OverviewPage onNavigate={navigateTab} onNotify={notify} />}
          {activeTab === 'settings' && <SiteSettingsPage onNotify={notify} />}
          {activeTab === 'pages' && <PagesSeoPage onNotify={notify} />}
          {activeTab === 'navigation' && <NavigationMarqueePage onNotify={notify} />}
          {activeTab === 'media' && <MediaLibraryPage onNotify={notify} />}
          {activeTab === 'gallery' && <GalleryManagerPage onNotify={notify} />}
          {activeTab === 'events' && <EventsActivitiesPage mode="events" onNotify={notify} />}
          {activeTab === 'activities' && <EventsActivitiesPage mode="activities" onNotify={notify} />}
          {activeTab === 'team' && <EventsActivitiesPage mode="team" onNotify={notify} />}
          {activeTab === 'blogs' && <BlogManagerPage onNotify={notify} />}
          {activeTab === 'donations' && <DonationsPage onNotify={notify} />}
          {activeTab === 'enquiries' && <InboxAndAuditPage mode="enquiries" onNotify={notify} />}
          {activeTab === 'volunteers' && <InboxAndAuditPage mode="volunteers" onNotify={notify} />}
          {activeTab === 'security' && <SecurityDevicesPage onNotify={notify} />}
          {activeTab === 'audit' && <InboxAndAuditPage mode="audit" onNotify={notify} />}
          {activeTab === 'users' && <InboxAndAuditPage mode="users" onNotify={notify} />}
        </main>
      </div>

      {/* Attached Docked Mobile Bottom Navbar (NOT floating) */}
      <nav
        aria-label="Mobile admin bottom navigation"
        className="fixed inset-x-0 bottom-0 z-40 transform-gpu border-t border-sand-200 bg-white shadow-[0_-4px_20px_rgba(11,24,46,0.08)] pb-[env(safe-area-inset-bottom)] dark:border-[#31343B] dark:bg-[#212225] lg:hidden"
      >
        <ul className="grid grid-cols-5 items-stretch">
          {primaryBottomItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <li key={item.id} className="min-w-0">
                <button
                  type="button"
                  onClick={() => navigateTab(item.id)}
                  className={`relative flex w-full min-h-[56px] flex-col items-center justify-center gap-1 px-1 py-1.5 text-center transition ${
                    active
                      ? 'bg-brand-50/70 text-brand-900 font-bold dark:bg-blue-500/15 dark:text-blue-400'
                      : 'text-slate-600 hover:bg-sand-50 hover:text-brand-900 dark:text-slate-400 dark:hover:bg-[#292B30] dark:hover:text-slate-200'
                  }`}
                >
                  {active && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-3 top-0 h-[2.5px] rounded-b-full bg-brand-900 dark:bg-blue-400"
                    />
                  )}
                  <Icon className="h-[17px] w-[17px] shrink-0" strokeWidth={2.2} />
                  <span className="w-full truncate text-[10px] font-bold leading-tight">
                    {lang === 'ta' ? item.shortLabelTa : item.shortLabel}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
