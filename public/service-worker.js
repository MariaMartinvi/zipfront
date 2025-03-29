// Service Worker optimizado para WhatsApp
// Acepta cualquier tipo de archivo y lo trata como ZIP

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
        
        // Registrar todos los campos y valores para depuración
        const formDataEntries = [];
        for (const pair of formData.entries()) {
          formDataEntries.push(`${pair[0]}: ${typeof pair[1]} (${pair[1] instanceof File ? 'File: ' + pair[1].name + ', tipo: ' + pair[1].type : pair[1]})`);
        }
        debug('Contenido de FormData', formDataEntries);
        
        // Buscar cualquier archivo, no solo ZIPs
        let file = null;
        for (const [key, value] of formData.entries()) {
          if (value instanceof File) {
            debug(`Archivo encontrado en campo: ${key}, tipo: ${value.type}, nombre: ${value.name}`);
            file = value;
            break;
          }
        }
        
        if (!file) {
          debug('No se encontró ningún archivo en la solicitud');
          return Response.redirect('/?error=no-file-found');
        }
        
        debug('Archivo encontrado', { name: file.name, type: file.type, size: file.size });
        
        // Convertir cualquier archivo a ZIP (WhatsApp puede cambiar el tipo)
        // Crear un nuevo archivo con tipo ZIP forzado
        let newFileName = file.name;
        if (!newFileName.toLowerCase().endsWith('.zip')) {
          newFileName += '.zip';
        }
        
        // Leer el contenido del archivo
        const arrayBuffer = await file.arrayBuffer();
        
        // Crear un nuevo File con tipo ZIP
        const zipFile = new File([arrayBuffer], newFileName, { 
          type: 'application/zip',
          lastModified: file.lastModified
        });
        
        debug('Archivo convertido a ZIP', { 
          originalName: file.name, 
          newName: zipFile.name, 
          originalType: file.type,
          newType: zipFile.type
        });
        
        // Almacenar el archivo con un ID único
        const shareId = Date.now().toString();
        sharedFiles.set(shareId, zipFile);
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
            file: zipFile,
            shareId: shareId
          });
          
          // Solo navegamos a la URL con el parámetro shared, sin intentar enfocar
          try {
            await targetClient.navigate('/?shared=' + shareId);
            debug('Navegación exitosa');
          } catch (navigateError) {
            debug('Error en navegación, usando redirección', navigateError.toString());
            return Response.redirect('/?shared=' + shareId);
          }
          
          return new Response('Procesando archivo...', {
            headers: { 'Content-Type': 'text/plain' }
          });
        } else {
          // Si no hay ventanas, simplemente redirigir
          debug('No hay clientes abiertos, usando redirección normal');
          return Response.redirect('/?shared=' + shareId);
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
      debug('Archivo encontrado, enviando al cliente', { name: file.name, type: file.type });
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