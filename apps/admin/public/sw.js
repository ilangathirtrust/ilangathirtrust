const ADMIN_CACHE = 'ilangathir-admin-shell-v1';
const SHELL_URLS = ['/icons/icon-192.png', '/icons/icon-512.png', '/logo.webp'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(ADMIN_CACHE).then((c) => c.addAll(SHELL_URLS)).catch(() => { })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== ADMIN_CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Strictly never cache API calls, auth endpoints, or cross-origin Supabase requests
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) {
    return;
  }

  // Network-only for HTML documents so auth & CSP headers are always fresh
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request));
    return;
  }

  // Cache-first only for static JS/CSS/icon bundles
  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const net = fetch(request)
          .then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(ADMIN_CACHE).then((c) => c.put(request, copy)).catch(() => { });
            }
            return res;
          })
          .catch(() => cached);
        return cached || net;
      })
    );
  }
});
