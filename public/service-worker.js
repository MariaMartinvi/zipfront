// Este es un service worker para la PWA

const CACHE_NAME = 'zip-extractor-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/static/js/main.chunk.js',
  '/static/js/0.chunk.js',
  '/static/js/bundle.js',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Manejo de peticiones fetch
self.addEventListener('fetch', (event) => {
  // Si es una solicitud a la API, no intentamos cachearla
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Si encontramos una coincidencia en la caché, la devolvemos
        if (response) {
          return response;
        }
        
        // Si no hay coincidencia, buscamos en la red
        return fetch(event.request).then(
          (response) => {
            // Si la respuesta no es válida, devolvemos la respuesta original
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clonamos la respuesta para almacenarla en caché
            var responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});

// Variables para almacenar el archivo compartido
let sharedFile = null;

// Gestionar solicitudes de archivos compartidos mediante POST
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Interceptar solicitudes POST para Web Share Target
  if (url.searchParams.has('share-target') && event.request.method === 'POST') {
    // Prevenir el comportamiento por defecto
    event.respondWith((async () => {
      // Extraer el FormData y guardar el archivo
      const formData = await event.request.formData();
      const file = formData.get('zipFile');
      
      if (file) {
        // Guardar el archivo compartido para su posterior uso
        sharedFile = file;
        
        // Redirigir a la aplicación principal con un parámetro de consulta
        return Response.redirect('/?share-target=true');
      }
      
      return Response.redirect('/');
    })());
  }
});

// Escuchar mensajes desde la aplicación principal
self.addEventListener('message', (event) => {
  // Si la aplicación solicita el archivo compartido
  if (event.data && event.data.type === 'GET_SHARED_FILE') {
    // Enviar el archivo a la aplicación
    event.source.postMessage({
      type: 'SHARED_FILE',
      file: sharedFile
    });
    
    // Limpiar después de enviar
    sharedFile = null;
  }
});