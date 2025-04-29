// AuthComponents.js
import React, { useState, useEffect } from 'react';
import { loginUser, registerUser, resetPassword, getCurrentUser, loginWithGoogle } from './firebase_auth';
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

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);
    
    try {
      console.log('Attempting Google login...');
      const user = await loginWithGoogle();
      console.log('Google login successful:', user.uid);
      
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
        console.log('Standard login, calling onLoginSuccess');
        if (onLoginSuccess) {
          setTimeout(() => {
            onLoginSuccess(user);
          }, 500);
        }
      }
    } catch (error) {
      console.error('Google login error:', error);
      setError(error.message || 'Error al iniciar sesión con Google. Por favor, inténtalo de nuevo.');
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
            Iniciar sesión con Google
          </button>
          
          <div className="separator">
            <span>o</span>
          </div>
          
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

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);
    
    try {
      console.log('Intentando registro con Google...');
      const user = await loginWithGoogle();
      console.log('Registro con Google exitoso:', user.uid);
      
      if (onRegisterSuccess) {
        onRegisterSuccess(user);
      }
    } catch (error) {
      console.error('Error de registro con Google:', error);
      setError(error.message || 'Error al registrarse con Google. Por favor, inténtalo de nuevo.');
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-form-container">
      <h2>Crear Cuenta</h2>
      {error && <div className="auth-error">{error}</div>}
      
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
          Registrarse con Google
        </button>
        
        <div className="separator">
          <span>o</span>
        </div>
        
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
      </div>
      
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