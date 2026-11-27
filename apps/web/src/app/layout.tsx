import type { Metadata } from 'next';
import { Inter, Noto_Sans_Tamil, Plus_Jakarta_Sans } from 'next/font/google';
import { Suspense } from 'react';
import { getBootstrap } from '@/lib/api';
import { getServerLang } from '@/lib/lang-server';
import { buildOrganizationJsonLd } from '@/lib/seo';
import { LanguageProvider } from '@/components/LanguageProvider';
import { Preloader } from '@/components/Preloader';
import { SiteHeader } from '@/components/SiteHeader';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { SiteFooter } from '@/components/SiteFooter';
import { AnalyticsTracker } from '@/components/AnalyticsTracker';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap'
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap'
});

const notoTamil = Noto_Sans_Tamil({
  subsets: ['tamil'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-tamil',
  display: 'swap'
});

export async function generateMetadata(): Promise<Metadata> {
  const bootstrap = await getBootstrap();
  const favicon = bootstrap.settings.favicon_url?.value_en || '/assets/ilangathir-logo.jpg';
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.ilangathirtrust.com'),
    icons: {
      icon: favicon,
      apple: favicon
    }
  };
}

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const [lang, bootstrap] = await Promise.all([getServerLang(), getBootstrap()]);
  const { settings, navigation } = bootstrap;

  const logoUrl = settings.logo_url?.value_en || '/assets/ilangathir-logo.jpg';
  const trustNameEn = settings.trust_name?.value_en || 'Ilangathir Trust';
  const trustNameTa = settings.trust_name?.value_ta || 'இளங்கதிர் அறக்கட்டளை';
  const phone = settings.phone?.value_en || '+91 93630 15050';
  const email = settings.email?.value_en || 'ilangathirtrust@gmail.com';
  const addressEn = settings.address?.value_en || 'V. Kallupatti, Dindigul - 624307, Tamil Nadu, India.';
  const addressTa = settings.address?.value_ta || 'V. கல்லுப்பட்டி, திண்டுக்கல் - 624307, தமிழ்நாடு, இந்தியா.';
  const footerDescEn = settings.footer_description?.value_en || '';
  const footerDescTa = settings.footer_description?.value_ta || '';

  const orgJsonLd = buildOrganizationJsonLd(settings);

  return (
    <html
      lang={lang}
      className={`${inter.variable} ${jakarta.variable} ${notoTamil.variable}`}
    >
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />

        <LanguageProvider initialLang={lang}>
          <Preloader logoUrl={logoUrl} />
          <Suspense fallback={null}>
            <AnalyticsTracker />
          </Suspense>

          <SiteHeader
            logoUrl={logoUrl}
            trustNameEn={trustNameEn}
            trustNameTa={trustNameTa}
            phone={phone}
            email={email}
            navItems={navigation}
          />

          <main id="main-content" className="flex-1">
            {children}
          </main>

          <SiteFooter
            logoUrl={logoUrl}
            trustNameEn={trustNameEn}
            trustNameTa={trustNameTa}
            footerDescEn={footerDescEn}
            footerDescTa={footerDescTa}
            phone={phone}
            email={email}
            addressEn={addressEn}
            addressTa={addressTa}
          />

          <MobileBottomNav navItems={navigation} />
        </LanguageProvider>
      </body>
    </html>
  );
}
