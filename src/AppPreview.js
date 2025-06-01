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
          <span className="features-badge">CARACTERÍSTICAS</span>
          <h2 className="features-title">Descubre todo lo que WhatsAnalyzer puede hacer</h2>
          <p className="features-description">Nuestra plataforma combina análisis estadístico avanzado con inteligencia artificial para ofrecerte insights únicos sobre tus conversaciones.</p>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon-new gradient-bg rotate-left">
                <span className="feature-icon-large">🧠</span>
              </div>
              <h3>Análisis psicológico</h3>
              <p>Análisis psicológico detallado de los patrones de comunicación de cada miembro del grupo.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon-new gradient-bg rotate-right">
                <span className="feature-icon-large">📊</span>
              </div>
              <h3>Estadísticas detalladas</h3>
              <p>Estadísticas completas sobre quién domina las conversaciones, horarios activos y temas frecuentes.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon-new gradient-bg rotate-left">
                <span className="feature-icon-large">😀</span>
              </div>
              <h3>Análisis emocional</h3>
              <p>Interpretación emocional basada en el uso de emojis y lenguaje para entender el tono de las conversaciones.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon-new gradient-bg rotate-right">
                <span className="feature-icon-large">🎮</span>
              </div>
              <h3>Juegos divertidos</h3>
              <p>Juega al "¿Quién es quién?" con tu grupo de WhatsApp y descubre quién es quién basado en su estilo de comunicación.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon-new gradient-bg rotate-left">
                <span className="feature-icon-large">🔒</span>
              </div>
              <h3>100% Privado</h3>
              <p>El análisis estadístico se realiza en tu dispositivo y el chat no sale de tu dispositivo. Tu privacidad es nuestra prioridad.</p>
          </div>
          
            <div className="feature-card">
              <div className="feature-icon-new gradient-bg rotate-right">
                <span className="feature-icon-large">⚡</span>
              </div>
              <h3>Análisis instantáneo</h3>
              <p>Obtén resultados en segundos con nuestra IA avanzada, sin esperas ni procesos complicados.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="process-section">
        <div className="process-container">
          <span className="process-badge">PROCESO SIMPLE</span>
          <h2 className="process-title">¿Cómo funciona?</h2>
          <p className="process-description">En solo tres pasos podrás descubrir todos los secretos de tus conversaciones de WhatsApp.</p>
          
          <div className="process-grid">
            <div className="process-card">
              <div className="process-number">1</div>
              <div className="process-icon">
                <svg xmlns="http://www.w3.org/2000/svg" className="process-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                </svg>
              </div>
              <h3>Exporta tu chat</h3>
              <p>Exporta la conversación de WhatsApp que quieras analizar desde la app oficial.</p>
            </div>
            
            <div className="process-card">
              <div className="process-number">2</div>
              <div className="process-icon">
                <svg xmlns="http://www.w3.org/2000/svg" className="process-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
              <h3>Sube el archivo</h3>
              <p>Sube el archivo de chat a nuestra plataforma. Recuerda que el análisis se realiza en tu dispositivo.</p>
            </div>
            
            <div className="process-card">
              <div className="process-number">3</div>
              <div className="process-icon">
                <svg xmlns="http://www.w3.org/2000/svg" className="process-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
              </div>
              <h3>Descubre los resultados</h3>
              <p>Obtén al instante un análisis completo con estadísticas, perfiles psicológicos y juegos interactivos.</p>
            </div>
          </div>
          
          <div className="process-cta">
            <p className="process-cta-text">¿Listo para descubrir los secretos de tus conversaciones?</p>
            <button 
              className="process-cta-button"
              onClick={scrollToUpload}
            >
              Analizar mi chat ahora
            </button>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="demo-section">
        <div className="demo-container">
          <span className="demo-badge">DEMOSTRACIÓN</span>
          <h2 className="demo-title">Mira lo que WhatsAnalyzer puede hacer</h2>
          <p className="demo-description">Descubre el tipo de información que puedes obtener de tus conversaciones de WhatsApp.</p>
          
          <div className="demo-content">
            <div className="demo-left">
              <div className="demo-card">
                <h3>Estadísticas del grupo "Familia WhatsApp"</h3>
                
                <div className="stats-section">
                  <h4>Participación en el chat</h4>
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
                  <h4>Horarios activos</h4>
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

                <div className="emoji-section">
                  <h4>Emojis más usados</h4>
                  <div className="emoji-grid">
                    <div className="emoji-item">
                      <span className="emoji">😂</span>
                      <span className="emoji-percentage">22%</span>
                    </div>
                    <div className="emoji-item">
                      <span className="emoji">❤️</span>
                      <span className="emoji-percentage">19%</span>
                    </div>
                    <div className="emoji-item">
                      <span className="emoji">👍</span>
                      <span className="emoji-percentage">15%</span>
                    </div>
                    <div className="emoji-item">
                      <span className="emoji">🎉</span>
                      <span className="emoji-percentage">12%</span>
                    </div>
                    <div className="emoji-item">
                      <span className="emoji">😊</span>
                      <span className="emoji-percentage">9%</span>
                    </div>
                    <div className="emoji-item">
                      <span className="emoji">🤔</span>
                      <span className="emoji-percentage">7%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="demo-right">
              <div className="demo-card">
                <h3>Análisis psicológico</h3>
                <div className="psychology-list">
                  <div className="psychology-item">
                    <div className="avatar green-avatar">A</div>
                    <div className="psychology-content">
                      <h4>Ana</h4>
                      <p>Comunicativa y organizadora. Siempre está al tanto de todo lo que pasa en la familia.</p>
                      <div className="psychology-tags">
                        <span className="tag green">Comunicativa</span>
                        <span className="tag green">Organizadora</span>
                        <span className="tag green">Sociable</span>
                      </div>
                    </div>
                  </div>

                  <div className="psychology-item">
                    <div className="avatar purple-avatar">M</div>
                    <div className="psychology-content">
                      <h4>Miguel</h4>
                      <p>Reflexivo y cuidadoso. Prefiere mensajes directos y va al grano en sus conversaciones.</p>
                      <div className="psychology-tags">
                        <span className="tag purple">Reflexivo</span>
                        <span className="tag purple">Directo</span>
                        <span className="tag purple">Práctico</span>
                      </div>
                    </div>
                  </div>

                  <div className="psychology-item">
                    <div className="avatar pink-avatar">S</div>
                    <div className="psychology-content">
                      <h4>Sara</h4>
                      <p>Alegre y expresiva. Le encanta compartir momentos especiales y usar muchos emojis.</p>
                      <div className="psychology-tags">
                        <span className="tag pink">Alegre</span>
                        <span className="tag pink">Expresiva</span>
                        <span className="tag pink">Positiva</span>
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
              Ver análisis completo
            </button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="testimonials-container">
          <span className="testimonials-badge">TESTIMONIOS</span>
          <h2 className="testimonials-title">{t('preview.testimonials.title')}</h2>
          <p className="testimonials-description">Descubre cómo WhatsAnalyzer ha ayudado a personas de todo el mundo a entender mejor sus conversaciones.</p>
          
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