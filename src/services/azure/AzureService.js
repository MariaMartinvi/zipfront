/**
 * AzureService.js - Servicio principal de Azure OpenAI
 * 
 * Este módulo implementa la comunicación con Azure OpenAI Services,
 * incluyendo sistema de fallback entre APIs y reintentos.
 * Es el equivalente en frontend del archivo chatgpt_integration.py del backend.
 */

import { getEnvVariable } from '../../fileService';
import { selectOptimalModel } from './ModelSelector';
import { RetryManager } from './RetryManager';
import { 
  ALTERNATIVE_APIS, 
  PROMPTS, 
  ERROR_MESSAGES, 
  USER_PREFIXES, 
  TRUNCATION_MESSAGES 
} from './constants';

// Timeout para peticiones (60 segundos) - IGUAL que en el backend
const REQUEST_TIMEOUT = 60000;

/**
 * Clase para gestionar la comunicación con Azure OpenAI
 */
export class AzureService {
  constructor() {
    this.retryManager = new RetryManager({
      maxRetries: 3,      // Número reducido de reintentos para backoff
      initialDelay: 15000, // Tiempo inicial de espera (15 segundos)
      maxDelay: 60000     // Tiempo máximo de espera (60 segundos)
    });
  }
  
  /**
   * Inicialización perezosa de OpenAI para no cargarlo hasta que sea necesario
   * @returns {Promise<Object>} - Cliente OpenAI
   */
  async getOpenAI() {
    if (!this.OpenAI) {
      const { OpenAI } = await import('openai');
      this.OpenAI = OpenAI;
    }
    return this.OpenAI;
  }

  /**
   * Espera un tiempo específico
   * @param {number} ms - Tiempo en milisegundos
   * @returns {Promise} - Promise que se resuelve después del tiempo indicado
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Obtiene la respuesta de Azure OpenAI para un texto
   * @param {string} textContent - Contenido del texto a analizar
   * @param {string} language - Idioma para el análisis (es, en, fr, etc.)
   * @returns {Promise<Object>} - Resultado del análisis
   */
  async getResponse(textContent, language = 'es') {
    try {
      console.error('🚨 INICIO getResponse');
      console.error('Texto recibido:', textContent);
      
      // Validar y normalizar el idioma
      if (!PROMPTS[language]) {
        console.warn(`Idioma no soportado: ${language}. Usando español por defecto.`);
        language = 'es';
      }
      
      // Obtener credenciales
      const defaultEndpoint = getEnvVariable('REACT_APP_AZURE_ENDPOINT');
      const apiKey = getEnvVariable('REACT_APP_AZURE_API_KEY');
      
      if (!defaultEndpoint || !apiKey) {
        console.error('No hay credenciales de Azure configuradas');
        const errorMsg = ERROR_MESSAGES[language]?.no_api_key || 
                        "Error: Azure API key not configured.";
        return {
          success: false,
          error: errorMsg
        };
      }
      
      // Preparar el contenido del usuario (truncar si es necesario)
      let userContent = textContent;
      const contentLength = userContent.length;
      
      console.error('🔍 PREPARANDO CONTENIDO');
      console.error('Longitud del texto:', contentLength);
      
      // Límite uniforme de 40,000 caracteres para todos los modelos
      if (contentLength > 40000) {
        console.warn(`Contenido muy grande (${contentLength} caracteres), truncando a 40,000`);
        const truncationMsg = TRUNCATION_MESSAGES[language]?.long || 
                             "This is an extract from a very long conversation...";
        userContent = truncationMsg + "\n\n" + userContent.slice(-40000);
        console.log(`Contenido truncado a ${userContent.length} caracteres`);
      }
      
      // Obtener el prompt en el idioma correspondiente
      const systemPrompt = PROMPTS[language] || PROMPTS['es'];
      const userPrefix = USER_PREFIXES[language] || USER_PREFIXES['es'];
      
      // Preparar los mensajes para la API
      const messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: `${userPrefix}\n\n${userContent}` }
      ];

      // Guardar el chat localmente antes de enviarlo
      await saveChatLocally({
        timestamp: new Date().toISOString(),
        messages: messages,
        language: language,
        contentLength: contentLength
      });
      
      // Seleccionar el modelo óptimo
      const { model, temperature } = selectOptimalModel(contentLength);
      
      // Preparar la lista de APIs a intentar
      const apisToTry = ALTERNATIVE_APIS.map(api => ({
        ...api,
        endpoint: api.endpoint || defaultEndpoint,
        key: apiKey
      }));
      
      // Añadir la API principal al inicio
      apisToTry.unshift({
        name: `Principal (${model})`,
        endpoint: defaultEndpoint,
        key: apiKey,
        model: model,
        apiVersion: "2025-01-01-preview"
      });
      
      console.log(`APIs disponibles para fallback: ${apisToTry.length}`);
      for (let i = 0; i < apisToTry.length; i++) {
        console.log(`  ${i+1}. ${apisToTry[i].name} - modelo: ${apisToTry[i].model} - API version: ${apisToTry[i].apiVersion}`);
      }
      
