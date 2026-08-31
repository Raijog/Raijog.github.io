const CACHE_NAME = 'wetter-app-v3';

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
    caches.keys().then((keys) => Promise.all(
      keys.map((key) => {
        if (key !== CACHE_NAME) return caches.delete(key);
      })
    ))
  );
  self.clients.claim();
});

// 3. Laufzeit: Dateien aus Cache laden oder dynamic aus dem Netz holen (z.B. SVG-Icons)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((res) => res || fetch(event.request))
  );
});