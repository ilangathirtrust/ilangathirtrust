import { useEffect, useState } from 'react';
import {
  Activity,
  BookOpen,
  CalendarDays,
  Heart,
  Images,
  Inbox,
  IndianRupee,
  Layers,
  Loader2,
  Plus
} from 'lucide-react';
import { adminApi } from '../lib/api';
import { useAdminUi } from '../lib/admin-ui';
import { OverviewSkeleton } from '../components/PageSkeletons';

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
      .catch((e) =>
        setError(
          e instanceof Error
            ? e.message
            : tr('Could not load dashboard overview.', 'டாஷ்போர்டு லோடு ஆகலைங்க, மறுபடியும் முயற்சி பண்ணுங்க.')
        )
      )
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
          ? tr('Online donations are now ENABLED across the website.', 'வெப்சைட்ல ஆன்லைன் நன்கொடை இப்போ ஆன் பண்ணியாச்சுங்க!')
          : tr('Online donations are now DISABLED — all donation buttons, links & pages are hidden.', 'வெப்சைட்ல நன்கொடை பட்டன், லிங்க், பக்கம் எல்லாம் இப்போ மறைச்சாச்சு.')
      );
    } catch (err) {
      onNotify?.(
        err instanceof Error ? err.message : tr('Could not update donation status.', 'நன்கொடை நிலையை மாத்த முடியலைங்க.'),
        true
      );
    } finally {
      setToggling(false);
    }
  }

  if (loading) {
    return <OverviewSkeleton />;
  }

  if (error || !data) {
    return (
      <div
        role="alert"
        className="admin-card flex flex-col items-start justify-between gap-4 border-red-200 bg-red-50 text-sm font-medium text-red-800 sm:flex-row sm:items-center"
      >
        <span>{error || tr('Could not load dashboard overview.', 'டாஷ்போர்டு விவரம் லோடு ஆகலைங்க.')}</span>
        <button
          type="button"
          onClick={() => loadDashboard(true)}
          className="shrink-0 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-red-700"
        >
          {tr('Retry', 'மறுபடியும் முயற்சி பண்ணு')}
        </button>
      </div>
    );
  }

  const s = data.stats;
  const totalInr = (s.total_donations_paise || 0) / 100;
  const donationsEnabled = data.donationsEnabled !== false;

  const cards = [
    {
      label: tr('Total Donations Raised', 'மொத்த நன்கொடை'),
      value: `₹${totalInr.toLocaleString('en-IN')}`,
      sub: `${s.paid_donations_count} ${tr('successful', 'வெற்றி')}`,
      icon: IndianRupee,
      color: 'bg-emerald-50 text-emerald-700'
    },
    {
      label: tr('Upcoming / Past Events', 'வரப்போற / முடிஞ்ச ஈவென்ட்'),
      value: `${s.upcoming_events} / ${s.past_events}`,
      sub: tr('Published events', 'லைவ்ல இருக்கு'),
      icon: CalendarDays,
      color: 'bg-brand-50 text-brand-700'
    },
    {
      label: tr('Gallery Folders & Items', 'கேலரி ஃபோல்டர் & படம்'),
      value: `${s.gallery_folders} / ${s.gallery_items}`,
      sub: tr('Published media', 'பொது மீடியா'),
      icon: Images,
      color: 'bg-amber-50 text-amber-700'
    },
    {
      label: tr('Published / Draft Blogs', 'பிளாக் & டிராஃப்ட்'),
      value: `${s.published_blogs} / ${s.draft_blogs}`,
      sub: tr('Articles', 'கட்டுரைகள்'),
      icon: BookOpen,
      color: 'bg-purple-50 text-purple-700'
    },
    {
      label: tr('Published Activities', 'நலப்பணிகள்'),
      value: String(s.published_activities),
      sub: tr('Programmes', 'திட்டங்கள்'),
      icon: Layers,
      color: 'bg-sky-50 text-sky-700'
    },
    {
      label: tr('New Enquiries', 'புது மெசேஜ்கள்'),
      value: String(s.new_enquiries),
      sub: tr('Unread messages', 'பார்க்காத மெசேஜ்'),
      icon: Inbox,
      color: 'bg-rose-50 text-rose-700'
    },
    {
      label: tr('New Volunteers', 'புது தன்னார்வலர்கள்'),
      value: String(s.new_volunteers),
      sub: tr('Pending review', 'பார்க்க வேண்டியது'),
      icon: Heart,
      color: 'bg-teal-50 text-teal-700'
    },
    {
      label: tr('Pending / Failed Payments', 'பெண்டிங் / ஃபெயில் ஆனது'),
      value: `${s.pending_donations_count} / ${s.failed_donations_count}`,
      sub: tr('Razorpay orders', 'ரேசர்பே விவரம்'),
      icon: Activity,
      color: 'bg-slate-100 text-slate-700'
    }
  ];

  const shortcuts = [
    { tab: 'pages', label: tr('Edit Page Banners', 'பேனர் மாத்து') },
    { tab: 'events', label: tr('Manage Events', 'ஈவென்ட் சேர்') },
    { tab: 'gallery', label: tr('Upload to Gallery', 'கேலரில போடு') },
    { tab: 'blogs', label: tr('Write Blog Post', 'புது பிளாக் எழுது') },
    ...(canToggleDonations ? [{ tab: 'donations', label: tr('Donation Controls', 'நன்கொடை விவரம்') }] : [])
  ];

  const statusLabelTa = (st: string) => {
    if (st === 'paid') return 'வெற்றி';
    if (st === 'failed') return 'தோல்வி';
    return 'பெண்டிங்';
  };

  return (
    <div className="space-y-4">
      {/* Live Donation Acceptance Switch */}
      <div className="admin-card flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                donationsEnabled ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${donationsEnabled ? 'bg-emerald-600' : 'bg-amber-600'}`} />
              {donationsEnabled
                ? tr('Accepting Online Donations', 'ஆன்லைன் நன்கொடை ஆன்-ல இருக்கு')
                : tr('Donations Disabled', 'நன்கொடை ஆஃப்-ல இருக்கு')}
            </span>
          </div>
          <p className="mt-1.5 text-xs font-semibold text-slate-700 sm:text-sm">
            {donationsEnabled
              ? tr('Public Donate page, buttons, and payment checkout are currently visible.', 'வெப்சைட்ல நன்கொடை பட்டனும் பேமெண்ட் பக்கமும் இப்போ எல்லாருக்கும் தெரியுது.')
              : tr('All donation buttons, links, navigation tabs, and /donate page are hidden on the website.', 'வெப்சைட்ல நன்கொடை பட்டன், லிங்க், பக்கம் எல்லாம் இப்போ மறைச்சி வச்சிருக்கு.')}
          </p>
        </div>

        {canToggleDonations && (
          <button
            type="button"
            role="switch"
            aria-checked={donationsEnabled}
            disabled={toggling}
            onClick={() => toggleDonations(!donationsEnabled)}
            className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition disabled:opacity-60 ${
              donationsEnabled
                ? 'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            {toggling && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>{donationsEnabled ? tr('Disable Donations', 'நன்கொடை நிறுத்து') : tr('Enable Donations', 'நன்கொடை ஆன் பண்ணு')}</span>
          </button>
        )}
      </div>

      {/* Compact KPI Stat Grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c, idx) => {
          const Icon = c.icon;
          return (
            <div key={idx} className="admin-card p-3.5 transition hover:border-slate-300 sm:p-4">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[11px] font-bold leading-snug text-slate-500 sm:text-xs">{c.label}</span>
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${c.color}`}>
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2.5 text-lg font-extrabold tracking-tight text-slate-900 sm:text-2xl">{c.value}</p>
              <p className="mt-0.5 text-[11px] text-slate-500">{c.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Quick Shortcuts */}
      <div className="admin-card">
        <h2 className="text-sm font-bold text-slate-900 sm:text-base">
          {tr('Quick Management Shortcuts', 'வேகமா போக குறுக்குவழிகள்')}
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
          {shortcuts.map((btn) => (
            <button
              key={btn.tab}
              type="button"
              onClick={() => onNavigate(btn.tab)}
              className="admin-btn-secondary justify-center py-2.5 text-center"
            >
              <Plus className="h-3.5 w-3.5 shrink-0 text-blue-600" />
              <span className="truncate">{btn.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Donations & Recent Admin Activity */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="admin-card">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 sm:text-base">
              {tr('Recent Donations', 'சமீபத்திய நன்கொடைகள்')}
            </h2>
            {canToggleDonations && (
              <button type="button" onClick={() => onNavigate('donations')} className="text-xs font-bold text-blue-600 hover:underline">
                {tr('View all →', 'எல்லாம் பாரு →')}
              </button>
            )}
          </div>
          <div className="mt-3 space-y-2">
            {data.recentDonations.length === 0 ? (
              <p className="admin-subcard py-5 text-center text-xs text-slate-500">
                {tr('No donations recorded yet.', 'இன்னும் எந்த நன்கொடையும் வரலீங்க.')}
              </p>
            ) : (
              data.recentDonations.map((d) => (
                <div key={d.id} className="admin-subcard flex items-center justify-between gap-2 px-3.5 py-2.5 text-xs sm:text-sm">
                  <div className="min-w-0 pr-2">
                    <p className="truncate font-bold text-slate-900">{d.donor_name}</p>
                    <p className="text-[11px] text-slate-500">{d.receipt_number || new Date(d.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-bold text-slate-900">₹{(d.amount_paise / 100).toLocaleString('en-IN')}</p>
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                      d.status === 'paid' ? 'bg-emerald-50 text-emerald-700' : d.status === 'failed' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {tr(d.status, statusLabelTa(d.status))}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="admin-card">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 sm:text-base">
              {tr('Recent Admin Activity', 'சமீபத்திய செயல்பாடுகள்')}
            </h2>
            {canToggleDonations && (
              <button type="button" onClick={() => onNavigate('audit')} className="text-xs font-bold text-blue-600 hover:underline">
                {tr('Audit logs →', 'ஆடிட் லாக் →')}
              </button>
            )}
          </div>
          <div className="mt-3 space-y-2">
            {data.recentActivities.length === 0 ? (
              <p className="admin-subcard py-5 text-center text-xs text-slate-500">
                {tr('No activity logs yet.', 'இன்னும் எந்த பதிவும் இல்லீங்க.')}
              </p>
            ) : (
              data.recentActivities.map((a) => (
                <div key={a.id} className="admin-subcard flex items-center justify-between gap-2 px-3.5 py-2.5 text-xs">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-slate-800">
                      {a.action} <span className="font-normal text-slate-500">•</span> {a.entity_type}
                    </p>
                    <p className="truncate text-[11px] text-slate-500">{a.actor_email || tr('System', 'சிஸ்டம்')}</p>
                  </div>
                  <span className="shrink-0 text-[11px] text-slate-400">{new Date(a.created_at).toLocaleDateString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
