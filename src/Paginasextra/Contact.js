import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import '../AppPreview.css';

const Contact = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Implement actual form submission logic
    alert(t('contact_page.form.success_alert'));
    setFormData({
      name: '',
      email: '',
      subject: '',
      message: ''
    });
  };

  return (
    <div className="modern-preview-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content" style={{ gridTemplateColumns: '1fr', textAlign: 'center', gap: '40px' }}>
          <div className="hero-text">
            <h1 className="hero-title">{t('contact_page.hero.title')}</h1>
            <p className="hero-description">
              {t('contact_page.hero.description1')}
            </p>
            <p className="hero-description">
              {t('contact_page.hero.description2')}
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="features-section">
        <div className="features-container">
          <span className="features-badge">{t('contact_page.section.badge')}</span>
          <h2 className="features-title">{t('contact_page.section.title')}</h2>
          <p className="features-description">
            {t('contact_page.section.description')}
          </p>
          
          <div className="demo-content" style={{ marginTop: '60px' }}>
            {/* Contact Info */}
            <div className="demo-left">
              <div className="feature-card">
                <div className="feature-icon-new gradient-bg rotate-left">
                  <span className="feature-icon-large">📍</span>
                </div>
                <h3 style={{ color: '#8A2BE2', marginBottom: '25px' }}>{t('contact_page.info.title')}</h3>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ marginBottom: '25px', padding: '20px', background: '#f8f9fa', borderRadius: '12px' }}>
                    <h4 style={{ color: '#25D366', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span>📧</span> {t('contact_page.info.email_label')}
                    </h4>
                    <p style={{ margin: '0', fontSize: '18px', fontWeight: '500' }}>info@comartinvi.com</p>
                  </div>
                  
                  <div style={{ marginBottom: '25px', padding: '20px', background: '#f8f9fa', borderRadius: '12px' }}>
                    <h4 style={{ color: '#25D366', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span>🏢</span> {t('contact_page.info.company_label')}
                    </h4>
                    <p style={{ margin: '0', fontSize: '18px', fontWeight: '500' }}>Comartinvi</p>
                  </div>
                  
                  <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '12px' }}>
                    <h4 style={{ color: '#25D366', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span>📍</span> {t('contact_page.info.address_label')}
                    </h4>
                    <p style={{ margin: '0', fontSize: '18px', fontWeight: '500' }}>
                      {t('contact_page.info.address_line1')}<br />
                      {t('contact_page.info.address_line2')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="demo-right">
              <div className="feature-card">
                <div className="feature-icon-new gradient-bg rotate-right">
                  <span className="feature-icon-large">✉️</span>
                </div>
                <h3 style={{ color: '#8A2BE2', marginBottom: '25px' }}>{t('contact_page.form.title')}</h3>
                
                <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
                  <div style={{ marginBottom: '20px' }}>
                    <label 
                      htmlFor="name" 
                      style={{ 
                        display: 'block', 
                        marginBottom: '8px', 
                        color: '#1a1a1a', 
                        fontWeight: '600',
                        fontSize: '16px'
                      }}
                    >
                      {t('contact_page.form.name_label')}
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '12px',
                        fontSize: '16px',
                        transition: 'all 0.3s ease',
                        outline: 'none',
                        fontFamily: 'inherit'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#25D366';
                        e.target.style.boxShadow = '0 0 0 3px rgba(37, 211, 102, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#e5e7eb';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label 
                      htmlFor="email" 
                      style={{ 
                        display: 'block', 
                        marginBottom: '8px', 
                        color: '#1a1a1a', 
                        fontWeight: '600',
                        fontSize: '16px'
                      }}
                    >
                      {t('contact_page.form.email_label')}
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '12px',
                        fontSize: '16px',
                        transition: 'all 0.3s ease',
                        outline: 'none',
                        fontFamily: 'inherit'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#25D366';
                        e.target.style.boxShadow = '0 0 0 3px rgba(37, 211, 102, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#e5e7eb';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label 
                      htmlFor="subject" 
                      style={{ 
                        display: 'block', 
                        marginBottom: '8px', 
                        color: '#1a1a1a', 
                        fontWeight: '600',
                        fontSize: '16px'
                      }}
                    >
                      {t('contact_page.form.subject_label')}
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '12px',
                        fontSize: '16px',
                        transition: 'all 0.3s ease',
                        outline: 'none',
                        fontFamily: 'inherit'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#25D366';
                        e.target.style.boxShadow = '0 0 0 3px rgba(37, 211, 102, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#e5e7eb';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '30px' }}>
                    <label 
                      htmlFor="message" 
                      style={{ 
                        display: 'block', 
                        marginBottom: '8px', 
                        color: '#1a1a1a', 
                        fontWeight: '600',
                        fontSize: '16px'
                      }}
                    >
                      {t('contact_page.form.message_label')}
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows="5"
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '12px',
                        fontSize: '16px',
                        transition: 'all 0.3s ease',
                        outline: 'none',
                        fontFamily: 'inherit',
                        resize: 'vertical',
                        minHeight: '120px'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#25D366';
                        e.target.style.boxShadow = '0 0 0 3px rgba(37, 211, 102, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#e5e7eb';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="process-cta-button"
                    style={{ width: '100%', margin: '0' }}
                  >
                    {t('contact_page.form.submit_button')}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Additional Info Section */}
      <section className="process-section">
        <div className="process-container">
          <div className="process-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            <div className="process-card">
              <div className="process-number">1</div>
              <div className="process-icon">
                <span style={{ fontSize: '3rem' }}>⚡</span>
              </div>
              <h3>{t('contact_page.features.fast_response.title')}</h3>
              <p>{t('contact_page.features.fast_response.description')}</p>
            </div>
            
            <div className="process-card">
              <div className="process-number">2</div>
              <div className="process-icon">
                <span style={{ fontSize: '3rem' }}>🤝</span>
              </div>
              <h3>{t('contact_page.features.personalized_support.title')}</h3>
              <p>{t('contact_page.features.personalized_support.description')}</p>
            </div>
            
            <div className="process-card">
              <div className="process-number">3</div>
              <div className="process-icon">
                <span style={{ fontSize: '3rem' }}>🔒</span>
              </div>
              <h3>{t('contact_page.features.privacy_guaranteed.title')}</h3>
              <p>{t('contact_page.features.privacy_guaranteed.description')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Security Badge */}
      
    </div>
  );
};

export default Contact;