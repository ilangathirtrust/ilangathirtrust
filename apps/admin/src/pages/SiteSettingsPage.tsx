import { useEffect, useState } from 'react';
import { History, Image as ImageIcon, Loader2, Save } from 'lucide-react';
import { adminApi } from '../lib/api';
import { MediaPickerModal } from '../components/MediaPickerModal';
import { VersionHistoryModal } from '../components/VersionHistoryModal';

interface SettingRow {
  key: string;
  category: string;
  value_en: string;
  value_ta: string;
  json_value: Record<string, unknown> | null;
}

export function SiteSettingsPage({ onNotify }: { onNotify: (msg: string, isErr?: boolean) => void }) {
  const [rows, setRows] = useState<SettingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pickerKey, setPickerKey] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const load = () => {
    setLoading(true);
    adminApi<SettingRow[]>('/settings')
      .then(setRows)
      .catch((e) => onNotify(e.message, true))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const updateRow = (key: string, field: 'value_en' | 'value_ta', val: string) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, [field]: val } : r)));
  };

  const updateJson = (key: string, rawJson: string) => {
    try {
      const parsed = JSON.parse(rawJson);
      setRows((prev) => prev.map((r) => (r.key === key ? { ...r, json_value: parsed } : r)));
    } catch {
      // Allow typing intermediate JSON via raw string if needed; handled cleanly below
    }
  };

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi('/settings', {
        method: 'PUT',
        body: JSON.stringify({ items: rows, change_note: 'Updated site settings from admin' })
      });
      onNotify('All website settings updated and published.');
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Save failed.', true);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="h-64 animate-pulse rounded-2xl bg-slate-200" />;

  const imageKeys = new Set(['logo_url', 'favicon_url', 'founder_image_url']);

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Global Trust Settings, Brand, Founder & Contact</h2>
          <p className="text-xs text-slate-500">All changes automatically update English & Tamil website headers, footers, and contact pages.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowHistory(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            <History className="h-4 w-4" />
            <span>Version History</span>
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-brand-700 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>Save All Settings</span>
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {rows.map((row) => (
          <div key={row.key} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-brand-700">{row.key}</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold uppercase text-slate-600">
                {row.category}
              </span>
            </div>

            {row.json_value !== null ? (
              <label className="admin-label">
                <span>Configuration JSON</span>
                <textarea
                  rows={3}
                  defaultValue={JSON.stringify(row.json_value, null, 2)}
                  onBlur={(e) => updateJson(row.key, e.target.value)}
                  className="admin-input font-mono text-xs"
                />
              </label>
            ) : imageKeys.has(row.key) ? (
              <div className="flex flex-wrap items-center gap-4">
                {row.value_en && (
                  <img src={row.value_en} alt={row.key} className="h-14 w-14 rounded-xl border object-cover" />
                )}
                <input
                  value={row.value_en}
                  onChange={(e) => {
                    updateRow(row.key, 'value_en', e.target.value);
                    updateRow(row.key, 'value_ta', e.target.value);
                  }}
                  className="admin-input flex-1"
                  placeholder="Image URL"
                />
                <button
                  type="button"
                  onClick={() => setPickerKey(row.key)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-brand-50"
                >
                  <ImageIcon className="h-4 w-4 text-brand-600" />
                  <span>Choose / Upload</span>
                </button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="admin-label">
                  <span>English Value</span>
                  <textarea
                    rows={row.value_en.length > 80 ? 3 : 2}
                    value={row.value_en}
                    onChange={(e) => updateRow(row.key, 'value_en', e.target.value)}
                    className="admin-input"
                  />
                </label>
                <label className="admin-label">
                  <span>Tamil Value (தமிழ்)</span>
                  <textarea
                    rows={row.value_ta.length > 80 ? 3 : 2}
                    value={row.value_ta}
                    onChange={(e) => updateRow(row.key, 'value_ta', e.target.value)}
                    className="admin-input"
                  />
                </label>
              </div>
            )}
          </div>
        ))}
      </div>

      <MediaPickerModal
        open={pickerKey !== null}
        bucket="media"
        folderName="brand"
        onClose={() => setPickerKey(null)}
        onSelect={(url) => {
          if (pickerKey) {
            updateRow(pickerKey, 'value_en', url);
            updateRow(pickerKey, 'value_ta', url);
          }
          setPickerKey(null);
        }}
      />

      <VersionHistoryModal
        open={showHistory}
        entityType="site_settings"
        entityId="global"
        onClose={() => setShowHistory(false)}
        onRestored={() => {
          onNotify('Restored previous site settings version.');
          load();
        }}
      />
    </form>
  );
}
