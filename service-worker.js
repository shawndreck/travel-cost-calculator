self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('fuelcalc-v1').then(cache => {
      return cache.addAll([
        'index.html',
        'style.css',
        'script.js',
        'manifest.json',
        'icon.png'
      ]);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});