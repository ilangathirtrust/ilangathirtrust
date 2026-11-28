import { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  Globe,
  GripVertical,
  Image as ImageIcon,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  Share2,
  Trash2,
  X
} from 'lucide-react';
import {
  DEFAULT_SOCIAL_LINKS,
  LUCIDE_ICON_CDN,
  type SocialLinkItem
} from '@ilangathir/shared';
import { adminApi } from '../lib/api';
import { useAdminUi } from '../lib/admin-ui';
import { MediaPickerModal } from '../components/MediaPickerModal';

const LUCIDE_PRESETS: Array<{ label: string; icon: string }> = [
  { label: 'Instagram', icon: `${LUCIDE_ICON_CDN}/instagram.svg` },
  { label: 'WhatsApp', icon: `${LUCIDE_ICON_CDN}/message-circle.svg` },
  { label: 'YouTube', icon: `${LUCIDE_ICON_CDN}/youtube.svg` },
  { label: 'Facebook', icon: `${LUCIDE_ICON_CDN}/facebook.svg` },
  { label: 'X / Twitter', icon: `${LUCIDE_ICON_CDN}/twitter.svg` },
  { label: 'Threads', icon: `${LUCIDE_ICON_CDN}/at-sign.svg` },
  { label: 'LinkedIn', icon: `${LUCIDE_ICON_CDN}/linkedin.svg` },
  { label: 'Telegram', icon: `${LUCIDE_ICON_CDN}/send.svg` },
  { label: 'Website', icon: `${LUCIDE_ICON_CDN}/globe.svg` },
  { label: 'Share', icon: `${LUCIDE_ICON_CDN}/share-2.svg` },
  { label: 'Phone', icon: `${LUCIDE_ICON_CDN}/phone.svg` },
  { label: 'Email', icon: `${LUCIDE_ICON_CDN}/mail.svg` }
];

