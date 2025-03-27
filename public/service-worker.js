// Service Worker simplificado para compartir archivos ZIP
// Versión optimizada para evitar problemas de precacheo

// Variables para almacenar temporalmente el archivo compartido
const sharedFiles = new Map();

// Log para diagnosticar la instalación del service worker
self.addEventListener('install', event => {
  console.log('Service Worker: Instalado');
  self.skipWaiting(); // Asegurar que el nuevo service worker tome el control inmediatamente
});

self.addEventListener('activate', event => {
  console.log('Service Worker: Activado');
  // Asegurar que el service worker tome el control de todas las páginas
  event.waitUntil(clients.claim());
});

// Gestionar solicitudes de archivos compartidos mediante POST
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Interceptar solicitudes POST para Web Share Target
  if (url.searchParams.has('share-target') && event.request.method === 'POST') {
    console.log('Service Worker: Interceptando un intento de compartir archivo');
    
    // Prevenir el comportamiento por defecto
    event.respondWith((async () => {
      try {
        // Extraer el FormData y guardar el archivo
        const formData = await event.request.formData();
        const file = formData.get('zipFile');
        
        if (file) {
          // Generar un ID único para este archivo compartido
          const shareId = Date.now().toString();
          
          // Guardar el archivo con su ID
          sharedFiles.set(shareId, file);
          
          // Notificar a todas las ventanas del cliente que hay un archivo compartido
          const allClients = await clients.matchAll();
          allClients.forEach(client => {
            client.postMessage({
              type: 'SHARED_FILE_AVAILABLE',
              shareId: shareId
            });
          });
          
          // Redirigir a la aplicación principal con el parámetro shareId
          return Response.redirect(`/?share-target=true&shareId=${shareId}`);
        }
      } catch (error) {
        console.error('Service Worker: Error procesando el archivo compartido:', error);
      }
      
      return Response.redirect('/');
    })());
  }
});

// Escuchar mensajes desde la aplicación principal
self.addEventListener('message', (event) => {
  // Si la aplicación solicita un archivo compartido específico
  if (event.data && event.data.type === 'GET_SHARED_FILE' && event.data.shareId) {
    const shareId = event.data.shareId;
    const file = sharedFiles.get(shareId);
    
    if (file) {
      // Enviar el archivo al cliente que lo solicitó
      event.source.postMessage({
        type: 'SHARED_FILE',
        file: file
      });
      
      // Limpiar después de enviar
      sharedFiles.delete(shareId);
    }
  }
});