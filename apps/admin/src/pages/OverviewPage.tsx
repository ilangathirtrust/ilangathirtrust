import { useEffect, useState } from 'react';
import {
  Activity,
  BookOpen,
  CalendarDays,
  Heart,
  Images,
  Inbox,
  IndianRupee,
  Plus,
  Sparkles
} from 'lucide-react';
import { adminApi } from '../lib/api';

interface DashboardData {
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

export function OverviewPage({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi<DashboardData>('/dashboard')
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-stone-200" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-2xl bg-stone-200" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm font-medium text-red-700">
        {error || 'Could not load dashboard overview.'}
      </div>
    );
  }

  const s = data.stats;
  const totalInr = (s.total_donations_paise || 0) / 100;

  const cards = [
    { label: 'Total Donations Raised', value: `₹${totalInr.toLocaleString('en-IN')}`, sub: `${s.paid_donations_count} successful`, icon: IndianRupee, color: 'bg-emerald-50 text-emerald-700' },
    { label: 'Upcoming / Past Events', value: `${s.upcoming_events} / ${s.past_events}`, sub: 'Published events', icon: CalendarDays, color: 'bg-brand-50 text-brand-700' },
    { label: 'Gallery Folders & Items', value: `${s.gallery_folders} / ${s.gallery_items}`, sub: 'Published media', icon: Images, color: 'bg-amber-50 text-amber-700' },
    { label: 'Published / Draft Blogs', value: `${s.published_blogs} / ${s.draft_blogs}`, sub: 'Articles', icon: BookOpen, color: 'bg-purple-50 text-purple-700' },
    { label: 'Published Activities', value: String(s.published_activities), sub: 'Programmes', icon: Sparkles, color: 'bg-sky-50 text-sky-700' },
    { label: 'New Enquiries', value: String(s.new_enquiries), sub: 'Unread messages', icon: Inbox, color: 'bg-rose-50 text-rose-700' },
    { label: 'New Volunteers', value: String(s.new_volunteers), sub: 'Pending review', icon: Heart, color: 'bg-teal-50 text-teal-700' },
    { label: 'Pending / Failed Payments', value: `${s.pending_donations_count} / ${s.failed_donations_count}`, sub: 'Razorpay orders', icon: Activity, color: 'bg-stone-100 text-slate-700' }
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c, idx) => {
          const Icon = c.icon;
          return (
            <div key={idx} className="admin-card p-5 transition hover:border-stone-300">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-500">{c.label}</span>
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${c.color}`}>
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-3 text-2xl font-extrabold text-slate-900">{c.value}</p>
              <p className="mt-0.5 text-xs text-slate-500">{c.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Quick Shortcuts */}
      <div className="admin-card p-5 sm:p-6">
        <h2 className="text-base font-bold text-slate-900">Quick Management Shortcuts</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { tab: 'pages', label: 'Edit Homepage & SEO' },
            { tab: 'events', label: 'Manage Events' },
            { tab: 'gallery', label: 'Upload to Gallery' },
            { tab: 'blogs', label: 'Write Blog Post' },
            { tab: 'donations', label: 'Donation Reports' }
          ].map((btn) => (
            <button
              key={btn.tab}
              type="button"
              onClick={() => onNavigate(btn.tab)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-[#FAF8F4] px-4 py-3 text-xs font-bold text-slate-800 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{btn.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="admin-card p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Recent Donations</h2>
            <button type="button" onClick={() => onNavigate('donations')} className="text-xs font-bold text-brand-700">
              View all →
            </button>
          </div>
          <div className="mt-4 space-y-2.5">
            {data.recentDonations.length === 0 ? (
              <p className="text-sm text-slate-500">No donations recorded yet.</p>
            ) : (
              data.recentDonations.map((d) => (
                <div key={d.id} className="flex items-center justify-between rounded-xl bg-[#FAF8F4] px-4 py-3 text-sm">
                  <div className="min-w-0 pr-2">
                    <p className="truncate font-bold text-slate-900">{d.donor_name}</p>
                    <p className="text-xs text-slate-500">{d.receipt_number || new Date(d.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right shrink-0">
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

        <div className="admin-card p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Recent Website & Admin Activity</h2>
            <button type="button" onClick={() => onNavigate('audit')} className="text-xs font-bold text-brand-700">
              Audit logs →
            </button>
          </div>
          <div className="mt-4 space-y-2.5">
            {data.recentActivities.length === 0 ? (
              <p className="text-sm text-slate-500">No activity logs yet.</p>
            ) : (
              data.recentActivities.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-2 rounded-xl bg-[#FAF8F4] px-4 py-3 text-xs">
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
