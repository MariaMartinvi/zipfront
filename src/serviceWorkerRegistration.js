
const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
    window.location.hostname === '[::1]' ||
    window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
);

export function register() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swUrl = '/service-worker.js';

      if (isLocalhost) {
        // Estamos en localhost, vamos a comprobar si existe un service worker
        checkValidServiceWorker(swUrl);
      } else {
        // No estamos en localhost, registrar el service worker directamente
        registerValidSW(swUrl);
      }
    });
  }
}

function registerValidSW(swUrl) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      console.log('Service Worker registrado correctamente');
      
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) {
          return;
        }
        
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // Hay una nueva versión disponible
              console.log('Nueva versión del Service Worker disponible');
            } else {
              // Es la primera instalación
              console.log('Service Worker instalado por primera vez');
            }
          }
        };
      };
    })
    .catch((error) => {
      console.error('Error al registrar el Service Worker:', error);
    });
}

function checkValidServiceWorker(swUrl) {
  // Verificar si se puede encontrar el service worker
  fetch(swUrl, {
    headers: { 'Service-Worker': 'script' },
  })
    .then((response) => {
      // Asegurarse de que existe y que es JavaScript
      const contentType = response.headers.get('content-type');
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        // No se encontró el Service Worker, probablemente la app está siendo servida por otro servidor
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        // Service Worker encontrado, proceder con el registro
        registerValidSW(swUrl);
      }
    })
    .catch(() => {
      console.log('No se pudo conectar. La app podría estar funcionando offline.');
    });
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}