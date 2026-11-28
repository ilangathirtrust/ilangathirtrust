import { useEffect, useState } from 'react';
import { Eye, History, Image as ImageIcon, Plus, Trash2, X } from 'lucide-react';
import type { BlogCategory, BlogPost } from '@ilangathir/shared';
import { adminApi } from '../lib/api';
import { useAdminUi } from '../lib/admin-ui';
import { MediaPickerModal } from '../components/MediaPickerModal';
import { VersionHistoryModal } from '../components/VersionHistoryModal';
import { BlogSkeleton } from '../components/PageSkeletons';

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
        const msg = e instanceof Error ? e.message : tr('Unable to load blog posts.', 'பிளாக் கட்டுரைகள் லோடு ஆகலைங்க.');
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
        onNotify(tr('Blog post updated.', 'பிளாக் மாற்றம் சேவ் ஆச்சுங்க.'));
      } else {
        await adminApi('/blogs', { method: 'POST', body: JSON.stringify(payload) });
        onNotify(tr('Blog post created.', 'புது பிளாக் சேர்த்தாச்சுங்க.'));
      }
      setEditingId(null);
      setForm(EMPTY_BLOG_FORM);
      load(true);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : tr('Save failed.', 'சேவ் ஆகலைங்க.'), true);
    }
  }

  async function toggleStatus(post: BlogPost) {
    const next = post.status === 'published' ? 'draft' : 'published';
    await adminApi(`/blogs/${post.id}`, { method: 'PUT', body: JSON.stringify({ status: next }) });
    onNotify(next === 'published' ? tr('Blog published.', 'பிளாக் லைவ் ஆச்சுங்க.') : tr('Moved to draft.', 'டிராஃப்ட்ல வச்சாச்சுங்க.'));
    load(true);
  }

  async function deletePost(id: string) {
    if (!confirm(tr('Delete this blog post permanently?', 'இந்த பிளாக் கட்டுரையை நிரந்தரமா நீக்கலாமா?'))) return;
    await adminApi(`/blogs/${id}`, { method: 'DELETE' });
    onNotify(tr('Blog deleted.', 'பிளாக் நீக்கியாச்சுங்க.'));
    load(true);
  }

  if (loading && posts.length === 0) {
    return <BlogSkeleton />;
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSave} className="admin-card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-bold text-slate-900 sm:text-lg">
            {editingId ? tr('Edit Blog Post', 'பிளாக் கட்டுரையை மாத்து') : tr('Write New Blog Article', 'புது பிளாக் கட்டுரை எழுது')}
          </h2>
          <div className="flex gap-2">
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm(EMPTY_BLOG_FORM);
                }}
                className="admin-btn-secondary py-1.5 px-3"
              >
                {tr('Cancel', 'வேண்டாம்')}
              </button>
            )}
            <button
              type="button"
              onClick={() => setPreviewPost(form)}
              className="admin-btn-secondary py-1.5 px-3"
            >
              <Eye className="h-4 w-4" />
              <span>{tr('Preview', 'ப்ரீவியூ பாரு')}</span>
            </button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="admin-label">
            <span>{tr('Article Title (EN) *', 'கட்டுரை தலைப்பு (ஆங்கிலம்) *')}</span>
            <input required placeholder={tr('Article Title (EN)', 'தலைப்பு (ஆங்கிலம்)')} value={form.title_en} onChange={(e) => setForm({ ...form, title_en: e.target.value })} className="admin-input" />
          </label>
          <label className="admin-label">
            <span>{tr('Article Title (TA) *', 'கட்டுரை தலைப்பு (தமிழ்) *')}</span>
            <input required placeholder={tr('Article Title (TA)', 'தலைப்பு (தமிழ்)')} value={form.title_ta} onChange={(e) => setForm({ ...form, title_ta: e.target.value })} className="admin-input" />
          </label>
          <label className="admin-label">
            <span>{tr('URL Slug', 'ஸ்லக் லிங்க் (பெயர்)')}</span>
            <input placeholder={tr('auto-generated if empty', 'காலியா விட்டா தானா வரும்')} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="admin-input font-mono text-xs" />
          </label>
          <label className="admin-label">
            <span>{tr('Category', 'பிரிவு')}</span>
            <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="admin-input">
              <option value="">{tr('Select Category', 'பிரிவு தேர்ந்தெடு')}</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name_en} / {c.name_ta}</option>)}
            </select>
          </label>
          <label className="admin-label">
            <span>{tr('Short Excerpt (EN)', 'சுருக்கம் (ஆங்கிலம்)')}</span>
            <textarea rows={2} placeholder={tr('Short Excerpt (EN)', 'சுருக்கம் (ஆங்கிலம்)')} value={form.excerpt_en} onChange={(e) => setForm({ ...form, excerpt_en: e.target.value })} className="admin-input" />
          </label>
          <label className="admin-label">
            <span>{tr('Short Excerpt (TA)', 'சுருக்கம் (தமிழ்)')}</span>
            <textarea rows={2} placeholder={tr('Short Excerpt (TA)', 'சுருக்கம் (தமிழ்)')} value={form.excerpt_ta} onChange={(e) => setForm({ ...form, excerpt_ta: e.target.value })} className="admin-input" />
          </label>
          <label className="admin-label">
            <span>{tr('Full Article Content (EN) *', 'முழு கட்டுரை (ஆங்கிலம்) *')}</span>
            <textarea required rows={5} placeholder={tr('Full Article Content (EN)', 'முழு கட்டுரை (ஆங்கிலம்)')} value={form.content_en} onChange={(e) => setForm({ ...form, content_en: e.target.value })} className="admin-input" />
          </label>
          <label className="admin-label">
            <span>{tr('Full Article Content (TA) *', 'முழு கட்டுரை (தமிழ்) *')}</span>
            <textarea required rows={5} placeholder={tr('Full Article Content (TA)', 'முழு கட்டுரை (தமிழ்)')} value={form.content_ta} onChange={(e) => setForm({ ...form, content_ta: e.target.value })} className="admin-input" />
          </label>
          <label className="admin-label">
            <span>{tr('Tags (comma separated)', 'டேக்ஸ் (கமா போட்டு எழுதுங்க)')}</span>
            <input placeholder={tr('education, medical camp', 'கல்வி, மருத்துவ முகாம்')} value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="admin-input" />
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <label className="admin-label">
              <span>{tr('Author Name', 'எழுதியவர்')}</span>
              <input placeholder={tr('Author Name', 'எழுதியவர் பெயர்')} value={form.author_name} onChange={(e) => setForm({ ...form, author_name: e.target.value })} className="admin-input" />
            </label>
            <label className="admin-label">
              <span>{tr('Status', 'நிலை')}</span>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="admin-input">
                <option value="draft">{tr('Draft', 'டிராஃப்ட்')}</option>
                <option value="published">{tr('Publish Now', 'லைவ்ல போடு')}</option>
              </select>
            </label>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <input placeholder={tr('Featured Image URL', 'முகப்பு போட்டோ லிங்க்')} value={form.featured_image_url} onChange={(e) => setForm({ ...form, featured_image_url: e.target.value })} className="admin-input min-w-0 w-full sm:w-auto sm:min-w-[200px] sm:flex-1" />
          <button type="button" onClick={() => setPickerOpen(true)} className="admin-btn-secondary py-2.5">
            <ImageIcon className="h-4 w-4 text-blue-600" />
            <span>{tr('Select Featured Image', 'போட்டோ எடு')}</span>
          </button>
          <button
            type="submit"
            disabled={!isDirty}
            className="admin-btn-primary py-2.5 px-5"
          >
            <Plus className="h-4 w-4" />
            <span>{editingId ? tr('Save Article', 'மாற்றத்தை சேமி') : tr('Create Article', 'கட்டுரை சேர்')}</span>
          </button>
        </div>
      </form>

      {loadError ? (
        <div className="admin-card flex flex-wrap items-center justify-between gap-3 border-red-200 bg-red-50 text-sm font-semibold text-red-800">
          <span>{loadError}</span>
          <button type="button" onClick={() => load(true)} className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white">
            {tr('Retry', 'மறுபடியும் முயற்சி பண்ணு')}
          </button>
        </div>
      ) : posts.length === 0 ? (
        <div className="admin-card border-dashed py-10 text-center text-sm text-slate-500">
          {tr('No blog articles written yet.', 'இன்னும் எந்த பிளாக் கட்டுரையும் எழுதலீங்க.')}
        </div>
      ) : (
        <div className="space-y-2.5">
          {posts.map((p) => (
            <div key={p.id} className="admin-card flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-bold text-slate-900">{p.title_en}</h3>
                <p className="text-xs text-slate-500">/{p.slug} • {p.author_name}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleStatus(p)}
                  className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                    p.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {p.status === 'published' ? tr('Published', 'லைவ்') : tr('Draft', 'டிராஃப்ட்')}
                </button>
                <button type="button" onClick={() => setHistoryId(p.id)} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50">
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
                  className="admin-btn-secondary py-1.5 px-3"
                >
                  {tr('Edit', 'மாத்து')}
                </button>
                <button type="button" onClick={() => deletePost(p.id)} className="rounded-lg p-2 text-red-600 hover:bg-red-50">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {previewPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-[#262A34] dark:bg-[#161920]">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <span className="text-xs font-bold uppercase text-blue-600">{tr('Live Blog Preview', 'பிளாக் ப்ரீவியூ')}</span>
              <button type="button" onClick={() => setPreviewPost(null)}><X className="h-5 w-5" /></button>
            </div>
            {Boolean(previewPost.featured_image_url) && (
              <img src={String(previewPost.featured_image_url)} alt="" className="mt-4 h-56 w-full rounded-xl object-cover" />
            )}
            <h2 className="mt-4 text-xl font-extrabold text-slate-900">{String(previewPost.title_en || '')}</h2>
            <p className="mt-2 text-sm font-medium text-slate-500">{String(previewPost.excerpt_en || '')}</p>
            <div className="mt-4 whitespace-pre-line text-sm leading-relaxed text-slate-700">{String(previewPost.content_en || '')}</div>
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
            onNotify(tr('Blog post version restored.', 'பழைய பிளாக் வெர்ஷன் திரும்ப எடுத்தாச்சுங்க.'));
            load(true);
          }}
        />
      )}
    </div>
  );
}
