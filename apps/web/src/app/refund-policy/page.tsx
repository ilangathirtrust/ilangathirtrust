import type { Metadata } from 'next';
import Link from 'next/link';
import { RefreshCcw } from 'lucide-react';
import { TRUST_INFO } from '@ilangathir/shared';
import { getUi } from '@/lib/i18n';
import { getServerLang } from '@/lib/lang-server';
import { buildBreadcrumbJsonLd, buildPageMetadata, buildWebPageJsonLd } from '@/lib/seo';
import { PERMANENT_PAGES } from '@/lib/site-content';
import { PageHeader } from '@/components/PageHeader';

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ lang?: string }> }): Promise<Metadata> {
  const lang = await getServerLang((await searchParams).lang);
  const p = PERMANENT_PAGES.refund;
  return buildPageMetadata({
    title: lang === 'ta' ? p.seo_title_ta : p.seo_title_en,
    description: lang === 'ta' ? p.seo_description_ta : p.seo_description_en,
    keywords: lang === 'ta' ? p.keywords_ta : p.keywords_en,
    path: '/refund-policy',
    lang
  });
}

export default async function RefundPolicyPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const lang = await getServerLang((await searchParams).lang);
  const ui = getUi(lang);
  const p = PERMANENT_PAGES.refund;

  const webPageJsonLd = buildWebPageJsonLd({
    title: lang === 'ta' ? p.seo_title_ta : p.seo_title_en,
    description: lang === 'ta' ? p.seo_description_ta : p.seo_description_en,
    path: '/refund-policy',
    lang
  });
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: ui.home, path: '/' },
    { name: ui.refundPolicy, path: '/refund-policy' }
  ]);

  const sections =
    lang === 'ta'
      ? [
          {
            title: '1. நன்கொடை ரத்துக் கொள்கை',
            body: [
              'இளங்கதிர் அறக்கட்டளைக்கு (பதிவு எண்: Book - 4/47/2024) அளிக்கப்படும் நன்கொடைகள் நேரடியாகக் கல்வி மற்றும் சமூக நலப் பணிகளுக்குப் பயன்படுத்தப்படுவதால், வெற்றிகரமாக நிறைவடைந்த நன்கொடைகளைப் பொதுவாக ரத்து செய்யவோ திரும்பப் பெறவோ முடியாது.'
            ]
          },
          {
            title: '2. தவறான அல்லது இரட்டைப் பரிவர்த்தனைகள் (Exceptions)',
            body: [
              'தொழில்நுட்பக் கோளாறு காரணமாக ஒரே நன்கொடைக்கு இரண்டு முறை பணம் கழிக்கப்பட்டாலோ, அல்லது தவறான தொகை பிடித்தம் செய்யப்பட்டாலோ, பணம் செலுத்திய 7 நாட்களுக்குள் எங்களைத் தொடர்பு கொண்டு திரும்பப் பெற விண்ணப்பிக்கலாம்.',
              'நன்கொடைத் தொகை கழிக்கப்பட்டு ரசீது உருவாக்கப்படாவிட்டாலும் உடனடியாக எங்களுக்குத் தெரிவிக்கவும்.'
            ]
          },
          {
            title: '3. திரும்பப் பெற விண்ணப்பிக்கும் முறை & கால அளவு',
            body: [
              'உங்கள் கோரிக்கையை ilangathirtrust@gmail.com என்ற மின்னஞ்சலுக்கு (அல்லது +91 93630 15050 எண்ணுக்கு) அனுப்பவும். அதனுடன் நன்கொடையாளர் பெயர், பரிவர்த்தனை தேதி, தொகை மற்றும் Razorpay Payment ID / ரசீது எண்ணை இணைக்கவும்.',
              'சரிபார்ப்பு முடிந்து அங்கீகரிக்கப்பட்டால், 5 முதல் 7 வேலை நாட்களுக்குள் Razorpay மூலம் அதே வங்கிக் கணக்கு / கார்டு / UPI வழியாகப் பணம் திருப்பி அனுப்பப்படும்.'
            ]
          }
        ]
      : [
          {
            title: '1. Charitable Contribution Policy',
            body: [
              'Contributions donated to Ilangathir Arakattalai (Ilangathir Trust, Reg. No: Book - 4/47/2024) are immediately allocated toward student education, rural healthcare camps, and community welfare programmes. Accordingly, once a donation is successfully processed, it is generally non-refundable and cannot be cancelled.'
            ]
          },
          {
            title: '2. Eligible Refund Cases (Duplicate or Technical Errors)',
            body: [
              'We happily process full refunds in genuine error cases such as accidental duplicate transactions, unintended debits caused by a network/gateway error, or debits where no receipt was generated.',
              'Refund requests must be raised within 7 calendar days of the transaction date.'
            ]
          },
          {
            title: '3. How to Request a Refund & Processing Timeline',
            body: [
              'Email ilangathirtrust@gmail.com or call +91 93630 15050 with your Donor Name, Date, Amount, and Razorpay Payment ID / Receipt Number.',
              'Once verified, approved refunds are initiated through Razorpay to the original payment method (UPI, card, or bank account) and typically settle within 5 to 7 working days.'
            ]
          }
        ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <PageHeader
        crumbs={[{ label: ui.refundPolicy }]}
        eyebrow={lang === 'ta' ? p.eyebrow_ta : p.eyebrow_en}
        title={lang === 'ta' ? p.title_ta : p.title_en}
        subtitle={lang === 'ta' ? p.subtitle_ta : p.subtitle_en}
        icon={RefreshCcw}
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
              <Link href="/terms" className="hover:text-saffron-600 hover:underline">{ui.termsConditions}</Link>
              <Link href="/donate" className="hover:text-saffron-600 hover:underline">{ui.donateNow}</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
