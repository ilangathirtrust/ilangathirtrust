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
  Navigation,
  Settings,
  Shield,
  ShieldCheck,
  Sparkles,
  Users,
  X
} from 'lucide-react';
import { adminApi } from './lib/api';
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
  { id: 'overview', label: 'Dashboard', shortLabel: 'Home', icon: LayoutDashboard, group: 'Workspace' },
  { id: 'pages', label: 'Pages, Hero & SEO', shortLabel: 'Pages', icon: FileCode2, group: 'Content CMS' },
  { id: 'events', label: 'Events Management', shortLabel: 'Events', icon: CalendarDays, group: 'Content CMS' },
  { id: 'gallery', label: 'Gallery Folders', shortLabel: 'Gallery', icon: FolderOpen, group: 'Media & Blog' },
  { id: 'donations', label: 'Donations & Payments', shortLabel: 'Donate', icon: IndianRupee, group: 'Operations' },
  { id: 'settings', label: 'Site Settings & Brand', shortLabel: 'Settings', icon: Settings, group: 'Content CMS' },
  { id: 'navigation', label: 'Menus & Marquee', shortLabel: 'Menus', icon: Navigation, group: 'Content CMS' },
  { id: 'activities', label: 'Activities & Services', shortLabel: 'Activities', icon: Sparkles, group: 'Content CMS' },
  { id: 'media', label: 'Media Library', shortLabel: 'Media', icon: ImageIcon, group: 'Media & Blog' },
  { id: 'blogs', label: 'Blog & Articles', shortLabel: 'Blog', icon: BookOpen, group: 'Media & Blog' },
  { id: 'team', label: 'Team & Trustees', shortLabel: 'Team', icon: Users, group: 'Media & Blog' },
  { id: 'enquiries', label: 'Contact Enquiries', shortLabel: 'Enquiries', icon: Inbox, group: 'Operations' },
  { id: 'volunteers', label: 'Volunteers', shortLabel: 'Volunteers', icon: Heart, group: 'Operations' },
  { id: 'security', label: 'Security & Devices', shortLabel: 'Security', icon: ShieldCheck, group: 'Security' },
  { id: 'audit', label: 'Audit Logs', shortLabel: 'Audit', icon: Activity, group: 'Security' },
  { id: 'users', label: 'Admin Roles', shortLabel: 'Roles', icon: Shield, group: 'Security' }
];

const VALID_TAB_IDS = new Set(NAV_ITEMS.map((item) => item.id));
const MOBILE_BOTTOM_IDS = new Set(['overview', 'pages', 'events', 'gallery', 'donations']);

function resolveRouteTab(pathname: string): string | null {
  const clean = pathname.replace(/\/+$/, '') || '/';
  if (clean === '/') return 'overview';
  const segment = clean.slice(1);
  return VALID_TAB_IDS.has(segment) ? segment : null;
}

