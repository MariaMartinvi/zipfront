// Componente OPCIONAL de reCAPTCHA - ARCHIVO NUEVO
// No interfiere con componentes existentes

import React, { useCallback } from 'react';
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { getRecaptchaLanguageCode } from '../utils/securityUtils';

// Hook para usar reCAPTCHA
export const useSecurityCaptcha = () => {
    const { executeRecaptcha } = useGoogleReCaptcha();

    const verifyCaptcha = useCallback(async (action = 'register') => {
        // En desarrollo con localhost, saltar reCAPTCHA
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('🚧 Desarrollo: Saltando reCAPTCHA en localhost');
            return { success: true, token: 'dev-bypass' };
        }

        if (!executeRecaptcha) {
            console.warn('reCAPTCHA not ready');
            return { success: true, token: null }; // No bloquear si no está listo
        }

        try {
            const token = await executeRecaptcha(action);
            
            // Verificar con nuestro backend
            const response = await fetch('/api/security/verify-captcha', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token })
            });

            if (response.ok) {
                const result = await response.json();
                return { success: result.success, token };
            } else {
                console.warn('Captcha verification failed, allowing anyway');
                return { success: true, token }; // No bloquear en caso de error
            }
        } catch (error) {
            console.warn('Captcha verification error:', error);
            return { success: true, token: null }; // No bloquear en caso de error
        }
    }, [executeRecaptcha]);

    return { verifyCaptcha };
};

// Proveedor de reCAPTCHA que se puede envolver OPCIONALMENTE
export const SecurityCaptchaProvider = ({ children, userLanguage }) => {
    const siteKey = process.env.REACT_APP_RECAPTCHA_SITE_KEY;
    
    if (!siteKey) {
        console.warn('reCAPTCHA site key not configured');
        return children; // Renderizar sin reCAPTCHA si no está configurado
    }

    const language = getRecaptchaLanguageCode(userLanguage);

    return (
        <GoogleReCaptchaProvider 
            reCaptchaKey={siteKey}
            language={language}
            useRecaptchaNet={false}
            useEnterprise={false}
            scriptProps={{
                async: true,
                defer: true
            }}
        >
            {children}
        </GoogleReCaptchaProvider>
    );
};

// Componente que muestra el estado del captcha (opcional)
export const CaptchaStatus = ({ isVerified, isLoading }) => {
    if (!process.env.REACT_APP_RECAPTCHA_SITE_KEY) {
        return null; // No mostrar nada si no está configurado
    }

    return (
        <div className="captcha-status" style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
            {isLoading && (
                <span>🔄 Verificando que eres humano...</span>
            )}
            {isVerified && (
                <span style={{ color: '#4CAF50' }}>✅ Verificación completada</span>
            )}
        </div>
    );
};

export default SecurityCaptchaProvider; 