/**
 * ContentFilterHandler.js - Manejo de filtros de contenido de Azure OpenAI
 * 
 * Este módulo implementa estrategias para minimizar los errores de content filtering
 * y proporciona manejo robusto de errores cuando ocurren.
 */

// Diccionario de palabrotas/malsonantes por idioma (extraído de Analisis_top.js)
const PALABRAS_MALSONANTES = {
  es: [
    // Tier 1 (suaves)
    'joder', 'jolines', 'jopé', 'jope', 'jobar',
    'mierda', 'miércoles', 'mierdecilla',
    'cabrón', 'cabreo', 'cabronada', 'cabronazo',
    'coño', 'coñe', 'coñazo', 'coñoñazo',
    'hostia', 'ostras', 'hostias', 'ostiaputa',
    'leches', 'mecagüen', 'mecago', 'cagada',
    'gilipollas', 'gilipichis', 'gilipollo', 'gili',
    'tonto', 'idiota', 'imbécil', 'subnormal',
    'puto', 'puta', 'putada', 'putísimo',
    'follar', 'jodido', 'jodida', 'jodiendo',
    'cojones', 'huevos', 'pelotas', 'carajo',
    'hijo de puta', 'hijoputa', 'hdp', 'hp',
    'maricón', 'marica', 'mariconazo', 'bollera',
    'zorra', 'zorrita', 'zorron', 'guarra',
    'capullo', 'capullito', 'capullazo', 'mamón',

    // Tier 2 (moderadas)
    'me cago en', 'me cago', 'cagarse', 'cagar',
    'que te den', 'vete a tomar', 'que os jodan',
    'gilipolleces', 'gilipollez', 'chorrada', 'parida',
    'borra eso', 'elimina', 'quita eso', 'censura',
    'mamar', 'mamada', 'mamadas', 'chupada',
    'pedazo de', 'trozo de', 'eres un', 'sois unos',
    'vaya mierda', 'qué asco', 'es una puta',
    'hacer el', 'haciendo el', 'haces el', 'que haga',

    // Tier 3 (más fuertes)
    'maldito', 'maldita', 'maldición', 'maldita sea',
    'desgraciado', 'desgraciada', 'sinvergüenza',
    'bastardo', 'bastarda', 'cabrona', 'hijaputa',
    'que le den', 'que se joda', 'que os den',
    'por el culo', 'por culo', 'culo', 'ojete',
    'cojonudo', 'cojonuda', 'acojonante', 'acojona',
    'la hostia', 'te parto', 'te reviento', 'te mato',
    'me suda', 'me da igual', 'me importa', 'que se'
  ],

  en: [
    // Basic profanity
    'fuck', 'fucking', 'fucked', 'fucker', 'motherfucker',
    'shit', 'bullshit', 'shitty', 'shithead', 'dipshit',
    'damn', 'goddamn', 'dammit', 'god damn',
    'bitch', 'bitchy', 'son of a bitch', 'bastard',
    'asshole', 'ass', 'dumbass', 'smartass',
    'crap', 'crappy', 'piece of crap', 'full of crap',
    'hell', 'what the hell', 'go to hell', 'like hell',
    'piss', 'pissed', 'pissed off', 'piss off',

    // Stronger profanity
    'cunt', 'cock', 'dick', 'dickhead', 'prick',
    'pussy', 'twat', 'slut', 'whore', 'skank',
    'retard', 'retarded', 'stupid', 'idiot', 'moron',
    'loser', 'pathetic', 'worthless', 'useless',
    'shut up', 'shut the fuck up', 'stfu',
    'kill yourself', 'go die', 'drop dead',
    'hate', 'i hate', 'fucking hate', 'hate you'
  ],

  fr: [
    'merde', 'putain', 'bordel', 'connard', 'connasse',
    'salaud', 'salope', 'fils de pute', 'enfoiré',
    'ta gueule', 'ferme ta gueule', 'con', 'conne',
    'crétin', 'débile', 'abruti', 'idiot', 'imbécile',
    'chiant', 'relou', 'emmerdant', 'fait chier',
    'nique', 'niquer', 'baise', 'baiser', 'foutre',
    'cul', 'bite', 'couilles', 'chatte', 'salaud'
  ],

  de: [
    'scheiße', 'verdammt', 'arschloch', 'idiot', 'blödmann',
    'hurensohn', 'fotze', 'miststück', 'bastard',
    'halt die fresse', 'maul halten', 'dumm', 'bescheuert',
    'fick', 'ficken', 'verfickt', 'kacke', 'mist'
  ],

  it: [
    'merda', 'cazzo', 'stronzo', 'bastardo', 'figlio di puttana',
    'vaffanculo', 'porco dio', 'madonna', 'coglione',
    'idiota', 'stupido', 'imbecille', 'testa di cazzo',
    'fottere', 'scopare', 'troia', 'puttana', 'zoccola'
  ],

  pt: [
    'merda', 'porra', 'caralho', 'filho da puta', 'filha da puta',
    'vai se foder', 'puta que pariu', 'desgraça', 'cuzão',
    'idiota', 'burro', 'imbecil', 'otário', 'babaca',
    'cacete', 'buceta', 'cu', 'pinto', 'rola'
  ],

  ca: [
    'merda', 'collons', 'fill de puta', 'cabró', 'imbècil',
    'idiota', 'estúpid', 'que et fotin', 'vés a fer punyetes',
    'cony', 'ostres', 'cagar', 'pixar'
  ],

  eu: [
    'kaka', 'putain', 'idiota', 'ergel', 'txakur',
    'zakar', 'puta', 'kaka zaharra', 'zoramena'
  ]
};

