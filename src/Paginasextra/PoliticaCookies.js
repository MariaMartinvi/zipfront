import React from 'react';
import { useTranslation } from 'react-i18next';
import '../AppPreview.css';

const PoliticaCookies = () => {
  const { t } = useTranslation();

  return (
    <div className="modern-preview-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content" style={{ gridTemplateColumns: '1fr', textAlign: 'center', gap: '40px' }}>
          <div className="hero-text">
            <h1 className="hero-title">{t('pages.cookies.title')}</h1>
            <p className="hero-description">{t('pages.cookies.updated')}</p>
            <p className="hero-description">
              {t('pages.cookies.subtitle')}
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="features-section">
        <div className="features-container">
          <span className="features-badge">{t('pages.cookies.badge')}</span>
          <h2 className="features-title">{t('pages.cookies.section_title')}</h2>
          <p className="features-description">
            {t('pages.cookies.section_description')}
          </p>
          
          <div className="features-grid" style={{ gridTemplateColumns: '1fr', gap: '40px' }}>
            
            {/* What are cookies */}
            <div className="feature-card">
              <div className="feature-icon-new gradient-bg rotate-left">
                <span className="feature-icon-large">🍪</span>
              </div>
              <h3>{t('pages.cookies.sections.what_are_cookies.title')}</h3>
              <p style={{ textAlign: 'left', fontSize: '18px', lineHeight: '1.6' }}>
                {t('pages.cookies.sections.what_are_cookies.description')}
              </p>
            </div>

            {/* Types of cookies */}
            <div className="feature-card">
              <div className="feature-icon-new gradient-bg rotate-right">
                <span className="feature-icon-large">📋</span>
              </div>
              <h3>{t('pages.cookies.sections.types_of_cookies.title')}</h3>
              
              <div style={{ textAlign: 'left', marginTop: '20px' }}>
                <h4 style={{ color: '#25D366', marginBottom: '15px', fontSize: '20px' }}>
                  {t('pages.cookies.sections.types_of_cookies.strictly_necessary.title')}
                </h4>
                <p style={{ marginBottom: '10px', fontSize: '18px', lineHeight: '1.6' }}>
                  {t('pages.cookies.sections.types_of_cookies.strictly_necessary.description')}
                </p>
                <ul style={{ marginBottom: '20px', fontSize: '18px', lineHeight: '1.6' }}>
                  {t('pages.cookies.sections.types_of_cookies.strictly_necessary.items', { returnObjects: true }).map((item, index) => (
                    <li key={index} style={{ marginBottom: '8px' }}>
                      <strong>{item.split(':')[0]}:</strong> {item.split(':')[1]}
                    </li>
                  ))}
                </ul>
                
                <h4 style={{ color: '#8A2BE2', marginBottom: '15px', fontSize: '20px' }}>
                  {t('pages.cookies.sections.types_of_cookies.analytics.title')}
                </h4>
                <p style={{ marginBottom: '10px', fontSize: '18px', lineHeight: '1.6' }}>
                  {t('pages.cookies.sections.types_of_cookies.analytics.description')}
                </p>
                <ul style={{ marginBottom: '20px', fontSize: '18px', lineHeight: '1.6' }}>
                  {t('pages.cookies.sections.types_of_cookies.analytics.items', { returnObjects: true }).map((item, index) => (
                    <li key={index} style={{ marginBottom: '8px' }}>
                      <strong>{item.split(':')[0]}:</strong> {item.split(':')[1]}
                    </li>
                  ))}
                </ul>

                <h4 style={{ color: '#E91E63', marginBottom: '15px', fontSize: '20px' }}>
                  {t('pages.cookies.sections.types_of_cookies.marketing.title')}
                </h4>
                <p style={{ marginBottom: '10px', fontSize: '18px', lineHeight: '1.6' }}>
                  {t('pages.cookies.sections.types_of_cookies.marketing.description')}
                </p>
                <ul style={{ marginBottom: '20px', fontSize: '18px', lineHeight: '1.6' }}>
                  {t('pages.cookies.sections.types_of_cookies.marketing.items', { returnObjects: true }).map((item, index) => (
                    <li key={index} style={{ marginBottom: '8px' }}>
                      <strong>{item.split(':')[0]}:</strong> {item.split(':')[1]}
                    </li>
                  ))}
                </ul>

                <h4 style={{ color: '#FF9800', marginBottom: '15px', fontSize: '20px' }}>
                  {t('pages.cookies.sections.types_of_cookies.functionality.title')}
                </h4>
                <p style={{ marginBottom: '10px', fontSize: '18px', lineHeight: '1.6' }}>
                  {t('pages.cookies.sections.types_of_cookies.functionality.description')}
                </p>
                <ul style={{ fontSize: '18px', lineHeight: '1.6' }}>
                  {t('pages.cookies.sections.types_of_cookies.functionality.items', { returnObjects: true }).map((item, index) => (
                    <li key={index} style={{ marginBottom: '8px' }}>
                      <strong>{item.split(':')[0]}:</strong> {item.split(':')[1]}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Specific cookies */}
            <div className="feature-card">
              <div className="feature-icon-new gradient-bg rotate-left">
                <span className="feature-icon-large">🔍</span>
              </div>
              <h3>{t('pages.cookies.sections.specific_cookies.title')}</h3>
              
              <div style={{ background: '#fff3cd', padding: '20px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #ffeaa7' }}>
                <p style={{ margin: '0', fontSize: '18px', color: '#856404', lineHeight: '1.6' }}>
                  {t('pages.cookies.sections.specific_cookies.warning')}
                </p>
              </div>
              
              <div style={{ textAlign: 'left' }}>
                <h4 style={{ color: '#25D366', marginBottom: '15px', fontSize: '20px' }}>
                  {t('pages.cookies.sections.specific_cookies.own_cookies.title')}
                </h4>
                <ul style={{ marginBottom: '20px', fontSize: '18px', lineHeight: '1.6' }}>
                  {t('pages.cookies.sections.specific_cookies.own_cookies.items', { returnObjects: true }).map((item, index) => (
                    <li key={index} style={{ marginBottom: '12px' }}>
                      <strong>{item.split(':')[0]}:</strong> {item.split(':')[1]}
                    </li>
                  ))}
                </ul>

                <h4 style={{ color: '#8A2BE2', marginBottom: '15px', fontSize: '20px' }}>
                  {t('pages.cookies.sections.specific_cookies.third_party_cookies.title')}
                </h4>
                <p style={{ fontStyle: 'italic', marginBottom: '10px', fontSize: '18px', lineHeight: '1.6' }}>
                  {t('pages.cookies.sections.specific_cookies.third_party_cookies.note')}
                </p>
                <ul style={{ marginBottom: '20px', fontSize: '18px', lineHeight: '1.6' }}>
                  {t('pages.cookies.sections.specific_cookies.third_party_cookies.items', { returnObjects: true }).map((item, index) => (
                    <li key={index} style={{ marginBottom: '8px' }}>
                      <strong>{item.split(':')[0]}:</strong> {item.split(':')[1]}
                    </li>
                  ))}
                </ul>

                <h4 style={{ color: '#FF5722', marginBottom: '15px', fontSize: '20px' }}>
                  {t('pages.cookies.sections.specific_cookies.firebase_stripe.title')}
                </h4>
                <ul style={{ fontSize: '18px', lineHeight: '1.6' }}>
                  {t('pages.cookies.sections.specific_cookies.firebase_stripe.items', { returnObjects: true }).map((item, index) => (
                    <li key={index} style={{ marginBottom: '8px' }}>
                      <strong>{item.split(':')[0]}:</strong> {item.split(':')[1]}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Cookie management */}
            <div className="feature-card">
              <div className="feature-icon-new gradient-bg rotate-right">
                <span className="feature-icon-large">⚙️</span>
              </div>
              <h3>{t('pages.cookies.sections.cookie_management.title')}</h3>
              <div style={{ textAlign: 'left' }}>
                <p style={{ marginBottom: '15px', fontSize: '18px', lineHeight: '1.6' }}>
                  {t('pages.cookies.sections.cookie_management.description')}
                </p>
                <ul style={{ marginBottom: '20px', fontSize: '18px', lineHeight: '1.6' }}>
                  {t('pages.cookies.sections.cookie_management.ways', { returnObjects: true }).map((way, index) => (
                    <li key={index} style={{ marginBottom: '12px' }}>{way}</li>
                  ))}
                </ul>

                <h4 style={{ color: '#8A2BE2', marginBottom: '15px', fontSize: '20px' }}>
                  {t('pages.cookies.sections.cookie_management.browser_settings.title')}
                </h4>
                <ul style={{ fontSize: '18px', lineHeight: '1.6' }}>
                  {t('pages.cookies.sections.cookie_management.browser_settings.browsers', { returnObjects: true }).map((browser, index) => (
                    <li key={index} style={{ marginBottom: '12px' }}>
                      <strong>{browser.split(':')[0]}:</strong> {browser.split(':')[1]}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Retention and deletion */}
            <div className="feature-card">
              <div className="feature-icon-new gradient-bg rotate-left">
                <span className="feature-icon-large">🗂️</span>
              </div>
              <h3>{t('pages.cookies.sections.retention_deletion.title')}</h3>
              <div style={{ textAlign: 'left' }}>
                <h4 style={{ color: '#25D366', marginBottom: '15px', fontSize: '20px' }}>
                  {t('pages.cookies.sections.retention_deletion.retention_time.title')}
                </h4>
                <ul style={{ marginBottom: '20px', fontSize: '18px', lineHeight: '1.6' }}>
                  {t('pages.cookies.sections.retention_deletion.retention_time.items', { returnObjects: true }).map((item, index) => (
                    <li key={index} style={{ marginBottom: '12px' }}>
                      <strong>{item.split(':')[0]}:</strong> {item.split(':')[1]}
                    </li>
                  ))}
                </ul>

                <h4 style={{ color: '#DC2626', marginBottom: '15px', fontSize: '20px' }}>
                  {t('pages.cookies.sections.retention_deletion.how_to_delete.title')}
                </h4>
                <ul style={{ fontSize: '18px', lineHeight: '1.6' }}>
                  {t('pages.cookies.sections.retention_deletion.how_to_delete.items', { returnObjects: true }).map((item, index) => (
                    <li key={index} style={{ marginBottom: '12px' }}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Updates and contact */}
            <div className="feature-card">
              <div className="feature-icon-new gradient-bg rotate-right">
                <span className="feature-icon-large">📞</span>
              </div>
              <h3>{t('pages.cookies.sections.updates_contact.title')}</h3>
              <div style={{ textAlign: 'left' }}>
                <p style={{ marginBottom: '15px', fontSize: '18px', lineHeight: '1.6' }}>
                  {t('pages.cookies.sections.updates_contact.updates_description')}
                </p>
                <p style={{ fontSize: '18px', lineHeight: '1.6' }}>
                  {t('pages.cookies.sections.updates_contact.contact_description')}{' '}
                  <a href="/contact" className="privacy-link">{t('pages.cookies.sections.updates_contact.contact_link')}</a>.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Footer Notice */}
      <section className="process-section">
        <div className="process-container">
          <div className="feature-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="feature-icon-new gradient-bg rotate-left">
              <span className="feature-icon-large">🍪</span>
            </div>
            <h3 style={{ color: '#8A2BE2', marginBottom: '20px' }}>
              {t('pages.cookies.consent_section.title')}
            </h3>
            <p style={{ textAlign: 'center', fontSize: '18px', lineHeight: '1.6' }}>
              {t('pages.cookies.consent_section.description')}
            </p>
          </div>
        </div>
      </section>

      {/* Security Badge */}
      <section className="security-section">
        <div className="security-badge-modern">
          <span className="security-icon">🍪</span>
          <span className="security-text">{t('pages.cookies.security_badge')}</span>
          <span className="security-icon">✓</span>
        </div>
      </section>
    </div>
  );
};

export default PoliticaCookies; 