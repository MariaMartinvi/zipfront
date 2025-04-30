import React from 'react';
import './Footer.css';
import { FaHome, FaQuestionCircle, FaEnvelope, FaFileContract, FaShieldAlt, FaFacebook, FaTwitter, FaInstagram, FaWhatsapp, FaArrowUp } from 'react-icons/fa';

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-grid">
          <div className="footer-section">
            <h3>Navegación</h3>
            <div className="footer-links">
              <a href="/" className="footer-link">
                <FaHome className="footer-icon" />
                <span>Inicio</span>
              </a>
              <a href="/faq" className="footer-link">
                <FaQuestionCircle className="footer-icon" />
                <span>Preguntas Frecuentes</span>
              </a>
              <a href="/contact" className="footer-link">
                <FaEnvelope className="footer-icon" />
                <span>Contacto</span>
              </a>
            </div>
          </div>
          
          <div className="footer-section">
            <h3>Legal</h3>
            <div className="footer-links">
              <a href="/terms" className="footer-link">
                <FaFileContract className="footer-icon" />
                <span>Términos de Servicio</span>
              </a>
              <a href="/privacy" className="footer-link">
                <FaShieldAlt className="footer-icon" />
                <span>Política de Privacidad</span>
              </a>
            </div>
          </div>
          
         {/*   <div className="footer-section">
            <h3>Redes Sociales</h3>
            <div className="social-grid">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="social-link">
                <FaFacebook className="social-icon" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="social-link">
                <FaTwitter className="social-icon" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="social-link">
                <FaInstagram className="social-icon" />
              </a>
              <a href="https://wa.me/1234567890" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="social-link">
                <FaWhatsapp className="social-icon" />
              </a>
            </div>
          </div>*/}
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Mis Análisis de WhatsApp. Todos los derechos reservados.</p>
        <button className="scroll-top" onClick={scrollToTop} aria-label="Volver arriba">
          <FaArrowUp />
        </button>
      </div>
    </footer>
  );
};

export default Footer;