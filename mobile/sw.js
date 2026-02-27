// CalIO Service Worker
// Strategy: Cache-first for assets, network-first for Firebase, offline fallback

const CACHE_NAME = 'calio-v1';
const STATIC_ASSETS = [
  './index.html',
  './manifest.json',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  'https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Serif+Display:ital@0;1&display=swap',
  'https://fonts.gstatic.com/s/dmsans/v14/rP2tp2ywxg089UriI5-g4vlH9VoD8Cmcqbu6-K6z9mXgjU0.woff2',
];

const FIREBASE_ORIGINS = [
  'firestore.googleapis.com',
  'firebase.googleapis.com',
  'www.googleapis.com',
  'identitytoolkit.googleapis.com'
];

// ── INSTALL ──
self.addEventListener('install', event => {
  console.log('[CalIO SW] Installing…');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Cache what we can, ignore failures (e.g. font preload during install)
      return Promise.allSettled(
        STATIC_ASSETS.map(url =>
          cache.add(url).catch(err => console.warn('[SW] Could not cache:', url, err.message))
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// ── ACTIVATE ──
self.addEventListener('activate', event => {
  console.log('[CalIO SW] Activating…');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => {
          console.log('[SW] Deleting old cache:', k);
          return caches.delete(k);
        })
      )
    ).then(() => self.clients.claim())
  );
});

// ── FETCH ──
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Firebase / external API — network only, no caching
  if (FIREBASE_ORIGINS.some(o => url.hostname.includes(o))) {
    event.respondWith(fetch(request).catch(() => new Response('', { status: 503 })));
    return;
  }

  // Google Fonts CSS — stale-while-revalidate
  if (url.hostname === 'fonts.googleapis.com') {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Font files — cache-first (they never change)
  if (url.hostname === 'fonts.gstatic.com') {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Firebase SDKs — cache-first
  if (url.hostname === 'www.gstatic.com') {
    event.respondWith(cacheFirst(request));
    return;
  }

  // App shell (local files) — cache-first with network fallback
  if (url.origin === self.location.origin || request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }
});

// ── STRATEGIES ──

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    // Fallback to index for navigation (SPA)
    if (request.mode === 'navigate') {
      const index = await caches.match('./index.html');
      if (index) return index;
    }
    return new Response('Offline — CalIO is not cached yet. Please visit once with internet.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => null);
  return cached || fetchPromise || new Response('', { status: 503 });
}

// ── PUSH NOTIFICATIONS (future) ──
self.addEventListener('push', event => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'CalIO', {
      body: data.body || '',
      icon: './icons/icon-192x192.png',
      badge: './icons/icon-96x96.png',
      tag: data.tag || 'calio',
      data: data.url || './'
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data || './')
  );
});

// ── BACKGROUND SYNC ──
self.addEventListener('sync', event => {
  if (event.tag === 'calio-sync') {
    // Firebase handles its own sync via offline persistence
    console.log('[SW] Background sync triggered');
  }
});
