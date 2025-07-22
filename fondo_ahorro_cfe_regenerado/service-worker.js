self.addEventListener('install', e => {
  e.waitUntil(
    caches.open('fondo-ahorro').then(cache => {
      return cache.addAll([
        '/',
        '/index.html',
        '/app.html',
        '/styles.css',
        '/script.js'
      ]);
    })
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(response => response || fetch(e.request))
  );
});