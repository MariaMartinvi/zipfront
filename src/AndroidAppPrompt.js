import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthContext';
import './AppPreview.css';

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
          <div className="prompt-icon">📱</div>
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
            <span className="download-icon">📱</span>
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
      
      <style jsx>{`
        .android-app-prompt-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          padding: 20px;
        }
        
        .android-app-prompt-modal {
          background: white;
          border-radius: 16px;
          max-width: 400px;
          width: 100%;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          overflow: hidden;
          animation: slideUp 0.3s ease-out;
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .prompt-header {
          background: linear-gradient(135deg, #25D366, #7122AC);
          color: white;
          padding: 20px;
          text-align: center;
          position: relative;
        }
        
        .prompt-icon {
          font-size: 2.5rem;
          margin-bottom: 10px;
        }
        
        .prompt-header h3 {
          margin: 0;
          font-size: 1.4rem;
          font-weight: 600;
        }
        
        .prompt-close {
          position: absolute;
          top: 15px;
          right: 15px;
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }
        
        .prompt-close:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        
        .prompt-content {
          padding: 20px;
        }
        
        .prompt-content p {
          margin: 0 0 20px 0;
          color: #333;
          line-height: 1.5;
          text-align: center;
        }
        
        .prompt-features {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 20px;
        }
        
        .feature-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px;
          background: #f8f9fa;
          border-radius: 8px;
        }
        
        .feature-icon {
          font-size: 1.2rem;
        }
        
        .prompt-actions {
          padding: 0 20px 20px 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .prompt-download-btn {
          background: linear-gradient(135deg, #25D366, #7122AC);
          color: white;
          border: none;
          padding: 14px 20px;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .prompt-download-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(37, 211, 102, 0.3);
        }
        
        .download-icon {
          font-size: 1.1rem;
        }
        
        .prompt-dismiss-btn {
          background: transparent;
          color: #666;
          border: 1px solid #ddd;
          padding: 12px 20px;
          border-radius: 10px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .prompt-dismiss-btn:hover {
          background: #f8f9fa;
          border-color: #ccc;
        }
        
        @media (max-width: 480px) {
          .android-app-prompt-modal {
            margin: 10px;
            max-width: none;
          }
          
          .prompt-header {
            padding: 15px;
          }
          
          .prompt-content {
            padding: 15px;
          }
          
          .prompt-actions {
            padding: 0 15px 15px 15px;
          }
        }
      `}</style>
    </div>
  );
};

export default AndroidAppPrompt;