      // Importar OpenAI
      const OpenAI = await this.getOpenAI();
      
      // Variables para tracking
      let responseText = null;
      
      // Intentar cada API disponible
      for (let i = 0; i < apisToTry.length; i++) {
        const api = apisToTry[i];
        console.log(`>>> INTENTANDO CON: ${api.name} (${i+1}/${apisToTry.length})`);
        
        try {
          // Verificar si el endpoint termina en /
          let endpoint = api.endpoint;
          if (!endpoint.endsWith('/')) {
            endpoint += '/';
          }
          
          // Construir la URL base
          const baseURL = `${endpoint}openai/deployments/${api.model}`;
          
          // Construir la URL completa para el log
          const fullUrl = `${baseURL}/chat/completions?api-version=${api.apiVersion}`;
          console.log(`>>> URL completa para ${api.name}: ${fullUrl} (API version: ${api.apiVersion})`);
          
          // Inicializar cliente OpenAI
          const client = new OpenAI({
            apiKey: api.key,
            baseURL: baseURL,
            defaultQuery: { "api-version": api.apiVersion || "2025-01-01-preview" },
            defaultHeaders: { "api-key": api.key },
            dangerouslyAllowBrowser: true,
            // Usar un timeout mayor para o3-mini
            timeout: api.model === 'o3-mini' ? REQUEST_TIMEOUT * 2 : REQUEST_TIMEOUT
          });
          
          // Hacer la solicitud a la API
          console.error('🚀 ENVIANDO A AZURE');
          console.error('API:', api.name);
          console.error('Modelo:', api.model);
          console.error('URL:', baseURL);
          
          // Añadir logs detallados del contenido que se envía
          console.error('='.repeat(80));
          console.error('📝 SYSTEM PROMPT:');
          console.error(systemPrompt);
          console.error('='.repeat(80));
          console.error('👤 USER PREFIX:');
          console.error(userPrefix);
          console.error('='.repeat(80));
          console.error('💬 USER CONTENT:');
          console.error(userContent);
          console.error('='.repeat(80));
          console.error(`📊 Longitud total del texto: ${userContent.length} caracteres`);
          console.error('='.repeat(80));
          
          const response = await client.chat.completions.create({
            model: api.model,
            messages: messages,
            temperature: temperature,
            max_tokens: 4000
          });
          
          // Log de respuesta exitosa
          console.error(`✅ RESPUESTA RECIBIDA de ${api.name}`);
          console.error('Respuesta:', response.choices[0].message.content);
          
          // Extraer respuesta
          responseText = response.choices[0].message.content;
          
          // Añadir información sobre la API utilizada
          const apiHeader = `*****************************************************\n* API UTILIZADA: ${api.name}\n*****************************************************\n\n`;
          responseText = apiHeader + responseText;
          
          console.log(`>>> ÉXITO con ${api.name}`);
          
          // Éxito! Salir del bucle
          break;
          
        } catch (error) {
          console.error(`>>> ERROR con ${api.name} (${api.model}):`, error);
          
          if (error.status === 429 || error.statusCode === 429) {
            // Rate limit, continuar con la siguiente API
            console.log(`>>> LÍMITE ALCANZADO con ${api.name} - Probando siguiente API...`);
            if (i < apisToTry.length - 1) {
              console.log(`>>> SALTANDO A: ${apisToTry[i+1].name} (${apisToTry[i+1].model})`);
            }
            continue;
          } else if (error.status === 404 || error.statusCode === 404 ||
                    (error.message && error.message.includes("not found"))) {
            // Modelo no encontrado, continuar con la siguiente API
            console.error(`>>> MODELO NO ENCONTRADO en ${api.name}: ${error.message}`);
            if (i < apisToTry.length - 1) {
              console.log(`>>> SALTANDO A: ${apisToTry[i+1].name} (${apisToTry[i+1].model})`);
            }
            continue;
          } else if (error.message && error.message.includes("exceeded token rate limit")) {
            // Error específico de límite de token, similar al 429
            console.log(`>>> LÍMITE DE TOKENS EXCEDIDO con ${api.name} - Probando siguiente API...`);
            if (i < apisToTry.length - 1) {
              console.log(`>>> SALTANDO A: ${apisToTry[i+1].name} (${apisToTry[i+1].model})`);
            }
            continue;
          } else {
            // Para otros errores, si hay más APIs, continuar
            if (i < apisToTry.length - 1) {
              console.log(`>>> ERROR GENERAL con ${api.name}, probando siguiente API: ${apisToTry[i+1].name}`);
              continue;
            }
            // Si es la última API, propagar el error
            throw error;
          }
        }
      }
      
      return {
        success: true,
        response: responseText
      };
    } catch (error) {
      console.error('❌ ERROR EN getResponse:', error);
      return {
        success: false,
        error: error.message || "Error: An error occurred."
      };
    }
  }
}

// Exportar una instancia singleton
export default new AzureService();