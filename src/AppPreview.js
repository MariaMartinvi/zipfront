import React from 'react';
import './AppPreview.css';

const AppPreview = () => {
  return (
    <div className="app-preview-container">
      <div className="app-preview-content">
        <div className="app-preview-text">
          <h2>Descubre los secretos de tus conversaciones</h2>
          <p>
            ChatSalsa analiza tus conversaciones de WhatsApp para revelarte datos fascinantes sobre quién habla más, 
            quién usa más emojis, y mucho más.
          </p>
          <ul className="app-preview-features">
            <li>
              <span className="feature-icon">📊</span>
              <span>Descubre quién domina las conversaciones</span>
            </li>
            <li>
              <span className="feature-icon">😀</span>
              <span>Analiza el uso de emojis y expresiones</span>
            </li>
            <li>
              <span className="feature-icon">⏰</span>
              <span>Conoce los horarios más activos del chat</span>
            </li>
            <li>
              <span className="feature-icon">🔍</span>
              <span>Identifica patrones y tendencias únicas</span>
            </li>
          </ul>
          <div className="cta-container">
            <button 
              className="cta-button"
              onClick={() => window.location.href = '/register'}
            >
              ¡Regístrate y analiza tu chat!
            </button>
          </div>
        </div>
        <div className="app-preview-image">
          <img src="/ejemplo.png" alt="Ejemplo de análisis de chat" />
          <div className="image-overlay">
            <span className="image-caption">¡Así lucirá tu análisis!</span>
          </div>
        </div>
      </div>
      <div className="app-preview-testimonials">
        <h3>Lo que dicen nuestros usuarios</h3>
        <div className="testimonials-container">
          <div className="testimonial">
            <div className="testimonial-content">
              "¡Increíble! Descubrí que soy quien más habla en mi grupo familiar. ¡Ahora todos me llaman el parlanchín oficial!"
            </div>
            <div className="testimonial-author">Carlos P.</div>
          </div>
          <div className="testimonial">
            <div className="testimonial-content">
              "Me encantó descubrir quiénes son los nocturnos del grupo. Resultó que todos escribimos más después de medianoche."
            </div>
            <div className="testimonial-author">Ana M.</div>
          </div>
          <div className="testimonial">
            <div className="testimonial-content">
              "Ya no discutimos sobre quién responde más tarde. ¡Los datos no mienten! ChatSalsa resolvió nuestras dudas."
            </div>
            <div className="testimonial-author">Laura T.</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppPreview; 