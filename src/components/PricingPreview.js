import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import './PricingPreview.css';

const PricingPreview = ({ onAnalyzeClick }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <section className="pricing-home-section">
      <div className="pricing-home-container">
        <span className="pricing-home-badge">{t('pricing_home.badge', 'PRECIOS')}</span>
        <h2 className="pricing-home-title">{t('pricing_home.title', 'Gratis para siempre, IA opcional')}</h2>
        <p className="pricing-home-subtitle">{t('freemium.header.subtitle')}</p>

        <div className="pricing-home-grid">
          <div className="pricing-home-card">
            <h3>{t('freemium.stats.statistical_analysis')}</h3>
            <div className="pricing-home-value">{t('freemium.stats.unlimited')}</div>
            <p className="pricing-home-note">{t('freemium.stats.always_free')}</p>
            <p className="pricing-home-detail">{t('freemium.how_it_works.step1.description')}</p>
            <button className="pricing-home-cta-free" onClick={onAnalyzeClick}>
              {t('hero.buttons.analyze', 'Analizar mi chat')}
            </button>
          </div>

          <div className="pricing-home-card pricing-home-card-featured">
            <h3>{t('freemium.ai_pack.title')}</h3>
            <div className="pricing-home-price-row">
              <span className="pricing-home-original">{t('freemium.ai_pack.original_price')}</span>
              <span className="pricing-home-price">{t('freemium.ai_pack.price')}</span>
              <span className="pricing-home-period">{t('freemium.ai_pack.analyses')}</span>
            </div>
            <ul className="pricing-home-features">
              <li>{t('freemium.ai_pack.features.psychological')}</li>
              <li>{t('freemium.ai_pack.features.personalities')}</li>
              <li>{t('freemium.ai_pack.features.group_dynamics')}</li>
              <li>{t('freemium.ai_pack.features.no_subscription')}</li>
            </ul>
            <button className="pricing-home-cta-ai" onClick={() => navigate('/plans')}>
              {t('pricing_home.ai_cta', 'Ver Pack IA')}
            </button>
          </div>
        </div>
      </div>

      <div className="pricing-home-final-cta">
        <h2>{t('pricing_home.final_title', 'Descubre lo que esconde tu grupo')}</h2>
        <button className="pricing-home-final-button" onClick={onAnalyzeClick}>
          {t('hero.buttons.analyze', 'Analizar mi chat')}
        </button>
      </div>
    </section>
  );
};

export default PricingPreview;
