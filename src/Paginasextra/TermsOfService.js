import React from 'react';
import { useTranslation } from 'react-i18next';
import '../AppPreview.css';

const TermsOfService = () => {
  const { t } = useTranslation();

  // Obtener las secciones desde las traducciones
  const sections = t('pages.terms.sections', { returnObjects: true }) || [];

  return (
    <div className="modern-preview-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content" style={{ gridTemplateColumns: '1fr', textAlign: 'center', gap: '40px' }}>
          <div className="hero-text">
            <h1 className="hero-title">{t('pages.terms.title')}</h1>
            <p className="hero-description">{t('pages.terms.updated')}</p>
            <p className="hero-description">
              {t('pages.terms.subtitle')}
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="features-section">
        <div className="features-container">
          <span className="features-badge">{t('pages.terms.badge')}</span>
          <h2 className="features-title">{t('pages.terms.section_title')}</h2>
          <p className="features-description">
            {t('pages.terms.section_description')}
          </p>
          
          <div className="features-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '30px' }}>
            {sections.map((section, index) => (
              <div key={index} className="feature-card">
                <div className={`feature-icon-new gradient-bg ${index % 2 === 0 ? 'rotate-left' : 'rotate-right'}`}>
                  <span className="feature-icon-large">{section.icon}</span>
                </div>
                <h3>{section.title}</h3>
                {section.content && (
                  <p style={{ textAlign: 'left', fontSize: '18px', lineHeight: '1.6' }}>
                    {section.content}
                  </p>
                )}
                {section.items && (
                  <ul style={{ textAlign: 'left', margin: '0', fontSize: '18px', lineHeight: '1.6' }}>
                    {section.items.map((item, itemIndex) => (
                      <li key={itemIndex} style={{ marginBottom: '12px' }}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Important Notice */}
      <section className="process-section">
        <div className="process-container">
          <div className="feature-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="feature-icon-new gradient-bg rotate-left">
              <span className="feature-icon-large">📋</span>
            </div>
            <h3 style={{ color: '#8A2BE2', marginBottom: '20px' }}>{t('pages.terms.important_notice.title')}</h3>
            <p style={{ textAlign: 'center', fontSize: '18px', lineHeight: '1.6' }}>
              {t('pages.terms.important_notice.description')} <a href="/contact" className="privacy-link">{t('pages.terms.important_notice.contact_link')}</a>.
            </p>
          </div>
        </div>
      </section>

      {/* Security Badge */}
      <section className="security-section">
        <div className="security-badge-modern">
          <span className="security-icon">📋</span>
          <span className="security-text">{t('pages.terms.security_badge')}</span>
          <span className="security-icon">✓</span>
        </div>
      </section>
    </div>
  );
};

export default TermsOfService;