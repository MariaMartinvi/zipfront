import { auth } from '../firebase_auth';

// Clase para manejar la sesión del usuario
class UserSession {
    constructor() {
        this.user = null;
        this.isLoading = true;
        this.listeners = new Set();
        this.authPromise = null; // Promesa para esperar la inicialización
    }

    // Inicializar la sesión
    async init() {
        try {
            // PASO 1: Verificar si hay autenticación de Android pendiente
            await this.checkAndroidAuth();
            
            // PASO 2: Crear una promesa que se resuelve cuando la autenticación se complete
            this.authPromise = new Promise((resolve) => {
                // Escuchar cambios en el estado de autenticación
                auth.onAuthStateChanged((user) => {
                    this.user = user;
                    this.isLoading = false;
                    this.notifyListeners();
                    resolve(user); // Resolver la promesa cuando se complete la autenticación
                });
            });
            
            return this.authPromise;
        } catch (error) {
            console.error('Error al inicializar la sesión:', error);
            this.isLoading = false;
            this.notifyListeners();
            throw error;
        }
    }

    // Verificar autenticación desde Android
    async checkAndroidAuth() {
        try {
            const androidToken = localStorage.getItem('android_auth_token');
            const androidEmail = localStorage.getItem('android_auth_email');
            const androidTimestamp = localStorage.getItem('android_auth_timestamp');
            
            if (androidToken && androidEmail && androidTimestamp) {
                console.log('🔑 Token de Android detectado, verificando validez...');
                
                // Verificar que el token no sea muy viejo (máximo 1 hora)
                const tokenAge = Date.now() - parseInt(androidTimestamp);
                const MAX_TOKEN_AGE = 60 * 60 * 1000; // 1 hora
                
                if (tokenAge < MAX_TOKEN_AGE) {
                    console.log('🔑 Token de Android válido, intentando autenticación...');
                    
                    // Importar signInWithCustomToken dinámicamente
                    const { signInWithCustomToken } = await import('firebase/auth');
                    
                    try {
                        // NOTA: Usar signInWithCredential directamente con el token de Google
                        console.log('🔑 Autenticando directamente con credencial de Google...');
                        
                        const { signInWithCredential, GoogleAuthProvider } = await import('firebase/auth');
                        
                        // Crear credencial de Google con el token
                        const credential = GoogleAuthProvider.credential(androidToken);
                        console.log('✅ Credencial de Google creada');
                        
                        // Autenticar directamente con Firebase
                        const userCredential = await signInWithCredential(auth, credential);
                        console.log('✅ Usuario autenticado con Google');
                        
                        // Limpiar tokens de Android después del éxito
                        localStorage.removeItem('android_auth_token');
                        localStorage.removeItem('android_auth_email');
                        localStorage.removeItem('android_auth_name');
                        localStorage.removeItem('android_auth_timestamp');
                        
                        console.log('✅ Autenticación Android completada exitosamente');
                        
                    } catch (authError) {
                        console.log('❌ Error autenticando con token Android:', authError.message);
                        
                        // Limpiar tokens inválidos
                        localStorage.removeItem('android_auth_token');
                        localStorage.removeItem('android_auth_email');
                        localStorage.removeItem('android_auth_name');
                        localStorage.removeItem('android_auth_timestamp');
                    }
                } else {
                    console.log('⏰ Token de Android expirado, eliminando...');
                    
                    // Limpiar tokens expirados
                    localStorage.removeItem('android_auth_token');
                    localStorage.removeItem('android_auth_email');
                    localStorage.removeItem('android_auth_name');
                    localStorage.removeItem('android_auth_timestamp');
                }
            }
        } catch (error) {
            console.error('Error verificando autenticación de Android:', error);
        }
    }

    // Esperar a que la autenticación se complete
    async waitForAuth() {
        if (this.authPromise) {
            return await this.authPromise;
        }
        return this.user;
    }

    // Obtener el usuario actual
    getCurrentUser() {
        return this.user;
    }

    // Verificar si el usuario está autenticado
    isAuthenticated() {
        return !!this.user;
    }

    // Verificar si el usuario está autenticado de forma asíncrona (espera la inicialización)
    async isAuthenticatedAsync() {
        if (!this.isLoading) {
            return this.isAuthenticated();
        }
        
        // Si aún está cargando, esperar a que termine
        await this.waitForAuth();
        return this.isAuthenticated();
    }

    // Verificar si el usuario es administrador
    isAdmin() {
        return this.user?.isAdmin || false;
    }

    // Obtener el estado de carga
    getLoadingState() {
        return this.isLoading;
    }

    // Suscribirse a cambios en la sesión
    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    // Notificar a todos los listeners
    notifyListeners() {
        this.listeners.forEach(listener => listener(this.user));
    }

    // Limpiar la sesión
    clear() {
        this.user = null;
        this.notifyListeners();
    }
}

// Exportar una instancia única
export const userSession = new UserSession(); 