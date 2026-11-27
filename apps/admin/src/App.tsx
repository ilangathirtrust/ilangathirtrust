import { useEffect, useState } from 'react';
import {
  Activity,
  BookOpen,
  CalendarDays,
  Compass,
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

const NAV_ITEMS = [
  { id: 'overview', label: 'Dashboard', shortLabel: 'Home', icon: LayoutDashboard, group: 'Workspace' },
  { id: 'pages', label: 'Pages, Hero & SEO', shortLabel: 'Pages', icon: FileCode2, group: 'Content CMS' },
  { id: 'events', label: 'Events Management', shortLabel: 'Events', icon: CalendarDays, group: 'Content CMS' },
  { id: 'gallery', label: 'Gallery Folders', shortLabel: 'Gallery', icon: FolderOpen, group: 'Media & Blog' },
  { id: 'donations', label: 'Donations & Payments', shortLabel: 'Donate', icon: IndianRupee, group: 'Operations' },
  // Remaining items live in the Desktop Sidebar AND Mobile Menubar Drawer
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
      setAuthError(msg || 'Your session expired. Please sign in again.');
    };
    window.addEventListener('ilangathir:session-expired', handleExpired);

    if (!isSupabaseConfigured()) {
      return () => {
        window.removeEventListener('popstate', onPopState);
        window.removeEventListener('ilangathir:session-expired', handleExpired);
      };
    }

    const supabase = getSupabaseClient();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) setAdminUser(null);
    });
    return () => {
      window.removeEventListener('popstate', onPopState);
      window.removeEventListener('ilangathir:session-expired', handleExpired);
      sub.subscription.unsubscribe();
    };
  }, []);

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
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      </div>
    );
  }

  if (activeTab === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white p-4">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
            <Compass className="h-7 w-7" />
          </div>
          <p className="mt-4 text-xs font-extrabold uppercase tracking-widest text-brand-700">
            404 — Page Not Found
          </p>
          <h1 className="mt-2 text-2xl font-extrabold text-slate-900">
            Admin page not found
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            The requested admin route does not exist or has not been created.
          </p>
          <button
            type="button"
            onClick={() => navigateTab('overview')}
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700"
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
    <div className="flex min-h-screen bg-slate-50">
      {/* Mobile Menu Drawer Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Desktop Sidebar & Mobile Menubar Drawer (contains ALL items grouped cleanly) */}
      <aside
        aria-label="Admin navigation menu"
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-[#081030] text-slate-200 shadow-2xl transition-transform duration-200 lg:static lg:w-64 lg:translate-x-0 lg:shadow-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <img src="/ilangathir-logo.jpg" alt="" className="h-10 w-10 rounded-full border border-white/20 object-cover" />
            <div>
              <p className="text-sm font-bold text-white">Ilangathir Trust</p>
              <p className="text-[11px] font-medium text-amber-300">Admin Console</p>
            </div>
          </div>
          <button type="button" onClick={() => setSidebarOpen(false)} aria-label="Close menu" className="rounded-lg p-1 text-slate-300 hover:bg-white/10 lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
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
                        className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-xs font-semibold transition ${
                          active
                            ? 'bg-brand-600 text-white shadow'
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
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-xl sm:px-8">
          {/* Mobile Header */}
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open admin menu"
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-800"
            >
              <Menu className="h-4 w-4" />
              <span className="hidden min-[360px]:inline">More</span>
            </button>

            <div className="flex min-w-0 items-center justify-center gap-2">
              <img src="/ilangathir-logo.jpg" alt="" className="h-8 w-8 shrink-0 rounded-full border border-slate-200 object-cover" />
              <div className="min-w-0 text-center min-[380px]:text-left">
                <p className="truncate text-xs font-extrabold text-slate-900">{currentNav.label}</p>
                <p className="text-[10px] font-bold uppercase text-brand-700">{currentNav.group}</p>
              </div>
            </div>

            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white shadow-xs">
              {adminUser.email.slice(0, 2).toUpperCase()}
            </span>
          </div>

          {/* Desktop Header */}
          <div className="hidden items-center justify-between gap-4 lg:flex">
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-brand-700">{currentNav.group}</p>
              <h1 className="truncate text-xl font-extrabold text-slate-900">{currentNav.label}</h1>
            </div>

            <button
              type="button"
              onClick={() => navigateTab('security')}
              className="flex items-center gap-2.5 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 transition hover:border-brand-300"
              title="Manage Security & Active Sessions"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                {adminUser.email.slice(0, 2).toUpperCase()}
              </span>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-900">{adminUser.email}</p>
                <p className="text-[10px] font-semibold uppercase text-brand-700">{adminUser.role}</p>
              </div>
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1400px] flex-1 p-4 pb-24 sm:p-8 lg:pb-10">
          {toast && (
            <div
              role={toast.isErr ? 'alert' : 'status'}
              className={`mb-6 flex items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-sm ${
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
                Dismiss
              </button>
            </div>
          )}

          {activeTab === 'overview' && <OverviewPage onNavigate={navigateTab} />}
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

      {/* Mobile Floating Bottom Navbar */}
      <nav
        aria-label="Mobile admin bottom navigation"
        className="fixed bottom-3 left-2 right-2 z-40 mx-auto max-w-md rounded-2xl border border-slate-200 bg-white/95 px-1 py-1.5 shadow-[0_12px_34px_rgba(8,16,48,0.16)] backdrop-blur-xl lg:hidden"
      >
        <ul className="grid grid-cols-5 items-stretch gap-1">
          {primaryBottomItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <li key={item.id} className="min-w-0">
                <button
                  type="button"
                  onClick={() => navigateTab(item.id)}
                  className={`flex w-full flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-center transition ${
                    active
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" strokeWidth={2.2} />
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
