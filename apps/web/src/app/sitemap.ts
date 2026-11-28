import type { MetadataRoute } from 'next';
import { isDonationsEnabled } from '@ilangathir/shared';
import { getBootstrap, getSitemapData, SITE_URL } from '@/lib/api';

export const revalidate = 300;

function bilingualAlternates(path: string) {
  const clean = path === '/' ? '' : path;
  return {
    languages: {
      en: `${SITE_URL}${clean || '/'}?lang=en`,
      ta: `${SITE_URL}${clean || '/'}?lang=ta`
    }
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [bootstrap, data] = await Promise.all([getBootstrap(), getSitemapData()]);
  const donationsEnabled = isDonationsEnabled(bootstrap.settings);

  const staticRoutes = [
    '',
    '/about',
    '/activities',
    '/events',
    '/gallery',
    '/blog',
    '/contact',
    '/privacy-policy',
    '/terms',
    '/refund-policy'
  ];
  if (donationsEnabled) {
    staticRoutes.push('/donate');
  }

  const now = new Date();

  const entries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${SITE_URL}${route || '/'}`,
    lastModified: now,
    changeFrequency:
      route === '' ? 'daily' : ['/privacy-policy', '/terms', '/refund-policy'].includes(route) ? 'monthly' : 'weekly',
    priority:
      route === '' ? 1.0 : ['/privacy-policy', '/terms', '/refund-policy'].includes(route) ? 0.5 : 0.85,
    alternates: bilingualAlternates(route || '/')
  }));

  for (const ev of data.events) {
    entries.push({
      url: `${SITE_URL}/events/${ev.slug}`,
      lastModified: ev.updated_at ? new Date(ev.updated_at) : now,
      changeFrequency: 'weekly',
      priority: 0.75,
      alternates: bilingualAlternates(`/events/${ev.slug}`)
    });
  }

  for (const post of data.blogs) {
    entries.push({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: post.updated_at ? new Date(post.updated_at) : now,
      changeFrequency: 'weekly',
      priority: 0.75,
      alternates: bilingualAlternates(`/blog/${post.slug}`)
    });
  }

  for (const folder of data.galleryFolders) {
    entries.push({
      url: `${SITE_URL}/gallery/${folder.slug}`,
      lastModified: folder.updated_at ? new Date(folder.updated_at) : now,
      changeFrequency: 'monthly',
      priority: 0.65,
      alternates: bilingualAlternates(`/gallery/${folder.slug}`)
    });
  }

  return entries;
}
