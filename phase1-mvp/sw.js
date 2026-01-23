// Service Worker for PWA
const CACHE_NAME = 'english-ai-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/conversation.html',
  '/index.html',
  '/manifest.json'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching files');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache');
            return caches.delete(cache);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip chrome-extension and other non-http(s) requests
  if (!event.request.url.startsWith('http')) return;

  // For model files and CDN resources, use network first
  if (event.request.url.includes('huggingface.co') ||
      event.request.url.includes('cdn.jsdelivr.net') ||
      event.request.url.includes('transformers')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // For app files, use cache first
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
      .catch(() => {
        // Fallback for HTML pages
        if (event.request.headers.get('accept').includes('text/html')) {
          return caches.match('/index.html');
        }
      })
  );
});
