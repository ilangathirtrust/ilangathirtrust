'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, FolderOpen, Search } from 'lucide-react';
import type { GalleryFolder, PaginatedResponse } from '@ilangathir/shared';
import { API_URL } from '@/lib/api';
import { formatClientError, readApiResponse } from '@/lib/client-error';
import { useLanguage } from './LanguageProvider';
import { getUi } from '@/lib/i18n';
import { GalleryFolderCard } from './GalleryFolderCard';
import { FolderGridSkeleton } from './Skeletons';

interface GalleryExplorerProps {
  initialData: PaginatedResponse<GalleryFolder> & { facets: { categories: string[]; years: number[] } };
}

export function GalleryExplorer({ initialData }: GalleryExplorerProps) {
  const { lang } = useLanguage();
  const ui = getUi(lang);

  const [data, setData] = useState(initialData);
  const [category, setCategory] = useState('');
  const [year, setYear] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!category && !year && !search && page === 1 && reloadKey === 0) {
      setData(initialData);
      setError('');
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const q = new URLSearchParams();
        if (category) q.set('category', category);
        if (year) q.set('year', year);
        if (search) q.set('search', search);
        q.set('page', String(page));
        q.set('pageSize', '12');

        const res = await fetch(`${API_URL}/api/public/gallery/folders?${q.toString()}`, {
          signal: controller.signal
        });
        const json = await readApiResponse<GalleryExplorerProps['initialData']>(
          res,
          lang,
          'Could not load gallery folders.',
          'படத் தொகுப்புகளை ஏற்ற முடியவில்லை.'
        );
        setData(json);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(
          formatClientError(
            err,
            lang,
            'Could not load gallery folders. Please try again.',
            'படத் தொகுப்புகளை ஏற்ற முடியவில்லை. மீண்டும் முயற்சிக்கவும்.'
          )
        );
      } finally {
        setLoading(false);
      }
    }, search ? 250 : 0);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [category, year, search, page, initialData, lang, reloadKey]);

  return (
    <div>
      <div className="mb-8 flex flex-col gap-3 rounded-2xl border border-sand-200 bg-white p-3.5 shadow-xs sm:flex-row sm:flex-wrap sm:items-center sm:p-4">
        <div className="relative min-w-0 flex-1 sm:min-w-[200px]">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            placeholder={ui.searchPlaceholder}
            className="w-full rounded-xl border border-sand-200 bg-sand-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-brand-700 focus:bg-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:flex">
          <select
            value={category}
            onChange={(e) => {
              setPage(1);
              setCategory(e.target.value);
            }}
            aria-label={ui.allCategories}
            className="min-w-0 rounded-xl border border-sand-200 bg-sand-50 px-3 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-brand-700 focus:bg-white sm:text-sm"
          >
            <option value="">{ui.allCategories}</option>
            {data.facets?.categories?.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={year}
            onChange={(e) => {
              setPage(1);
              setYear(e.target.value);
            }}
            aria-label={ui.allYears}
            className="min-w-0 rounded-xl border border-sand-200 bg-sand-50 px-3 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-brand-700 focus:bg-white sm:text-sm"
          >
            <option value="">{ui.allYears}</option>
            {data.facets?.years?.map((y) => (
              <option key={y} value={String(y)}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-6 flex flex-col items-start justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800 sm:flex-row sm:items-center"
        >
          <span className="inline-flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </span>
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            className="shrink-0 rounded-xl bg-red-600 px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-red-700"
          >
            {lang === 'ta' ? 'மீண்டும் முயற்சிக்கவும்' : 'Retry'}
          </button>
        </div>
      )}

      {loading ? (
        <FolderGridSkeleton count={6} />
      ) : data.items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-sand-300 bg-white p-10 text-center sm:p-12">
          <FolderOpen className="mx-auto h-11 w-11 text-slate-400" />
          <p className="mt-4 text-sm font-medium text-slate-600">{ui.emptyGalleryFolders}</p>
        </div>
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((folder) => (
              <GalleryFolderCard key={folder.id} folder={folder} />
            ))}
          </div>

          {data.totalPages > 1 && (
            <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
              {Array.from({ length: data.totalPages }).map((_, idx) => {
                const p = idx + 1;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    className={`h-10 min-w-[40px] rounded-xl px-3 text-sm font-bold transition ${
                      p === data.page
                        ? 'bg-brand-900 text-white shadow-xs'
                        : 'border border-sand-200 bg-white text-slate-700 hover:bg-sand-100'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
