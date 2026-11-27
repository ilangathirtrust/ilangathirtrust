import type { Metadata } from 'next';
import { Eye, HeartHandshake, Target, Users } from 'lucide-react';
import { pickLocalized } from '@ilangathir/shared';
import { getBootstrap, getPageContent, getTeamMembers } from '@/lib/api';
import { getUi } from '@/lib/i18n';
import { getServerLang } from '@/lib/lang-server';
import { buildBreadcrumbJsonLd, buildPageMetadata } from '@/lib/seo';
import { PageHeader } from '@/components/PageHeader';
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

      <PageHeader
        crumbs={[{ label: ui.about }]}
        eyebrow={ui.aboutEyebrow}
        title={heroTitle}
        subtitle={heroSub}
        icon={HeartHandshake}
      />

      <section className="bg-ivory-100 py-14 lg:py-20">
        <div className="container-max grid items-center gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white p-3 shadow-md">
              <img src={founderImg} alt={founderName} className="h-96 w-full rounded-2xl object-cover object-top" />
            </div>
          </div>
          <div className="space-y-6 lg:col-span-7">
            <span className="section-kicker">{ui.founderEyebrow}</span>
            <h2 className="font-heading text-3xl font-bold text-brand-950">{founderName}</h2>
            {founderRole && <p className="text-sm font-bold text-brand-700">{founderRole}</p>}
            <p className="text-base leading-relaxed text-slate-600">{founderBio}</p>

            <div className="grid gap-4 pt-2 sm:grid-cols-2">
              <div className="editorial-card flex flex-col p-5">
                <Eye className="h-6 w-6 text-brand-700" />
                <h3 className="mt-3 font-heading text-base font-bold text-slate-900">{ui.visionTitle}</h3>
                <p className="mt-1.5 flex-1 text-sm text-slate-600">{vision}</p>
              </div>
              <div className="editorial-card flex flex-col p-5">
                <Target className="h-6 w-6 text-amberwarm-600" />
                <h3 className="mt-3 font-heading text-base font-bold text-slate-900">{ui.missionTitle}</h3>
                <p className="mt-1.5 flex-1 text-sm text-slate-600">{mission}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="team" className="border-t border-stone-200 bg-white py-14 lg:py-20">
        <div className="container-max">
          <div className="mb-10 flex items-center gap-3">
            <Users className="h-6 w-6 text-brand-700" />
            <h2 className="font-heading text-2xl font-bold text-brand-950 sm:text-3xl">
              {lang === 'ta' ? 'அறக்கட்டளை குழு & உறுப்பினர்கள்' : 'Trustees & Leadership Team'}
            </h2>
          </div>

          {team.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-ivory-50 p-10 text-center text-sm text-slate-600">
              {ui.emptyTeam}
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {team.map((member) => {
                const name = pickLocalized(member as unknown as Record<string, unknown>, 'name', lang);
                const role = pickLocalized(member as unknown as Record<string, unknown>, 'designation', lang);
                const bio = pickLocalized(member as unknown as Record<string, unknown>, 'biography', lang);
                return (
                  <article key={member.id} className="editorial-card flex h-full flex-col overflow-hidden">
                    {member.image_url && (
                      <div className="h-64 overflow-hidden bg-ivory-200">
                        <img src={member.image_url} alt={name} loading="lazy" className="h-full w-full object-cover object-top" />
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
          )}
        </div>
      </section>

      <FaqSection faqs={page?.faqs || []} />
    </>
  );
}
