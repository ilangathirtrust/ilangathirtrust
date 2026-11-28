import { useEffect, useState } from 'react';
import { FileText, Film, RefreshCw, Search, Trash2, Upload } from 'lucide-react';
import { adminApi, uploadMediaWithProgress } from '../lib/api';
import { useAdminUi } from '../lib/admin-ui';
import { MediaSkeleton } from '../components/PageSkeletons';

interface MediaAsset {
  id: string;
  bucket: string;
  storage_path: string;
  public_url: string;
  folder_name: string;
  category: string;
  media_type: 'image' | 'video' | 'document';
  file_name: string;
  mime_type: string;
  file_size_bytes: number;
  title_en: string;
  title_ta: string;
  alt_text_en: string;
  alt_text_ta: string;
  description_en: string;
  created_at: string;
}

export function MediaLibraryPage({ onNotify }: { onNotify: (msg: string, isErr?: boolean) => void }) {
  const { tr } = useAdminUi();
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [folderInput, setFolderInput] = useState('general');
  const [bucketInput, setBucketInput] = useState('media');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [editing, setEditing] = useState<MediaAsset | null>(null);

  const load = (force = false) => {
    setLoading(true);
    setLoadError('');
    const q = new URLSearchParams();
    if (search) q.set('search', search);
    if (typeFilter) q.set('type', typeFilter);
    adminApi<MediaAsset[]>(`/media?${q.toString()}`, { forceRefresh: force })
      .then(setAssets)
      .catch((e) => {
        const msg = e instanceof Error ? e.message : tr('Unable to load media.', 'மீடியா ஃபைல்கள் லோடு ஆகலைங்க.');
        setLoadError(msg);
        onNotify(msg, true);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(false);
  }, [typeFilter]);

  async function handleMultiUpload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setProgress(0);
    const fd = new FormData();
    fd.append('bucket', bucketInput);
    fd.append('folder_name', folderInput || 'general');
    for (const file of Array.from(files)) {
      fd.append('files', file);
    }

    try {
      const res = await uploadMediaWithProgress(fd, setProgress);
      onNotify(
        tr(
          `Uploaded ${res.items.length} file(s) to Supabase Storage.`,
          `${res.items.length} ஃபைல் அப்லோட் ஆயிடுச்சுங்க.`
        )
      );
      load(true);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : tr('Upload failed.', 'அப்லோட் ஆகலைங்க.'), true);
    } finally {
      setUploading(false);
    }
  }

  async function handleSaveMeta(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    try {
      await adminApi(`/media/${editing.id}`, {
        method: 'PUT',
        body: JSON.stringify(editing)
      });
      onNotify(tr('Media metadata updated.', 'ஃபைல் விவரம் சேவ் ஆச்சுங்க.'));
      setEditing(null);
      load(true);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : tr('Update failed.', 'மாத்த முடியலைங்க.'), true);
    }
  }

  async function handleReplaceFile(id: string, file: File | undefined) {
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      await adminApi(`/media/${id}`, { method: 'PUT', body: fd });
      onNotify(tr('Existing file replaced in Supabase Storage.', 'பழைய ஃபைல் பதிலா புது ஃபைல் வச்சாச்சுங்க.'));
      load(true);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : tr('Replace failed.', 'ஃபைல் மாத்த முடியலைங்க.'), true);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(tr('Delete this file permanently from Supabase Storage?', 'இந்த ஃபைலை நிரந்தரமா நீக்கலாமா?'))) return;
    try {
      await adminApi(`/media/${id}`, { method: 'DELETE' });
      onNotify(tr('File deleted from storage.', 'ஃபைல் நீக்கியாச்சுங்க.'));
      load(true);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : tr('Delete failed.', 'நீக்க முடியலைங்க.'), true);
    }
  }

  if (loading && assets.length === 0) {
    return <MediaSkeleton />;
  }

  return (
    <div className="space-y-4">
      {/* Multi-file Upload Box */}
      <div className="admin-card space-y-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <select value={bucketInput} onChange={(e) => setBucketInput(e.target.value)} className="admin-input w-full sm:w-44">
            <option value="media">{tr('Bucket: media', 'பிரிவு: மீடியா')}</option>
            <option value="gallery">{tr('Bucket: gallery', 'பிரிவு: கேலரி')}</option>
            <option value="events">{tr('Bucket: events', 'பிரிவு: ஈவென்ட்ஸ்')}</option>
            <option value="blogs">{tr('Bucket: blogs', 'பிரிவு: பிளாக்')}</option>
            <option value="documents">{tr('Bucket: documents', 'பிரிவு: ஆவணங்கள்')}</option>
          </select>
          <input
            value={folderInput}
            onChange={(e) => setFolderInput(e.target.value)}
            placeholder={tr('Folder name (e.g. banners)', 'ஃபோல்டர் பெயர் (உதா: banners)')}
            className="admin-input w-full sm:w-56"
          />
        </div>

        <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-blue-400/50 bg-brand-50/40 p-6 text-center transition hover:border-blue-600 sm:p-7">
          <Upload className="h-7 w-7 text-blue-600" />
          <span className="mt-2 text-sm font-bold text-slate-900">
            {uploading
              ? tr(`Uploading to Storage… ${progress}%`, `அப்லோட் ஆகுதுங்க… ${progress}%`)
              : tr('Drop or select multiple images, videos, or PDFs', 'படம், வீடியோ, PDF எல்லாத்தையும் இங்க தேர்ந்தெடுத்து அப்லோட் பண்ணுங்க')}
          </span>
          <span className="mt-1 text-xs text-slate-500">
            {tr('Supports simultaneous multi-file upload (JPG, PNG, WEBP, AVIF, MP4, WEBM, PDF)', 'ஒரே நேரத்துல பல ஃபைல்களை அப்லோட் பண்ணலாம்')}
          </span>
          <input
            type="file"
            multiple
            accept="image/*,video/mp4,video/webm,application/pdf"
            disabled={uploading}
            className="hidden"
            onChange={(e) => handleMultiUpload(e.target.files)}
          />
        </label>
      </div>

      {/* Filters */}
      <div className="admin-card flex flex-wrap items-center gap-2.5 p-3.5">
        <div className="relative min-w-0 w-full sm:w-auto sm:min-w-[200px] sm:flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load(true)}
            placeholder={tr('Search filename, title, alt text…', 'ஃபைல் பெயர் இல்ல தலைப்பை தேடுங்க…')}
            className="admin-input pl-9"
          />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="admin-input w-full sm:w-40">
          <option value="">{tr('All types', 'எல்லா வகையும்')}</option>
          <option value="image">{tr('Images', 'படங்கள்')}</option>
          <option value="video">{tr('Videos', 'வீடியோக்கள்')}</option>
          <option value="document">{tr('Documents', 'ஆவணங்கள்')}</option>
        </select>
        <button type="button" onClick={() => load(true)} className="admin-btn-primary py-2.5 px-4">
          {tr('Filter', 'தேடு')}
        </button>
      </div>

      {/* Asset Grid */}
      {loadError ? (
        <div className="admin-card flex flex-wrap items-center justify-between gap-3 border-red-200 bg-red-50 text-sm font-semibold text-red-800">
          <span>{loadError}</span>
          <button type="button" onClick={() => load(true)} className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white">
            {tr('Retry', 'மறுபடியும் முயற்சி பண்ணு')}
          </button>
        </div>
      ) : assets.length === 0 ? (
        <div className="admin-card border-dashed py-10 text-center text-sm text-slate-500">
          {tr('No media files found matching your search.', 'தேடுன ஃபைல் எதுவும் கிடைக்கலைங்க.')}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {assets.map((a) => (
            <div key={a.id} className="admin-card flex flex-col overflow-hidden p-0">
              <div className="relative h-40 bg-slate-100">
                {a.media_type === 'video' ? (
                  <div className="flex h-full items-center justify-center bg-slate-900 text-white">
                    <Film className="h-9 w-9" />
                  </div>
                ) : a.media_type === 'document' ? (
                  <div className="flex h-full items-center justify-center bg-amber-50 text-amber-700">
                    <FileText className="h-9 w-9" />
                  </div>
                ) : (
                  <img src={a.public_url} alt={a.alt_text_en || a.file_name} className="h-full w-full object-cover" />
                )}
                <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white">
                  {a.bucket}/{a.folder_name}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-3 text-xs">
                <p className="truncate font-bold text-slate-900">{a.title_en || a.file_name}</p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  {(a.file_size_bytes / 1024).toFixed(1)} KB • {new Date(a.created_at).toLocaleDateString()}
                </p>
                <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
                  <button type="button" onClick={() => setEditing(a)} className="font-bold text-blue-600 hover:underline">
                    {tr('Edit Meta', 'விவரம் மாத்து')}
                  </button>
                  <label className="inline-flex cursor-pointer items-center gap-1 font-semibold text-slate-600 hover:text-slate-900">
                    <RefreshCw className="h-3 w-3" />
                    <span>{tr('Replace', 'மாத்து')}</span>
                    <input type="file" className="hidden" onChange={(e) => handleReplaceFile(a.id, e.target.files?.[0])} />
                  </label>
                  <button type="button" onClick={() => handleDelete(a.id)} className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <form onSubmit={handleSaveMeta} className="w-full max-w-lg space-y-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-[#262A34] dark:bg-[#161920]">
            <h3 className="text-base font-bold text-slate-900">{tr('Edit Media Details', 'மீடியா விவரத்தை மாத்து')}</h3>
            <label className="admin-label">
              <span>{tr('Title (EN)', 'தலைப்பு (ஆங்கிலம்)')}</span>
              <input value={editing.title_en} onChange={(e) => setEditing({ ...editing, title_en: e.target.value })} className="admin-input" />
            </label>
            <label className="admin-label">
              <span>{tr('Title (TA)', 'தலைப்பு (தமிழ்)')}</span>
              <input value={editing.title_ta} onChange={(e) => setEditing({ ...editing, title_ta: e.target.value })} className="admin-input" />
            </label>
            <label className="admin-label">
              <span>{tr('Alt Text (EN)', 'ஆல்ட் டெக்ஸ்ட் (ஆங்கிலம்)')}</span>
              <input value={editing.alt_text_en} onChange={(e) => setEditing({ ...editing, alt_text_en: e.target.value })} className="admin-input" />
            </label>
            <label className="admin-label">
              <span>{tr('Alt Text (TA)', 'ஆல்ட் டெக்ஸ்ட் (தமிழ்)')}</span>
              <input value={editing.alt_text_ta} onChange={(e) => setEditing({ ...editing, alt_text_ta: e.target.value })} className="admin-input" />
            </label>
            <label className="admin-label">
              <span>{tr('Description', 'விவரம்')}</span>
              <textarea rows={2} value={editing.description_en} onChange={(e) => setEditing({ ...editing, description_en: e.target.value })} className="admin-input" />
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditing(null)} className="admin-btn-secondary">
                {tr('Cancel', 'வேண்டாம்')}
              </button>
              <button type="submit" className="admin-btn-primary">
                {tr('Save Metadata', 'மாற்றத்தை சேமி')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
