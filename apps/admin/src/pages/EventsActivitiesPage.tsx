import { useEffect, useState } from 'react';
import { History, Image as ImageIcon, Plus, Trash2 } from 'lucide-react';
import type { ActivityItem, EventItem, GalleryFolder, TeamMember } from '@ilangathir/shared';
import { adminApi } from '../lib/api';
import { MediaPickerModal } from '../components/MediaPickerModal';
import { VersionHistoryModal } from '../components/VersionHistoryModal';

export function EventsActivitiesPage({
  mode,
  onNotify
}: {
  mode: 'events' | 'activities' | 'team';
  onNotify: (msg: string, isErr?: boolean) => void;
}) {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [folders, setFolders] = useState<GalleryFolder[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<{ type: string; id: string } | null>(null);

  const [form, setForm] = useState<Record<string, unknown>>({ status: 'published' });
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    if (mode === 'events') {
      Promise.all([adminApi<EventItem[]>('/events'), adminApi<GalleryFolder[]>('/gallery/folders')])
        .then(([ev, gf]) => {
          setEvents(ev);
          setFolders(gf);
        })
        .catch((e) => onNotify(e.message, true))
        .finally(() => setLoading(false));
    } else if (mode === 'activities') {
      adminApi<ActivityItem[]>('/activities')
        .then(setActivities)
        .catch((e) => onNotify(e.message, true))
        .finally(() => setLoading(false));
    } else {
      adminApi<TeamMember[]>('/team')
        .then(setTeam)
        .catch((e) => onNotify(e.message, true))
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    setForm({ status: 'published', is_active: true, sort_order: 0 });
    setEditingId(null);
    load();
  }, [mode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const endpoint = mode === 'events' ? '/events' : mode === 'activities' ? '/activities' : '/team';
      if (editingId) {
        await adminApi(`${endpoint}/${editingId}`, { method: 'PUT', body: JSON.stringify(form) });
        onNotify('Updated successfully.');
      } else {
        await adminApi(endpoint, { method: 'POST', body: JSON.stringify(form) });
        onNotify('Created successfully.');
      }
      setForm({ status: 'published', is_active: true, sort_order: 0 });
      setEditingId(null);
      load();
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Save failed.', true);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this entry permanently?')) return;
    const endpoint = mode === 'events' ? '/events' : mode === 'activities' ? '/activities' : '/team';
    await adminApi(`${endpoint}/${id}`, { method: 'DELETE' });
    onNotify('Deleted.');
    load();
  }

  async function togglePublish(item: { id: string; status?: string }) {
    const next = item.status === 'published' ? 'draft' : 'published';
    const endpoint = mode === 'events' ? '/events' : '/activities';
    await adminApi(`${endpoint}/${item.id}`, { method: 'PUT', body: JSON.stringify({ status: next }) });
    onNotify(`Status changed to ${next}.`);
    load();
  }

  const imgField = mode === 'events' ? 'banner_url' : 'image_url';

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            {editingId ? 'Edit' : 'Add New'} {mode === 'events' ? 'Event' : mode === 'activities' ? 'Activity' : 'Team Member'}
          </h2>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm({ status: 'published', is_active: true });
              }}
              className="text-xs font-bold text-slate-500 hover:text-slate-900"
            >
              Cancel editing
            </button>
          )}
        </div>

        {mode === 'team' ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <input required placeholder="Full Name (EN)" value={String(form.name_en || '')} onChange={(e) => setForm({ ...form, name_en: e.target.value })} className="admin-input" />
            <input required placeholder="Full Name (TA)" value={String(form.name_ta || '')} onChange={(e) => setForm({ ...form, name_ta: e.target.value })} className="admin-input" />
            <input required placeholder="Designation (EN)" value={String(form.designation_en || '')} onChange={(e) => setForm({ ...form, designation_en: e.target.value })} className="admin-input" />
            <input required placeholder="Designation (TA)" value={String(form.designation_ta || '')} onChange={(e) => setForm({ ...form, designation_ta: e.target.value })} className="admin-input" />
            <textarea rows={2} placeholder="Biography (EN)" value={String(form.biography_en || '')} onChange={(e) => setForm({ ...form, biography_en: e.target.value })} className="admin-input" />
            <textarea rows={2} placeholder="Biography (TA)" value={String(form.biography_ta || '')} onChange={(e) => setForm({ ...form, biography_ta: e.target.value })} className="admin-input" />
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <input required placeholder="Title (EN)" value={String(form.title_en || '')} onChange={(e) => setForm({ ...form, title_en: e.target.value })} className="admin-input" />
            <input required placeholder="Title (TA)" value={String(form.title_ta || '')} onChange={(e) => setForm({ ...form, title_ta: e.target.value })} className="admin-input" />
            <input placeholder="Category" value={String(form.category || '')} onChange={(e) => setForm({ ...form, category: e.target.value })} className="admin-input" />
            <input
              type="date"
              required={mode === 'events'}
              value={String((mode === 'events' ? form.event_date : form.activity_date) || '')}
              onChange={(e) => setForm({ ...form, [mode === 'events' ? 'event_date' : 'activity_date']: e.target.value })}
              className="admin-input"
            />
            <input placeholder="Location (EN)" value={String(form.location_en || '')} onChange={(e) => setForm({ ...form, location_en: e.target.value })} className="admin-input" />
            <input placeholder="Location (TA)" value={String(form.location_ta || '')} onChange={(e) => setForm({ ...form, location_ta: e.target.value })} className="admin-input" />
            <textarea required rows={3} placeholder="Description (EN)" value={String(form.description_en || '')} onChange={(e) => setForm({ ...form, description_en: e.target.value })} className="admin-input" />
            <textarea required rows={3} placeholder="Description (TA)" value={String(form.description_ta || '')} onChange={(e) => setForm({ ...form, description_ta: e.target.value })} className="admin-input" />
            {mode === 'events' && (
              <select value={String(form.gallery_folder_id || '')} onChange={(e) => setForm({ ...form, gallery_folder_id: e.target.value || null })} className="admin-input">
                <option value="">Link Gallery Folder (Optional)</option>
                {folders.map((gf) => <option key={gf.id} value={gf.id}>{gf.title_en}</option>)}
              </select>
            )}
            <select value={String(form.status || 'published')} onChange={(e) => setForm({ ...form, status: e.target.value })} className="admin-input">
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <input
            placeholder="Image / Banner URL"
            value={String(form[imgField] || '')}
            onChange={(e) => setForm({ ...form, [imgField]: e.target.value })}
            className="admin-input flex-1"
          />
          <button type="button" onClick={() => setPickerOpen(true)} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700">
            <ImageIcon className="h-4 w-4 text-brand-600" />
            <span>Select / Upload Banner</span>
          </button>
          <button type="submit" className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-brand-700">
            <Plus className="h-4 w-4" />
            <span>{editingId ? 'Save Changes' : 'Create'}</span>
          </button>
        </div>
      </form>

      {loading ? (
        <div className="h-48 animate-pulse rounded-2xl bg-slate-200" />
      ) : (
        <div className="space-y-3">
          {(mode === 'events' ? events : mode === 'activities' ? activities : team).map((item) => {
            const rec = item as unknown as Record<string, unknown>;
            const id = String(rec.id);
            const title = String(rec.title_en || rec.name_en || '');
            const sub = String(rec.event_date || rec.activity_date || rec.designation_en || '');
            const status = String(rec.status || '');
            return (
              <div key={id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div>
                  <h3 className="font-bold text-slate-900">{title}</h3>
                  <p className="text-xs text-slate-500">{sub}</p>
                </div>
                <div className="flex items-center gap-2">
                  {status && (
                    <button
                      type="button"
                      onClick={() => togglePublish({ id, status })}
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {status}
                    </button>
                  )}
                  {mode !== 'team' && (
                    <button
                      type="button"
                      onClick={() => setHistoryTarget({ type: mode, id })}
                      className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                      title="Version History"
                    >
                      <History className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(id);
                      setForm(rec);
                    }}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Edit
                  </button>
                  <button type="button" onClick={() => handleDelete(id)} className="rounded-lg p-2 text-red-600 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <MediaPickerModal
        open={pickerOpen}
        bucket={mode === 'events' ? 'events' : 'media'}
        folderName={mode}
        onClose={() => setPickerOpen(false)}
        onSelect={(url) => {
          setForm((prev) => ({ ...prev, [imgField]: url }));
          setPickerOpen(false);
        }}
      />

      {historyTarget && (
        <VersionHistoryModal
          open={true}
          entityType={historyTarget.type}
          entityId={historyTarget.id}
          onClose={() => setHistoryTarget(null)}
          onRestored={() => {
            onNotify('Version restored.');
            load();
          }}
        />
      )}
    </div>
  );
}
