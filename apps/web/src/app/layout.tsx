import type { Metadata } from 'next';
import { Inter, Noto_Sans_Tamil, Plus_Jakarta_Sans } from 'next/font/google';
import { Suspense } from 'react';
import { SITE_URL } from '@/lib/api';
import { getServerLang } from '@/lib/lang-server';
import { buildOrganizationJsonLd } from '@/lib/seo';
import { SITE_SETTINGS, STATIC_ASSETS, STATIC_NAVIGATION } from '@/lib/site-content';
import { LanguageProvider } from '@/components/LanguageProvider';
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

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  icons: {
    icon: STATIC_ASSETS.favicon,
    apple: STATIC_ASSETS.favicon
  }
};

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const lang = await getServerLang();
  const orgJsonLd = buildOrganizationJsonLd(SITE_SETTINGS);

  return (
    <html
      lang={lang}
      className={`${inter.variable} ${jakarta.variable} ${notoTamil.variable}`}
    >
      <body className="min-h-screen flex flex-col bg-white text-slate-900">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />

        <LanguageProvider initialLang={lang}>
          <Suspense fallback={null}>
            <AnalyticsTracker />
          </Suspense>

          <SiteHeader
            logoUrl={STATIC_ASSETS.logo}
            trustNameEn={SITE_SETTINGS.trust_name.value_en}
            trustNameTa={SITE_SETTINGS.trust_name.value_ta}
            phone={SITE_SETTINGS.phone.value_en}
            email={SITE_SETTINGS.email.value_en}
            navItems={STATIC_NAVIGATION}
          />

          <main id="main-content" className="flex-1">
            {children}
          </main>

          <SiteFooter
            logoUrl={STATIC_ASSETS.logo}
            trustNameEn={SITE_SETTINGS.trust_name.value_en}
            trustNameTa={SITE_SETTINGS.trust_name.value_ta}
            footerDescEn={SITE_SETTINGS.footer_description.value_en}
            footerDescTa={SITE_SETTINGS.footer_description.value_ta}
            phone={SITE_SETTINGS.phone.value_en}
            email={SITE_SETTINGS.email.value_en}
            addressEn={SITE_SETTINGS.address.value_en}
            addressTa={SITE_SETTINGS.address.value_ta}
          />

          <MobileBottomNav navItems={STATIC_NAVIGATION} />
        </LanguageProvider>
      </body>
    </html>
  );
}
