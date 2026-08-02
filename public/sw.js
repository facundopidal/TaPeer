const CACHE_NAME = 'tapeer-v1';
const ASSETS_TO_CACHE = [
  './',
  'index.html',
  'app.js',
  'style.css',
  'manifest.json',
  'icon.svg'
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

// IndexedDB Storage Helper for Web Share Target
const DB_NAME = 'TaPeerShareDB';
const DB_VERSION = 1;
const STORE_NAME = 'pending_shares';

function openShareDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function savePendingShare(item) {
  try {
    const db = await openShareDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.add(item);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('Error saving pending share to IndexedDB in SW:', err);
  }
}

// Fetch Event - Intercept Web Share Target POST or serve cache
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Handle Web Share Target POST requests
  if (event.request.method === 'POST' && url.pathname.includes('/share-target')) {
    event.respondWith(
      (async () => {
        try {
          const formData = await event.request.formData();
          const title = formData.get('title') || '';
          const text = formData.get('text') || '';
          const shareUrl = formData.get('url') || '';
          const files = formData.getAll('file').concat(formData.getAll('files')).filter(f => f && f.name);

          const timestamp = Date.now();
          if (files.length > 0) {
            for (const file of files) {
              await savePendingShare({
                type: 'file',
                file: file,
                name: file.name,
                size: file.size,
                mimeType: file.type,
                timestamp
              });
            }
          } else {
            const combinedText = [text, shareUrl, title].filter(Boolean).join(' ');
            if (combinedText.trim()) {
              await savePendingShare({
                type: 'text',
                text: combinedText,
                timestamp
              });
            }
          }
        } catch (err) {
          console.error('Error processing Web Share Target in SW:', err);
        }
        return Response.redirect('./?share_sw=1', 303);
      })()
    );
    return;
  }

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
