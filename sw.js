/* ============================================================
   Service Worker · Metivta Or Barak — Alumnos

   IMPORTANTE: cada vez que cambies index.html, sube el número
   de CACHE. Si no lo haces, los teléfonos seguirán mostrando
   la versión vieja.
   ============================================================ */
const CACHE = 'orbarak-alumnos-v13';

const ARCHIVOS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png',
  './apple-touch-icon.png',
  './logo-tile.png',
  './juegos/hexterra/',
  './juegos/rompeelmuro/'
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


/* ============================================================
   Avisos al celular

   El aviso lo dibuja aqui Or+, no Firebase: asi se ve como la app
   y no como una notificacion generica. El mensaje viene en 'data',
   nunca en 'notification', justo para que Firebase no lo dibuje solo.

   Lo que llega aqui aparece en la pantalla bloqueada, donde lo puede
   leer cualquiera que tenga el telefono en la mano. Por eso el backend
   nunca manda calificaciones ni faltas: solo avisos y textos neutros.
   ============================================================ */

self.addEventListener('push', e => {
  let d = {};
  try {
    const bruto = e.data ? e.data.json() : {};
    d = bruto.data || bruto || {};
  } catch (err) {
    d = { titulo: 'Or+', cuerpo: e.data ? e.data.text() : '' };
  }

  const titulo = d.titulo || 'Or+';
  const opciones = {
    body: d.cuerpo || '',
    icon: './icon-192.png',
    badge: './icon-192.png',
    lang: 'es',
    tag: d.tag || 'or-mas',
    renotify: false,
    data: { ruta: d.ruta || './' }
  };
  e.waitUntil(self.registration.showNotification(titulo, opciones));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const destino = new URL((e.notification.data && e.notification.data.ruta) || './',
                          self.location.origin).href;
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(abiertas => {
      for (const c of abiertas) {
        if (c.url.indexOf(self.location.origin) === 0 && 'focus' in c) return c.focus();
      }
      return self.clients.openWindow ? self.clients.openWindow(destino) : null;
    })
  );
});
