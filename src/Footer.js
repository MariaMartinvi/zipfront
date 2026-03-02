import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';
import { useTranslation } from 'react-i18next';
import { FaArrowUp, FaAndroid } from 'react-icons/fa';

const Footer = () => {
  const { t } = useTranslation();
  
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
            <h3>{t('footer.navigation', 'Navegación')}</h3>
            <div className="footer-links">
              <Link to="/" className="footer-link">
                <span>{t('header.home')}</span>
              </Link>
              <Link to="/blog" className="footer-link">
                <span>{t('footer.blog', 'Blog')}</span>
              </Link>
              <Link to="/faq" className="footer-link">
                <span>{t('footer.faq')}</span>
              </Link>
              <Link to="/contact" className="footer-link">
                <span>{t('footer.contact')}</span>
              </Link>
            </div>
          </div>
          
          <div className="footer-section">
            <h3>{t('footer.legal')}</h3>
            <div className="footer-links">
              <a href="/terms" className="footer-link">
                <span>{t('footer.terms')}</span>
              </a>
              <a href="/privacy" className="footer-link">
                <span>{t('footer.privacy')}</span>
              </a>
              <a href="/politica-cookies" className="footer-link">
                <span>{t('footer.cookies')}</span>
              </a>
            </div>
          </div>
          
          <div className="footer-section">
            <h3>{t('footer.download_section', 'Descargas')}</h3>
            <div className="footer-links">
              <a 
                href="https://play.google.com/store/apps/details?id=com.chatsalsa.app" 
                className="footer-link"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t('footer.download_android', 'Descargar para Android')}
              >
                <FaAndroid className="footer-icon" />
                <span>{t('footer.android_app', 'App Android')}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} {t('footer.rights', 'Analizador de Chats - Todos los derechos reservados')}</p>
        <button 
          className="scroll-top" 
          onClick={scrollToTop} 
          aria-label={t('footer.scroll_top', 'Volver arriba')}
        >
          <FaArrowUp />
        </button>
      </div>
    </footer>
  );
};

export default Footer;