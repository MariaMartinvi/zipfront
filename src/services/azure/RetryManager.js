/**
 * RetryManager.js - Gestor de reintentos para peticiones a Azure
 * 
 * Este módulo implementa un sistema de reintentos con backoff exponencial
 * para manejar errores temporales en las peticiones a Azure OpenAI.
 */

/**
 * Clase que gestiona reintentos con backoff exponencial
 */
export class RetryManager {
  /**
   * Constructor de RetryManager
   * @param {Object} options - Opciones de configuración
   * @param {number} options.maxRetries - Número máximo de reintentos (default: 3)
   * @param {number} options.initialDelay - Tiempo inicial de espera en ms (default: 15000)
   * @param {number} options.maxDelay - Tiempo máximo de espera en ms (default: 60000)
   */
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.initialDelay = options.initialDelay || 15000; // 15 segundos
    this.maxDelay = options.maxDelay || 60000; // 1 minuto
  }
  
  /**
   * Espera un tiempo especificado
   * @param {number} ms - Tiempo de espera en milisegundos
   * @returns {Promise} - Promesa que se resuelve después del tiempo especificado
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Calcula el tiempo de espera para el próximo intento
   * @param {number} retry - Número de intento actual
   * @returns {number} - Tiempo de espera en milisegundos
   */
  getBackoffTime(retry) {
    // Exponential backoff with jitter
    const backoff = Math.min(
      this.maxDelay,
      this.initialDelay * Math.pow(1.5, retry) * (1 + 0.2 * Math.random())
    );
    return Math.round(backoff);
  }
  
  /**
   * Determina si un error es recuperable (debe reintentarse)
   * @param {Error} error - Error producido
   * @returns {boolean} - true si es recuperable, false de lo contrario
   */
  isRecoverableError(error) {
    if (!error) return false;
    
    // Error de timeout
    if (error.message && (
        error.message.includes('timeout') || 
        error.message.includes('tiempo de espera') ||
        error.message.includes('ETIMEDOUT') ||
        error.message.includes('timed out')
    )) {
      return true;
    }
    
    // Rate limiting (429)
    if (error.status === 429 || error.statusCode === 429) {
      return true;
    }
    
    // Errores de servidor (5xx)
    if (error.status >= 500 && error.status < 600) {
      return true;
    }
    
    // Errores de red
    if (error.message && (
        error.message.includes('network') || 
        error.message.includes('ECONNREFUSED') ||
        error.message.includes('ECONNRESET') ||
        error.message.includes('EAI_AGAIN')
    )) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Ejecuta una función con reintentos
   * @param {Function} fn - Función a ejecutar
   * @returns {Promise} - Resultado de la función o error si fallan todos los intentos
   */
  async executeWithRetry(fn) {
    let lastError = null;
    
    for (let retry = 0; retry <= this.maxRetries; retry++) {
      try {
        if (retry > 0) {
          const backoffTime = this.getBackoffTime(retry);
          console.log(`Reintento ${retry}/${this.maxRetries+1} después de ${backoffTime/1000} segundos...`);
          await this.sleep(backoffTime);
        }
        
        // Ejecutar función
        return await fn();
      } catch (error) {
        lastError = error;
        console.error(`Error en intento ${retry+1}/${this.maxRetries+1}:`, error);
        
        // Si no es un error recuperable o es el último intento, no reintentar
        if (!this.isRecoverableError(error) || retry >= this.maxRetries) {
          console.error(`No se reintentará: ${!this.isRecoverableError(error) ? 'error no recuperable' : 'máximo de reintentos alcanzado'}`);
          break;
        }
      }
    }
    
    // Si llegamos aquí, todos los intentos fallaron
    throw lastError || new Error('La operación falló después de varios reintentos');
  }
}

export default RetryManager; 