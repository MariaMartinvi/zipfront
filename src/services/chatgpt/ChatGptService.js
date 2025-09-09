/**
 * ChatGptService.js - Servicio para OpenAI ChatGPT
 * 
 * Este servicio maneja las llamadas directas a la API de OpenAI
 * usando gpt-4o-mini como modelo principal.
 */

import { PROMPTS } from '../azure/constants';

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
    const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('REACT_APP_OPENAI_API_KEY no está configurada en las variables de entorno');
    }

    // Usar los mismos prompts que Azure
    const prompt = PROMPTS[language] || PROMPTS['es'];
    
    console.log(`🤖 ChatGPT: Procesando texto de ${textContent.length} caracteres en idioma: ${language}`);

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: prompt },
            { role: 'user', content: textContent }
          ],
          max_tokens: this.maxTokens,
          temperature: this.temperature
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const result = await response.json();
      
      if (!result.choices || !result.choices[0] || !result.choices[0].message) {
        throw new Error('Respuesta vacía o malformada de OpenAI API');
      }

      console.log(`✅ ChatGPT: Respuesta recibida exitosamente (${result.choices[0].message.content.length} caracteres)`);

      return {
        success: true,
        response: result.choices[0].message.content,
        provider: 'OpenAI',
        model: this.model,
        usage: result.usage
      };

    } catch (error) {
      console.error(`❌ ChatGPT Error:`, error.message);
      throw error;
    }
  }
}

// Exportar instancia singleton
export default new ChatGptService(); 