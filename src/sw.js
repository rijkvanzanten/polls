/* eslint-env serviceworker */
const cacheName = 'polls-v1.0.0';
const urlsToCache = [
  '',
  '/static/style.css',
  '/static/index.js',
  '/static/fontfaceobserver.js',
  '/static/lobster-regular-webfont.woff',
  '/static/lobster-regular-webfont.woff2',
  '/static/icons/manifest.json'
];

self.addEventListener('install', event => {
  // Perform install steps
  event.waitUntil(
    caches.open(cacheName)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});
