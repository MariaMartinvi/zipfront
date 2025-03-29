
// Nombre de la cache
const CACHE_NAME = 'file-viewer-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/static/js/main.chunk.js',
  '/static/js/0.chunk.js',
  '/static/js/bundle.js',
  '/manifest.json',
  '/logo192.png',
  '/logo512.png',
  '/favicon.ico',
  '/static/css/main.chunk.css'
];

// Instalar el service worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache abierta');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activar el service worker
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Estrategia de caché: Cache primero, luego red
self.addEventListener('fetch', event => {
  // Ignorar solicitudes a la API del backend
  if (event.request.url.includes('/api/')) {
    return;
  }

  // Manejar el compartir archivos desde otras apps
  if (event.request.url.endsWith('/share-target') && event.request.method === 'POST') {
    event.respondWith(
      (async () => {
        const formData = await event.request.formData();
        const file = formData.get('file');
        
        // Redireccionar a la página principal con el archivo en el estado
        // (en una app real, guardaríamos el archivo en IndexedDB y lo leeríamos en el componente)
        return Response.redirect('/', 303);
      })()
    );
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Devolver desde la caché si está disponible
        if (response) {
          return response;
        }
        
        // Si no está en caché, buscar en la red
        return fetch(event.request)
          .then(response => {
            // Comprobar si recibimos una respuesta válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clonar la respuesta para guardarla en caché
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          });
      })
  );
});