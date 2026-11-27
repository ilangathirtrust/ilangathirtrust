import type { MetadataRoute } from 'next';
import { getSitemapData, SITE_URL } from '@/lib/api';

export const revalidate = 600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = ['', '/about', '/activities', '/events', '/gallery', '/blog', '/donate', '/contact'];
  const now = new Date();

  const data = await getSitemapData();

  const entries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${SITE_URL}${route || '/'}`,
    lastModified: now,
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1.0 : 0.8
  }));

  for (const ev of data.events) {
    entries.push({
      url: `${SITE_URL}/events/${ev.slug}`,
      lastModified: ev.updated_at ? new Date(ev.updated_at) : now,
      changeFrequency: 'weekly',
      priority: 0.7
    });
  }

  for (const post of data.blogs) {
    entries.push({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: post.updated_at ? new Date(post.updated_at) : now,
      changeFrequency: 'weekly',
      priority: 0.75
    });
  }

  for (const folder of data.galleryFolders) {
    entries.push({
      url: `${SITE_URL}/gallery/${folder.slug}`,
      lastModified: folder.updated_at ? new Date(folder.updated_at) : now,
      changeFrequency: 'monthly',
      priority: 0.65
    });
  }

  return entries;
}
