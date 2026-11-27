import type { Metadata } from 'next';
import { pickLocalized, type BilingualFaq, type BlogPost, type EventItem, type GalleryFolder, type Language } from '@ilangathir/shared';
import { SITE_URL } from './api';
import { normalizeBrandAssetUrl, STATIC_ASSETS } from './site-content';

export function buildPageMetadata(params: {
  title: string;
  description: string;
  path: string;
  lang: Language;
  ogImage?: string;
  keywords?: string;
  noIndex?: boolean;
  ogType?: 'website' | 'article';
}): Metadata {
  const canonicalPath = params.path.startsWith('/') ? params.path : `/${params.path}`;
  const canonicalUrl = `${SITE_URL}${canonicalPath}`;
  const sep = canonicalPath.includes('?') ? '&' : '?';
  const taUrl = `${SITE_URL}${canonicalPath}${sep}lang=ta`;
  const enUrl = `${SITE_URL}${canonicalPath}${sep}lang=en`;
  const image = params.ogImage || `${SITE_URL}${STATIC_ASSETS.logo}`;

  return {
    title: params.title,
    description: params.description,
    keywords: params.keywords || undefined,
    robots: params.noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large',
            'max-snippet': -1,
            'max-video-preview': -1
          }
        },
    alternates: {
      canonical: params.lang === 'ta' ? taUrl : canonicalUrl,
      languages: {
        en: enUrl,
        'en-IN': enUrl,
        ta: taUrl,
        'ta-IN': taUrl,
        'x-default': canonicalUrl
      }
    },
    openGraph: {
      title: params.title,
      description: params.description,
      url: params.lang === 'ta' ? taUrl : canonicalUrl,
      siteName: params.lang === 'ta' ? 'இளங்கதிர் அறக்கட்டளை | Ilangathir Trust' : 'Ilangathir Trust | இளங்கதிர் அறக்கட்டளை',
      locale: params.lang === 'ta' ? 'ta_IN' : 'en_IN',
      alternateLocale: params.lang === 'ta' ? ['en_IN'] : ['ta_IN'],
      type: params.ogType || 'website',
      images: [{ url: image, alt: params.title }]
    },
    twitter: {
      card: 'summary_large_image',
      title: params.title,
      description: params.description,
      images: [image]
    },
    other: {
      'geo.region': 'IN-TN',
      'geo.placename': 'V. Kallupatti, Dindigul, Tamil Nadu',
      'geo.position': '10.3673;77.9803',
      ICBM: '10.3673, 77.9803'
    }
  };
}

export function buildOrganizationGraphJsonLd(
  settings: Record<string, { value_en: string; value_ta: string; json_value: Record<string, unknown> | null }>
) {
  const name = settings.trust_name?.value_en || 'Ilangathir Trust';
  const nameTa = settings.trust_name?.value_ta || 'இளங்கதிர் அறக்கட்டளை';
  const email = settings.email?.value_en || 'ilangathirtrust@gmail.com';
  const phone = settings.phone?.value_en || '+91 93630 15050';
  const address = settings.address?.value_en || 'V. Kallupatti, Dindigul - 624307, Tamil Nadu, India.';
  const logo = normalizeBrandAssetUrl(settings.logo_url?.value_en, STATIC_ASSETS.logo);
  const socials = (settings.social_links?.json_value || {}) as Record<string, string>;
  const sameAs = Object.values(socials).filter((v) => typeof v === 'string' && v.startsWith('http'));

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': ['NGO', 'Organization'],
        '@id': `${SITE_URL}/#organization`,
        name,
        legalName: settings.trust_legal_name?.value_en || 'Ilangathir Arakattalai',
        alternateName: [nameTa, 'Ilangathir Arakattalai', 'இளங்கதிர் அறக்கட்டளை திண்டுக்கல்'],
        url: SITE_URL,
        logo: {
          '@type': 'ImageObject',
          url: logo.startsWith('http') ? logo : `${SITE_URL}${logo}`
        },
        description:
          settings.footer_description?.value_en ||
          'Registered charitable trust in V. Kallupatti, Dindigul, Tamil Nadu supporting student education, rural medical camps, tree planting, and community welfare.',
        email,
        telephone: phone,
        knowsLanguage: ['en', 'ta'],
        knowsAbout: [
          'Student Education Support',
          'Free Medical & Eye Camps',
          'Environmental Care & Tree Planting',
          'Community Relief in Tamil Nadu'
        ],
        areaServed: [
          { '@type': 'City', name: 'Dindigul' },
          { '@type': 'State', name: 'Tamil Nadu' },
          { '@type': 'Country', name: 'India' }
        ],
        location: {
          '@type': 'Place',
          name: 'Ilangathir Trust Office — V. Kallupatti, Dindigul',
          address: {
            '@type': 'PostalAddress',
            streetAddress: address,
            addressLocality: 'V. Kallupatti, Dindigul',
            addressRegion: 'Tamil Nadu',
            postalCode: '624307',
            addressCountry: 'IN'
          },
          geo: {
            '@type': 'GeoCoordinates',
            latitude: 10.3673,
            longitude: 77.9803
          }
        },
        address: {
          '@type': 'PostalAddress',
          streetAddress: address,
          addressLocality: 'V. Kallupatti, Dindigul',
          addressRegion: 'Tamil Nadu',
          postalCode: '624307',
          addressCountry: 'IN'
        },
        contactPoint: [
          {
            '@type': 'ContactPoint',
            telephone: phone,
            email,
            contactType: 'customer support',
            areaServed: 'IN',
            availableLanguage: ['English', 'Tamil']
          }
        ],
        sameAs
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: `${name} | ${nameTa}`,
        inLanguage: ['en-IN', 'ta-IN'],
        publisher: { '@id': `${SITE_URL}/#organization` }
      }
    ]
  };
}

