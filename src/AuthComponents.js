// AuthComponents.js
import React, { useState, useEffect } from 'react';
import { loginUser, registerUser, resetPassword, getCurrentUser } from './firebase_auth';
import './AuthComponents.css';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
 

// Login Component

export const Login = ({ onLoginSuccess }) => {
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
      setError(error.message || 'Error al iniciar sesión. Por favor, inténtalo de nuevo.');
      setIsLoading(false);
      setIsRedirecting(false);
    }
  };

  return (
    <div className="auth-form-container">
      <h2>Iniciar Sesión</h2>
      {error && <div className="auth-error">{error}</div>}
      {returnTo && (
        <div className="auth-message">
          Por favor inicia sesión para continuar.
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
          <p>Iniciando sesión exitosamente. Redirigiendo...</p>
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
        <form onSubmit={handleLogin} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
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
            <label htmlFor="password">Contraseña</label>
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
            {isLoading ? 'Cargando...' : 'Iniciar Sesión'}
          </button>
        </form>
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
          ¿No tienes una cuenta? Regístrate
        </button>
        <button 
          className="auth-link-button" 
          onClick={() => navigate('/reset-password')}
          disabled={isLoading || isRedirecting}
        >
          ¿Olvidaste tu contraseña?
        </button>
      </div>
    </div>
  );
};
// Registration Component
export const Register = ({ onRegisterSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const user = await registerUser(email, password, displayName);
      if (onRegisterSuccess) onRegisterSuccess(user);
    } catch (error) {
      setError(error.message || 'Error al registrarse. Por favor, inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-form-container">
      <h2>Crear Cuenta</h2>
      {error && <div className="auth-error">{error}</div>}
      <form onSubmit={handleRegister} className="auth-form">
        <div className="form-group">
          <label htmlFor="displayName">Nombre</label>
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
          <label htmlFor="email">Email</label>
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
          <label htmlFor="password">Contraseña</label>
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
          <label htmlFor="confirmPassword">Confirmar Contraseña</label>
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
          {isLoading ? 'Cargando...' : 'Registrarse'}
        </button>
      </form>
      <div className="auth-links">
        <button 
          className="auth-link-button" 
          onClick={() => window.location.href = '/login'}
          disabled={isLoading}
        >
          ¿Ya tienes una cuenta? Inicia sesión
        </button>
      </div>
    </div>
  );
};

// Password Reset Component
export const PasswordReset = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);
    
    try {
      await resetPassword(email);
      setMessage('Se ha enviado un enlace para restablecer tu contraseña. Por favor, revisa tu correo electrónico.');
    } catch (error) {
      setError(error.message || 'Error al enviar el correo de restablecimiento. Por favor, inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-form-container">
      <h2>Restablecer Contraseña</h2>
      {error && <div className="auth-error">{error}</div>}
      {message && <div className="auth-message">{message}</div>}
      <form onSubmit={handleResetPassword} className="auth-form">
        <div className="form-group">
          <label htmlFor="email">Email</label>
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
          {isLoading ? 'Enviando...' : 'Enviar Correo de Restablecimiento'}
        </button>
      </form>
      <div className="auth-links">
        <button 
          className="auth-link-button" 
          onClick={() => window.location.href = '/login'}
          disabled={isLoading}
        >
          Volver a Iniciar Sesión
        </button>
      </div>
    </div>
  );
};

// Auth Container - Handles common authentication logic
export const AuthContainer = ({ children }) => {
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
    return <div className="auth-loading">Cargando...</div>;
  }

  return children(user);
};