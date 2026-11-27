import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Calendar,
  Eye,
  Heart,
  HeartHandshake,
  MapPin,
  ShieldCheck,
  Target,
  Users
} from 'lucide-react';
import { pickLocalized } from '@ilangathir/shared';
import {
  getActivities,
  getBlogs,
  getBootstrap,
  getEvents,
  getGalleryFolders
} from '@/lib/api';
import { getUi } from '@/lib/i18n';
import { getServerLang } from '@/lib/lang-server';
import { buildFaqJsonLd, buildPageMetadata } from '@/lib/seo';
import { ActivityMarquee } from '@/components/ActivityMarquee';
import { GalleryFolderCard } from '@/components/GalleryFolderCard';
import { FaqSection } from '@/components/FaqSection';

export async function generateMetadata({
  searchParams
}: {
  searchParams: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const lang = await getServerLang(sp.lang);
  const bootstrap = await getBootstrap();
  const home = bootstrap.homePage;

  const title =
    (home ? pickLocalized(home as unknown as Record<string, unknown>, 'seo_title', lang) : '') ||
    (lang === 'ta'
      ? 'இளங்கதிர் அறக்கட்டளை | சமூக நலன், கல்வி & தொண்டு சேவை'
      : 'Ilangathir Trust | Community Welfare, Education & Social Service');
  const description =
    (home ? pickLocalized(home as unknown as Record<string, unknown>, 'seo_description', lang) : '') ||
    (lang === 'ta'
      ? 'திண்டுக்கல் V. கல்லுப்பட்டி இளங்கதிர் அறக்கட்டளையின் அதிகாரப்பூர்வ இணையதளம்.'
      : 'Official website of Ilangathir Trust (Ilangathir Arakattalai), V. Kallupatti, Dindigul, Tamil Nadu.');

  return buildPageMetadata({
    title,
    description,
    path: '/',
    lang,
    ogImage: home?.og_image_url || undefined
  });
}

export default async function HomePage({
  searchParams
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const sp = await searchParams;
  const lang = await getServerLang(sp.lang);
  const ui = getUi(lang);

  const [bootstrap, activitiesRes, eventsRes, galleryRes, blogsRes] = await Promise.all([
    getBootstrap(),
    getActivities({ pageSize: 3 }),
    getEvents({ timeframe: 'all', pageSize: 3 }),
    getGalleryFolders({ pageSize: 3 }),
    getBlogs({ pageSize: 3 })
  ]);

  const { settings, marquee, homePage } = bootstrap;

  const heroEyebrow =
    (homePage && pickLocalized(homePage as unknown as Record<string, unknown>, 'hero_eyebrow', lang)) ||
    (lang === 'ta' ? 'V. கல்லுப்பட்டி, திண்டுக்கல் • தமிழ்நாடு' : 'V. Kallupatti, Dindigul • Tamil Nadu');

  const heroTitle =
    (homePage && pickLocalized(homePage as unknown as Record<string, unknown>, 'hero_title', lang)) ||
    (lang === 'ta'
      ? 'நலமான சமுதாயத்தை உருவாக்க, அனைவரும் இணைந்து செயல்படுவோம்.'
      : 'Serving communities with care and responsibility.');

  const heroSubtitle =
    (homePage && pickLocalized(homePage as unknown as Record<string, unknown>, 'hero_subtitle', lang)) ||
    (lang === 'ta'
      ? 'கல்வி உதவி, இலவச மருத்துவ முகாம், மரம் நடுதல் மற்றும் சமூக நலப் பணிகளில் இளங்கதிர் அறக்கட்டளை தொடர்ந்து செயல்பட்டு வருகிறது.'
      : 'Ilangathir Trust works across Tamil Nadu to support student education, medical outreach, tree planting, and timely relief for families in need.');

  const heroImage = homePage?.hero_image_url || '/assets/herosection.png';
  const primaryCtaLabel =
    (homePage && pickLocalized(homePage as unknown as Record<string, unknown>, 'hero_cta_primary', lang)) ||
    ui.donateNow;
  const primaryCtaHref = homePage?.hero_cta_primary_href || '/donate';
  const secondaryCtaLabel =
    (homePage && pickLocalized(homePage as unknown as Record<string, unknown>, 'hero_cta_secondary', lang)) ||
    ui.activities;
  const secondaryCtaHref = homePage?.hero_cta_secondary_href || '/activities';

  const founderName =
    (lang === 'ta' ? settings.founder_name?.value_ta : settings.founder_name?.value_en) ||
    (lang === 'ta' ? 'நிறுவனர் — இளங்கதிர் அறக்கட்டளை' : 'Founder — Ilangathir Trust');
  const founderRole =
    (lang === 'ta' ? settings.founder_role?.value_ta : settings.founder_role?.value_en) ||
    (lang === 'ta' ? 'நிறுவனர் & நிர்வாக அறங்காவலர்' : 'Founder & Managing Trustee');
  const founderBio =
    (lang === 'ta' ? settings.founder_bio?.value_ta : settings.founder_bio?.value_en) || '';
  const founderImg = settings.founder_image_url?.value_en || '/assets/founder.jpg';

  const mission = (lang === 'ta' ? settings.mission_statement?.value_ta : settings.mission_statement?.value_en) || '';
  const vision = (lang === 'ta' ? settings.vision_statement?.value_ta : settings.vision_statement?.value_en) || '';

  const faqs = homePage?.faqs || [];
  const faqJsonLd = buildFaqJsonLd(faqs, lang);

  return (
    <>
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}

      {/* 1. CLEAN INSTITUTIONAL HERO */}
      <section className="border-b border-slate-200 bg-white">
        <div className="container-max py-10 sm:py-14 lg:py-16">
          <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="space-y-6 lg:col-span-7">
              <p className="text-xs font-bold uppercase tracking-wider text-brand-700">
                {heroEyebrow}
              </p>

              <h1
                className={`font-heading font-extrabold text-slate-900 ${
                  lang === 'ta'
                    ? 'text-2xl leading-[1.38] sm:text-4xl lg:text-[42px]'
                    : 'text-3xl leading-[1.15] tracking-tight sm:text-5xl lg:text-[50px]'
                }`}
              >
                {heroTitle}
              </h1>

              <p className="max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
                {heroSubtitle}
              </p>

              <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:flex-wrap sm:items-center">
                <Link
                  href={primaryCtaHref}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-brand-700"
                >
                  <Heart className="h-4 w-4 shrink-0" />
                  <span>{primaryCtaLabel}</span>
                </Link>
                <Link
                  href={secondaryCtaHref}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-bold text-slate-800 transition hover:border-brand-400 hover:text-brand-700"
                >
                  <span>{secondaryCtaLabel}</span>
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-5 border-t border-slate-200 pt-6 sm:grid-cols-3">
                <div>
                  <p className="font-heading text-base font-bold text-slate-900">
                    {lang === 'ta' ? 'பதிவு பெற்ற அறக்கட்டளை' : 'Registered Trust'}
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-slate-600">
                    {lang === 'ta' ? 'திண்டுக்கல், தமிழ்நாடு' : 'V. Kallupatti, Dindigul'}
                  </p>
                </div>
                <div>
                  <p className="font-heading text-base font-bold text-slate-900">
                    {lang === 'ta' ? 'முக்கியப் பணிகள்' : 'Core Focus'}
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-slate-600">
                    {lang === 'ta' ? 'கல்வி • மருத்துவம் • உதவி' : 'Education • Health • Relief'}
                  </p>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <p className="font-heading text-base font-bold text-slate-900">
                    {lang === 'ta' ? 'முறையான ரசீது' : 'Direct Receipts'}
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-slate-600">
                    {lang === 'ta' ? 'பாதுகாப்பான ஆன்லைன் உதவி' : 'Verified Online Donations'}
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="mx-auto max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm lg:max-w-none">
                <img
                  src={heroImage}
                  alt={heroTitle}
                  className="h-72 w-full object-cover sm:h-[420px]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FOUR PRINCIPLES */}
      <section className="border-b border-slate-200 bg-white py-10">
        <div className="container-max">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Heart, title: ui.valCompassionTitle, desc: ui.valCompassionDesc },
              { icon: ShieldCheck, title: ui.valEqualityTitle, desc: ui.valEqualityDesc },
              { icon: Users, title: ui.valCommunityTitle, desc: ui.valCommunityDesc },
              { icon: HeartHandshake, title: ui.valTransparencyTitle, desc: ui.valTransparencyDesc }
            ].map((val, i) => {
              const Icon = val.icon;
              return (
                <div key={i} className="flex items-start gap-3.5 rounded-2xl border border-slate-200 bg-white p-5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="font-heading text-sm font-bold text-slate-900">{val.title}</h2>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">{val.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. MARQUEE SHOWCASE */}
      <ActivityMarquee items={marquee} />

      {/* 4. FOUNDER, VISION & MISSION */}
      <section className="border-b border-slate-200 bg-white py-14 lg:py-16">
        <div className="container-max">
          <div className="grid items-center gap-10 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-3">
                <img
                  src={founderImg}
                  alt={founderName}
                  loading="lazy"
                  className="h-80 w-full rounded-xl object-cover object-top sm:h-96"
                />
                <div className="mt-3 px-2 pb-1">
                  <p className="font-heading text-base font-bold text-slate-900">{founderName}</p>
                  <p className="text-xs font-semibold text-brand-700">{founderRole}</p>
                </div>
              </div>
            </div>

            <div className="space-y-6 lg:col-span-7">
              <div>
                <span className="section-kicker">{ui.founderEyebrow}</span>
                <h2 className="mt-2 font-heading text-2xl font-bold text-slate-900 sm:text-3xl">
                  {ui.founderTitle}
                </h2>
                <p className="mt-3 text-base leading-relaxed text-slate-600">{founderBio}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="editorial-card flex flex-col p-5">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                    <Eye className="h-5 w-5" />
                  </span>
                  <h3 className="mt-3 font-heading text-base font-bold text-slate-900">{ui.visionTitle}</h3>
                  <p className="mt-1.5 flex-1 text-sm text-slate-600">{vision}</p>
                </div>
                <div className="editorial-card flex flex-col p-5">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-800">
                    <Target className="h-5 w-5" />
                  </span>
                  <h3 className="mt-3 font-heading text-base font-bold text-slate-900">{ui.missionTitle}</h3>
                  <p className="mt-1.5 flex-1 text-sm text-slate-600">{mission}</p>
                </div>
              </div>

              <Link
                href="/about"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 transition hover:text-brand-900"
              >
                <span>{ui.learnMore}</span>
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. ACTIVITIES PREVIEW */}
      <section className="border-b border-slate-200 bg-white py-14 lg:py-16">
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
                        <img src={act.image_url} alt={title} loading="lazy" className="h-full w-full object-cover" />
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

      {/* 6. EVENTS PREVIEW */}
      <section className="border-b border-slate-200 bg-white py-14 lg:py-16">
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
                        <img src={ev.banner_url} alt={title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
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

      {/* 7. GALLERY FOLDERS PREVIEW */}
      <section className="border-b border-slate-200 bg-white py-14 lg:py-16">
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

      {/* 8. BLOG PREVIEW */}
      <section className="bg-white py-14 lg:py-16">
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
                        <img src={post.featured_image_url} alt={title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
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

      {/* 9. AEO FAQ */}
      <FaqSection faqs={faqs} />

      {/* 10. CLEAN CTA SECTION */}
      <section className="border-t border-slate-200 bg-white py-14">
        <div className="container-max">
          <div className="flex flex-col items-start justify-between gap-8 rounded-2xl border border-slate-200 bg-slate-50 p-8 sm:p-12 lg:flex-row lg:items-center">
            <div className="max-w-2xl">
              <span className="section-kicker">{ui.ctaBannerEyebrow}</span>
              <h2 className="mt-2 font-heading text-2xl font-bold text-slate-900 sm:text-3xl">
                {ui.ctaBannerTitle}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
                {ui.ctaBannerSubtitle}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/donate"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-brand-700"
              >
                <Heart className="h-4 w-4 shrink-0" />
                <span>{ui.donateNow}</span>
              </Link>
              <Link
                href="/contact#volunteer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-bold text-slate-800 transition hover:border-brand-400 hover:text-brand-700"
              >
                <span>{ui.volunteer}</span>
                <ArrowRight className="h-4 w-4 shrink-0" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
