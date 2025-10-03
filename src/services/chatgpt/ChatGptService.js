/**
 * ChatGptService.js - Servicio para OpenAI ChatGPT
 * 
 * Este servicio maneja las llamadas directas a la API de OpenAI
 * usando gpt-4o-mini como modelo principal.
 */

// Los prompts ahora están en el backend

export class ChatGptService {
  constructor() {
    this.baseURL = 'https://api.openai.com/v1';
    this.model = 'gpt-4o-mini';
    this.maxTokens = 4000;
    this.temperature = 0.7;
  }

  /**
   * Obtiene respuesta de ChatGPT para un texto anonimizado
   * @param {string} textContent - Contenido ya anonimizado del chat
   * @param {string} language - Idioma para el análisis (es, en, fr, etc.)
   * @returns {Promise<Object>} - Resultado del análisis
   */
  async getResponse(textContent, language = 'es') {
    console.log(`🤖 ChatGPT: Procesando texto de ${textContent.length} caracteres en idioma: ${language}`);

    try {
      // Obtener token de autenticación (IGUAL QUE STRIPE)
      const { auth } = await import('../../firebase_auth');
      const { getIdToken } = await import('firebase/auth');
      
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Usuario no autenticado en Firebase');
      }
      
      const token = await getIdToken(currentUser, true);

      // Llamar al backend seguro
      const API_URL = process.env.REACT_APP_API_URL || 'https://zipcd-backend-andand-gunicorn-app-app.onrender.com';
      console.log(`🌐 ChatGPT: Usando URL: ${API_URL}/api/openai-analysis`);
      const response = await fetch(`${API_URL}/api/openai-analysis`, {
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

      console.log(`✅ ChatGPT: Respuesta recibida exitosamente desde backend seguro`);

      return result;

    } catch (error) {
      console.error(`❌ ChatGPT Error:`, error.message);
      throw error;
    }
  }
}

// Exportar instancia singleton
export default new ChatGptService(); 