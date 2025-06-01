// Header.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { logoutUser } from './firebase_auth';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import './Header.css';

const Header = ({ user }) => {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const handleLogout = async () => {
    try {
      await logoutUser();
      window.location.href = '/';
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Función para hacer scroll a la sección de carga
  const scrollToUploadSection = (e) => {
    e.preventDefault();
    const uploadSection = document.getElementById('upload-section');
    if (uploadSection) {
      uploadSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="app-header">
      <div className="header-container">
        <Link to="/" className="logo">
          <div className="logo-container">
            <div className="logo-icon">
              <svg className="logo-svg" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" rx="8" fill="url(#gradient)" />
                {/* Círculo principal de WhatsApp */}
                <circle cx="16" cy="15" r="8" fill="white"/>
                {/* Burbuja de mensaje */}
                <path d="M16 9C12.69 9 10 11.69 10 15C10 16.15 10.37 17.21 11 18.07L10 22L14.08 21.03C14.86 21.57 15.79 21.88 16.8 21.88C20.11 21.88 22.8 19.19 22.8 15.88C22.8 12.57 20.11 9.88 16.8 9.88L16 9ZM16 11C19.03 11 21.5 13.47 21.5 16.5C21.5 19.53 19.03 22 16 22C15.08 22 14.22 21.76 13.47 21.34L11.5 21.83L12.03 19.97C11.38 19.13 11 18.07 11 17C11 13.97 13.47 11.5 16.5 11.5L16 11Z" fill="url(#gradient)"/>
                <defs>
                  <linearGradient id="gradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#25D366"/>
                    <stop offset="1" stopColor="#8A2BE2"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span className="logo-chatsalsa">ChatSalsa</span>
          </div>
        </Link>
        
        <div className="nav-container">
          {/* Desktop Navigation */}
          <nav className="desktop-nav">
            <Link to="/" className="nav-link">{t('header.home')}</Link>
            {user ? (
              <>
                <Link to="/" className="nav-link" onClick={scrollToUploadSection}>
                  <span role="img" aria-label="Upload">📤</span> {t('actions.upload')}
                </Link>
                <Link to="/plans" className="nav-link">{t('header.pricing')}</Link>
                <LanguageSwitcher />
                <div className="user-menu">
                  <button 
                    className="user-button"
                    onClick={toggleMenu}
                  >
                    {user.displayName || user.email}
                  </button>
                  {isMenuOpen && (
                    <div className="dropdown-menu">
                      <button 
                        className="menu-item"
                        onClick={handleLogout}
                      >
                        {t('header.logout', 'Cerrar Sesión')}
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-link">{t('header.login')}</Link>
                <Link to="/register" className="nav-link sign-up">Prueba gratis</Link>
                <LanguageSwitcher />
              </>
            )}
          </nav>
          
          {/* Mobile Navigation */}
          <button 
            className="mobile-menu-button"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            <span className="menu-icon">☰</span>
          </button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="mobile-menu">
          <Link to="/" className="mobile-nav-link" onClick={toggleMenu}>{t('header.home')}</Link>
          {user ? (
            <>
              <Link to="/" className="mobile-nav-link" onClick={scrollToUploadSection}>
                <span role="img" aria-label="Upload">📤</span> {t('actions.upload')}
              </Link>
              <Link to="/plans" className="mobile-nav-link" onClick={toggleMenu}>{t('header.pricing')}</Link>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                  className="mobile-nav-link mobile-logout"
                  onClick={handleLogout}
                >
                  {t('header.logout', 'Cerrar Sesión')}
                </button>
              </div>
              <LanguageSwitcher />
            </>
          ) : (
            <>
              <Link to="/login" className="mobile-nav-link" onClick={toggleMenu}>{t('header.login')}</Link>
              <Link to="/register" className="mobile-nav-link" onClick={toggleMenu}>Prueba gratis</Link>
              <LanguageSwitcher />
            </>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;