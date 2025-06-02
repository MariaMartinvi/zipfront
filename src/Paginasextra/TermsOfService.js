import React from 'react';
import '../AppPreview.css';

const TermsOfService = () => {
  const sections = [
    {
      title: "1. Aceptación de Términos",
      icon: "✅",
      content: "Al acceder y utilizar nuestro servicio de análisis de conversaciones de WhatsApp, aceptas estos términos de servicio en su totalidad. Si no estás de acuerdo con alguno de estos términos, no debes utilizar nuestro servicio."
    },
    {
      title: "2. Descripción del Servicio",
      icon: "🔍",
      content: "Proporcionamos una plataforma web que permite a los usuarios cargar y analizar conversaciones de WhatsApp exportadas como archivos ZIP, ofreciendo diversos insights y análisis estadísticos y de IA."
    },
    {
      title: "3. Uso del Servicio",
      icon: "👤",
      content: "",
      items: [
        "Debes tener al menos 18 años para usar nuestro servicio.",
        "Eres responsable de mantener la confidencialidad de tu cuenta.",
        "Te comprometes a no utilizar el servicio para actividades ilegales o no autorizadas."
      ]
    },
    {
      title: "4. Privacidad y Datos",
      icon: "🔒",
      content: "Nos comprometemos a proteger tu privacidad. Los archivos que subes son procesados temporalmente y eliminados automáticamente después del análisis. Consulta nuestra Política de Privacidad para más detalles."
    },
    {
      title: "5. Derechos de Propiedad Intelectual",
      icon: "©️",
      content: "Todo el contenido, características y funcionalidad de nuestro servicio son propiedad nuestra y están protegidos por derechos de autor, marcas registradas y otras leyes de propiedad intelectual."
    },
    {
      title: "6. Limitación de Responsabilidad",
      icon: "⚠️",
      content: "Nuestro servicio se proporciona \"tal cual\", sin garantías de ningún tipo. No nos hacemos responsables de ningún daño directo, indirecto, incidental o consecuencial derivado del uso de nuestro servicio."
    },
    {
      title: "7. Modificaciones del Servicio",
      icon: "🔄",
      content: "Nos reservamos el derecho de modificar o interrumpir el servicio en cualquier momento, con o sin previo aviso. No seremos responsables ante ti o cualquier tercero por cualquier modificación, suspensión o interrupción del servicio."
    },
    {
      title: "8. Planes y Suscripciones",
      icon: "💳",
      content: "Ofrecemos planes gratuitos y de pago. Los términos específicos de cada plan, incluyendo precios, características y límites de uso, se detallan en nuestra página de planes."
    },
    {
      title: "9. Terminación",
      icon: "🚪",
      content: "Podemos terminar o suspender tu cuenta y acceso al servicio inmediatamente, sin previo aviso ni responsabilidad, por cualquier razón, incluido el incumplimiento de estos términos."
    },
    {
      title: "10. Ley Aplicable",
      icon: "⚖️",
      content: "Estos términos se regirán e interpretarán de acuerdo con las leyes de España, sin consideración a sus principios de conflicto de leyes."
    },
    {
      title: "11. Contacto",
      icon: "📧",
      content: "Si tienes alguna pregunta sobre estos términos, por favor contáctanos."
    }
  ];

  return (
    <div className="modern-preview-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content" style={{ gridTemplateColumns: '1fr', textAlign: 'center', gap: '40px' }}>
          <div className="hero-text">
            <h1 className="hero-title">Términos de Servicio</h1>
            <p className="hero-description">Última actualización: Abril 2024</p>
            <p className="hero-description">
              Estos términos establecen las condiciones bajo las cuales puedes utilizar nuestro servicio de análisis de conversaciones de WhatsApp.
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="features-section">
        <div className="features-container">
          <span className="features-badge">TÉRMINOS Y CONDICIONES</span>
          <h2 className="features-title">Condiciones de Uso</h2>
          <p className="features-description">
            Lee atentamente estos términos antes de utilizar nuestro servicio. Al usar ChatSalsa, aceptas estar sujeto a estos términos.
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
            <h3 style={{ color: '#8A2BE2', marginBottom: '20px' }}>Aviso Importante</h3>
            <p style={{ textAlign: 'center', fontSize: '18px', lineHeight: '1.6' }}>
              Al continuar usando nuestro servicio, aceptas estos términos de servicio. 
              Si tienes alguna pregunta, no dudes en <a href="/contact" className="privacy-link">contactarnos</a>.
            </p>
          </div>
        </div>
      </section>

      {/* Security Badge */}
      <section className="security-section">
        <div className="security-badge-modern">
          <span className="security-icon">📋</span>
          <span className="security-text">Términos Actualizados</span>
          <span className="security-icon">✓</span>
        </div>
      </section>
    </div>
  );
};

export default TermsOfService;