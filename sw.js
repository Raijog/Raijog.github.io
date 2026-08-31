const CACHE_NAME = 'wetter-app-v1';

// Alle Dateien eintragen, die lokal auf dem Handy gespeichert werden sollen
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './icons.js',
  './input.js',
  './logic.js',
  './manifest.json'
];

// 1. Installation: Dateien in den Speicher laden
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Lädt die Kern-Dateien vorab
      cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// 2. Aktivierung: Alte Caches aufräumen
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. Laufzeit: Dateien aus Cache laden oder dynamic aus dem Netz holen (z.B. SVG-Icons)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        // Neue Anfragen (wie dynamisch geladene SVG-Icons) automatisch cachen
        if (event.request.method === 'GET' && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      });
    })
  );
});