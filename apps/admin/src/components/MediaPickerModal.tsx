import { useEffect, useState } from 'react';
import { Check, Loader2, Upload, X } from 'lucide-react';
import { adminApi, uploadMediaWithProgress } from '../lib/api';
import { useAdminUi } from '../lib/admin-ui';

interface MediaAsset {
  id: string;
  public_url: string;
  file_name: string;
  media_type: 'image' | 'video' | 'document';
  folder_name: string;
}

export function MediaPickerModal({
  open,
  bucket = 'media',
  folderName = 'general',
  onClose,
  onSelect
}: {
  open: boolean;
  bucket?: string;
  folderName?: string;
  onClose: () => void;
  onSelect: (url: string, asset?: MediaAsset) => void;
}) {
  const { tr } = useAdminUi();
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError('');
    adminApi<MediaAsset[]>('/media')
      .then((list) => setAssets(list.filter((a) => a.media_type !== 'document')))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  async function handleUpload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setProgress(0);
    setError('');
    const fd = new FormData();
    fd.append('bucket', bucket);
    fd.append('folder_name', folderName);
    for (const f of Array.from(files)) {
      fd.append('files', f);
    }

    try {
      const res = await uploadMediaWithProgress(fd, setProgress);
      const uploaded = res.items as unknown as MediaAsset[];
      setAssets((prev) => [...uploaded, ...prev]);
      if (uploaded[0]) {
        onSelect(uploaded[0].public_url, uploaded[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : tr('Upload failed.', 'அப்லோட் ஆகலைங்க.'));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-[#262A34] dark:bg-[#161920]">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h3 className="text-base font-bold text-slate-900">
            {tr('Select or Upload Media', 'படம் அல்லது வீடியோ எடுங்க')}
          </h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-blue-400/50 bg-white p-4 text-center transition hover:border-blue-600">
            <Upload className="h-6 w-6 text-blue-600" />
            <span className="mt-2 text-xs font-bold text-slate-800">
              {uploading
                ? tr(`Uploading… ${progress}%`, `அப்லோட் ஆகுது… ${progress}%`)
                : tr('Click to upload new image or video', 'புது படம் இல்ல வீடியோ அப்லோட் பண்ண க்ளிக் பண்ணுங்க')}
            </span>
            <span className="text-[11px] text-slate-500">JPG, PNG, WEBP, AVIF, MP4, WEBM</span>
            <input
              type="file"
              accept="image/*,video/mp4,video/webm"
              className="hidden"
              disabled={uploading}
              onChange={(e) => handleUpload(e.target.files)}
            />
          </label>
          {error && <p className="mt-2 text-xs font-semibold text-red-600">{error}</p>}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-xl admin-skeleton" />
              ))}
            </div>
          ) : assets.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">
              {tr('No media files uploaded yet.', 'இன்னும் எந்த ஃபைலும் அப்லோட் பண்ணலீங்க.')}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {assets.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => onSelect(asset.public_url, asset)}
                  className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100 text-left transition hover:border-blue-600 hover:ring-2 hover:ring-blue-600/30"
                >
                  {asset.media_type === 'video' ? (
                    <video src={asset.public_url} className="h-full w-full object-cover" />
                  ) : (
                    <img src={asset.public_url} alt={asset.file_name} className="h-full w-full object-cover" />
                  )}
                  <span className="absolute right-2 top-2 hidden h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white group-hover:flex">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <div className="absolute inset-x-0 bottom-0 truncate bg-black/65 px-2 py-1 text-[10px] font-medium text-white">
                    {asset.file_name}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
