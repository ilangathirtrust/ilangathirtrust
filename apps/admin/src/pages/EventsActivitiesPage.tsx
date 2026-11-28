import { useEffect, useState } from 'react';
import { History, Image as ImageIcon, Plus, Trash2 } from 'lucide-react';
import type { ActivityItem, EventItem, GalleryFolder, TeamMember } from '@ilangathir/shared';
import { adminApi } from '../lib/api';
import { useAdminUi } from '../lib/admin-ui';
import { MediaPickerModal } from '../components/MediaPickerModal';
import { VersionHistoryModal } from '../components/VersionHistoryModal';

export function EventsActivitiesPage({
  mode,
  onNotify
}: {
  mode: 'events' | 'activities' | 'team';
  onNotify: (msg: string, isErr?: boolean) => void;
}) {
  const { tr } = useAdminUi();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [folders, setFolders] = useState<GalleryFolder[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<{ type: string; id: string } | null>(null);

  const [form, setForm] = useState<Record<string, unknown>>({ status: 'published' });
  const [savedSnapshot, setSavedSnapshot] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const isDirty = editingId
    ? JSON.stringify(form) !== savedSnapshot
    : mode === 'team'
    ? Boolean(String(form.name_en || '').trim())
    : Boolean(String(form.title_en || '').trim());

  const load = (force = false) => {
    setLoading(true);
    setLoadError('');
    if (mode === 'events') {
      Promise.all([
        adminApi<EventItem[]>('/events', { forceRefresh: force }),
        adminApi<GalleryFolder[]>('/gallery/folders', { forceRefresh: force })
      ])
        .then(([ev, gf]) => {
          setEvents(ev);
          setFolders(gf);
        })
        .catch((e) => {
          const msg = e instanceof Error ? e.message : 'Unable to load events.';
          setLoadError(msg);
          onNotify(msg, true);
        })
        .finally(() => setLoading(false));
    } else if (mode === 'activities') {
      adminApi<ActivityItem[]>('/activities', { forceRefresh: force })
        .then(setActivities)
        .catch((e) => {
          const msg = e instanceof Error ? e.message : 'Unable to load activities.';
          setLoadError(msg);
          onNotify(msg, true);
        })
        .finally(() => setLoading(false));
    } else {
      adminApi<TeamMember[]>('/team', { forceRefresh: force })
        .then(setTeam)
        .catch((e) => {
          const msg = e instanceof Error ? e.message : 'Unable to load team members.';
          setLoadError(msg);
          onNotify(msg, true);
        })
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    setForm({ status: 'published', is_active: true, sort_order: 0 });
    setEditingId(null);
    load(false);
  }, [mode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const endpoint = mode === 'events' ? '/events' : mode === 'activities' ? '/activities' : '/team';
      if (editingId) {
        await adminApi(`${endpoint}/${editingId}`, { method: 'PUT', body: JSON.stringify(form) });
        onNotify(tr('Updated successfully.', 'Update ஆச்சு.'));
      } else {
        await adminApi(endpoint, { method: 'POST', body: JSON.stringify(form) });
        onNotify(tr('Created successfully.', 'புதுசா Add பண்ணியாச்சு.'));
      }
      setForm({ status: 'published', is_active: true, sort_order: 0 });
      setEditingId(null);
      load(true);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Save failed.', true);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(tr('Delete this entry permanently?', 'இதை நிரந்தரமா Delete பண்ணலாமா?'))) return;
    const endpoint = mode === 'events' ? '/events' : mode === 'activities' ? '/activities' : '/team';
    await adminApi(`${endpoint}/${id}`, { method: 'DELETE' });
    onNotify(tr('Deleted.', 'Delete பண்ணியாச்சு.'));
    load(true);
  }

  async function togglePublish(item: { id: string; status?: string }) {
    const next = item.status === 'published' ? 'draft' : 'published';
    const endpoint = mode === 'events' ? '/events' : '/activities';
    await adminApi(`${endpoint}/${item.id}`, { method: 'PUT', body: JSON.stringify({ status: next }) });
    onNotify(`Status changed to ${next}.`);
    load(true);
  }

  const imgField = mode === 'events' ? 'banner_url' : 'image_url';
  const currentList = mode === 'events' ? events : mode === 'activities' ? activities : team;

  return (
    <div className="space-y-3 lg:space-y-6">
      <form onSubmit={handleSubmit} className="admin-card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            {editingId
              ? tr(
                  `Edit ${mode === 'events' ? 'Event' : mode === 'activities' ? 'Activity' : 'Team Member'}`,
                  `${mode === 'events' ? 'Event' : mode === 'activities' ? 'Activity' : 'Team Member'} Edit பண்ணு`
                )
              : tr(
                  `Add New ${mode === 'events' ? 'Event' : mode === 'activities' ? 'Activity' : 'Team Member'}`,
                  `புதிய ${mode === 'events' ? 'Event' : mode === 'activities' ? 'Activity' : 'Team Member'} சேர்க்க`
                )}
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
              {tr('Cancel editing', 'Cancel பண்ணு')}
            </button>
          )}
        </div>

        {mode === 'team' ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="admin-label">
              <span>Full Name (EN) *</span>
              <input required placeholder="Full Name (EN)" value={String(form.name_en || '')} onChange={(e) => setForm({ ...form, name_en: e.target.value })} className="admin-input" />
            </label>
            <label className="admin-label">
              <span>Full Name (TA) *</span>
              <input required placeholder="Full Name (TA)" value={String(form.name_ta || '')} onChange={(e) => setForm({ ...form, name_ta: e.target.value })} className="admin-input" />
            </label>
            <label className="admin-label">
              <span>Designation (EN) *</span>
              <input required placeholder="Designation (EN)" value={String(form.designation_en || '')} onChange={(e) => setForm({ ...form, designation_en: e.target.value })} className="admin-input" />
            </label>
            <label className="admin-label">
              <span>Designation (TA) *</span>
              <input required placeholder="Designation (TA)" value={String(form.designation_ta || '')} onChange={(e) => setForm({ ...form, designation_ta: e.target.value })} className="admin-input" />
            </label>
            <label className="admin-label">
              <span>Biography (EN)</span>
              <textarea rows={2} placeholder="Biography (EN)" value={String(form.biography_en || '')} onChange={(e) => setForm({ ...form, biography_en: e.target.value })} className="admin-input" />
            </label>
            <label className="admin-label">
              <span>Biography (TA)</span>
              <textarea rows={2} placeholder="Biography (TA)" value={String(form.biography_ta || '')} onChange={(e) => setForm({ ...form, biography_ta: e.target.value })} className="admin-input" />
            </label>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="admin-label">
              <span>Title (EN) *</span>
              <input required placeholder="Title (EN)" value={String(form.title_en || '')} onChange={(e) => setForm({ ...form, title_en: e.target.value })} className="admin-input" />
            </label>
            <label className="admin-label">
              <span>Title (TA) *</span>
              <input required placeholder="Title (TA)" value={String(form.title_ta || '')} onChange={(e) => setForm({ ...form, title_ta: e.target.value })} className="admin-input" />
            </label>
            <label className="admin-label">
              <span>Category</span>
              <input placeholder="e.g. Health Camp, Education" value={String(form.category || '')} onChange={(e) => setForm({ ...form, category: e.target.value })} className="admin-input" />
            </label>
            <label className="admin-label">
              <span>{mode === 'events' ? 'Event Date *' : 'Activity Date'}</span>
              <input
                type="date"
                required={mode === 'events'}
                value={String((mode === 'events' ? form.event_date : form.activity_date) || '')}
                onChange={(e) => setForm({ ...form, [mode === 'events' ? 'event_date' : 'activity_date']: e.target.value })}
                className="admin-input"
              />
            </label>
            <label className="admin-label">
              <span>Location (EN)</span>
              <input placeholder="Location (EN)" value={String(form.location_en || '')} onChange={(e) => setForm({ ...form, location_en: e.target.value })} className="admin-input" />
            </label>
            <label className="admin-label">
              <span>Location (TA)</span>
              <input placeholder="Location (TA)" value={String(form.location_ta || '')} onChange={(e) => setForm({ ...form, location_ta: e.target.value })} className="admin-input" />
            </label>
            <label className="admin-label">
              <span>Description (EN) *</span>
              <textarea required rows={3} placeholder="Description (EN)" value={String(form.description_en || '')} onChange={(e) => setForm({ ...form, description_en: e.target.value })} className="admin-input" />
            </label>
            <label className="admin-label">
              <span>Description (TA) *</span>
              <textarea required rows={3} placeholder="Description (TA)" value={String(form.description_ta || '')} onChange={(e) => setForm({ ...form, description_ta: e.target.value })} className="admin-input" />
            </label>
            {mode === 'events' && (
              <label className="admin-label">
                <span>Linked Gallery Album</span>
                <select value={String(form.gallery_folder_id || '')} onChange={(e) => setForm({ ...form, gallery_folder_id: e.target.value || null })} className="admin-input">
                  <option value="">None (Optional)</option>
                  {folders.map((gf) => <option key={gf.id} value={gf.id}>{gf.title_en}</option>)}
                </select>
              </label>
            )}
            <label className="admin-label">
              <span>Publish Status</span>
              <select value={String(form.status || 'published')} onChange={(e) => setForm({ ...form, status: e.target.value })} className="admin-input">
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </label>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <input
            placeholder={tr('Image / Banner URL', 'போட்டோ / Banner Link')}
            value={String(form[imgField] || '')}
            onChange={(e) => setForm({ ...form, [imgField]: e.target.value })}
            className="admin-input min-w-[200px] flex-1"
          />
          <button type="button" onClick={() => setPickerOpen(true)} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700">
            <ImageIcon className="h-4 w-4 text-brand-600" />
            <span>{tr('Select / Upload Banner', 'Banner போட்டோ எடு')}</span>
          </button>
          <button
            type="submit"
            disabled={!isDirty}
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Plus className="h-4 w-4" />
            <span>{editingId ? tr('Save Changes', 'Save பண்ணு') : tr('Create', 'Add பண்ணு')}</span>
          </button>
        </div>
      </form>

      {loading ? (
        <div className="space-y-3 px-4 lg:px-0">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 admin-skeleton rounded-2xl" />)}
        </div>
      ) : loadError ? (
        <div className="admin-card flex flex-wrap items-center justify-between gap-3 border-red-200 bg-red-50 text-sm font-semibold text-red-800">
          <span>{loadError}</span>
          <button
            type="button"
            onClick={() => load(true)}
            className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700"
          >
            {tr('Retry', 'Retry பண்ணு')}
          </button>
        </div>
      ) : currentList.length === 0 ? (
        <div className="admin-card text-center text-sm text-slate-500">
          {tr('No entries added yet. Use the form above to add one.', 'இப்போதைக்கு எந்த Record-உம் இல்லை. மேல இருக்கிற Form-ல Add பண்ணுங்க.')}
        </div>
      ) : (
        <div className="space-y-3">
          {currentList.map((item) => {
            const rec = item as unknown as Record<string, unknown>;
            const id = String(rec.id);
            const title = String(rec.title_en || rec.name_en || '');
            const sub = String(rec.event_date || rec.activity_date || rec.designation_en || '');
            const status = String(rec.status || '');
            return (
              <div key={id} className="admin-card flex flex-wrap items-center justify-between gap-4">
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
                      title={tr('Version History', 'பழைய History')}
                    >
                      <History className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(id);
                      setForm(rec);
                      setSavedSnapshot(JSON.stringify(rec));
                    }}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    {tr('Edit', 'Edit')}
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
