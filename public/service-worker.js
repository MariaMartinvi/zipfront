// En service-worker.js
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  if (url.pathname === '/share-target' && event.request.method === 'POST') {
    console.log('[SW] Solicitud de compartir desde WhatsApp detectada');
    
    event.respondWith((async () => {
      try {
        const formData = await event.request.formData();
        console.log('[SW] FormData extraído');
        
        // Log detallado de todos los campos
        for (const [key, value] of formData.entries()) {
          const valueInfo = value instanceof File 
            ? `File: ${value.name}, tipo: ${value.type}, tamaño: ${value.size}` 
            : `${String(value).substring(0, 100)}...`;
          console.log(`[SW] Campo: ${key}, Valor: ${valueInfo}`);
        }
        
        // Buscar archivo en todos los campos
        let file = null;
        for (const [key, value] of formData.entries()) {
          if (value instanceof File) {
            file = value;
            console.log(`[SW] Archivo encontrado en campo ${key}: ${file.name}, tipo: ${file.type}`);
            break;
          }
        }
        
        // Si no hay archivo, buscar contenido de texto
        let textContent = null;
        if (!file) {
          for (const [key, value] of formData.entries()) {
            if (typeof value === 'string' && value.trim().length > 0) {
              textContent = value;
              console.log(`[SW] Texto encontrado en campo ${key}: ${textContent.substring(0, 100)}...`);
              break;
            }
          }
        }
        
        if (!file && !textContent) {
          console.log('[SW] No se encontró ningún contenido para procesar');
          return Response.redirect('/?error=no-content');
        }
        
        // Almacenar el contenido en localStorage o IndexedDB
        // Para este ejemplo usaremos localStorage para simplificar
        if (file) {
          // Para archivos, debemos leerlos primero
          const arrayBuffer = await file.arrayBuffer();
          const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
          
          localStorage.setItem('sharedContent', JSON.stringify({
            type: 'file',
            name: file.name,
            mimeType: file.type,
            size: file.size,
            data: base64
          }));
          
          console.log('[SW] Archivo guardado en localStorage');
        } else if (textContent) {
          localStorage.setItem('sharedContent', JSON.stringify({
            type: 'text',
            data: textContent
          }));
          
          console.log('[SW] Texto guardado en localStorage');
        }
        
        // Redirigir a la página principal con un parámetro
        console.log('[SW] Redirigiendo a página principal con contenido compartido');
        return Response.redirect('/?shared=true');
        
      } catch (error) {
        console.error('[SW] Error procesando solicitud:', error);
        return Response.redirect('/?error=' + encodeURIComponent(error.message));
      }
    })());
  }
});