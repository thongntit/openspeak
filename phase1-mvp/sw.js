// Service Worker for PWA
const CACHE_NAME = 'english-ai-v2';

// Assets to cache for phase1-mvp
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/phase1-mvp/',
  '/phase1-mvp/conversation.html',
  '/phase1-mvp/home.html',
  '/phase1-mvp/manifest.json'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching files:', ASSETS_TO_CACHE);
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => {
        console.log('[SW] Installation complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Installation failed:', error);
      })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
    .then(() => {
      console.log('[SW] Activation complete');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip chrome-extension and other non-http(s) requests
  if (!event.request.url.startsWith('http')) return;

  const url = event.request.url;

  // For model files and CDN resources, use network first
  if (url.includes('huggingface.co') ||
      url.includes('cdn.jsdelivr.net') ||
      url.includes('transformers')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          console.log('[SW] Network failed for model, trying cache:', url);
          return caches.match(event.request);
        })
    );
    return;
  }

  // For app files, use cache first
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          console.log('[SW] Serving from cache:', url);
          return response;
        }
        console.log('[SW] Cache miss, fetching:', url);
        return fetch(event.request).then((response) => {
          // Cache successful responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        });
      })
      .catch((error) => {
        console.error('[SW] Fetch failed:', error);
        // Fallback for HTML pages
        if (event.request.headers.get('accept').includes('text/html')) {
          return caches.match('/phase1-mvp/conversation.html');
        }
      })
  );
});

// Debug: Listen for messages from clients
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
    );
  }
});

// Log service worker state changes
self.addEventListener('controllerchange', () => {
  console.log('[SW] Controller changed');
});

self.addEventListener('installing', () => {
  console.log('[SW] Installing...');
});

self.addEventListener('activated', () => {
  console.log('[SW] Activated');
});
