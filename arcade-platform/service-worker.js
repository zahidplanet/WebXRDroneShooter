const CACHE_NAME = 'ar-cade-v1';
const urlsToCache = [
  './',
  './index.html',
  './lobby/index.html',
  './lobby/lobby.js',
  './games/config.json',
  './games/drone-shooter/index.html',
  './manifest.json',
  'https://aframe.io/releases/1.3.0/aframe.min.js',
  'https://unpkg.com/aframe-event-set-component@5.0.0/dist/aframe-event-set-component.min.js',
  'https://raw.githack.com/AR-js-org/AR.js/master/aframe/build/aframe-ar.js',
  'https://unpkg.com/aframe-particle-system-component@1.0.x/dist/aframe-particle-system-component.min.js'
];

// Install service worker
self.addEventListener('install', event => {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch resources
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request).then(
          response => {
            // Check if we received a valid response
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
}); 