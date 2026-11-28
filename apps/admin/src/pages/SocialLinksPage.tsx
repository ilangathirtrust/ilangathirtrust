import { useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronUp,
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

const ADMIN_BRAND_COLORS: Record<string, { bg: string; glyph: React.ReactNode }> = {
  instagram: {
    bg: 'bg-[radial-gradient(circle_at_30%_107%,#fdf497_0%,#fdf497_5%,#fd5949_45%,#d6249f_60%,#285AEB_90%)] text-white border-transparent',
    glyph: (
      <svg viewBox="1.5 1.5 21 21" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="5.5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.2" cy="6.8" r="1.2" fill="currentColor" stroke="none" />
      </svg>
    )
  },
  whatsapp: {
    bg: 'bg-[#25D366] text-white border-transparent',
    glyph: (
      <svg viewBox="2.5 2.5 27 27" className="h-[22px] w-[22px]" fill="currentColor">
        <path d="M16.04 4C9.42 4 4.04 9.38 4.04 16c0 2.12.56 4.19 1.62 6.01L4 28l6.16-1.61A11.95 11.95 0 0 0 16.04 28C22.66 28 28.04 22.62 28.04 16S22.66 4 16.04 4Zm0 21.81c-1.84 0-3.65-.5-5.22-1.44l-.37-.22-3.66.96.98-3.57-.24-.39a9.77 9.77 0 0 1-1.5-5.15c0-5.41 4.4-9.81 9.81-9.81s9.81 4.4 9.81 9.81-4.4 9.81-9.61 9.81Zm5.38-7.35c-.3-.15-1.74-.86-2.01-.96-.27-.1-.46-.15-.66.15-.2.3-.76.96-.94 1.15-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.65-2.05-.17-.3-.02-.46.13-.6.13-.13.3-.35.44-.52.15-.17.2-.3.3-.49.1-.2.05-.37-.02-.52-.08-.15-.66-1.59-.9-2.18-.24-.58-.48-.5-.66-.51h-.56c-.2 0-.52.07-.79.37-.27.3-1.03 1.01-1.03 2.46s1.06 2.85 1.21 3.05c.15.2 2.08 3.18 5.04 4.46.7.3 1.25.49 1.68.62.71.22 1.35.19 1.86.12.57-.09 1.74-.71 1.98-1.4.25-.69.25-1.28.17-1.4-.07-.12-.27-.2-.57-.35Z" />
      </svg>
    )
  },
  youtube: {
    bg: 'bg-[#FF0000] text-white border-transparent',
    glyph: (
      <svg viewBox="1 3.5 22 17" className="h-[22px] w-[22px]">
        <path fill="#FFFFFF" d="M21.58 7.19a2.51 2.51 0 0 0-1.77-1.77C18.25 5 12 5 12 5s-6.25 0-7.81.42a2.51 2.51 0 0 0-1.77 1.77C2 8.75 2 12 2 12s0 3.25.42 4.81a2.51 2.51 0 0 0 1.77 1.77C5.75 19 12 19 12 19s6.25 0 7.81-.42a2.51 2.51 0 0 0 1.77-1.77C22 15.25 22 12 22 12s0-3.25-.42-4.81Z" />
        <path fill="#FF0000" d="M10 15.02 15.22 12 10 8.98v6.04Z" />
      </svg>
    )
  },
  facebook: {
    bg: 'bg-[#1877F2] text-white border-transparent',
    glyph: (
      <svg viewBox="6 1.5 13 21" className="h-[21px] w-[21px] translate-y-[0.5px]" fill="currentColor">
        <path d="M14.2 21.5v-8.4h2.8l.42-3.28H14.2V7.73c0-.95.26-1.6 1.62-1.6h1.73V3.2c-.3-.04-1.33-.13-2.52-.13-2.5 0-4.21 1.52-4.21 4.33v2.42H8v3.28h2.82v8.4h3.38Z" />
      </svg>
    )
  },
  x: {
    bg: 'bg-[#000000] text-white border-transparent',
    glyph: (
      <svg viewBox="2 1 20 22" className="h-[19px] w-[19px]" fill="currentColor">
        <path d="M18.9 2.25h3.07l-6.7 7.66 7.88 10.42h-6.17l-4.83-6.32-5.53 6.32H3.55l7.17-8.19-7.56-9.89h6.33l4.37 5.77 5.04-5.77Zm-1.08 16.25h1.7L6.7 4.02H4.88l12.94 14.48Z" />
      </svg>
    )
  },
  threads: {
    bg: 'bg-[#000000] text-white border-transparent',
    glyph: (
      <svg viewBox="2 2 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.05" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19.5 10.5C18.8 6.5 15.8 4 12 4c-4.4 0-8 3.6-8 8s3.6 8 8 8c3.3 0 6-1.9 7.2-4.8" />
        <path d="M15.2 12.2v1.6c0 1.4.8 2.3 2 2.3 1.3 0 2.3-1.1 2.3-3.1 0-1-.2-1.8-.5-2.5" />
        <path d="M15.2 12.2c0-2-1.3-3.3-3.3-3.3-1.5 0-2.7.8-3.2 2" />
        <path d="M15.2 12.6c-.4 1.6-1.6 2.5-3.2 2.5-1.5 0-2.6-.9-2.6-2.1 0-1.3 1.1-2.1 2.7-2.1 1.2 0 2.3.4 3.1 1.1" />
      </svg>
    )
  },
  linkedin: {
    bg: 'bg-[#0A66C2] text-white border-transparent',
    glyph: (
      <svg viewBox="4 4 16 16" className="h-5 w-5" fill="currentColor">
        <path d="M6.94 8.5a1.56 1.56 0 1 1 0-3.12 1.56 1.56 0 0 1 0 3.12ZM5.6 18.4V9.8h2.68v8.6H5.6Zm4.65 0V9.8h2.57v1.18h.04c.36-.68 1.24-1.4 2.55-1.4 2.73 0 3.23 1.8 3.23 4.13v4.69h-2.68v-4.16c0-.99-.02-2.27-1.38-2.27-1.39 0-1.6 1.08-1.6 2.2v4.23h-2.73Z" />
      </svg>
    )
  },
  telegram: {
    bg: 'bg-[#26A5E4] text-white border-transparent',
    glyph: (
      <svg viewBox="1.5 2.5 20.5 18.5" className="h-5 w-5 -translate-x-[0.5px]" fill="currentColor">
        <path d="M21.2 4.4a1.1 1.1 0 0 0-1.15-.16L3.25 11.1a1.05 1.05 0 0 0 .08 1.97l4.2 1.34 1.65 5.15a.9.9 0 0 0 1.53.36l2.37-2.45 4.4 3.24a1.1 1.1 0 0 0 1.73-.67l2.58-14.5a1.1 1.1 0 0 0-.59-1.14ZM9.7 14.3l8.15-6.65-6.2 7.8-.42 2.8-1.53-3.95Z" />
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
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border shadow-xs ${brand.bg}`}>
        {brand.glyph}
      </div>
    );
  }

  if (!url || failed) {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 dark:border-[#262A34] dark:bg-[#1C2029]">
        <Globe className="h-5 w-5 text-slate-500" />
      </div>
    );
  }

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white dark:border-[#262A34] dark:bg-white">
      <img
        src={url}
        alt={alt}
        onError={() => setFailed(true)}
        className="h-6 w-6 object-contain"
      />
    </div>
  );
}

export function SocialLinksPage({ onNotify }: { onNotify: (msg: string, isErr?: boolean) => void }) {
  const { lang, tr } = useAdminUi();
  const [items, setItems] = useState<SocialLinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  // Pointer drag state (works smoothly on desktop mouse, trackpad & mobile touch)
  const [dragFromIdx, setDragFromIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const rowRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Ref-based atomic FIFO queue so rapid multi-toggles & reorders never overwrite each other
  const itemsRef = useRef<SocialLinkItem[]>([]);
  const queueChainRef = useRef<Promise<void>>(Promise.resolve());
  const mutationSeqRef = useRef(0);

  // Minimal Add / Edit modal state
  const [editing, setEditing] = useState<SocialLinkItem | null>(null);
  const [isNewModal, setIsNewModal] = useState(false);
  const [showMoreFields, setShowMoreFields] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  async function load(force = false) {
    setLoading(true);
    try {
      const res = await adminApi<{ items: SocialLinkItem[] }>('/social-links', { forceRefresh: force });
      const sorted = (res.items?.length ? res.items : DEFAULT_SOCIAL_LINKS)
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order);
      itemsRef.current = sorted;
      setItems(sorted);
    } catch (err) {
      onNotify(
        err instanceof Error ? err.message : tr('Could not load social links.', 'சமூக வலைதள விவரம் லோடு ஆகலைங்க.'),
        true
      );
      const fallback = DEFAULT_SOCIAL_LINKS.map((item) => ({ ...item }));
      itemsRef.current = fallback;
      setItems(fallback);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load(false);
  }, []);

  /**
   * Atomically applies a state transform against `itemsRef.current` and queues the PUT request
   * strictly in FIFO order so rapid clicks never revert earlier toggles.
   */
  function enqueueMutation(
    transform: (current: SocialLinkItem[]) => SocialLinkItem[],
    successMsg?: string
  ) {
    const previous = itemsRef.current;
    const nextOrdered = transform(previous).map((item, idx) => ({ ...item, sort_order: idx + 1 }));
    itemsRef.current = nextOrdered;
    setItems(nextOrdered);

    const seq = ++mutationSeqRef.current;
    setPendingCount((c) => c + 1);

    queueChainRef.current = queueChainRef.current
      .then(async () => {
        try {
          const res = await adminApi<{ items: SocialLinkItem[] }>('/social-links', {
            method: 'PUT',
            body: JSON.stringify({ items: nextOrdered })
          });
          // Only sync UI from server response once the entire queue catches up to the latest mutation
          if (seq === mutationSeqRef.current) {
            const sorted = res.items.slice().sort((a, b) => a.sort_order - b.sort_order);
            itemsRef.current = sorted;
            setItems(sorted);
          }
          if (successMsg) onNotify(successMsg);
        } catch (err) {
          onNotify(
            err instanceof Error ? err.message : tr('Could not save social links.', 'சேவ் பண்ண முடியலைங்க.'),
            true
          );
          // Re-sync cleanly with server if the latest queued mutation failed
          if (seq === mutationSeqRef.current) {
            void load(true);
          }
        } finally {
          setPendingCount((c) => Math.max(0, c - 1));
        }
      });
  }

  function handleToggle(id: string) {
    const currentTarget = itemsRef.current.find((i) => i.id === id);
    if (!currentTarget) return;
    const nextEnabled = !currentTarget.enabled;
    enqueueMutation(
      (curr) => curr.map((item) => (item.id === id ? { ...item, enabled: nextEnabled } : item)),
      tr(
        `${currentTarget.name_en} ${nextEnabled ? 'enabled' : 'disabled'}.`,
        `${currentTarget.name_ta || currentTarget.name_en} ${nextEnabled ? 'ஆன் ஆச்சுங்க' : 'ஆஃப் ஆச்சுங்க'}.`
      )
    );
  }

  function reorderList(fromIdx: number, toIdx: number) {
    if (fromIdx === toIdx || fromIdx < 0 || toIdx < 0) return;
    enqueueMutation(
      (curr) => {
        if (fromIdx >= curr.length || toIdx >= curr.length) return curr;
        const copy = [...curr];
        const [moved] = copy.splice(fromIdx, 1);
        if (!moved) return curr;
        copy.splice(toIdx, 0, moved);
        return copy;
      },
      tr('Order updated.', 'வரிசை சேவ் ஆச்சுங்க.')
    );
  }

  function startPointerDrag(e: React.PointerEvent, fromIdx: number) {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();

    setDragFromIdx(fromIdx);
    setDragOverIdx(fromIdx);
    let latestOver = fromIdx;

    const findHoverIndex = (clientY: number): number => {
      const currentList = itemsRef.current;
      for (let i = 0; i < currentList.length; i++) {
        const el = rowRefs.current.get(currentList[i].id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (clientY >= rect.top && clientY <= rect.bottom) {
          return i;
        }
      }
      // Above first or below last row
      const firstEl = currentList[0] ? rowRefs.current.get(currentList[0].id) : null;
      if (firstEl && clientY < firstEl.getBoundingClientRect().top) return 0;
      return currentList.length - 1;
    };

    const onPointerMove = (ev: PointerEvent) => {
      const nextOver = findHoverIndex(ev.clientY);
      if (nextOver !== latestOver) {
        latestOver = nextOver;
        setDragOverIdx(nextOver);
      }
    };

    const finishDrag = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', finishDrag);
      window.removeEventListener('pointercancel', finishDrag);
      setDragFromIdx(null);
      setDragOverIdx(null);
      if (latestOver !== fromIdx) {
        reorderList(fromIdx, latestOver);
      }
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerup', finishDrag);
    window.addEventListener('pointercancel', finishDrag);
  }

  function openAddCustomModal() {
    setIsNewModal(true);
    setShowMoreFields(false);
    setEditing({
      id: `custom-${Date.now()}`,
      platform: 'custom',
      name_en: '',
      name_ta: '',
      handle: '@ilangathirtrust',
      url: 'https://',
      icon_url: `${LUCIDE_ICON_CDN}/globe.svg`,
      enabled: true,
      sort_order: itemsRef.current.length + 1,
      is_custom: true
    });
  }

  function openEditModal(item: SocialLinkItem) {
    setIsNewModal(false);
    setShowMoreFields(false);
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

    setEditing(null);
    enqueueMutation(
      (curr) =>
        isNewModal
          ? [...curr, cleanItem]
          : curr.map((item) => (item.id === cleanItem.id ? cleanItem : item)),
      isNewModal
        ? tr(`Added ${cleanItem.name_en}.`, `${cleanItem.name_en} சேர்த்தாச்சுங்க.`)
        : tr(`Updated ${cleanItem.name_en}.`, `${cleanItem.name_en} அப்டேட் ஆச்சுங்க.`)
    );
  }

  function handleDeleteItem(id: string) {
    const target = itemsRef.current.find((i) => i.id === id);
    if (!target) return;
    if (!confirm(tr(`Remove ${target.name_en}?`, `${target.name_en} நீக்கலாமா?`))) return;
    setEditing(null);
    enqueueMutation(
      (curr) => curr.filter((item) => item.id !== id),
      tr(`Removed ${target.name_en}.`, `${target.name_en} நீக்கப்பட்டது.`)
    );
  }

  function handleResetDefaults() {
    if (
      !confirm(
        tr(
          'Restore all default @ilangathirtrust social platforms and order?',
          'எல்லா @ilangathirtrust இயல்புநிலை சமூக வலைதளங்களையும் மீட்டமைக்கலாமா?'
        )
      )
    ) {
      return;
    }
    enqueueMutation(
      () => DEFAULT_SOCIAL_LINKS.map((item) => ({ ...item })),
      tr('Restored default social media links.', 'இயல்புநிலை சமூக வலைதள லிங்க்குகள் மீட்டமைக்கப்பட்டது.')
    );
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="admin-card flex items-center justify-between gap-3 p-3.5">
            <div className="flex items-center gap-3">
              <div className="admin-skeleton h-10 w-10 rounded-full" />
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
          <div className="flex flex-wrap items-center gap-2">
            <Share2 className="h-4 w-4 shrink-0 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900 sm:text-lg">
              {tr('Social Media & Platform Links', 'சமூக வலைதள & பிளாட்ஃபார்ம் லிங்க்குகள்')}
            </h2>
            {pendingCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>
                  {pendingCount > 1
                    ? tr(`Saving queue (${pendingCount})…`, `சேவ் ஆகுது (${pendingCount})…`)
                    : tr('Saving…', 'சேவ் ஆகுது…')}
                </span>
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {tr(
              'Hold and drag the 6-dot handle to reorder links, toggle switches rapidly, or edit/upload icons.',
              '6-புள்ளி ஐகானை அழுத்தி இழுத்து வரிசையை மாத்துங்க. எத்தனை லிங்க் வேணாலும் தொடர்ந்து ஆன்/ஆஃப் பண்ணலாம்.'
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

      {/* Ordered Social List */}
      <div className="space-y-2.5">
        {items.map((item, idx) => {
          const isDragging = dragFromIdx === idx;
          const isDropTarget = dragFromIdx !== null && dragOverIdx === idx && dragFromIdx !== idx;
          const dropAfter = isDropTarget && dragFromIdx! < idx;
          const dropBefore = isDropTarget && dragFromIdx! > idx;
          const displayName = lang === 'ta' && item.name_ta ? item.name_ta : item.name_en;

          return (
            <div
              key={item.id}
              ref={(el) => {
                if (el) rowRefs.current.set(item.id, el);
                else rowRefs.current.delete(item.id);
              }}
              className={`admin-card flex flex-wrap items-center justify-between gap-2.5 p-3 transition-all duration-150 min-[360px]:p-3.5 sm:flex-nowrap ${
                isDragging ? 'z-10 scale-[1.01] border-blue-500 bg-blue-50/30 shadow-lg ring-2 ring-blue-500/25' : ''
              } ${dropBefore ? 'border-t-[3px] border-t-blue-600' : ''} ${
                dropAfter ? 'border-b-[3px] border-b-blue-600' : ''
              } ${!item.enabled && !isDragging ? 'bg-slate-50/80 opacity-80' : ''}`}
            >
              <div className="flex min-w-0 flex-1 items-center gap-2.5 min-[360px]:gap-3">
                {/* Pointer Drag Handle + Up/Down Nudge Buttons */}
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onPointerDown={(e) => startPointerDrag(e, idx)}
                    title={tr('Drag to reorder', 'இழுத்து வரிசை மாற்று')}
                    aria-label={tr(`Reorder ${item.name_en}`, `${item.name_en} வரிசை மாற்று`)}
                    className="inline-flex h-9 w-7 touch-none cursor-grab select-none items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 active:cursor-grabbing dark:hover:bg-[#1C2029]"
                  >
                    <GripVertical className="h-4 w-4" />
                  </button>
                  <div className="flex flex-col">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => reorderList(idx, idx - 1)}
                      aria-label={tr('Move up', 'மேலே நகர்த்து')}
                      className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-25 dark:hover:bg-[#1C2029]"
                    >
                      <ArrowUp className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === items.length - 1}
                      onClick={() => reorderList(idx, idx + 1)}
                      aria-label={tr('Move down', 'கீழே நகர்த்து')}
                      className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-25 dark:hover:bg-[#1C2029]"
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
                      draggable={false}
                      className="inline-flex min-w-0 items-center gap-1 truncate text-blue-600 hover:underline"
                    >
                      <span className="truncate">{item.url}</span>
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Edit Button + Enable/Disable Switch */}
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
                  <span>{item.enabled ? tr('On', 'ஆன்') : tr('Off', 'ஆஃப்')}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Minimal, Clean Add / Edit Modal Widget */}
      {editing && (
        <div
          onClick={() => setEditing(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-xs"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl min-[360px]:p-5 dark:border-[#262A34] dark:bg-[#161920]"
          >
            {/* Compact Header with Live Icon Preview */}
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3.5 dark:border-[#262A34]">
              <div className="flex min-w-0 items-center gap-3">
                <IconPreview url={editing.icon_url} alt={editing.name_en || 'Icon'} platform={editing.platform} />
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-bold text-slate-900 sm:text-base">
                    {isNewModal
                      ? tr('Add Platform Link', 'புது லிங்க் சேர்')
                      : editing.name_en || tr('Edit Platform', 'விவரம் மாற்று')}
                  </h3>
                  <p className="truncate text-[11px] text-slate-500">
                    {tr('Change name, URL, or upload/paste a custom icon.', 'பெயர், லிங்க் மற்றும் ஐகானை எளிதா மாத்தலாம்.')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditing(null)}
                aria-label={tr('Close', 'மூடு')}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="mt-4 space-y-3.5">
              {/* 1. Platform Name */}
              <label className="admin-label">
                <span>{tr('Platform Name *', 'பிளாட்ஃபார்ம் பெயர் *')}</span>
                <input
                  required
                  value={editing.name_en}
                  onChange={(e) => setEditing({ ...editing, name_en: e.target.value })}
                  placeholder="e.g., Instagram, WhatsApp Channel"
                  className="admin-input"
                />
              </label>

              {/* 2. Profile Link URL */}
              <label className="admin-label">
                <span>{tr('Link URL *', 'லிங்க் URL *')}</span>
                <input
                  required
                  type="url"
                  value={editing.url}
                  onChange={(e) => setEditing({ ...editing, url: e.target.value })}
                  placeholder="https://instagram.com/ilangathirtrust"
                  className="admin-input"
                />
              </label>

              {/* 3. Compact Icon Picker (URL or Upload) */}
              <div className="space-y-2">
                <span className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                  {tr('Icon (Paste URL or Upload)', 'ஐகான் (லிங்க் அல்லது அப்லோட்)')}
                </span>
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
                    <span>{tr('Upload', 'அப்லோட்')}</span>
                  </button>
                </div>
              </div>

              {/* Optional Collapsible Advanced Fields */}
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 dark:border-[#262A34] dark:bg-[#1C2029]/60">
                <button
                  type="button"
                  onClick={() => setShowMoreFields((v) => !v)}
                  className="flex w-full items-center justify-between px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-300"
                >
                  <span>{tr('More options (Tamil name & handle)', 'கூடுதல் விவரம் (தமிழ் பெயர் & ஹேண்டில்)')}</span>
                  {showMoreFields ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
                {showMoreFields && (
                  <div className="grid gap-2.5 border-t border-slate-200/80 p-3 dark:border-[#262A34] sm:grid-cols-2">
                    <label className="admin-label">
                      <span>{tr('Tamil Name', 'தமிழ் பெயர்')}</span>
                      <input
                        value={editing.name_ta}
                        onChange={(e) => setEditing({ ...editing, name_ta: e.target.value })}
                        placeholder="எ.கா., இன்ஸ்டாகிராம்"
                        className="admin-input"
                      />
                    </label>
                    <label className="admin-label">
                      <span>{tr('Handle', 'ஹேண்டில்')}</span>
                      <input
                        value={editing.handle}
                        onChange={(e) => setEditing({ ...editing, handle: e.target.value })}
                        placeholder="@ilangathirtrust"
                        className="admin-input"
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Clean Footer Actions */}
              <div className="flex items-center justify-between gap-2 border-t border-slate-200 pt-3.5 dark:border-[#262A34]">
                {!isNewModal ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(editing.id)}
                    aria-label={tr('Remove', 'நீக்கு')}
                    className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>{tr('Delete', 'நீக்கு')}</span>
                  </button>
                ) : (
                  <span />
                )}

                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setEditing(null)} className="admin-btn-secondary">
                    {tr('Cancel', 'ரத்து')}
                  </button>
                  <button type="submit" className="admin-btn-primary">
                    <span>{isNewModal ? tr('Add', 'சேர்') : tr('Save', 'சேமி')}</span>
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
