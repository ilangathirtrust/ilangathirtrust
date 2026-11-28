import { useEffect, useState } from 'react';
import { History, Loader2, RotateCcw, X } from 'lucide-react';
import { adminApi } from '../lib/api';
import { useAdminUi } from '../lib/admin-ui';

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
  const { tr } = useAdminUi();
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
    if (!confirm(tr('Restore this earlier content version?', 'இந்த பழைய வெர்ஷனை திரும்ப கொண்டு வரலாமா?'))) return;
    setRestoringId(versionId);
    try {
      await adminApi(`/versions/${versionId}/restore`, { method: 'POST' });
      onRestored();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : tr('Restore failed.', 'திரும்ப எடுக்க முடியலைங்க.'));
    } finally {
      setRestoringId(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-[#262A34] dark:bg-[#161920]">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">
              {tr('Content Version History', 'பழைய வெர்ஷன் ஹிஸ்டரி')}
            </h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {error && <p className="mb-4 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</p>}
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 rounded-xl admin-skeleton" />
              ))}
            </div>
          ) : versions.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">
              {tr(
                'No previous versions recorded yet. Edits automatically snapshot the prior version.',
                'இன்னும் பழைய வெர்ஷன் எதுவும் சேவ் ஆகலைங்க. மாத்தும்போது தானா சேவ் ஆகும்.'
              )}
            </p>
          ) : (
            <div className="space-y-2.5">
              {versions.map((v) => (
                <div key={v.id} className="admin-subcard">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-700">
                        v{v.version_number}
                      </span>
                      <span className="ml-2 text-sm font-bold text-slate-900">{v.change_note || tr('Snapshot', 'சேமிப்பு')}</span>
                      <p className="mt-1 text-xs text-slate-500">
                        {new Date(v.created_at).toLocaleString()} • {v.changed_by_email || tr('Admin', 'அட்மின்')}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={restoringId === v.id}
                      onClick={() => handleRestore(v.id)}
                      className="admin-btn-secondary"
                    >
                      {restoringId === v.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                      <span>{tr('Restore', 'திரும்ப எடு')}</span>
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
