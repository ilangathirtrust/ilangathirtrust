import type { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, MapPin, Sparkles } from 'lucide-react';
import { pickLocalized } from '@ilangathir/shared';
import { getActivities, getPageContent } from '@/lib/api';
import { getUi } from '@/lib/i18n';
import { getServerLang } from '@/lib/lang-server';
import { buildBreadcrumbJsonLd, buildPageMetadata } from '@/lib/seo';
import { PageHeader } from '@/components/PageHeader';

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ lang?: string }> }): Promise<Metadata> {
  const lang = await getServerLang((await searchParams).lang);
  const page = await getPageContent('activities');
  return buildPageMetadata({
    title: (page && pickLocalized(page as unknown as Record<string, unknown>, 'seo_title', lang)) || (lang === 'ta' ? 'செயல்பாடுகள் | இளங்கதிர் அறக்கட்டளை' : 'Activities | Ilangathir Trust'),
    description: (page && pickLocalized(page as unknown as Record<string, unknown>, 'seo_description', lang)) || (lang === 'ta' ? 'இளங்கதிர் அறக்கட்டளையின் நலத்திட்ட செயல்பாடுகள்.' : 'Verified community welfare and social service programmes of Ilangathir Trust.'),
    path: '/activities',
    lang
  });
}

export default async function ActivitiesPage({
  searchParams
}: {
  searchParams: Promise<{ lang?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const lang = await getServerLang(sp.lang);
  const ui = getUi(lang);
  const currentPage = Math.max(1, Number(sp.page) || 1);

  const [pageContent, activitiesRes] = await Promise.all([
    getPageContent('activities'),
    getActivities({ page: currentPage, pageSize: 12 })
  ]);

  const heroTitle = (pageContent && pickLocalized(pageContent as unknown as Record<string, unknown>, 'hero_title', lang)) || ui.activitiesTitle;
  const heroSub = (pageContent && pickLocalized(pageContent as unknown as Record<string, unknown>, 'hero_subtitle', lang)) || '';

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: ui.home, path: '/' },
    { name: ui.activities, path: '/activities' }
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <PageHeader
        crumbs={[{ label: ui.activities }]}
        eyebrow={ui.activitiesEyebrow}
        title={heroTitle}
        subtitle={heroSub}
        icon={Sparkles}
      />

      <section className="bg-ivory-100 py-14 lg:py-20">
        <div className="container-max">
          {activitiesRes.items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center text-sm text-slate-600">
              {ui.emptyActivities}
            </div>
          ) : (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {activitiesRes.items.map((act) => {
                  const title = pickLocalized(act as unknown as Record<string, unknown>, 'title', lang);
                  const desc = pickLocalized(act as unknown as Record<string, unknown>, 'description', lang);
                  const location = pickLocalized(act as unknown as Record<string, unknown>, 'location', lang);
                  return (
                    <article key={act.id} className="editorial-card flex h-full flex-col overflow-hidden">
                      {act.image_url && (
                        <div className="h-52 overflow-hidden bg-ivory-200">
                          <img src={act.image_url} alt={title} loading="lazy" className="h-full w-full object-cover" />
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
                        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-stone-100 pt-3 text-xs text-slate-500">
                          {act.activity_date && (
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 text-brand-600" />
                              {act.activity_date}
                            </span>
                          )}
                          {location && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 text-amberwarm-600" />
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
                          p === currentPage ? 'bg-brand-600 text-white' : 'border border-stone-200 bg-white text-slate-700'
                        }`}
                      >
                        {p}
                      </Link>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
