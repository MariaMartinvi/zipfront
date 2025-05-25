import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            try {
                if (authService.isAuthenticated()) {
                    const userData = await authService.getCurrentUser();
                    setUser(userData);
                }
            } catch (error) {
                console.error('Error al inicializar autenticación:', error);
            } finally {
                setLoading(false);
            }
        };

        initAuth();
    }, []);

    const login = async (email, password) => {
        const userData = await authService.login(email, password);
        setUser(userData);
        return userData;
    };

    const register = async (email, password) => {
        const userData = await authService.register(email, password);
        return userData;
    };

    const logout = () => {
        authService.logout();
        setUser(null);
        
        // Limpiar todos los datos de análisis del localStorage
        const keysToRemove = [
            'whatsapp_analyzer_operation_id',
            'whatsapp_analyzer_loading',
            'whatsapp_analyzer_fetching_mistral',
            'whatsapp_analyzer_show_analysis',
            'whatsapp_analyzer_chatgpt_response',
            'whatsapp_analyzer_analysis_complete',
            'whatsapp_analyzer_mistral_error',
            'whatsapp_analyzer_force_fetch',
            'whatsapp_analyzer_page_refreshed',
            'whatsapp_analyzer_chat_data',
            'whatsapp_analyzer_has_chat_data',
            'whatsapp_analyzer_is_processing_shared',
            'access_token',
            'refresh_token'
        ];

        // Limpiar cada clave del localStorage
        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
        });

        // Limpiar datos del juego si existen
        if (window.lastAnalysisTopData) {
            delete window.lastAnalysisTopData;
        }

        // Forzar recarga de la página para limpiar el estado de la aplicación
        window.location.href = '/';
    };

    const value = {
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: authService.isAuthenticated
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe ser usado dentro de un AuthProvider');
    }
    return context;
}; 