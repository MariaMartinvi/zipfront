import React, { useState, useEffect } from 'react';
import './AppPreview.css';

const AppPreview = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const toggleModal = () => {
    setIsModalVisible(!isModalVisible);
  };

  return (
    <div className="app-preview-container">
      <div className="app-preview-content">
        <div className="app-preview-text">
          <h2>Descubre los secretos de tus conversaciones</h2>
          <p>
            Combinamos la estadística y la  <strong>Inteligencia Artificial avanzada de Mistral</strong> (desarrollada en la UE) 
            para revelarte datos fascinantes sobre los  perfiles psicológicos de los participantes y las dinámicas de grupo.
          </p>
          
          <div className="security-badge">
            <span className="security-icon">🔒</span>
            <span className="security-text">100% privado y seguro</span>
          </div>
          
          <ul className="app-preview-features">
            <li>
              <span className="feature-icon">🧠</span>
              <span><strong>Análisis psicológico</strong> de los patrones de comunicación.</span>
            </li>
            <li>
              <span className="feature-icon">📊</span>
              <span>Estadísticas detalladas sobre quién domina las conversaciones.</span>
            </li>
            <li>
              <span className="feature-icon">😀</span>
              <span>Interpretación emocional basada en el uso de emojis y lenguaje.</span>
            </li>
            <li>
              <span className="feature-icon">🔍</span>
              <span>Descubre personalidades ocultas y dinámicas de grupo.</span>
            </li>
          </ul>
          
          <div className="privacy-container">
            <div className="privacy-item">
              <span className="privacy-icon">⚡</span>
              <span>Los chats se analizan al momento y se eliminan inmediatamente</span>
            </div>
            
           
            <div className="privacy-item">
              <span className="privacy-icon">🔐</span>
              <span>Los datos no se almacenan ni se usan para entrenar IA</span>
            </div>
          </div>
          
          <div className="cta-container">
            <button 
              className="cta-button"
              onClick={() => window.location.href = '/register'}
            >
              ¡Descubre la psicología de tu chat!
            </button>
          </div>
        </div>
        <div className="app-preview-image">
          <img src="/ejemplo.png" alt="Ejemplo de análisis de chat" />
          <div className="image-overlay">
            <span className="image-caption">¡Así lucirá tu análisis!</span>
          </div>
          
          {/* Indicador adicional de que hay más contenido */}
          <div className="image-more-indicator">
            <span>Ver análisis completo</span>
            <div className="more-arrow">↓</div>
          </div>
          
          <button 
            className="expand-button" 
            onClick={toggleModal}
            aria-label="Ver imagen completa"
          >
            <span className="expand-icon">+</span>
            <span className="expand-text">Ver completo</span>
          </button>
        </div>
      </div>
      
      {isModalVisible && (
        <div className="imagen-modal" onClick={toggleModal}>
          <div className="imagen-modal-contenido" onClick={(e) => e.stopPropagation()}>
            <img src="/ejemplo.png" alt="Ejemplo completo de análisis" />
            <button className="cerrar-modal" onClick={toggleModal}>×</button>
          </div>
        </div>
      )}
      
      <div className="app-preview-testimonials">
        <h3>Lo que dicen nuestros usuarios</h3>
        <div className="testimonials-container">
          <div className="testimonial">
            <div className="testimonial-content">
              "¡Increíble! El análisis psicológico me permitió entender mejor a mis amigos y por qué respondemos como lo hacemos."
            </div>
            <div className="testimonial-author">Carlos P.</div>
          </div>
          <div className="testimonial">
            <div className="testimonial-content">
              "Me sorprendió descubrir los patrones emocionales en nuestro grupo familiar. La IA detectó tensiones que ni siquiera habíamos notado."
            </div>
            <div className="testimonial-author">Ana M.</div>
          </div>
          <div className="testimonial">
            <div className="testimonial-content">
              "Tranquilidad total sabiendo que mis datos están seguros y se eliminan automáticamente. El análisis psicológico fue fascinante."
            </div>
            <div className="testimonial-author">Laura T.</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppPreview; 