// Service Worker mejorado para compartir archivos desde WhatsApp
// Soluciona el problema de "Not allowed to open a window"

// Almacén temporal para archivos compartidos
const sharedFiles = new Map();

// Función de utilidad para depuración
const debug = (message, data) => {
  const logMessage = `[SW Debug] ${message}`;
  if (data) {
    console.log(logMessage, data);
  } else {
    console.log(logMessage);
  }
};

// Instalación del Service Worker
self.addEventListener('install', event => {
  debug('Service Worker instalado');
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  debug('Service Worker activado');
  // Asegurar que el service worker tome el control de todas las páginas
  event.waitUntil(clients.claim());
  debug('clients.claim() ejecutado');
});

// Interceptar solicitudes de compartir
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  debug('Fetch interceptado', { url: url.pathname, method: event.request.method });
  
  // Verificar si es una solicitud de compartir
  if (url.pathname === '/share-target' && event.request.method === 'POST') {
    debug('Solicitud de compartir desde WhatsApp detectada');
    
    event.respondWith((async () => {
      try {
        debug('Procesando solicitud de compartir');
        // Intentar extraer el FormData
        const formData = await event.request.formData();
        debug('FormData extraído correctamente');
        
        // Verificar qué campos contiene el FormData
        const formDataEntries = [];
        for (const pair of formData.entries()) {
          formDataEntries.push(`${pair[0]}: ${typeof pair[1]} (${pair[1] instanceof File ? 'File: ' + pair[1].name : pair[1]})`);
        }
        debug('Contenido de FormData', formDataEntries);
        
        // Intentar obtener el archivo ZIP
        let file = formData.get('zipFile');
        
        // Si no está en zipFile, buscar en todos los campos
        if (!file || !(file instanceof File)) {
          debug('Archivo no encontrado en campo zipFile, buscando en todos los campos');
          for (const [key, value] of formData.entries()) {
            if (value instanceof File) {
              debug(`Archivo encontrado en campo: ${key}`);
              file = value;
              break;
            }
          }
        }
        
        if (file && file instanceof File) {
          debug('Archivo encontrado', { name: file.name, type: file.type, size: file.size });
          
          // Almacenar el archivo con un ID único
          const shareId = Date.now().toString();
          sharedFiles.set(shareId, file);
          debug('Archivo almacenado con ID', shareId);
          
          // Buscar ventanas existentes
          const allClients = await clients.matchAll({ type: 'window' });
          debug(`Clientes encontrados: ${allClients.length}`);
          
          // Si hay ventanas existentes, usarlas en lugar de abrir una nueva
          if (allClients.length > 0) {
            // Encontrar la ventana más adecuada (preferiblemente la raíz)
            const targetClient = allClients.find(client => 
              new URL(client.url).pathname === '/' || 
              new URL(client.url).pathname === '/index.html'
            ) || allClients[0];
            
            debug('Enviando archivo al cliente existente', targetClient.id);
            
            // Notificar a la ventana sobre el archivo compartido
            targetClient.postMessage({
              type: 'SHARED_FILE',
              file: file,
              shareId: shareId
            });
            
            // Enfocar la ventana existente y navegar a la página con el parámetro
            await targetClient.navigate('/?shared=' + shareId);
            await targetClient.focus();
            
            return new Response('Procesando archivo...', {
              headers: { 'Content-Type': 'text/plain' }
            });
          } else {
            // Si no hay ventanas, simplemente redirigir
            debug('No hay clientes abiertos, usando redirección normal');
            return Response.redirect('/?shared=' + shareId);
          }
        } else {
          debug('No se encontró ningún archivo en la solicitud');
          return Response.redirect('/?error=no-file-found');
        }
      } catch (error) {
        debug('Error procesando solicitud de compartir', error.toString());
        // En caso de error, redirigir con información de error
        return Response.redirect('/?error=share-failed&reason=' + encodeURIComponent(error.message));
      }
    })());
  }
});

// Escuchar mensajes de la aplicación
self.addEventListener('message', event => {
  debug('Mensaje recibido', event.data);
  
  if (event.data && event.data.type === 'GET_SHARED_FILE') {
    const shareId = event.data.shareId;
    debug('Solicitud de archivo compartido', shareId);
    
    const file = sharedFiles.get(shareId);
    
    if (file) {
      debug('Archivo encontrado, enviando al cliente');
      event.source.postMessage({
        type: 'SHARED_FILE',
        file: file,
        shareId: shareId
      });
      
      // Mantener el archivo por un tiempo adicional por si hay recargas
      setTimeout(() => {
        // Eliminar el archivo después de un tiempo para liberar memoria
        sharedFiles.delete(shareId);
        debug('Archivo eliminado de la memoria después del timeout', shareId);
      }, 30000); // 30 segundos
    } else {
      debug('Archivo no encontrado para el ID solicitado');
      event.source.postMessage({
        type: 'SHARED_FILE_ERROR',
        error: 'Archivo no encontrado'
      });
    }
  } else if (event.data && event.data.type === 'PING') {
    debug('Ping recibido, respondiendo con pong');
    event.source.postMessage({
      type: 'PONG'
    });
  }
});
