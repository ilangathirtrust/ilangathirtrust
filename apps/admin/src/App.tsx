import { useEffect, useState } from 'react';
import {
  Activity,
  BarChart3,
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
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Navigation,
  Share2,
  Shield,
  ShieldCheck,
  Sun,
  Users,
  X
} from 'lucide-react';
import type { AdminRole } from '@ilangathir/shared';
import { adminApi, clearAdminApiCache, prefetchAdminRoutes } from './lib/api';
import { useAdminUi } from './lib/admin-ui';
import { getSupabaseClient, isSupabaseConfigured, PUBLIC_SITE_URL } from './lib/supabase';
import { LoginPage } from './pages/LoginPage';
import { OverviewPage } from './pages/OverviewPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { PagesSeoPage } from './pages/PagesSeoPage';
import { NavigationMarqueePage } from './pages/NavigationMarqueePage';
import { SocialLinksPage } from './pages/SocialLinksPage';
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
  role: AdminRole;
  signatureVerified?: boolean;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const ALL_ROLES: AdminRole[] = ['super_admin', 'admin', 'editor', 'visitor'];
const OPS_ROLES: AdminRole[] = ['super_admin', 'admin'];

const ROLE_LABELS_TA: Record<AdminRole, string> = {
  super_admin: 'சூப்பர் அட்மின்',
  admin: 'அட்மின்',
  editor: 'எடிட்டர்',
  visitor: 'விசிட்டர்'
};

const NAV_ITEMS = [
  { id: 'overview', label: 'Dashboard', labelTa: 'டாஷ்போர்டு', shortLabel: 'Home', shortLabelTa: 'முகப்பு', icon: LayoutDashboard, group: 'Workspace', groupTa: 'பணிப்பகுதி', roles: ALL_ROLES },
  { id: 'analytics', label: 'Website Analytics', labelTa: 'வெப்சைட் அனலிடிக்ஸ்', shortLabel: 'Analytics', shortLabelTa: 'அனலிடிக்ஸ்', icon: BarChart3, group: 'Workspace', groupTa: 'பணிப்பகுதி', roles: ALL_ROLES },
  { id: 'events', label: 'Events Management', labelTa: 'ஈவென்ட்ஸ்', shortLabel: 'Events', shortLabelTa: 'ஈவென்ட்ஸ்', icon: CalendarDays, group: 'Content CMS', groupTa: 'கன்டென்ட் மேலாண்மை', roles: ALL_ROLES },
  { id: 'gallery', label: 'Gallery Folders', labelTa: 'கேலரி ஃபோல்டர்கள்', shortLabel: 'Gallery', shortLabelTa: 'கேலரி', icon: FolderOpen, group: 'Media & Blog', groupTa: 'மீடியா & பிளாக்', roles: ALL_ROLES },
  { id: 'enquiries', label: 'Contact Enquiries', labelTa: 'தொடர்பு மெசேஜ்கள்', shortLabel: 'Enquiries', shortLabelTa: 'மெசேஜ்', icon: Inbox, group: 'Operations', groupTa: 'அன்றாட நிர்வாகம்', roles: ALL_ROLES },
  { id: 'donations', label: 'Donations & Payments', labelTa: 'நன்கொடை & பேமெண்ட்', shortLabel: 'Donate', shortLabelTa: 'நன்கொடை', icon: IndianRupee, group: 'Operations', groupTa: 'அன்றாட நிர்வாகம்', roles: OPS_ROLES },
  { id: 'pages', label: 'Pages & Hero', labelTa: 'பேஜஸ் & பேனர்', shortLabel: 'Pages', shortLabelTa: 'பேஜஸ்', icon: FileCode2, group: 'Content CMS', groupTa: 'கன்டென்ட் மேலாண்மை', roles: ALL_ROLES },
  { id: 'navigation', label: 'Menus & Marquee', labelTa: 'மெனு & மார்க்யூ', shortLabel: 'Menus', shortLabelTa: 'மெனு', icon: Navigation, group: 'Content CMS', groupTa: 'கன்டென்ட் மேலாண்மை', roles: ALL_ROLES },
  { id: 'social', label: 'Social Media Links', labelTa: 'சமூக வலைதளங்கள்', shortLabel: 'Social', shortLabelTa: 'சோஷியல்', icon: Share2, group: 'Content CMS', groupTa: 'கன்டென்ட் மேலாண்மை', roles: ALL_ROLES },
  { id: 'activities', label: 'Activities & Services', labelTa: 'நலப்பணிகள்', shortLabel: 'Activities', shortLabelTa: 'பணிகள்', icon: Layers, group: 'Content CMS', groupTa: 'கன்டென்ட் மேலாண்மை', roles: ALL_ROLES },
  { id: 'media', label: 'Media Library', labelTa: 'மீடியா ஃபைல்கள்', shortLabel: 'Media', shortLabelTa: 'மீடியா', icon: ImageIcon, group: 'Media & Blog', groupTa: 'மீடியா & பிளாக்', roles: ALL_ROLES },
  { id: 'blogs', label: 'Blog & Articles', labelTa: 'பிளாக் & கட்டுரைகள்', shortLabel: 'Blog', shortLabelTa: 'பிளாக்', icon: BookOpen, group: 'Media & Blog', groupTa: 'மீடியா & பிளாக்', roles: ALL_ROLES },
  { id: 'team', label: 'Team & Trustees', labelTa: 'டீம் & நிர்வாகிகள்', shortLabel: 'Team', shortLabelTa: 'டீம்', icon: Users, group: 'Media & Blog', groupTa: 'மீடியா & பிளாக்', roles: ALL_ROLES },
  { id: 'volunteers', label: 'Volunteers', labelTa: 'தன்னார்வலர்கள்', shortLabel: 'Volunteers', shortLabelTa: 'தன்னார்வலர்', icon: Heart, group: 'Operations', groupTa: 'அன்றாட நிர்வாகம்', roles: ALL_ROLES },
  { id: 'security', label: 'Security & Devices', labelTa: 'செக்யூரிட்டி & டிவைஸ்', shortLabel: 'Security', shortLabelTa: 'செக்யூரிட்டி', icon: ShieldCheck, group: 'Security', groupTa: 'பாதுகாப்பு', roles: ALL_ROLES },
  { id: 'audit', label: 'Audit Logs', labelTa: 'ஆடிட் லாக்', shortLabel: 'Audit', shortLabelTa: 'ஆடிட்', icon: Activity, group: 'Security', groupTa: 'பாதுகாப்பு', roles: OPS_ROLES },
  { id: 'users', label: 'Admin Roles & Users', labelTa: 'யூசர்ஸ் & ரோல்கள்', shortLabel: 'Users', shortLabelTa: 'யூசர்ஸ்', icon: Shield, group: 'Security', groupTa: 'பாதுகாப்பு', roles: OPS_ROLES }
];

