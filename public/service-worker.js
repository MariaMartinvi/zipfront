// Este es un archivo plantilla que será procesado por workbox-cli
// No modifiques directamente el archivo service-worker.js en la carpeta build

importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.3/workbox-sw.js');

// Inicializar workbox
workbox.setConfig({
  debug: false
});

// IMPORTANTE: Esta línea es donde Workbox inyectará el manifiesto
// No la elimines o modifiques ya que es necesaria para el proceso de inyección
workbox.precaching.precacheAndRoute(self.__WB_MANIFEST);

// Configurar estrategias de caché personalizadas
// Caché para imágenes
workbox.routing.registerRoute(
  /\.(?:png|jpg|jpeg|svg|gif)$/,
  new workbox.strategies.CacheFirst({
    cacheName: 'images',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 días
      }),
    ],
  })
);

// Caché para peticiones API
workbox.routing.registerRoute(
  /^https?:.*\/api\//,
  new workbox.strategies.NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 5 * 60, // 5 minutos
      }),
    ],
  })
);

// Caché para navegación (HTML)
workbox.routing.registerRoute(
  /\/$/,
  new workbox.strategies.NetworkFirst({
    cacheName: 'html-cache',
  })
);

// Variables para almacenar el archivo compartido
let sharedFile = null;

// Gestionar solicitudes de archivos compartidos mediante POST
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Interceptar solicitudes POST para Web Share Target
  if (url.searchParams.has('share-target') && event.request.method === 'POST') {
    // Prevenir el comportamiento por defecto
    event.respondWith((async () => {
      try {
        // Extraer el FormData y guardar el archivo
        const formData = await event.request.formData();
        const file = formData.get('zipFile');
        
        if (file) {
          // Guardar el archivo compartido para su posterior uso
          sharedFile = file;
          
          // Redirigir a la aplicación principal con un parámetro de consulta
          return Response.redirect('/?share-target=true');
        }
      } catch (error) {
        console.error('Error procesando el archivo compartido:', error);
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