/* eslint-disable no-restricted-globals */

// This service worker can be customized!
// See https://developers.google.com/web/tools/workbox/modules/workbox-recipes

// Simple service worker for PWA functionality
// No dependencies or complex imports for compatibility with Vercel

// Cache name
const CACHE_NAME = 'work-status-cache-v1';

// Assets to cache on install
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/static/js/main.*.js',
  '/static/css/main.*.css',
  '/static/media/*',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png'
];

// Install event - cache basic assets
self.addEventListener('install', event => {
  // Skip waiting so the new service worker activates immediately
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // Add all URLs to cache
        return cache.addAll([
          '/',
          '/index.html',
          '/favicon.ico',
          '/logo192.png',
          '/logo512.png',
          '/manifest.json'
        ]);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    }).then(() => {
      // Claim clients so the SW is in control immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - respond with cache then network strategy
self.addEventListener('fetch', event => {
  // Don't cache API calls or browser-sync
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('browser-sync')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached response if found
        if (response) {
          return response;
        }

        // Otherwise try the network
        return fetch(event.request)
          .then(response => {
            // Return the response if it's not valid or is not a basic GET
            if (!response || response.status !== 200 || response.type !== 'basic' ||
                event.request.method !== 'GET') {
              return response;
            }

            // Clone the response since it can only be consumed once
            const responseToCache = response.clone();

            // Add the new response to cache
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // If it's an HTML request and fails, show offline page
            if (event.request.headers.get('accept') &&
                event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/index.html');
            }
            
            // Generic error for other resources
            return new Response('Network error occurred', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// Handle messages (used for updating)
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// This is a periodic sync event 
// This will sync data when the user comes back online
self.addEventListener('sync', event => {
  if (event.tag === 'sync-todos') {
    event.waitUntil(syncTodos());
  }
});

// Function to sync todos with the server when back online
function syncTodos() {
  // Get saved unsaved operations from IndexedDB
  // This is just a placeholder for actual implementation
  return self.clients.matchAll()
    .then(clients => {
      clients.forEach(client => {
        // Notify the client that sync is complete
        client.postMessage({
          type: 'SYNC_COMPLETE'
        });
      });
    });
}

// Handle push notifications
self.addEventListener('push', event => {
  const data = event.data.json();
  const options = {
    body: data.body || 'Task update!',
    icon: '/logo192.png',
    badge: '/favicon.ico',
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Work Status', options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
}); 