// CalIO Service Worker v3
const CACHE_NAME = 'calio-v3';
const STATIC_ASSETS = [
  './index.html', './manifest.json', './offline.html',
  './icons/icon-192x192.png', './icons/icon-512x512.png', './icons/apple-touch-icon.png',
  'https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,300&family=DM+Serif+Display:ital@0;1&display=swap',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js',
];
const FIREBASE_ORIGINS = ['firestore.googleapis.com','firebase.googleapis.com','www.googleapis.com','identitytoolkit.googleapis.com'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c =>
    Promise.allSettled(STATIC_ASSETS.map(u => c.add(u).catch(()=>{})))
  ).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks =>
    Promise.all(ks.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))
  ).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const {request} = e;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (FIREBASE_ORIGINS.some(o => url.hostname.includes(o))) {
    e.respondWith(fetch(request).catch(() => new Response('',{status:503}))); return;
  }
  if (url.hostname === 'fonts.googleapis.com') { e.respondWith(swr(request)); return; }
  if (url.hostname === 'fonts.gstatic.com' || url.hostname === 'www.gstatic.com') { e.respondWith(cf(request)); return; }
  if (request.mode === 'navigate' || url.origin === self.location.origin) { e.respondWith(nf(request)); return; }
});
async function cf(req) {
  const c = await caches.match(req); if (c) return c;
  const r = await fetch(req); if (r.ok)(await caches.open(CACHE_NAME)).put(req,r.clone()); return r;
}
async function nf(req) {
  try { const r = await fetch(req); if(r.ok)(await caches.open(CACHE_NAME)).put(req,r.clone()); return r; }
  catch { const c = await caches.match(req); if(c) return c; return caches.match('./offline.html'); }
}
async function swr(req) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(req);
  fetch(req).then(r => { if(r.ok) cache.put(req,r.clone()); }).catch(()=>{});
  return cached || fetch(req);
}
self.addEventListener('push', e => {
  if (!e.data) return;
  const d = e.data.json();
  e.waitUntil(self.registration.showNotification(d.title||'CalIO',{body:d.body||'',icon:'./icons/icon-192x192.png',badge:'./icons/icon-96x96.png',tag:d.tag||'calio',data:d.url||'./'}));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.matchAll({type:'window'}).then(ws=>{
    for(const w of ws){if(w.url.includes('index.html')&&'focus'in w)return w.focus();}
    return clients.openWindow(e.notification.data||'./');
  }));
});
