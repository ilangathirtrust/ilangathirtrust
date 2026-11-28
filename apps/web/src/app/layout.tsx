import type { Metadata, Viewport } from 'next';
import { Inter, Noto_Sans_Tamil, Plus_Jakarta_Sans } from 'next/font/google';
import { Suspense } from 'react';
import { getEnabledSocialLinks, isDonationsEnabled } from '@ilangathir/shared';
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
import { WhatsAppFloat } from '@/components/WhatsAppFloat';
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
      { url: '/logos/favicon.ico', sizes: 'any' },
      { url: '/logos/favicon.svg', type: 'image/svg+xml' },
      { url: '/logos/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/logos/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/logos/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
      { url: '/logos/favicon-192x192.png', sizes: '192x192', type: 'image/png' }
    ],
    shortcut: [{ url: '/logos/favicon.ico' }],
    apple: [
      { url: '/logos/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      { url: '/logos/apple-icon-120.png', sizes: '120x120', type: 'image/png' },
      { url: '/logos/apple-icon-152.png', sizes: '152x152', type: 'image/png' },
      { url: '/logos/apple-icon-167.png', sizes: '167x167', type: 'image/png' },
      { url: '/logos/apple-icon-180.png', sizes: '180x180', type: 'image/png' }
    ]
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'msapplication-TileImage': '/logos/icon-144.png',
    'msapplication-TileColor': '#13294B'
  }
};

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const [lang, bootstrap] = await Promise.all([getServerLang(), getBootstrap()]);
  const donationsEnabled = isDonationsEnabled(bootstrap.settings);
  const socialLinks = getEnabledSocialLinks(bootstrap.settings);

  const trustNameEn = SITE_SETTINGS.trust_name.value_en;
  const trustNameTa = SITE_SETTINGS.trust_name.value_ta;
  const logoUrl = STATIC_ASSETS.logo;
  const phone = SITE_SETTINGS.phone.value_en;
  const email = SITE_SETTINGS.email.value_en;
  const addressEn = SITE_SETTINGS.address.value_en;
  const addressTa = SITE_SETTINGS.address.value_ta;
  const footerDescEn = SITE_SETTINGS.footer_description.value_en;
  const footerDescTa = SITE_SETTINGS.footer_description.value_ta;

  const orgJsonLd = buildOrganizationGraphJsonLd(socialLinks);

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

        <Preloader />

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
            socialLinks={socialLinks}
          />

          <main id="main-content" className="flex-1">
            {children}
          </main>

          <SiteFooter
            trustNameEn={trustNameEn}
            trustNameTa={trustNameTa}
            footerDescEn={footerDescEn}
            footerDescTa={footerDescTa}
            phone={phone}
            email={email}
            addressEn={addressEn}
            addressTa={addressTa}
            donationsEnabled={donationsEnabled}
            socialLinks={socialLinks}
          />

          <MobileBottomNav
            navItems={bootstrap.navigation}
            donationsEnabled={donationsEnabled}
          />

          <WhatsAppFloat socialLinks={socialLinks} />
          <PwaInstallBanner />
        </LanguageProvider>
      </body>
    </html>
  );
}
