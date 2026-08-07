const CACHE_NAME = 'tapeer-v6';
const ASSETS_TO_CACHE = [
  './',
  'index.html',
  'app.js',
  'style.css',
  'manifest.json',
  'icon.svg',
  'icon-192.png',
  'icon-512.png'
];

// Install Event - Pre-cache core skeleton assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up old caches
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
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Serve cached static assets, pass everything else to the network.
// Web Share Target POSTs are intentionally NOT intercepted: they are handled
// server-side by POST /share-target, which stores the item and redirects with
// ?shared=1&id=... so the page can surface the resulting link directly.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only intercept GET requests for static caching
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip caching for dynamic API endpoints and downloads/snippets
  const isDynamicRoute = 
    url.pathname.includes('/items') ||
    url.pathname.includes('/download') ||
    url.pathname.includes('/snippet') ||
    url.pathname.includes('/upload') ||
    url.pathname.includes('/text');

  if (isDynamicRoute) {
    return; // Let the browser fetch directly from the network
  }

  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request);
    })
  );
});