const VALID_TAB_IDS = new Set(NAV_ITEMS.map((item) => item.id));
// Top 5 most essential daily links for mobile bottom navigation (with smart fallback if role hides Donations)
const MOBILE_BOTTOM_IDS = ['overview', 'events', 'gallery', 'enquiries', 'donations'];

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

  function scrollPageToTop() {
    if (typeof window === 'undefined') return;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }

  function navigateTab(tabId: string) {
    const safeTab = VALID_TAB_IDS.has(tabId) ? tabId : 'overview';
    setActiveTab(safeTab);
    setSidebarOpen(false);
    scrollPageToTop();
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
      prefetchAdminRoutes(res.admin.role);
    } catch (err) {
      setAdminUser(null);
      setAuthError(
        err instanceof Error
          ? err.message
          : tr('Unable to verify admin access.', 'அட்மின் அனுமதியை சரிபார்க்க முடியலைங்க.')
      );
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
        getSupabaseClient().auth.signOut({ scope: 'local' }).catch(() => {});
      }
      setAdminUser(null);
      setAuthError(msg || tr('Your session expired. Please sign in again.', 'செஷன் முடிஞ்சிடுச்சு, மறுபடியும் லாகின் பண்ணுங்க.'));
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

  useEffect(() => {
    scrollPageToTop();
  }, [activeTab]);

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
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F6F7F9] p-6 text-center dark:bg-[#0F1117]">
        <img
          src="/logos/icon.webp"
          alt="Ilangathir Trust"
          className="h-14 w-14 object-contain"
        />
        <p className="mt-4 text-sm font-bold text-slate-900 dark:text-slate-100">
          {tr('Loading Operations Console…', 'அட்மின் பக்கம் லோடு ஆகுதுங்க…')}
        </p>
        <div className="mt-4 h-1 w-32 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-blue-600" />
        </div>
      </div>
    );
  }

  if (activeTab === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F6F7F9] p-4 dark:bg-[#0F1117]">
        <div className="admin-card w-full max-w-md p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
            <Compass className="h-7 w-7" />
          </div>
          <p className="mt-4 text-xs font-extrabold uppercase tracking-widest text-amber-600">
            {tr('404 — Page Not Found', '404 — இந்த பக்கம் இல்லீங்க')}
          </p>
          <h1 className="mt-2 text-2xl font-extrabold text-slate-900">
            {tr('Admin page not found', 'அட்மின் பக்கம் கிடைக்கல')}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {tr('The requested route does not exist.', 'நீங்க தேடுற பக்கம் இங்க இல்லங்க.')}
          </p>
          <button
            type="button"
            onClick={() => navigateTab('overview')}
            className="admin-btn-primary mt-6 px-5 py-2.5 text-sm"
          >
            {adminUser
              ? tr('Go to Dashboard', 'முகப்புக்குப் போ')
              : tr('Go to Sign In', 'லாகின் பக்கத்துக்குப் போ')}
          </button>
        </div>
      </div>
    );
  }

  if (!adminUser) {
    return <LoginPage onSuccess={verifySession} onSignOut={handleSignOut} externalError={authError} />;
  }

  const allowedNavItems = NAV_ITEMS.filter((n) => n.roles.includes(adminUser.role));
  const resolvedActive = allowedNavItems.some((n) => n.id === activeTab) ? activeTab! : 'overview';
  const currentNav = allowedNavItems.find((n) => n.id === resolvedActive) || allowedNavItems[0];
  const primaryBottomItems = MOBILE_BOTTOM_IDS
    .map((id) => allowedNavItems.find((n) => n.id === id))
    .filter((item): item is (typeof NAV_ITEMS)[number] => Boolean(item));
  const fallbackFifth = allowedNavItems.find((n) => n.id === 'pages');
  if (primaryBottomItems.length < 5 && fallbackFifth && !primaryBottomItems.some((i) => i.id === fallbackFifth.id)) {
    primaryBottomItems.push(fallbackFifth);
  }
  const groups = ['Workspace', 'Content CMS', 'Media & Blog', 'Operations', 'Security'];
  const isVisitor = adminUser.role === 'visitor';
  const displayRole = lang === 'ta' ? ROLE_LABELS_TA[adminUser.role] : adminUser.role;

  return (
    <div className="flex min-h-screen bg-[#F6F7F9] dark:bg-[#0F1117]">
      <div
        onClick={() => setSidebarOpen(false)}
        aria-hidden={!sidebarOpen}
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-[1px] transition-opacity duration-300 lg:hidden ${
          sidebarOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* Desktop Fixed Independent Left Rail & Mobile Drawer */}
      <aside
        aria-label={tr('Admin navigation menu', 'அட்மின் மெனு')}
        className={`fixed inset-y-0 left-0 z-50 flex h-[100dvh] w-[min(86vw,288px)] flex-col border-r border-white/10 bg-[#111318] text-slate-200 shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:w-64 lg:translate-x-0 lg:shadow-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 px-5 py-4">
          <button
            type="button"
            onClick={() => navigateTab('overview')}
            className="min-w-0 text-left focus:outline-none"
            aria-label={tr('Ilangathir Trust Dashboard', 'இளங்கதிர் அறக்கட்டளை முகப்பு')}
          >
            <img src="/logos/logo-white.webp" alt="Ilangathir Trust" className="h-11 w-auto object-contain object-left" />
          </button>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label={tr('Close menu', 'மெனு மூடு')}
            className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="admin-sidebar-scroll min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-3 py-4">
          {groups.map((grp) => {
            const grpItems = allowedNavItems.filter((i) => i.group === grp);
            if (!grpItems.length) return null;
            const grpLabel = grpItems[0]?.groupTa || grp;
            return (
              <div key={grp}>
                <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  {lang === 'ta' ? grpLabel : grp}
                </p>
                <div className="space-y-1">
                  {grpItems.map((item) => {
                    const Icon = item.icon;
                    const active = resolvedActive === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => navigateTab(item.id)}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-xs font-semibold transition ${
                          active
                            ? 'bg-blue-600 text-white shadow-xs'
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

        <div className="shrink-0 space-y-2 border-t border-white/10 p-3.5">
          {installPrompt && (
            <button
              type="button"
              onClick={handleInstallApp}
              className="flex w-full items-center justify-between rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-blue-700"
            >
              <span>{tr('Install Admin App', 'ஆப் இன்ஸ்டால் பண்ணு')}</span>
              <Download className="h-3.5 w-3.5" />
            </button>
          )}
          <a
            href={PUBLIC_SITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-xl bg-white/5 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10"
          >
            <span>{tr('Public Website', 'வெப்சைட் பாரு')}</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 rounded-xl bg-red-500/15 px-3.5 py-2 text-xs font-bold text-red-200 hover:bg-red-500/25"
          >
            <LogOut className="h-4 w-4" />
            <span>{tr('Sign Out', 'வெளியேறு')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex min-w-0 max-w-full flex-1 flex-col overflow-x-clip lg:pl-64">
        <header className="sticky top-0 z-30 transform-gpu border-b border-slate-200/90 bg-white/95 px-2.5 py-2.5 backdrop-blur-md dark:border-[#262A34] dark:bg-[#161920]/95 min-[360px]:px-3.5 sm:px-5 lg:px-8 lg:py-3">
          {/* Mobile Header (< lg) — No install/download icon button */}
          <div className="flex items-center justify-between gap-2 lg:hidden">
            <div className="flex min-w-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                aria-label={tr('Open admin menu', 'மெனு திற')}
                className="-ml-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-700 transition hover:bg-slate-100 focus:outline-none dark:text-slate-200 dark:hover:bg-[#1C2029]"
              >
                <Menu className="h-5 w-5" strokeWidth={2.2} />
              </button>
              <img src="/logos/icon.webp" alt="Ilangathir Trust" className="hidden h-7 w-7 shrink-0 object-contain min-[370px]:block" />
              <div className="min-w-0">
                <p className="truncate text-xs font-extrabold text-slate-900 dark:text-slate-100">
                  {lang === 'ta' ? currentNav.labelTa : currentNav.label}
                </p>
                <p className="truncate text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400">
                  {lang === 'ta' ? currentNav.groupTa : currentNav.group}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              {/* Theme toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? tr('Switch to light mode', 'லைட் மோட்') : tr('Switch to dark mode', 'டார்க் மோட்')}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-700 transition hover:text-slate-900 dark:border-[#2C313D] dark:bg-[#1C2029] dark:text-amber-300"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>

              {/* Segmented En / த Toggle */}
              <div
                role="group"
                aria-label={tr('Language switcher', 'மொழி மாற்றம்')}
                className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 p-0.5 dark:border-[#2C313D] dark:bg-[#1C2029]"
              >
                <button
                  type="button"
                  onClick={() => setLang('en')}
                  aria-pressed={lang === 'en'}
                  className={`rounded-full px-2 py-0.5 text-[11px] font-bold transition ${
                    lang === 'en'
                      ? 'bg-blue-600 text-white'
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
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  த
                </button>
              </div>

              <button
                type="button"
                onClick={() => navigateTab('security')}
                aria-label={tr('Security & Sessions', 'செக்யூரிட்டி & டிவைஸ்')}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white"
              >
                {adminUser.email.slice(0, 2).toUpperCase()}
              </button>
            </div>
          </div>

          {/* Desktop Header */}
          <div className="hidden items-center justify-between gap-4 lg:flex">
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                {lang === 'ta' ? currentNav.groupTa : currentNav.group}
              </p>
              <h1 className="truncate text-lg font-extrabold text-slate-900 dark:text-slate-100">
                {lang === 'ta' ? currentNav.labelTa : currentNav.label}
              </h1>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Theme toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? tr('Switch to light mode', 'லைட் மோட்') : tr('Switch to dark mode', 'டார்க் மோட்')}
                title={theme === 'dark' ? tr('Light Mode', 'லைட் மோட்') : tr('Dark Mode', 'டார்க் மோட்')}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-700 transition hover:border-blue-500 dark:border-[#2C313D] dark:bg-[#1C2029] dark:text-amber-300"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>

              {/* Segmented En / த Toggle */}
              <div
                role="group"
                aria-label={tr('Language switcher', 'மொழி மாற்றம்')}
                className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 p-0.5 dark:border-[#2C313D] dark:bg-[#1C2029]"
              >
                <button
                  type="button"
                  onClick={() => setLang('en')}
                  aria-pressed={lang === 'en'}
                  className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                    lang === 'en'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
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
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
                  }`}
                >
                  த
                </button>
              </div>

              {installPrompt && (
                <button
                  type="button"
                  onClick={handleInstallApp}
                  className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-50 px-3.5 py-1.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100 dark:bg-blue-500/15 dark:text-blue-300"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>{tr('Install App', 'ஆப் நிறுவு')}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => navigateTab('security')}
                className="flex items-center gap-2.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 transition hover:border-blue-500 dark:border-[#2C313D] dark:bg-[#1C2029]"
                title={tr('Manage Security & Active Sessions', 'செக்யூரிட்டி & டிவைஸ் விவரம்')}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                  {adminUser.email.slice(0, 2).toUpperCase()}
                </span>
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{adminUser.email}</p>
                  <p className="text-[10px] font-semibold uppercase text-blue-600 dark:text-blue-400">{displayRole}</p>
                </div>
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full min-w-0 max-w-[1360px] flex-1 px-2.5 pt-3 pb-24 min-[360px]:px-3.5 sm:px-6 sm:pt-5 lg:px-8 lg:py-6 lg:pb-12">
          {toast && (
            <div
              role={toast.isErr ? 'alert' : 'status'}
              className={`mb-4 flex items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-sm ${
                toast.isErr
                  ? 'border-red-200 bg-red-50 text-red-800'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-800'
              }`}
            >
              <span>{toast.text}</span>
              <button
                type="button"
                onClick={() => setToast(null)}
                aria-label={tr('Dismiss message', 'மூடு')}
                className="shrink-0 rounded-lg px-2 py-0.5 text-xs font-bold opacity-70 transition hover:bg-black/5 hover:opacity-100"
              >
                {tr('Dismiss', 'மூடு')}
              </button>
            </div>
          )}

          {isVisitor && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-bold text-amber-800">
              {tr(
                'Read-Only Visitor Access — Editing and write actions are disabled for your role.',
                'ரீட்-ஒன்லி விசிட்டர் மோட் — உங்களால விவரம் பார்க்க மட்டும்தான் முடியும், மாத்த முடியாதுங்க.'
              )}
            </div>
          )}

          {resolvedActive === 'overview' && <OverviewPage onNavigate={navigateTab} onNotify={notify} userRole={adminUser.role} />}
          {resolvedActive === 'analytics' && <AnalyticsPage onNotify={notify} userRole={adminUser.role} />}
          {resolvedActive === 'pages' && <PagesSeoPage onNotify={notify} />}
          {resolvedActive === 'navigation' && <NavigationMarqueePage onNotify={notify} />}
          {resolvedActive === 'social' && <SocialLinksPage onNotify={notify} />}
          {resolvedActive === 'media' && <MediaLibraryPage onNotify={notify} />}
          {resolvedActive === 'gallery' && <GalleryManagerPage onNotify={notify} />}
          {resolvedActive === 'events' && <EventsActivitiesPage mode="events" onNotify={notify} />}
          {resolvedActive === 'activities' && <EventsActivitiesPage mode="activities" onNotify={notify} />}
          {resolvedActive === 'team' && <EventsActivitiesPage mode="team" onNotify={notify} />}
          {resolvedActive === 'blogs' && <BlogManagerPage onNotify={notify} />}
          {resolvedActive === 'donations' && <DonationsPage onNotify={notify} />}
          {resolvedActive === 'enquiries' && <InboxAndAuditPage mode="enquiries" onNotify={notify} />}
          {resolvedActive === 'volunteers' && <InboxAndAuditPage mode="volunteers" onNotify={notify} />}
          {resolvedActive === 'security' && <SecurityDevicesPage onNotify={notify} />}
          {resolvedActive === 'audit' && <InboxAndAuditPage mode="audit" onNotify={notify} />}
          {resolvedActive === 'users' && (
            <InboxAndAuditPage mode="users" onNotify={notify} currentUser={adminUser} />
          )}
        </main>
      </div>

      {/* Reordered Top-5 Mobile Bottom Navbar */}
      <nav
        aria-label={tr('Mobile admin bottom navigation', 'மொபைல் கீழ் மெனு')}
        className="fixed inset-x-0 bottom-0 z-40 transform-gpu border-t border-slate-200/90 bg-white/95 shadow-[0_-4px_20px_rgba(15,23,42,0.06)] backdrop-blur-md pb-[env(safe-area-inset-bottom)] dark:border-[#262A34] dark:bg-[#161920]/95 lg:hidden"
      >
        <ul
          className="grid items-stretch"
          style={{ gridTemplateColumns: `repeat(${primaryBottomItems.length}, minmax(0, 1fr))` }}
        >
          {primaryBottomItems.map((item) => {
            const Icon = item.icon;
            const active = resolvedActive === item.id;
            return (
              <li key={item.id} className="min-w-0">
                <button
                  type="button"
                  onClick={() => navigateTab(item.id)}
                  className={`relative flex min-h-[56px] w-full flex-col items-center justify-center gap-1 px-1 py-1.5 text-center transition ${
                    active
                      ? 'bg-blue-50/70 font-bold text-blue-600 dark:bg-blue-500/15 dark:text-blue-400'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-[#1C2029] dark:hover:text-slate-200'
                  }`}
                >
                  {active && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-3 top-0 h-[2.5px] rounded-b-full bg-blue-600 dark:bg-blue-400"
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
