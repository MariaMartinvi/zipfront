import React, { useState } from 'react';
import '../AppPreview.css';

const Contact = () => {
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
    alert('Mensaje enviado. Gracias por contactarnos!');
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
            <h1 className="hero-title">Contáctanos</h1>
            <p className="hero-description">
              ¿Tienes alguna pregunta o sugerencia? Estamos aquí para ayudarte.
            </p>
            <p className="hero-description">
              Nuestro equipo estará encantado de resolver todas tus dudas sobre ChatSalsa.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="features-section">
        <div className="features-container">
          <span className="features-badge">PONTE EN CONTACTO</span>
          <h2 className="features-title">Escríbenos</h2>
          <p className="features-description">
            Completa el formulario y nos pondremos en contacto contigo lo antes posible.
          </p>
          
          <div className="demo-content" style={{ marginTop: '60px' }}>
            {/* Contact Info */}
            <div className="demo-left">
              <div className="feature-card">
                <div className="feature-icon-new gradient-bg rotate-left">
                  <span className="feature-icon-large">📍</span>
                </div>
                <h3 style={{ color: '#8A2BE2', marginBottom: '25px' }}>Información de Contacto</h3>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ marginBottom: '25px', padding: '20px', background: '#f8f9fa', borderRadius: '12px' }}>
                    <h4 style={{ color: '#25D366', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span>📧</span> Email
                    </h4>
                    <p style={{ margin: '0', fontSize: '18px', fontWeight: '500' }}>maria@comartinvi.com</p>
                  </div>
                  
                  <div style={{ marginBottom: '25px', padding: '20px', background: '#f8f9fa', borderRadius: '12px' }}>
                    <h4 style={{ color: '#25D366', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span>🏢</span> Empresa
                    </h4>
                    <p style={{ margin: '0', fontSize: '18px', fontWeight: '500' }}>Comartinvi</p>
                  </div>
                  
                  <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '12px' }}>
                    <h4 style={{ color: '#25D366', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span>📍</span> Dirección
                    </h4>
                    <p style={{ margin: '0', fontSize: '18px', fontWeight: '500' }}>
                      Avenida Roma 153<br />
                      08011 Barcelona, España
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
                <h3 style={{ color: '#8A2BE2', marginBottom: '25px' }}>Envíanos un Mensaje</h3>
                
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
                      Nombre Completo
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
                      Correo Electrónico
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
                      Asunto
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
                      Mensaje
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
                    Enviar Mensaje
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
              <h3>Respuesta Rápida</h3>
              <p>Nos comprometemos a responder tu consulta en un plazo máximo de 24 horas.</p>
            </div>
            
            <div className="process-card">
              <div className="process-number">2</div>
              <div className="process-icon">
                <span style={{ fontSize: '3rem' }}>🤝</span>
              </div>
              <h3>Soporte Personalizado</h3>
              <p>Cada consulta recibe atención personalizada adaptada a tus necesidades específicas.</p>
            </div>
            
            <div className="process-card">
              <div className="process-number">3</div>
              <div className="process-icon">
                <span style={{ fontSize: '3rem' }}>🔒</span>
              </div>
              <h3>Privacidad Garantizada</h3>
              <p>Tu información personal y consultas son tratadas con total confidencialidad.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Security Badge */}
      
    </div>
  );
};

export default Contact;