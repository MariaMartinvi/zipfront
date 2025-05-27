import axios from 'axios';

// Helper function to build API base URL consistently
const getApiBaseUrl = () => {
  const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  
  // Si la URL base ya termina con /api, usar tal como está
  if (baseUrl.endsWith('/api')) {
    return baseUrl;
  } else {
    // Si no termina con /api, agregarlo
    return `${baseUrl}/api`;
  }
};

const API_URL = getApiBaseUrl();

// Configuración de axios
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor para agregar el token a las peticiones
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor para manejar errores y refresh token
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Si el error es 401 y no es una petición de refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refresh_token');
                if (!refreshToken) {
                    throw new Error('No refresh token available');
                }

                const response = await axios.post(`${API_URL}/auth/refresh`, {
                    refresh_token: refreshToken
                }, {
                    headers: {
                        'Authorization': `Bearer ${refreshToken}`,
                        'Content-Type': 'application/json'
                    }
                });

                const { access_token } = response.data;
                localStorage.setItem('access_token', access_token);

                // Reintentar la petición original con el nuevo token
                originalRequest.headers.Authorization = `Bearer ${access_token}`;
                return api(originalRequest);
            } catch (refreshError) {
                console.error('Error refreshing token:', refreshError);
                // Si falla el refresh, limpiar tokens y redirigir
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                
                // Solo redirigir si estamos en el navegador
                if (typeof window !== 'undefined') {
                    window.location.href = '/login';
                }
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

const apiClient = api;
export default apiClient; 