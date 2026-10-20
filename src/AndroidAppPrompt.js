import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthContext';
import './AppPreview.css';
import './AndroidAppPrompt.css';

const AndroidAppPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isNativeAppInstalled, setIsNativeAppInstalled] = useState(false);
  const { user, isAuthLoading } = useAuth();
  const { t } = useTranslation();

  // Detectar si es dispositivo Android
  const detectAndroid = () => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    return /android/i.test(userAgent);
  };

  // Detectar si la app nativa está instalada (IGUAL QUE InstallPWA.js)
  const checkNativeAppInstalled = () => {
    if (!isAndroid) return false;
    
    // MÉTODO SIMPLE: Solo detectar si estamos DENTRO de la app nativa
    const userAgent = navigator.userAgent || '';
    
    // Indicadores más específicos de WebView dentro de app nativa
    const isInWebView = 
      userAgent.includes('; wv)') ||               // WebView específico de Android
      userAgent.includes('Version/') && userAgent.includes('Chrome/') && userAgent.includes('Mobile Safari') ||
      window.AndroidInterface ||                   // Si la app expone una interfaz
      window.ReactNativeWebView ||                 // React Native WebView
      document.referrer === '' && window.location.hostname !== 'localhost' || // Cargado directamente en app
      window.location.protocol === 'file:' ||      // Cargado desde archivo local
      navigator.standalone === true ||             // iOS standalone mode
      window.matchMedia('(display-mode: standalone)').matches; // PWA standalone
    
    console.log('🔍 AndroidAppPrompt - Detección completa:', {
      userAgent: userAgent.substring(0, 100) + '...',
      hasWebViewIndicator: userAgent.includes('; wv)'),
      hasAndroidInterface: !!window.AndroidInterface,
      hasReactNativeWebView: !!window.ReactNativeWebView,
      referrer: document.referrer,
      hostname: window.location.hostname,
      protocol: window.location.protocol,
      isStandalone: navigator.standalone,
      displayMode: window.matchMedia('(display-mode: standalone)').matches,
      isInWebView: isInWebView
    });
    
    return isInWebView;
  };

  useEffect(() => {
    const initializePrompt = async () => {
      const androidDetected = detectAndroid();
      setIsAndroid(androidDetected);

      if (androidDetected && !isAuthLoading) {
        const appInstalled = checkNativeAppInstalled(); // Ya no es async
        setIsNativeAppInstalled(appInstalled);
        console.log('📱 AndroidAppPrompt - App nativa detectada:', appInstalled);
        
        // Mostrar prompt solo si:
        // 1. Es Android
        // 2. Usuario NO está logueado
        // 3. App nativa NO está instalada
        // 4. No se ha mostrado antes en esta sesión
        const hasSeenPrompt = sessionStorage.getItem('android_app_prompt_shown');
        
        if (!user && !appInstalled && !hasSeenPrompt) {
          setShowPrompt(true);
        }
      }
    };

    initializePrompt();
  }, [isAndroid, user, isAuthLoading]);

  const handleDownloadApp = () => {
    // Marcar que ya se mostró el prompt en esta sesión
    sessionStorage.setItem('android_app_prompt_shown', 'true');
    
    // Abrir Google Play Store
    window.open('https://play.google.com/store/apps/details?id=com.chatsalsa.app', '_blank');
    
    // Cerrar el prompt
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    // Marcar que ya se mostró el prompt en esta sesión
    sessionStorage.setItem('android_app_prompt_shown', 'true');
    setShowPrompt(false);
  };

  const handleAlreadyHaveApp = () => {
    // Marcar permanentemente que el usuario ya tiene la app
    localStorage.setItem('user_has_native_app', 'true');
    sessionStorage.setItem('android_app_prompt_shown', 'true');
    setShowPrompt(false);
    console.log('✅ Usuario marcó que ya tiene la app nativa');
  };

  // Verificar si el usuario ha marcado manualmente que tiene la app
  const userHasAppManually = localStorage.getItem('user_has_native_app') === 'true';
  
  // No mostrar si no cumple las condiciones
  if (!showPrompt || !isAndroid || user || isNativeAppInstalled || userHasAppManually) {
    return null;
  }

  return (
    <div className="android-app-prompt-overlay">
      <div className="android-app-prompt-modal">
        <div className="prompt-header">
          <div className="prompt-icon" aria-hidden="true">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="6" y="2" width="12" height="20" rx="3" /><path d="M11 18h2" />
            </svg>
          </div>
          <h3>{t('android_prompt.title', '¡Descarga nuestra App!')}</h3>
          <button 
            className="prompt-close"
            onClick={handleDismiss}
            aria-label={t('android_prompt.close', 'Cerrar')}
          >
            ✕
          </button>
        </div>
        
        <div className="prompt-content">
          <p>{t('android_prompt.description', 'Obtén la mejor experiencia con nuestra app nativa de Android desde Google Play Store.')}</p>
          
          <div className="prompt-features">
            <div className="feature-item">
              <span className="feature-icon">⚡</span>
              <span>{t('android_prompt.feature_fast', 'Más rápida')}</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📤</span>
              <span>{t('android_prompt.feature_share', 'Compartir archivos fácil')}</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🔔</span>
              <span>{t('android_prompt.feature_notifications', 'Notificaciones')}</span>
            </div>
          </div>
        </div>
        
        <div className="prompt-actions">
          <button 
            className="prompt-download-btn"
            onClick={handleDownloadApp}
          >
            <span className="download-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" />
              </svg>
            </span>
            {t('android_prompt.download_button', 'Descargar desde Google Play')}
          </button>
          
          <button 
            className="prompt-already-have-btn"
            onClick={handleAlreadyHaveApp}
          >
            {t('android_prompt.already_have_app', 'Ya tengo la app')}
          </button>
          
          <button 
            className="prompt-dismiss-btn"
            onClick={handleDismiss}
          >
            {t('android_prompt.continue_web', 'Continuar en web')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AndroidAppPrompt;

