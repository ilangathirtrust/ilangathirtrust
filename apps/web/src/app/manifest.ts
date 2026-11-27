import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Ilangathir Trust',
    short_name: 'Ilangathir Trust',
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
      { src: '/logos/icon-72.png', sizes: '72x72', type: 'image/png', purpose: 'any' },
      { src: '/logos/icon-96.png', sizes: '96x96', type: 'image/png', purpose: 'any' },
      { src: '/logos/icon-128.png', sizes: '128x128', type: 'image/png', purpose: 'any' },
      { src: '/logos/icon-144.png', sizes: '144x144', type: 'image/png', purpose: 'any' },
      { src: '/logos/icon-152.png', sizes: '152x152', type: 'image/png', purpose: 'any' },
      { src: '/logos/icon-180.png', sizes: '180x180', type: 'image/png', purpose: 'any' },
      { src: '/logos/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/logos/icon-256.png', sizes: '256x256', type: 'image/png', purpose: 'any' },
      { src: '/logos/icon-384.png', sizes: '384x384', type: 'image/png', purpose: 'any' },
      { src: '/logos/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/logos/icon-192-maskable.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/logos/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/logos/adaptive-icon-monochrome.png', sizes: '432x432', type: 'image/png', purpose: 'monochrome' }
    ],
    shortcuts: [
      {
        name: 'Activities & Programmes',
        short_name: 'Activities',
        url: '/activities',
        icons: [{ src: '/logos/icon-192.png', sizes: '192x192', type: 'image/png' }]
      },
      {
        name: 'Events & Camps',
        short_name: 'Events',
        url: '/events',
        icons: [{ src: '/logos/icon-192.png', sizes: '192x192', type: 'image/png' }]
      },
      {
        name: 'Photo Gallery',
        short_name: 'Gallery',
        url: '/gallery',
        icons: [{ src: '/logos/icon-192.png', sizes: '192x192', type: 'image/png' }]
      },
      {
        name: 'Contact & Volunteer',
        short_name: 'Contact',
        url: '/contact',
        icons: [{ src: '/logos/icon-192.png', sizes: '192x192', type: 'image/png' }]
      }
    ]
  };
}
