import React, { useState, useEffect } from 'react';
import './AppPreview.css';
import { useTranslation } from 'react-i18next';
import { isAuthenticated } from './firebase_auth';

const InstallPWA = () => {
  const [supportsPWA, setSupportsPWA] = useState(false);
  const [promptInstall, setPromptInstall] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isNativeAppInstalled, setIsNativeAppInstalled] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const handler = (e) => {
      // Guarda el evento sin llamar a preventDefault
      setPromptInstall(e);
      setSupportsPWA(true);
    };
    
    // Verificar si la app ya está instalada
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }
    
    // Detectar si es dispositivo Android
    const detectAndroid = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      return /android/i.test(userAgent);
    };
    
    // Detectar si la app nativa está instalada (solo Android)
    const checkNativeAppInstalled = async () => {
      if (!detectAndroid()) return false;
      
      try {
        const appScheme = 'intent://chatsalsa.com#Intent;scheme=https;package=com.chatsalsa.app;end';
        
        return new Promise((resolve) => {
          const timeout = setTimeout(() => resolve(false), 2000);

          const handleVisibilityChange = () => {
            if (document.hidden) {
              clearTimeout(timeout);
              resolve(true);
            }
          };

          const handleBlur = () => {
            clearTimeout(timeout);
            resolve(true);
          };

          document.addEventListener('visibilitychange', handleVisibilityChange);
          window.addEventListener('blur', handleBlur);

          const iframe = document.createElement('iframe');
          iframe.style.display = 'none';
          iframe.src = appScheme;
          document.body.appendChild(iframe);

          setTimeout(() => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
            if (iframe.parentNode) {
              iframe.parentNode.removeChild(iframe);
            }
          }, 2500);
        });
      } catch (error) {
        console.log('Error checking native app:', error);
        return false;
      }
    };
    
    // Verificar autenticación del usuario
    const checkAuthentication = async () => {
      try {
        const authenticated = await isAuthenticated();
        setIsUserAuthenticated(authenticated);
      } catch (error) {
        console.error('Error checking authentication:', error);
        setIsUserAuthenticated(false);
      }
    };
    
    const initializeComponent = async () => {
      const androidDetected = detectAndroid();
      setIsAndroid(androidDetected);
      
      if (androidDetected) {
        const nativeAppInstalled = await checkNativeAppInstalled();
        setIsNativeAppInstalled(nativeAppInstalled);
      }
      
      checkAuthentication();
    };
    
    initializeComponent();
    
    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Efecto para reaccionar a cambios en la autenticación
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const authenticated = await isAuthenticated();
        setIsUserAuthenticated(authenticated);
      } catch (error) {
        console.error('Error checking authentication:', error);
        setIsUserAuthenticated(false);
      }
    };

    // Verificar autenticación cada vez que cambie el localStorage (tokens)
    const handleStorageChange = () => {
      checkAuthStatus();
    };

    window.addEventListener('storage', handleStorageChange);

    // También verificar periódicamente (cada 5 segundos) por si el usuario se loguea/desloguea
    const authCheckInterval = setInterval(checkAuthStatus, 5000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(authCheckInterval);
    };
  }, []);

  const onClick = () => {
    // Si es Android, redirigir a Google Play Store
    if (isAndroid) {
      window.open('https://play.google.com/store/apps/details?id=com.chatsalsa.app', '_blank');
      return;
    }
    
    // Si NO es Android, comportamiento actual (instalar PWA)
    if (!promptInstall) {
      return;
    }
    
    // Mostrar el prompt de instalación
    promptInstall.prompt();
    
    // Esperar a que el usuario responda al prompt
    promptInstall.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('Usuario aceptó la instalación');
        setIsInstalled(true);
      } else {
        console.log('Usuario rechazó la instalación');
      }
      // Limpiar el prompt guardado
      setPromptInstall(null);
    });
  };

  // NO mostrar el botón si:
  // - Usuario no autenticado
  // - Android con app nativa instalada
  // - Otros dispositivos con PWA instalada
  if (!isUserAuthenticated || 
      (isAndroid && isNativeAppInstalled) || 
      (!isAndroid && (!supportsPWA || isInstalled))) {
    return null;
  }

  return (
    <div className="install-pwa-container">
      <button className="install-pwa-button" onClick={onClick}>
        <span className="install-icon">📱</span>
        {t('pwa.install_button')}
      </button>
    </div>
  );
};

export default InstallPWA;