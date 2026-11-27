import type { Metadata } from 'next';
import { CalendarDays } from 'lucide-react';
import { pickLocalized } from '@ilangathir/shared';
import { getEvents, getPageContent } from '@/lib/api';
import { getUi } from '@/lib/i18n';
import { getServerLang } from '@/lib/lang-server';
import { buildBreadcrumbJsonLd, buildPageMetadata } from '@/lib/seo';
import { PageHeader } from '@/components/PageHeader';
import { EventsExplorer } from '@/components/EventsExplorer';

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ lang?: string }> }): Promise<Metadata> {
  const lang = await getServerLang((await searchParams).lang);
  const page = await getPageContent('events');
  return buildPageMetadata({
    title: (page && pickLocalized(page as unknown as Record<string, unknown>, 'seo_title', lang)) || (lang === 'ta' ? 'நிகழ்வுகள் | இளங்கதிர் அறக்கட்டளை' : 'Events | Ilangathir Trust'),
    description: (page && pickLocalized(page as unknown as Record<string, unknown>, 'seo_description', lang)) || (lang === 'ta' ? 'வரவிருக்கும் மற்றும் நடைபெற்ற சமூக நிகழ்வுகள்.' : 'Upcoming and completed community events by Ilangathir Trust.'),
    path: '/events',
    lang
  });
}

export default async function EventsPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const lang = await getServerLang((await searchParams).lang);
  const ui = getUi(lang);

  const [pageContent, upcoming, past] = await Promise.all([
    getPageContent('events'),
    getEvents({ timeframe: 'upcoming', page: 1, pageSize: 9 }),
    getEvents({ timeframe: 'past', page: 1, pageSize: 9 })
  ]);

  const heroTitle = (pageContent && pickLocalized(pageContent as unknown as Record<string, unknown>, 'hero_title', lang)) || ui.eventsTitle;
  const heroSub = (pageContent && pickLocalized(pageContent as unknown as Record<string, unknown>, 'hero_subtitle', lang)) || '';

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: ui.home, path: '/' },
    { name: ui.events, path: '/events' }
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <PageHeader
        crumbs={[{ label: ui.events }]}
        eyebrow={ui.eventsEyebrow}
        title={heroTitle}
        subtitle={heroSub}
        icon={CalendarDays}
      />

      <section className="bg-white py-14 lg:py-16">
        <div className="container-max">
          <EventsExplorer initialUpcoming={upcoming} initialPast={past} />
        </div>
      </section>
    </>
  );
}
