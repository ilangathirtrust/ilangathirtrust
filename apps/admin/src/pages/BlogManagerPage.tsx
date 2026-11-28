import { useEffect, useState } from 'react';
import { Eye, History, Image as ImageIcon, Plus, Trash2, X } from 'lucide-react';
import type { BlogCategory, BlogPost } from '@ilangathir/shared';
import { adminApi } from '../lib/api';
import { useAdminUi } from '../lib/admin-ui';
import { MediaPickerModal } from '../components/MediaPickerModal';
import { VersionHistoryModal } from '../components/VersionHistoryModal';

export function BlogManagerPage({ onNotify }: { onNotify: (msg: string, isErr?: boolean) => void }) {
  const { tr } = useAdminUi();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [previewPost, setPreviewPost] = useState<Record<string, unknown> | null>(null);
  const [historyId, setHistoryId] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const EMPTY_BLOG_FORM = {
    title_en: '',
    title_ta: '',
    slug: '',
    category_id: '',
    excerpt_en: '',
    excerpt_ta: '',
    content_en: '',
    content_ta: '',
    featured_image_url: '',
    featured_image_alt_en: '',
    featured_image_alt_ta: '',
    tags: '',
    author_name: 'Ilangathir Trust Editorial',
    reading_time_minutes: 3,
    status: 'draft'
  };
  const [form, setForm] = useState(EMPTY_BLOG_FORM);
  const [savedSnapshot, setSavedSnapshot] = useState('');
  const isDirty = editingId
    ? JSON.stringify(form) !== savedSnapshot
    : Boolean(form.title_en.trim() && form.content_en.trim());

  const load = (force = false) => {
    setLoading(true);
    setLoadError('');
    Promise.all([
      adminApi<BlogPost[]>('/blogs', { forceRefresh: force }),
      adminApi<BlogCategory[]>('/blog-categories', { forceRefresh: force })
    ])
      .then(([p, c]) => {
        setPosts(p);
        setCategories(c);
      })
      .catch((e) => {
        const msg = e instanceof Error ? e.message : 'Unable to load blog posts.';
        setLoadError(msg);
        onNotify(msg, true);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(false);
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      ...form,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      reading_time_minutes: Number(form.reading_time_minutes) || 3
    };

    try {
      if (editingId) {
        await adminApi(`/blogs/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) });
        onNotify(tr('Blog post updated.', 'Blog Update ஆச்சு.'));
      } else {
        await adminApi('/blogs', { method: 'POST', body: JSON.stringify(payload) });
        onNotify(tr('Blog post created.', 'புதிய Blog சேர்த்தாச்சு.'));
      }
      setEditingId(null);
      setForm({
        title_en: '', title_ta: '', slug: '', category_id: '', excerpt_en: '', excerpt_ta: '',
        content_en: '', content_ta: '', featured_image_url: '', featured_image_alt_en: '',
        featured_image_alt_ta: '', tags: '', author_name: 'Ilangathir Trust Editorial',
        reading_time_minutes: 3, status: 'draft'
      });
      load(true);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Save failed.', true);
    }
  }

  async function toggleStatus(post: BlogPost) {
    const next = post.status === 'published' ? 'draft' : 'published';
    await adminApi(`/blogs/${post.id}`, { method: 'PUT', body: JSON.stringify({ status: next }) });
    onNotify(`Blog ${next}.`);
    load(true);
  }

  async function deletePost(id: string) {
    if (!confirm(tr('Delete this blog post permanently?', 'இந்த Blog-ஐ நிரந்தரமா Delete பண்ணலாமா?'))) return;
    await adminApi(`/blogs/${id}`, { method: 'DELETE' });
    onNotify(tr('Blog deleted.', 'Blog Delete பண்ணியாச்சு.'));
    load(true);
  }

  return (
    <div className="space-y-3 lg:space-y-6">
      <form onSubmit={handleSave} className="admin-card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-slate-900">
            {editingId ? tr('Edit Blog Post', 'Blog-ஐ Edit பண்ணு') : tr('Write New Blog Article', 'புதிய Blog எழுது')}
          </h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPreviewPost(form)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700"
            >
              <Eye className="h-4 w-4" />
              <span>{tr('Preview', 'Preview பாரு')}</span>
            </button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="admin-label">
            <span>Article Title (EN) *</span>
            <input required placeholder="Article Title (EN)" value={form.title_en} onChange={(e) => setForm({ ...form, title_en: e.target.value })} className="admin-input" />
          </label>
          <label className="admin-label">
            <span>Article Title (TA) *</span>
            <input required placeholder="Article Title (TA)" value={form.title_ta} onChange={(e) => setForm({ ...form, title_ta: e.target.value })} className="admin-input" />
          </label>
          <label className="admin-label">
            <span>URL Slug</span>
            <input placeholder="auto-generated if empty" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="admin-input font-mono text-xs" />
          </label>
          <label className="admin-label">
            <span>Category</span>
            <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="admin-input">
              <option value="">Select Category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name_en} / {c.name_ta}</option>)}
            </select>
          </label>
          <label className="admin-label">
            <span>Short Excerpt (EN)</span>
            <textarea rows={2} placeholder="Short Excerpt (EN)" value={form.excerpt_en} onChange={(e) => setForm({ ...form, excerpt_en: e.target.value })} className="admin-input" />
          </label>
          <label className="admin-label">
            <span>Short Excerpt (TA)</span>
            <textarea rows={2} placeholder="Short Excerpt (TA)" value={form.excerpt_ta} onChange={(e) => setForm({ ...form, excerpt_ta: e.target.value })} className="admin-input" />
          </label>
          <label className="admin-label">
            <span>Full Article Content (EN) *</span>
            <textarea required rows={6} placeholder="Full Article Content (EN)" value={form.content_en} onChange={(e) => setForm({ ...form, content_en: e.target.value })} className="admin-input" />
          </label>
          <label className="admin-label">
            <span>Full Article Content (TA) *</span>
            <textarea required rows={6} placeholder="Full Article Content (TA)" value={form.content_ta} onChange={(e) => setForm({ ...form, content_ta: e.target.value })} className="admin-input" />
          </label>
          <label className="admin-label">
            <span>Tags (comma separated)</span>
            <input placeholder="education, medical camp" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="admin-input" />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="admin-label">
              <span>{tr('Author Name', 'எழுதியவர்')}</span>
              <input placeholder="Author Name" value={form.author_name} onChange={(e) => setForm({ ...form, author_name: e.target.value })} className="admin-input" />
            </label>
            <label className="admin-label">
              <span>{tr('Status', 'Status')}</span>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="admin-input">
                <option value="draft">{tr('Draft', 'Draft')}</option>
                <option value="published">{tr('Publish Now', 'Publish பண்ணு')}</option>
              </select>
            </label>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input placeholder={tr('Featured Image URL', 'Image URL')} value={form.featured_image_url} onChange={(e) => setForm({ ...form, featured_image_url: e.target.value })} className="admin-input min-w-[200px] flex-1" />
          <button type="button" onClick={() => setPickerOpen(true)} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700">
            <ImageIcon className="h-4 w-4 text-brand-600" />
            <span>{tr('Select Featured Image', 'போட்டோ எடு')}</span>
          </button>
          <button
            type="submit"
            disabled={!isDirty}
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Plus className="h-4 w-4" />
            <span>{editingId ? tr('Save Article', 'Save பண்ணு') : tr('Create Article', 'Article போடு')}</span>
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
          <button type="button" onClick={() => load(true)} className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white">
            {tr('Retry', 'Retry பண்ணு')}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((p) => (
            <div key={p.id} className="admin-card flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-900">{p.title_en}</h3>
                <p className="text-xs text-slate-500">/{p.slug} • {p.author_name}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleStatus(p)}
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    p.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {p.status}
                </button>
                <button type="button" onClick={() => setHistoryId(p.id)} className="rounded-lg border border-slate-200 p-2 text-slate-600">
                  <History className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const nextForm = {
                      title_en: p.title_en, title_ta: p.title_ta, slug: p.slug,
                      category_id: p.category_id || '', excerpt_en: p.excerpt_en, excerpt_ta: p.excerpt_ta,
                      content_en: p.content_en, content_ta: p.content_ta,
                      featured_image_url: p.featured_image_url || '',
                      featured_image_alt_en: p.featured_image_alt_en || '',
                      featured_image_alt_ta: p.featured_image_alt_ta || '',
                      tags: (p.tags || []).join(', '), author_name: p.author_name,
                      reading_time_minutes: p.reading_time_minutes,
                      status: p.status || 'draft'
                    };
                    setEditingId(p.id);
                    setForm(nextForm);
                    setSavedSnapshot(JSON.stringify(nextForm));
                  }}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700"
                >
                  {tr('Edit', 'Edit')}
                </button>
                <button type="button" onClick={() => deletePost(p.id)} className="rounded-lg p-2 text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {previewPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-8 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-4">
              <span className="text-xs font-bold uppercase text-brand-600">Live Blog Preview</span>
              <button type="button" onClick={() => setPreviewPost(null)}><X className="h-5 w-5" /></button>
            </div>
            {Boolean(previewPost.featured_image_url) && (
              <img src={String(previewPost.featured_image_url)} alt="" className="mt-4 h-60 w-full rounded-2xl object-cover" />
            )}
            <h2 className="mt-5 text-2xl font-extrabold text-slate-900">{String(previewPost.title_en || '')}</h2>
            <p className="mt-2 text-sm font-medium text-slate-500">{String(previewPost.excerpt_en || '')}</p>
            <div className="mt-5 whitespace-pre-line text-sm leading-relaxed text-slate-700">{String(previewPost.content_en || '')}</div>
          </div>
        </div>
      )}

      <MediaPickerModal
        open={pickerOpen}
        bucket="blogs"
        folderName="articles"
        onClose={() => setPickerOpen(false)}
        onSelect={(url) => {
          setForm((prev) => ({ ...prev, featured_image_url: url }));
          setPickerOpen(false);
        }}
      />

      {historyId && (
        <VersionHistoryModal
          open={true}
          entityType="blog_posts"
          entityId={historyId}
          onClose={() => setHistoryId(null)}
          onRestored={() => {
            onNotify('Blog post version restored.');
            load();
          }}
        />
      )}
    </div>
  );
}
