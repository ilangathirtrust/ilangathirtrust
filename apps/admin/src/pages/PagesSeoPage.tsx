import { useEffect, useState } from 'react';
import { History, Image as ImageIcon, Loader2, Save } from 'lucide-react';
import type { PageContent } from '@ilangathir/shared';
import { adminApi } from '../lib/api';
import { useAdminUi } from '../lib/admin-ui';
import { MediaPickerModal } from '../components/MediaPickerModal';
import { VersionHistoryModal } from '../components/VersionHistoryModal';

export function PagesSeoPage({ onNotify }: { onNotify: (msg: string, isErr?: boolean) => void }) {
  const { tr } = useAdminUi();
  const [pages, setPages] = useState<PageContent[]>([]);
  const [selectedSlug, setSelectedSlug] = useState('home');
  const [form, setForm] = useState<PageContent | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const pageSnapshot = (p: PageContent | null) =>
    p
      ? JSON.stringify({
          hero_eyebrow_en: p.hero_eyebrow_en,
          hero_eyebrow_ta: p.hero_eyebrow_ta,
          hero_title_en: p.hero_title_en,
          hero_title_ta: p.hero_title_ta,
          hero_subtitle_en: p.hero_subtitle_en,
          hero_subtitle_ta: p.hero_subtitle_ta,
          hero_image_url: p.hero_image_url || ''
        })
      : '';

  const isDirty = Boolean(form && pageSnapshot(form) !== savedSnapshot);

  const load = (force = false) => {
    setLoading(true);
    setLoadError('');
    adminApi<PageContent[]>('/pages', { forceRefresh: force })
      .then((list) => {
        setPages(list);
        const found = list.find((p) => p.slug === selectedSlug) || list[0] || null;
        setForm(found);
        setSavedSnapshot(pageSnapshot(found));
        if (found) setSelectedSlug(found.slug);
      })
      .catch((e) => {
        const msg = e instanceof Error ? e.message : 'Unable to load pages.';
        setLoadError(msg);
        onNotify(msg, true);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(false);
  }, []);

  function selectPage(slug: string) {
    setSelectedSlug(slug);
    const found = pages.find((p) => p.slug === slug) || null;
    setForm(found);
    setSavedSnapshot(pageSnapshot(found));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form || !isDirty) return;
    setSaving(true);
    try {
      const updated = await adminApi<PageContent>(`/pages/${form.slug}`, {
        method: 'PUT',
        body: JSON.stringify({
          slug: form.slug,
          page_name: form.page_name,
          hero_eyebrow_en: form.hero_eyebrow_en,
          hero_eyebrow_ta: form.hero_eyebrow_ta,
          hero_title_en: form.hero_title_en,
          hero_title_ta: form.hero_title_ta,
          hero_subtitle_en: form.hero_subtitle_en,
          hero_subtitle_ta: form.hero_subtitle_ta,
          hero_image_url: form.hero_image_url,
          hero_cta_primary_en: form.hero_cta_primary_en,
          hero_cta_primary_ta: form.hero_cta_primary_ta,
          hero_cta_primary_href: form.hero_cta_primary_href,
          hero_cta_secondary_en: form.hero_cta_secondary_en,
          hero_cta_secondary_ta: form.hero_cta_secondary_ta,
          hero_cta_secondary_href: form.hero_cta_secondary_href
        })
      });
      setPages((prev) => prev.map((p) => (p.slug === updated.slug ? updated : p)));
      setForm(updated);
      setSavedSnapshot(pageSnapshot(updated));
      onNotify(
        tr(
          `Saved "${updated.page_name}" hero content.`,
          `"${updated.page_name}" Banner விவரம் Save ஆச்சு.`
        )
      );
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Save failed.', true);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 px-4 lg:px-0">
        <div className="h-12 admin-skeleton rounded-2xl" />
        <div className="h-80 admin-skeleton rounded-2xl" />
      </div>
    );
  }

  if (loadError) {
    return (
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
    );
  }

  if (!form) {
    return (
      <p className="px-4 text-sm text-slate-500 lg:px-0">
        {tr('No page records found.', 'Page விவரங்கள் இன்னும் இல்லை.')}
      </p>
    );
  }

  return (
    <div className="space-y-3 lg:space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 lg:px-0">
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
          <span>{tr('Version History', 'பழைய History')}</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="admin-card space-y-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {tr(`Hero Banner Content (${form.page_name})`, `${form.page_name} — Hero & Banner Text`)}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {tr(
              'SEO titles, descriptions, and FAQs are managed directly in the frontend codebase.',
              'SEO & FAQ எல்லாம் நேரடியா Website Code-ல Update பண்ணிக்கலாம்; இங்க Banner Text மட்டும் மாத்தலாம்.'
            )}
          </p>
        </div>

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

        <div className="flex flex-wrap items-end gap-3">
          <label className="admin-label min-w-[200px] flex-1">
            <span>{tr('Hero Banner Image URL', 'Hero Banner போட்டோ Link')}</span>
            <input value={form.hero_image_url || ''} onChange={(e) => setForm({ ...form, hero_image_url: e.target.value })} className="admin-input" />
          </label>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-brand-50"
          >
            <ImageIcon className="h-4 w-4 text-brand-600" />
            <span>{tr('Select Hero Banner', 'Banner போட்டோ எடு')}</span>
          </button>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!isDirty || saving}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white shadow hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>{tr('Save Page Content', 'Page-ஐ Save பண்ணு')}</span>
          </button>
        </div>
      </form>

      <MediaPickerModal
        open={pickerOpen}
        bucket="media"
        folderName="banners"
        onClose={() => setPickerOpen(false)}
        onSelect={(url) => {
          if (form) setForm({ ...form, hero_image_url: url });
          setPickerOpen(false);
        }}
      />

      <VersionHistoryModal
        open={showHistory}
        entityType="page_contents"
        entityId={form.slug}
        onClose={() => setShowHistory(false)}
        onRestored={() => {
          onNotify(tr('Restored earlier page content version.', 'பழைய Page Version Restore ஆச்சு.'));
          load(true);
        }}
      />
    </div>
  );
}
