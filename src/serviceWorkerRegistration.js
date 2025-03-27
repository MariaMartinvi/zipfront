const isLocalhost = Boolean(
    window.location.hostname === 'localhost' ||
      window.location.hostname === '[::1]' ||
      window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
  );
  
  export function register(config) {
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      const publicUrl = new URL(process.env.PUBLIC_URL, window.location.href);
      if (publicUrl.origin !== window.location.origin) {
        return;
      }
  
      window.addEventListener('load', () => {
        const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;
  
        if (isLocalhost) {
          // Esto es para localhost. Verificamos si existe un service worker
          checkValidServiceWorker(swUrl, config);
  
          navigator.serviceWorker.ready.then(() => {
            console.log(
              'Esta aplicación web está siendo servida desde caché por un service worker.'
            );
          });
        } else {
          // No es localhost. Solo registramos el service worker
          registerValidSW(swUrl, config);
        }
      });
    }
  }
  
  function registerValidSW(swUrl, config) {
    navigator.serviceWorker
      .register(swUrl)
      .then((registration) => {
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (installingWorker == null) {
            return;
          }
          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                console.log(
                  'Nuevo contenido está disponible y será usado cuando todas las ' +
                    'pestañas de esta página se cierren.'
                );
  
                if (config && config.onUpdate) {
                  config.onUpdate(registration);
                }
              } else {
                console.log('El contenido está en caché para uso offline.');
  
                if (config && config.onSuccess) {
                  config.onSuccess(registration);
                }
              }
            }
          };
        };
      })
      .catch((error) => {
        console.error('Error durante el registro del service worker:', error);
      });
  }
  
  function checkValidServiceWorker(swUrl, config) {
    // Comprueba si el service worker se puede encontrar
    fetch(swUrl, {
      headers: { 'Service-Worker': 'script' },
    })
      .then((response) => {
        // Asegurarse de que el service worker existe y que realmente obtenemos un archivo JS
        const contentType = response.headers.get('content-type');
        if (
          response.status === 404 ||
          (contentType != null && contentType.indexOf('javascript') === -1)
        ) {
          // No se encontró el service worker. Probablemente sea otra aplicación
          navigator.serviceWorker.ready.then((registration) => {
            registration.unregister().then(() => {
              window.location.reload();
            });
          });
        } else {
          // Service worker encontrado. Procede normalmente
          registerValidSW(swUrl, config);
        }
      })
      .catch(() => {
        console.log('No se pudo conectar; la aplicación está funcionando offline.');
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