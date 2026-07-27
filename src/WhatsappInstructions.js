import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './WhatsappInstructions.css';
import InstallPWA from './InstallPWA';

// Detectar plataforma automáticamente
const detectPlatform = () => {
  const userAgent = navigator.userAgent;
  if (/Android/i.test(userAgent)) return 'android';
  if (/iPhone|iPad|iPod/i.test(userAgent)) return 'ios';
  return 'desktop';
};

function WhatsappInstructions() {
  const { t } = useTranslation();
  const [platform, setPlatform] = useState(detectPlatform());
  const [activeTab, setActiveTab] = useState('steps');

  const scrollToUpload = () => {
    setTimeout(() => {
      const uploadSection = document.querySelector('.upload-section') ||
                            document.querySelector('[class*="upload"]') ||
                            document.querySelector('input[type="file"]')?.closest('div');
      if (uploadSection) {
        uploadSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 2000);
  };

  // Pasos por plataforma (mismas claves i18n que antes)
  const stepsByPlatform = {
    android: [
      {
        id: 1,
        title: t('whatsapp.simplified_steps.android.install.title'),
        description: t('whatsapp.simplified_steps.android.install.description'),
        image: null,
        hasButton: true,
        buttonText: t('whatsapp.simplified_steps.android.install.button'),
        buttonAction: scrollToUpload
      },
      {
        id: 2,
        title: t('whatsapp.simplified_steps.android.0.title'),
        description: t('whatsapp.simplified_steps.android.0.description'),
        image: "/android-step1.png"
      },
      {
        id: 3,
        title: t('whatsapp.simplified_steps.android.1.title'),
        description: t('whatsapp.simplified_steps.android.1.description'),
        image: "/android-step2.png"
      }
    ],
    ios: [
      {
        id: 1,
        title: t('whatsapp.simplified_steps.ios.0.title'),
        description: t('whatsapp.simplified_steps.ios.0.description'),
        image: "/ios-step1.png"
      },
      {
        id: 2,
        title: t('whatsapp.simplified_steps.ios.1.title'),
        description: t('whatsapp.simplified_steps.ios.1.description'),
        image: "/ios-step2.png"
      },
      {
        id: 3,
        title: t('whatsapp.simplified_steps.ios.2.title'),
        description: t('whatsapp.simplified_steps.ios.2.description'),
        image: "/ios-step3.png"
      }
    ],
    desktop: [
      {
        id: 1,
        title: t('whatsapp.simplified_steps.desktop.0.title'),
        description: t('whatsapp.simplified_steps.desktop.0.description'),
        image: "/android-step1.png"
      },
      {
        id: 2,
        title: t('whatsapp.simplified_steps.desktop.1.title'),
        description: t('whatsapp.simplified_steps.desktop.1.description'),
        image: "/desktop-step2.png"
      },
      {
        id: 3,
        title: t('whatsapp.simplified_steps.desktop.2.title'),
        description: t('whatsapp.simplified_steps.desktop.2.description'),
        image: "/desktop-step3.png"
      }
    ]
  };

  const steps = stepsByPlatform[platform] || stepsByPlatform.desktop;

  const tutorialVideo = platform === 'android'
    ? '/recortadov1.mp4'
    : platform === 'ios'
      ? '/recortadoios.mp4'
      : '/desktop.mp4';

  return (
    <div className="whatsapp-instructions">
      <div className="instructions-header">
        <h2>{t(`whatsapp.hero.${platform}.title`, t('whatsapp.title'))}</h2>
        <p className="instructions-subtitle">{t(`whatsapp.hero.${platform}.subtitle`, '')}</p>
      </div>

      {/* Selector de plataforma (solo visible en escritorio) */}
      {detectPlatform() === 'desktop' && (
        <div className="platform-selector" role="tablist">
          {['android', 'ios', 'desktop'].map((p) => (
            <button
              key={p}
              className={`platform-button ${platform === p ? 'active' : ''}`}
              onClick={() => setPlatform(p)}
            >
              {t(`whatsapp.platforms.${p}`)}
            </button>
          ))}
        </div>
      )}

      <div className="instruction-tabs">
        <button
          className={`tab-button ${activeTab === 'steps' ? 'active' : ''}`}
          onClick={() => setActiveTab('steps')}
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

      {activeTab === 'steps' && (
        <div className="steps-grid">
          {steps.map((step) => (
            <div key={step.id} className="step-card">
              <div className="step-card-header">
                <span className="step-badge">{step.id}</span>
                <h3 className="step-title">{step.title}</h3>
              </div>
              <p className="step-description">{step.description}</p>

              {step.hasButton ? (
                <div className="step-button-container">
                  <InstallPWA />
                  <button type="button" className="step-hint" onClick={step.buttonAction}>
                    {step.buttonText}
                  </button>
                </div>
              ) : (
                step.image && (
                  <div className="step-image-container">
                    <img src={step.image} alt={step.title} className="step-image" loading="lazy" />
                  </div>
                )
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'video' && (
        <div className="instruction-video">
          <video src={tutorialVideo} controls className="tutorial-video">
            {t('messages_status.error')}
          </video>
        </div>
      )}
    </div>
  );
}

export default WhatsappInstructions;
