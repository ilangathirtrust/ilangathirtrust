import type { Metadata } from 'next';
import Link from 'next/link';
import { FileText } from 'lucide-react';
import { TRUST_INFO } from '@ilangathir/shared';
import { getUi } from '@/lib/i18n';
import { getServerLang } from '@/lib/lang-server';
import { buildBreadcrumbJsonLd, buildPageMetadata, buildWebPageJsonLd } from '@/lib/seo';
import { PERMANENT_PAGES } from '@/lib/site-content';
import { PageHeader } from '@/components/PageHeader';

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ lang?: string }> }): Promise<Metadata> {
  const lang = await getServerLang((await searchParams).lang);
  const p = PERMANENT_PAGES.terms;
  return buildPageMetadata({
    title: lang === 'ta' ? p.seo_title_ta : p.seo_title_en,
    description: lang === 'ta' ? p.seo_description_ta : p.seo_description_en,
    keywords: lang === 'ta' ? p.keywords_ta : p.keywords_en,
    path: '/terms',
    lang
  });
}

export default async function TermsPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const lang = await getServerLang((await searchParams).lang);
  const ui = getUi(lang);
  const p = PERMANENT_PAGES.terms;

  const webPageJsonLd = buildWebPageJsonLd({
    title: lang === 'ta' ? p.seo_title_ta : p.seo_title_en,
    description: lang === 'ta' ? p.seo_description_ta : p.seo_description_en,
    path: '/terms',
    lang
  });
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: ui.home, path: '/' },
    { name: ui.termsConditions, path: '/terms' }
  ]);

  const sections =
    lang === 'ta'
      ? [
          {
            title: '1. விதிமுறைகளை ஏற்றல்',
            body: [
              'www.ilangathirtrust.org இணையதளத்தைப் பயன்படுத்துவதன் மூலம் இளங்கதிர் அறக்கட்டளையின் (Ilangathir Arakattalai, பதிவு எண்: Book - 4/47/2024) இந்த விதிமுறைகளை நீங்கள் ஏற்றுக்கொள்கிறீர்கள்.'
            ]
          },
          {
            title: '2. தன்னார்வ நன்கொடைகள் & நிதிப் பயன்பாடு',
            body: [
              'வலைதளத்தின் மூலம் அளிக்கப்படும் அனைத்து நன்கொடைகளும் தன்னார்வமானவை. அவை கல்வி உதவி, கிராமப்புற மருத்துவ முகாம்கள், மரம் நடுதல் மற்றும் சமூக நலப் பணிகளுக்கு மட்டுமே பயன்படுத்தப்படும்.',
              'குறைந்தபட்ச ஆன்லைன் நன்கொடை ₹100 ஆகும். வெற்றிகரமான கட்டணத்திற்குப் பிறகு அதிகாரப்பூர்வ ரசீது எண் வழங்கப்படும்.'
            ]
          },
          {
            title: '3. தன்னார்வப் பணிகள் & இணையதளப் பயன்பாடு',
            body: [
              'தன்னார்வலர் பதிவு என்பது அறக்கட்டளையின் சரிபார்ப்புக்கும் களப் பணித் தேவைகளுக்கும் உட்பட்டது. இணையதளத்தைத் தவறான நோக்கங்களுக்கோ ஸ்பேம் அனுப்பவோ பயன்படுத்தக் கூடாது.'
            ]
          },
          {
            title: '4. அறிவுசார் சொத்துரிமை & சட்ட வரம்பு',
            body: [
              'இந்தத் தளத்தில் உள்ள லோகோ, புகைப்படங்கள் மற்றும் கட்டுரைகள் இளங்கதிர் அறக்கட்டளைக்குச் சொந்தமானவை. எழுத்துப்பூர்வ அனுமதியின்றி வணிக நோக்கத்திற்காகப் பயன்படுத்தக் கூடாது.',
              'இந்த விதிமுறைகள் இந்தியச் சட்டங்களுக்கு உட்பட்டவை; எந்தவொரு சட்டப் பிரச்சனையும் திண்டுக்கல், தமிழ்நாடு நீதிமன்ற வரம்பிற்கு உட்பட்டது.'
            ]
          }
        ]
      : [
          {
            title: '1. Acceptance of Terms',
            body: [
              'By accessing www.ilangathirtrust.org, submitting an enquiry or volunteer application, or making a donation, you agree to these Terms & Conditions of Ilangathir Arakattalai (Ilangathir Trust, Registered Charitable Trust No. Book - 4/47/2024, PAN: AACT13541A).'
            ]
          },
          {
            title: '2. Charitable Contributions',
            body: [
              'All donations made through this platform are voluntary charitable contributions directed toward education aid, rural medical and eye camps, environmental care, and family welfare programmes.',
              'Minimum online donation amount is ₹100 (INR). Upon verified completion via Razorpay, an official receipt number is automatically generated for your records.'
            ]
          },
          {
            title: '3. Acceptable Use & Volunteer Applications',
            body: [
              'You agree to submit accurate information when using contact, volunteer, or donation forms and not to engage in automated abuse, scraping, or disruption of site services.',
              'Volunteer registrations are reviewed by trust coordinators and participation is subject to local programme needs.'
            ]
          },
          {
            title: '4. Content Ownership & Governing Law',
            body: [
              'All trust logos, field photographs, videos, and editorial stories published on this website belong to Ilangathir Trust and may not be republished commercially without written consent.',
              'These terms are governed by the laws of India, with exclusive jurisdiction in the courts of Dindigul, Tamil Nadu.'
            ]
          }
        ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <PageHeader
        crumbs={[{ label: ui.termsConditions }]}
        eyebrow={lang === 'ta' ? p.eyebrow_ta : p.eyebrow_en}
        title={lang === 'ta' ? p.title_ta : p.title_en}
        subtitle={lang === 'ta' ? p.subtitle_ta : p.subtitle_en}
        icon={FileText}
      />

      <section className="bg-sand-50 py-10 sm:py-14">
        <div className="container-max">
          <div className="mx-auto max-w-4xl space-y-6 rounded-3xl border border-sand-200 bg-white p-5 shadow-xs sm:p-9">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sand-200 pb-4 text-xs font-semibold text-slate-600">
              <span>
                {lang === 'ta' ? 'அறக்கட்டளை பதிவு எண்:' : 'Trust Reg. No:'}{' '}
                <strong className="text-brand-900">{TRUST_INFO.registrationNumber}</strong> • PAN:{' '}
                <strong className="text-brand-900">{TRUST_INFO.panNumber}</strong>
              </span>
              <span>{lang === 'ta' ? 'புதுப்பிக்கப்பட்ட தேதி: நவம்பர் 2026' : 'Last Updated: November 2026'}</span>
            </div>

            {sections.map((sec) => (
              <div key={sec.title} className="space-y-2.5">
                <h2 className="font-heading text-lg font-bold text-brand-900 sm:text-xl">{sec.title}</h2>
                {sec.body.map((para, idx) => (
                  <p key={idx} className="text-sm leading-relaxed text-slate-600 sm:text-base">
                    {para}
                  </p>
                ))}
              </div>
            ))}

            <div className="flex flex-wrap gap-4 border-t border-sand-200 pt-4 text-xs font-bold text-brand-800">
              <Link href="/privacy-policy" className="hover:text-saffron-600 hover:underline">{ui.privacyPolicy}</Link>
              <Link href="/refund-policy" className="hover:text-saffron-600 hover:underline">{ui.refundPolicy}</Link>
              <Link href="/contact" className="hover:text-saffron-600 hover:underline">{ui.contact}</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
