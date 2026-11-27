'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Calendar, Clock, MapPin } from 'lucide-react';
import { pickLocalized, type EventItem, type PaginatedResponse } from '@ilangathir/shared';
import { API_URL } from '@/lib/api';
import { useLanguage } from './LanguageProvider';
import { getUi } from '@/lib/i18n';
import { CardGridSkeleton } from './Skeletons';
import { LazyImage } from './LazyPrimitives';

export function EventsExplorer({
  initialUpcoming,
  initialPast
}: {
  initialUpcoming: PaginatedResponse<EventItem>;
  initialPast: PaginatedResponse<EventItem>;
}) {
  const { lang } = useLanguage();
  const ui = getUi(lang);

  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PaginatedResponse<EventItem>>(initialUpcoming);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (page === 1) {
      setData(tab === 'upcoming' ? initialUpcoming : initialPast);
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetch(`${API_URL}/api/public/events?timeframe=${tab}&page=${page}&pageSize=9`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!cancelled && json) setData(json);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tab, page, initialUpcoming, initialPast]);

  return (
    <div>
      <div className="mb-8 inline-flex max-w-full flex-wrap rounded-2xl border border-sand-200 bg-white p-1.5 shadow-xs">
        <button
          type="button"
          onClick={() => {
            setTab('upcoming');
            setPage(1);
          }}
          className={`rounded-xl px-3.5 py-2 text-xs font-bold transition min-[360px]:px-5 min-[360px]:py-2.5 min-[360px]:text-sm ${
            tab === 'upcoming'
              ? 'bg-brand-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-brand-900'
          }`}
        >
          {ui.upcomingEvents} ({initialUpcoming.total})
        </button>
        <button
          type="button"
          onClick={() => {
            setTab('past');
            setPage(1);
          }}
          className={`rounded-xl px-3.5 py-2 text-xs font-bold transition min-[360px]:px-5 min-[360px]:py-2.5 min-[360px]:text-sm ${
            tab === 'past'
              ? 'bg-brand-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-brand-900'
          }`}
        >
          {ui.previousEvents} ({initialPast.total})
        </button>
      </div>

      {loading ? (
        <CardGridSkeleton count={6} />
      ) : data.items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-sand-300 bg-white p-10 text-center sm:p-12">
          <Calendar className="mx-auto h-11 w-11 text-slate-400" />
          <p className="mt-4 text-sm font-medium text-slate-600">
            {tab === 'upcoming' ? ui.emptyUpcomingEvents : ui.emptyPastEvents}
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((ev) => {
              const title = pickLocalized(ev as unknown as Record<string, unknown>, 'title', lang);
              const summary =
                pickLocalized(ev as unknown as Record<string, unknown>, 'summary', lang) ||
                pickLocalized(ev as unknown as Record<string, unknown>, 'description', lang);
              const location = pickLocalized(ev as unknown as Record<string, unknown>, 'location', lang);
              const d = new Date(ev.event_date);

              return (
                <article
                  key={ev.id}
                  className="trust-card group flex h-full flex-col overflow-hidden"
                >
                  <div className="relative h-52 overflow-hidden bg-sand-100">
                    {ev.banner_url ? (
                      <LazyImage
                        src={ev.banner_url}
                        alt={title}
                        wrapperClassName="h-full w-full"
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-brand-50 text-brand-700">
                        <Calendar className="h-12 w-12" />
                      </div>
                    )}
                    <div className="absolute left-3.5 top-3.5 rounded-xl bg-white/95 px-3 py-1.5 text-center shadow-md">
                      <span className="block font-heading text-lg font-extrabold leading-none text-brand-900">
                        {String(d.getDate()).padStart(2, '0')}
                      </span>
                      <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-wider text-saffron-700">
                        {d.toLocaleDateString(lang === 'ta' ? 'ta-IN' : 'en-US', { month: 'short' })}
                      </span>
                    </div>
                    <span className="absolute right-3.5 top-3.5 rounded-full bg-brand-950/80 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                      {ev.category}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-4 min-[360px]:p-5">
                    <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-500">
                      {location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-saffron-600" />
                          <span className="truncate">{location}</span>
                        </span>
                      )}
                      {ev.start_time && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 shrink-0 text-brand-700" />
                          {ev.start_time.slice(0, 5)}
                        </span>
                      )}
                    </div>

                    <h3 className="mt-2.5 font-heading text-base font-bold text-brand-900 sm:text-lg">
                      {title}
                    </h3>
                    <p className="mt-2 line-clamp-3 flex-1 text-sm text-slate-600">{summary}</p>

                    <div className="mt-5 flex items-center justify-between border-t border-sand-100 pt-4">
                      <Link
                        href={`/events/${ev.slug}`}
                        className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-800 transition hover:text-saffron-600"
                      >
                        <span>{ui.viewDetails}</span>
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                      {ev.gallery_folder_slug && (
                        <Link
                          href={`/gallery/${ev.gallery_folder_slug}`}
                          className="rounded-lg bg-sand-100 px-2.5 py-1 text-xs font-semibold text-brand-900 transition hover:bg-sand-200"
                        >
                          {ui.gallery}
                        </Link>
                      )}
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
