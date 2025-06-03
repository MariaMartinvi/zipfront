import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import '../AppPreview.css';

const FAQItem = ({ question, answer, icon, isOpen, onClick }) => {
  return (
    <div className="feature-card" style={{ marginBottom: '20px' }}>
      <div 
        onClick={onClick}
        style={{ 
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          marginBottom: isOpen ? '20px' : '0',
          padding: '10px 0'
        }}
      >
        <div className={`feature-icon-new gradient-bg rotate-left`} style={{ width: '60px', height: '60px', flexShrink: 0 }}>
          <span className="feature-icon-large" style={{ fontSize: '24px' }}>{icon}</span>
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: '0', textAlign: 'left', fontSize: '20px', color: '#1a1a1a' }}>{question}</h3>
        </div>
        <div style={{ 
          fontSize: '24px', 
          color: '#8A2BE2', 
          fontWeight: 'bold',
          transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
          transition: 'transform 0.3s ease'
        }}>
          +
        </div>
      </div>
      {isOpen && (
        <div style={{ 
          textAlign: 'left', 
          paddingLeft: '80px',
          color: '#666',
          fontSize: '16px',
          lineHeight: '1.6',
          animation: 'fadeIn 0.3s ease'
        }}>
          {answer}
        </div>
      )}
    </div>
  );
};

const FAQ = () => {
  const { t } = useTranslation();
  const [openItems, setOpenItems] = useState({});

  const toggleItem = (index) => {
    setOpenItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Obtener las preguntas desde las traducciones
  const faqs = t('pages.faq.questions', { returnObjects: true }) || [];

  return (
    <div className="modern-preview-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content" style={{ gridTemplateColumns: '1fr', textAlign: 'center', gap: '40px' }}>
          <div className="hero-text">
            <h1 className="hero-title">{t('pages.faq.title')}</h1>
            <p className="hero-description">
              {t('pages.faq.subtitle')}
            </p>
            <p className="hero-description">
              {t('pages.faq.description')}
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="features-section">
        <div className="features-container">
          <span className="features-badge">{t('pages.faq.badge')}</span>
          <h2 className="features-title">{t('pages.faq.section_title')}</h2>
          <p className="features-description">
            {t('pages.faq.section_description')}
          </p>
          
          <div style={{ maxWidth: '900px', margin: '60px auto 0', textAlign: 'left' }}>
            {faqs.map((faq, index) => (
              <FAQItem 
                key={index} 
                question={faq.question} 
                answer={faq.answer}
                icon={faq.icon}
                isOpen={openItems[index]}
                onClick={() => toggleItem(index)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Additional Help Section */}
      <section className="process-section">
        <div className="process-container">
          <div className="feature-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="feature-icon-new gradient-bg rotate-right">
              <span className="feature-icon-large">🤝</span>
            </div>
            <h3 style={{ color: '#8A2BE2', marginBottom: '20px' }}>{t('pages.faq.help_section.title')}</h3>
            <p style={{ textAlign: 'center', fontSize: '18px', lineHeight: '1.6', marginBottom: '25px' }}>
              {t('pages.faq.help_section.description')}
            </p>
            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a 
                href="/contact" 
                className="process-cta-button"
                style={{ textDecoration: 'none', display: 'inline-block' }}
              >
                {t('pages.faq.help_section.contact_button')}
              </a>
              <a 
                href="/privacy" 
                className="btn-secondary"
                style={{ textDecoration: 'none', display: 'inline-block' }}
              >
                {t('pages.faq.help_section.privacy_button')}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats Section */}
      <section className="features-section" style={{ background: 'white' }}>
        <div className="features-container">
          <div className="process-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '30px' }}>
            <div className="feature-card" style={{ textAlign: 'center' }}>
              <div className="feature-icon-new gradient-bg rotate-left">
                <span className="feature-icon-large">⚡</span>
              </div>
              <h3 style={{ color: '#25D366' }}>{t('pages.faq.features.instant.title')}</h3>
              <p>{t('pages.faq.features.instant.description')}</p>
            </div>
            
            <div className="feature-card" style={{ textAlign: 'center' }}>
              <div className="feature-icon-new gradient-bg rotate-right">
                <span className="feature-icon-large">🔒</span>
              </div>
              <h3 style={{ color: '#8A2BE2' }}>{t('pages.faq.features.private.title')}</h3>
              <p>{t('pages.faq.features.private.description')}</p>
            </div>
            
            <div className="feature-card" style={{ textAlign: 'center' }}>
              <div className="feature-icon-new gradient-bg rotate-left">
                <span className="feature-icon-large">🎯</span>
              </div>
              <h3 style={{ color: '#E91E63' }}>{t('pages.faq.features.accurate.title')}</h3>
              <p>{t('pages.faq.features.accurate.description')}</p>
            </div>
            
            <div className="feature-card" style={{ textAlign: 'center' }}>
              <div className="feature-icon-new gradient-bg rotate-right">
                <span className="feature-icon-large">🌐</span>
              </div>
              <h3 style={{ color: '#FF9800' }}>{t('pages.faq.features.multiplatform.title')}</h3>
              <p>{t('pages.faq.features.multiplatform.description')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Security Badge */}
      <section className="security-section">
        <div className="security-badge-modern">
          <span className="security-icon">❓</span>
          <span className="security-text">{t('pages.faq.security_badge')}</span>
          <span className="security-icon">✓</span>
        </div>
      </section>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default FAQ;