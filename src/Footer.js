
import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <div className="footer-container">
        <div className="footer-columns">
          <div className="footer-column">
            <h4>Producto</h4>
            <Link to="/" className="footer-link">Inicio</Link>
            <Link to="/plans" className="footer-link">Planes</Link>
          </div>
          <div className="footer-column">
            <h4>Soporte</h4>
            <a href="mailto:soporte@analizadordechats.com" className="footer-link">Contacto</a>
            <Link to="/faq" className="footer-link">Preguntas Frecuentes</Link>
          </div>
          <div className="footer-column">
            <h4>Legal</h4>
            <Link to="/terminos" className="footer-link">Términos de Servicio</Link>
            <Link to="/privacidad" className="footer-link">Política de Privacidad</Link>
          </div>
          <div className="footer-column">
            <h4>Redes Sociales</h4>
            <div className="social-links">
              <a href="#" className="social-link">Instagram</a>
              <a href="#" className="social-link">Twitter</a>
              <a href="#" className="social-link">LinkedIn</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {currentYear} Analizador de Conversaciones. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;