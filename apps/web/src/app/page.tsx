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
  Sparkles,
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
    (lang === 'ta' ? 'செயலில் கருணை • திண்டுக்கல், தமிழ்நாடு' : 'COMPASSION IN ACTION • DINDIGUL, TAMIL NADU');

  const heroTitle =
    (homePage && pickLocalized(homePage as unknown as Record<string, unknown>, 'hero_title', lang)) ||
    (lang === 'ta'
      ? 'ஒன்றிணைந்து, அக்கறையும் வலிமையும் கொண்ட நாளையை உருவாக்குவோம்.'
      : 'Together, we build a caring & empowered tomorrow.');

  const heroSubtitle =
    (homePage && pickLocalized(homePage as unknown as Record<string, unknown>, 'hero_subtitle', lang)) ||
    (lang === 'ta'
      ? 'கல்வி உதவி, மருத்துவ முகாம்கள், சுற்றுச்சூழல் பாதுகாப்பு மற்றும் தன்னார்வப் பணிகள் மூலம் தமிழ்நாடு முழுவதும் உள்ள மக்களுக்கு இளங்கதிர் அறக்கட்டளை சேவை செய்கிறது.'
      : 'Ilangathir Trust serves communities across Tamil Nadu through education support, medical outreach, environmental care, and collective volunteer action.');

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

      {/* 1. EDITORIAL HERO SECTION (Asymmetric Ivory & Navy Craft) */}
      <section className="relative overflow-hidden border-b border-stone-200 bg-ivory-100">
        <div className="container-max py-12 sm:py-16 lg:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="animate-fadeInUp space-y-6 lg:col-span-7">
              <span className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-brand-900 shadow-xs">
                <span className="h-2 w-2 rounded-full bg-amberwarm-500" />
                <span>{heroEyebrow}</span>
              </span>

              <h1
                className={`font-heading font-extrabold text-brand-950 ${
                  lang === 'ta'
                    ? 'text-2xl leading-[1.42] sm:text-4xl lg:text-[42px]'
                    : 'text-3xl leading-[1.14] tracking-tight sm:text-5xl lg:text-[52px]'
                }`}
              >
                {heroTitle}
              </h1>

              <p className="max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
                {heroSubtitle}
              </p>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap sm:items-center">
                <Link
                  href={primaryCtaHref}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-brand-600/20 transition hover:-translate-y-0.5 hover:bg-brand-700"
                >
                  <Heart className="h-4 w-4 shrink-0" />
                  <span>{primaryCtaLabel}</span>
                </Link>
                <Link
                  href={secondaryCtaHref}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-6 py-3.5 text-sm font-bold text-slate-900 shadow-xs transition hover:border-brand-300 hover:bg-ivory-200"
                >
                  <span>{secondaryCtaLabel}</span>
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-stone-200 pt-6 sm:grid-cols-3">
                <div>
                  <p className="font-heading text-lg font-extrabold text-brand-900">100%</p>
                  <p className="text-xs font-medium text-slate-600">
                    {lang === 'ta' ? 'வெளிப்படையான சேவை' : 'Community-Focused'}
                  </p>
                </div>
                <div>
                  <p className="font-heading text-lg font-extrabold text-brand-900">V. Kallupatti</p>
                  <p className="text-xs font-medium text-slate-600">
                    {lang === 'ta' ? 'திண்டுக்கல், தமிழ்நாடு' : 'Dindigul, Tamil Nadu'}
                  </p>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <p className="font-heading text-lg font-extrabold text-amberwarm-700">Razorpay</p>
                  <p className="text-xs font-medium text-slate-600">
                    {lang === 'ta' ? 'பாதுகாப்பான நன்கொடை' : 'Verified Online Giving'}
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                <div className="overflow-hidden rounded-[28px] border-[6px] border-white bg-ivory-200 shadow-[0_24px_60px_rgba(14,27,77,0.12)]">
                  <img
                    src={heroImage}
                    alt={heroTitle}
                    className="h-72 w-full object-cover sm:h-[420px]"
                  />
                </div>
                <div className="mt-4 flex items-center gap-3.5 rounded-2xl border border-stone-200 bg-white p-4 shadow-lg sm:absolute sm:-bottom-5 sm:-left-5 sm:mt-0 sm:max-w-xs">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amberwarm-100 text-amberwarm-700">
                    <HeartHandshake className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-heading text-sm font-bold text-slate-900">
                      {lang === 'ta' ? 'மனிதநேயப் பணி' : 'Human Dignity First'}
                    </p>
                    <p className="text-xs text-slate-600">
                      {lang === 'ta' ? 'கல்வி • மருத்துவம் • நலன்' : 'Education • Health • Relief'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FOUR PILLARS BAR */}
      <section className="border-b border-stone-200 bg-white py-10">
        <div className="container-max">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Heart, color: 'bg-tealcare-50 text-tealcare-700', title: ui.valCompassionTitle, desc: ui.valCompassionDesc },
              { icon: ShieldCheck, color: 'bg-amberwarm-50 text-amberwarm-700', title: ui.valEqualityTitle, desc: ui.valEqualityDesc },
              { icon: Users, color: 'bg-brand-50 text-brand-700', title: ui.valCommunityTitle, desc: ui.valCommunityDesc },
              { icon: Sparkles, color: 'bg-ivory-200 text-brand-900', title: ui.valTransparencyTitle, desc: ui.valTransparencyDesc }
            ].map((val, i) => {
              const Icon = val.icon;
              return (
                <div key={i} className="flex items-start gap-3.5 rounded-2xl border border-stone-100 bg-ivory-50 p-4">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${val.color}`}>
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

      {/* 3. DYNAMIC MARQUEE SHOWCASE */}
      <ActivityMarquee items={marquee} />

      {/* 4. FOUNDER, VISION & MISSION (Editorial Split) */}
      <section className="bg-ivory-100 py-16 lg:py-20">
        <div className="container-max">
          <div className="grid items-center gap-10 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white p-3 shadow-md">
                <img
                  src={founderImg}
                  alt={founderName}
                  loading="lazy"
                  className="h-80 w-full rounded-2xl object-cover object-top sm:h-96"
                />
                <div className="mt-3 rounded-2xl bg-brand-950 p-4 text-white">
                  <p className="font-heading text-base font-bold">{founderName}</p>
                  <p className="text-xs font-medium text-amberwarm-300">{founderRole}</p>
                </div>
              </div>
            </div>

            <div className="space-y-6 lg:col-span-7">
              <div>
                <span className="section-kicker">
                  <span className="h-1.5 w-1.5 rounded-full bg-amberwarm-500" />
                  {ui.founderEyebrow}
                </span>
                <h2 className="mt-2 font-heading text-2xl font-bold text-brand-950 sm:text-4xl">
                  {ui.founderTitle}
                </h2>
                <p className="mt-4 text-base leading-relaxed text-slate-600">{founderBio}</p>
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
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amberwarm-50 text-amberwarm-700">
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
      <section className="border-y border-stone-200 bg-white py-16 lg:py-20">
        <div className="container-max">
          <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <span className="section-kicker">
                <span className="h-1.5 w-1.5 rounded-full bg-amberwarm-500" />
                {ui.activitiesEyebrow}
              </span>
              <h2 className="mt-2 font-heading text-2xl font-bold text-brand-950 sm:text-3xl">
                {ui.activitiesTitle}
              </h2>
            </div>
            <Link href="/activities" className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-700">
              <span>{ui.viewAll}</span>
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          {activitiesRes.items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-ivory-50 p-10 text-center text-sm text-slate-600">
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
                      <div className="h-48 overflow-hidden bg-ivory-200">
                        <img src={act.image_url} alt={title} loading="lazy" className="h-full w-full object-cover" />
                      </div>
                    )}
                    <div className="flex flex-1 flex-col p-5">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-amberwarm-700">
                        {act.category}
                      </span>
                      <h3 className="mt-2 font-heading text-lg font-bold text-slate-900">{title}</h3>
                      <p className="mt-2 line-clamp-3 flex-1 text-sm text-slate-600">{summary}</p>
                      {location && (
                        <p className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-amberwarm-600" />
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
      <section className="bg-ivory-100 py-16 lg:py-20">
        <div className="container-max">
          <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <span className="section-kicker">
                <span className="h-1.5 w-1.5 rounded-full bg-amberwarm-500" />
                {ui.eventsEyebrow}
              </span>
              <h2 className="mt-2 font-heading text-2xl font-bold text-brand-950 sm:text-3xl">
                {ui.eventsTitle}
              </h2>
            </div>
            <Link href="/events" className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-700">
              <span>{ui.viewAll}</span>
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          {eventsRes.items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-sm text-slate-600">
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
                    <div className="relative h-48 overflow-hidden bg-ivory-200">
                      {ev.banner_url ? (
                        <img src={ev.banner_url} alt={title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-brand-600">
                          <Calendar className="h-10 w-10" />
                        </div>
                      )}
                      <span className="absolute left-3 top-3 rounded-lg bg-white/95 px-2.5 py-1 text-xs font-bold text-brand-900 shadow">
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
      <section className="border-y border-stone-200 bg-white py-16 lg:py-20">
        <div className="container-max">
          <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <span className="section-kicker">
                <span className="h-1.5 w-1.5 rounded-full bg-amberwarm-500" />
                {ui.galleryEyebrow}
              </span>
              <h2 className="mt-2 font-heading text-2xl font-bold text-brand-950 sm:text-3xl">
                {ui.galleryTitle}
              </h2>
            </div>
            <Link href="/gallery" className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-700">
              <span>{ui.viewAll}</span>
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          {galleryRes.items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-ivory-50 p-10 text-center text-sm text-slate-600">
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
      <section className="bg-ivory-100 py-16 lg:py-20">
        <div className="container-max">
          <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <span className="section-kicker">
                <span className="h-1.5 w-1.5 rounded-full bg-amberwarm-500" />
                {ui.blogEyebrow}
              </span>
              <h2 className="mt-2 font-heading text-2xl font-bold text-brand-950 sm:text-3xl">
                {ui.blogTitle}
              </h2>
            </div>
            <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-700">
              <span>{ui.viewAll}</span>
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          {blogsRes.items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-sm text-slate-600">
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
                    <div className="h-48 overflow-hidden bg-ivory-200">
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

      {/* 10. EDITORIAL DONATION CTA BANNER */}
      <section className="bg-brand-950 py-16 text-white">
        <div className="container-max">
          <div className="flex flex-col items-start justify-between gap-8 rounded-3xl border border-white/10 bg-brand-900/70 p-8 sm:p-12 lg:flex-row lg:items-center">
            <div className="max-w-2xl">
              <span className="text-xs font-extrabold uppercase tracking-widest text-amberwarm-300">
                {ui.ctaBannerEyebrow}
              </span>
              <h2 className="mt-2 font-heading text-2xl font-bold text-white sm:text-4xl">
                {ui.ctaBannerTitle}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">
                {ui.ctaBannerSubtitle}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/donate"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-amberwarm-500 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-lg transition hover:bg-amberwarm-400"
              >
                <Heart className="h-4 w-4 shrink-0" />
                <span>{ui.donateNow}</span>
              </Link>
              <Link
                href="/contact#volunteer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/20"
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
