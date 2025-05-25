import { auth } from '../firebase_auth';

// Clase para manejar la sesión del usuario
class UserSession {
    constructor() {
        this.user = null;
        this.isLoading = true;
        this.listeners = new Set();
    }

    // Inicializar la sesión
    async init() {
        try {
            // Escuchar cambios en el estado de autenticación
            auth.onAuthStateChanged((user) => {
                this.user = user;
                this.isLoading = false;
                this.notifyListeners();
            });
        } catch (error) {
            console.error('Error al inicializar la sesión:', error);
            this.isLoading = false;
            this.notifyListeners();
        }
    }

    // Obtener el usuario actual
    getCurrentUser() {
        return this.user;
    }

    // Verificar si el usuario está autenticado
    isAuthenticated() {
        return !!this.user;
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