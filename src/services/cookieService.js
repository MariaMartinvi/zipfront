// Servicio de gestión de cookies para la aplicación
export const CookieService = {
  // Actualizar el consentimiento en GTM
  updateGTMConsent: (preferences) => {
    if (typeof window !== 'undefined' && window.dataLayer) {
      // Actualizar consentimiento en GTM usando Consent API v2
      window.dataLayer.push({
        'consent': 'update',
        'analytics_storage': preferences.analytics ? 'granted' : 'denied',
        'ad_storage': preferences.marketing ? 'granted' : 'denied',
        'functionality_storage': preferences.functionality ? 'granted' : 'denied',
        'personalization_storage': preferences.functionality ? 'granted' : 'denied'
      });
      
      // También enviar evento personalizado para tracking interno
      window.dataLayer.push({
        event: 'cookie_consent_update',
        analytics_consent: preferences.analytics ? 'granted' : 'denied',
        marketing_consent: preferences.marketing ? 'granted' : 'denied',
        functionality_consent: preferences.functionality ? 'granted' : 'denied',
        timestamp: new Date().toISOString()
      });
      
      console.log('Consentimiento de cookies actualizado en GTM:', preferences);
    }
  },

  // Configurar consentimiento inicial
  initializeGTMConsent: (preferences) => {
    if (typeof window !== 'undefined' && window.dataLayer) {
      window.dataLayer.push({
        'consent': 'default',
        'analytics_storage': preferences.analytics ? 'granted' : 'denied',
        'ad_storage': preferences.marketing ? 'granted' : 'denied',
        'functionality_storage': preferences.functionality ? 'granted' : 'denied',
        'personalization_storage': preferences.functionality ? 'granted' : 'denied'
      });
    }
  },

  // Obtener preferencias guardadas
  getSavedPreferences: () => {
    try {
      const saved = localStorage.getItem('cookiePreferences');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error('Error al cargar preferencias de cookies:', e);
      return null;
    }
  },

  // Verificar si ya se dio consentimiento
  hasConsent: () => {
    return localStorage.getItem('cookieConsent') === 'true';
  },

  // Obtener fecha de consentimiento
  getConsentDate: () => {
    try {
      const date = localStorage.getItem('cookieConsentDate');
      return date ? new Date(date) : null;
    } catch (e) {
      return null;
    }
  },

  // Guardar preferencias
  savePreferences: (preferences) => {
    try {
      localStorage.setItem('cookieConsent', 'true');
      localStorage.setItem('cookiePreferences', JSON.stringify(preferences));
      localStorage.setItem('cookieConsentDate', new Date().toISOString());
      
      // Notificar al script del index.html sobre la actualización
      window.postMessage({
        type: 'COOKIE_CONSENT_UPDATE',
        preferences: preferences
      }, '*');
      
      return true;
    } catch (e) {
      console.error('Error al guardar preferencias de cookies:', e);
      return false;
    }
  },

  // Revocar consentimiento (para futuras funcionalidades)
  revokeConsent: () => {
    try {
      localStorage.removeItem('cookieConsent');
      localStorage.removeItem('cookiePreferences');
      localStorage.removeItem('cookieConsentDate');
      
      // Configurar todo como denegado
      const deniedPreferences = {
        necessary: true,
        analytics: false,
        marketing: false,
        functionality: false
      };
      
      CookieService.updateGTMConsent(deniedPreferences);
      
      return true;
    } catch (e) {
      console.error('Error al revocar consentimiento:', e);
      return false;
    }
  },

  // Verificar si necesita mostrar el banner (por tiempo transcurrido, nuevas categorías, etc.)
  shouldShowBanner: () => {
    if (!CookieService.hasConsent()) {
      return true;
    }
    
    // Verificar si han pasado más de 12 meses (requerimiento GDPR)
    const consentDate = CookieService.getConsentDate();
    if (consentDate) {
      const monthsAgo = new Date();
      monthsAgo.setMonth(monthsAgo.getMonth() - 12);
      
      if (consentDate < monthsAgo) {
        return true;
      }
    }
    
    return false;
  }
};

// Valores por defecto para las preferencias
export const defaultCookiePreferences = {
  necessary: true,    // Siempre true - Firebase, Stripe, funcionalidad básica
  analytics: false,   // Google Analytics via GTM
  marketing: false,   // Google Ads, remarketing via GTM  
  functionality: false // Preferencias de usuario, personalización
};

// Descripciones de cada categoría de cookies
export const cookieCategories = {
  necessary: {
    name: 'Cookies necesarias',
    description: 'Incluyen autenticación (Firebase), procesamiento de pagos (Stripe) y funcionalidad básica de la aplicación.',
    icon: '🔒',
    required: true,
    examples: ['Sesión de usuario', 'Carrito de compras', 'Preferencias de seguridad']
  },
  analytics: {
    name: 'Cookies de análisis',
    description: 'Google Analytics para entender cómo usas la aplicación y mejorar la experiencia.',
    icon: '📊',
    required: false,
    examples: ['Google Analytics', 'Estadísticas de uso', 'Análisis de rendimiento']
  },
  marketing: {
    name: 'Cookies de marketing',
    description: 'Google Ads y remarketing para mostrarte contenido relevante.',
    icon: '🎯',
    required: false,
    examples: ['Google Ads', 'Publicidad personalizada', 'Remarketing']
  },
  functionality: {
    name: 'Cookies de funcionalidad',
    description: 'Recordar tus preferencias de idioma y personalización de la interfaz.',
    icon: '⚙️',
    required: false,
    examples: ['Preferencias de idioma', 'Tema de la interfaz', 'Configuraciones personalizadas']
  }
}; 