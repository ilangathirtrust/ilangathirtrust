'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowUpRight, BookOpen, Clock, Search, User } from 'lucide-react';
import { pickLocalized, type BlogPost, type PaginatedResponse } from '@ilangathir/shared';
import { API_URL } from '@/lib/api';
import { formatClientError, readApiResponse } from '@/lib/client-error';
import { useLanguage } from './LanguageProvider';
import { getUi } from '@/lib/i18n';
import { CardGridSkeleton } from './Skeletons';
import { LazyImage } from './LazyPrimitives';

interface BlogExplorerProps {
  initialData: PaginatedResponse<BlogPost> & {
    categories: Array<{ id: string; slug: string; name_en: string; name_ta: string }>;
  };
}

export function BlogExplorer({ initialData }: BlogExplorerProps) {
  const { lang } = useLanguage();
  const ui = getUi(lang);

  const [data, setData] = useState(initialData);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!category && !search && page === 1 && reloadKey === 0) {
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
        if (search) q.set('search', search);
        q.set('page', String(page));
        q.set('pageSize', '9');
        const res = await fetch(`${API_URL}/api/public/blogs?${q.toString()}`, { signal: controller.signal });
        const json = await readApiResponse<BlogExplorerProps['initialData']>(
          res,
          lang,
          'Could not load blog articles.',
          'கட்டுரைகளை ஏற்ற முடியவில்லை.'
        );
        setData(json);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(
          formatClientError(
            err,
            lang,
            'Could not load blog articles. Please try again.',
            'கட்டுரைகளை ஏற்ற முடியவில்லை. மீண்டும் முயற்சிக்கவும்.'
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
  }, [category, search, page, initialData, lang, reloadKey]);

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-sand-200 bg-white p-3.5 shadow-xs sm:p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setPage(1);
              setCategory('');
            }}
            className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${
              category === ''
                ? 'bg-brand-900 text-white'
                : 'bg-sand-100 text-slate-700 hover:bg-sand-200'
            }`}
          >
            {ui.allCategories}
          </button>
          {data.categories?.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setPage(1);
                setCategory(cat.slug);
              }}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                category === cat.slug
                  ? 'bg-brand-900 text-white'
                  : 'bg-sand-100 text-slate-700 hover:bg-sand-200'
              }`}
            >
              {lang === 'ta' ? cat.name_ta : cat.name_en}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            placeholder={ui.searchPlaceholder}
            className="w-full rounded-xl border border-sand-200 bg-sand-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand-700 focus:bg-white"
          />
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
        <CardGridSkeleton count={6} />
      ) : data.items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-sand-300 bg-white p-10 text-center sm:p-12">
          <BookOpen className="mx-auto h-11 w-11 text-slate-400" />
          <p className="mt-4 text-sm font-medium text-slate-600">{ui.emptyBlogs}</p>
        </div>
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((post) => {
              const title = pickLocalized(post as unknown as Record<string, unknown>, 'title', lang);
              const excerpt = pickLocalized(post as unknown as Record<string, unknown>, 'excerpt', lang);
              const alt = pickLocalized(post as unknown as Record<string, unknown>, 'featured_image_alt', lang) || title;
              const catName = lang === 'ta' ? post.category_name_ta : post.category_name_en;

              return (
                <article
                  key={post.id}
                  className="trust-card group flex h-full flex-col overflow-hidden"
                >
                  <Link href={`/blog/${post.slug}`} className="relative block h-52 overflow-hidden bg-sand-100">
                    {post.featured_image_url ? (
                      <LazyImage
                        src={post.featured_image_url}
                        alt={alt}
                        wrapperClassName="h-full w-full"
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-brand-50 text-brand-700">
                        <BookOpen className="h-12 w-12" />
                      </div>
                    )}
                    {catName && (
                      <span className="absolute left-3.5 top-3.5 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-brand-900 shadow-sm">
                        {catName}
                      </span>
                    )}
                  </Link>

                  <div className="flex flex-1 flex-col p-4 min-[360px]:p-5">
                    <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <User className="h-3.5 w-3.5 text-brand-700" />
                        <span className="truncate">{post.author_name}</span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-saffron-600" />
                        {post.reading_time_minutes} {ui.minRead}
                      </span>
                    </div>

                    <h3 className="mt-2.5 font-heading text-base font-bold text-brand-900 sm:text-lg">
                      <Link href={`/blog/${post.slug}`} className="transition group-hover:text-saffron-600">
                        {title}
                      </Link>
                    </h3>
                    <p className="mt-2 line-clamp-3 flex-1 text-sm text-slate-600">{excerpt}</p>

                    <div className="mt-5 border-t border-sand-100 pt-4">
                      <Link
                        href={`/blog/${post.slug}`}
                        className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-800 transition hover:text-saffron-600"
                      >
                        <span>{ui.readMore}</span>
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {data.totalPages > 1 && (
            <div className="mt-10 flex flex-wrap justify-center gap-2">
              {Array.from({ length: data.totalPages }).map((_, idx) => {
                const p = idx + 1;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    className={`h-10 min-w-[40px] rounded-xl px-3 text-sm font-bold ${
                      p === data.page ? 'bg-brand-900 text-white' : 'border border-sand-200 bg-white text-slate-700 hover:bg-sand-100'
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
