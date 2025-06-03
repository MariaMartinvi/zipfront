import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './AppPreview.css';
import HeroSection from './components/HeroSection';

const AppPreview = () => {
  const { t } = useTranslation();
  const [isModalVisible, setIsModalVisible] = useState(false);

  const toggleModal = () => {
    setIsModalVisible(!isModalVisible);
  };

  // Función para renderizar el título con el formato correcto
  const renderTitle = () => {
    const title = t('preview.title');
    const parts = title.split('WhatsApp');
    
    if (parts.length > 1) {
      return (
        <>
          {parts[0]}
          <span className="whatsapp-highlight">WhatsApp</span>
          {parts[1]}
        </>
      );
    }
    
    return title;
  };

  const scrollToUpload = () => {
    const uploadSection = document.querySelector('.upload-section');
    if (uploadSection) {
      uploadSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToProcess = () => {
    const processSection = document.querySelector('.process-section');
    if (processSection) {
      processSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="modern-preview-container">
      {/* Hero Section con el nuevo componente */}
      <HeroSection 
        onAnalyzeClick={scrollToUpload}
        onLearnMoreClick={scrollToProcess}
      />

      {/* Features Section */}
      <section className="features-section">
        <div className="features-container">
          <span className="features-badge">{t('features_page.badge').toUpperCase()}</span>
          <h2 className="features-title">{t('features_page.title')}</h2>
          <p className="features-description">{t('features_page.description')}</p>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon-new gradient-bg rotate-left">
                <span className="feature-icon-large">🧠</span>
              </div>
              <h3>{t('features_page.psychological.title')}</h3>
              <p>{t('features_page.psychological.description')}</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon-new gradient-bg rotate-right">
                <span className="feature-icon-large">📊</span>
              </div>
              <h3>{t('features_page.statistics.title')}</h3>
              <p>{t('features_page.statistics.description')}</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon-new gradient-bg rotate-left">
                <span className="feature-icon-large">😀</span>
              </div>
              <h3>{t('features_page.emotional.title')}</h3>
              <p>{t('features_page.emotional.description')}</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon-new gradient-bg rotate-right">
                <span className="feature-icon-large">🎮</span>
              </div>
              <h3>{t('features_page.games.title')}</h3>
              <p>{t('features_page.games.description')}</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon-new gradient-bg rotate-left">
                <span className="feature-icon-large">🔒</span>
              </div>
              <h3>{t('features_page.privacy.title')}</h3>
              <p>{t('features_page.privacy.description')} <a href="/privacy" className="privacy-link">{t('features_page.privacy.link')}</a></p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon-new gradient-bg rotate-right">
                <span className="feature-icon-large">⚡</span>
              </div>
              <h3>{t('features_page.instant.title')}</h3>
              <p>{t('features_page.instant.description')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="process-section">
        <div className="process-container">
          <span className="process-badge">{t('process.badge').toUpperCase()}</span>
          <h2 className="process-title">{t('process.title')}</h2>
          <p className="process-description">{t('process.description')}</p>
          
          <div className="process-grid">
            <div className="process-card">
              <div className="process-number">1</div>
              <div className="process-icon">
                <svg xmlns="http://www.w3.org/2000/svg" className="process-svg" fill="none" viewBox="0 0 24 24" stroke="#22c55e">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                </svg>
              </div>
              <h3>{t('process.steps.export.title')}</h3>
              <p>{t('process.steps.export.description')}</p>
            </div>
            
            <div className="process-card">
              <div className="process-number">2</div>
              <div className="process-icon">
                <svg xmlns="http://www.w3.org/2000/svg" className="process-svg" fill="none" viewBox="0 0 24 24" stroke="#a855f7">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
              <h3>{t('process.steps.upload.title')}</h3>
              <p>{t('process.steps.upload.description')}</p>
            </div>
            
            <div className="process-card">
              <div className="process-number">3</div>
              <div className="process-icon">
                <svg xmlns="http://www.w3.org/2000/svg" className="process-svg" fill="none" viewBox="0 0 24 24" stroke="#22c55e">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
              </div>
              <h3>{t('process.steps.discover.title')}</h3>
              <p>{t('process.steps.discover.description')}</p>
            </div>
          </div>
          
          <div className="process-cta">
            <p className="process-cta-text">{t('process.cta.text')}</p>
            <button 
              className="process-cta-button"
              onClick={scrollToUpload}
            >
              {t('process.cta.button')}
            </button>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="demo-section">
        <div className="demo-container">
          <span className="demo-badge">{t('demo.badge').toUpperCase()}</span>
          <h2 className="demo-title">{t('demo.title')}</h2>
          <p className="demo-description">{t('demo.description')}</p>
          
          <div className="demo-content">
            <div className="demo-left">
              <div className="demo-card">
                <h3>{t('demo.stats.title')}</h3>
                
                <div className="stats-section">
                  <h4>{t('demo.stats.participation')}</h4>
                  <div className="participation-list">
                    <div className="participation-item">
                      <span className="participant-name">Ana</span>
                      <div className="progress-bar">
                        <div className="progress-fill green" style={{width: '45%'}}></div>
                      </div>
                      <span className="percentage">45%</span>
                    </div>
                    <div className="participation-item">
                      <span className="participant-name">Miguel</span>
                      <div className="progress-bar">
                        <div className="progress-fill purple" style={{width: '28%'}}></div>
                      </div>
                      <span className="percentage">28%</span>
                    </div>
                    <div className="participation-item">
                      <span className="participant-name">Sara</span>
                      <div className="progress-bar">
                        <div className="progress-fill green" style={{width: '20%'}}></div>
                      </div>
                      <span className="percentage">20%</span>
                    </div>
                    <div className="participation-item">
                      <span className="participant-name">Pedro</span>
                      <div className="progress-bar">
                        <div className="progress-fill purple" style={{width: '7%'}}></div>
                      </div>
                      <span className="percentage">7%</span>
                    </div>
                  </div>
                </div>

                <div className="stats-section">
                  <h4>{t('demo.stats.active_hours')}</h4>
                  <div className="time-chart">
                    <div className="time-slot">
                      <div className="time-bar" style={{height: '15%'}}></div>
                      <span className="time-label">00-04</span>
                    </div>
                    <div className="time-slot">
                      <div className="time-bar" style={{height: '25%'}}></div>
                      <span className="time-label">04-08</span>
                    </div>
                    <div className="time-slot">
                      <div className="time-bar" style={{height: '70%'}}></div>
                      <span className="time-label">08-12</span>
                    </div>
                    <div className="time-slot">
                      <div className="time-bar" style={{height: '85%'}}></div>
                      <span className="time-label">12-16</span>
                    </div>
                    <div className="time-slot">
                      <div className="time-bar" style={{height: '100%'}}></div>
                      <span className="time-label">16-20</span>
                    </div>
                    <div className="time-slot">
                      <div className="time-bar" style={{height: '60%'}}></div>
                      <span className="time-label">20-24</span>
                    </div>
                  </div>
                </div>

                <div className="profiles-section">
                  <h4>{t('demo.stats.profiles')}</h4>
                  <div className="profiles-grid">
                    <div className="profile-item">
                      <span className="profile-emoji">🤡</span>
                      <div className="profile-info">
                        <span className="profile-name">{t('app.top_profiles.comico.title')}</span>
                        <span className="profile-user">{t('demo.users.eva')}</span>
                      </div>
                    </div>
                    <div className="profile-item">
                      <span className="profile-emoji">❤️</span>
                      <div className="profile-info">
                        <span className="profile-name">{t('app.top_profiles.amoroso.title')}</span>
                        <span className="profile-user">{t('demo.users.eva')}</span>
                      </div>
                    </div>
                    <div className="profile-item">
                      <span className="profile-emoji">🤳</span>
                      <div className="profile-info">
                        <span className="profile-name">{t('app.top_profiles.narcissist.title')}</span>
                        <span className="profile-user">{t('demo.users.miguel')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="demo-right">
              <div className="demo-card">
                <h3>{t('demo.psychology.title')}</h3>
                <div className="psychology-list">
                  <div className="psychology-item">
                    <div className="avatar green-avatar">A</div>
                    <div className="psychology-content">
                      <h4>{t('demo.users.ana')}</h4>
                      <p>{t('demo.user_profiles.ana.description')}</p>
                      <div className="psychology-tags">
                        {t('demo.user_profiles.ana.traits', { returnObjects: true }).map((trait, index) => (
                          <span key={index} className="tag green">{trait}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="psychology-item">
                    <div className="avatar purple-avatar">M</div>
                    <div className="psychology-content">
                      <h4>{t('demo.users.miguel')}</h4>
                      <p>{t('demo.user_profiles.miguel.description')}</p>
                      <div className="psychology-tags">
                        {t('demo.user_profiles.miguel.traits', { returnObjects: true }).map((trait, index) => (
                          <span key={index} className="tag purple">{trait}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="red-flags-section">
                  <h4>{t('demo.red_flags.title')}</h4>
                  <div className="red-flags-list">
                    <div className="red-flag-item">
                      <div className="avatar red-avatar">⚠️</div>
                      <div className="red-flag-content">
                        <h4>{t('demo.red_flags.items.passive_aggressive.title')}</h4>
                        <p>{t('demo.red_flags.items.passive_aggressive.description')}</p>
                        <div className="red-flag-tags">
                          {t('demo.red_flags.items.passive_aggressive.tags', { returnObjects: true }).map((tag, index) => (
                            <span key={index} className="tag red">{tag}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="demo-cta">
            <button 
              className="demo-cta-button"
              onClick={scrollToUpload}
            >
              {t('hero.mockup.view_analysis')}
            </button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="testimonials-container">
          <span className="testimonials-badge">{t('preview.testimonials.badge').toUpperCase()}</span>
          <h2 className="testimonials-title">{t('preview.testimonials.title')}</h2>
          <p className="testimonials-description">{t('preview.testimonials.description')}</p>
          
          <div className="testimonials-grid">
            {t('preview.testimonials.reviews', { returnObjects: true }).map((review, index) => (
              <div key={index} className="testimonial-card">
                <div className="testimonial-quote">
                  <span className="quote-icon">"</span>
                  <p>{review.content}</p>
                </div>
                <div className="testimonial-author">
                  <div className="author-avatar">
                    {review.author.charAt(0).toUpperCase()}
                  </div>
                  <div className="author-info">
                    <span className="author-name">{review.author}</span>
                  </div>
                </div>
                <div className="testimonial-rating">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="star">★</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Badge */}
      <section className="security-section">
        <div className="security-badge-modern">
          <span className="security-icon">🔒</span>
          <span className="security-text">{t('preview.security.badge')}</span>
          <span className="security-icon">✓</span>
        </div>
      </section>
      
      {/* Modal for image expansion */}
      {isModalVisible && (
        <div className="imagen-modal" onClick={toggleModal}>
          <div className="imagen-modal-contenido" onClick={(e) => e.stopPropagation()}>
            <img src="/ejemplo.png" alt={t('preview.image.modal_alt')} />
            <button className="cerrar-modal" onClick={toggleModal}>×</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppPreview; 