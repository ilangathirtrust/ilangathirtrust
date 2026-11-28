import { useEffect, useState } from 'react';
import { History, Image as ImageIcon, Loader2, Save } from 'lucide-react';
import { adminApi } from '../lib/api';
import { useAdminUi } from '../lib/admin-ui';
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
  const { tr } = useAdminUi();
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

  const updateJsonField = (key: string, nextObj: Record<string, unknown>) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, json_value: nextObj } : r)));
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

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-32 admin-skeleton rounded-2xl" />
        ))}
      </div>
    );
  }

  const imageKeys = new Set(['logo_url', 'favicon_url', 'founder_image_url']);

  return (
    <form onSubmit={handleSave} className="space-y-3 lg:space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 lg:px-0">
        <div>
          <h2 className="text-lg font-bold text-brand-900">
            {tr('Global Trust Settings, Brand, Founder & Contact', 'Trust Settings, Logo, Founder & Contact')}
          </h2>
          <p className="text-xs text-slate-500">
            {tr(
              'All changes automatically update English & Tamil website headers, footers, and pages.',
              'இங்க மாத்துறது எல்லாம் Website-ல English & Tamil-ல உடனே Update ஆகும்.'
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowHistory(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-sand-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-sand-50"
          >
            <History className="h-4 w-4" />
            <span>{tr('Version History', 'பழைய History')}</span>
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-900 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-brand-800 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>{tr('Save All Settings', 'எல்லாம் Save பண்ணு')}</span>
          </button>
        </div>
      </div>

      <div className="grid gap-3 lg:gap-4">
        {rows.map((row) => (
          <div key={row.key} className="admin-card">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-xs font-bold text-brand-700">{row.key}</span>
              <span className="rounded-full bg-sand-100 px-2.5 py-0.5 text-[10px] font-bold uppercase text-slate-600">
                {row.category}
              </span>
            </div>

            {row.key === 'donation_config' && row.json_value !== null ? (
              <div className="space-y-4">
                <label className="flex items-center justify-between gap-3 rounded-xl border border-sand-200 bg-sand-50 p-3.5">
                  <div>
                    <p className="text-xs font-extrabold text-brand-900">Accepting Online Donations</p>
                    <p className="text-[11px] text-slate-500">
                      Turn off to hide all donation buttons, links, and the /donate page across the website.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={row.json_value.enabled !== false}
                    onChange={(e) =>
                      updateJsonField(row.key, { ...row.json_value, enabled: e.target.checked })
                    }
                    className="h-5 w-5 rounded accent-brand-900"
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="admin-label">
                    <span>Suggested Amounts (INR, comma separated)</span>
                    <input
                      defaultValue={
                        Array.isArray(row.json_value.suggested_amounts)
                          ? row.json_value.suggested_amounts.join(', ')
                          : '500, 1000, 2500, 5000, 10000'
                      }
                      onBlur={(e) => {
                        const nums = e.target.value
                          .split(',')
                          .map((v) => Number(v.trim()))
                          .filter((n) => Number.isFinite(n) && n >= 100);
                        if (nums.length) {
                          updateJsonField(row.key, { ...row.json_value, suggested_amounts: nums });
                        }
                      }}
                      className="admin-input"
                    />
                  </label>
                  <label className="admin-label">
                    <span>Donation Purposes (comma separated)</span>
                    <input
                      defaultValue={
                        Array.isArray(row.json_value.purposes)
                          ? row.json_value.purposes.join(', ')
                          : 'General Welfare, Education Support, Medical Relief, Environmental Care'
                      }
                      onBlur={(e) => {
                        const list = e.target.value
                          .split(',')
                          .map((v) => v.trim())
                          .filter(Boolean);
                        if (list.length) {
                          updateJsonField(row.key, { ...row.json_value, purposes: list });
                        }
                      }}
                      className="admin-input"
                    />
                  </label>
                </div>
              </div>
            ) : row.key === 'social_links' && row.json_value !== null ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {['whatsapp', 'facebook', 'instagram', 'youtube'].map((net) => (
                  <label key={net} className="admin-label">
                    <span className="capitalize">{net} URL</span>
                    <input
                      value={String(row.json_value?.[net] || '')}
                      onChange={(e) =>
                        updateJsonField(row.key, { ...row.json_value, [net]: e.target.value })
                      }
                      placeholder={`https://...`}
                      className="admin-input"
                    />
                  </label>
                ))}
              </div>
            ) : row.json_value !== null ? (
              <label className="admin-label">
                <span>Configuration JSON</span>
                <textarea
                  rows={3}
                  defaultValue={JSON.stringify(row.json_value, null, 2)}
                  onBlur={(e) => {
                    try {
                      updateJsonField(row.key, JSON.parse(e.target.value));
                    } catch {
                      // ignore invalid intermediate JSON
                    }
                  }}
                  className="admin-input font-mono text-xs"
                />
              </label>
            ) : imageKeys.has(row.key) ? (
              <div className="flex flex-wrap items-center gap-3">
                {row.value_en && (
                  <img src={row.value_en} alt={row.key} className="h-14 w-14 rounded-xl border border-sand-200 object-cover" />
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
                  className="inline-flex items-center gap-1.5 rounded-xl border border-sand-200 bg-sand-50 px-4 py-2.5 text-xs font-bold text-brand-900 hover:bg-brand-50"
                >
                  <ImageIcon className="h-4 w-4 text-saffron-600" />
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