// Configuración para OpenAI API (GPT-4 mini fallback)
const OPENAI_CONFIG = {
  baseURL: 'https://api.openai.com/v1',
  model: 'gpt-4o-mini',
  maxTokens: 4000,
  temperature: 0.7
};

/**
 * Clase para manejar errores de content filtering
 */
export class ContentFilterHandler {
// Método removido - ya no se sanitiza el contenido en el intento inicial

  /**
   * Detecta si un error es por content filtering
   * @param {Error} error - Error a verificar
   * @returns {boolean} - true si es error de content filtering
   */
  static isContentFilterError(error) {
    if (!error) return false;
    
    const errorMessage = error.message || '';
    const errorString = error.toString() || '';
    const errorName = error.name || '';
    
    // Detectar todos los tipos de errores de content filtering
    const contentFilterPatterns = [
      'content management policy',
      'content filter',
      'filtered due to',
      'response was filtered',
      'prompt triggering Azure OpenAI\'s content management policy',
      'BadRequestError: 400 The response was filtered',
      'content filtering',
      'content policy violation',
      'inappropriate content detected'
    ];
    
    return contentFilterPatterns.some(pattern => 
      errorMessage.toLowerCase().includes(pattern.toLowerCase()) ||
      errorString.toLowerCase().includes(pattern.toLowerCase()) ||
      errorName.toLowerCase().includes(pattern.toLowerCase())
    );
  }

// Método removido - ya no se modifica el prompt original

