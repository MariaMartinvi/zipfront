// Service Worker con mejor sistema de depuración para solucionar el problema de compartir archivos desde WhatsApp

// Almacén temporal para archivos compartidos
const sharedFiles = new Map();
// Registro para evitar procesar múltiples veces la misma solicitud
const processedRequests = new Set();

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
    
    // Generar un ID único basado en la URL y timestamp
    const requestId = `${url.toString()}-${Date.now()}`;
    
    // Verificar si ya procesamos esta solicitud (evita procesamiento duplicado)
    if (processedRequests.has(requestId)) {
      debug('Solicitud ya procesada, ignorando', requestId);
      event.respondWith(new Response('Already processed', { status: 200 }));
      return;
    }
    
    // Marcar esta solicitud como procesada
    processedRequests.add(requestId);
    
    // Establecer un tiempo de vida para las solicitudes procesadas (limpieza automática)
    setTimeout(() => {
      processedRequests.delete(requestId);
    }, 30000); // 30 segundos
    
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
          
          // Buscar solo la ventana principal para evitar duplicados
          const allClients = await clients.matchAll({ type: 'window' });
          debug('Clientes encontrados', allClients.length);
          
          // Solo enviar el archivo a UNA ventana (la primera disponible)
          if (allClients.length > 0) {
            const mainClient = allClients[0];
            debug('Enviando archivo únicamente al cliente principal', mainClient.id);
            
            mainClient.postMessage({
              type: 'SHARED_FILE',
              file: file,
              shareId: shareId
            });
            
            // Redirigir al cliente principal
            return Response.redirect('/?shared=' + shareId);
          } else {
            debug('No se encontraron clientes, abriendo uno nuevo');
            const newClient = await clients.openWindow('/?shared=' + shareId);
            
            // Si no pudimos abrir el cliente, simplemente redirigir
            if (!newClient) {
              debug('No se pudo abrir cliente, redirigiendo a la página principal');
              return Response.redirect('/?shared=' + shareId);
            }
            
            return new Response('Redirecting...', {
              headers: { 'Refresh': '0; url=/?shared=' + shareId }
            });
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
            
            // Solo notificar a la ventana principal
            const allClients = await clients.matchAll({ type: 'window' });
            if (allClients.length > 0) {
              const mainClient = allClients[0];
              mainClient.postMessage({
                type: 'SHARED_FILE',
                file: foundFile,
                shareId: shareId
              });
            }
            
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
      
      // Eliminar el archivo después de enviarlo para evitar procesar múltiples veces
      sharedFiles.delete(shareId);
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