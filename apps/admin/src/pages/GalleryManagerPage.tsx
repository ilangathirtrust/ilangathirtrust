import { useEffect, useState } from 'react';
import { ArrowLeft, Film, FolderOpen, Plus, Trash2, Upload } from 'lucide-react';
import type { GalleryFolder, GalleryItem } from '@ilangathir/shared';
import { adminApi, uploadMediaWithProgress } from '../lib/api';

export function GalleryManagerPage({ onNotify }: { onNotify: (msg: string, isErr?: boolean) => void }) {
  const [folders, setFolders] = useState<GalleryFolder[]>([]);
  const [activeFolder, setActiveFolder] = useState<GalleryFolder | null>(null);
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const [newFolder, setNewFolder] = useState({
    title_en: '',
    title_ta: '',
    category: 'Events',
    event_date: '',
    location_en: '',
    location_ta: '',
    description_en: '',
    description_ta: '',
    status: 'published'
  });

  const loadFolders = () => {
    setLoading(true);
    adminApi<GalleryFolder[]>('/gallery/folders')
      .then(setFolders)
      .catch((e) => onNotify(e.message, true))
      .finally(() => setLoading(false));
  };

  useEffect(loadFolders, []);

  function openFolder(folder: GalleryFolder) {
    setActiveFolder(folder);
    adminApi<GalleryItem[]>(`/gallery/folders/${folder.id}/items`)
      .then(setItems)
      .catch((e) => onNotify(e.message, true));
  }

  async function handleCreateFolder(e: React.FormEvent) {
    e.preventDefault();
    try {
      await adminApi('/gallery/folders', { method: 'POST', body: JSON.stringify(newFolder) });
      setNewFolder({
        title_en: '', title_ta: '', category: 'Events', event_date: '',
        location_en: '', location_ta: '', description_en: '', description_ta: '', status: 'published'
      });
      onNotify('Gallery folder created.');
      loadFolders();
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Failed to create folder.', true);
    }
  }

  async function handleDeleteFolder(id: string) {
    if (!confirm('Delete this gallery folder and all item links inside it?')) return;
    await adminApi(`/gallery/folders/${id}`, { method: 'DELETE' });
    onNotify('Gallery folder deleted.');
    loadFolders();
  }

  async function handleUploadToFolder(files: FileList | null) {
    if (!files?.length || !activeFolder) return;
    setUploading(true);
    setProgress(0);
    const fd = new FormData();
    fd.append('bucket', 'gallery');
    fd.append('folder_name', activeFolder.slug);
    fd.append('category', activeFolder.category);
    for (const file of Array.from(files)) {
      fd.append('files', file);
    }

    try {
      const uploaded = await uploadMediaWithProgress(fd, setProgress);
      const galleryRows = uploaded.items.map((asset, idx) => ({
        folder_id: activeFolder.id,
        media_asset_id: asset.id,
        media_type: asset.media_type === 'video' ? 'video' : 'image',
        file_url: asset.public_url,
        storage_bucket: asset.bucket,
        storage_path: asset.storage_path,
        title_en: asset.title_en,
        title_ta: asset.title_ta || asset.title_en,
        alt_text_en: asset.alt_text_en,
        sort_order: items.length + idx + 1
      }));
      await adminApi('/gallery/items', { method: 'POST', body: JSON.stringify({ items: galleryRows }) });
      onNotify(`Added ${galleryRows.length} item(s) to "${activeFolder.title_en}".`);
      openFolder(activeFolder);
      loadFolders();
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Upload failed.', true);
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteItem(id: string) {
    if (!activeFolder || !confirm('Remove this item from folder?')) return;
    await adminApi(`/gallery/items/${id}`, { method: 'DELETE' });
    openFolder(activeFolder);
    loadFolders();
  }

  if (activeFolder) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setActiveFolder(null)}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-600 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to all gallery folders</span>
          </button>
          <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">
            {activeFolder.title_en} ({items.length} items)
          </span>
        </div>

        <label className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-brand-300 bg-white p-8 text-center transition hover:border-brand-600">
          <Upload className="h-8 w-8 text-brand-600" />
          <span className="mt-2 text-sm font-bold text-slate-900">
            {uploading ? `Uploading media… ${progress}%` : `Upload images & videos directly into "${activeFolder.title_en}"`}
          </span>
          <input
            type="file"
            multiple
            accept="image/*,video/mp4,video/webm"
            disabled={uploading}
            className="hidden"
            onChange={(e) => handleUploadToFolder(e.target.files)}
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <div key={item.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="relative h-44 bg-slate-100">
                {item.media_type === 'video' ? (
                  <div className="flex h-full items-center justify-center bg-slate-900 text-white">
                    <Film className="h-9 w-9" />
                  </div>
                ) : (
                  <img src={item.file_url} alt={item.title_en} className="h-full w-full object-cover" />
                )}
              </div>
              <div className="flex items-center justify-between p-3 text-xs">
                <span className="truncate font-semibold text-slate-800">{item.title_en || 'Untitled'}</span>
                <button type="button" onClick={() => handleDeleteItem(item.id)} className="text-red-600 hover:text-red-700">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleCreateFolder} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Create Event / Programme Gallery Folder</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <input required placeholder="Folder Title (EN)" value={newFolder.title_en} onChange={(e) => setNewFolder({ ...newFolder, title_en: e.target.value })} className="admin-input" />
          <input required placeholder="Folder Title (TA)" value={newFolder.title_ta} onChange={(e) => setNewFolder({ ...newFolder, title_ta: e.target.value })} className="admin-input" />
          <input placeholder="Category (e.g. Health Camp, Education)" value={newFolder.category} onChange={(e) => setNewFolder({ ...newFolder, category: e.target.value })} className="admin-input" />
          <input type="date" value={newFolder.event_date} onChange={(e) => setNewFolder({ ...newFolder, event_date: e.target.value })} className="admin-input" />
          <input placeholder="Location (EN)" value={newFolder.location_en} onChange={(e) => setNewFolder({ ...newFolder, location_en: e.target.value })} className="admin-input" />
          <input placeholder="Location (TA)" value={newFolder.location_ta} onChange={(e) => setNewFolder({ ...newFolder, location_ta: e.target.value })} className="admin-input" />
          <textarea placeholder="Description (EN)" rows={2} value={newFolder.description_en} onChange={(e) => setNewFolder({ ...newFolder, description_en: e.target.value })} className="admin-input sm:col-span-2" />
          <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700">
            <Plus className="h-4 w-4" />
            <span>Create Folder</span>
          </button>
        </div>
      </form>

      {loading ? (
        <div className="h-48 animate-pulse rounded-2xl bg-slate-200" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {folders.map((f) => (
            <div key={f.id} className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <FolderOpen className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-bold text-slate-900">{f.title_en}</h3>
                    <p className="text-xs text-slate-500">{f.category} • {f.event_date || 'No date'}</p>
                  </div>
                </div>
                <button type="button" onClick={() => handleDeleteFolder(f.id)} className="text-red-600 hover:text-red-700">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-3 text-xs text-slate-600">{f.item_count} media item(s)</p>
              <button
                type="button"
                onClick={() => openFolder(f)}
                className="mt-4 w-full rounded-xl bg-brand-50 py-2.5 text-xs font-bold text-brand-700 transition hover:bg-brand-100"
              >
                Open Folder & Manage Media →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
