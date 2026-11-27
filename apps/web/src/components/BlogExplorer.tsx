'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, BookOpen, Clock, Search, User } from 'lucide-react';
import { pickLocalized, type BlogPost, type PaginatedResponse } from '@ilangathir/shared';
import { API_URL } from '@/lib/api';
import { useLanguage } from './LanguageProvider';
import { getUi } from '@/lib/i18n';
import { CardGridSkeleton } from './Skeletons';

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

  useEffect(() => {
    if (!category && !search && page === 1) {
      setData(initialData);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const q = new URLSearchParams();
        if (category) q.set('category', category);
        if (search) q.set('search', search);
        q.set('page', String(page));
        q.set('pageSize', '9');
        const res = await fetch(`${API_URL}/api/public/blogs?${q.toString()}`, { signal: controller.signal });
        if (res.ok) setData(await res.json());
      } catch {
        // ignore abort
      } finally {
        setLoading(false);
      }
    }, search ? 250 : 0);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [category, search, page, initialData]);

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setPage(1);
              setCategory('');
            }}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              category === ''
                ? 'bg-brand-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
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
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                category === cat.slug
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
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
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand-500 focus:bg-white"
          />
        </div>
      </div>

      {loading ? (
        <CardGridSkeleton count={6} />
      ) : data.items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-slate-400" />
          <p className="mt-4 text-sm font-medium text-slate-600">{ui.emptyBlogs}</p>
        </div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((post) => {
              const title = pickLocalized(post as unknown as Record<string, unknown>, 'title', lang);
              const excerpt = pickLocalized(post as unknown as Record<string, unknown>, 'excerpt', lang);
              const alt = pickLocalized(post as unknown as Record<string, unknown>, 'featured_image_alt', lang) || title;
              const catName = lang === 'ta' ? post.category_name_ta : post.category_name_en;

              return (
                <article
                  key={post.id}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <Link href={`/blog/${post.slug}`} className="relative block h-52 overflow-hidden bg-slate-100">
                    {post.featured_image_url ? (
                      <img
                        src={post.featured_image_url}
                        alt={alt}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-brand-50 text-brand-400">
                        <BookOpen className="h-12 w-12" />
                      </div>
                    )}
                    {catName && (
                      <span className="absolute left-3.5 top-3.5 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-brand-700 shadow-sm">
                        {catName}
                      </span>
                    )}
                  </Link>

                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <User className="h-3.5 w-3.5 text-brand-600" />
                        {post.author_name}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-amberwarm-600" />
                        {post.reading_time_minutes} {ui.minRead}
                      </span>
                    </div>

                    <h3 className="mt-2.5 font-heading text-lg font-bold text-slate-900">
                      <Link href={`/blog/${post.slug}`} className="transition group-hover:text-brand-600">
                        {title}
                      </Link>
                    </h3>
                    <p className="mt-2 line-clamp-3 flex-1 text-sm text-slate-600">{excerpt}</p>

                    <div className="mt-5 border-t border-slate-100 pt-4">
                      <Link
                        href={`/blog/${post.slug}`}
                        className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-600 transition hover:text-brand-700"
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
            <div className="mt-10 flex justify-center gap-2">
              {Array.from({ length: data.totalPages }).map((_, idx) => {
                const p = idx + 1;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    className={`h-10 min-w-[40px] rounded-xl px-3 text-sm font-bold ${
                      p === data.page ? 'bg-brand-600 text-white' : 'border border-slate-200 bg-white text-slate-700'
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
