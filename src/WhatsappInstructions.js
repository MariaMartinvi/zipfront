import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './WhatsappInstructions.css';

// Componente para las instrucciones de WhatsApp en formato carrusel
function WhatsappInstructions() {
  const { t } = useTranslation();
  const [activeSlide, setActiveSlide] = useState(0);
  const [platform, setPlatform] = useState('android'); // 'android', 'ios' o 'desktop'
  const [activeTab, setActiveTab] = useState('carousel'); // 'carousel' o 'video'

  // Obtener los pasos de las traducciones
  const getSteps = () => {
    if (platform === 'android') {
      return t('whatsapp.android_steps', { returnObjects: true });
    } else if (platform === 'ios') {
      return t('whatsapp.ios_steps', { returnObjects: true });
    } else {
      return t('whatsapp.desktop_steps', { returnObjects: true });
    }
  };

  // Obtener los pasos según la plataforma
  const steps = getSteps();
  
  // Seleccionar el video según la plataforma
  const tutorialVideo = platform === 'android' 
    ? '/recortadov1.mp4' 
    : platform === 'ios' 
      ? '/recortadoios.mp4' 
      : '/recortadoios.mp4'; // Usando el mismo video de iOS para desktop

  // Cambiar de plataforma
  const togglePlatform = (newPlatform) => {
    setPlatform(newPlatform);
    setActiveSlide(0); // Reiniciar a la primera diapositiva al cambiar de plataforma
  };

  // Cambiar automáticamente de slide cada 5 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prevSlide) => (prevSlide + 1) % steps.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [steps.length]);

  // Cambiar a un slide específico
  const goToSlide = (index) => {
    setActiveSlide(index);
  };

  // Avanzar al siguiente slide
  const nextSlide = () => {
    setActiveSlide((prevSlide) => (prevSlide + 1) % steps.length);
  };

  // Manejar clic en un slide para avanzar al siguiente
  const handleSlideClick = () => {
    nextSlide();
  };

  return (
    <div className="whatsapp-instructions">
      <h2>{t('whatsapp.title')}</h2>
      
      <div className="platform-selector">
        <button 
          className={`platform-button ${platform === 'android' ? 'active' : ''}`}
          onClick={() => togglePlatform('android')}
        >
          {t('whatsapp.platforms.android')}
        </button>
        <button 
          className={`platform-button ${platform === 'ios' ? 'active' : ''}`}
          onClick={() => togglePlatform('ios')}
        >
          {t('whatsapp.platforms.ios')}
        </button>
        <button 
          className={`platform-button ${platform === 'desktop' ? 'active' : ''}`}
          onClick={() => togglePlatform('desktop')}
        >
          {t('whatsapp.platforms.desktop')}
        </button>
      </div>
      
      <div className="instruction-tabs">
        <button 
          className={`tab-button ${activeTab === 'carousel' ? 'active' : ''}`}
          onClick={() => setActiveTab('carousel')}
        >
          {t('whatsapp.step_by_step')}
        </button>
        <button 
          className={`tab-button ${activeTab === 'video' ? 'active' : ''}`}
          onClick={() => setActiveTab('video')}
        >
          {t('whatsapp.video')}
        </button>
      </div>
      
      {/* Carousel View */}
      {activeTab === 'carousel' && (
        <div className="instruction-carousel">
          <div className="carousel-container">
            <div className="carousel-slides">
              {steps.map((step, index) => (
                <div 
                  key={index}
                  className={`carousel-slide ${index === activeSlide ? 'active' : ''}`}
                  onClick={handleSlideClick}
                >
                  <div className="slide-content">
                    <div className="slide-icon">{step.icon}</div>
                    <div className="slide-text">
                      <h3 className="slide-title">{step.title}</h3>
                      <p className="slide-description">{step.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="carousel-indicators">
            {steps.map((_, index) => (
              <button
                key={index}
                className={`indicator ${index === activeSlide ? 'active' : ''}`}
                onClick={() => goToSlide(index)}
                aria-label={`Slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Video View */}
      {activeTab === 'video' && (
        <div className="instruction-video">
          <video 
            src={tutorialVideo} 
            controls 
            className="tutorial-video"
          >
            {t('messages.error')}
          </video>
        </div>
      )}
    </div>
  );
}

export default WhatsappInstructions;