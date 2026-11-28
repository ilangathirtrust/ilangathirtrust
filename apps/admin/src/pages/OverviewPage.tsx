import { useEffect, useState } from 'react';
import {
  Activity,
  BookOpen,
  CalendarDays,
  Heart,
  Images,
  Inbox,
  IndianRupee,
  Loader2,
  Plus,
  Sparkles
} from 'lucide-react';
import { adminApi } from '../lib/api';
import { useAdminUi } from '../lib/admin-ui';

interface DashboardData {
  donationsEnabled?: boolean;
  stats: {
    total_donations_paise: number;
    paid_donations_count: number;
    pending_donations_count: number;
    failed_donations_count: number;
    published_activities: number;
    upcoming_events: number;
    past_events: number;
    published_blogs: number;
    draft_blogs: number;
    gallery_folders: number;
    gallery_items: number;
    new_enquiries: number;
    new_volunteers: number;
  };
  recentDonations: Array<{ id: string; receipt_number: string; donor_name: string; amount_paise: number; status: string; created_at: string }>;
  recentEvents: Array<{ id: string; title_en: string; event_date: string; status: string }>;
  recentBlogs: Array<{ id: string; title_en: string; status: string; created_at: string }>;
  recentActivities: Array<{ id: string; actor_email: string; action: string; entity_type: string; created_at: string }>;
}

