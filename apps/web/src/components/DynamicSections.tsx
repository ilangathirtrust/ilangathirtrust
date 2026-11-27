import Link from 'next/link';
import { ArrowUpRight, BookOpen, Calendar, MapPin } from 'lucide-react';
import { pickLocalized, type Language } from '@ilangathir/shared';
import {
  getActivities,
  getBlogs,
  getBootstrap,
  getEvents,
  getGalleryFolders,
  getTeamMembers
} from '@/lib/api';
import { getUi } from '@/lib/i18n';
import { ActivityMarquee } from './ActivityMarquee';
import { GalleryFolderCard } from './GalleryFolderCard';
import { EventsExplorer } from './EventsExplorer';
import { GalleryExplorer } from './GalleryExplorer';
import { BlogExplorer } from './BlogExplorer';

export async function HomeMarqueeSection() {
  const bootstrap = await getBootstrap();
  return <ActivityMarquee items={bootstrap.marquee} />;
}

export async function HomeActivitiesSection({ lang }: { lang: Language }) {
  const ui = getUi(lang);
  const activitiesRes = await getActivities({ pageSize: 3 });

  return (
    <section className="lazy-section border-b border-slate-200 bg-white py-14 lg:py-16">
      <div className="container-max">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <span className="section-kicker">{ui.activitiesEyebrow}</span>
            <h2 className="mt-1.5 font-heading text-2xl font-bold text-slate-900 sm:text-3xl">
              {ui.activitiesTitle}
            </h2>
          </div>
          <Link href="/activities" className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 hover:text-brand-900">
            <span>{ui.viewAll}</span>
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        {activitiesRes.items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm text-slate-600">
            {ui.emptyActivities}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {activitiesRes.items.map((act) => {
              const title = pickLocalized(act as unknown as Record<string, unknown>, 'title', lang);
              const summary =
                pickLocalized(act as unknown as Record<string, unknown>, 'summary', lang) ||
                pickLocalized(act as unknown as Record<string, unknown>, 'description', lang);
              const location = pickLocalized(act as unknown as Record<string, unknown>, 'location', lang);
              return (
                <article key={act.id} className="editorial-card flex h-full flex-col overflow-hidden">
                  {act.image_url && (
                    <div className="h-48 overflow-hidden bg-slate-100">
                      <img src={act.image_url} alt={title} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col p-5">
                    <span className="text-xs font-bold uppercase tracking-wider text-brand-700">
                      {act.category}
                    </span>
                    <h3 className="mt-2 font-heading text-lg font-bold text-slate-900">{title}</h3>
                    <p className="mt-2 line-clamp-3 flex-1 text-sm text-slate-600">{summary}</p>
                    {location && (
                      <p className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <span>{location}</span>
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export async function HomeEventsSection({ lang }: { lang: Language }) {
  const ui = getUi(lang);
  const eventsRes = await getEvents({ timeframe: 'all', pageSize: 3 });

  return (
    <section className="lazy-section border-b border-slate-200 bg-white py-14 lg:py-16">
      <div className="container-max">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <span className="section-kicker">{ui.eventsEyebrow}</span>
            <h2 className="mt-1.5 font-heading text-2xl font-bold text-slate-900 sm:text-3xl">
              {ui.eventsTitle}
            </h2>
          </div>
          <Link href="/events" className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 hover:text-brand-900">
            <span>{ui.viewAll}</span>
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        {eventsRes.items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm text-slate-600">
            {ui.emptyUpcomingEvents}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {eventsRes.items.map((ev) => {
              const title = pickLocalized(ev as unknown as Record<string, unknown>, 'title', lang);
              const summary = pickLocalized(ev as unknown as Record<string, unknown>, 'summary', lang);
              return (
                <Link
                  key={ev.id}
                  href={`/events/${ev.slug}`}
                  className="editorial-card group flex h-full flex-col overflow-hidden"
                >
                  <div className="relative h-48 overflow-hidden bg-slate-100">
                    {ev.banner_url ? (
                      <img src={ev.banner_url} alt={title} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-brand-600">
                        <Calendar className="h-10 w-10" />
                      </div>
                    )}
                    <span className="absolute left-3 top-3 rounded-lg bg-white/95 px-2.5 py-1 text-xs font-bold text-slate-900 shadow-xs">
                      {ev.event_date}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-heading text-lg font-bold text-slate-900 group-hover:text-brand-700">{title}</h3>
                    {summary && <p className="mt-2 line-clamp-2 flex-1 text-sm text-slate-600">{summary}</p>}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export async function HomeGallerySection({ lang }: { lang: Language }) {
  const ui = getUi(lang);
  const galleryRes = await getGalleryFolders({ pageSize: 3 });

  return (
    <section className="lazy-section border-b border-slate-200 bg-white py-14 lg:py-16">
      <div className="container-max">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <span className="section-kicker">{ui.galleryEyebrow}</span>
            <h2 className="mt-1.5 font-heading text-2xl font-bold text-slate-900 sm:text-3xl">
              {ui.galleryTitle}
            </h2>
          </div>
          <Link href="/gallery" className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 hover:text-brand-900">
            <span>{ui.viewAll}</span>
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        {galleryRes.items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm text-slate-600">
            {ui.emptyGalleryFolders}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {galleryRes.items.map((folder) => (
              <GalleryFolderCard key={folder.id} folder={folder} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export async function HomeBlogsSection({ lang }: { lang: Language }) {
  const ui = getUi(lang);
  const blogsRes = await getBlogs({ pageSize: 3 });

  return (
    <section className="lazy-section bg-white py-14 lg:py-16">
      <div className="container-max">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <span className="section-kicker">{ui.blogEyebrow}</span>
            <h2 className="mt-1.5 font-heading text-2xl font-bold text-slate-900 sm:text-3xl">
              {ui.blogTitle}
            </h2>
          </div>
          <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 hover:text-brand-900">
            <span>{ui.viewAll}</span>
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        {blogsRes.items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm text-slate-600">
            {ui.emptyBlogs}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {blogsRes.items.map((post) => {
              const title = pickLocalized(post as unknown as Record<string, unknown>, 'title', lang);
              const excerpt = pickLocalized(post as unknown as Record<string, unknown>, 'excerpt', lang);
              return (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="editorial-card group flex h-full flex-col overflow-hidden"
                >
                  <div className="h-48 overflow-hidden bg-slate-100">
                    {post.featured_image_url ? (
                      <img src={post.featured_image_url} alt={title} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-brand-600">
                        <BookOpen className="h-10 w-10" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-heading text-lg font-bold text-slate-900 group-hover:text-brand-700">{title}</h3>
                    <p className="mt-2 line-clamp-2 flex-1 text-sm text-slate-600">{excerpt}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export async function AboutTeamSection({ lang }: { lang: Language }) {
  const ui = getUi(lang);
  const team = await getTeamMembers();

  if (team.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm text-slate-600">
        {ui.emptyTeam}
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {team.map((member) => {
        const name = pickLocalized(member as unknown as Record<string, unknown>, 'name', lang);
        const role = pickLocalized(member as unknown as Record<string, unknown>, 'designation', lang);
        const bio = pickLocalized(member as unknown as Record<string, unknown>, 'biography', lang);
        return (
          <article key={member.id} className="editorial-card flex h-full flex-col overflow-hidden">
            {member.image_url && (
              <div className="h-64 overflow-hidden bg-slate-100">
                <img src={member.image_url} alt={name} loading="lazy" decoding="async" className="h-full w-full object-cover object-top" />
              </div>
            )}
            <div className="flex flex-1 flex-col p-5">
              <h3 className="font-heading text-lg font-bold text-slate-900">{name}</h3>
              <p className="mt-1 text-xs font-bold text-brand-700">{role}</p>
              {bio && <p className="mt-3 flex-1 text-sm text-slate-600">{bio}</p>}
            </div>
          </article>
        );
      })}
    </div>
  );
}

export async function ActivitiesListSection({ lang, page }: { lang: Language; page: number }) {
  const ui = getUi(lang);
  const activitiesRes = await getActivities({ page, pageSize: 12 });

  if (activitiesRes.items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center text-sm text-slate-600">
        {ui.emptyActivities}
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {activitiesRes.items.map((act) => {
          const title = pickLocalized(act as unknown as Record<string, unknown>, 'title', lang);
          const desc = pickLocalized(act as unknown as Record<string, unknown>, 'description', lang);
          const location = pickLocalized(act as unknown as Record<string, unknown>, 'location', lang);
          return (
            <article key={act.id} className="editorial-card flex h-full flex-col overflow-hidden">
              {act.image_url && (
                <div className="h-52 overflow-hidden bg-slate-100">
                  <img src={act.image_url} alt={title} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                </div>
              )}
              <div className="flex flex-1 flex-col p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">
                    {act.category}
                  </span>
                  {act.impact_metric && (
                    <span className="text-xs font-bold text-tealcare-700">{act.impact_metric}</span>
                  )}
                </div>
                <h2 className="mt-3 font-heading text-xl font-bold text-slate-900">{title}</h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{desc}</p>
                <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
                  {act.activity_date && (
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-brand-600" />
                      {act.activity_date}
                    </span>
                  )}
                  {location && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-500" />
                      {location}
                    </span>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {activitiesRes.totalPages > 1 && (
        <div className="mt-10 flex justify-center gap-2">
          {Array.from({ length: activitiesRes.totalPages }).map((_, idx) => {
            const p = idx + 1;
            return (
              <Link
                key={p}
                href={`/activities?page=${p}`}
                className={`inline-flex h-10 min-w-[40px] items-center justify-center rounded-xl px-3 text-sm font-bold ${
                  p === page ? 'bg-brand-600 text-white' : 'border border-slate-200 bg-white text-slate-700'
                }`}
              >
                {p}
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}

export async function EventsExplorerSection() {
  const [upcoming, past] = await Promise.all([
    getEvents({ timeframe: 'upcoming', page: 1, pageSize: 9 }),
    getEvents({ timeframe: 'past', page: 1, pageSize: 9 })
  ]);
  return <EventsExplorer initialUpcoming={upcoming} initialPast={past} />;
}

export async function GalleryExplorerSection() {
  const foldersData = await getGalleryFolders({ page: 1, pageSize: 12 });
  return <GalleryExplorer initialData={foldersData} />;
}

export async function BlogExplorerSection() {
  const blogsData = await getBlogs({ page: 1, pageSize: 9 });
  return <BlogExplorer initialData={blogsData} />;
}
