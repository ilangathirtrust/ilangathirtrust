import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
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
      <svg viewBox="1.5 1.5 21 21" className="h-[18px] w-[18px] sm:h-5 sm:w-5" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="5.5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.2" cy="6.8" r="1.2" fill="currentColor" stroke="none" />
      </svg>
    )
  },
  whatsapp: {
    bg: 'bg-[#25D366] text-white border-transparent',
    glyph: (
      <svg viewBox="2.5 2.5 27 27" className="h-5 w-5 sm:h-[22px] sm:w-[22px]" fill="currentColor">
        <path d="M16.04 4C9.42 4 4.04 9.38 4.04 16c0 2.12.56 4.19 1.62 6.01L4 28l6.16-1.61A11.95 11.95 0 0 0 16.04 28C22.66 28 28.04 22.62 28.04 16S22.66 4 16.04 4Zm0 21.81c-1.84 0-3.65-.5-5.22-1.44l-.37-.22-3.66.96.98-3.57-.24-.39a9.77 9.77 0 0 1-1.5-5.15c0-5.41 4.4-9.81 9.81-9.81s9.81 4.4 9.81 9.81-4.4 9.81-9.61 9.81Zm5.38-7.35c-.3-.15-1.74-.86-2.01-.96-.27-.1-.46-.15-.66.15-.2.3-.76.96-.94 1.15-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.65-2.05-.17-.3-.02-.46.13-.6.13-.13.3-.35.44-.52.15-.17.2-.3.3-.49.1-.2.05-.37-.02-.52-.08-.15-.66-1.59-.9-2.18-.24-.58-.48-.5-.66-.51h-.56c-.2 0-.52.07-.79.37-.27.3-1.03 1.01-1.03 2.46s1.06 2.85 1.21 3.05c.15.2 2.08 3.18 5.04 4.46.7.3 1.25.49 1.68.62.71.22 1.35.19 1.86.12.57-.09 1.74-.71 1.98-1.4.25-.69.25-1.28.17-1.4-.07-.12-.27-.2-.57-.35Z" />
      </svg>
    )
  },
  youtube: {
    bg: 'bg-[#FF0000] text-white border-transparent',
    glyph: (
      <svg viewBox="1 3.5 22 17" className="h-5 w-5 sm:h-[22px] sm:w-[22px]">
        <path fill="#FFFFFF" d="M21.58 7.19a2.51 2.51 0 0 0-1.77-1.77C18.25 5 12 5 12 5s-6.25 0-7.81.42a2.51 2.51 0 0 0-1.77 1.77C2 8.75 2 12 2 12s0 3.25.42 4.81a2.51 2.51 0 0 0 1.77 1.77C5.75 19 12 19 12 19s6.25 0 7.81-.42a2.51 2.51 0 0 0 1.77-1.77C22 15.25 22 12 22 12s0-3.25-.42-4.81Z" />
        <path fill="#FF0000" d="M10 15.02 15.22 12 10 8.98v6.04Z" />
      </svg>
    )
  },
  facebook: {
    bg: 'bg-[#1877F2] text-white border-transparent',
    glyph: (
      <svg viewBox="6 1.5 13 21" className="h-[19px] w-[19px] translate-y-[0.5px] sm:h-[21px] sm:w-[21px]" fill="currentColor">
        <path d="M14.2 21.5v-8.4h2.8l.42-3.28H14.2V7.73c0-.95.26-1.6 1.62-1.6h1.73V3.2c-.3-.04-1.33-.13-2.52-.13-2.5 0-4.21 1.52-4.21 4.33v2.42H8v3.28h2.82v8.4h3.38Z" />
      </svg>
    )
  },
  x: {
    bg: 'bg-[#000000] text-white border-transparent',
    glyph: (
      <svg viewBox="2 1 20 22" className="h-[17px] w-[17px] sm:h-[19px] sm:w-[19px]" fill="currentColor">
        <path d="M18.9 2.25h3.07l-6.7 7.66 7.88 10.42h-6.17l-4.83-6.32-5.53 6.32H3.55l7.17-8.19-7.56-9.89h6.33l4.37 5.77 5.04-5.77Zm-1.08 16.25h1.7L6.7 4.02H4.88l12.94 14.48Z" />
      </svg>
    )
  },
  threads: {
    bg: 'bg-[#000000] text-white border-transparent',
    glyph: (
      <svg viewBox="2 2 20 20" className="h-[18px] w-[18px] sm:h-5 sm:w-5" fill="none" stroke="currentColor" strokeWidth="2.05" strokeLinecap="round" strokeLinejoin="round">
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
      <svg viewBox="4 4 16 16" className="h-[18px] w-[18px] sm:h-5 sm:w-5" fill="currentColor">
        <path d="M6.94 8.5a1.56 1.56 0 1 1 0-3.12 1.56 1.56 0 0 1 0 3.12ZM5.6 18.4V9.8h2.68v8.6H5.6Zm4.65 0V9.8h2.57v1.18h.04c.36-.68 1.24-1.4 2.55-1.4 2.73 0 3.23 1.8 3.23 4.13v4.69h-2.68v-4.16c0-.99-.02-2.27-1.38-2.27-1.39 0-1.6 1.08-1.6 2.2v4.23h-2.73Z" />
      </svg>
    )
  },
  telegram: {
    bg: 'bg-[#26A5E4] text-white border-transparent',
    glyph: (
      <svg viewBox="1.5 2.5 20.5 18.5" className="h-[18px] w-[18px] -translate-x-[0.5px] sm:h-5 sm:w-5" fill="currentColor">
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
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border shadow-xs sm:h-10 sm:w-10 ${brand.bg}`}>
        {brand.glyph}
      </div>
    );
  }

  if (!url || failed) {
    return (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 sm:h-10 sm:w-10 dark:border-[#262A34] dark:bg-[#1C2029]">
        <Globe className="h-[18px] w-[18px] text-slate-500 sm:h-5 sm:w-5" />
      </div>
    );
  }

  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white sm:h-10 sm:w-10 dark:border-[#262A34] dark:bg-white">
      <img
        src={url}
        alt={alt}
        onError={() => setFailed(true)}
        className="h-5 w-5 object-contain sm:h-6 sm:w-6"
      />
    </div>
  );
}

interface FloatingDragMeta {
  item: SocialLinkItem;
  width: number;
  height: number;
  initialX: number;
  initialY: number;
}

export function SocialLinksPage({ onNotify }: { onNotify: (msg: string, isErr?: boolean) => void }) {
  const { lang, tr } = useAdminUi();
  const [items, setItems] = useState<SocialLinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  // Smooth live cursor-following pointer drag state
  const [dragOrder, setDragOrder] = useState<SocialLinkItem[] | null>(null);
  const [floatingMeta, setFloatingMeta] = useState<FloatingDragMeta | null>(null);
  const floatingRef = useRef<HTMLDivElement | null>(null);
  const rowRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const dragOrderRef = useRef<SocialLinkItem[] | null>(null);
  const cleanupDragRef = useRef<(() => void) | null>(null);

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
    return () => {
      cleanupDragRef.current?.();
    };
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

    queueChainRef.current = queueChainRef.current.then(async () => {
      try {
        const res = await adminApi<{ items: SocialLinkItem[] }>('/social-links', {
          method: 'PUT',
          body: JSON.stringify({ items: nextOrdered })
        });
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

  function startPointerDrag(e: React.PointerEvent<HTMLButtonElement>, startIdx: number) {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();

    const startList = itemsRef.current.slice();
    const draggedItem = startList[startIdx];
    const rowEl = draggedItem ? rowRefs.current.get(draggedItem.id) : null;
    if (!draggedItem || !rowEl) return;

    const handleEl = e.currentTarget;
    try {
      handleEl.setPointerCapture?.(e.pointerId);
    } catch {
      // Ignore synthetic events without active pointer
    }

    const rowRect = rowEl.getBoundingClientRect();
    const grabOffsetX = e.clientX - rowRect.left;
    const grabOffsetY = e.clientY - rowRect.top;

    dragOrderRef.current = startList;
    setDragOrder(startList);
    setFloatingMeta({
      item: draggedItem,
      width: rowRect.width,
      height: rowRect.height,
      initialX: rowRect.left,
      initialY: rowRect.top
    });

    const prevUserSelect = document.body.style.userSelect;
    const prevCursor = document.body.style.cursor;
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'grabbing';

    let latestClientX = e.clientX;
    let latestClientY = e.clientY;
    let rafId = 0;

    const updateDragFrame = () => {
      rafId = 0;
      if (floatingRef.current) {
        const nextX = latestClientX - grabOffsetX;
        const nextY = latestClientY - grabOffsetY;
        floatingRef.current.style.transform = `translate3d(${nextX}px, ${nextY}px, 0) scale(1.015)`;
      }

      // Gentle edge auto-scroll when dragging near viewport edges
      if (latestClientY < 72) {
        window.scrollBy({ top: -10 });
      } else if (latestClientY > window.innerHeight - 72) {
        window.scrollBy({ top: 10 });
      }

      const currentOrder = dragOrderRef.current;
      if (!currentOrder) return;
      const currentIdx = currentOrder.findIndex((i) => i.id === draggedItem.id);
      if (currentIdx === -1) return;

      let targetIdx = currentIdx;
      for (let i = 0; i < currentOrder.length; i++) {
        if (i === currentIdx) continue;
        const el = rowRefs.current.get(currentOrder[i].id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (i < currentIdx && latestClientY < rect.top + rect.height * 0.52) {
          targetIdx = i;
          break;
        }
        if (i > currentIdx && latestClientY > rect.top + rect.height * 0.48) {
          targetIdx = i;
        }
      }

      if (targetIdx !== currentIdx) {
        const reordered = currentOrder.slice();
        const [moved] = reordered.splice(currentIdx, 1);
        if (moved) {
          reordered.splice(targetIdx, 0, moved);
          dragOrderRef.current = reordered;
          setDragOrder(reordered);
        }
      }
    };

    const onPointerMove = (ev: PointerEvent) => {
      latestClientX = ev.clientX;
      latestClientY = ev.clientY;
      if (!rafId) {
        rafId = window.requestAnimationFrame(updateDragFrame);
      }
    };

    const cleanup = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', finishDrag);
      window.removeEventListener('pointercancel', finishDrag);
      if (rafId) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      }
      try {
        if (handleEl.hasPointerCapture?.(e.pointerId)) {
          handleEl.releasePointerCapture(e.pointerId);
        }
      } catch {
        // Ignore if capture already released
      }
      document.body.style.userSelect = prevUserSelect;
      document.body.style.cursor = prevCursor;
      cleanupDragRef.current = null;
    };

    const finishDrag = () => {
      const finalOrder = dragOrderRef.current;
      cleanup();
      dragOrderRef.current = null;
      setDragOrder(null);
      setFloatingMeta(null);

      if (!finalOrder) return;
      const finalIds = finalOrder.map((i) => i.id);
      const originalIds = itemsRef.current.map((i) => i.id);
      const changed = finalIds.some((id, index) => id !== originalIds[index]);
      if (changed) {
        enqueueMutation(
          (curr) => {
            const byId = new Map(curr.map((item) => [item.id, item]));
            const ordered: SocialLinkItem[] = [];
            for (const id of finalIds) {
              const found = byId.get(id);
              if (found) {
                ordered.push(found);
                byId.delete(id);
              }
            }
            for (const extra of byId.values()) ordered.push(extra);
            return ordered;
          },
          tr('Order updated.', 'வரிசை சேவ் ஆச்சுங்க.')
        );
      }
    };

    cleanupDragRef.current = cleanup;
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
              <div className="admin-skeleton h-9 w-9 rounded-full sm:h-10 sm:w-10" />
              <div className="space-y-1.5">
                <div className="admin-skeleton h-4 w-28 rounded" />
                <div className="admin-skeleton hidden h-3 w-40 rounded sm:block" />
              </div>
            </div>
            <div className="admin-skeleton h-8 w-20 rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  const displayedItems = dragOrder ?? items;
  const activeDragId = floatingMeta?.item.id ?? null;

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
              'Hold and drag the 6-dot handle to reorder smoothly, toggle switches rapidly, or edit/upload icons.',
              '6-புள்ளி ஐகானை அழுத்தி பிடித்து இழுத்து வரிசையை மாத்துங்க. எத்தனை லிங்க் வேணாலும் ஆன்/ஆஃப் பண்ணலாம்.'
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
        {displayedItems.map((item, idx) => {
          const isPlaceholder = activeDragId === item.id;
          const displayName = lang === 'ta' && item.name_ta ? item.name_ta : item.name_en;

          return (
            <div
              key={item.id}
              ref={(el) => {
                if (el) rowRefs.current.set(item.id, el);
                else rowRefs.current.delete(item.id);
              }}
              className={`admin-card relative flex flex-nowrap items-center justify-between gap-2 px-2.5 py-2.5 transition-all duration-150 sm:gap-3 sm:p-3.5 ${
                isPlaceholder
                  ? 'border-2 border-dashed border-blue-400 bg-blue-50/40 shadow-none dark:border-blue-500/50 dark:bg-blue-500/10'
                  : !item.enabled
                    ? 'bg-slate-50/80 opacity-80'
                    : ''
              }`}
            >
              {/* Left Cluster: Drag Handle + Social Icon + Name (+ Handle/URL on Desktop) */}
              <div
                className={`flex min-w-0 flex-1 items-center gap-2 sm:gap-3 ${
                  isPlaceholder ? 'opacity-0' : ''
                }`}
              >
                <button
                  type="button"
                  onPointerDown={(e) => startPointerDrag(e, idx)}
                  title={tr('Hold & drag to reorder', 'அழுத்தி இழுத்து வரிசை மாற்று')}
                  aria-label={tr(`Reorder ${item.name_en}`, `${item.name_en} வரிசை மாற்று`)}
                  className="inline-flex h-9 w-7 shrink-0 touch-none cursor-grab select-none items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 active:cursor-grabbing dark:hover:bg-[#1C2029]"
                >
                  <GripVertical className="h-4 w-4" />
                </button>

                <IconPreview url={item.icon_url} alt={displayName} platform={item.platform} />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
                      {displayName}
                    </span>
                    {item.is_custom && (
                      <span className="hidden rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 sm:inline-flex dark:bg-blue-500/15 dark:text-blue-300">
                        {tr('Custom', 'கஸ்டம்')}
                      </span>
                    )}
                  </div>
                  {/* Handle & URL shown cleanly on sm+ screens; omitted on mobile for uniform single-row alignment */}
                  <div className="hidden items-center gap-2 text-xs text-slate-500 sm:flex">
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

              {/* Right Cluster: Pencil Icon Button + Clean Toggle Switch (no text on mobile) */}
              <div
                className={`flex shrink-0 items-center gap-2 ${
                  isPlaceholder ? 'opacity-0 pointer-events-none' : ''
                }`}
              >
                <button
                  type="button"
                  onClick={() => openEditModal(item)}
                  aria-label={tr(`Edit ${item.name_en}`, `${item.name_en} மாற்று`)}
                  className="admin-btn-secondary h-8 w-8 justify-center p-0 text-xs sm:h-auto sm:w-auto sm:px-2.5 sm:py-1.5"
                >
                  <Pencil className="h-3.5 w-3.5 shrink-0" />
                  <span className="hidden sm:inline">{tr('Edit', 'மாற்று')}</span>
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
                  className={`inline-flex shrink-0 items-center gap-2 rounded-full transition sm:border sm:px-2.5 sm:py-1 sm:text-xs sm:font-bold ${
                    item.enabled
                      ? 'sm:border-emerald-200 sm:bg-emerald-50 sm:text-emerald-700 sm:hover:bg-emerald-100'
                      : 'sm:border-slate-200 sm:bg-slate-100 sm:text-slate-600 sm:hover:bg-slate-200'
                  }`}
                >
                  <span
                    className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 sm:h-4 sm:w-7 ${
                      item.enabled ? 'bg-emerald-600' : 'bg-slate-400 dark:bg-slate-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition-transform duration-200 sm:h-3 sm:w-3 ${
                        item.enabled ? 'translate-x-4 sm:translate-x-3.5' : 'translate-x-0.5'
                      }`}
                    />
                  </span>
                  <span className="hidden sm:inline">{item.enabled ? tr('On', 'ஆன்') : tr('Off', 'ஆஃப்')}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Floating Cursor-Tracked Clone While Dragging */}
      {floatingMeta &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={floatingRef}
            style={{
              position: 'fixed',
              left: 0,
              top: 0,
              width: floatingMeta.width,
              height: floatingMeta.height,
              transform: `translate3d(${floatingMeta.initialX}px, ${floatingMeta.initialY}px, 0) scale(1.015)`,
              transformOrigin: 'center center',
              zIndex: 9999,
              pointerEvents: 'none',
              willChange: 'transform'
            }}
            className="admin-card flex flex-nowrap items-center justify-between gap-2 border-blue-500 bg-white px-2.5 py-2.5 shadow-2xl ring-2 ring-blue-500/30 sm:gap-3 sm:p-3.5 dark:bg-[#161920]"
          >
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
              <span className="inline-flex h-9 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
                <GripVertical className="h-4 w-4" />
              </span>
              <IconPreview
                url={floatingMeta.item.icon_url}
                alt={lang === 'ta' && floatingMeta.item.name_ta ? floatingMeta.item.name_ta : floatingMeta.item.name_en}
                platform={floatingMeta.item.platform}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
                    {lang === 'ta' && floatingMeta.item.name_ta ? floatingMeta.item.name_ta : floatingMeta.item.name_en}
                  </span>
                </div>
                <div className="hidden items-center gap-2 text-xs text-slate-500 sm:flex">
                  {floatingMeta.item.handle && (
                    <span className="truncate font-semibold text-slate-600">{floatingMeta.item.handle}</span>
                  )}
                  <span className="truncate text-blue-600">{floatingMeta.item.url}</span>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <span className="admin-btn-secondary inline-flex h-8 w-8 items-center justify-center p-0 text-xs sm:h-auto sm:w-auto sm:px-2.5 sm:py-1.5">
                <Pencil className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">{tr('Edit', 'மாற்று')}</span>
              </span>
              <span
                className={`inline-flex shrink-0 items-center gap-2 rounded-full sm:border sm:px-2.5 sm:py-1 sm:text-xs sm:font-bold ${
                  floatingMeta.item.enabled
                    ? 'sm:border-emerald-200 sm:bg-emerald-50 sm:text-emerald-700'
                    : 'sm:border-slate-200 sm:bg-slate-100 sm:text-slate-600'
                }`}
              >
                <span
                  className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full sm:h-4 sm:w-7 ${
                    floatingMeta.item.enabled ? 'bg-emerald-600' : 'bg-slate-400'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white shadow-xs sm:h-3 sm:w-3 ${
                      floatingMeta.item.enabled ? 'translate-x-4 sm:translate-x-3.5' : 'translate-x-0.5'
                    }`}
                  />
                </span>
                <span className="hidden sm:inline">{floatingMeta.item.enabled ? tr('On', 'ஆன்') : tr('Off', 'ஆஃப்')}</span>
              </span>
            </div>
          </div>,
          document.body
        )}

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
