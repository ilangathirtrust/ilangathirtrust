import { useEffect, useState } from 'react';
import { History, Loader2, RotateCcw, X } from 'lucide-react';
import { adminApi } from '../lib/api';

interface VersionItem {
  id: string;
  version_number: number;
  change_note: string;
  changed_by_email: string;
  created_at: string;
  snapshot: Record<string, unknown>;
}

export function VersionHistoryModal({
  open,
  entityType,
  entityId,
  onClose,
  onRestored
}: {
  open: boolean;
  entityType: string;
  entityId: string;
  onClose: () => void;
  onRestored: () => void;
}) {
  const [versions, setVersions] = useState<VersionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !entityType || !entityId) return;
    setLoading(true);
    setError('');
    adminApi<VersionItem[]>(`/versions/${encodeURIComponent(entityType)}/${encodeURIComponent(entityId)}`)
      .then(setVersions)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [open, entityType, entityId]);

  if (!open) return null;

  async function handleRestore(versionId: string) {
    if (!confirm('Restore this earlier content version?')) return;
    setRestoringId(versionId);
    try {
      await adminApi(`/versions/${versionId}/restore`, { method: 'POST' });
      onRestored();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Restore failed.');
    } finally {
      setRestoringId(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-brand-600" />
            <h3 className="text-lg font-bold text-slate-900">Content Version History</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error && <p className="mb-4 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</p>}
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
            </div>
          ) : versions.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">
              No previous versions recorded yet. Edits automatically snapshot the prior version.
            </p>
          ) : (
            <div className="space-y-3">
              {versions.map((v) => (
                <div key={v.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-bold text-brand-700">
                        v{v.version_number}
                      </span>
                      <span className="ml-2 text-sm font-bold text-slate-900">{v.change_note || 'Snapshot'}</span>
                      <p className="mt-1 text-xs text-slate-500">
                        {new Date(v.created_at).toLocaleString()} • {v.changed_by_email || 'Admin'}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={restoringId === v.id}
                      onClick={() => handleRestore(v.id)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-brand-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-brand-50"
                    >
                      {restoringId === v.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                      <span>Restore</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
