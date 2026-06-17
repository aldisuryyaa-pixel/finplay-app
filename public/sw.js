self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Meloloskan paket data request tanpa memblokir jaringan
  event.respondWith(fetch(event.request));
});