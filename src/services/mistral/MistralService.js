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

    try {
      // Obtener token de autenticación
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Usuario no autenticado');
      }

      // Llamar al backend seguro
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
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