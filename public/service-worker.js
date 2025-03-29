// service-worker.js - Versión simplificada para diagnóstico
self.addEventListener('install', event => {
  console.log('Service Worker instalado - modo diagnóstico');
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('Service Worker activado - modo diagnóstico');
  event.waitUntil(clients.claim());
});

// Simplemente dejar pasar todas las solicitudes sin manipulación
self.addEventListener('fetch', event => {
  console.log(`Fetch interceptado: ${event.request.url}`);
  // No modificar la solicitud, solo registrar y dejar pasar
});