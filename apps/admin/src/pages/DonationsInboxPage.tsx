import { useEffect, useState } from 'react';
import { Download, Search, X } from 'lucide-react';
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

    adminApi<{ items: DonationRow[]; totalPages: number; summary: Record<string, number> }>(`/donations?${q.toString()}`)
      .then((res) => {
        setRows(res.items || []);
        setTotalPages(res.totalPages || 1);
        setSummary(res.summary || {});
      })
      .catch((e) => onNotify(e.message, true))
      .finally(() => setLoading(false));
  };

  useEffect(load, [page, status, dateFrom, dateTo]);

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
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <span className="text-xs font-bold text-slate-500">Total Raised</span>
          <p className="mt-2 text-2xl font-extrabold text-emerald-700">
            ₹{((summary.total_donations_paise || 0) / 100).toLocaleString('en-IN')}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <span className="text-xs font-bold text-slate-500">Successful Donations</span>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{summary.paid_donations_count || 0}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <span className="text-xs font-bold text-slate-500">Pending Orders</span>
          <p className="mt-2 text-2xl font-extrabold text-amber-600">{summary.pending_donations_count || 0}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <span className="text-xs font-bold text-slate-500">Failed / Cancelled</span>
          <p className="mt-2 text-2xl font-extrabold text-red-600">{summary.failed_donations_count || 0}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
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
        <select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }} className="admin-input w-36">
          <option value="">All Status</option>
          <option value="paid">Paid</option>
          <option value="created">Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="admin-input w-40" />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="admin-input w-40" />
        <button type="button" onClick={load} className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white">Apply</button>
        <button type="button" onClick={exportCsv} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50">
          <Download className="h-4 w-4" />
          <span>CSV</span>
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase">
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
                <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
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
                    <button type="button" onClick={() => setSelected(r)} className="font-bold text-brand-600 hover:underline">
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
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPage(i + 1)}
              className={`h-9 min-w-[36px] rounded-lg px-3 text-xs font-bold ${page === i + 1 ? 'bg-brand-600 text-white' : 'border bg-white text-slate-700'}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900">Donation Transaction Detail</h3>
              <button type="button" onClick={() => setSelected(null)}><X className="h-5 w-5" /></button>
            </div>
            <dl className="mt-4 space-y-2 text-xs">
              <div className="flex justify-between"><dt className="text-slate-500">Receipt</dt><dd className="font-bold">{selected.receipt_number || '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Donor</dt><dd className="font-bold">{selected.donor_name}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Email</dt><dd>{selected.donor_email}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Phone</dt><dd>{selected.donor_phone}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">PAN</dt><dd>{selected.donor_pan || '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Amount</dt><dd className="font-bold">₹{(selected.amount_paise / 100).toLocaleString('en-IN')}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Razorpay Order ID</dt><dd className="font-mono">{selected.razorpay_order_id}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Razorpay Payment ID</dt><dd className="font-mono">{selected.razorpay_payment_id || '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Status</dt><dd className="font-bold uppercase">{selected.status}</dd></div>
              {selected.failure_reason && <div className="flex justify-between text-red-600"><dt>Failure Reason</dt><dd>{selected.failure_reason}</dd></div>}
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
    await adminApi(`/${mode}/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
    onNotify('Status updated.');
    load();
  }

  async function updateUserRole(id: string, role: string, isActive: boolean) {
    await adminApi(`/users/${id}`, { method: 'PATCH', body: JSON.stringify({ role, is_active: isActive }) });
    onNotify('Admin permissions updated.');
    load();
  }

  if (loading) return <div className="h-48 animate-pulse rounded-2xl bg-slate-200" />;

  return (
    <div className="space-y-3">
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-white p-10 text-center text-sm text-slate-500">
          No records available.
        </div>
      ) : (
        rows.map((r) => (
          <div key={String(r.id)} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            {mode === 'audit' ? (
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div>
                  <span className="font-bold text-slate-900">{String(r.action)}</span>{' '}
                  <span className="text-slate-500">on</span>{' '}
                  <span className="font-mono text-brand-700">{String(r.entity_type)}</span>
                  <p className="mt-1 text-slate-500">By: {String(r.actor_email || 'System')}</p>
                </div>
                <span className="text-slate-400">{new Date(String(r.created_at)).toLocaleString()}</span>
              </div>
            ) : mode === 'users' ? (
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <div>
                  <p className="font-bold text-slate-900">{String(r.full_name)} ({String(r.email)})</p>
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
                <div className="space-y-1 text-sm">
                  <p className="font-bold text-slate-900">
                    {String(r.name || r.full_name)} • <span className="text-xs font-normal text-slate-500">{String(r.email)} {r.phone ? `• ${r.phone}` : ''}</span>
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
                  className="admin-input w-36 text-xs font-bold"
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
