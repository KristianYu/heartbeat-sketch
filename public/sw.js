const CACHE_NAME = 'heartbeat-v3';
const STATIC_CACHE = 'heartbeat-static-v3';

const STATIC_ASSETS = [
  '/icon.svg',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== STATIC_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API / socket.io requests — network only, never cache
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/socket.io/')) {
    return;
  }

  // Static assets (JS, CSS, fonts, icons) — cache-first
  if (
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/node_modules/') ||
    url.pathname.startsWith('/@') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js') ||
    url.pathname === '/manifest.json'
  ) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((res) => {
        const clone = res.clone();
        caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
        return res;
      }))
    );
    return;
  }

  // Navigation (HTML) — network-first
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return res;
        })
        .catch(() =>
          caches.match(request).then((cached) => {
            if (cached) return cached;
            // Offline fallback: return cached root page
            return caches.match('/');
          })
        )
    );
    return;
  }

  // Everything else — network-first
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