  /**
   * Sanitiza contenido específico para fallback por idioma
   * @param {string} content - Contenido original
   * @param {string} language - Idioma ('es', 'en', 'fr', etc.)
   * @returns {string} - Contenido sanitizado para el idioma específico
   */
  static sanitizeContentForFallback(content, language = 'es') {
    if (!content) return content;
    
    const palabras = PALABRAS_MALSONANTES[language] || PALABRAS_MALSONANTES.es;
    let sanitized = content;
    
    // Reemplazar palabrotas específicas del idioma
    palabras.forEach(palabra => {
      const regex = new RegExp(`\\b${palabra.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      sanitized = sanitized.replace(regex, '[CENSURADO]');
    });
    
    // Sanitización ULTRA-AGRESIVA para evitar content filtering
    sanitized = sanitized
      // Palabras de violencia extrema
      .replace(/\b(kill|murder|die|death|violence|terrorist|bomb|explosion|attack|rape|assault)\b/gi, '[CENSURADO]')
      .replace(/\b(killing|murdering|dying|violent|bombing|exploding|attacking|raping)\b/gi, '[CENSURADO]')
      
      // Frases peligrosas completas
      .replace(/\b(kill you|kill them|kill all|murder you|rape all|terrorist attack)\b/gi, '[CENSURADO]')
      .replace(/\b(bomb explosion|violence death|death murder)\b/gi, '[CENSURADO]')
      
      // Amenazas específicas
      .replace(/\b(i will kill|going to kill|voy a matar|vamos a matar|vamos a violar)\b/gi, '[CENSURADO]')
      .replace(/\b(asesinar|violar|matar a todos)\b/gi, '[CENSURADO]')
      
      // Reducir mayúsculas agresivas
      .replace(/([A-Z]{4,})/g, match => match.charAt(0) + match.slice(1).toLowerCase())
      .replace(/([!?]{3,})/g, '.')
      
      // Eliminar secuencias de palabras peligrosas juntas
      .replace(/\b(fucking.*?shit|goddamn.*?motherfucking)\b/gi, '[CENSURADO]')
      .replace(/\b(hijo.*?puta.*?cabrones)\b/gi, '[CENSURADO]')
      
      .substring(0, 8000);
    
    return sanitized;
  }

  /**
   * Fallback a GPT-4 mini cuando Azure OpenAI falla por content filtering
   * @param {string} prompt - Prompt original (sin cambios)
   * @param {string} content - Contenido del chat a analizar
   * @param {string} language - Idioma del análisis
   * @returns {Promise<Object>} - Resultado del análisis
   */
  static async fallbackToGPT4Mini(prompt, content, language = 'es') {
    console.log('🚨🔄 ===== INICIANDO FALLBACK A GPT-4 MINI =====');
    console.log(`🚨 Motivo: Azure OpenAI content filtering`);
    console.log(`🚨 Idioma: ${language}`);
    console.log(`🚨 Longitud del contenido original: ${content.length} caracteres`);
    
    try {
      // Registrar estadísticas
      this.stats.logFallbackUsed();
      console.log(`📊 Estadísticas actualizadas - fallbacks usados: ${this.stats.fallbackUsed}`);
      
      // Sanitizar el contenido usando las palabrotas específicas del idioma
      const sanitizedContent = this.sanitizeContentForFallback(content, language);
      
      console.log(`📝 Contenido sanitizado para idioma: ${language}`);
      console.log(`📏 Longitud original: ${content.length}, sanitizada: ${sanitizedContent.length}`);

      // Configuración para GPT-4 mini
      const openaiApiKey = process.env.REACT_APP_OPENAI_API_KEY;
      
      if (!openaiApiKey) {
        console.error('❌ REACT_APP_OPENAI_API_KEY no está configurada');
        throw new Error('REACT_APP_OPENAI_API_KEY no está configurada para el fallback');
      }

      console.log('🤖 Conectando a OpenAI GPT-4 mini...');
      console.log(`🔗 URL base: ${OPENAI_CONFIG.baseURL}`);
      console.log(`🧠 Modelo: ${OPENAI_CONFIG.model}`);

      // Llamada a OpenAI API
      const response = await fetch(`${OPENAI_CONFIG.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`
        },
        body: JSON.stringify({
          model: OPENAI_CONFIG.model,
          messages: [
            {
              role: 'user',
              content: `${prompt}\n\nCONTENIDO A ANALIZAR:\n${sanitizedContent}`
            }
          ],
          max_tokens: OPENAI_CONFIG.maxTokens,
          temperature: OPENAI_CONFIG.temperature
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      if (!result.choices || !result.choices[0]) {
        throw new Error('Respuesta vacía de OpenAI API');
      }

      console.log('✅ ===== FALLBACK EXITOSO =====');
      console.log('✅ Respuesta de GPT-4 mini recibida correctamente');
      console.log(`📊 Tokens usados: ${result.usage?.total_tokens || 'N/A'}`);
      console.log(`📊 Modelo usado: ${result.model}`);
      console.log(`📏 Longitud de respuesta: ${result.choices[0].message.content.length} caracteres`);
      
      // Formatear respuesta para que sea compatible con el formato esperado
      const formattedResponse = {
        choices: [{
          message: {
            content: result.choices[0].message.content
          },
          finish_reason: result.choices[0].finish_reason
        }],
        usage: result.usage,
        model: result.model,
        fallback_used: true,
        original_language: language
      };
      
      console.log('🔄 Respuesta formateada para compatibilidad con Azure OpenAI');
      return formattedResponse;

    } catch (error) {
      console.error('❌ Error en fallback a GPT-4 mini:', error);
      if (error.message && error.message.includes('content management policy')) {
        throw error;
      }
      throw new Error(`Fallback failed: ${error.message}`);
    }
  }

  /**
   * Estrategia simplificada: un intento con prompt y contenido originales
   * Si falla por content filtering → fallback GPT-4 mini inmediato
   * Si falla por otros motivos → propagar error para que AzureService pruebe siguiente modelo
   * @param {Function} apiCall - Función que hace la llamada a la API
   * @param {string} prompt - Prompt original de constants.js (sin modificar)
   * @param {string} content - Contenido original (sin sanitizar)
   * @param {string} language - Idioma del análisis
   * @returns {Promise<Object>} - Resultado del análisis
   */
  static async retryWithFallback(apiCall, prompt, content, language = 'es') {
    // Registrar estadísticas
    this.stats.logRequest();
    console.log(`🔄 ContentFilterHandler: intento único con prompt y contenido originales - idioma: ${language}`);
    
    try {
      // Intento único: prompt original de constants.js + contenido original sin sanitizar
      console.log('🔄 Usando prompt original de constants.js + contenido sin sanitizar');
      const result = await apiCall(prompt, content);
      console.log('✅ Éxito - sin fallback necesario');
      return result;
      
    } catch (error) {
      console.log(`❌ Falló: ${error.message}`);
      console.log(`🔍 Tipo de error: ${error.name}, Status: ${error.status || error.statusCode}`);
      
      // Si es error de content filtering → fallback GPT-4 mini inmediato
      if (this.isContentFilterError(error)) {
        this.stats.logFiltered();
        console.log('🚨 CONTENT FILTERING detectado → Activando fallback GPT-4 mini');
        console.log(`🚨 Error completo: ${JSON.stringify({
          name: error.name,
          message: error.message,
          status: error.status || error.statusCode,
          toString: error.toString()
        }, null, 2)}`);
        return await this.fallbackToGPT4Mini(prompt, content, language);
      }
      
      // Si es otro tipo de error → propagar para que AzureService pruebe siguiente modelo
      console.log('🔄 No es content filtering → Propagando error para que AzureService pruebe siguiente modelo');
      throw error;
    }
  }

// Métodos removidos - ya no se modifican prompts ni se sanitiza contenido en el intento inicial

  /**
   * Estadísticas de filtrado para monitoreo
   */
  static stats = {
    totalRequests: 0,
    filteredRequests: 0,
    fallbackUsed: 0,
    
    logRequest() {
      this.totalRequests++;
    },
    
    logFiltered() {
      this.filteredRequests++;
    },

    logFallbackUsed() {
      this.fallbackUsed++;
    },
    
    getFilterRate() {
      return this.totalRequests > 0 ? (this.filteredRequests / this.totalRequests) * 100 : 0;
    },

    getFallbackRate() {
      return this.totalRequests > 0 ? (this.fallbackUsed / this.totalRequests) * 100 : 0;
    }
  };

  /**
   * Método de prueba para verificar la detección de errores de content filtering
   * @param {string} errorMessage - Mensaje de error a probar
   * @returns {boolean} - true si se detecta como content filtering
   */
  static testContentFilterDetection(errorMessage) {
    const testError = new Error(errorMessage);
    testError.name = 'BadRequestError';
    testError.status = 400;
    
    const isDetected = this.isContentFilterError(testError);
    console.log(`🧪 Test de detección:`);
    console.log(`   Error: "${errorMessage}"`);
    console.log(`   Detectado como content filtering: ${isDetected}`);
    
    return isDetected;
  }
} 