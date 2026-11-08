const CACHE_NAME = 'snake-id-shell-v2';
const APP_SHELL = [
  './', './index.html', './manifest.json', './css/styles.css',
  './js/app.js', './js/experience.js', './js/data/species.js',
  './js/services/storage.js', './js/services/identification.js',
  './js/services/commons.js', './icons/app-icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))));
  self.clients.claim();
});
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const requestURL = new URL(event.request.url);
  if (requestURL.hostname === 'commons.wikimedia.org' || requestURL.hostname.endsWith('.wikimedia.org')) return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
    if (response.ok && requestURL.origin === self.location.origin) {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
    }
    return response;
  }).catch(() => caches.match('./index.html'))));
});
