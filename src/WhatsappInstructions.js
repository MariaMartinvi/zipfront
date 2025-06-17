import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './WhatsappInstructions.css';

// Detectar plataforma automáticamente
const detectPlatform = () => {
  const userAgent = navigator.userAgent;
  if (/Android/i.test(userAgent)) return 'android';
  if (/iPhone|iPad|iPod/i.test(userAgent)) return 'ios';
  return 'desktop';
};

function WhatsappInstructions() {
  const { t } = useTranslation();
  const [activeSlide, setActiveSlide] = useState(0);
  const [platform, setPlatform] = useState(detectPlatform());
  const [activeTab, setActiveTab] = useState('carousel');

  // Pasos simplificados para Android (solo 2 pasos)
  const androidStepsSimplified = [
    {
      id: 1,
      title: "¡Súper fácil! Exporta tu chat",
      description: "En tu chat de WhatsApp: Toca los 3 puntos → Más → Exportar chat → Sin medios",
      image: "/android-step1.png",
      icon: "📱"
    },
    {
      id: 2, 
      title: "¡Listo! Comparte con ChatSalsa",
      description: "Toca ChatSalsa para subir tu archivo y ¡ya está!",
      image: "/android-step2.png",
      icon: "🚀"
    }
  ];

  // Pasos simplificados para iOS (3 pasos)
  const iosStepsSimplified = [
    {
      id: 1,
      title: "¡Súper fácil! Exporta tu chat",
      description: "En tu chat de WhatsApp: Clica en el nombre del grupo →Ves hasta Exportar chat → Sin medios",
      image: "/ios-step1.png",
      icon: "📱"
    },
    {
      id: 2,
      title: "Guarda en tu iPhone",
      description: "Toca 'Guardar en archivos' → 'en mi iPhone' → Guardar",
      image: "/ios-step2.png",
      icon: "💾"
    },
    {
      id: 3,
      title: "¡Listo! Sube a ChatSalsa",
      description: "En ChatSalsa toca 'Seleccionar archivo' y ¡ya tienes tu análisis!",
      image: "/ios-step3.png",
      icon: "🚀"
    }
  ];

  // Para móvil: mostrar solo pasos de la plataforma detectada
  const getSteps = () => {
    if (platform === 'android') {
      return androidStepsSimplified;
    } else if (platform === 'ios') {
      return iosStepsSimplified;
    } else {
      return t('whatsapp.desktop_steps', { returnObjects: true });
    }
  };

  const steps = getSteps();
  
  const tutorialVideo = platform === 'android' 
    ? '/recortadov1.mp4' 
    : platform === 'ios' 
      ? '/recortadoios.mp4' 
      : '/desktop.mp4';

  const togglePlatform = (newPlatform) => {
    setPlatform(newPlatform);
    setActiveSlide(0);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prevSlide) => (prevSlide + 1) % steps.length);
    }, 6000); // Más tiempo para leer
    
    return () => clearInterval(interval);
  }, [steps.length]);

  const goToSlide = (index) => {
    setActiveSlide(index);
  };

  const nextSlide = () => {
    setActiveSlide((prevSlide) => (prevSlide + 1) % steps.length);
  };

  const handleSlideClick = () => {
    nextSlide();
  };

  return (
    <div className="whatsapp-instructions">
      {/* Título motivacional para Android */}
      {platform === 'android' && (
        <div className="android-hero">
                     <h2>🚀 ¡En 10 segundos tienes tu análisis!</h2>
          <p className="subtitle">Solo 2 pasos súper sencillos:</p>
        </div>
      )}
      
      {/* Título motivacional para iOS */}
      {platform === 'ios' && (
        <div className="android-hero">
          <h2>🚀 ¡En 10 segundos tienes tu análisis!</h2>
          <p className="subtitle">Solo 3 pasos súper sencillos:</p>
        </div>
      )}
      
      {/* Título general para otras plataformas */}
      {platform !== 'android' && platform !== 'ios' && <h2>{t('whatsapp.title')}</h2>}
      
      {/* Solo mostrar selector de plataforma en desktop */}
      {platform === 'desktop' && (
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
      )}
      
      <div className="instruction-tabs">
        <button 
          className={`tab-button ${activeTab === 'carousel' ? 'active' : ''}`}
          onClick={() => setActiveTab('carousel')}
        >
          {platform === 'android' ? '📱 Paso a paso' : platform === 'ios' ? '📱 Paso a paso' : t('whatsapp.step_by_step')}
        </button>
        <button 
          className={`tab-button ${activeTab === 'video' ? 'active' : ''}`}
          onClick={() => setActiveTab('video')}
        >
          {platform === 'android' ? '🎥 Video' : platform === 'ios' ? '🎥 Video' : t('whatsapp.video')}
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
                  className={`carousel-slide ${index === activeSlide ? 'active' : ''} ${(platform === 'android' || platform === 'ios') ? 'simplified-slide' : ''}`}
                  onClick={handleSlideClick}
                >
                  <div className="slide-content">
                    {/* Para Android e iOS: layout simplificado */}
                    {(platform === 'android' || platform === 'ios') ? (
                      <div className="simplified-layout">
                        <div className="step-number">
                          <span className="big-number">{step.id}</span>
                        </div>
                        <div className="step-info">
                          <h3 className="simple-title">{step.title}</h3>
                          <p className="simple-description">{step.description}</p>
                        </div>
                                                 {/* Imagen real del paso */}
                         <div className="step-image-container">
                           <img 
                             src={step.image} 
                             alt={step.title}
                             className="step-image"
                           />
                         </div>
                      </div>
                    ) : (
                      /* Layout original para otras plataformas */
                      <div className="slide-content">
                        <div className={`process-icon ${index % 2 === 0 ? 'green-border' : 'purple-border'}`}>
                          <span className="emoji-icon">{step.icon}</span>
                        </div>
                        <div className="slide-text">
                          <h3 className="slide-title">{step.title}</h3>
                          <p className="slide-description">{step.description}</p>
                        </div>
                      </div>
                    )}
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
          
          {/* Mensaje motivacional para Android e iOS */}
          {(platform === 'android' || platform === 'ios') && (
            <div className="android-footer">
              <p className="encouragement">¡Es así de simple! 🎉</p>
            </div>
          )}
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