export default function App() {
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
      <div className="flex min-h-screen flex-col items-center justify-center bg-sand-50 p-4">
        <div className="relative flex h-20 w-20 items-center justify-center">
          <span className="absolute inset-0 animate-spin rounded-full border-2 border-sand-200 border-t-saffron-600 border-r-brand-900" />
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white p-1 shadow-sm">
            <img
              src="/logos/circular-icon.png"
              alt="Ilangathir Trust"
              className="h-full w-full object-contain"
            />
          </div>
        </div>
        <p className="mt-4 text-sm font-bold text-brand-900">Loading Operations Console…</p>
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
  const primaryBottomItems = NAV_ITEMS.filter((item) => MOBILE_BOTTOM_IDS.has(item.id));
  const groups = ['Workspace', 'Content CMS', 'Media & Blog', 'Operations', 'Security'];

  return (
    <div className="flex min-h-screen bg-sand-50">
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-brand-950/55 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Desktop Sidebar & Mobile Menubar Drawer */}
      <aside
        aria-label="Admin navigation menu"
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-brand-950 text-slate-200 shadow-2xl transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:shrink-0 lg:translate-x-0 lg:shadow-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 px-5 py-4">
          <div className="min-w-0">
            <img src="/logos/logo-white.png" alt="Ilangathir Trust" className="h-9 w-auto object-contain object-left" />
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-saffron-400">Operations Console</p>
          </div>
          <button type="button" onClick={() => setSidebarOpen(false)} aria-label="Close menu" className="rounded-lg p-1 text-slate-300 hover:bg-white/10 lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="admin-sidebar-scroll min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-3 py-4">
          {groups.map((grp) => {
            const grpItems = NAV_ITEMS.filter((i) => i.group === grp);
            return (
              <div key={grp}>
                <p className="px-3 pb-1.5 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                  {grp}
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
                        className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-xs font-semibold transition ${active
                            ? 'bg-saffron-600 text-white shadow-xs'
                            : 'text-slate-300 hover:bg-white/10 hover:text-white'
                          }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="space-y-2 border-t border-white/10 p-4">
          {installPrompt && (
            <button
              type="button"
              onClick={handleInstallApp}
              className="flex w-full items-center justify-between rounded-xl bg-saffron-600 px-3.5 py-2.5 text-xs font-bold text-white transition hover:bg-saffron-700"
            >
              <span>Install Admin App</span>
              <Download className="h-3.5 w-3.5" />
            </button>
          )}
          <a
            href={PUBLIC_SITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-xl bg-white/5 px-3.5 py-2.5 text-xs font-semibold text-slate-200 hover:bg-white/10"
          >
            <span>Public Website</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 rounded-xl bg-red-500/15 px-3.5 py-2.5 text-xs font-bold text-red-200 hover:bg-red-500/25"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-sand-200 bg-white/95 px-3.5 py-3 backdrop-blur-xl sm:px-8">
          {/* Mobile Header (< lg): Clean bare left menu icon + title + quick install/avatar */}
          <div className="flex items-center justify-between gap-2 lg:hidden">
            <div className="flex min-w-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open admin menu"
                className="-ml-1 inline-flex h-9 w-9 shrink-0 items-center justify-center bg-transparent p-0 text-brand-900 hover:text-saffron-600 focus:outline-none"
              >
                <Menu className="h-6 w-6" strokeWidth={2.2} />
              </button>
              <img src="/logos/circular-icon.png" alt="Ilangathir Trust" className="h-8 w-8 shrink-0 object-contain" />
              <div className="min-w-0">
                <p className="truncate text-xs font-extrabold text-brand-900">{currentNav.label}</p>
                <p className="truncate text-[10px] font-bold uppercase text-saffron-600">{currentNav.group}</p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              {installPrompt && (
                <button
                  type="button"
                  onClick={handleInstallApp}
                  aria-label="Install Admin App"
                  className="inline-flex h-8 items-center gap-1 rounded-full bg-saffron-600 px-2.5 text-[11px] font-bold text-white"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span className="hidden min-[360px]:inline">App</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => navigateTab('security')}
                aria-label="Security & Sessions"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-900 text-xs font-bold text-white"
              >
                {adminUser.email.slice(0, 2).toUpperCase()}
              </button>
            </div>
          </div>

          {/* Desktop Header */}
          <div className="hidden items-center justify-between gap-4 lg:flex">
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-saffron-600">{currentNav.group}</p>
              <h1 className="truncate text-xl font-extrabold text-brand-900">{currentNav.label}</h1>
            </div>

            <div className="flex items-center gap-3">
              {installPrompt && (
                <button
                  type="button"
                  onClick={handleInstallApp}
                  className="inline-flex items-center gap-1.5 rounded-full border border-saffron-500/30 bg-saffron-50 px-3.5 py-1.5 text-xs font-bold text-saffron-700 transition hover:bg-saffron-100"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Install App</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => navigateTab('security')}
                className="flex items-center gap-2.5 rounded-full border border-sand-200 bg-sand-50 px-3.5 py-1.5 transition hover:border-brand-700"
                title="Manage Security & Active Sessions"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-900 text-xs font-bold text-white">
                  {adminUser.email.slice(0, 2).toUpperCase()}
                </span>
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-900">{adminUser.email}</p>
                  <p className="text-[10px] font-semibold uppercase text-saffron-600">{adminUser.role}</p>
                </div>
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1400px] flex-1 p-3.5 pb-24 min-[360px]:p-4 sm:p-8 lg:pb-10">
          {toast && (
            <div
              role={toast.isErr ? 'alert' : 'status'}
              className={`mb-6 flex items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-sm ${toast.isErr
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
                Dismiss
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
        className="fixed inset-x-0 bottom-0 z-40 border-t border-sand-200 bg-white/95 shadow-[0_-4px_20px_rgba(11,24,46,0.08)] backdrop-blur-lg pb-[env(safe-area-inset-bottom)] lg:hidden"
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
                  className={`relative flex w-full min-h-[56px] flex-col items-center justify-center gap-1 px-1 py-1.5 text-center transition ${active
                      ? 'bg-brand-50/70 text-brand-900 font-bold'
                      : 'text-slate-600 hover:bg-sand-50 hover:text-brand-900'
                    }`}
                >
                  {active && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-3 top-0 h-[2.5px] rounded-b-full bg-brand-900"
                    />
                  )}
                  <Icon className="h-[17px] w-[17px] shrink-0" strokeWidth={2.2} />
                  <span className="w-full truncate text-[10px] font-bold leading-tight">
                    {item.shortLabel}
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
