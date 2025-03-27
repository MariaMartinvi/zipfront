// Este archivo maneja el registro personalizado del service worker

export function register() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;
      
      console.log('Intentando registrar el service worker desde:', swUrl);
      
      navigator.serviceWorker
        .register(swUrl)
        .then(registration => {
          console.log('Service Worker registrado con éxito:', registration.scope);
          
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker == null) {
              return;
            }
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  console.log('Nuevo service worker instalado, reemplazando al anterior');
                } else {
                  console.log('Service Worker instalado por primera vez');
                }
              }
            };
          };
        })
        .catch(error => {
          console.error('Error durante el registro del service worker:', error);
        });
    });
  } else {
    console.log('Los Service Workers no son soportados en este navegador');
  }
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