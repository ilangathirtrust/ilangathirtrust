import { useEffect, useState } from 'react';
import { FileText, Film, RefreshCw, Search, Trash2, Upload } from 'lucide-react';
import { adminApi, uploadMediaWithProgress } from '../lib/api';

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
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [folderInput, setFolderInput] = useState('general');
  const [bucketInput, setBucketInput] = useState('media');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [editing, setEditing] = useState<MediaAsset | null>(null);

  const load = () => {
    setLoading(true);
    const q = new URLSearchParams();
    if (search) q.set('search', search);
    if (typeFilter) q.set('type', typeFilter);
    adminApi<MediaAsset[]>(`/media?${q.toString()}`)
      .then(setAssets)
      .catch((e) => onNotify(e.message, true))
      .finally(() => setLoading(false));
  };

  useEffect(load, [typeFilter]);

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
      onNotify(`Uploaded ${res.items.length} file(s) to Supabase Storage.`);
      load();
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Upload failed.', true);
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
      onNotify('Media metadata updated.');
      setEditing(null);
      load();
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Update failed.', true);
    }
  }

  async function handleReplaceFile(id: string, file: File | undefined) {
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      await adminApi(`/media/${id}`, { method: 'PUT', body: fd });
      onNotify('Existing file replaced in Supabase Storage.');
      load();
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Replace failed.', true);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this file permanently from Supabase Storage?')) return;
    try {
      await adminApi(`/media/${id}`, { method: 'DELETE' });
      onNotify('File deleted from storage.');
      load();
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Delete failed.', true);
    }
  }

  return (
    <div className="space-y-6">
      {/* Multi-file Upload Box */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <select value={bucketInput} onChange={(e) => setBucketInput(e.target.value)} className="admin-input w-40">
            <option value="media">Bucket: media</option>
            <option value="gallery">Bucket: gallery</option>
            <option value="events">Bucket: events</option>
            <option value="blogs">Bucket: blogs</option>
            <option value="documents">Bucket: documents</option>
          </select>
          <input
            value={folderInput}
            onChange={(e) => setFolderInput(e.target.value)}
            placeholder="Folder name (e.g. banners)"
            className="admin-input w-56"
          />
        </div>

        <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50/40 p-8 text-center transition hover:border-brand-600">
          <Upload className="h-8 w-8 text-brand-600" />
          <span className="mt-2 text-sm font-bold text-slate-900">
            {uploading ? `Uploading to Supabase Storage… ${progress}%` : 'Drop or select multiple images, videos, or PDFs'}
          </span>
          <span className="mt-1 text-xs text-slate-500">Supports simultaneous multi-file upload (JPG, PNG, WEBP, AVIF, MP4, WEBM, PDF)</span>
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
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
            placeholder="Search filename, title, alt text…"
            className="admin-input pl-9"
          />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="admin-input w-40">
          <option value="">All types</option>
          <option value="image">Images</option>
          <option value="video">Videos</option>
          <option value="document">Documents</option>
        </select>
        <button type="button" onClick={load} className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white">
          Filter
        </button>
      </div>

      {/* Asset Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-52 animate-pulse rounded-2xl bg-slate-200" />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {assets.map((a) => (
            <div key={a.id} className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="relative h-44 bg-slate-100">
                {a.media_type === 'video' ? (
                  <div className="flex h-full items-center justify-center bg-slate-900 text-white">
                    <Film className="h-10 w-10" />
                  </div>
                ) : a.media_type === 'document' ? (
                  <div className="flex h-full items-center justify-center bg-amber-50 text-amber-700">
                    <FileText className="h-10 w-10" />
                  </div>
                ) : (
                  <img src={a.public_url} alt={a.alt_text_en || a.file_name} className="h-full w-full object-cover" />
                )}
                <span className="absolute left-2.5 top-2.5 rounded-full bg-black/70 px-2.5 py-0.5 text-[10px] font-bold text-white">
                  {a.bucket}/{a.folder_name}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-3.5 text-xs">
                <p className="truncate font-bold text-slate-900">{a.title_en || a.file_name}</p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  {(a.file_size_bytes / 1024).toFixed(1)} KB • {new Date(a.created_at).toLocaleDateString()}
                </p>
                <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <button type="button" onClick={() => setEditing(a)} className="font-bold text-brand-600 hover:underline">
                    Edit Meta
                  </button>
                  <label className="cursor-pointer inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-900">
                    <RefreshCw className="h-3 w-3" />
                    <span>Replace</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <form onSubmit={handleSaveMeta} className="w-full max-w-lg space-y-4 rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Edit Media Details</h3>
            <label className="admin-label">
              <span>Title (EN)</span>
              <input value={editing.title_en} onChange={(e) => setEditing({ ...editing, title_en: e.target.value })} className="admin-input" />
            </label>
            <label className="admin-label">
              <span>Title (TA)</span>
              <input value={editing.title_ta} onChange={(e) => setEditing({ ...editing, title_ta: e.target.value })} className="admin-input" />
            </label>
            <label className="admin-label">
              <span>Alt Text (EN)</span>
              <input value={editing.alt_text_en} onChange={(e) => setEditing({ ...editing, alt_text_en: e.target.value })} className="admin-input" />
            </label>
            <label className="admin-label">
              <span>Alt Text (TA)</span>
              <input value={editing.alt_text_ta} onChange={(e) => setEditing({ ...editing, alt_text_ta: e.target.value })} className="admin-input" />
            </label>
            <label className="admin-label">
              <span>Description</span>
              <textarea rows={2} value={editing.description_en} onChange={(e) => setEditing({ ...editing, description_en: e.target.value })} className="admin-input" />
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditing(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700">
                Cancel
              </button>
              <button type="submit" className="rounded-xl bg-brand-600 px-5 py-2 text-xs font-bold text-white">
                Save Metadata
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
