import React from 'react';
import './HeroSection.css';
import { useTranslation } from 'react-i18next';

const HeroSection = ({ onAnalyzeClick, onLearnMoreClick, onViewAnalysisClick }) => {
  const { t } = useTranslation();

  return (
    <section className="hero-section">
      <div className="hero-content">
        <div className="hero-text">
          <span className="new-hero-badge">{t('hero.badge', 'ANÁLISIS DE WHATSAPP')}</span>
          <h1 className="hero-title">
            {t('hero.title.discover', '¿Quién habla más en tu grupo?')}
            <span className="gradient-text"> {t('hero.title.conversations', 'Descubre los secretos ocultos')}</span>
            <span className="whatsapp-text"> {t('hero.title.whatsapp', 'de WhatsApp')}</span> {t('hero.title.conversations_suffix', '')}
          </h1>
          <p className="hero-description">
            {t('hero.description', '🔥 Análisis psicológico + estadísticas detalladas de tus chats. ¿Quién es el más gracioso? ¿El más intenso? ¡Descúbrelo en 30 segundos!')}
          </p>
          <div className="hero-actions">
            <button className="cta-primary" onClick={onAnalyzeClick}>
              {t('hero.buttons.analyze', 'Analizar mi chat')}
            </button>
            <button className="cta-secondary" onClick={onLearnMoreClick}>
              {t('hero.buttons.how_it_works', 'Cómo funciona')}
            </button>
          </div>
          <div className="security-badge">
            <div className="security-icons">
              <div className="security-icon-circle security-icon-green">🔒</div>
              <div className="security-icon-circle security-icon-purple">📊</div>
              <div className="security-icon-circle security-icon-green-alt">🧠</div>
            </div>
            <div className="security-text">
              <strong>{t('hero.security.title', '100% Privado y Seguro')}</strong>
              <span>{t('hero.security.subtitle', 'Los datos no salen de tu dispositivo')}</span>
            </div>
          </div>
        </div>
        <div className="hero-preview">
          <div className="phone-mockup">
            <div className="phone-header">
              <div className="phone-indicators">
                <span className="indicator green">●</span>
                <span className="phone-title">{t('hero.mockup.title', 'Resultados instantáneos')}</span>
              </div>
            </div>
            <div className="phone-content">
              <div className="analysis-card">
                <div className="participant-card">
                  <div className="participant-avatar">L</div>
                  <div className="participant-info">
                    <h4>{t('hero.mockup.profile', 'Extrovertida, líder natural del grupo.')}</h4>
                    <p>{t('hero.mockup.description', 'Suele iniciar la mayoría de las conversaciones.')}</p>
                  </div>
                </div>
              </div>
              <div className="chart-placeholder">
                <div className="chart-bar" style={{'--height': '80%', '--color': 'var(--primary-green)'}}></div>
                <div className="chart-bar" style={{'--height': '60%', '--color': 'var(--accent-purple)'}}></div>
                <div className="chart-bar" style={{'--height': '40%', '--color': 'var(--accent-pink)'}}></div>
                <div className="chart-bar" style={{'--height': '25%', '--color': 'var(--accent-orange)'}}></div>
              </div>
              <button className="view-analysis-btn" onClick={onViewAnalysisClick}>
                {t('hero.mockup.view_analysis', 'Ver análisis completo')} →
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection; 