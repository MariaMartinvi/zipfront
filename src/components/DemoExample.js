import React from 'react';
import { useTranslation } from 'react-i18next';
import './DemoExample.css';

const DemoExample = () => {
  const { t } = useTranslation();

  return (
    <div className="couple-demo-container">
      <div className="couple-demo-header">
        <h1>🧠 {t('hero.couple_demo.title')}</h1>
        <p>{t('hero.couple_demo.subtitle')}</p>
      </div>

      <div className="couple-demo-content">
        {/* SECCIÓN 1: ANÁLISIS PSICOLÓGICO */}
        <div className="couple-couple-demo-section">
          <h2>👥 {t('hero.couple_demo.psychology.title')}</h2>
          
          <div className="psychology-item">
            <div className="avatar green-avatar">S</div>
            <div className="psychology-content">
              <h4><strong>{t('hero.couple_demo.sofia.name')}</strong></h4>
              
              <p><strong>- {t('hero.couple_demo.psychology.main_traits')}:</strong></p>
              <p>✨ <strong>{t('hero.couple_demo.sofia.trait1.title')}</strong> – {t('hero.couple_demo.sofia.trait1.description')}</p>
              <p>🎯 <strong>{t('hero.couple_demo.sofia.trait2.title')}</strong> – {t('hero.couple_demo.sofia.trait2.description')}</p>
              
              <p><strong>- {t('hero.couple_demo.psychology.strengths')}:</strong></p>
              <p>💪 <strong>{t('hero.couple_demo.sofia.strength.title')}</strong> – {t('hero.couple_demo.sofia.strength.description')}</p>
              
              <p><strong>- {t('hero.couple_demo.psychology.improvement_areas')}:</strong></p>
              <p>📱 <strong>{t('hero.couple_demo.sofia.improvement.title')}</strong> – {t('hero.couple_demo.sofia.improvement.description')}</p>
            </div>
          </div>

          <div className="psychology-item">
            <div className="avatar orange-avatar">D</div>
            <div className="psychology-content">
              <h4><strong>{t('hero.couple_demo.david.name')}</strong></h4>
              
              <p><strong>- {t('hero.couple_demo.psychology.main_traits')}:</strong></p>
              <p>💕 <strong>{t('hero.couple_demo.david.trait1.title')}</strong> – {t('hero.couple_demo.david.trait1.description')}</p>
              <p>🔄 <strong>{t('hero.couple_demo.david.trait2.title')}</strong> – {t('hero.couple_demo.david.trait2.description')}</p>
              
              <p><strong>- {t('hero.couple_demo.psychology.strengths')}:</strong></p>
              <p>❤️ <strong>{t('hero.couple_demo.david.strength.title')}</strong> – {t('hero.couple_demo.david.strength.description')}</p>
              
              <p><strong>- {t('hero.couple_demo.psychology.improvement_areas')}:</strong></p>
              <p>⚠️ <strong>{t('hero.couple_demo.david.improvement.title')}</strong> – {t('hero.couple_demo.david.improvement.description')}</p>
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: TOP PROFILES */}
        <div className="couple-demo-section">
          <h3 style={{color: '#2c3e50', marginBottom: '20px'}}>🏆 {t('hero.couple_demo.top_profiles.title')}</h3>
          <div className="top-profiles">
            <div className="profile-card">
              <h4>👑 {t('hero.couple_demo.top_profiles.most_messages.title')}</h4>
              <div className="winner">{t('hero.couple_demo.david.name')}</div>
              <div className="description">{t('hero.couple_demo.top_profiles.most_messages.description')}</div>
            </div>
            <div className="profile-card">
              <h4>⚡ {t('hero.couple_demo.top_profiles.most_direct.title')}</h4>
              <div className="winner">{t('hero.couple_demo.sofia.name')}</div>
              <div className="description">{t('hero.couple_demo.top_profiles.most_direct.description')}</div>
            </div>
            <div className="profile-card">
              <h4>💭 {t('hero.couple_demo.top_profiles.most_questions.title')}</h4>
              <div className="winner">{t('hero.couple_demo.david.name')}</div>
              <div className="description">{t('hero.couple_demo.top_profiles.most_questions.description')}</div>
            </div>
            <div className="profile-card">
              <h4>😴 {t('hero.couple_demo.top_profiles.most_nocturnal.title')}</h4>
              <div className="winner">{t('hero.couple_demo.david.name')}</div>
              <div className="description">{t('hero.couple_demo.top_profiles.most_nocturnal.description')}</div>
            </div>
            <div className="profile-card">
              <h4>🎯 {t('hero.couple_demo.top_profiles.most_focused.title')}</h4>
              <div className="winner">{t('hero.couple_demo.sofia.name')}</div>
              <div className="description">{t('hero.couple_demo.top_profiles.most_focused.description')}</div>
            </div>
            <div className="profile-card">
              <h4>💕 {t('hero.couple_demo.top_profiles.most_romantic.title')}</h4>
              <div className="winner">{t('hero.couple_demo.david.name')}</div>
              <div className="description">{t('hero.couple_demo.top_profiles.most_romantic.description')}</div>
            </div>
          </div>
        </div>

        {/* LLAMADA A LA ACCIÓN */}
        <div className="cta-section">
          <h2>🚀 {t('hero.couple_demo.cta.title')}</h2>
          <p>{t('hero.couple_demo.cta.description')}</p>
          <a href="/" className="cta-button">🔍 {t('hero.couple_demo.cta.button')}</a>
        </div>
      </div>
    </div>
  );
};

export default DemoExample;
