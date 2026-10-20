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
    const checkNativeAppInstalled = () => {
      if (!detectAndroid()) return false;
      
      // MÉTODO SIMPLE: Solo detectar si estamos DENTRO de la app nativa
      const userAgent = navigator.userAgent || '';
      
      // Indicadores más específicos de WebView dentro de app nativa
      const isInWebView = 
        userAgent.includes('; wv)') ||               // WebView específico de Android
        userAgent.includes('Version/') && userAgent.includes('Chrome/') && userAgent.includes('Mobile Safari') ||
        window.AndroidInterface ||                   // Si la app expone una interfaz
        document.referrer === '' && window.location.hostname !== 'localhost'; // Cargado directamente en app
      
      console.log('🔍 Detección simplificada:', {
        userAgent: userAgent.substring(0, 100) + '...',
        hasWebViewIndicator: userAgent.includes('; wv)'),
        hasAndroidInterface: !!window.AndroidInterface,
        referrer: document.referrer,
        hostname: window.location.hostname,
        isInWebView: isInWebView
      });
      
      return isInWebView;
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
        const nativeAppInstalled = checkNativeAppInstalled(); // Ya no es async
        setIsNativeAppInstalled(nativeAppInstalled);
        console.log('📱 App nativa instalada:', nativeAppInstalled);
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

  // Verificar si el usuario ha marcado manualmente que tiene la app
  const userHasAppManually = localStorage.getItem('user_has_native_app') === 'true';
  
  // NO mostrar el botón si:
  // - Usuario no autenticado
  // - Android con app nativa instalada (detectada automáticamente)
  // - Usuario marcó manualmente que tiene la app
  // - Otros dispositivos con PWA instalada
  if (!isUserAuthenticated || 
      (isAndroid && isNativeAppInstalled) || 
      (isAndroid && userHasAppManually) ||
      (!isAndroid && (!supportsPWA || isInstalled))) {
    return null;
  }

  return (
    <div className="install-pwa-container">
      <button className="install-pwa-button" onClick={onClick}>
        <span className="install-icon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" />
          </svg>
        </span>
        {t('pwa.install_button')}
      </button>
    </div>
  );
};

export default InstallPWA;