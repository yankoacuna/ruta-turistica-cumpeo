/**
 * sw.js — Cumpeo Turismo Service Worker
 * Estrategia: Cache-first para assets estáticos, Network-first para datos JSON
 */

const CACHE_NAME    = 'cumpeo-turismo-v9';
const DATA_CACHE    = 'cumpeo-data-v9';

// Assets que se cachean en la instalación (shell de la app)
const STATIC_ASSETS = [
  './',
  './index.html',
  './mapa.html',
  './destino.html',
  './css/main.css',
  './css/components.css',
  './css/map.css',
  './js/app.js',
  './js/data.js',
  './js/ui.js',
  './js/map.js',
  './assets/images/condorito-oficial.png',
  './manifest.json'
];

// ── Install: pre-cachear shell ─────────────────────────────
self.addEventListener('install', event => {
  console.log('[SW] Instalando…');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Pre-cacheando shell');
        return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'reload' })));
      })
      .catch(err => console.warn('[SW] Error pre-cacheando:', err))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: limpiar caches viejas ───────────────────────
self.addEventListener('activate', event => {
  console.log('[SW] Activando…');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k !== DATA_CACHE)
          .map(k => {
            console.log('[SW] Eliminando cache antigua:', k);
            return caches.delete(k);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: estrategia diferenciada ────────────────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Ignorar peticiones a Google Maps API (no cachear)
  if (url.hostname.includes('googleapis.com') || url.hostname.includes('gstatic.com')) {
    return;
  }

  // Para archivos JSON de datos: Network-first (actualizados por el admin)
  if (url.pathname.includes('/data/') && url.pathname.endsWith('.json')) {
    event.respondWith(networkFirstJSON(event.request));
    return;
  }

  // Para peticiones a la API PHP: siempre red
  if (url.pathname.includes('/api/')) {
    return;
  }

  // Para assets estáticos: Cache-first
  event.respondWith(cacheFirst(event.request));
});

// ── Estrategia: Cache-first ────────────────────────────────
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response && response.status === 200 && response.type !== 'opaque') {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Si es una página HTML, devolver index.html como fallback
    if (request.headers.get('Accept')?.includes('text/html')) {
      return caches.match('./index.html');
    }
    return new Response('Contenido no disponible offline', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}

// ── Estrategia: Network-first (para JSON de datos) ─────────
async function networkFirstJSON(request) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(DATA_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Intentar desde caché si no hay red
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response('{"error":"offline"}', {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// ── Notificaciones push (preparado para futuro) ────────────
self.addEventListener('push', event => {
  if (!event.data) return;
  const data = event.data.json();
  self.registration.showNotification(data.title || 'Cumpeo Turismo', {
    body:  data.body  || 'Nueva información disponible',
    icon:  './assets/icons/icon-192.png',
    badge: './assets/icons/icon-72.png',
    data:  { url: data.url || './' }
  });
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url || './';
  event.waitUntil(clients.openWindow(url));
});
