import { useEffect, useState } from 'react';
import {
  Activity,
  BookOpen,
  CalendarDays,
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

interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

const NAV_ITEMS = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard, group: 'Workspace' },
  { id: 'settings', label: 'Site Settings & Brand', icon: Settings, group: 'Content CMS' },
  { id: 'pages', label: 'Pages, Hero & SEO', icon: FileCode2, group: 'Content CMS' },
  { id: 'navigation', label: 'Menus & Marquee', icon: Navigation, group: 'Content CMS' },
  { id: 'activities', label: 'Activities & Services', icon: Sparkles, group: 'Content CMS' },
  { id: 'events', label: 'Events Management', icon: CalendarDays, group: 'Content CMS' },
  { id: 'gallery', label: 'Gallery Folders', icon: FolderOpen, group: 'Media & Blog' },
  { id: 'media', label: 'Media Library', icon: ImageIcon, group: 'Media & Blog' },
  { id: 'blogs', label: 'Blog & Articles', icon: BookOpen, group: 'Media & Blog' },
  { id: 'team', label: 'Team & Trustees', icon: Users, group: 'Media & Blog' },
  { id: 'donations', label: 'Donations & Razorpay', icon: IndianRupee, group: 'Operations' },
  { id: 'enquiries', label: 'Contact Enquiries', icon: Inbox, group: 'Operations' },
  { id: 'volunteers', label: 'Volunteers', icon: Heart, group: 'Operations' },
  { id: 'audit', label: 'Audit Logs', icon: Activity, group: 'Security' },
  { id: 'users', label: 'Admin Roles', icon: Shield, group: 'Security' }
];

export default function App() {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState<{ text: string; isErr?: boolean } | null>(null);

  const notify = (text: string, isErr = false) => {
    setToast({ text, isErr });
    setTimeout(() => setToast(null), 4500);
  };

  async function verifySession() {
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
      setAdminUser(res.admin);
    } catch {
      setAdminUser(null);
    } finally {
      setCheckingAuth(false);
    }
  }

  useEffect(() => {
    verifySession();
    if (!isSupabaseConfigured()) return;
    const supabase = getSupabaseClient();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) setAdminUser(null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    try {
      const supabase = getSupabaseClient();
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    setAdminUser(null);
  }

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      </div>
    );
  }

  if (!adminUser) {
    return <LoginPage onSuccess={verifySession} />;
  }

  const currentNav = NAV_ITEMS.find((n) => n.id === activeTab) || NAV_ITEMS[0];

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-brand-950 text-slate-200 transition-transform duration-200 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <img src="/ilangathir-logo.jpg" alt="" className="h-10 w-10 rounded-full border border-white/20 object-cover" />
            <div>
              <p className="text-sm font-bold text-white">Ilangathir Trust</p>
              <p className="text-[11px] font-medium text-brand-200">Admin Console</p>
            </div>
          </div>
          <button type="button" onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                }}
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
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 py-3.5 backdrop-blur-md sm:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
              className="rounded-xl border border-slate-200 p-2 text-slate-700 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-brand-600">{currentNav.group}</p>
              <h1 className="truncate text-lg font-extrabold text-slate-900 sm:text-xl">{currentNav.label}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
              {adminUser.email.slice(0, 2).toUpperCase()}
            </span>
            <div className="hidden text-left sm:block">
              <p className="text-xs font-bold text-slate-900">{adminUser.email}</p>
              <p className="text-[10px] font-semibold uppercase text-brand-600">{adminUser.role}</p>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-8">
          {toast && (
            <div
              role="status"
              className={`mb-6 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-sm ${
                toast.isErr
                  ? 'border-red-200 bg-red-50 text-red-800'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-800'
              }`}
            >
              {toast.text}
            </div>
          )}

          {activeTab === 'overview' && <OverviewPage onNavigate={setActiveTab} />}
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
          {activeTab === 'audit' && <InboxAndAuditPage mode="audit" onNotify={notify} />}
          {activeTab === 'users' && <InboxAndAuditPage mode="users" onNotify={notify} />}
        </main>
      </div>
    </div>
  );
}