const ADMIN_BRAND_COLORS: Record<string, { bg: string; glyph: React.ReactNode }> = {
  instagram: {
    bg: 'bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white border-transparent',
    glyph: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
        <circle cx="12" cy="12" r="4.2" />
        <circle cx="17.5" cy="6.5" r="1.1" fill="currentColor" stroke="none" />
      </svg>
    )
  },
  whatsapp: {
    bg: 'bg-[#25D366] text-white border-transparent',
    glyph: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
        <path d="M12.03 2a9.97 9.97 0 0 0-8.65 14.95L2 22l5.2-1.36A9.98 9.98 0 1 0 12.03 2Zm0 18.14a8.18 8.18 0 0 1-4.17-1.14l-.3-.18-3.09.81.82-3.01-.2-.31a8.18 8.18 0 1 1 7.04 3.83Zm4.49-6.13c-.25-.12-1.46-.72-1.69-.8-.22-.08-.39-.12-.55.12-.17.25-.64.8-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.48-1.39-1.73-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.15.16-.25.25-.42.08-.16.04-.31-.02-.43-.06-.12-.55-1.33-.76-1.82-.2-.48-.4-.41-.55-.42h-.47c-.17 0-.43.06-.66.31-.22.25-.86.84-.86 2.05s.88 2.38 1 2.54c.13.17 1.74 2.66 4.22 3.73.59.25 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.46-.6 1.67-1.18.21-.58.21-1.08.15-1.18-.07-.11-.23-.17-.48-.29Z" />
      </svg>
    )
  },
  youtube: {
    bg: 'bg-[#FF0000] text-white border-transparent',
    glyph: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
        <path d="M23.1 7.1a2.95 2.95 0 0 0-2.08-2.09C19.18 4.5 12 4.5 12 4.5s-7.18 0-9.02.51A2.95 2.95 0 0 0 .9 7.1C.4 8.95.4 12 .4 12s0 3.05.5 4.9a2.95 2.95 0 0 0 2.08 2.09c1.84.51 9.02.51 9.02.51s7.18 0 9.02-.51a2.95 2.95 0 0 0 2.08-2.09c.5-1.85.5-4.9.5-4.9s0-3.05-.5-4.9ZM9.7 15.1V8.9l5.9 3.1-5.9 3.1Z" />
      </svg>
    )
  },
  facebook: {
    bg: 'bg-[#1877F2] text-white border-transparent',
    glyph: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
        <path d="M13.6 22v-8.8h2.95l.44-3.43H13.6V7.58c0-.99.28-1.67 1.7-1.67h1.81V2.84c-.31-.04-1.39-.14-2.64-.14-2.62 0-4.41 1.6-4.41 4.53v2.54H7.1v3.43h2.96V22h3.54Z" />
      </svg>
    )
  },
  x: {
    bg: 'bg-[#0F1419] text-white border-transparent',
    glyph: (
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.451-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
      </svg>
    )
  },
  threads: {
    bg: 'bg-[#101010] text-white border-transparent',
    glyph: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
        <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.781 3.631 2.695 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.96-.065-1.182.408-2.256 1.332-3.023.812-.674 1.928-1.077 3.23-1.166.93-.064 1.82-.01 2.656.144-.08-.776-.315-1.39-.705-1.832-.517-.584-1.304-.883-2.342-.89h-.027c-.81 0-1.918.234-2.611 1.258l-1.766-1.196C7.688 6.46 9.188 5.71 10.97 5.71h.041c3.21.02 5.063 1.95 5.206 5.43.13.053.26.108.387.166 1.26.584 2.256 1.497 2.81 2.677.772 1.646.89 4.38-1.298 6.522-1.842 1.805-4.084 2.572-7.33 2.495Z" />
      </svg>
    )
  },
  linkedin: {
    bg: 'bg-[#0A66C2] text-white border-transparent',
    glyph: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77Z" />
      </svg>
    )
  },
  telegram: {
    bg: 'bg-[#26A5E4] text-white border-transparent',
    glyph: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0h-.056Zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635Z" />
      </svg>
    )
  }
};

