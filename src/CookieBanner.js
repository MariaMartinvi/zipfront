import React, { useState, useEffect } from 'react';
import './CookieBanner.css';
import { useTranslation } from 'react-i18next';
import { CookieService, defaultCookiePreferences, cookieCategories } from './services/cookieService';

const CookieBanner = () => {
  const { t } = useTranslation();
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [cookiePreferences, setCookiePreferences] = useState(defaultCookiePreferences);

  useEffect(() => {
    // Verificar si necesita mostrar el banner
    if (CookieService.shouldShowBanner()) {
      setShowBanner(true);
      // Configurar consentimiento por defecto (denegado) en GTM
      CookieService.initializeGTMConsent(defaultCookiePreferences);
    } else {
      // Cargar preferencias guardadas
      const savedPreferences = CookieService.getSavedPreferences();
      if (savedPreferences) {
        setCookiePreferences(savedPreferences);
        // Aplicar las preferencias guardadas a GTM
        CookieService.updateGTMConsent(savedPreferences);
      }
    }
  }, []);

  const acceptAllCookies = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
      functionality: true
    };
    
    setCookiePreferences(allAccepted);
    CookieService.savePreferences(allAccepted);
    CookieService.updateGTMConsent(allAccepted);
    
    setShowBanner(false);
  };

  const rejectNonEssentialCookies = () => {
    const onlyNecessary = {
      necessary: true,
      analytics: false,
      marketing: false,
      functionality: false
    };
    
    setCookiePreferences(onlyNecessary);
    CookieService.savePreferences(onlyNecessary);
    CookieService.updateGTMConsent(onlyNecessary);
    
    setShowBanner(false);
  };

  const savePreferences = () => {
    CookieService.savePreferences(cookiePreferences);
    CookieService.updateGTMConsent(cookiePreferences);
    
    setShowPreferences(false);
    setShowBanner(false);
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
            <div className="cookie-banner-icon">🍪</div>
            <div className="cookie-banner-text">
              <h3>{t('cookieBanner.title')}</h3>
              <p>{t('cookieBanner.description')}</p>
            </div>
            <div className="cookie-banner-buttons">
              <button 
                className="cookie-btn cookie-btn-primary" 
                onClick={acceptAllCookies}
              >
                {t('cookieBanner.acceptAll')}
              </button>
              <button 
                className="cookie-btn cookie-btn-secondary" 
                onClick={rejectNonEssentialCookies}
              >
                {t('cookieBanner.onlyNecessary')}
              </button>
              <button 
                className="cookie-btn cookie-btn-outline" 
                onClick={() => setShowPreferences(true)}
              >
                {t('cookieBanner.customize')}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="cookie-preferences">
          <div className="cookie-preferences-content">
            <h3>{t('cookieBanner.preferences.title')}</h3>
            <p>{t('cookieBanner.preferences.description')}</p>
            
            {Object.entries(cookieCategories).map(([key, category]) => (
              <div key={key} className="cookie-category">
                <div className="cookie-category-header">
                  <div className="cookie-category-title">
                    <h4>{category.icon} {t(`cookieBanner.preferences.categories.${key}.title`)}</h4>
                    {category.required && (
                      <span className="cookie-category-required">
                        {t(`cookieBanner.preferences.categories.${key}.required`)}
                      </span>
                    )}
                  </div>
                  <div className="cookie-category-toggle">
                    <input 
                      type="checkbox" 
                      checked={cookiePreferences[key]} 
                      disabled={category.required}
                      onChange={() => handlePreferenceChange(key)}
                      id={`${key}-cookies`}
                    />
                    <label htmlFor={`${key}-cookies`}></label>
                  </div>
                </div>
                <p>{t(`cookieBanner.preferences.categories.${key}.description`)}</p>
              </div>
            ))}
            
            <div className="cookie-preferences-buttons">
              <button 
                className="cookie-btn cookie-btn-primary" 
                onClick={savePreferences}
              >
                {t('cookieBanner.preferences.save')}
              </button>
              <button 
                className="cookie-btn cookie-btn-outline" 
                onClick={() => setShowPreferences(false)}
              >
                {t('cookieBanner.preferences.back')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CookieBanner; 