// Utilidades de seguridad - ARCHIVO NUEVO
// No interfiere con el funcionamiento actual

// Mapeo de idiomas para Firebase
export const getFirebaseLanguageCode = (userLanguage) => {
    const mapping = {
        'español': 'es',
        'ingles': 'en',
        'frances': 'fr',
        'italiano': 'it',
        'aleman': 'de',
        'portugues': 'pt-BR'
    };
    return mapping[userLanguage] || 'en';
};

// Mapeo de idiomas para reCAPTCHA
export const getRecaptchaLanguageCode = (userLanguage) => {
    const mapping = {
        'español': 'es',
        'ingles': 'en',
        'frances': 'fr',
        'italiano': 'it',
        'aleman': 'de',
        'portugues': 'pt'
    };
    return mapping[userLanguage] || 'en';
};

// Función OPCIONAL para configurar idioma en Firebase Auth
export const setFirebaseLanguage = async (userLanguage) => {
    try {
        const languageCode = getFirebaseLanguageCode(userLanguage);
        
        // Intentar múltiples formas de configurar el idioma
        if (window.firebaseAuth) {
            window.firebaseAuth.languageCode = languageCode;
            console.log(`Firebase language set to: ${languageCode}`);
            return true;
        }
        
        // Si no está disponible, intentar importar auth directamente
        try {
            const { auth } = await import('../firebase_auth.js');
            auth.languageCode = languageCode;
            console.log(`Firebase language set to: ${languageCode} (imported)`);
            return true;
        } catch (importError) {
            console.warn('Could not import auth:', importError);
        }
        
        // Último intento: esperar y usar window
        return new Promise((resolve) => {
            setTimeout(() => {
                if (window.firebaseAuth) {
                    window.firebaseAuth.languageCode = languageCode;
                    console.log(`Firebase language set to: ${languageCode} (delayed)`);
                    resolve(true);
                } else {
                    console.warn('Firebase auth not available after timeout');
                    resolve(false);
                }
            }, 100);
        });
        
    } catch (error) {
        console.warn('Could not set Firebase language:', error);
        return false;
    }
};

// Función OPCIONAL para verificar captcha
export const verifyRecaptcha = async (executeRecaptcha) => {
    try {
        if (!executeRecaptcha) {
            console.warn('reCAPTCHA not available, skipping verification');
            return true; // No bloquear si no está disponible
        }
        
        const token = await executeRecaptcha('register');
        
        const response = await fetch('/api/security/verify-captcha', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
        });
        
        if (response.ok) {
            console.log('Captcha verification successful');
            return true;
        } else {
            console.warn('Captcha verification failed');
            return false;
        }
    } catch (error) {
        console.warn('Captcha verification error:', error);
        return true; // No bloquear si hay error - mantener funcionamiento actual
    }
};

// Configuración para activar/desactivar funcionalidades
export const SECURITY_CONFIG = {
    ENABLE_CAPTCHA: false,          // Inicialmente desactivado
    ENABLE_LANGUAGE_DETECTION: false,  // Inicialmente desactivado
    RECAPTCHA_SITE_KEY: null        // Se configura después
}; 