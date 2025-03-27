// El problema principal es asegurar que se detecte correctamente la solicitud de compartir

// Almacén temporal para archivos compartidos
const sharedFiles = new Map();

// Log para diagnóstico
self.addEventListener('install', event => {
  console.log('Service Worker instalado');
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('Service Worker activado');
  event.waitUntil(clients.claim());
});

// Interceptar peticiones POST para compartir archivos
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Verificar si es una solicitud de compartir (debemos verificar el pathname exacto)
  if (url.pathname === '/share-target' && event.request.method === 'POST') {
    console.log('Interceptando solicitud de compartir archivo');
    
    event.respondWith((async () => {
      try {
        // Intentar extraer el archivo del FormData
        const formData = await event.request.formData();
        console.log('FormData recibido, buscando zipFile');
        
        // Verificar si hay un archivo en zipFile (el nombre definido en manifest.json)
        const file = formData.get('zipFile');
        
        if (file) {
          console.log('Archivo recibido:', file.name, 'Tipo:', file.type);
          
          // Generar ID único para este archivo
          const shareId = Date.now().toString();
          sharedFiles.set(shareId, file);
          
          // Notificar a todos los clientes sobre el archivo compartido
          const clients = await self.clients.matchAll();
          for (const client of clients) {
            client.postMessage({
              type: 'SHARED_FILE',
              file: file
            });
          }
          
          // Redirigir a la página principal con el ID del archivo
          return Response.redirect('/?shared=' + shareId);
        } else {
          console.error('No se encontró archivo en el FormData');
          // Buscar qué hay en el FormData para diagnóstico
          for (const pair of formData.entries()) {
            console.log('FormData contiene:', pair[0], 'con valor tipo:', typeof pair[1]);
          }
        }
      } catch (error) {
        console.error('Error al procesar solicitud de compartir:', error);
      }
      
      // Si hay algún error, redirigir a la página principal con indicador de error
      return Response.redirect('/?error=compartir');
    })());
  }
});

// Escuchar mensajes de la aplicación
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'GET_SHARED_FILE') {
    const shareId = event.data.shareId;
    const file = sharedFiles.get(shareId);
    
    if (file) {
      event.source.postMessage({
        type: 'SHARED_FILE',
        file: file
      });
      
      // Limpiar después de enviar
      sharedFiles.delete(shareId);
    }
  }
});