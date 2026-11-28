import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, HeartHandshake, Leaf, ShieldCheck, Stethoscope, Users } from 'lucide-react';
import { getUi } from '@/lib/i18n';
import { getServerLang } from '@/lib/lang-server';
import { buildBreadcrumbJsonLd, buildPageMetadata, buildWebPageJsonLd } from '@/lib/seo';
import { PERMANENT_PAGES } from '@/lib/site-content';
import { PageHeader } from '@/components/PageHeader';
import { VolunteerForm } from '@/components/ContactForms';

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ lang?: string }> }): Promise<Metadata> {
  const lang = await getServerLang((await searchParams).lang);
  const p = PERMANENT_PAGES.volunteer;
  return buildPageMetadata({
    title: lang === 'ta' ? p.seo_title_ta : p.seo_title_en,
    description: lang === 'ta' ? p.seo_description_ta : p.seo_description_en,
    keywords: lang === 'ta' ? p.keywords_ta : p.keywords_en,
    path: '/volunteer',
    lang
  });
}

export default async function VolunteerPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const lang = await getServerLang((await searchParams).lang);
  const ui = getUi(lang);
  const p = PERMANENT_PAGES.volunteer;

  const webPageJsonLd = buildWebPageJsonLd({
    title: lang === 'ta' ? p.seo_title_ta : p.seo_title_en,
    description: lang === 'ta' ? p.seo_description_ta : p.seo_description_en,
    path: '/volunteer',
    lang
  });
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: ui.home, path: '/' },
    { name: ui.volunteer, path: '/volunteer' }
  ]);

  const roles = [
    {
      icon: BookOpen,
      title: lang === 'ta' ? 'கல்வி & மாணவர் வழிகாட்டல்' : 'Student Education Support',
      desc:
        lang === 'ta'
          ? 'பள்ளி மாணவர்களுக்குப் புத்தக விநியோகம் மற்றும் வார இறுதி கற்றல் உதவி.'
          : 'Assist with school supply kits, student mentoring, and weekend learning drives.'
    },
    {
      icon: Stethoscope,
      title: lang === 'ta' ? 'மருத்துவ முகாம் ஒருங்கிணைப்பு' : 'Medical & Eye Camp Support',
      desc:
        lang === 'ta'
          ? 'கிராமப்புற மருத்துவ மற்றும் கண் பரிசோதனை முகாம்களில் நோயாளி வழிகாட்டல்.'
          : 'Help register patients, organize queues, and guide elders at free village health camps.'
    },
    {
      icon: Leaf,
      title: lang === 'ta' ? 'மரம் நடுதல் & நிவாரணப் பணி' : 'Environment & Community Relief',
      desc:
        lang === 'ta'
          ? 'மரக்கன்று நடுதல், பராமரிப்பு மற்றும் குடும்ப நலப் பொருட்கள் விநியோகம்.'
          : 'Participate in tree planting drives, cleanups, and community aid distribution.'
    }
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <PageHeader
        crumbs={[{ label: ui.volunteer }]}
        eyebrow={lang === 'ta' ? p.eyebrow_ta : p.eyebrow_en}
        title={lang === 'ta' ? p.title_ta : p.title_en}
        subtitle={lang === 'ta' ? p.subtitle_ta : p.subtitle_en}
        icon={HeartHandshake}
      />

      <section className="bg-sand-50 py-10 sm:py-14 lg:py-16">
        <div className="container-max grid gap-8 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-7">
            <VolunteerForm />
          </div>

          <aside className="min-w-0 space-y-5 lg:col-span-5">
            <div className="trust-card p-5 sm:p-6">
              <div className="flex items-center gap-2.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-saffron-50 text-saffron-600">
                  <Users className="h-5 w-5" />
                </span>
                <h2 className="font-heading text-lg font-bold text-brand-900">
                  {lang === 'ta' ? 'எவ்வாறு உதவலாம்?' : 'Ways You Can Help'}
                </h2>
              </div>

              <div className="mt-4 space-y-3.5">
                {roles.map((r) => {
                  const Icon = r.icon;
                  return (
                    <div key={r.title} className="flex items-start gap-3 rounded-2xl border border-sand-200 bg-sand-50/70 p-3.5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-brand-800 shadow-xs">
                        <Icon className="h-4 w-4 text-saffron-600" />
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-brand-900">{r.title}</h3>
                        <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{r.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="trust-card p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <div className="text-xs leading-relaxed text-slate-600 sm:text-sm">
                  <p className="font-bold text-brand-900">
                    {lang === 'ta' ? 'கேள்வி உள்ளதா?' : 'Have a general question?'}
                  </p>
                  <p className="mt-1">
                    {lang === 'ta'
                      ? 'அலுவலகத் தொடர்புக்கு அல்லது நேரடி விசாரணைக்கு எங்கள் தொடர்பு பக்கத்தைப் பார்க்கவும்.'
                      : 'Need to reach our office directly or view our Dindigul map? Visit our Contact page.'}
                  </p>
                  <Link
                    href="/contact"
                    className="mt-2.5 inline-flex font-bold text-brand-800 underline hover:text-saffron-600"
                  >
                    {ui.contact} →
                  </Link>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
