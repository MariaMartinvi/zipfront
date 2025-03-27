// Service Worker con protección contra bucles de procesamiento
// Esta versión evita que el mismo archivo se procese múltiples veces

// Almacén temporal para archivos compartidos
const sharedFiles = new Map();

// Control para evitar procesamiento duplicado
const processedRequests = new Set();

// Función para depuración
const debug = (message, data) => {
  const logMessage = `[SW] ${message}`;
  if (data) {
    console.log(logMessage, data);
  } else {
    console.log(logMessage);
  }
};

self.addEventListener('install', event => {
  debug('Instalado');
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  debug('Activado');
  event.waitUntil(clients.claim());
});

// Interceptar solicitudes de compartir
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Verificar si es una solicitud de compartir
  if (url.pathname === '/share-target' && event.request.method === 'POST') {
    // Generar un ID único para esta solicitud basado en la URL y timestamp
    const requestId = `${url.pathname}-${Date.now()}`;
    
    // Verificar si ya hemos procesado esta solicitud recientemente (en los últimos 5 segundos)
    const recentRequests = Array.from(processedRequests)
      .filter(id => id.startsWith(url.pathname) && 
              Date.now() - parseInt(id.split('-')[1]) < 5000);
              
    if (recentRequests.length > 0) {
      debug('Solicitud duplicada detectada, ignorando', requestId);
      event.respondWith(Response.redirect('/?error=duplicado'));
      return;
    }
    
    // Marcar esta solicitud como procesada
    processedRequests.add(requestId);
    
    // Limpiar solicitudes antiguas (más de 10 segundos)
    for (const id of processedRequests) {
      if (Date.now() - parseInt(id.split('-')[1]) > 10000) {
        processedRequests.delete(id);
      }
    }
    
    debug('Procesando solicitud de compartir', requestId);
    
    event.respondWith((async () => {
      try {
        // Extraer el FormData
        const formData = await event.request.formData();
        
        // Verificar qué contiene el FormData
        const formDataEntries = [];
        for (const pair of formData.entries()) {
          formDataEntries.push(`${pair[0]}: ${typeof pair[1]}`);
        }
        debug('FormData', formDataEntries);
        
        // Buscar el archivo ZIP
        let file = formData.get('zipFile');
        
        // Si no encontramos el archivo como 'zipFile', buscar en otros campos
        if (!file || !(file instanceof File)) {
          for (const [key, value] of formData.entries()) {
            if (value instanceof File) {
              debug('Archivo encontrado en campo alternativo', key);
              file = value;
              break;
            }
          }
        }
        
        if (file && file instanceof File) {
          debug('Archivo procesado correctamente', {
            name: file.name,
            type: file.type,
            size: file.size
          });
          
          // Generar ID único para el archivo
          const shareId = `file-${Date.now()}`;
          sharedFiles.set(shareId, file);
          
          // Obtener todos los clientes
          const allClients = await clients.matchAll({ type: 'window' });
          debug('Clientes encontrados', allClients.length);
          
          // Enviar el archivo a todos los clientes activos
          for (const client of allClients) {
            client.postMessage({
              type: 'SHARED_FILE',
              file: file,
              shareId: shareId,
              timestamp: Date.now()
            });
          }
          
          // Redirigir a la página principal con el ID del archivo
          // Usar URL con parámetros únicos para evitar bucles por caché
          return Response.redirect(`/?shared=${shareId}&t=${Date.now()}`);
        } else {
          debug('No se encontró ningún archivo');
          return Response.redirect('/?error=no-file');
        }
      } catch (error) {
        debug('Error procesando solicitud', error.toString());
        return Response.redirect('/?error=process');
      }
    })());
  }
});

// Escuchar mensajes de la aplicación
self.addEventListener('message', event => {
  const data = event.data;
  
  if (!data || !data.type) return;
  
  switch (data.type) {
    case 'GET_SHARED_FILE':
      const shareId = data.shareId;
      const file = sharedFiles.get(shareId);
      
      if (file) {
        debug('Enviando archivo solicitado', shareId);
        event.source.postMessage({
          type: 'SHARED_FILE',
          file: file,
          shareId: shareId,
          timestamp: Date.now()
        });
        
        // Limpiar después de enviar
        sharedFiles.delete(shareId);
      } else {
        debug('Archivo no encontrado', shareId);
        event.source.postMessage({
          type: 'SHARED_FILE_ERROR',
          error: 'Archivo no encontrado o ya procesado'
        });
      }
      break;
      
    case 'PING':
      event.source.postMessage({ type: 'PONG' });
      break;
      
    case 'CLEAR_SHARED_FILES':
      debug('Limpiando archivos compartidos');
      sharedFiles.clear();
      processedRequests.clear();
      event.source.postMessage({ type: 'CLEARED' });
      break;
  }
});v