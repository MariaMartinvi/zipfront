// Header.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { logoutUser } from './firebase_auth';
import './Header.css';

const Header = ({ user }) => {
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
          <div className="logo-text">
            <span className="logo-chat">Chat</span>
            <span className="logo-salsa">salsa</span>
          </div>
        </Link>
        
        <div className="nav-container">
          {/* Desktop Navigation */}
          <nav className="desktop-nav">
            <Link to="/" className="nav-link">Inicio</Link>
            {user ? (
              <>
                <Link to="/plans" className="nav-link">Planes</Link>
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
                        Cerrar Sesión
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-link">Iniciar Sesión</Link>
                <Link to="/register" className="nav-link sign-up">Crear Cuenta</Link>
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
          <Link to="/" className="mobile-nav-link" onClick={toggleMenu}>Inicio</Link>
          {user ? (
            <>
              <Link to="/plans" className="mobile-nav-link" onClick={toggleMenu}>Planes</Link>
              <button 
                className="mobile-nav-link mobile-logout"
                onClick={handleLogout}
              >
                Cerrar Sesión
              </button>
              <div className="mobile-user-info">
                Conectado como: {user.displayName || user.email}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="mobile-nav-link" onClick={toggleMenu}>Iniciar Sesión</Link>
              <Link to="/register" className="mobile-nav-link" onClick={toggleMenu}>Crear Cuenta</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;