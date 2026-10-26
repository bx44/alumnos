/* ============================================================
   Service Worker · Metivta Or Barak — Alumnos

   IMPORTANTE: cada vez que cambies index.html, sube el número
   de CACHE. Si no lo haces, los teléfonos seguirán mostrando
   la versión vieja.
   ============================================================ */
const CACHE = 'orbarak-alumnos-v2';

const ARCHIVOS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png',
  './apple-touch-icon.png',
  './logo-tile.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ARCHIVOS).catch(() => c.add('./index.html')))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(llaves => Promise.all(
        llaves.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Las llamadas a Apps Script nunca se guardan en caché:
  // los datos del alumno siempre deben venir frescos.
  if (url.hostname.indexOf('script.google') !== -1 ||
      url.hostname.indexOf('googleusercontent') !== -1) {
    return;
  }

  if (e.request.method !== 'GET') return;

  // Red primero para el HTML, caché primero para lo demás.
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(r => {
          const copia = r.clone();
          caches.open(CACHE).then(c => c.put(e.request, copia));
          return r;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(r => {
      if (r && r.status === 200 && r.type === 'basic') {
        const copia = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, copia));
      }
      return r;
    }).catch(() => hit))
  );
});
