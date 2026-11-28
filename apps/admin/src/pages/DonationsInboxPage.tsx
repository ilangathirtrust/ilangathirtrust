import { useEffect, useState } from 'react';
import { Download, Loader2, Search, ShieldAlert, ShieldCheck, X } from 'lucide-react';
import { adminApi } from '../lib/api';

interface DonationRow {
  id: string;
  receipt_number: string | null;
  donor_name: string;
  donor_email: string;
  donor_phone: string;
  donor_pan: string;
  purpose: string;
  amount_paise: number;
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
  status: string;
  payment_method: string;
  failure_reason: string;
  paid_at: string | null;
  created_at: string;
}

export function DonationsPage({ onNotify }: { onNotify: (msg: string, isErr?: boolean) => void }) {
  const [rows, setRows] = useState<DonationRow[]>([]);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [donationsEnabled, setDonationsEnabled] = useState(true);
  const [toggling, setToggling] = useState(false);

  const [status, setStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<DonationRow | null>(null);

  const load = () => {
    setLoading(true);
    const q = new URLSearchParams({ page: String(page), pageSize: '20' });
    if (status) q.set('status', status);
    if (dateFrom) q.set('dateFrom', dateFrom);
    if (dateTo) q.set('dateTo', dateTo);
    if (search) q.set('search', search);

    adminApi<{
      items: DonationRow[];
      totalPages: number;
      summary: Record<string, number>;
      donationsEnabled?: boolean;
    }>(`/donations?${q.toString()}`)
      .then((res) => {
        setRows(res.items || []);
        setTotalPages(res.totalPages || 1);
        setSummary(res.summary || {});
        if (typeof res.donationsEnabled === 'boolean') {
          setDonationsEnabled(res.donationsEnabled);
        }
      })
      .catch((e) => onNotify(e.message, true))
      .finally(() => setLoading(false));
  };

  useEffect(load, [page, status, dateFrom, dateTo]);

  async function handleToggleDonations() {
    const nextEnabled = !donationsEnabled;
    setToggling(true);
    try {
      await adminApi('/donations/toggle', {
        method: 'PATCH',
        body: JSON.stringify({ enabled: nextEnabled })
      });
      setDonationsEnabled(nextEnabled);
      onNotify(
        nextEnabled
          ? 'Online donations enabled — Donate page and buttons are live on the website.'
          : 'Online donations disabled — All donation pages, buttons, and links are now hidden.'
      );
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Failed to toggle donations.', true);
    } finally {
      setToggling(false);
    }
  }

  function exportCsv() {
    const headers = ['Receipt', 'Donor Name', 'Email', 'Phone', 'Purpose', 'Amount INR', 'Status', 'Order ID', 'Payment ID', 'Date'];
    const csvRows = [
      headers.join(','),
      ...rows.map((r) => [
        r.receipt_number || '',
        `"${r.donor_name.replace(/"/g, '""')}"`,
        r.donor_email,
        r.donor_phone,
        `"${r.purpose}"`,
        (r.amount_paise / 100).toFixed(2),
        r.status,
        r.razorpay_order_id || '',
        r.razorpay_payment_id || '',
        r.created_at
      ].join(','))
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ilangathir-donations-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Master Donation Acceptance Switch */}
      <div
        className={`admin-card flex flex-col justify-between gap-4 border-2 p-5 sm:flex-row sm:items-center ${
          donationsEnabled ? 'border-emerald-200/80 bg-emerald-50/30' : 'border-amber-300 bg-amber-50/50'
        }`}
      >
        <div className="flex items-start gap-3.5 min-w-0">
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
              donationsEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'
            }`}
          >
            {donationsEnabled ? <ShieldCheck className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-extrabold text-brand-900">
              Accepting Online Donations: {donationsEnabled ? 'Enabled (Live)' : 'Disabled (Hidden)'}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              {donationsEnabled
                ? 'Visitors can access /donate, header/bottom-nav Donate buttons, and Razorpay checkout.'
                : 'All donation buttons, links, mobile nav Donate tab, sitemap entry, /donate page, and payment order API are disabled.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={donationsEnabled}
          disabled={toggling}
          onClick={handleToggleDonations}
          className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-3 text-xs font-bold shadow-xs transition disabled:opacity-60 ${
            donationsEnabled
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-emerald-600 text-white hover:bg-emerald-700'
          }`}
        >
          {toggling && <Loader2 className="h-4 w-4 animate-spin" />}
          <span>{donationsEnabled ? 'Disable Accepting Donations' : 'Enable Accepting Donations'}</span>
        </button>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="admin-card p-4 sm:p-5">
          <span className="text-xs font-bold text-slate-500">Total Raised</span>
          <p className="mt-2 text-lg font-extrabold text-emerald-700 sm:text-2xl">
            ₹{((summary.total_donations_paise || 0) / 100).toLocaleString('en-IN')}
          </p>
        </div>
        <div className="admin-card p-4 sm:p-5">
          <span className="text-xs font-bold text-slate-500">Successful</span>
          <p className="mt-2 text-lg font-extrabold text-brand-900 sm:text-2xl">{summary.paid_donations_count || 0}</p>
        </div>
        <div className="admin-card p-4 sm:p-5">
          <span className="text-xs font-bold text-slate-500">Pending</span>
          <p className="mt-2 text-lg font-extrabold text-amber-600 sm:text-2xl">{summary.pending_donations_count || 0}</p>
        </div>
        <div className="admin-card p-4 sm:p-5">
          <span className="text-xs font-bold text-slate-500">Failed</span>
          <p className="mt-2 text-lg font-extrabold text-red-600 sm:text-2xl">{summary.failed_donations_count || 0}</p>
        </div>
      </div>

      <div className="admin-card flex flex-wrap items-center gap-3 p-4">
        <div className="relative min-w-0 flex-1 sm:min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Search donor, receipt, order ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
            className="admin-input pl-9"
          />
        </div>
        <select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }} className="admin-input w-full sm:w-36">
          <option value="">All Status</option>
          <option value="paid">Paid</option>
          <option value="created">Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="admin-input w-full sm:w-40" />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="admin-input w-full sm:w-40" />
        <button type="button" onClick={load} className="rounded-xl bg-brand-900 px-4 py-2.5 text-xs font-bold text-white">Apply</button>
        <button type="button" onClick={exportCsv} className="inline-flex items-center gap-1.5 rounded-xl border border-sand-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-sand-50">
          <Download className="h-4 w-4" />
          <span>CSV</span>
        </button>
      </div>

      {/* Mobile Cards (< md) */}
      <div className="space-y-3 md:hidden">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 admin-skeleton rounded-2xl" />)
        ) : rows.length === 0 ? (
          <div className="admin-card p-8 text-center text-sm text-slate-500">No donations match your filters.</div>
        ) : (
          rows.map((r) => (
            <div key={r.id} className="admin-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-brand-900">{r.donor_name}</p>
                  <p className="truncate text-xs text-slate-500">{r.donor_email}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                  r.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : r.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {r.status}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-sand-100 pt-2.5 text-xs">
                <span className="font-extrabold text-slate-900">₹{(r.amount_paise / 100).toLocaleString('en-IN')} • {r.purpose}</span>
                <button type="button" onClick={() => setSelected(r)} className="font-bold text-brand-700 hover:underline">
                  Inspect
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table (>= md) */}
      <div className="hidden overflow-x-auto rounded-2xl border border-sand-200 bg-white shadow-xs md:block">
        <table className="w-full text-left text-xs">
          <thead className="bg-sand-50 text-slate-500 uppercase">
            <tr>
              <th className="p-4">Receipt</th>
              <th className="p-4">Donor</th>
              <th className="p-4">Purpose</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Status</th>
              <th className="p-4">Date</th>
              <th className="p-4 text-right">Details</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-8 text-center text-slate-500">Loading donations…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-slate-500">No donations match your filters.</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t border-sand-100 hover:bg-sand-50/50">
                  <td className="p-4 font-mono font-bold text-slate-800">{r.receipt_number || '—'}</td>
                  <td className="p-4">
                    <p className="font-bold text-slate-900">{r.donor_name}</p>
                    <p className="text-slate-500">{r.donor_email}</p>
                  </td>
                  <td className="p-4">{r.purpose}</td>
                  <td className="p-4 font-bold text-slate-900">₹{(r.amount_paise / 100).toLocaleString('en-IN')}</td>
                  <td className="p-4">
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                      r.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : r.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="p-4 text-slate-500">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="p-4 text-right">
                    <button type="button" onClick={() => setSelected(r)} className="font-bold text-brand-700 hover:underline">
                      Inspect
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex flex-wrap justify-center gap-2">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPage(i + 1)}
              className={`h-9 min-w-[36px] rounded-lg px-3 text-xs font-bold ${page === i + 1 ? 'bg-brand-900 text-white' : 'border border-sand-200 bg-white text-slate-700'}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-sand-100 pb-3">
              <div className="flex items-center gap-2.5">
                <img src="/logos/logo-navy-monochrome.webp" alt="Ilangathir Trust" className="h-7 w-7 object-contain" />
                <h3 className="font-bold text-brand-900">Donation Transaction Detail</h3>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="rounded-lg p-1 hover:bg-sand-100"><X className="h-5 w-5" /></button>
            </div>
            <dl className="mt-4 space-y-2.5 text-xs">
              <div className="flex justify-between gap-2"><dt className="text-slate-500">Receipt</dt><dd className="font-bold">{selected.receipt_number || '—'}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-slate-500">Donor</dt><dd className="font-bold">{selected.donor_name}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-slate-500">Email</dt><dd className="break-all">{selected.donor_email}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-slate-500">Phone</dt><dd>{selected.donor_phone}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-slate-500">PAN</dt><dd>{selected.donor_pan || '—'}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-slate-500">Amount</dt><dd className="font-bold">₹{(selected.amount_paise / 100).toLocaleString('en-IN')}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-slate-500">Razorpay Order ID</dt><dd className="break-all font-mono">{selected.razorpay_order_id}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-slate-500">Razorpay Payment ID</dt><dd className="break-all font-mono">{selected.razorpay_payment_id || '—'}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-slate-500">Status</dt><dd className="font-bold uppercase">{selected.status}</dd></div>
              {selected.failure_reason && <div className="flex justify-between gap-2 text-red-600"><dt>Failure Reason</dt><dd>{selected.failure_reason}</dd></div>}
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}

export function InboxAndAuditPage({
  mode,
  onNotify
}: {
  mode: 'enquiries' | 'volunteers' | 'audit' | 'users';
  onNotify: (msg: string, isErr?: boolean) => void;
}) {
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    const path = mode === 'audit' ? '/audit-logs' : `/${mode}`;
    adminApi<Array<Record<string, unknown>>>(path)
      .then(setRows)
      .catch((e) => onNotify(e.message, true))
      .finally(() => setLoading(false));
  };

  useEffect(load, [mode]);

  async function updateStatus(id: string, status: string) {
    try {
      await adminApi(`/${mode}/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
      onNotify('Status updated.');
      load();
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Failed to update status.', true);
    }
  }

  async function updateUserRole(id: string, role: string, isActive: boolean) {
    try {
      await adminApi(`/users/${id}`, { method: 'PATCH', body: JSON.stringify({ role, is_active: isActive }) });
      onNotify('Admin permissions updated.');
      load();
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Failed to update admin permissions.', true);
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 admin-skeleton rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rows.length === 0 ? (
        <div className="admin-card border-dashed p-10 text-center text-sm text-slate-500">
          No records available.
        </div>
      ) : (
        rows.map((r) => (
          <div key={String(r.id)} className="admin-card p-4 sm:p-5">
            {mode === 'audit' ? (
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="min-w-0">
                  <span className="font-bold text-slate-900">{String(r.action)}</span>{' '}
                  <span className="text-slate-500">on</span>{' '}
                  <span className="font-mono text-brand-700">{String(r.entity_type)}</span>
                  <p className="mt-1 truncate text-slate-500">By: {String(r.actor_email || 'System')}</p>
                </div>
                <span className="text-slate-400">{new Date(String(r.created_at)).toLocaleString()}</span>
              </div>
            ) : mode === 'users' ? (
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-bold text-slate-900">{String(r.full_name)} ({String(r.email)})</p>
                  <p className="text-xs text-slate-500">Role: {String(r.role)} • Active: {String(r.is_active)}</p>
                </div>
                <div className="flex gap-2">
                  <select
                    value={String(r.role)}
                    onChange={(e) => updateUserRole(String(r.id), e.target.value, Boolean(r.is_active))}
                    className="admin-input w-36 text-xs"
                  >
                    <option value="super_admin">super_admin</option>
                    <option value="admin">admin</option>
                    <option value="editor">editor</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1 space-y-1 text-sm">
                  <p className="font-bold text-slate-900">
                    {String(r.name || r.full_name)} • <span className="break-all text-xs font-normal text-slate-500">{String(r.email)} {r.phone ? `• ${r.phone}` : ''}</span>
                  </p>
                  {Boolean(r.subject || r.interest) && (
                    <p className="text-xs font-bold text-brand-700">
                      {String(r.subject || `${r.interest} (${r.district})`)}
                    </p>
                  )}
                  <p className="text-xs text-slate-600">{String(r.message || '')}</p>
                </div>
                <select
                  value={String(r.status)}
                  onChange={(e) => updateStatus(String(r.id), e.target.value)}
                  className="admin-input w-full text-xs font-bold sm:w-36"
                >
                  {(mode === 'enquiries'
                    ? ['new', 'read', 'replied', 'closed']
                    : ['new', 'reviewing', 'contacted', 'approved', 'closed']
                  ).map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
