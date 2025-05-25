// AuthComponents.js
import React, { useState, useEffect } from 'react';
import { loginUser, registerUser, resetPassword, getCurrentUser, loginWithGoogle, handleGoogleRedirectResult } from './firebase_auth';
import './AuthComponents.css';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useTranslation } from 'react-i18next';
 

// Login Component

export const Login = ({ onLoginSuccess }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { setUser } = useAuth();

  // Extract returnTo and session_id from URL if present
  const queryParams = new URLSearchParams(location.search);
  const returnTo = queryParams.get('returnTo');
  const sessionId = queryParams.get('session_id');

  // Log for debugging
  useEffect(() => {
    console.log('Login component mounted with params:', { returnTo, sessionId });
  }, [returnTo, sessionId]);

  // Manejar resultado del redirect de Google Auth
  useEffect(() => {
    const handleGoogleRedirect = async () => {
      try {
        const user = await handleGoogleRedirectResult();
        if (user) {
          console.log('Google login successful after redirect:', user.uid);
          
          // Set user in the global context
          setUser(user);
          
          setIsRedirecting(true);
          
          // Check if we need to redirect to a specific page after login
          if (returnTo) {
            console.log('Redirecting to:', returnTo);
            setTimeout(() => {
              navigate(returnTo);
            }, 1000);
          } else {
            console.log('Standard Google login, calling onLoginSuccess');
            if (onLoginSuccess) {
              setTimeout(() => {
                onLoginSuccess(user);
              }, 500);
            }
          }
        }
      } catch (error) {
        console.error('Error handling Google redirect result:', error);
        setError(error.message || t('auth.login.error'));
        setIsLoading(false);
      }
    };

    handleGoogleRedirect();
  }, [navigate, returnTo, onLoginSuccess, setUser, t]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      console.log('Attempting login...');
      const user = await loginUser(email, password);
      console.log('Login successful:', user.uid);
      
      // Set user in the global context
      setUser(user);
      
      setIsRedirecting(true);
      
      // Check if we need to redirect to a specific page after login
      if (returnTo) {
        console.log('Redirecting to:', returnTo);
        setTimeout(() => {
          // Use direct navigation to ensure we maintain authentication state
          navigate(returnTo);
        }, 1000);
      } else {
        console.log('Standard login, calling onLoginSuccess');
        if (onLoginSuccess) {
          // Small delay to ensure the context has updated
          setTimeout(() => {
            onLoginSuccess(user);
          }, 500);
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || t('auth.login.error'));
      setIsLoading(false);
      setIsRedirecting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);
    
    try {
      console.log('Attempting Google login...');
      
      // loginWithGoogle ahora usa redirect, no devuelve un usuario inmediatamente
      await loginWithGoogle();
      // El usuario será redirigido a Google y volverá a la app
      // El resultado se manejará en el useEffect
      
    } catch (error) {
      console.error('Google login error:', error);
      setError(error.message || t('auth.login.error'));
      setIsLoading(false);
      setIsRedirecting(false);
    }
  };

  return (
    <div className="auth-form-container">
      <h2>{t('auth.login.title')}</h2>
      {error && (
        <div className="auth-error-container">
          <div className="auth-error">
            <span className="auth-error-icon">⚠️</span>
            <span className="auth-error-text">{error}</span>
          </div>
        </div>
      )}
      {returnTo && (
        <div className="auth-message">
          {t('auth.login.please_login')}
        </div>
      )}
      {isRedirecting ? (
        <div className="redirect-message">
          <div className="spinner" style={{ 
            display: "inline-block",
            width: "20px",
            height: "20px",
            border: "3px solid #f3f3f3",
            borderTop: "3px solid #3498db",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            marginRight: "10px"
          }}></div>
          <p>{t('auth.login.redirecting')}</p>
          <style>
            {`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}
          </style>
        </div>
      ) : (
        <div className="auth-content">
          <button 
            type="button"
            className="google-auth-button"
            onClick={handleGoogleLogin}
            disabled={isLoading || isRedirecting}
          >
            <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            {t('auth.login.google_button')}
          </button>
          
          <div className="separator">
            <span>{t('auth.login.or')}</span>
          </div>
          
          <form onSubmit={handleLogin} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">{t('auth.login.email')}</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading || isRedirecting}
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">{t('auth.login.password')}</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading || isRedirecting}
              />
            </div>
            <button 
              type="submit" 
              className="auth-button" 
              disabled={isLoading || isRedirecting}
            >
              {isLoading ? t('auth.login.loading') : t('auth.login.button')}
            </button>
          </form>
        </div>
      )}
      <div className="auth-links">
        <button 
          className="auth-link-button" 
          onClick={() => {
            const registerPath = '/register';
            if (returnTo) {
              // Pass the returnTo parameter to registration as well
              navigate(`${registerPath}?returnTo=${returnTo}`);
            } else {
              navigate(registerPath);
            }
          }}
          disabled={isLoading || isRedirecting}
        >
          {t('auth.links.register')}
        </button>
        <button 
          className="auth-link-button" 
          onClick={() => navigate('/reset-password')}
          disabled={isLoading || isRedirecting}
        >
          {t('auth.links.forgot_password')}
        </button>
      </div>
    </div>
  );
};

// Registration Component
export const Register = ({ onRegisterSuccess }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Manejar resultado del redirect de Google Auth
  useEffect(() => {
    const handleGoogleRedirect = async () => {
      try {
        const user = await handleGoogleRedirectResult();
        if (user) {
          console.log('Google registration successful after redirect:', user.uid);
          
          if (onRegisterSuccess) {
            onRegisterSuccess(user);
          }
        }
      } catch (error) {
        console.error('Error handling Google redirect result in register:', error);
        setError(error.message || t('auth.register.error'));
        setIsLoading(false);
      }
    };

    handleGoogleRedirect();
  }, [onRegisterSuccess, t]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError(t('auth.register.password_mismatch'));
      return;
    }
    
    setIsLoading(true);
    
    try {
      const user = await registerUser(email, password, displayName);
      if (onRegisterSuccess) onRegisterSuccess(user);
    } catch (error) {
      setError(error.message || t('auth.register.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);
    
    try {
      console.log('Intentando registro con Google...');
      // loginWithGoogle ahora usa redirect, no devuelve un usuario inmediatamente
      await loginWithGoogle();
      // El usuario será redirigido a Google y volverá a la app
      
    } catch (error) {
      console.error('Error de registro con Google:', error);
      setError(error.message || t('auth.register.error'));
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-form-container">
      <h2>{t('auth.register.title')}</h2>
      {error && (
        <div className="auth-error-container">
          <div className="auth-error">
            <span className="auth-error-icon">⚠️</span>
            <span className="auth-error-text">{error}</span>
          </div>
        </div>
      )}
      
      <div className="auth-content">
        <button 
          type="button"
          className="google-auth-button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
        >
          <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          {t('auth.register.google_button')}
        </button>
        
        <div className="separator">
          <span>{t('auth.register.or')}</span>
        </div>
        
        <form onSubmit={handleRegister} className="auth-form">
          <div className="form-group">
            <label htmlFor="displayName">{t('auth.register.name', 'Nombre')}</label>
            <input
              type="text"
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">{t('auth.register.email')}</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">{t('auth.register.password')}</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              minLength={6}
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">{t('auth.register.confirm_password')}</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isLoading}
              minLength={6}
            />
          </div>
          <button 
            type="submit" 
            className="auth-button" 
            disabled={isLoading}
          >
            {isLoading ? t('auth.register.loading') : t('auth.register.button')}
          </button>
        </form>
      </div>
      
      <div className="auth-links">
        <button 
          className="auth-link-button" 
          onClick={() => navigate('/login')}
          disabled={isLoading}
        >
          {t('auth.links.login')}
        </button>
      </div>
    </div>
  );
};

// Password Reset Component
export const PasswordReset = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setIsLoading(true);
    
    try {
      await resetPassword(email);
      setMessage(t('auth.password_reset.success'));
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      setError(error.message || t('auth.password_reset.error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-form-container">
      <h2>{t('auth.password_reset.title')}</h2>
      {error && (
        <div className="auth-error-container">
          <div className="auth-error">
            <span className="auth-error-icon">⚠️</span>
            <span className="auth-error-text">{error}</span>
          </div>
        </div>
      )}
      {message && (
        <div className="auth-message">
          {message}
        </div>
      )}
      <form onSubmit={handleResetPassword} className="auth-form">
        <div className="form-group">
          <label htmlFor="email">{t('auth.password_reset.email')}</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        <button 
          type="submit" 
          className="auth-button" 
          disabled={isLoading}
        >
          {isLoading ? t('auth.password_reset.loading') : t('auth.password_reset.button')}
        </button>
      </form>
      <div className="auth-links">
        <button 
          className="auth-link-button" 
          onClick={() => navigate('/login')}
          disabled={isLoading}
        >
          {t('auth.links.login')}
        </button>
      </div>
    </div>
  );
};

// Auth Container - Handles common authentication logic
export const AuthContainer = ({ children }) => {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error checking authentication:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return <div className="auth-loading">{t('auth.login.loading')}</div>;
  }

  return children(user);
};