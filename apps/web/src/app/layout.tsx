import type { Metadata, Viewport } from 'next';
import { Inter, Noto_Sans_Tamil, Plus_Jakarta_Sans } from 'next/font/google';
import { Suspense } from 'react';
import { isDonationsEnabled } from '@ilangathir/shared';
import { getBootstrap, SITE_URL } from '@/lib/api';
import { getServerLang } from '@/lib/lang-server';
import { buildOrganizationGraphJsonLd } from '@/lib/seo';
import { SITE_SETTINGS, STATIC_ASSETS } from '@/lib/site-content';
import { LanguageProvider } from '@/components/LanguageProvider';
import { Preloader } from '@/components/Preloader';
import { PwaInstallBanner } from '@/components/PwaInstallBanner';
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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#13294B'
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: 'Ilangathir Trust',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Ilangathir Trust'
  },
  formatDetection: {
    telephone: true,
    email: true
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }]
  }
};

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const [lang, bootstrap] = await Promise.all([getServerLang(), getBootstrap()]);
  const settings = bootstrap.settings;
  const donationsEnabled = isDonationsEnabled(settings);

  const trustNameEn = settings.trust_name?.value_en || SITE_SETTINGS.trust_name.value_en;
  const trustNameTa = settings.trust_name?.value_ta || SITE_SETTINGS.trust_name.value_ta;
  const logoUrl = settings.logo_url?.value_en || STATIC_ASSETS.logo;
  const phone = settings.phone?.value_en || SITE_SETTINGS.phone.value_en;
  const email = settings.email?.value_en || SITE_SETTINGS.email.value_en;
  const addressEn = settings.address?.value_en || SITE_SETTINGS.address.value_en;
  const addressTa = settings.address?.value_ta || SITE_SETTINGS.address.value_ta;
  const footerDescEn = settings.footer_description?.value_en || SITE_SETTINGS.footer_description.value_en;
  const footerDescTa = settings.footer_description?.value_ta || SITE_SETTINGS.footer_description.value_ta;

  const orgJsonLd = buildOrganizationGraphJsonLd(settings);

  return (
    <html
      lang={lang}
      className={`${inter.variable} ${jakarta.variable} ${notoTamil.variable}`}
    >
      <body className="min-h-screen flex flex-col bg-sand-50 text-slate-900">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />

        <Preloader logoUrl={logoUrl} />

        <LanguageProvider initialLang={lang}>
          <Suspense fallback={null}>
            <AnalyticsTracker />
          </Suspense>

          <SiteHeader
            logoUrl={logoUrl}
            trustNameEn={trustNameEn}
            trustNameTa={trustNameTa}
            phone={phone}
            email={email}
            navItems={bootstrap.navigation}
            donationsEnabled={donationsEnabled}
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
            donationsEnabled={donationsEnabled}
          />

          <MobileBottomNav
            navItems={bootstrap.navigation}
            donationsEnabled={donationsEnabled}
          />

          <PwaInstallBanner />
        </LanguageProvider>
      </body>
    </html>
  );
}
