import { useEffect, useState } from 'react';
import { ArrowLeft, Film, FolderOpen, Plus, Trash2, Upload } from 'lucide-react';
import type { GalleryFolder, GalleryItem } from '@ilangathir/shared';
import { adminApi, uploadMediaWithProgress } from '../lib/api';
import { useAdminUi } from '../lib/admin-ui';
import { GallerySkeleton } from '../components/PageSkeletons';

export function GalleryManagerPage({ onNotify }: { onNotify: (msg: string, isErr?: boolean) => void }) {
  const { tr } = useAdminUi();
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
      onNotify(tr('Gallery folder created.', 'புது கேலரி ஃபோல்டர் உருவாக்கியாச்சுங்க.'));
      loadFolders();
    } catch (err) {
      onNotify(err instanceof Error ? err.message : tr('Failed to create folder.', 'ஃபோல்டர் உருவாக்க முடியலைங்க.'), true);
    }
  }

  async function handleDeleteFolder(id: string) {
    if (!confirm(tr('Delete this gallery folder and all item links inside it?', 'இந்த கேலரி ஃபோல்டரையும் உள்ள உள்ள படங்களையும் நீக்கலாமா?'))) return;
    await adminApi(`/gallery/folders/${id}`, { method: 'DELETE' });
    onNotify(tr('Gallery folder deleted.', 'கேலரி ஃபோல்டர் நீக்கியாச்சுங்க.'));
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
      onNotify(
        tr(
          `Added ${galleryRows.length} item(s) to "${activeFolder.title_en}".`,
          `"${activeFolder.title_en}" ஃபோல்டர்ல ${galleryRows.length} ஃபைல் சேர்த்தாச்சுங்க.`
        )
      );
      openFolder(activeFolder);
      loadFolders();
    } catch (err) {
      onNotify(err instanceof Error ? err.message : tr('Upload failed.', 'அப்லோட் ஆகலைங்க.'), true);
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteItem(id: string) {
    if (!activeFolder || !confirm(tr('Remove this item from folder?', 'இந்த ஃபைலை ஃபோல்டரிலிருந்து நீக்கலாமா?'))) return;
    await adminApi(`/gallery/items/${id}`, { method: 'DELETE' });
    openFolder(activeFolder);
    loadFolders();
  }

  if (activeFolder) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setActiveFolder(null)}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{tr('Back to all gallery folders', 'எல்லா ஃபோல்டர்களுக்கும் திரும்பு')}</span>
          </button>
          <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">
            {activeFolder.title_en} ({items.length} {tr('items', 'ஃபைல்கள்')})
          </span>
        </div>

        <label className="admin-card flex cursor-pointer flex-col items-center justify-center border-2 border-dashed border-blue-400/50 p-6 text-center transition hover:border-blue-600 sm:p-8">
          <Upload className="h-7 w-7 text-blue-600" />
          <span className="mt-2 text-sm font-bold text-slate-900">
            {uploading
              ? tr(`Uploading media… ${progress}%`, `அப்லோட் ஆகுதுங்க… ${progress}%`)
              : tr(`Upload images & videos into "${activeFolder.title_en}"`, `"${activeFolder.title_en}" உள்ள போட்டோ, வீடியோ அப்லோட் பண்ணுங்க`)}
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

        {items.length === 0 ? (
          <div className="admin-card border-dashed py-10 text-center text-sm text-slate-500">
            {tr('This folder has no photos or videos yet.', 'இந்த ஃபோல்டர்ல இன்னும் எந்த போட்டோவும் இல்லீங்க.')}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((item) => (
              <div key={item.id} className="admin-card overflow-hidden p-0">
                <div className="relative h-40 bg-slate-100">
                  {item.media_type === 'video' ? (
                    <div className="flex h-full items-center justify-center bg-slate-900 text-white">
                      <Film className="h-8 w-8" />
                    </div>
                  ) : (
                    <img src={item.file_url} alt={item.title_en} className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="flex items-center justify-between p-3 text-xs">
                  <span className="truncate font-semibold text-slate-800">{item.title_en || tr('Untitled', 'பெயர் இல்லை')}</span>
                  <button type="button" onClick={() => handleDeleteItem(item.id)} className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (loading && folders.length === 0) {
    return <GallerySkeleton />;
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleCreateFolder} className="admin-card">
        <h2 className="text-base font-bold text-slate-900 sm:text-lg">
          {tr('Create Event / Programme Gallery Folder', 'புது கேலரி ஃபோல்டர் உருவாக்கு')}
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <label className="admin-label">
            <span>{tr('Folder Title (EN) *', 'ஃபோல்டர் பெயர் (ஆங்கிலம்) *')}</span>
            <input required placeholder={tr('Folder Title (EN)', 'பெயர் (ஆங்கிலம்)')} value={newFolder.title_en} onChange={(e) => setNewFolder({ ...newFolder, title_en: e.target.value })} className="admin-input" />
          </label>
          <label className="admin-label">
            <span>{tr('Folder Title (TA) *', 'ஃபோல்டர் பெயர் (தமிழ்) *')}</span>
            <input required placeholder={tr('Folder Title (TA)', 'பெயர் (தமிழ்)')} value={newFolder.title_ta} onChange={(e) => setNewFolder({ ...newFolder, title_ta: e.target.value })} className="admin-input" />
          </label>
          <label className="admin-label">
            <span>{tr('Category', 'பிரிவு')}</span>
            <input placeholder={tr('e.g. Health Camp, Education', 'உதா: மருத்துவ முகாம், கல்வி')} value={newFolder.category} onChange={(e) => setNewFolder({ ...newFolder, category: e.target.value })} className="admin-input" />
          </label>
          <label className="admin-label">
            <span>{tr('Event Date', 'தேதி')}</span>
            <input type="date" value={newFolder.event_date} onChange={(e) => setNewFolder({ ...newFolder, event_date: e.target.value })} className="admin-input" />
          </label>
          <label className="admin-label">
            <span>{tr('Location (EN)', 'இடம் (ஆங்கிலம்)')}</span>
            <input placeholder={tr('Location (EN)', 'இடம் (ஆங்கிலம்)')} value={newFolder.location_en} onChange={(e) => setNewFolder({ ...newFolder, location_en: e.target.value })} className="admin-input" />
          </label>
          <label className="admin-label">
            <span>{tr('Location (TA)', 'இடம் (தமிழ்)')}</span>
            <input placeholder={tr('Location (TA)', 'இடம் (தமிழ்)')} value={newFolder.location_ta} onChange={(e) => setNewFolder({ ...newFolder, location_ta: e.target.value })} className="admin-input" />
          </label>
          <label className="admin-label sm:col-span-2">
            <span>{tr('Description (EN)', 'விவரம்')}</span>
            <textarea placeholder={tr('Description (EN)', 'சுருக்கமான விவரம்')} rows={2} value={newFolder.description_en} onChange={(e) => setNewFolder({ ...newFolder, description_en: e.target.value })} className="admin-input" />
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={!newFolder.title_en.trim() || !newFolder.title_ta.trim()}
              className="admin-btn-primary w-full py-2.5"
            >
              <Plus className="h-4 w-4" />
              <span>{tr('Create Folder', 'ஃபோல்டர் உருவாக்கு')}</span>
            </button>
          </div>
        </div>
      </form>

      {folders.length === 0 ? (
        <div className="admin-card border-dashed py-10 text-center text-sm text-slate-500">
          {tr('No gallery folders created yet.', 'இன்னும் எந்த கேலரி ஃபோல்டரும் இல்லீங்க.')}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {folders.map((f) => (
            <div key={f.id} className="admin-card flex flex-col justify-between overflow-hidden p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                    <FolderOpen className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate font-bold text-slate-900">{f.title_en}</h3>
                    <p className="text-xs text-slate-500">{f.category} • {f.event_date || tr('No date', 'தேதி இல்லை')}</p>
                  </div>
                </div>
                <button type="button" onClick={() => handleDeleteFolder(f.id)} className="shrink-0 text-red-600 hover:text-red-700">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-3 text-xs text-slate-500">{f.item_count} {tr('media item(s)', 'ஃபைல்கள்')}</p>
              <button
                type="button"
                onClick={() => openFolder(f)}
                className="mt-3 w-full rounded-xl bg-brand-50 py-2 text-xs font-bold text-brand-700 transition hover:opacity-90"
              >
                {tr('Open Folder & Manage Media →', 'திறந்து போட்டோ போடு →')}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
