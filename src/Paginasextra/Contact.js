
import React, { useState } from 'react';
import './Pages.css';

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
    <div className="contact-page">
      <div className="contact-header">
        <h1>Contáctanos</h1>
        <p>¿Tienes alguna pregunta o sugerencia? Estamos aquí para ayudarte.</p>
      </div>

      <div className="contact-container">
        <div className="contact-info">
          <h2>Información de Contacto -Comartinvi</h2>
          <p>Email: maria@comartinvi.com</p>
          <p>Dirección: Avenida Roma 153, 08011 Barcelona, España</p>
        </div>

        <form onSubmit={handleSubmit} className="contact-form">
          <h2>Envíanos un Mensaje</h2>
          
          <div className="form-group">
            <label htmlFor="name">Nombre Completo</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Correo Electrónico</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="subject">Asunto</label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="message">Mensaje</label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
            ></textarea>
          </div>

          <button type="submit" className="submit-button">
            Enviar Mensaje
          </button>
        </form>
      </div>
    </div>
  );
};

export default Contact;