/**
 * UnifiedAIService.js - Servicio unificado de IA
 * 
 * Este servicio maneja el fallback automático entre:
 * 1. ChatGPT (gpt-4o-mini) - Principal
 * 2. Mistral (mistral-small) - Fallback
 * 
 * Reemplaza completamente el sistema de Azure OpenAI.
 */

import { ChatGptService } from './chatgpt/ChatGptService';
import { MistralService } from './mistral/MistralService';

export class UnifiedAIService {
  constructor() {
    this.chatgptService = new ChatGptService();
    this.mistralService = new MistralService();
  }

  /**
   * Obtiene respuesta de IA con fallback automático
   * @param {string} textContent - Contenido ya anonimizado del chat
   * @param {string} language - Idioma para el análisis (es, en, fr, etc.)
   * @returns {Promise<Object>} - Resultado del análisis
   */
  async getResponse(textContent, language = 'es') {
    console.log('🚀 UnifiedAI: Iniciando análisis con servicios unificados');
    console.log(`📝 Idioma: ${language}`);
    console.log(`📏 Longitud del contenido: ${textContent.length} caracteres`);

    let chatgptError = null;

    // 1. Intentar con ChatGPT primero (gpt-4o-mini)
    try {
      console.log('🤖 [1/2] Intentando con ChatGPT (gpt-4o-mini)...');
      const result = await this.chatgptService.getResponse(textContent, language);
      console.log('✅ ChatGPT exitoso - análisis completado');
      
      return {
        ...result,
        fallbackUsed: false,
        attemptedProviders: ['ChatGPT']
      };

    } catch (error) {
      chatgptError = error;
      console.warn('❌ ChatGPT falló:', error.message);
      console.log('🔄 Iniciando fallback a Mistral...');
    }

    // 2. Fallback a Mistral (mistral-small)
    try {
      console.log('🤖 [2/2] Fallback a Mistral (mistral-small)...');
      const result = await this.mistralService.getResponse(textContent, language);
      console.log('✅ Mistral exitoso - análisis completado con fallback');
      
      return {
        ...result,
        fallbackUsed: true,
        attemptedProviders: ['ChatGPT', 'Mistral']
      };

    } catch (mistralError) {
      console.error('❌ Mistral también falló:', mistralError.message);
      console.error('💥 Ambos servicios de IA han fallado');
      
      // Error final - ambos servicios fallaron
      return {
        success: false,
        error: 'Ambos servicios de IA están temporalmente no disponibles. Por favor, inténtalo de nuevo en unos minutos.',
        details: {
          chatgpt_error: chatgptError?.message || 'Error desconocido',
          mistral_error: mistralError.message,
          attemptedProviders: ['ChatGPT', 'Mistral'],
          allServicesFailed: true
        }
      };
    }
  }

  /**
   * Obtiene estadísticas del último análisis
   * @returns {Object} - Estadísticas de uso
   */
  getStats() {
    return {
      availableProviders: ['ChatGPT', 'Mistral'],
      primaryProvider: 'ChatGPT (gpt-4o-mini)',
      fallbackProvider: 'Mistral (mistral-small)',
      emergencyFallback: 'None' // Sin fallback de emergencia
    };
  }

  /**
   * Verifica si las API keys están configuradas
   * @returns {Object} - Estado de configuración
   */
  checkConfiguration() {
    // Ya no necesitamos verificar claves API en el frontend
    // El backend maneja toda la configuración de forma segura
    const config = {
      chatgpt: true, // Siempre disponible a través del backend
      mistral: true  // Siempre disponible a través del backend
    };

    return {
      ...config,
      allConfigured: config.chatgpt && config.mistral,
      missingKeys: Object.keys(config).filter(key => !config[key])
    };
  }
}

// Exportar instancia singleton
export default new UnifiedAIService();