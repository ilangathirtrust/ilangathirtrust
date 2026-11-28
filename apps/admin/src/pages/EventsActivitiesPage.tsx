import { useEffect, useState } from 'react';
import { History, Image as ImageIcon, Plus, Trash2 } from 'lucide-react';
import type { ActivityItem, EventItem, GalleryFolder, TeamMember } from '@ilangathir/shared';
import { adminApi } from '../lib/api';
import { useAdminUi } from '../lib/admin-ui';
import { MediaPickerModal } from '../components/MediaPickerModal';
import { VersionHistoryModal } from '../components/VersionHistoryModal';
import { EventsActivitiesSkeleton } from '../components/PageSkeletons';

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
          const msg = e instanceof Error ? e.message : tr('Unable to load events.', 'ஈவென்ட்ஸ் லோடு ஆகலைங்க.');
          setLoadError(msg);
          onNotify(msg, true);
        })
        .finally(() => setLoading(false));
    } else if (mode === 'activities') {
      adminApi<ActivityItem[]>('/activities', { forceRefresh: force })
        .then(setActivities)
        .catch((e) => {
          const msg = e instanceof Error ? e.message : tr('Unable to load activities.', 'நலப்பணிகள் லோடு ஆகலைங்க.');
          setLoadError(msg);
          onNotify(msg, true);
        })
        .finally(() => setLoading(false));
    } else {
      adminApi<TeamMember[]>('/team', { forceRefresh: force })
        .then(setTeam)
        .catch((e) => {
          const msg = e instanceof Error ? e.message : tr('Unable to load team members.', 'டீம் விவரம் லோடு ஆகலைங்க.');
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
        onNotify(tr('Updated successfully.', 'மாற்றம் சேவ் ஆச்சுங்க.'));
      } else {
        await adminApi(endpoint, { method: 'POST', body: JSON.stringify(form) });
        onNotify(tr('Created successfully.', 'புதுசா சேர்த்தாச்சுங்க.'));
      }
      setForm({ status: 'published', is_active: true, sort_order: 0 });
      setEditingId(null);
      load(true);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : tr('Save failed.', 'சேவ் ஆகலைங்க.'), true);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(tr('Delete this entry permanently?', 'இதை நிரந்தரமா நீக்கலாமா?'))) return;
    const endpoint = mode === 'events' ? '/events' : mode === 'activities' ? '/activities' : '/team';
    await adminApi(`${endpoint}/${id}`, { method: 'DELETE' });
    onNotify(tr('Deleted.', 'நீக்கியாச்சுங்க.'));
    load(true);
  }

  async function togglePublish(item: { id: string; status?: string }) {
    const next = item.status === 'published' ? 'draft' : 'published';
    const endpoint = mode === 'events' ? '/events' : '/activities';
    await adminApi(`${endpoint}/${item.id}`, { method: 'PUT', body: JSON.stringify({ status: next }) });
    onNotify(
      next === 'published'
        ? tr('Status changed to published.', 'இப்போ லைவ்ல போட்டாச்சுங்க.')
        : tr('Status changed to draft.', 'டிராஃப்ட்ல வச்சாச்சுங்க.')
    );
    load(true);
  }

  const imgField = mode === 'events' ? 'banner_url' : 'image_url';
  const currentList = mode === 'events' ? events : mode === 'activities' ? activities : team;

  if (loading && currentList.length === 0) {
    return <EventsActivitiesSkeleton isTeam={mode === 'team'} />;
  }

  const entityLabel =
    mode === 'events'
      ? tr('Event', 'ஈவென்ட்')
      : mode === 'activities'
      ? tr('Activity', 'நலப்பணி')
      : tr('Team Member', 'நிர்வாகி');

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="admin-card space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-bold text-slate-900 sm:text-lg">
            {editingId
              ? tr(`Edit ${entityLabel}`, `${entityLabel} விவரத்தை மாத்து`)
              : tr(`Add New ${entityLabel}`, `புது ${entityLabel} சேர்`)}
          </h2>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm({ status: 'published', is_active: true, sort_order: 0 });
              }}
              className="text-xs font-bold text-slate-500 hover:text-slate-900"
            >
              {tr('Cancel editing', 'வேண்டாம்')}
            </button>
          )}
        </div>

        {mode === 'team' ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="admin-label">
              <span>{tr('Full Name (EN) *', 'முழுப் பெயர் (ஆங்கிலம்) *')}</span>
              <input required placeholder={tr('Full Name (EN)', 'பெயர் (ஆங்கிலம்)')} value={String(form.name_en || '')} onChange={(e) => setForm({ ...form, name_en: e.target.value })} className="admin-input" />
            </label>
            <label className="admin-label">
              <span>{tr('Full Name (TA) *', 'முழுப் பெயர் (தமிழ்) *')}</span>
              <input required placeholder={tr('Full Name (TA)', 'பெயர் (தமிழ்)')} value={String(form.name_ta || '')} onChange={(e) => setForm({ ...form, name_ta: e.target.value })} className="admin-input" />
            </label>
            <label className="admin-label">
              <span>{tr('Designation (EN) *', 'பதவி (ஆங்கிலம்) *')}</span>
              <input required placeholder={tr('Designation (EN)', 'பதவி (ஆங்கிலம்)')} value={String(form.designation_en || '')} onChange={(e) => setForm({ ...form, designation_en: e.target.value })} className="admin-input" />
            </label>
            <label className="admin-label">
              <span>{tr('Designation (TA) *', 'பதவி (தமிழ்) *')}</span>
              <input required placeholder={tr('Designation (TA)', 'பதவி (தமிழ்)')} value={String(form.designation_ta || '')} onChange={(e) => setForm({ ...form, designation_ta: e.target.value })} className="admin-input" />
            </label>
            <label className="admin-label">
              <span>{tr('Biography (EN)', 'சுயவிவரம் (ஆங்கிலம்)')}</span>
              <textarea rows={2} placeholder={tr('Biography (EN)', 'விவரம் (ஆங்கிலம்)')} value={String(form.biography_en || '')} onChange={(e) => setForm({ ...form, biography_en: e.target.value })} className="admin-input" />
            </label>
            <label className="admin-label">
              <span>{tr('Biography (TA)', 'சுயவிவரம் (தமிழ்)')}</span>
              <textarea rows={2} placeholder={tr('Biography (TA)', 'விவரம் (தமிழ்)')} value={String(form.biography_ta || '')} onChange={(e) => setForm({ ...form, biography_ta: e.target.value })} className="admin-input" />
            </label>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="admin-label">
              <span>{tr('Title (EN) *', 'தலைப்பு (ஆங்கிலம்) *')}</span>
              <input required placeholder={tr('Title (EN)', 'தலைப்பு (ஆங்கிலம்)')} value={String(form.title_en || '')} onChange={(e) => setForm({ ...form, title_en: e.target.value })} className="admin-input" />
            </label>
            <label className="admin-label">
              <span>{tr('Title (TA) *', 'தலைப்பு (தமிழ்) *')}</span>
              <input required placeholder={tr('Title (TA)', 'தலைப்பு (தமிழ்)')} value={String(form.title_ta || '')} onChange={(e) => setForm({ ...form, title_ta: e.target.value })} className="admin-input" />
            </label>
            <label className="admin-label">
              <span>{tr('Category', 'பிரிவு')}</span>
              <input placeholder={tr('e.g. Health Camp, Education', 'உதா: மருத்துவ முகாம், கல்வி')} value={String(form.category || '')} onChange={(e) => setForm({ ...form, category: e.target.value })} className="admin-input" />
            </label>
            <label className="admin-label">
              <span>{mode === 'events' ? tr('Event Date *', 'நிகழ்வு தேதி *') : tr('Activity Date', 'பணி தேதி')}</span>
              <input
                type="date"
                required={mode === 'events'}
                value={String((mode === 'events' ? form.event_date : form.activity_date) || '')}
                onChange={(e) => setForm({ ...form, [mode === 'events' ? 'event_date' : 'activity_date']: e.target.value })}
                className="admin-input"
              />
            </label>
            <label className="admin-label">
              <span>{tr('Location (EN)', 'இடம் (ஆங்கிலம்)')}</span>
              <input placeholder={tr('Location (EN)', 'இடம் (ஆங்கிலம்)')} value={String(form.location_en || '')} onChange={(e) => setForm({ ...form, location_en: e.target.value })} className="admin-input" />
            </label>
            <label className="admin-label">
              <span>{tr('Location (TA)', 'இடம் (தமிழ்)')}</span>
              <input placeholder={tr('Location (TA)', 'இடம் (தமிழ்)')} value={String(form.location_ta || '')} onChange={(e) => setForm({ ...form, location_ta: e.target.value })} className="admin-input" />
            </label>
            <label className="admin-label">
              <span>{tr('Description (EN) *', 'விவரம் (ஆங்கிலம்) *')}</span>
              <textarea required rows={3} placeholder={tr('Description (EN)', 'விவரம் (ஆங்கிலம்)')} value={String(form.description_en || '')} onChange={(e) => setForm({ ...form, description_en: e.target.value })} className="admin-input" />
            </label>
            <label className="admin-label">
              <span>{tr('Description (TA) *', 'விவரம் (தமிழ்) *')}</span>
              <textarea required rows={3} placeholder={tr('Description (TA)', 'விவரம் (தமிழ்)')} value={String(form.description_ta || '')} onChange={(e) => setForm({ ...form, description_ta: e.target.value })} className="admin-input" />
            </label>
            {mode === 'events' && (
              <label className="admin-label">
                <span>{tr('Linked Gallery Album', 'இணைந்த கேலரி ஃபோல்டர்')}</span>
                <select value={String(form.gallery_folder_id || '')} onChange={(e) => setForm({ ...form, gallery_folder_id: e.target.value || null })} className="admin-input">
                  <option value="">{tr('None (Optional)', 'எதுவும் இல்லை')}</option>
                  {folders.map((gf) => <option key={gf.id} value={gf.id}>{gf.title_en}</option>)}
                </select>
              </label>
            )}
            <label className="admin-label">
              <span>{tr('Publish Status', 'நிலை')}</span>
              <select value={String(form.status || 'published')} onChange={(e) => setForm({ ...form, status: e.target.value })} className="admin-input">
                <option value="published">{tr('Published', 'லைவ்ல இருக்கு')}</option>
                <option value="draft">{tr('Draft', 'டிராஃப்ட்')}</option>
              </select>
            </label>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <input
            placeholder={tr('Image / Banner URL', 'போட்டோ / பேனர் லிங்க்')}
            value={String(form[imgField] || '')}
            onChange={(e) => setForm({ ...form, [imgField]: e.target.value })}
            className="admin-input min-w-[200px] flex-1"
          />
          <button type="button" onClick={() => setPickerOpen(true)} className="admin-btn-secondary py-2.5">
            <ImageIcon className="h-4 w-4 text-blue-600" />
            <span>{tr('Select / Upload Banner', 'போட்டோ எடு')}</span>
          </button>
          <button
            type="submit"
            disabled={!isDirty}
            className="admin-btn-primary py-2.5 px-5"
          >
            <Plus className="h-4 w-4" />
            <span>{editingId ? tr('Save Changes', 'மாற்றத்தை சேமி') : tr('Create', 'புதுசா சேர்')}</span>
          </button>
        </div>
      </form>

      {loadError ? (
        <div className="admin-card flex flex-wrap items-center justify-between gap-3 border-red-200 bg-red-50 text-sm font-semibold text-red-800">
          <span>{loadError}</span>
          <button
            type="button"
            onClick={() => load(true)}
            className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700"
          >
            {tr('Retry', 'மறுபடியும் முயற்சி பண்ணு')}
          </button>
        </div>
      ) : currentList.length === 0 ? (
        <div className="admin-card border-dashed py-10 text-center text-sm text-slate-500">
          {tr('No entries added yet. Use the form above to add one.', 'இன்னும் எந்த விவரமும் சேர்க்கலைங்க. மேல இருக்கிற படிவத்துல புதுசா சேருங்க.')}
        </div>
      ) : (
        <div className="space-y-2.5">
          {currentList.map((item) => {
            const rec = item as unknown as Record<string, unknown>;
            const id = String(rec.id);
            const title = String(rec.title_en || rec.name_en || '');
            const sub = String(rec.event_date || rec.activity_date || rec.designation_en || '');
            const status = String(rec.status || '');
            return (
              <div key={id} className="admin-card flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-bold text-slate-900">{title}</h3>
                  <p className="text-xs text-slate-500">{sub}</p>
                </div>
                <div className="flex items-center gap-2">
                  {status && (
                    <button
                      type="button"
                      onClick={() => togglePublish({ id, status })}
                      className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                        status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {status === 'published' ? tr('Published', 'லைவ்') : tr('Draft', 'டிராஃப்ட்')}
                    </button>
                  )}
                  {mode !== 'team' && (
                    <button
                      type="button"
                      onClick={() => setHistoryTarget({ type: mode, id })}
                      className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                      title={tr('Version History', 'பழைய வெர்ஷன்')}
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
                    className="admin-btn-secondary py-1.5 px-3"
                  >
                    {tr('Edit', 'மாத்து')}
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
            onNotify(tr('Version restored.', 'பழைய வெர்ஷன் திரும்ப எடுத்தாச்சுங்க.'));
            load(true);
          }}
        />
      )}
    </div>
  );
}
