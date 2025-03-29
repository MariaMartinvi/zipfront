// Service Worker para diagnóstico de archivos compartidos desde WhatsApp

// Función de utilidad para depuración
const debug = (message, data) => {
  const logMessage = `[SW] ${message}`;
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
  
  if (url.pathname === '/share-target' && event.request.method === 'POST') {
    debug('Solicitud de compartir desde WhatsApp detectada');
    
    // Aquí simplemente permite que la solicitud continúe hacia el servidor
    // No utilizamos localStorage ni intentamos procesar los datos aquí
    debug('Permitiendo que la solicitud continúe al endpoint del backend');
    
    // No modificamos la solicitud, dejamos que llegue al backend para diagnóstico
    // El backend ya tiene el endpoint /share-target implementado
  }
});