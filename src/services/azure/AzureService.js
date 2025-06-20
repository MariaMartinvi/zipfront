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
  TRUNCATION_MESSAGES,
  detectResponseLanguage,
  createReverseTranslationMapping
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
      
      // Preparar el contenido del usuario
      let userContent = textContent;
      const contentLength = userContent.length;
      
      // Obtener el prompt en el idioma correspondiente
      const systemPrompt = PROMPTS[language] || PROMPTS['es'];
      const userPrefix = USER_PREFIXES[language] || USER_PREFIXES['es'];
      
      // Preparar los mensajes para la API
      const messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: `${userPrefix}\n\n${userContent}` }
      ];
      
      // Seleccionar el modelo óptimo
      const { model, temperature } = selectOptimalModel(contentLength);
      
      // Preparar la lista de APIs a intentar
      const apisToTry = ALTERNATIVE_APIS.map(api => ({
        ...api,
        endpoint: api.endpoint || defaultEndpoint,
        key: api.keyVariable ? getEnvVariable(api.keyVariable) : apiKey
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
          // Construir URL según el tipo de endpoint
          let baseURL;
          let fullUrl;
          
          if (api.endpoint.includes('services.ai.azure.com')) {
            // Azure AI Services (Deepseek R1) - usar endpoint tal como viene
            baseURL = api.endpoint;
            fullUrl = `${baseURL}?api-version=${api.apiVersion}`;
          } else {
            // Formato estándar de Azure OpenAI
            let endpoint = api.endpoint;
            if (!endpoint.endsWith('/')) {
              endpoint += '/';
            }
            baseURL = `${endpoint}openai/deployments/${api.model}`;
            fullUrl = `${baseURL}/chat/completions?api-version=${api.apiVersion}`;
          }
          
          console.log(`>>> URL completa para ${api.name}: ${fullUrl} (API version: ${api.apiVersion})`);
          
          // Calcular timeout para este modelo
          const timeoutMs = api.model === 'DeepSeek-R1' ? 300000 : // 5 minutos para Deepseek R1
                           api.model === 'o3-mini' ? REQUEST_TIMEOUT * 3 : REQUEST_TIMEOUT;
          console.log(`>>> TIMEOUT configurado para ${api.name}: ${timeoutMs/1000} segundos`);
          
          // Configurar cliente según el tipo de servicio
          let clientConfig = {
            apiKey: api.key,
            baseURL: baseURL,
            defaultQuery: { "api-version": api.apiVersion || "2025-01-01-preview" },
            dangerouslyAllowBrowser: true,
            // Usar el timeout calculado
            timeout: timeoutMs
          };
          
          if (api.endpoint.includes('services.ai.azure.com')) {
            // Azure AI Services (Deepseek) - usar Authorization Bearer
            clientConfig.defaultHeaders = { 
              "Authorization": `Bearer ${api.key}`,
              "Content-Type": "application/json"
            };
          } else {
            // Azure OpenAI Service - usar api-key
            clientConfig.defaultHeaders = { "api-key": api.key };
          }
          
          const client = new OpenAI(clientConfig);
          
          // Hacer la solicitud a la API

          
          // Calcular max_tokens para este modelo
          const maxTokens = api.model === 'DeepSeek-R1' ? 8000 : 4000; // Más tokens para Deepseek R1
          console.log(`>>> MAX_TOKENS configurado para ${api.name}: ${maxTokens}`);
          
          // Preparar el cuerpo de la petición - usar el parámetro correcto según el modelo
          const requestBody = {
            model: api.model,
            messages: messages,
            ...(api.useTemperature !== false && { temperature: temperature })
          };
          
          // Usar el parámetro de tokens correcto según la configuración del modelo
          if (api.useMaxCompletionTokens === true) {
            requestBody.max_completion_tokens = maxTokens;
            console.log(`>>> Usando max_completion_tokens para ${api.name}`);
          } else {
            requestBody.max_tokens = maxTokens;
            console.log(`>>> Usando max_tokens para ${api.name}`);
          }
          
          const response = await client.chat.completions.create(requestBody);
          
          // Extraer respuesta
          responseText = response.choices[0].message.content;
          
          // NUEVO: Detectar el idioma de la respuesta de Azure
          const detectedLanguage = detectResponseLanguage(responseText);
          console.log(`🔍 IDIOMA DETECTADO en respuesta: ${detectedLanguage}`);
          
          // NUEVO: Guardar información del idioma detectado para el mapeo posterior
          window.lastAzureResponse = responseText;
          window.lastDetectedLanguage = detectedLanguage;
          
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
          } else if (error.name === 'APIConnectionError' || 
                    error.name === 'APIConnectionTimeoutError' ||
                    (error.message && error.message.includes("Failed to fetch")) ||
                    (error.message && error.message.includes("Connection error")) ||
                    (error.message && error.message.includes("Request timed out")) ||
                    error.code === 'ECONNREFUSED' || 
                    error.code === 'ENOTFOUND' || 
                    error.code === 'ECONNRESET') {
            // Errores de conexión/red/timeout, continuar con la siguiente API
            console.error(`>>> ERROR DE CONEXIÓN/TIMEOUT con ${api.name}: ${error.message || error.name}`);
            if (i < apisToTry.length - 1) {
              console.log(`>>> PROBLEMA DE CONECTIVIDAD/TIMEOUT - SALTANDO A: ${apisToTry[i+1].name} (${apisToTry[i+1].model})`);
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