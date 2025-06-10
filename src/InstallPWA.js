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
    
    setIsAndroid(detectAndroid());
    checkAuthentication();
    
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

  // Solo mostrar el botón si:
  // 1. Es dispositivo Android
  // 2. El usuario está autenticado
  // 3. Soporta PWA
  // 4. No está ya instalada
  if (!isAndroid || !isUserAuthenticated || !supportsPWA || isInstalled) {
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