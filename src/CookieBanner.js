import React, { useState, useEffect } from 'react';
import './CookieBanner.css';
import { useTranslation } from 'react-i18next';

const CookieBanner = () => {
  const { t } = useTranslation();
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [cookiePreferences, setCookiePreferences] = useState({
    necessary: true, // Siempre activadas
    analytics: false,
    marketing: false,
    preferences: false
  });

  useEffect(() => {
    // Verificar si ya se han aceptado las cookies
    const cookieConsent = localStorage.getItem('cookieConsent');
    if (!cookieConsent) {
      setShowBanner(true);
    } else {
      // Cargar preferencias guardadas
      try {
        setCookiePreferences(JSON.parse(localStorage.getItem('cookiePreferences') || '{}'));
      } catch (e) {
        console.error('Error loading cookie preferences', e);
      }
    }
  }, []);

  const acceptAllCookies = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true
    };
    
    setCookiePreferences(allAccepted);
    localStorage.setItem('cookieConsent', 'true');
    localStorage.setItem('cookiePreferences', JSON.stringify(allAccepted));
    
    // Aquí se activarían todos los scripts de seguimiento y marketing
    activateAcceptedCookies(allAccepted);
    
    setShowBanner(false);
  };

  const rejectNonEssentialCookies = () => {
    const onlyNecessary = {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false
    };
    
    setCookiePreferences(onlyNecessary);
    localStorage.setItem('cookieConsent', 'true');
    localStorage.setItem('cookiePreferences', JSON.stringify(onlyNecessary));
    
    setShowBanner(false);
  };

  const savePreferences = () => {
    localStorage.setItem('cookieConsent', 'true');
    localStorage.setItem('cookiePreferences', JSON.stringify(cookiePreferences));
    
    // Activar solo las cookies consentidas
    activateAcceptedCookies(cookiePreferences);
    
    setShowPreferences(false);
    setShowBanner(false);
  };

  const activateAcceptedCookies = (preferences) => {
    // Ejemplo de activación de scripts según preferencias
    if (preferences.analytics) {
      // Activar scripts de Google Analytics, etc.
      console.log('Activando scripts de analytics');
    }
    
    if (preferences.marketing) {
      // Activar scripts de marketing, Facebook Pixel, etc.
      console.log('Activando scripts de marketing');
    }
    
    if (preferences.preferences) {
      // Activar cookies de preferencias
      console.log('Activando cookies de preferencias');
    }
  };

  const handlePreferenceChange = (category) => {
    setCookiePreferences(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  if (!showBanner) return null;

  return (
    <div className="cookie-banner">
      {!showPreferences ? (
        <div className="cookie-banner-main">
          <div className="cookie-banner-content">
            <h3>{t('cookies.title')}</h3>
            <p>{t('cookies.mainText')}</p>
            <div className="cookie-banner-buttons">
              <button 
                className="cookie-btn cookie-btn-primary" 
                onClick={acceptAllCookies}
              >
                {t('cookies.acceptAll')}
              </button>
              <button 
                className="cookie-btn cookie-btn-secondary" 
                onClick={rejectNonEssentialCookies}
              >
                {t('cookies.rejectNonEssential')}
              </button>
              <button 
                className="cookie-btn cookie-btn-outline" 
                onClick={() => setShowPreferences(true)}
              >
                {t('cookies.preferences')}
              </button>
            </div>
            <div className="cookie-banner-links">
              <a href="/politica-cookies" target="_blank" rel="noopener noreferrer">
                {t('cookies.readMore')}
              </a>
            </div>
          </div>
        </div>
      ) : (
        <div className="cookie-preferences">
          <div className="cookie-preferences-content">
            <h3>{t('cookies.preferencesTitle')}</h3>
            <p>{t('cookies.preferencesDescription')}</p>
            
            <div className="cookie-category">
              <div className="cookie-category-header">
                <div className="cookie-category-title">
                  <h4>{t('cookies.necessary')}</h4>
                  <span className="cookie-category-required">({t('cookies.required')})</span>
                </div>
                <div className="cookie-category-toggle">
                  <input 
                    type="checkbox" 
                    checked={cookiePreferences.necessary} 
                    disabled={true}
                    id="necessary-cookies"
                  />
                  <label htmlFor="necessary-cookies"></label>
                </div>
              </div>
              <p>{t('cookies.necessaryDescription')}</p>
            </div>
            
            <div className="cookie-category">
              <div className="cookie-category-header">
                <div className="cookie-category-title">
                  <h4>{t('cookies.analytics')}</h4>
                </div>
                <div className="cookie-category-toggle">
                  <input 
                    type="checkbox" 
                    checked={cookiePreferences.analytics} 
                    onChange={() => handlePreferenceChange('analytics')}
                    id="analytics-cookies"
                  />
                  <label htmlFor="analytics-cookies"></label>
                </div>
              </div>
              <p>{t('cookies.analyticsDescription')}</p>
            </div>
            
            <div className="cookie-category">
              <div className="cookie-category-header">
                <div className="cookie-category-title">
                  <h4>{t('cookies.marketing')}</h4>
                </div>
                <div className="cookie-category-toggle">
                  <input 
                    type="checkbox" 
                    checked={cookiePreferences.marketing} 
                    onChange={() => handlePreferenceChange('marketing')}
                    id="marketing-cookies"
                  />
                  <label htmlFor="marketing-cookies"></label>
                </div>
              </div>
              <p>{t('cookies.marketingDescription')}</p>
            </div>
            
            <div className="cookie-category">
              <div className="cookie-category-header">
                <div className="cookie-category-title">
                  <h4>{t('cookies.preferences')}</h4>
                </div>
                <div className="cookie-category-toggle">
                  <input 
                    type="checkbox" 
                    checked={cookiePreferences.preferences} 
                    onChange={() => handlePreferenceChange('preferences')}
                    id="preferences-cookies"
                  />
                  <label htmlFor="preferences-cookies"></label>
                </div>
              </div>
              <p>{t('cookies.preferencesDescriptionDetailed')}</p>
            </div>
            
            <div className="cookie-preferences-buttons">
              <button 
                className="cookie-btn cookie-btn-primary" 
                onClick={savePreferences}
              >
                {t('cookies.savePreferences')}
              </button>
              <button 
                className="cookie-btn cookie-btn-outline" 
                onClick={() => setShowPreferences(false)}
              >
                {t('cookies.back')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CookieBanner; 