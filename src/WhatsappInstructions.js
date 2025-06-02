import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './WhatsappInstructions.css';

// SVG Icons para cada paso
const getSvgIcon = (stepIndex, stepType) => {
  const isGreen = stepIndex % 2 === 0;
  const color = isGreen ? '#25D366' : 'rgb(138, 43, 226)';
  
  const icons = {
    // Para Android
    'phone': (
      <svg xmlns="http://www.w3.org/2000/svg" className="process-svg" fill="none" viewBox="0 0 24 24" stroke={color}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
      </svg>
    ),
    'chat': (
      <svg xmlns="http://www.w3.org/2000/svg" className="process-svg" fill="none" viewBox="0 0 24 24" stroke={color}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
      </svg>
    ),
    'menu': (
      <svg xmlns="http://www.w3.org/2000/svg" className="process-svg" fill="none" viewBox="0 0 24 24" stroke={color}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path>
      </svg>
    ),
    'more': (
      <svg xmlns="http://www.w3.org/2000/svg" className="process-svg" fill="none" viewBox="0 0 24 24" stroke={color}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
      </svg>
    ),
    'export': (
      <svg xmlns="http://www.w3.org/2000/svg" className="process-svg" fill="none" viewBox="0 0 24 24" stroke={color}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
      </svg>
    ),
    'check': (
      <svg xmlns="http://www.w3.org/2000/svg" className="process-svg" fill="none" viewBox="0 0 24 24" stroke={color}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
      </svg>
    ),
    // Para iOS
    'touch': (
      <svg xmlns="http://www.w3.org/2000/svg" className="process-svg" fill="none" viewBox="0 0 24 24" stroke={color}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11"></path>
      </svg>
    ),
    'scroll': (
      <svg xmlns="http://www.w3.org/2000/svg" className="process-svg" fill="none" viewBox="0 0 24 24" stroke={color}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
      </svg>
    ),
    'document': (
      <svg xmlns="http://www.w3.org/2000/svg" className="process-svg" fill="none" viewBox="0 0 24 24" stroke={color}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
      </svg>
    ),
    'save': (
      <svg xmlns="http://www.w3.org/2000/svg" className="process-svg" fill="none" viewBox="0 0 24 24" stroke={color}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path>
      </svg>
    ),
    'folder': (
      <svg xmlns="http://www.w3.org/2000/svg" className="process-svg" fill="none" viewBox="0 0 24 24" stroke={color}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
      </svg>
    ),
    // Para Desktop
    'email': (
      <svg xmlns="http://www.w3.org/2000/svg" className="process-svg" fill="none" viewBox="0 0 24 24" stroke={color}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
      </svg>
    ),
    'computer': (
      <svg xmlns="http://www.w3.org/2000/svg" className="process-svg" fill="none" viewBox="0 0 24 24" stroke={color}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
      </svg>
    ),
    'download': (
      <svg xmlns="http://www.w3.org/2000/svg" className="process-svg" fill="none" viewBox="0 0 24 24" stroke={color}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
      </svg>
    ),
    'web': (
      <svg xmlns="http://www.w3.org/2000/svg" className="process-svg" fill="none" viewBox="0 0 24 24" stroke={color}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path>
      </svg>
    ),
    'upload': (
      <svg xmlns="http://www.w3.org/2000/svg" className="process-svg" fill="none" viewBox="0 0 24 24" stroke={color}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
      </svg>
    )
  };
  
  // Mapear según la plataforma y el índice del paso
  const iconMap = {
    android: ['phone', 'chat', 'menu', 'more', 'export', 'check'],
    ios: ['chat', 'touch', 'scroll', 'export', 'document', 'save', 'folder', 'check'],
    desktop: ['phone', 'export', 'email', 'computer', 'download', 'web', 'upload']
  };
  
  const iconKey = iconMap[stepType] && iconMap[stepType][stepIndex] ? iconMap[stepType][stepIndex] : 'check';
  return icons[iconKey] || icons['check'];
};

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
                    <div className={`process-icon ${index % 2 === 0 ? 'green-border' : 'purple-border'}`}>
                      <span className="emoji-icon">{step.icon}</span>
                    </div>
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
            {t('messages_status.error')}
          </video>
        </div>
      )}
    </div>
  );
}

export default WhatsappInstructions;