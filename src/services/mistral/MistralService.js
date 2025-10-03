/**
 * MistralService.js - Servicio para Mistral AI
 * 
 * Este servicio maneja las llamadas directas a la API de Mistral
 * usando mistral-small-latest como modelo de fallback.
 */

// Los prompts ahora están en el backend

export class MistralService {
  constructor() {
    this.baseURL = 'https://api.mistral.ai/v1';
    this.model = 'mistral-small-latest';
    this.maxTokens = 4000;
    this.temperature = 0.7;
  }

  /**
   * Obtiene respuesta de Mistral para un texto anonimizado
   * @param {string} textContent - Contenido ya anonimizado del chat
   * @param {string} language - Idioma para el análisis (es, en, fr, etc.)
   * @returns {Promise<Object>} - Resultado del análisis
   */
  async getResponse(textContent, language = 'es') {
    console.log(`🤖 Mistral: Procesando texto de ${textContent.length} caracteres en idioma: ${language}`);
    console.log(`🤖 Mistral: INICIANDO getResponse - timestamp: ${new Date().toISOString()}`);
    
    // DEBUGGING ANDROID: Usar alert para ver si llega aquí
    if (navigator.userAgent.includes('Android')) {
      alert(`🤖 ANDROID DEBUG: Mistral getResponse iniciado - ${textContent.length} chars`);
    }

    try {
      // Obtener token de autenticación
      const token = localStorage.getItem('access_token');
      console.log(`🤖 Mistral: Token encontrado: ${token ? 'SÍ' : 'NO'}`);
      
      // DEBUGGING ANDROID: Verificar token
      if (navigator.userAgent.includes('Android')) {
        alert(`🤖 ANDROID DEBUG: Token ${token ? 'ENCONTRADO' : 'NO ENCONTRADO'}`);
      }
      
      if (!token) {
        console.log(`🤖 Mistral: ERROR - No hay token, lanzando excepción`);
        if (navigator.userAgent.includes('Android')) {
          alert(`🤖 ANDROID DEBUG: ERROR - Sin token, lanzando excepción`);
        }
        throw new Error('Usuario no autenticado');
      }

      // Llamar al backend seguro
      const API_URL = process.env.REACT_APP_API_URL || 'https://zipcd-backend-andand-gunicorn-app-app.onrender.com';
      console.log(`🌐 Mistral: Usando URL: ${API_URL}/api/mistral-analysis`);
      console.log(`🌐 Mistral: INICIANDO FETCH - timestamp: ${new Date().toISOString()}`);
      
      // DEBUGGING ANDROID: Verificar URL y fetch
      if (navigator.userAgent.includes('Android')) {
        alert(`🌐 ANDROID DEBUG: Iniciando fetch a ${API_URL}/api/mistral-analysis`);
      }
      
      const response = await fetch(`${API_URL}/api/mistral-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          textContent,
          language
        })
      });

      console.log(`🌐 Mistral: FETCH COMPLETADO - Status: ${response.status}, timestamp: ${new Date().toISOString()}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Backend error: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error('Error en la respuesta del backend');
      }

      console.log(`✅ Mistral: Respuesta recibida exitosamente desde backend seguro`);

      return result;

    } catch (error) {
      console.error(`❌ Mistral Error:`, error.message);
      throw error;
    }
  }
}

// Exportar instancia singleton
export default new MistralService(); 