import type { Metadata } from 'next';
import { Eye, HeartHandshake, Target, Users } from 'lucide-react';
import { pickLocalized } from '@ilangathir/shared';
import { getBootstrap, getPageContent, getTeamMembers } from '@/lib/api';
import { getUi } from '@/lib/i18n';
import { getServerLang } from '@/lib/lang-server';
import { buildBreadcrumbJsonLd, buildPageMetadata } from '@/lib/seo';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { FaqSection } from '@/components/FaqSection';

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ lang?: string }> }): Promise<Metadata> {
  const lang = await getServerLang((await searchParams).lang);
  const page = await getPageContent('about');
  return buildPageMetadata({
    title: (page && pickLocalized(page as unknown as Record<string, unknown>, 'seo_title', lang)) || (lang === 'ta' ? 'எங்களைப் பற்றி | இளங்கதிர் அறக்கட்டளை' : 'About Us | Ilangathir Trust'),
    description: (page && pickLocalized(page as unknown as Record<string, unknown>, 'seo_description', lang)) || (lang === 'ta' ? 'இளங்கதிர் அறக்கட்டளையின் நோக்கம், தொலைநோக்கு மற்றும் குழு.' : 'Mission, vision, founder, and leadership team of Ilangathir Trust.'),
    path: '/about',
    lang
  });
}

export default async function AboutPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const lang = await getServerLang((await searchParams).lang);
  const ui = getUi(lang);
  const [bootstrap, page, team] = await Promise.all([
    getBootstrap(),
    getPageContent('about'),
    getTeamMembers()
  ]);

  const { settings } = bootstrap;
  const heroTitle = (page && pickLocalized(page as unknown as Record<string, unknown>, 'hero_title', lang)) || ui.about;
  const heroSub = (page && pickLocalized(page as unknown as Record<string, unknown>, 'hero_subtitle', lang)) || '';

  const founderName = (lang === 'ta' ? settings.founder_name?.value_ta : settings.founder_name?.value_en) || 'Founder';
  const founderRole = (lang === 'ta' ? settings.founder_role?.value_ta : settings.founder_role?.value_en) || '';
  const founderBio = (lang === 'ta' ? settings.founder_bio?.value_ta : settings.founder_bio?.value_en) || '';
  const founderImg = settings.founder_image_url?.value_en || '/assets/founder.jpg';
  const mission = (lang === 'ta' ? settings.mission_statement?.value_ta : settings.mission_statement?.value_en) || '';
  const vision = (lang === 'ta' ? settings.vision_statement?.value_ta : settings.vision_statement?.value_en) || '';

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: ui.home, path: '/' },
    { name: ui.about, path: '/about' }
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <section className="border-b border-slate-200 bg-white py-12 lg:py-16">
        <div className="container-max">
          <Breadcrumbs items={[{ label: ui.about }]} />
          <span className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-brand-600">
            <HeartHandshake className="h-4 w-4" />
            {ui.aboutEyebrow}
          </span>
          <h1 className="mt-3 max-w-3xl font-heading text-3xl font-extrabold text-slate-900 sm:text-5xl">
            {heroTitle}
          </h1>
          {heroSub && <p className="mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">{heroSub}</p>}
        </div>
      </section>

      <section className="bg-slate-50 py-14 lg:py-20">
        <div className="container-max grid items-center gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-3 shadow-lg">
              <img src={founderImg} alt={founderName} className="h-96 w-full rounded-2xl object-cover object-top" />
            </div>
          </div>
          <div className="space-y-6 lg:col-span-7">
            <span className="text-xs font-extrabold uppercase tracking-widest text-brand-600">{ui.founderEyebrow}</span>
            <h2 className="font-heading text-3xl font-bold text-slate-900">{founderName}</h2>
            {founderRole && <p className="text-sm font-bold text-brand-600">{founderRole}</p>}
            <p className="text-base leading-relaxed text-slate-600">{founderBio}</p>

            <div className="grid gap-4 pt-2 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <Eye className="h-6 w-6 text-brand-600" />
                <h3 className="mt-3 font-heading text-base font-bold text-slate-900">{ui.visionTitle}</h3>
                <p className="mt-1.5 text-sm text-slate-600">{vision}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <Target className="h-6 w-6 text-amberwarm-600" />
                <h3 className="mt-3 font-heading text-base font-bold text-slate-900">{ui.missionTitle}</h3>
                <p className="mt-1.5 text-sm text-slate-600">{mission}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="team" className="bg-white py-14 lg:py-20">
        <div className="container-max">
          <div className="mb-10 flex items-center gap-3">
            <Users className="h-6 w-6 text-brand-600" />
            <h2 className="font-heading text-2xl font-bold text-slate-900 sm:text-3xl">
              {lang === 'ta' ? 'அறக்கட்டளை குழு & உறுப்பினர்கள்' : 'Trustees & Leadership Team'}
            </h2>
          </div>

          {team.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm text-slate-600">
              {ui.emptyTeam}
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {team.map((member) => {
                const name = pickLocalized(member as unknown as Record<string, unknown>, 'name', lang);
                const role = pickLocalized(member as unknown as Record<string, unknown>, 'designation', lang);
                const bio = pickLocalized(member as unknown as Record<string, unknown>, 'biography', lang);
                return (
                  <article key={member.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    {member.image_url && (
                      <div className="h-64 overflow-hidden bg-slate-100">
                        <img src={member.image_url} alt={name} loading="lazy" className="h-full w-full object-cover object-top" />
                      </div>
                    )}
                    <div className="p-5">
                      <h3 className="font-heading text-lg font-bold text-slate-900">{name}</h3>
                      <p className="text-xs font-bold text-brand-600">{role}</p>
                      {bio && <p className="mt-3 text-sm text-slate-600">{bio}</p>}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <FaqSection faqs={page?.faqs || []} />
    </>
  );
}
