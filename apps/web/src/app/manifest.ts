import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Ilangathir Trust | இளங்கதிர் அறக்கட்டளை',
    short_name: 'Ilangathir',
    description:
      'Registered charitable trust in V. Kallupatti, Dindigul, Tamil Nadu supporting student education, free medical camps, and community welfare.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#FAF7F2',
    theme_color: '#13294B',
    categories: ['social', 'education', 'lifestyle'],
    lang: 'en',
    dir: 'ltr',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ],
    shortcuts: [
      {
        name: 'Activities & Programmes',
        short_name: 'Activities',
        url: '/activities',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }]
      },
      {
        name: 'Events & Camps',
        short_name: 'Events',
        url: '/events',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }]
      },
      {
        name: 'Photo Gallery',
        short_name: 'Gallery',
        url: '/gallery',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }]
      },
      {
        name: 'Contact & Volunteer',
        short_name: 'Contact',
        url: '/contact',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }]
      }
    ]
  };
}
