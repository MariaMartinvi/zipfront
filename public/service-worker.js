// Service Worker con mejor sistema de depuración para solucionar el problema de compartir archivos desde WhatsApp

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
  
  // Este es el punto crítico: verificar si es una solicitud de compartir
  if (url.pathname === '/share-target' && event.request.method === 'POST') {
    debug('Solicitud de compartir detectada');
    
    event.respondWith((async () => {
      try {
        debug('Procesando solicitud de compartir');
        // Intentar extraer el FormData
        const formData = await event.request.formData();
        debug('FormData extraído');
        
        // Verificar qué campos contiene el FormData
        const formDataEntries = [];
        for (const pair of formData.entries()) {
          formDataEntries.push(`${pair[0]}: ${typeof pair[1]} (${pair[1] instanceof File ? 'File: ' + pair[1].name : pair[1]})`);
        }
        debug('Contenido de FormData', formDataEntries);
        
        // Intentar obtener el archivo ZIP
        const file = formData.get('zipFile');
        
        if (file && file instanceof File) {
          debug('Archivo encontrado', { name: file.name, type: file.type, size: file.size });
          
          // Almacenar el archivo con un ID único
          const shareId = Date.now().toString();
          sharedFiles.set(shareId, file);
          debug('Archivo almacenado con ID', shareId);
          
          // Buscar todos los clientes (ventanas/pestañas) asociados a este origen
          const allClients = await clients.matchAll({ type: 'window' });
          debug('Clientes encontrados', allClients.length);
          
          if (allClients.length > 0) {
            // Enviar el archivo directamente a todos los clientes
            allClients.forEach(client => {
              debug('Enviando archivo a cliente', client.id);
              client.postMessage({
                type: 'SHARED_FILE',
                file: file,
                shareId: shareId
              });
            });
            
            // Intentar abrir una ventana si no hay ninguna abierta
            if (allClients.length === 0) {
              debug('No hay clientes, intentando abrir uno nuevo');
              const newClient = await clients.openWindow('/');
              if (newClient) {
                debug('Nuevo cliente abierto');
              }
            }
            
            // Redirigir al cliente principal
            return Response.redirect('/?shared=' + shareId);
          } else {
            debug('No se encontraron clientes, redirigiendo a la página principal');
            return Response.redirect('/?shared=' + shareId);
          }
        } else {
          debug('Archivo no encontrado en FormData');
          // Si no encontramos el archivo bajo "zipFile", intentar buscar en otros campos
          let foundFile = null;
          for (const [key, value] of formData.entries()) {
            if (value instanceof File) {
              debug('Archivo encontrado en campo alternativo', { field: key, file: value.name });
              foundFile = value;
              break;
            }
          }
          
          if (foundFile) {
            // Procesarlo como si fuera el archivo correcto
            const shareId = Date.now().toString();
            sharedFiles.set(shareId, foundFile);
            
            const allClients = await clients.matchAll();
            allClients.forEach(client => {
              client.postMessage({
                type: 'SHARED_FILE',
                file: foundFile,
                shareId: shareId
              });
            });
            
            return Response.redirect('/?shared=' + shareId);
          }
        }
      } catch (error) {
        debug('Error procesando solicitud de compartir', error.toString());
      }
      
      // Si hay algún problema, redirigir con error
      return Response.redirect('/?error=share-failed');
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
      
      // Opcional: eliminar el archivo después de enviarlo
      // sharedFiles.delete(shareId);
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