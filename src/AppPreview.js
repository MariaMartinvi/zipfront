import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './AppPreview.css';

const AppPreview = () => {
  const { t } = useTranslation();
  const [isModalVisible, setIsModalVisible] = useState(false);

  const toggleModal = () => {
    setIsModalVisible(!isModalVisible);
  };

  // Función para renderizar el título con el formato correcto
  const renderTitle = () => {
    const title = t('preview.title');
    const parts = title.split('WhatsApp');
    
    if (parts.length > 1) {
      return (
        <>
          {parts[0]}
          <span style={{ color: '#25D366' }}>WhatsApp</span>
          {parts[1]}
        </>
      );
    }
    
    return title;
  };

  return (
    <div className="app-preview-container">
      <div className="app-preview-content">
        <div className="app-preview-text">
          <h2>{renderTitle()}</h2>
          <p>
            {t('preview.description')}
          </p>
          
          <div className="security-badge">
            <span className="security-icon">🔒</span>
            <span className="security-text">{t('preview.security.badge')}</span>
            <span className="security-icon">✓</span>
          </div>
          
          <ul className="app-preview-features">
            <li>
              <span className="feature-icon">🧠</span>
              <span><strong>{t('preview.features.psychological').split(' ')[0]}</strong> {t('preview.features.psychological').split(' ').slice(1).join(' ')}</span>
            </li>
            <li>
              <span className="feature-icon">📊</span>
              <span>{t('preview.features.statistics')}</span>
            </li>
            <li>
              <span className="feature-icon">😀</span>
              <span>{t('preview.features.emotional')}</span>
            </li>
            <li>
              <span className="feature-icon">🔍</span>
              <span>{t('preview.features.discover')}</span>
            </li>
          </ul>
          
          <div className="privacy-container">
            <div className="privacy-item">
              <span className="privacy-icon">⚡</span>
              <span>{t('preview.privacy.encryption')}</span>
            </div>
            
            <div className="privacy-item">
              <span className="privacy-icon">🔐</span>
              <span>{t('preview.privacy.protection')}</span>
            </div>
            
            <div className="privacy-item">
              <span className="privacy-icon">🛡️</span>
              <span>{t('preview.privacy.deletion')}</span>
            </div>
          </div>
          
          <div className="cta-container">
            <button 
              className="cta-button"
              onClick={() => window.location.href = '/register'}
            >
              {t('preview.cta')}
            </button>
          </div>
        </div>
        <div className="app-preview-image">
          <img src="/ejemplo.png" alt={t('preview.image.alt')} />
          <div className="image-overlay">
            <span className="image-caption">{t('preview.image.caption')}</span>
          </div>
          
          {/* Indicador adicional de que hay más contenido */}
          <div className="image-more-indicator">
            <span>{t('preview.image.more')}</span>
            <div className="more-arrow">↓</div>
          </div>
          
          <button 
            className="expand-button" 
            onClick={toggleModal}
            aria-label={t('preview.image.expand')}
          >
            <span className="expand-icon">+</span>
            <span className="expand-text">{t('preview.image.expand')}</span>
          </button>
        </div>
      </div>
      
      {isModalVisible && (
        <div className="imagen-modal" onClick={toggleModal}>
          <div className="imagen-modal-contenido" onClick={(e) => e.stopPropagation()}>
            <img src="/ejemplo.png" alt={t('preview.image.modal_alt')} />
            <button className="cerrar-modal" onClick={toggleModal}>×</button>
          </div>
        </div>
      )}
      
      <div className="app-preview-testimonials">
        <h3>{t('preview.testimonials.title')}</h3>
        <div className="testimonials-container">
          {t('preview.testimonials.reviews', { returnObjects: true }).map((testimonial, index) => (
            <div className="testimonial" key={index}>
              <div className="testimonial-content">
                "{testimonial.content}"
              </div>
              <div className="testimonial-author">{testimonial.author}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AppPreview; 