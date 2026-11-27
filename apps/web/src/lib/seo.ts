import type { Metadata } from 'next';
import { pickLocalized, type BilingualFaq, type BlogPost, type EventItem, type Language } from '@ilangathir/shared';
import { SITE_URL } from './api';

export function buildPageMetadata(params: {
  title: string;
  description: string;
  path: string;
  lang: Language;
  ogImage?: string;
  keywords?: string;
}): Metadata {
  const canonicalPath = params.path.startsWith('/') ? params.path : `/${params.path}`;
  const canonicalUrl = `${SITE_URL}${canonicalPath}`;
  const image = params.ogImage || `${SITE_URL}/assets/ilangathir-logo.jpg`;

  return {
    title: params.title,
    description: params.description,
    keywords: params.keywords || undefined,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        en: `${SITE_URL}${canonicalPath}`,
        ta: `${SITE_URL}${canonicalPath}${canonicalPath.includes('?') ? '&' : '?'}lang=ta`,
        'x-default': `${SITE_URL}${canonicalPath}`
      }
    },
    openGraph: {
      title: params.title,
      description: params.description,
      url: canonicalUrl,
      siteName: params.lang === 'ta' ? 'இளங்கதிர் அறக்கட்டளை' : 'Ilangathir Trust',
      locale: params.lang === 'ta' ? 'ta_IN' : 'en_IN',
      type: 'website',
      images: [{ url: image, alt: params.title }]
    },
    twitter: {
      card: 'summary_large_image',
      title: params.title,
      description: params.description,
      images: [image]
    }
  };
}

export function buildOrganizationJsonLd(settings: Record<string, { value_en: string; value_ta: string; json_value: Record<string, unknown> | null }>) {
  const name = settings.trust_name?.value_en || 'Ilangathir Trust';
  const email = settings.email?.value_en || 'ilangathirtrust@gmail.com';
  const phone = settings.phone?.value_en || '+91 93630 15050';
  const address = settings.address?.value_en || 'V. Kallupatti, Dindigul - 624307, Tamil Nadu, India.';
  const logo = settings.logo_url?.value_en || `${SITE_URL}/assets/ilangathir-logo.jpg`;
  const socials = (settings.social_links?.json_value || {}) as Record<string, string>;
  const sameAs = Object.values(socials).filter((v) => typeof v === 'string' && v.startsWith('http'));

  return {
    '@context': 'https://schema.org',
    '@type': 'NGO',
    name,
    alternateName: ['Ilangathir Arakattalai', 'இளங்கதிர் அறக்கட்டளை'],
    url: SITE_URL,
    logo: logo.startsWith('http') ? logo : `${SITE_URL}${logo}`,
    email,
    telephone: phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: address,
      addressLocality: 'V. Kallupatti, Dindigul',
      addressRegion: 'Tamil Nadu',
      postalCode: '624307',
      addressCountry: 'IN'
    },
    sameAs
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
  const description = pickLocalized(event as unknown as Record<string, unknown>, 'summary', lang) ||
    pickLocalized(event as unknown as Record<string, unknown>, 'description', lang);
  const location = pickLocalized(event as unknown as Record<string, unknown>, 'location', lang);
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: title,
    description,
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
