
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
        // Cachear URLs básicas solamente, no intentar cachear la ruta share-target
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Error cacheando recursos:', error);
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

// Manejar las solicitudes de navegación a share-target
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Manejar específicamente la ruta share-target
  if (url.pathname === '/share-target') {
    // Si es POST (posiblemente compartiendo un archivo)
    if (event.request.method === 'POST') {
      event.respondWith(
        (async () => {
          try {
            // Redireccionar a la página principal
            return Response.redirect('/', 303);
          } catch (error) {
            console.error('Error manejando compartido:', error);
            return new Response('Error procesando el archivo compartido', {
              status: 500
            });
          }
        })()
      );
      return;
    } else {
      // Si es GET (navegación normal a share-target)
      event.respondWith(
        caches.match('/index.html')
          .then(response => {
            return response || fetch('/index.html');
          })
      );
      return;
    }
  }

  // Para otras solicitudes, aplicar estrategia cache-first
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Devolver desde caché si está disponible
        if (response) {
          return response;
        }
        // Si no, obtener de la red
        return fetch(event.request).catch(error => {
          console.error('Error fetching:', error);
          // Si es una página de navegación, devolver la página principal
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          // De lo contrario, dejar que el error se propague
          throw error;
        });
      })
  );
});

// Manejar mensajes (para depuración)
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});