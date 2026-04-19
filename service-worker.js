self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('travelcalc-v2').then(cache => {
      return cache.addAll([
        'index.html',
        'style.css',
        'script.js',
        'manifest.json'
      ]);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== 'travelcalc-v2').map(k => caches.delete(k)))
    )
  );
});

self.addEventListener('fetch', event => {
  // Network-first for API calls, cache-first for app shell
  if (event.request.url.includes('/api/') || event.request.url.includes('nominatim') || event.request.url.includes('router.project-osrm')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
  } else {
    event.respondWith(
      caches.match(event.request).then(response => response || fetch(event.request))
    );
  }
});