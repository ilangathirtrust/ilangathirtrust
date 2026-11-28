import { useEffect, useState } from 'react';
import { History, Image as ImageIcon, Loader2, Save } from 'lucide-react';
import type { PageContent } from '@ilangathir/shared';
import { adminApi } from '../lib/api';
import { useAdminUi } from '../lib/admin-ui';
import { MediaPickerModal } from '../components/MediaPickerModal';
import { VersionHistoryModal } from '../components/VersionHistoryModal';
import { PagesSkeleton } from '../components/PageSkeletons';

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
        const msg = e instanceof Error ? e.message : tr('Unable to load pages.', 'பேஜ் விவரங்கள் லோடு ஆகலைங்க.');
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
          `"${updated.page_name}" பேனர் விவரம் சேவ் ஆச்சுங்க.`
        )
      );
    } catch (err) {
      onNotify(err instanceof Error ? err.message : tr('Save failed.', 'சேவ் ஆகலைங்க.'), true);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <PagesSkeleton />;
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
          {tr('Retry', 'மறுபடியும் முயற்சி பண்ணு')}
        </button>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="admin-card border-dashed py-10 text-center text-sm text-slate-500">
        {tr('No page records found.', 'பேஜ் விவரங்கள் இன்னும் எதுவும் இல்லீங்க.')}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap gap-1.5">
          {pages.map((p) => (
            <button
              key={p.slug}
              type="button"
              onClick={() => selectPage(p.slug)}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                selectedSlug === p.slug
                  ? 'bg-blue-600 text-white shadow-xs'
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
          className="admin-btn-secondary"
        >
          <History className="h-3.5 w-3.5" />
          <span>{tr('Version History', 'பழைய வெர்ஷன்')}</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="admin-card space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 sm:text-lg">
            {tr(`Hero Banner Content (${form.page_name})`, `${form.page_name} — ஹீரோ & பேனர் விவரம்`)}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {tr(
              'SEO titles, descriptions, and FAQs are managed directly in the frontend codebase.',
              'எஸ்இஓ மற்றும் கேள்வி-பதில் விவரங்கள் வெப்சைட் கோடுல இருக்கும்; இங்க பேனர் வாசகத்தை மட்டும் மாத்திக்கலாம்.'
            )}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="admin-label">
            <span>{tr('Hero Eyebrow (EN)', 'மேல் சின்ன தலைப்பு (ஆங்கிலம்)')}</span>
            <input value={form.hero_eyebrow_en} onChange={(e) => setForm({ ...form, hero_eyebrow_en: e.target.value })} className="admin-input" />
          </label>
          <label className="admin-label">
            <span>{tr('Hero Eyebrow (TA)', 'மேல் சின்ன தலைப்பு (தமிழ்)')}</span>
            <input value={form.hero_eyebrow_ta} onChange={(e) => setForm({ ...form, hero_eyebrow_ta: e.target.value })} className="admin-input" />
          </label>
          <label className="admin-label">
            <span>{tr('Hero Title (EN)', 'முக்கிய தலைப்பு (ஆங்கிலம்)')}</span>
            <input value={form.hero_title_en} onChange={(e) => setForm({ ...form, hero_title_en: e.target.value })} className="admin-input" />
          </label>
          <label className="admin-label">
            <span>{tr('Hero Title (TA)', 'முக்கிய தலைப்பு (தமிழ்)')}</span>
            <input value={form.hero_title_ta} onChange={(e) => setForm({ ...form, hero_title_ta: e.target.value })} className="admin-input" />
          </label>
          <label className="admin-label">
            <span>{tr('Hero Subtitle (EN)', 'துணை விளக்கம் (ஆங்கிலம்)')}</span>
            <textarea rows={3} value={form.hero_subtitle_en} onChange={(e) => setForm({ ...form, hero_subtitle_en: e.target.value })} className="admin-input" />
          </label>
          <label className="admin-label">
            <span>{tr('Hero Subtitle (TA)', 'துணை விளக்கம் (தமிழ்)')}</span>
            <textarea rows={3} value={form.hero_subtitle_ta} onChange={(e) => setForm({ ...form, hero_subtitle_ta: e.target.value })} className="admin-input" />
          </label>
        </div>

        <div className="flex flex-wrap items-end gap-2.5">
          <label className="admin-label min-w-0 w-full sm:w-auto sm:min-w-[200px] sm:flex-1">
            <span>{tr('Hero Banner Image URL', 'ஹீரோ பேனர் போட்டோ லிங்க்')}</span>
            <input value={form.hero_image_url || ''} onChange={(e) => setForm({ ...form, hero_image_url: e.target.value })} className="admin-input" />
          </label>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="admin-btn-secondary py-2.5"
          >
            <ImageIcon className="h-4 w-4 text-blue-600" />
            <span>{tr('Select Hero Banner', 'பேனர் போட்டோ எடு')}</span>
          </button>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={!isDirty || saving}
            className="admin-btn-primary w-full px-5 py-2.5 sm:w-auto"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>{tr('Save Page Content', 'மாற்றத்தை சேமி')}</span>
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
          onNotify(tr('Restored earlier page content version.', 'பழைய பேஜ் வெர்ஷன் திரும்ப எடுத்தாச்சுங்க.'));
          load(true);
        }}
      />
    </div>
  );
}
