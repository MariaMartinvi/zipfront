// Service Worker simplificado - elimina por completo el error de focus
// Versión 1.1 - Excluye Firebase Auth de interceptación
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

// Función para verificar si un archivo es probablemente un ZIP
// Ahora extremadamente permisiva
const isLikelyZipFile = (file) => {
  // Verificar por tipo MIME o extensión o nombre que contenga "zip"
  return file.type === 'application/zip' || 
         file.type === 'application/x-zip' || 
         file.type === 'application/x-zip-compressed' ||
         file.type === 'application/octet-stream' || // Tipos comunes de Google Drive
         file.type === '' || // Google Drive puede enviar tipo vacío
         file.name.toLowerCase().endsWith('.zip') ||
         file.name.toLowerCase().includes('zip');  // Por si el nombre contiene "zip" en cualquier parte
};

// Función para intentar corregir un archivo que no tiene tipo MIME correcto
const fixFileMimeType = (file) => {
  if (file.type === 'application/zip') {
    return file; // Ya tiene el tipo correcto
  }
  
  try {
    // Intentar crear un nuevo archivo con el tipo correcto
    return new File([file], file.name, {
      type: 'application/zip',
      lastModified: file.lastModified
    });
  } catch (error) {
    debug('Error al corregir tipo MIME del archivo', error);
    // Si falla, devolver el archivo original
    return file;
  }
};

// Instalación del Service Worker
self.addEventListener('install', event => {
  debug('Service Worker instalado - Versión 1.1');
  self.skipWaiting(); // Forzar activación inmediata
});

self.addEventListener('activate', event => {
  debug('Service Worker activado');
  event.waitUntil(clients.claim());
});

// Interceptar solicitudes de compartir
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // NO interceptar llamadas de Firebase Auth
  if (url.hostname.includes('identitytoolkit.googleapis.com') || 
      url.hostname.includes('securetoken.googleapis.com') ||
      url.hostname.includes('firebase') ||
      url.pathname.includes('/v1/accounts:') ||
      url.pathname.includes('/v1/token')) {
    debug('Saltando interceptación para Firebase Auth', { url: url.href });
    return; // Dejar que la request pase normalmente
  }
  
  debug('Fetch interceptado', { url: url.pathname, method: event.request.method });
  
  if (url.pathname === '/share-target' && event.request.method === 'POST') {
    debug('Solicitud de compartir desde WhatsApp detectada');
    
    event.respondWith((async () => {
      try {
        debug('Procesando solicitud de compartir');
        const formData = await event.request.formData();
        debug('FormData extraído correctamente');
        
        // Verificar contenido del FormData
        const formDataEntries = [];
        for (const pair of formData.entries()) {
          formDataEntries.push(`${pair[0]}: ${typeof pair[1]} (${pair[1] instanceof File ? 'File: ' + pair[1].name : pair[1]})`);
        }
        debug('Contenido de FormData', formDataEntries);
        
        // Buscar archivo en todos los campos
        let file = null;
        for (const [key, value] of formData.entries()) {
          if (value instanceof File) {
            debug(`Archivo encontrado en campo: ${key}`);
            file = value;
            break;
          }
        }
        
        if (file && file instanceof File) {
          debug('Archivo encontrado', { name: file.name, type: file.type, size: file.size });
          
          // Verificar si probablemente es un ZIP
          const likelyZip = isLikelyZipFile(file);
          debug('¿Es probablemente un ZIP?', likelyZip);
          
          // Siempre aceptar el archivo, incluso si no parece ser un ZIP
          // La app principal hará verificaciones más exhaustivas
          
          // Intentar corregir el tipo MIME si es necesario
          if (file.name.toLowerCase().endsWith('.zip') && file.type !== 'application/zip') {
            file = fixFileMimeType(file);
            debug('Tipo MIME corregido:', file.type);
          }
          
          // Almacenar el archivo con un ID único
          const shareId = Date.now().toString();
          sharedFiles.set(shareId, file);
          debug('Archivo almacenado con ID', shareId);
          
          // Buscar clientes existentes
          const allClients = await clients.matchAll({ type: 'window' });
          debug(`Clientes encontrados: ${allClients.length}`);
          
          // Enviar mensaje al cliente si existe
          if (allClients.length > 0) {
            const client = allClients[0];
            debug('Enviando mensaje al cliente', client.id);
            client.postMessage({
              type: 'SHARED_FILE',
              file: file,
              shareId: shareId
            });
          }
          
          // IMPORTANTE: Siempre usar redirección simple, sin importar si hay clientes
          return Response.redirect('/?shared=' + shareId);
        } else {
          debug('No se encontró ningún archivo en la solicitud');
          return Response.redirect('/?error=no-file-found');
        }
      } catch (error) {
        debug('Error procesando solicitud de compartir', error.toString());
        return Response.redirect('/?error=' + encodeURIComponent(error.message));
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
      
      setTimeout(() => {
        sharedFiles.delete(shareId);
        debug('Archivo eliminado de la memoria después del timeout', shareId);
      }, 30000);
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