import React, { useState, useEffect } from 'react';
import { CookieService, defaultCookiePreferences, cookieCategories } from '../services/cookieService';
import '../CookieBanner.css'; // Reutilizar los estilos del banner

const CookieSettings = ({ isOpen, onClose }) => {
  const [cookiePreferences, setCookiePreferences] = useState(defaultCookiePreferences);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Cargar preferencias actuales cuando se abre el modal
      const savedPreferences = CookieService.getSavedPreferences();
      if (savedPreferences) {
        setCookiePreferences(savedPreferences);
      }
      setHasChanges(false);
    }
  }, [isOpen]);

  const handlePreferenceChange = (category) => {
    setCookiePreferences(prev => {
      const newPrefs = {
        ...prev,
        [category]: !prev[category]
      };
      setHasChanges(true);
      return newPrefs;
    });
  };

  const savePreferences = () => {
    CookieService.savePreferences(cookiePreferences);
    CookieService.updateGTMConsent(cookiePreferences);
    setHasChanges(false);
    onClose();
  };

  const resetToDefault = () => {
    setCookiePreferences(defaultCookiePreferences);
    setHasChanges(true);
  };

  const revokeAllConsent = () => {
    const onlyNecessary = {
      necessary: true,
      analytics: false,
      marketing: false,
      functionality: false
    };
    setCookiePreferences(onlyNecessary);
    setHasChanges(true);
  };

  if (!isOpen) return null;

  return (
    <div className="cookie-settings-overlay">
      <div className="cookie-preferences cookie-settings-modal">
        <div className="cookie-preferences-content">
          <div className="cookie-settings-header">
            <h3>Configuración de Cookies</h3>
            <button 
              className="cookie-settings-close" 
              onClick={onClose}
              aria-label="Cerrar configuración de cookies"
            >
              ×
            </button>
          </div>
          
          <p>Gestiona tus preferencias de cookies. Los cambios se aplicarán inmediatamente.</p>
          
          {Object.entries(cookieCategories).map(([key, category]) => (
            <div key={key} className="cookie-category">
              <div className="cookie-category-header">
                <div className="cookie-category-title">
                  <h4>{category.icon} {category.name}</h4>
                  {category.required && (
                    <span className="cookie-category-required">(Obligatorias)</span>
                  )}
                </div>
                <div className="cookie-category-toggle">
                  <input 
                    type="checkbox" 
                    checked={cookiePreferences[key]} 
                    disabled={category.required}
                    onChange={() => handlePreferenceChange(key)}
                    id={`settings-${key}-cookies`}
                  />
                  <label htmlFor={`settings-${key}-cookies`}></label>
                </div>
              </div>
              <p>{category.description}</p>
              {category.examples && (
                <div className="cookie-examples">
                  <small>Ejemplos: {category.examples.join(', ')}</small>
                </div>
              )}
            </div>
          ))}
          
          <div className="cookie-settings-actions">
            <div className="cookie-settings-bulk-actions">
              <button 
                className="cookie-btn cookie-btn-outline"
                onClick={resetToDefault}
              >
                Restablecer
              </button>
              <button 
                className="cookie-btn cookie-btn-secondary"
                onClick={revokeAllConsent}
              >
                Rechazar todas
              </button>
            </div>
            
            <div className="cookie-preferences-buttons">
              <button 
                className="cookie-btn cookie-btn-outline" 
                onClick={onClose}
              >
                Cancelar
              </button>
              <button 
                className={`cookie-btn cookie-btn-primary ${!hasChanges ? 'disabled' : ''}`}
                onClick={savePreferences}
                disabled={!hasChanges}
              >
                Guardar cambios
              </button>
            </div>
          </div>
          
          <div className="cookie-settings-info">
            <small>
              {CookieService.hasConsent() && (
                <>
                  Última actualización: {CookieService.getConsentDate()?.toLocaleDateString('es-ES')}
                </>
              )}
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieSettings; 