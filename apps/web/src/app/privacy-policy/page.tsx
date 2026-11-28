import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { TRUST_INFO } from '@ilangathir/shared';
import { getUi } from '@/lib/i18n';
import { getServerLang } from '@/lib/lang-server';
import { buildBreadcrumbJsonLd, buildPageMetadata, buildWebPageJsonLd } from '@/lib/seo';
import { PERMANENT_PAGES } from '@/lib/site-content';
import { PageHeader } from '@/components/PageHeader';

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ lang?: string }> }): Promise<Metadata> {
  const lang = await getServerLang((await searchParams).lang);
  const p = PERMANENT_PAGES.privacy;
  return buildPageMetadata({
    title: lang === 'ta' ? p.seo_title_ta : p.seo_title_en,
    description: lang === 'ta' ? p.seo_description_ta : p.seo_description_en,
    keywords: lang === 'ta' ? p.keywords_ta : p.keywords_en,
    path: '/privacy-policy',
    lang
  });
}

export default async function PrivacyPolicyPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const lang = await getServerLang((await searchParams).lang);
  const ui = getUi(lang);
  const p = PERMANENT_PAGES.privacy;

  const webPageJsonLd = buildWebPageJsonLd({
    title: lang === 'ta' ? p.seo_title_ta : p.seo_title_en,
    description: lang === 'ta' ? p.seo_description_ta : p.seo_description_en,
    path: '/privacy-policy',
    lang
  });
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: ui.home, path: '/' },
    { name: ui.privacyPolicy, path: '/privacy-policy' }
  ]);

  const sections =
    lang === 'ta'
      ? [
          {
            title: '1. நாம் சேகரிக்கும் தகவல்கள்',
            body: [
              'நீங்கள் தொடர்பு படிவம், தன்னார்வலர் பதிவுப் படிவம் அல்லது நன்கொடைப் படிவத்தை நிரப்பும்போது உங்கள் பெயர், மின்னஞ்சல் முகவரி, கைபேசி எண், முகவரி, மற்றும் நன்கொடைத் தொடர்பான PAN எண் (விருப்பம்) ஆகியவற்றைச் சேகரிக்கிறோம்.',
              'இணையதளப் பயன்பாட்டை மேம்படுத்த Google Analytics 4 (GA4) மூலம் பார்வைப் புள்ளிவிவரங்கள் அநாமதேயமாகச் சேகரிக்கப்படுகின்றன.'
            ]
          },
          {
            title: '2. தகவல்கள் எவ்வாறு பயன்படுத்தப்படுகின்றன',
            body: [
              'உங்கள் கேள்விகளுக்குப் பதிலளிக்க, தன்னார்வப் பணிகளுக்கு ஒருங்கிணைக்க, நன்கொடை ரசீதுகள் வழங்க மற்றும் சட்டப்பூர்வ அறக்கட்டளைக் கணக்குகளைப் பராமரிக்க மட்டுமே உங்கள் விவரங்கள் பயன்படுத்தப்படும்.',
              'உங்கள் தனிப்பட்ட தகவல்களை நாங்கள் எந்த மூன்றாம் தரப்பினருக்கும் விற்பனை செய்யவோ வாடகைக்கு விடவோ மாட்டோம்.'
            ]
          },
          {
            title: '3. ஆன்லைன் கட்டணம் & Razorpay பாதுகாப்பு',
            body: [
              'அனைத்து ஆன்லைன் நன்கொடைகளும் Razorpay வழியாக HTTPS மறையாக்கத்துடன் செயல்படுத்தப்படுகின்றன. உங்கள் கார்டு எண், CVV அல்லது UPI PIN போன்ற விவரங்களை இளங்கதிர் அறக்கட்டளைச் சேவையகங்கள் ஒருபோதும் சேமிப்பதில்லை.',
              'பரிவர்த்தனை சரிபார்ப்புக்காக Razorpay Order ID, Payment ID மற்றும் கையொப்ப சரிபார்ப்பு நிலை மட்டுமே பாதுகாப்பாகப் பதிவு செய்யப்படுகின்றன.'
            ]
          },
          {
            title: '4. குக்கீகள் & உங்கள் உரிமைகள்',
            body: [
              'மொழித் தேர்வு (English / தமிழ்) மற்றும் ஆஃப்லைன் PWA வசதிக்காக அவசியமான உலாவிச் சேமிப்பகம் மட்டுமே பயன்படுத்தப்படுகிறது.',
              'உங்கள் தகவல்களைத் திருத்தவோ நீக்கவோ விரும்பினால் ilangathirtrust@gmail.com என்ற மின்னஞ்சலில் அல்லது +91 93630 15050 என்ற எண்ணில் தொடர்பு கொள்ளலாம்.'
            ]
          }
        ]
      : [
          {
            title: '1. Information We Collect',
            body: [
              'When you submit a contact enquiry, volunteer application, or online donation on www.ilangathirtrust.org, we collect only the details you provide such as your full name, email address, phone number, town/address, and optional PAN number for donation records.',
              'We also use Google Analytics 4 (GA4) to understand aggregate website traffic and improve public outreach, without selling personal visitor profiles.'
            ]
          },
          {
            title: '2. How We Use Your Information',
            body: [
              'Your information is used strictly to respond to enquiries, coordinate volunteer programmes, issue official trust donation receipts, and maintain statutory accounting records of Ilangathir Arakattalai.',
              'We never sell, rent, or trade donor or volunteer information with third-party marketers.'
            ]
          },
          {
            title: '3. Payment Security & Razorpay',
            body: [
              'Online donations are processed securely by Razorpay using TLS/HTTPS encryption and PCI-DSS compliant infrastructure. Ilangathir Trust never collects or stores your debit/credit card numbers, CVV, bank credentials, or UPI PIN.',
              'We store only transaction identifiers (Razorpay Order ID, Payment ID, payment method, and official receipt number) for donor verification and audit compliance.'
            ]
          },
          {
            title: '4. Cookies, Data Retention & Your Rights',
            body: [
              'Essential browser storage is used to remember your preferred language (English or Tamil) and enable offline PWA functionality.',
              'You may request access to, correction of, or removal of your contact or volunteer enquiry data by emailing ilangathirtrust@gmail.com or calling +91 93630 15050.'
            ]
          }
        ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <PageHeader
        crumbs={[{ label: ui.privacyPolicy }]}
        eyebrow={lang === 'ta' ? p.eyebrow_ta : p.eyebrow_en}
        title={lang === 'ta' ? p.title_ta : p.title_en}
        subtitle={lang === 'ta' ? p.subtitle_ta : p.subtitle_en}
        icon={ShieldCheck}
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

            <div className="rounded-2xl border border-sand-200 bg-sand-50 p-4 text-sm text-slate-700 sm:p-5">
              <p className="font-bold text-brand-900">
                {lang === 'ta' ? 'தனியுரிமைத் தொடர்பு முகவரி' : 'Privacy & Data Contact'}
              </p>
              <p className="mt-1">
                {TRUST_INFO.legalNameEn} ({TRUST_INFO.displayNameEn}) — {TRUST_INFO.addressEn}
              </p>
              <p className="mt-1">
                Email: <a href={`mailto:${TRUST_INFO.email}`} className="font-semibold text-brand-800 underline">{TRUST_INFO.email}</a> •{' '}
                Phone: <a href="tel:+919363015050" className="font-semibold text-brand-800 underline">{TRUST_INFO.phone}</a>
              </p>
            </div>

            <div className="flex flex-wrap gap-4 border-t border-sand-200 pt-4 text-xs font-bold text-brand-800">
              <Link href="/terms" className="hover:text-saffron-600 hover:underline">{ui.termsConditions}</Link>
              <Link href="/refund-policy" className="hover:text-saffron-600 hover:underline">{ui.refundPolicy}</Link>
              <Link href="/contact" className="hover:text-saffron-600 hover:underline">{ui.contact}</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
