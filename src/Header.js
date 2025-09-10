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

  return (
    <header className="app-header">
      <div className="header-container">
        <Link to="/" className="logo">
          <div className="logo-container">
            <div className="logo-icon">
              <svg xmlns="http://www.w3.org/2000/svg" className="logo-clipboard-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
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
                <Link to="/register" className="nav-link sign-up">{t('header.free_trial')}</Link>
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
              <Link to="/register" className="mobile-nav-link" onClick={toggleMenu}>{t('header.free_trial')}</Link>
              <LanguageSwitcher />
            </>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;