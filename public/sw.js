const CACHE_NAME = 'cumpeo-turismo-v1';
const PRECACHE_ASSETS = [
  '/',
  '/mapa',
  '/historia',
  '/contacto',
  '/assets/icons/favicon.svg',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png',
  '/assets/images/condorito-oficial.png',
  '/assets/images/placeholder.webp',
];

// Install: precache essential shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('Pre-cache error during SW install:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate: cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Stale-While-Revalidate with network fallback
self.addEventListener('fetch', (event) => {
  // Ignore non-GET requests or admin mutations
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Do not cache admin routes or chrome-extensions
  if (url.pathname.startsWith('/admin') || !url.protocol.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(event.request);

      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          // If response is valid, update cache in background
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        })
        .catch(() => {
          // If offline and no match, return cached response if available
          return cachedResponse;
        });

      // Return cached version immediately if exists, or wait for network
      return cachedResponse || fetchPromise;
    })
  );
});