export function buildWebPageJsonLd(params: {
  title: string;
  description: string;
  path: string;
  lang: Language;
  type?: 'WebPage' | 'AboutPage' | 'ContactPage' | 'CollectionPage';
}) {
  const url = `${SITE_URL}${params.path}`;
  return {
    '@context': 'https://schema.org',
    '@type': params.type || 'WebPage',
    '@id': `${url}#webpage`,
    url,
    name: params.title,
    description: params.description,
    inLanguage: params.lang === 'ta' ? 'ta-IN' : 'en-IN',
    isPartOf: { '@id': `${SITE_URL}/#website` },
    about: { '@id': `${SITE_URL}/#organization` },
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['h1', 'main p']
    }
  };
}

export function buildBreadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`
    }))
  };
}

export function buildFaqJsonLd(faqs: BilingualFaq[], lang: Language) {
  if (!faqs?.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: lang === 'ta' ? 'ta-IN' : 'en-IN',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: lang === 'ta' && f.question_ta ? f.question_ta : f.question_en,
      acceptedAnswer: {
        '@type': 'Answer',
        text: lang === 'ta' && f.answer_ta ? f.answer_ta : f.answer_en
      }
    }))
  };
}

export function buildEventJsonLd(event: EventItem, lang: Language) {
  const title = pickLocalized(event as unknown as Record<string, unknown>, 'title', lang);
  const description =
    pickLocalized(event as unknown as Record<string, unknown>, 'summary', lang) ||
    pickLocalized(event as unknown as Record<string, unknown>, 'description', lang);
  const location = pickLocalized(event as unknown as Record<string, unknown>, 'location', lang);
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: title,
    description,
    inLanguage: lang === 'ta' ? 'ta-IN' : 'en-IN',
    startDate: event.start_time ? `${event.event_date}T${event.start_time}` : event.event_date,
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
    location: {
      '@type': 'Place',
      name: location || 'Dindigul, Tamil Nadu',
      address: location || 'Dindigul, Tamil Nadu, India'
    },
    image: event.banner_url ? [event.banner_url] : undefined,
    organizer: {
      '@type': 'Organization',
      name: 'Ilangathir Trust',
      url: SITE_URL
    }
  };
}

export function buildBlogPostingJsonLd(post: BlogPost, lang: Language) {
  const title = pickLocalized(post as unknown as Record<string, unknown>, 'title', lang);
  const excerpt = pickLocalized(post as unknown as Record<string, unknown>, 'excerpt', lang);
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description: excerpt,
    inLanguage: lang === 'ta' ? 'ta-IN' : 'en-IN',
    image: post.featured_image_url ? [post.featured_image_url] : undefined,
    datePublished: post.published_at || undefined,
    author: {
      '@type': 'Person',
      name: post.author_name || 'Ilangathir Trust'
    },
    publisher: {
      '@type': 'Organization',
      name: 'Ilangathir Trust',
      url: SITE_URL
    },
    mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`
  };
}

export function buildGalleryFolderJsonLd(folder: GalleryFolder, lang: Language) {
  const title = pickLocalized(folder as unknown as Record<string, unknown>, 'title', lang);
  const desc = pickLocalized(folder as unknown as Record<string, unknown>, 'description', lang);
  return {
    '@context': 'https://schema.org',
    '@type': 'ImageGallery',
    name: title,
    description: desc || title,
    inLanguage: lang === 'ta' ? 'ta-IN' : 'en-IN',
    url: `${SITE_URL}/gallery/${folder.slug}`,
    publisher: {
      '@type': 'Organization',
      name: 'Ilangathir Trust',
      url: SITE_URL
    }
  };
}
