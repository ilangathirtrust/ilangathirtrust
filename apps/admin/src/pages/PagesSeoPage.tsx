import { useEffect, useState } from 'react';
import { History, Image as ImageIcon, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import type { BilingualFaq, PageContent } from '@ilangathir/shared';
import { adminApi } from '../lib/api';
import { MediaPickerModal } from '../components/MediaPickerModal';
import { VersionHistoryModal } from '../components/VersionHistoryModal';

export function PagesSeoPage({ onNotify }: { onNotify: (msg: string, isErr?: boolean) => void }) {
  const [pages, setPages] = useState<PageContent[]>([]);
  const [selectedSlug, setSelectedSlug] = useState('home');
  const [form, setForm] = useState<PageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pickerField, setPickerField] = useState<'hero_image_url' | 'og_image_url' | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const load = () => {
    setLoading(true);
    adminApi<PageContent[]>('/pages')
      .then((list) => {
        setPages(list);
        const found = list.find((p) => p.slug === selectedSlug) || list[0] || null;
        setForm(found);
        if (found) setSelectedSlug(found.slug);
      })
      .catch((e) => onNotify(e.message, true))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  function selectPage(slug: string) {
    setSelectedSlug(slug);
    const found = pages.find((p) => p.slug === slug) || null;
    setForm(found);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      const updated = await adminApi<PageContent>(`/pages/${form.slug}`, {
        method: 'PUT',
        body: JSON.stringify(form)
      });
      setPages((prev) => prev.map((p) => (p.slug === updated.slug ? updated : p)));
      setForm(updated);
      onNotify(`Saved page "${updated.page_name}" & SEO metadata.`);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Save failed.', true);
    } finally {
      setSaving(false);
    }
  }

  function updateFaq(idx: number, field: keyof BilingualFaq, val: string) {
    if (!form) return;
    const next = [...(form.faqs || [])];
    next[idx] = { ...next[idx], [field]: val };
    setForm({ ...form, faqs: next });
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-12 admin-skeleton rounded-2xl" />
        <div className="h-96 admin-skeleton rounded-3xl" />
      </div>
    );
  }
  if (!form) return <p className="text-sm text-slate-500">No page records found.</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {pages.map((p) => (
            <button
              key={p.slug}
              type="button"
              onClick={() => selectPage(p.slug)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                selectedSlug === p.slug
                  ? 'bg-brand-600 text-white shadow'
                  : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {p.page_name}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShowHistory(true)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
        >
          <History className="h-4 w-4" />
          <span>Version History</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Hero Section & Call-to-Action ({form.page_name})</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="admin-label">
            <span>Hero Eyebrow (EN)</span>
            <input value={form.hero_eyebrow_en} onChange={(e) => setForm({ ...form, hero_eyebrow_en: e.target.value })} className="admin-input" />
          </label>
          <label className="admin-label">
            <span>Hero Eyebrow (TA)</span>
            <input value={form.hero_eyebrow_ta} onChange={(e) => setForm({ ...form, hero_eyebrow_ta: e.target.value })} className="admin-input" />
          </label>
          <label className="admin-label">
            <span>Hero Title (EN)</span>
            <input value={form.hero_title_en} onChange={(e) => setForm({ ...form, hero_title_en: e.target.value })} className="admin-input" />
          </label>
          <label className="admin-label">
            <span>Hero Title (TA)</span>
            <input value={form.hero_title_ta} onChange={(e) => setForm({ ...form, hero_title_ta: e.target.value })} className="admin-input" />
          </label>
          <label className="admin-label">
            <span>Hero Subtitle (EN)</span>
            <textarea rows={3} value={form.hero_subtitle_en} onChange={(e) => setForm({ ...form, hero_subtitle_en: e.target.value })} className="admin-input" />
          </label>
          <label className="admin-label">
            <span>Hero Subtitle (TA)</span>
            <textarea rows={3} value={form.hero_subtitle_ta} onChange={(e) => setForm({ ...form, hero_subtitle_ta: e.target.value })} className="admin-input" />
          </label>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <label className="admin-label flex-1">
            <span>Hero Banner Image URL</span>
            <input value={form.hero_image_url || ''} onChange={(e) => setForm({ ...form, hero_image_url: e.target.value })} className="admin-input" />
          </label>
          <button
            type="button"
            onClick={() => setPickerField('hero_image_url')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-brand-50"
          >
            <ImageIcon className="h-4 w-4 text-brand-600" />
            <span>Select Hero Banner</span>
          </button>
        </div>

        <hr className="border-slate-200" />
        <h3 className="text-base font-bold text-slate-900">Bilingual SEO, Open Graph & GEO Metadata</h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="admin-label">
            <span>SEO Title (EN)</span>
            <input value={form.seo_title_en} onChange={(e) => setForm({ ...form, seo_title_en: e.target.value })} className="admin-input" />
          </label>
          <label className="admin-label">
            <span>SEO Title (TA)</span>
            <input value={form.seo_title_ta} onChange={(e) => setForm({ ...form, seo_title_ta: e.target.value })} className="admin-input" />
          </label>
          <label className="admin-label">
            <span>SEO Meta Description (EN)</span>
            <textarea rows={2} value={form.seo_description_en} onChange={(e) => setForm({ ...form, seo_description_en: e.target.value })} className="admin-input" />
          </label>
          <label className="admin-label">
            <span>SEO Meta Description (TA)</span>
            <textarea rows={2} value={form.seo_description_ta} onChange={(e) => setForm({ ...form, seo_description_ta: e.target.value })} className="admin-input" />
          </label>
        </div>

        <hr className="border-slate-200" />
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">AEO FAQ Structured Data</h3>
          <button
            type="button"
            onClick={() =>
              setForm({
                ...form,
                faqs: [...(form.faqs || []), { question_en: '', question_ta: '', answer_en: '', answer_ta: '' }]
              })
            }
            className="inline-flex items-center gap-1 rounded-xl bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700 hover:bg-brand-100"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add FAQ</span>
          </button>
        </div>

        <div className="space-y-4">
          {(form.faqs || []).map((faq, idx) => (
            <div key={idx} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">FAQ #{idx + 1}</span>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, faqs: form.faqs.filter((_, i) => i !== idx) })}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <input placeholder="Question (EN)" value={faq.question_en} onChange={(e) => updateFaq(idx, 'question_en', e.target.value)} className="admin-input" />
                <input placeholder="Question (TA)" value={faq.question_ta} onChange={(e) => updateFaq(idx, 'question_ta', e.target.value)} className="admin-input" />
                <textarea placeholder="Answer (EN)" rows={2} value={faq.answer_en} onChange={(e) => updateFaq(idx, 'answer_en', e.target.value)} className="admin-input" />
                <textarea placeholder="Answer (TA)" rows={2} value={faq.answer_ta} onChange={(e) => updateFaq(idx, 'answer_ta', e.target.value)} className="admin-input" />
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white shadow hover:bg-brand-700 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>Save Page & SEO</span>
          </button>
        </div>
      </form>

      <MediaPickerModal
        open={pickerField !== null}
        bucket="media"
        folderName="banners"
        onClose={() => setPickerField(null)}
        onSelect={(url) => {
          if (pickerField && form) setForm({ ...form, [pickerField]: url });
          setPickerField(null);
        }}
      />

      <VersionHistoryModal
        open={showHistory}
        entityType="page_contents"
        entityId={form.slug}
        onClose={() => setShowHistory(false)}
        onRestored={() => {
          onNotify('Restored earlier page content version.');
          load();
        }}
      />
    </div>
  );
}