export function OverviewPage({
  onNavigate,
  onNotify,
  userRole
}: {
  onNavigate: (tab: string) => void;
  onNotify?: (msg: string, isErr?: boolean) => void;
  userRole?: string;
}) {
  const { tr } = useAdminUi();
  const canToggleDonations = userRole === 'super_admin' || userRole === 'admin';
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toggling, setToggling] = useState(false);

  const loadDashboard = (force = false) => {
    setLoading(true);
    setError('');
    adminApi<DashboardData>('/dashboard', { forceRefresh: force })
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : tr('Could not load dashboard overview.', 'Dashboard Load ஆகல. Retry பண்ணிப் பாருங்க.')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDashboard(false);
  }, []);

  async function toggleDonations(nextEnabled: boolean) {
    setToggling(true);
    try {
      await adminApi('/donations/toggle', {
        method: 'PATCH',
        body: JSON.stringify({ enabled: nextEnabled })
      });
      setData((prev) => (prev ? { ...prev, donationsEnabled: nextEnabled } : prev));
      onNotify?.(
        nextEnabled
          ? tr('Online donations are now ENABLED across the website.', 'Website-ல நன்கொடை (Donate) இப்போ On பண்ணியாச்சு!')
          : tr('Online donations are now DISABLED — all donation buttons, links & pages are hidden.', 'Website-ல Donate பட்டன், லிங்க், பக்கம் எல்லாம் இப்போ Hide பண்ணியாச்சு.')
      );
    } catch (err) {
      onNotify?.(err instanceof Error ? err.message : 'Could not update donation status.', true);
    } finally {
      setToggling(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 px-4 lg:space-y-6 lg:px-0">
        <div className="h-24 admin-skeleton rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 admin-skeleton rounded-2xl" />
          ))}
        </div>
        <div className="h-64 admin-skeleton rounded-2xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        role="alert"
        className="admin-card flex flex-col items-start justify-between gap-4 border-red-200 bg-red-50 text-sm font-medium text-red-800 sm:flex-row sm:items-center"
      >
        <span>{error || tr('Could not load dashboard overview.', 'Dashboard விவரம் Load ஆகல.')}</span>
        <button
          type="button"
          onClick={() => loadDashboard(true)}
          className="shrink-0 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-red-700"
        >
          {tr('Retry', 'Retry பண்ணு')}
        </button>
      </div>
    );
  }

  const s = data.stats;
  const totalInr = (s.total_donations_paise || 0) / 100;
  const donationsEnabled = data.donationsEnabled !== false;

  const cards = [
    { label: tr('Total Donations Raised', 'மொத்த நன்கொடை'), value: `₹${totalInr.toLocaleString('en-IN')}`, sub: `${s.paid_donations_count} ${tr('successful', 'Paid ஆனது')}`, icon: IndianRupee, color: 'bg-emerald-50 text-emerald-700' },
    { label: tr('Upcoming / Past Events', 'வரப்போற / முடிஞ்ச Events'), value: `${s.upcoming_events} / ${s.past_events}`, sub: tr('Published events', 'Live-ல இருக்கு'), icon: CalendarDays, color: 'bg-brand-50 text-brand-700' },
    { label: tr('Gallery Folders & Items', 'Gallery ஃபோல்டர் & போட்டோ'), value: `${s.gallery_folders} / ${s.gallery_items}`, sub: tr('Published media', 'Public Media'), icon: Images, color: 'bg-saffron-50 text-saffron-700' },
    { label: tr('Published / Draft Blogs', 'Blog & Draft கட்டுரைகள்'), value: `${s.published_blogs} / ${s.draft_blogs}`, sub: tr('Articles', 'கட்டுரைகள்'), icon: BookOpen, color: 'bg-purple-50 text-purple-700' },
    { label: tr('Published Activities', 'நலப்பணிகள் (Activities)'), value: String(s.published_activities), sub: tr('Programmes', 'திட்டங்கள்'), icon: Sparkles, color: 'bg-sky-50 text-sky-700' },
    { label: tr('New Enquiries', 'புதிய Enquiries'), value: String(s.new_enquiries), sub: tr('Unread messages', 'படிக்காத மெசேஜ்'), icon: Inbox, color: 'bg-rose-50 text-rose-700' },
    { label: tr('New Volunteers', 'புதிய Volunteers'), value: String(s.new_volunteers), sub: tr('Pending review', 'Review பண்ணனும்'), icon: Heart, color: 'bg-teal-50 text-teal-700' },
    { label: tr('Pending / Failed Payments', 'Pending / Failed Payment'), value: `${s.pending_donations_count} / ${s.failed_donations_count}`, sub: tr('Razorpay orders', 'Razorpay விவரம்'), icon: Activity, color: 'bg-sand-100 text-slate-700' }
  ];

  return (
    <div className="space-y-3 lg:space-y-6">
      {/* Live Donation Acceptance Switch */}
      <div className="admin-card flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                donationsEnabled ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${donationsEnabled ? 'bg-emerald-600' : 'bg-amber-600'}`} />
              {donationsEnabled ? tr('Accepting Online Donations', 'Online Donate இப்போ On-ல இருக்கு') : tr('Donations Disabled', 'Donate இப்போ Off-ல இருக்கு')}
            </span>
          </div>
          <p className="mt-1.5 text-sm font-bold text-brand-900">
            {donationsEnabled
              ? tr('Public Donate page, buttons, and payment checkout are currently visible.', 'Website-ல Donate பட்டனும் Payment-உம் எல்லாருக்கும் தெரியுது.')
              : tr('All donation buttons, links, navigation tabs, and /donate page are hidden on the website.', 'Website-ல Donate பட்டன், லிங்க் & பக்கம் எல்லாம் Hide-ல இருக்கு.')}
          </p>
        </div>

        {canToggleDonations && (
          <button
            type="button"
            role="switch"
            aria-checked={donationsEnabled}
            disabled={toggling}
            onClick={() => toggleDonations(!donationsEnabled)}
            className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition disabled:opacity-60 ${
              donationsEnabled
                ? 'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            {toggling && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>{donationsEnabled ? tr('Disable Donations', 'Donate Off பண்ணு') : tr('Enable Donations', 'Donate On பண்ணு')}</span>
          </button>
        )}
      </div>

      <div className="grid gap-3 px-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4 lg:px-0">
        {cards.map((c, idx) => {
          const Icon = c.icon;
          return (
            <div key={idx} className="rounded-2xl border border-sand-200 bg-white p-4 shadow-[0_2px_10px_rgba(11,24,46,0.03)] transition hover:border-sand-300 dark:border-[#31343B] dark:bg-[#212225] sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-500">{c.label}</span>
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${c.color}`}>
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-3 text-xl font-extrabold text-brand-900 sm:text-2xl">{c.value}</p>
              <p className="mt-0.5 text-xs text-slate-500">{c.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Quick Shortcuts */}
      <div className="admin-card">
        <h2 className="text-base font-bold text-brand-900">{tr('Quick Management Shortcuts', 'வேகமா போக Short-cut')}</h2>
        <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-5 lg:gap-3">
          {[
            { tab: 'pages', label: tr('Edit Page Banners', 'Page Banner மாத்து') },
            { tab: 'events', label: tr('Manage Events', 'Events பாரு') },
            { tab: 'gallery', label: tr('Upload to Gallery', 'Gallery-ல Upload பண்ணு') },
            { tab: 'blogs', label: tr('Write Blog Post', 'புதிய Blog எழுது') },
            { tab: 'donations', label: tr('Donation Controls', 'Donate Settings') }
          ].map((btn) => (
            <button
              key={btn.tab}
              type="button"
              onClick={() => onNavigate(btn.tab)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-sand-200 bg-sand-50 px-4 py-3 text-xs font-bold text-brand-900 transition hover:border-brand-700 hover:bg-brand-50"
            >
              <Plus className="h-3.5 w-3.5 shrink-0" />
              <span>{btn.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2 lg:gap-6">
        <div className="admin-card">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-brand-900">{tr('Recent Donations', 'சமீபத்திய நன்கொடைகள்')}</h2>
            <button type="button" onClick={() => onNavigate('donations')} className="text-xs font-bold text-brand-700 hover:underline">
              {tr('View all →', 'எல்லாம் பாரு →')}
            </button>
          </div>
          <div className="mt-4 space-y-2.5">
            {data.recentDonations.length === 0 ? (
              <p className="text-sm text-slate-500">{tr('No donations recorded yet.', 'இன்னும் எந்த Donation-உம் வரல.')}</p>
            ) : (
              data.recentDonations.map((d) => (
                <div key={d.id} className="flex items-center justify-between gap-2 rounded-xl bg-sand-50 px-4 py-3 text-sm">
                  <div className="min-w-0 pr-2">
                    <p className="truncate font-bold text-slate-900">{d.donor_name}</p>
                    <p className="text-xs text-slate-500">{d.receipt_number || new Date(d.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-bold text-slate-900">₹{(d.amount_paise / 100).toLocaleString('en-IN')}</p>
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                      d.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : d.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {d.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="admin-card">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-brand-900">{tr('Recent Admin Activity', 'சமீபத்திய Admin செயல்பாடு')}</h2>
            <button type="button" onClick={() => onNavigate('audit')} className="text-xs font-bold text-brand-700 hover:underline">
              {tr('Audit logs →', 'Log பாரு →')}
            </button>
          </div>
          <div className="mt-4 space-y-2.5">
            {data.recentActivities.length === 0 ? (
              <p className="text-sm text-slate-500">{tr('No activity logs yet.', 'இன்னும் எந்த Log-உம் இல்ல.')}</p>
            ) : (
              data.recentActivities.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-2 rounded-xl bg-sand-50 px-4 py-3 text-xs">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-slate-800">
                      {a.action} <span className="font-normal text-slate-500">on</span> {a.entity_type}
                    </p>
                    <p className="truncate text-slate-500">{a.actor_email || 'System'}</p>
                  </div>
                  <span className="shrink-0 text-slate-400">{new Date(a.created_at).toLocaleDateString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
