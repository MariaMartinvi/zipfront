// AuthComponents.js
import React, { useState, useEffect } from 'react';
import { loginUser, registerUser, resetPassword, getCurrentUser, loginWithGoogle, handleGoogleRedirectResult } from './firebase_auth';
import './AuthComponents.css';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useTranslation } from 'react-i18next';
// SEGURIDAD: Importar hooks de seguridad
import { useSecurityCaptcha } from './components/SecurityCaptcha';
import { setFirebaseLanguage } from './utils/securityUtils';
import { confirmEmailVerification, resendEmailVerification } from './firebase_auth';
 

// Login Component

export const Login = ({ onLoginSuccess }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [showResendEmail, setShowResendEmail] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { setUser } = useAuth();

  // Extract returnTo and session_id from URL if present
  const queryParams = new URLSearchParams(location.search);
  const returnTo = queryParams.get('returnTo');
  const sessionId = queryParams.get('session_id');
  
  // Extraer parámetros de verificación de email
  const mode = queryParams.get('mode');
  const oobCode = queryParams.get('oobCode');

  // Log for debugging
  useEffect(() => {
    console.log('Login component mounted with params:', { returnTo, sessionId, mode, oobCode });
  }, [returnTo, sessionId, mode, oobCode]);

  // Procesar verificación de email automáticamente
  useEffect(() => {
    const processEmailVerification = async () => {
      if (mode === 'verifyEmail' && oobCode) {
        console.log('🔐 Detectada verificación de email automática...');
        setIsLoading(true);
        
        try {
          await confirmEmailVerification(oobCode);
          setEmailVerified(true);
          setError('');
          console.log('✅ Email verificado exitosamente');
          
          // Limpiar URL sin recargar página
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
          
        } catch (error) {
          console.error('❌ Error verificando email:', error);
          setError(error.message || t('auth.verification.error', 'Error al verificar el email.'));
        } finally {
          setIsLoading(false);
        }
      }
    };

    processEmailVerification();
  }, [mode, oobCode, t]);

  // Manejar resultado del redirect de Google Auth (fallback cuando popup falla)
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
      
      // Detectar error específico de email no verificado
      if (error.code === 'auth/email-not-verified') {
        setShowResendEmail(true);
      } else {
        setShowResendEmail(false);
      }
      
      setError(error.message || t('auth.login.error'));
      setIsLoading(false);
      setIsRedirecting(false);
    }
  };

  const handleResendEmail = async () => {
    setIsResending(true);
    setResendSuccess(false);
    
    try {
      console.log('Reenviando email de verificación...');
      
      // Necesitamos hacer login temporal para obtener el usuario y poder reenviar el email
      const { auth, signInWithEmailAndPassword, signOut } = await import('firebase/auth');
      const { auth: firebaseAuth } = await import('./firebase_auth');
      
      const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
      await resendEmailVerification();
      setResendSuccess(true);
      setError('');
      
      // Cerrar sesión inmediatamente después de reenviar
      await signOut(firebaseAuth);
      
      console.log('✅ Email de verificación reenviado exitosamente');
    } catch (error) {
      console.error('❌ Error reenviando email:', error);
      setError(error.message || t('auth.resend.error', 'Error al reenviar el email. Inténtalo de nuevo.'));
    } finally {
      setIsResending(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);
    
    try {
      console.log('Attempting Google login...');
      
      // loginWithGoogle puede usar popup o redirect dependiendo del navegador
      const user = await loginWithGoogle();
      
      if (user === null) {
        // El usuario está siendo redirigido para autenticación con Google
        console.log('Usuario redirigido para autenticación con Google');
        // No necesitamos hacer nada más, el redirect manejará el resto
        return;
      }
      
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
        console.log('Standard Google login, calling onLoginSuccess');
        if (onLoginSuccess) {
          setTimeout(() => {
            onLoginSuccess(user);
          }, 500);
        }
      }
      
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
          {showResendEmail && (
            <div className="resend-email-container">
              {resendSuccess ? (
                <div className="resend-success">
                  <span className="resend-success-icon">✅</span>
                  <span className="resend-success-text">
                    {t('auth.resend.success', 'Email de verificación reenviado. Revisa tu bandeja de entrada.')}
                  </span>
                </div>
              ) : (
                                 <button 
                   type="button"
                   className="resend-email-button"
                   onClick={handleResendEmail}
                   disabled={isResending}
                 >
                   {isResending ? 
                     t('auth.resend.sending', 'Enviando...') : 
                     t('auth.resend.button', 'Volver a mandar email de verificación')
                   }
                 </button>
              )}
            </div>
          )}
        </div>
      )}
      {returnTo && (
        <div className="auth-message">
          {t('auth.login.please_login')}
        </div>
      )}
      {emailVerified && (
        <div className="auth-success-container">
          <div className="auth-success">
            <span className="auth-success-icon">✅</span>
            <span className="auth-success-text">{t('auth.verification.success', 'Email verificado exitosamente. Ya puedes iniciar sesión.')}</span>
          </div>
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
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const navigate = useNavigate();
  
  // Hook de seguridad para reCAPTCHA
  const { verifyCaptcha } = useSecurityCaptcha();

  // Manejar resultado del redirect de Google Auth (fallback cuando popup falla)
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
      // PASO 1: Verificar reCAPTCHA
      console.log('🔒 Verificando reCAPTCHA...');
      const captchaResult = await verifyCaptcha('register').catch(error => {
        console.warn('Error en captcha, continuando:', error);
        return { success: true }; // No bloquear si falla captcha
      });
      
      if (!captchaResult.success) {
        setError(t('auth.register.captcha_failed', 'Verificación de seguridad falló. Inténtalo de nuevo.'));
        setIsLoading(false);
        return;
      }
      
      console.log('✅ reCAPTCHA verificado exitosamente');
      setCaptchaVerified(true);
      
      // PASO 2: Configurar idioma de Firebase para emails
      const currentLanguage = i18n.language;
      const languageMapping = {
        'es': 'español',
        'en': 'ingles', 
        'fr': 'frances',
        'it': 'italiano',
        'de': 'aleman',
        'pt': 'portugues'
      };
      const userLanguage = languageMapping[currentLanguage] || 'español';
      
      // Configurar idioma antes del registro
      console.log(`🌍 Configurando idioma: ${userLanguage}`);
      try {
        await setFirebaseLanguage(userLanguage);
      } catch (langError) {
        console.warn('Error configurando idioma, continuando:', langError);
      }
      
      // PASO 3: Registrar usuario con verificación por email
      console.log('📧 Creando usuario y enviando email de verificación...');
      const user = await registerUser(email, password, displayName);
      
      // Mostrar mensaje de verificación por email
      setShowEmailVerification(true);
      setError(''); // Limpiar errores
      
      // No llamar onRegisterSuccess inmediatamente - esperar verificación
      console.log('✅ Usuario creado. Email de verificación enviado.');
      
    } catch (error) {
      console.error('❌ Error en registro:', error);
      // Asegurar que el error tiene un mensaje
      const errorMessage = error?.message || error?.toString() || t('auth.register.error');
      setError(errorMessage);
      setCaptchaVerified(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);
    
    try {
      console.log('Intentando registro con Google...');
      // loginWithGoogle puede usar popup o redirect dependiendo del navegador
      const user = await loginWithGoogle();
      
      if (user === null) {
        // El usuario está siendo redirigido para autenticación con Google
        console.log('Usuario redirigido para registro con Google');
        // No necesitamos hacer nada más, el redirect manejará el resto
        return;
      }
      
      console.log('Google registration successful:', user.uid);
      
      if (onRegisterSuccess) {
        onRegisterSuccess(user);
      }
      
    } catch (error) {
      console.error('Error de registro con Google:', error);
      setError(error.message || t('auth.register.error'));
      setIsLoading(false);
    }
  };

  // Si se muestra verificación de email, ocultar formulario
  if (showEmailVerification) {
    return (
      <div className="auth-form-container">
        <div className="email-verification-success">
          <div className="verification-icon">📧</div>
          <h2>{t('auth.register.verification_sent', 'Email de verificación enviado')}</h2>
          <p className="verification-message">
            {t('auth.register.verification_instruction', 'Hemos enviado un email de verificación a:')}
          </p>
          <div className="email-display">
            <strong>{email}</strong>
          </div>
          <p className="verification-details">
            {t('auth.register.verification_details', 'Por favor, revisa tu bandeja de entrada y haz clic en el enlace para activar tu cuenta.')}
          </p>
          <div className="verification-note">
            <p>
              <strong>{t('auth.register.verification_note', 'Nota:')}</strong> {' '}
              {t('auth.register.verification_spam', 'Si no ves el email, revisa tu carpeta de spam.')}
            </p>
          </div>
          <div className="verification-actions">
            <button 
              className="auth-button"
              onClick={() => navigate('/login')}
              style={{
                background: 'linear-gradient(135deg, #25D366, #7122AC)',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '16px',
                marginTop: '20px'
              }}
            >
              {t('auth.register.go_to_login', 'Ir al login')}
            </button>
          </div>
        </div>
      </div>
    );
  }

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
          
          {/* Estado de seguridad */}
          <div className="security-status">
            {captchaVerified && (
              <div className="security-item verified">
                <span>✅ {t('auth.register.captcha_verified', 'Verificación de seguridad completada')}</span>
              </div>
            )}
            {isLoading && !captchaVerified && (
              <div className="security-item loading">
                <span>🔄 {t('auth.register.captcha_verifying', 'Verificando que eres humano...')}</span>
              </div>
            )}
          </div>
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