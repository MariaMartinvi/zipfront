import React, { useState } from 'react';
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
  const [openItems, setOpenItems] = useState({});

  const toggleItem = (index) => {
    setOpenItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const faqs = [
    {
      question: "¿Cómo funciona el análisis de conversaciones de WhatsApp?",
      answer: "Nuestro servicio analiza tus chats de WhatsApp después de exportarlos como archivo ZIP. Utilizamos técnicas avanzadas de análisis de datos y IA para proporcionarte insights detallados sobre tus conversaciones, incluyendo patrones de comunicación, análisis psicológico y estadísticas detalladas.",
      icon: "🔍"
    },
    {
      question: "¿Es seguro subir mis chats?",
      answer: "Sí, la privacidad es nuestra prioridad. Tus archivos se eliminan automáticamente después del análisis, y no guardamos ningún contenido de tus conversaciones. Además, ofrecemos la opción de omitir el análisis psicológico por IA si lo prefieres. Nuestro proceso cumple con los más altos estándares de seguridad de datos.",
      icon: "🔒"
    },
    {
      question: "¿Qué tipo de análisis ofrece la plataforma?",
      answer: "Ofrecemos un análisis completo que incluye: estadísticas detalladas de conversación, patrones de comunicación, análisis de horarios y actividad, uso de emojis y palabras más frecuentes, análisis de conversaciones iniciadas y terminadas, y un análisis psicológico opcional generado por IA. Todos los análisis se presentan de forma visual e interactiva.",
      icon: "📊"
    },
    {
      question: "¿Cómo puedo exportar mis chats de WhatsApp?",
      answer: "En WhatsApp, ve a un chat, selecciona 'Exportar chat' y guarda como archivo ZIP sin multimedia. La plataforma acepta archivos ZIP de WhatsApp tanto de Android como de iOS, y detecta automáticamente el formato. Puedes subir el archivo directamente en nuestra plataforma.",
      icon: "📱"
    },
    {
      question: "¿Cuánto cuesta el servicio?",
      answer: "Ofrecemos diferentes planes: un plan gratuito con análisis básicos y planes premium con análisis más detallados, mayor frecuencia de uso y características avanzadas. Todos los planes incluyen la opción de omitir el análisis psicológico por IA si lo prefieres.",
      icon: "💰"
    },
    {
      question: "¿Puedo usar el servicio en cualquier dispositivo?",
      answer: "Sí, nuestra plataforma es completamente web y responsive. Puedes acceder desde cualquier dispositivo (computadoras, tablets y teléfonos móviles) y los análisis se adaptan automáticamente a tu pantalla. Además, puedes compartir los resultados fácilmente con otros.",
      icon: "📱"
    }
  ];

  return (
    <div className="modern-preview-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content" style={{ gridTemplateColumns: '1fr', textAlign: 'center', gap: '40px' }}>
          <div className="hero-text">
            <h1 className="hero-title">Preguntas Frecuentes</h1>
            <p className="hero-description">
              Encuentra respuestas a las consultas más comunes sobre nuestro servicio.
            </p>
            <p className="hero-description">
              Todo lo que necesitas saber sobre ChatSalsa está aquí. Si no encuentras tu respuesta, ¡contáctanos!
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="features-section">
        <div className="features-container">
          <span className="features-badge">PREGUNTAS FRECUENTES</span>
          <h2 className="features-title">¿Tienes dudas?</h2>
          <p className="features-description">
            Aquí encontrarás las respuestas a las preguntas más comunes sobre ChatSalsa. 
            Haz clic en cualquier pregunta para ver la respuesta completa.
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
            <h3 style={{ color: '#8A2BE2', marginBottom: '20px' }}>¿No encuentras tu respuesta?</h3>
            <p style={{ textAlign: 'center', fontSize: '18px', lineHeight: '1.6', marginBottom: '25px' }}>
              Si tienes una pregunta que no está en esta lista, no dudes en contactarnos. 
              Nuestro equipo estará encantado de ayudarte.
            </p>
            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a 
                href="/contact" 
                className="process-cta-button"
                style={{ textDecoration: 'none', display: 'inline-block' }}
              >
                Contactar Soporte
              </a>
              <a 
                href="/privacy" 
                className="btn-secondary"
                style={{ textDecoration: 'none', display: 'inline-block' }}
              >
                Ver Política de Privacidad
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
              <h3 style={{ color: '#25D366' }}>Análisis Instantáneo</h3>
              <p>Resultados en segundos, no en horas</p>
            </div>
            
            <div className="feature-card" style={{ textAlign: 'center' }}>
              <div className="feature-icon-new gradient-bg rotate-right">
                <span className="feature-icon-large">🔒</span>
              </div>
              <h3 style={{ color: '#8A2BE2' }}>100% Privado</h3>
              <p>Tus datos nunca salen de tu dispositivo</p>
            </div>
            
            <div className="feature-card" style={{ textAlign: 'center' }}>
              <div className="feature-icon-new gradient-bg rotate-left">
                <span className="feature-icon-large">🎯</span>
              </div>
              <h3 style={{ color: '#E91E63' }}>Análisis Preciso</h3>
              <p>IA avanzada para insights detallados</p>
            </div>
            
            <div className="feature-card" style={{ textAlign: 'center' }}>
              <div className="feature-icon-new gradient-bg rotate-right">
                <span className="feature-icon-large">🌐</span>
              </div>
              <h3 style={{ color: '#FF9800' }}>Multiplataforma</h3>
              <p>Funciona en todos los dispositivos</p>
            </div>
          </div>
        </div>
      </section>

      {/* Security Badge */}
      <section className="security-section">
        <div className="security-badge-modern">
          <span className="security-icon">❓</span>
          <span className="security-text">Dudas Resueltas</span>
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