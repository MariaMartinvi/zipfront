
import React from 'react';

const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>Navegación</h3>
          <ul>
            <li><a href="/">Inicio</a></li>
            <li><a href="/faq">Preguntas Frecuentes</a></li>
            <li><a href="/contact">Contacto</a></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h3>Legal</h3>
          <ul>
            <li><a href="/terms">Términos de Servicio</a></li>
            <li><a href="/privacy">Política de Privacidad</a></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h3>Redes Sociales</h3>
          <div className="social-links">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">Facebook</a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">Twitter</a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">Instagram</a>
          </div>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Mis Análisis de WhatsApp. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
};

export default Footer;