function IconPreview({ url, alt, platform }: { url: string; alt: string; platform?: string }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [url]);

  const pKey = (platform || '').trim().toLowerCase();
  const brand = ADMIN_BRAND_COLORS[pKey === 'twitter' ? 'x' : pKey];
  const isDefaultUrl = !url || url.startsWith(LUCIDE_ICON_CDN);

  if (brand && isDefaultUrl) {
    return (
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border shadow-xs ${brand.bg}`}>
        {brand.glyph}
      </div>
    );
  }

  if (!url || failed) {
    return (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 dark:border-[#262A34] dark:bg-[#1C2029]">
        <Globe className="h-4 w-4 text-slate-500" />
      </div>
    );
  }

  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white dark:border-[#262A34] dark:bg-white">
      <img
        src={url}
        alt={alt}
        onError={() => setFailed(true)}
        className="h-5 w-5 object-contain"
      />
    </div>
  );
}

export function SocialLinksPage({ onNotify }: { onNotify: (msg: string, isErr?: boolean) => void }) {
  const { lang, tr } = useAdminUi();
  const [items, setItems] = useState<SocialLinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const [editing, setEditing] = useState<SocialLinkItem | null>(null);
  const [isNewModal, setIsNewModal] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  async function load(force = false) {
    setLoading(true);
    try {
      const res = await adminApi<{ items: SocialLinkItem[] }>('/social-links', { forceRefresh: force });
      setItems(
        (res.items?.length ? res.items : DEFAULT_SOCIAL_LINKS)
          .slice()
          .sort((a, b) => a.sort_order - b.sort_order)
      );
    } catch (err) {
      onNotify(
        err instanceof Error ? err.message : tr('Could not load social links.', 'சமூக வலைதள விவரம் லோடு ஆகலைங்க.'),
        true
      );
      setItems(DEFAULT_SOCIAL_LINKS.map((item) => ({ ...item })));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load(false);
  }, []);

  async function persistItems(nextList: SocialLinkItem[], toastMsg?: string) {
    const previous = items;
    const ordered = nextList.map((item, idx) => ({ ...item, sort_order: idx + 1 }));
    setItems(ordered);
    setSaving(true);
    try {
      const res = await adminApi<{ items: SocialLinkItem[] }>('/social-links', {
        method: 'PUT',
        body: JSON.stringify({ items: ordered })
      });
      setItems(res.items);
      if (toastMsg) onNotify(toastMsg);
    } catch (err) {
      setItems(previous);
      onNotify(
        err instanceof Error ? err.message : tr('Could not save social links.', 'சேவ் பண்ண முடியலைங்க.'),
        true
      );
    } finally {
      setSaving(false);
    }
  }

  function handleToggle(id: string) {
    const target = items.find((i) => i.id === id);
    if (!target) return;
    const nextEnabled = !target.enabled;
    const updated = items.map((item) => (item.id === id ? { ...item, enabled: nextEnabled } : item));
    void persistItems(
      updated,
      tr(
        `${target.name_en} ${nextEnabled ? 'enabled' : 'disabled'}.`,
        `${target.name_ta || target.name_en} ${nextEnabled ? 'ஆன் செய்யப்பட்டது' : 'ஆஃப் செய்யப்பட்டது'}.`
      )
    );
  }

  function reorderList(fromIdx: number, toIdx: number) {
    if (fromIdx === toIdx || fromIdx < 0 || toIdx < 0 || fromIdx >= items.length || toIdx >= items.length) {
      return;
    }
    const copy = [...items];
    const [moved] = copy.splice(fromIdx, 1);
    if (!moved) return;
    copy.splice(toIdx, 0, moved);
    void persistItems(copy, tr('Social link order saved.', 'வரிசை சேவ் ஆச்சுங்க.'));
  }

  function openAddCustomModal() {
    setIsNewModal(true);
    setEditing({
      id: `custom-${Date.now()}`,
      platform: 'custom',
      name_en: '',
      name_ta: '',
      handle: '@ilangathirtrust',
      url: 'https://',
      icon_url: `${LUCIDE_ICON_CDN}/globe.svg`,
      enabled: true,
      sort_order: items.length + 1,
      is_custom: true
    });
  }

  function openEditModal(item: SocialLinkItem) {
    setIsNewModal(false);
    setEditing({ ...item });
  }

  function handleSaveModal(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    const trimmedNameEn = editing.name_en.trim();
    const trimmedUrl = editing.url.trim();
    if (!trimmedNameEn || !trimmedUrl) return;

    const cleanItem: SocialLinkItem = {
      ...editing,
      platform:
        editing.platform.trim() ||
        trimmedNameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') ||
        'custom',
      name_en: trimmedNameEn,
      name_ta: editing.name_ta.trim() || trimmedNameEn,
      handle: editing.handle.trim(),
      url: trimmedUrl,
      icon_url: editing.icon_url.trim() || `${LUCIDE_ICON_CDN}/globe.svg`
    };

    const nextList = isNewModal
      ? [...items, cleanItem]
      : items.map((item) => (item.id === cleanItem.id ? cleanItem : item));

    setEditing(null);
    void persistItems(
      nextList,
      isNewModal
        ? tr(`Added ${cleanItem.name_en}.`, `${cleanItem.name_en} சேர்த்தாச்சுங்க.`)
        : tr(`Updated ${cleanItem.name_en}.`, `${cleanItem.name_en} அப்டேட் ஆச்சுங்க.`)
    );
  }

  function handleDeleteItem(id: string) {
    const target = items.find((i) => i.id === id);
    if (!target) return;
    if (!confirm(tr(`Remove ${target.name_en}?`, `${target.name_en} நீக்கலாமா?`))) return;
    const nextList = items.filter((item) => item.id !== id);
    setEditing(null);
    void persistItems(nextList, tr(`Removed ${target.name_en}.`, `${target.name_en} நீக்கப்பட்டது.`));
  }

  function handleResetDefaults() {
    if (!confirm(tr('Restore all default @ilangathirtrust social platforms and order?', 'எல்லா @ilangathirtrust இயல்புநிலை சமூக வலைதளங்களையும் மீட்டமைக்கலாமா?'))) {
      return;
    }
    void persistItems(
      DEFAULT_SOCIAL_LINKS.map((item) => ({ ...item })),
      tr('Restored default social media links.', 'இயல்புநிலை சமூக வலைதள லிங்க்குகள் மீட்டமைக்கப்பட்டது.')
    );
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="admin-card flex items-center justify-between gap-3 p-3.5">
            <div className="flex items-center gap-3">
              <div className="admin-skeleton h-9 w-9 rounded-xl" />
              <div className="space-y-1.5">
                <div className="admin-skeleton h-4 w-28 rounded" />
                <div className="admin-skeleton h-3 w-40 rounded" />
              </div>
            </div>
            <div className="admin-skeleton h-8 w-24 rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="admin-card flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Share2 className="h-4 w-4 shrink-0 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900 sm:text-lg">
              {tr('Social Media & Platform Links', 'சமூக வலைதள & பிளாட்ஃபார்ம் லிங்க்குகள்')}
            </h2>
            {saving && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {tr(
              'Drag and drop rows to change display order. Edit links or upload/paste custom icons (Lucide SVG links pre-configured).',
              'வரிசையை மாத்த இழுத்து விடுங்க. லிங்க் மாத்தவும், ஐகான் அப்லோட் செய்யவும் அல்லது Lucide லிங்க் போடவும் முடியும்.'
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={handleResetDefaults} className="admin-btn-secondary">
            <RotateCcw className="h-3.5 w-3.5" />
            <span>{tr('Reset Defaults', 'இயல்புநிலை')}</span>
          </button>
          <button type="button" onClick={openAddCustomModal} className="admin-btn-primary">
            <Plus className="h-4 w-4" />
            <span>{tr('Add Custom Platform', 'புது பிளாட்ஃபார்ம் சேர்')}</span>
          </button>
        </div>
      </div>

      {/* Ordered Social List: Drag Handle -> Icon -> Platform Name -> Edit -> Enable/Disable Toggle */}
      <div className="space-y-2.5">
        {items.map((item, idx) => {
          const isOver = overIndex === idx && dragIndex !== idx;
          const displayName = lang === 'ta' && item.name_ta ? item.name_ta : item.name_en;

          return (
            <div
              key={item.id}
              draggable
              onDragStart={(e) => {
                setDragIndex(idx);
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', String(idx));
              }}
              onDragOver={(e) => {
                e.preventDefault();
                if (overIndex !== idx) setOverIndex(idx);
              }}
              onDragLeave={() => {
                if (overIndex === idx) setOverIndex(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                const from = dragIndex !== null ? dragIndex : Number(e.dataTransfer.getData('text/plain'));
                setDragIndex(null);
                setOverIndex(null);
                if (Number.isFinite(from)) reorderList(from, idx);
              }}
              onDragEnd={() => {
                setDragIndex(null);
                setOverIndex(null);
              }}
              className={`admin-card flex flex-wrap items-center justify-between gap-2.5 p-3 transition min-[360px]:p-3.5 sm:flex-nowrap ${
                isOver ? 'border-blue-500 ring-2 ring-blue-500/20' : ''
              } ${dragIndex === idx ? 'opacity-60' : ''} ${!item.enabled ? 'bg-slate-50/80 opacity-80' : ''}`}
            >
              <div className="flex min-w-0 flex-1 items-center gap-2.5 min-[360px]:gap-3">
                {/* Drag Handle + Mobile Up/Down */}
                <div className="flex shrink-0 items-center gap-1">
                  <span
                    title={tr('Drag to reorder', 'வரிசை மாத்த இழுங்க')}
                    className="inline-flex h-8 w-6 cursor-grab items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 active:cursor-grabbing dark:hover:bg-[#1C2029]"
                  >
                    <GripVertical className="h-4 w-4" />
                  </span>
                  <div className="flex flex-col sm:hidden">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => reorderList(idx, idx - 1)}
                      aria-label={tr('Move up', 'மேலே நகர்த்து')}
                      className="rounded p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                    >
                      <ArrowUp className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === items.length - 1}
                      onClick={() => reorderList(idx, idx + 1)}
                      aria-label={tr('Move down', 'கீழே நகர்த்து')}
                      className="rounded p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                    >
                      <ArrowDown className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Icon */}
                <IconPreview url={item.icon_url} alt={displayName} platform={item.platform} />

                {/* Platform Name & URL */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
                      {displayName}
                    </span>
                    {item.is_custom && (
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                        {tr('Custom', 'கஸ்டம்')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    {item.handle && <span className="truncate font-semibold text-slate-600">{item.handle}</span>}
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-w-0 items-center gap-1 truncate text-blue-600 hover:underline"
                    >
                      <span className="truncate">{item.url}</span>
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Edit Button + Enable/Disable Toggle */}
              <div className="flex w-full shrink-0 items-center justify-end gap-2 sm:w-auto">
                <button
                  type="button"
                  onClick={() => openEditModal(item)}
                  className="admin-btn-secondary px-2.5 py-1.5 text-xs"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span>{tr('Edit', 'மாற்று')}</span>
                </button>

                <button
                  type="button"
                  role="switch"
                  aria-checked={item.enabled}
                  aria-label={
                    item.enabled
                      ? tr(`Disable ${item.name_en}`, `${item.name_en} முடக்கு`)
                      : tr(`Enable ${item.name_en}`, `${item.name_en} இயக்கு`)
                  }
                  onClick={() => handleToggle(item.id)}
                  className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-bold transition ${
                    item.enabled
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      : 'border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span
                    className={`relative inline-flex h-4 w-7 items-center rounded-full transition ${
                      item.enabled ? 'bg-emerald-600' : 'bg-slate-400'
                    }`}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition ${
                        item.enabled ? 'translate-x-3.5' : 'translate-x-0.5'
                      }`}
                    />
                  </span>
                  <span>{item.enabled ? tr('Enabled', 'ஆன்') : tr('Disabled', 'ஆஃப்')}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl min-[360px]:p-5 dark:border-[#262A34] dark:bg-[#161920]">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-[#262A34]">
              <h3 className="text-base font-bold text-slate-900">
                {isNewModal
                  ? tr('Add Custom Platform Link', 'புது சமூக வலைதள லிங்க் சேர்')
                  : tr(`Edit ${editing.name_en}`, `${editing.name_en} — விவரம் மாற்று`)}
              </h3>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="mt-4 space-y-3.5">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="admin-label">
                  <span>{tr('Platform Name (EN) *', 'பெயர் (ஆங்கிலம்) *')}</span>
                  <input
                    required
                    value={editing.name_en}
                    onChange={(e) => setEditing({ ...editing, name_en: e.target.value })}
                    placeholder="e.g., WhatsApp Channel"
                    className="admin-input"
                  />
                </label>

                <label className="admin-label">
                  <span>{tr('Platform Name (TA)', 'பெயர் (தமிழ்)')}</span>
                  <input
                    value={editing.name_ta}
                    onChange={(e) => setEditing({ ...editing, name_ta: e.target.value })}
                    placeholder="எ.கா., வாட்ஸ்அப் சேனல்"
                    className="admin-input"
                  />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="admin-label">
                  <span>{tr('Handle / Subtitle', 'ஹேண்டில் / குறிப்பு')}</span>
                  <input
                    value={editing.handle}
                    onChange={(e) => setEditing({ ...editing, handle: e.target.value })}
                    placeholder="@ilangathirtrust"
                    className="admin-input"
                  />
                </label>

                <label className="admin-label">
                  <span>{tr('Platform Key', 'பிளாட்ஃபார்ம் குறியீடு')}</span>
                  <input
                    value={editing.platform}
                    onChange={(e) => setEditing({ ...editing, platform: e.target.value })}
                    placeholder="instagram / whatsapp / custom"
                    className="admin-input"
                  />
                </label>
              </div>

              <label className="admin-label">
                <span>{tr('Destination Link URL *', 'செல்ல வேண்டிய லிங்க் *')}</span>
                <input
                  required
                  type="url"
                  value={editing.url}
                  onChange={(e) => setEditing({ ...editing, url: e.target.value })}
                  placeholder="https://instagram.com/ilangathirtrust"
                  className="admin-input"
                />
              </label>

              {/* Icon URL + Upload + Lucide Quick Picker */}
              <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-[#262A34] dark:bg-[#1C2029]">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    {tr('Platform Icon (URL or Upload)', 'ஐகான் (லிங்க் அல்லது அப்லோட்)')}
                  </span>
                  <IconPreview url={editing.icon_url} alt={editing.name_en || 'Icon'} platform={editing.platform} />
                </div>

                <div className="flex flex-wrap gap-2">
                  <input
                    value={editing.icon_url}
                    onChange={(e) => setEditing({ ...editing, icon_url: e.target.value })}
                    placeholder="https://cdn.jsdelivr.net/npm/lucide-static@latest/icons/globe.svg"
                    className="admin-input min-w-0 w-full sm:w-auto sm:flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => setPickerOpen(true)}
                    className="admin-btn-secondary w-full justify-center sm:w-auto"
                  >
                    <ImageIcon className="h-4 w-4 text-blue-600" />
                    <span>{tr('Upload / Pick Icon', 'ஐகான் அப்லோட்')}</span>
                  </button>
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between text-[11px] text-slate-500">
                    <span>{tr('Quick Lucide Icons:', 'சட்டென எடுக்க Lucide ஐகான்கள்:')}</span>
                    <a
                      href="https://lucide.dev/icons"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:underline"
                    >
                      <span>lucide.dev</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {LUCIDE_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        title={preset.label}
                        onClick={() => setEditing({ ...editing, icon_url: preset.icon })}
                        className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-semibold transition ${
                          editing.icon_url === preset.icon
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <img src={preset.icon} alt={preset.label} className="h-3.5 w-3.5 object-contain" />
                        <span>{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={editing.enabled}
                  onChange={(e) => setEditing({ ...editing, enabled: e.target.checked })}
                  className="h-4 w-4 rounded accent-blue-600"
                />
                <span>{tr('Show this link publicly on the website', 'இந்த லிங்க்கை வெப்சைட்டில் காட்டு')}</span>
              </label>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-3 dark:border-[#262A34]">
                {!isNewModal ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(editing.id)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>{tr('Remove', 'நீக்கு')}</span>
                  </button>
                ) : (
                  <span />
                )}

                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setEditing(null)} className="admin-btn-secondary">
                    {tr('Cancel', 'ரத்து')}
                  </button>
                  <button type="submit" className="admin-btn-primary">
                    <span>{isNewModal ? tr('Add Platform', 'சேர்') : tr('Save Changes', 'சேமி')}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <MediaPickerModal
        open={pickerOpen}
        bucket="media"
        folderName="social-icons"
        onClose={() => setPickerOpen(false)}
        onSelect={(url) => {
          if (editing) setEditing({ ...editing, icon_url: url });
          setPickerOpen(false);
        }}
      />
    </div>
  );
}
