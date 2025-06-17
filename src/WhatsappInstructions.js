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
      title: t('whatsapp.simplified_steps.android.0.title'),
      description: t('whatsapp.simplified_steps.android.0.description'),
      image: "/android-step1.png",
      icon: "📱"
    },
    {
      id: 2, 
      title: t('whatsapp.simplified_steps.android.1.title'),
      description: t('whatsapp.simplified_steps.android.1.description'),
      image: "/android-step2.png",
      icon: "🚀"
    }
  ];

  // Pasos simplificados para iOS (3 pasos)
  const iosStepsSimplified = [
    {
      id: 1,
      title: t('whatsapp.simplified_steps.ios.0.title'),
      description: t('whatsapp.simplified_steps.ios.0.description'),
      image: "/ios-step1.png",
      icon: "📱"
    },
    {
      id: 2,
      title: t('whatsapp.simplified_steps.ios.1.title'),
      description: t('whatsapp.simplified_steps.ios.1.description'),
      image: "/ios-step2.png",
      icon: "💾"
    },
    {
      id: 3,
      title: t('whatsapp.simplified_steps.ios.2.title'),
      description: t('whatsapp.simplified_steps.ios.2.description'),
      image: "/ios-step3.png",
      icon: "🚀"
    }
  ];

  // Pasos simplificados para Desktop (3 pasos)
  const desktopStepsSimplified = [
    {
      id: 1,
      title: t('whatsapp.simplified_steps.desktop.0.title'),
      description: t('whatsapp.simplified_steps.desktop.0.description'),
      image: "/android-step1.png",
      icon: "📱"
    },
    {
      id: 2,
      title: t('whatsapp.simplified_steps.desktop.1.title'),
      description: t('whatsapp.simplified_steps.desktop.1.description'),
      image: "/desktop-step2.png",
      icon: "📧"
    },
    {
      id: 3,
      title: t('whatsapp.simplified_steps.desktop.2.title'),
      description: t('whatsapp.simplified_steps.desktop.2.description'),
      image: "/desktop-step3.png",
      icon: "💻"
    }
  ];

  // Para móvil: mostrar solo pasos de la plataforma detectada
  const getSteps = () => {
    if (platform === 'android') {
      return androidStepsSimplified;
    } else if (platform === 'ios') {
      return iosStepsSimplified;
    } else {
      return desktopStepsSimplified;
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
          <h2>{t('whatsapp.hero.android.title')}</h2>
          <p className="subtitle">{t('whatsapp.hero.android.subtitle')}</p>
        </div>
      )}
      
      {/* Título motivacional para iOS */}
      {platform === 'ios' && (
        <div className="android-hero">
          <h2>{t('whatsapp.hero.ios.title')}</h2>
          <p className="subtitle">{t('whatsapp.hero.ios.subtitle')}</p>
        </div>
      )}
      
      {/* Título motivacional para Desktop */}
      {platform === 'desktop' && (
        <div className="android-hero">
          <h2>{t('whatsapp.hero.desktop.title')}</h2>
          <p className="subtitle">{t('whatsapp.hero.desktop.subtitle')}</p>
        </div>
      )}
      
      {/* Título general para otras plataformas */}
      {platform !== 'android' && platform !== 'ios' && platform !== 'desktop' && <h2>{t('whatsapp.title')}</h2>}
      
      {/* Mostrar selector de plataforma en desktop SIEMPRE */}
      {detectPlatform() === 'desktop' && (
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
          {platform === 'android' ? '📱 Paso a paso' : platform === 'ios' ? '📱 Paso a paso' : platform === 'desktop' ? '💻 Paso a paso' : t('whatsapp.step_by_step')}
        </button>
        <button 
          className={`tab-button ${activeTab === 'video' ? 'active' : ''}`}
          onClick={() => setActiveTab('video')}
        >
          {platform === 'android' ? '🎥 Video' : platform === 'ios' ? '🎥 Video' : platform === 'desktop' ? '🎥 Video' : t('whatsapp.video')}
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
                  className={`carousel-slide ${index === activeSlide ? 'active' : ''} ${(platform === 'android' || platform === 'ios' || platform === 'desktop') ? 'simplified-slide' : ''}`}
                  onClick={handleSlideClick}
                >
                  <div className="slide-content">
                    {/* Para Android, iOS e Desktop: layout simplificado */}
                    {(platform === 'android' || platform === 'ios' || platform === 'desktop') ? (
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
          
          {/* Mensaje motivacional para Android, iOS y Desktop */}
          {(platform === 'android' || platform === 'ios' || platform === 'desktop') && (
            <div className="android-footer">
              <p className="encouragement">{t('whatsapp.footer_message')}</p>
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