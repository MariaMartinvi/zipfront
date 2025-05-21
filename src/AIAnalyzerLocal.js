/**
 * AIAnalyzerLocal.js
 * Versión experimental para usar modelos locales
 * Utiliza Transformers.js con modelos locales para análisis real de texto
 */

import { useEffect, useState } from 'react';
import { pipeline, env } from '@xenova/transformers';

// Configurar el entorno de Transformers.js para usar modelos remotos
env.allowLocalModels = true; // Permitir modelos locales y remotos 
env.localModelPath = './public/models'; // Ruta a la carpeta models (por si acaso)
env.useBrowserCache = true;  // Activar cache del navegador
env.customRequestHeaders = {}; // Asegurar que no haya cabeceras personalizadas problemáticas

// Habilitar back-ends más rápidos cuando estén disponibles
try {
  if (env.backends?.webgpu) {
    env.backends.webgpu.enabled = true; // WebGPU mejora mucho la velocidad en navegadores compatibles
  }
  if (env.backends?.onnx?.wasm) {
    const cores = navigator.hardwareConcurrency || 4;
    env.backends.onnx.wasm.numThreads = Math.min(4, Math.max(1, Math.floor(cores / 2)));
  }
} catch (e) {
  console.warn('[AI DEBUG] No se pudo configurar WebGPU/threads WASM:', e);
}

// Función para extraer características de los participantes
function extractParticipantFeatures(stats) {
  const participantsData = [];
  
  if (!stats || !stats.sender_counts) {
    return participantsData;
  }
  
  // Ordenar participantes por cantidad de mensajes
  const participantsRanked = Object.entries(stats.sender_counts || {})
    .sort(([, countA], [, countB]) => countB - countA);
  
  const totalMessages = stats.total_messages || 0;
  
  // Extraer características para cada participante
  participantsRanked.forEach(([name, messageCount], index) => {
    const percentage = Math.round((messageCount / totalMessages) * 100);
    
    // Obtener ejemplos de mensajes
    const examples = stats.message_examples && stats.message_examples[name] 
      ? stats.message_examples[name] 
      : [];
      
    // Calcular longitud promedio de mensajes
    const avgLength = examples.length > 0 
      ? examples.reduce((sum, msg) => sum + msg.length, 0) / examples.length 
      : 0;
      
    // Calcular uso de emojis
    const emojiCount = examples.length > 0
      ? examples.reduce((count, msg) => count + (msg.match(/[\u{1F300}-\u{1F6FF}\u{2600}-\u{26FF}]/gu) || []).length, 0)
      : 0;
      
    // Crear objeto de características
    participantsData.push({
      name,
      messageCount,
      percentage,
      messageRank: index + 1,
      avgMessageLength: Math.round(avgLength),
      emojiUsage: emojiCount / Math.max(1, examples.length),
      examples,
      // Características derivadas
      isVerbose: avgLength > 25,
      isFrequentPoster: percentage > 30,
      usesEmojis: emojiCount > examples.length * 0.2
    });
  });
  
  return participantsData;
}

// Clase para análisis de chat usando modelo local
class AIAnalyzerLocal {
  constructor() {
    this.initialized = false;
    this.isInitializing = false;
    this.MODEL_NAME = 'Xenova/bert-base-multilingual-uncased-sentiment';
    this.NER_MODEL_NAME = 'Davlan/distilbert-base-multilingual-cased-ner-hrl'; // Usar modelo remoto de Hugging Face
    this.initPromise = null; // Promesa para la inicialización
    
    // Cache local para resultados
    this.cache = new Map();
    // Tiempo de expiración del cache (1 hora)
    this.CACHE_EXPIRY = 60 * 60 * 1000;
    
    this.sentimentPipeline = null;
    this.nerPipeline = null; // Nuevo pipeline NER
    this.modelConfig = {
      quantized: true,
      revision: 'main',
      cache: true,
      minimalFootprint: true,
      progress_callback: (progress) => {
        if (typeof progress === 'number') {
          console.log('Progreso de carga del modelo:', Math.round(progress * 100) + '%');
        }
      }
    };
    
    this.fallbackAnalysis = this.fallbackAnalysis.bind(this);
    
    // Registrar configuración para depuración
    console.log('[AI DEBUG] Configuración de modelo remoto (AIAnalyzerLocal):', {
      allowLocalModels: env.allowLocalModels,
      localModelPath: env.localModelPath,
      modelName: this.NER_MODEL_NAME
    });
  }

  // Método para obtener resultado del cache
  getCachedResult(message) {
    const cached = this.cache.get(message);
    if (cached && Date.now() - cached.timestamp < this.CACHE_EXPIRY) {
      console.log('Usando resultado cacheado para:', message);
      return cached.result;
    }
    return null;
  }

  // Método para guardar resultado en cache
  setCachedResult(message, result) {
    this.cache.set(message, {
      result,
      timestamp: Date.now()
    });
  }

  async initialize() {
    // Si ya está inicializado, no hacer nada.
    if (this.initialized) {
      console.log('[AI DEBUG] Already initialized.');
      return;
    }

    // Si la inicialización ya está en curso por otra llamada, esperar a esa promesa.
    if (this.initPromise) {
      console.log('[AI DEBUG] Initialization already in progress, awaiting...');
      return this.initPromise;
    }

    console.log('[AI DEBUG] Starting new initialization process (AIAnalyzerLocal)...');
    this.isInitializing = true;

    // Crear y asignar la promesa de inicialización.
    this.initPromise = (async () => {
      try {
        console.log('[AI DEBUG] Initializing models (pipeline calls)...');
        
        // Configurar específicamente para el modelo NER de Hugging Face
        const nerConfig = {
          ...this.modelConfig,
          quantized: true,
          aggregation_strategy: 'simple',
          local: false // Usar modelo remoto de Hugging Face
        };
        
        console.log('[AI DEBUG] Configuración para NER pipeline de Hugging Face:', nerConfig);
        console.log('[AI DEBUG] Intentando cargar modelo de Hugging Face:', this.NER_MODEL_NAME);

        // Cargar ambos modelos en paralelo
        const [sentimentPipelineResult, nerPipelineResult] = await Promise.allSettled([
          pipeline('sentiment-analysis', this.MODEL_NAME, this.modelConfig),
          pipeline('token-classification', this.NER_MODEL_NAME, nerConfig)
        ]);

        let sentimentError = null;
        let nerError = null;

        if (sentimentPipelineResult.status === 'fulfilled') {
          this.sentimentPipeline = sentimentPipelineResult.value;
          console.log('[AI DEBUG] Sentiment pipeline creation successful.');
        } else {
          sentimentError = sentimentPipelineResult.reason;
          console.error('[AI DEBUG] Error creating sentiment pipeline:', sentimentError);
          this.sentimentPipeline = null;
        }

        if (nerPipelineResult.status === 'fulfilled') {
          this.nerPipeline = nerPipelineResult.value;
          console.log('[AI DEBUG] NER pipeline (remote) creation successful!');
        } else {
          nerError = nerPipelineResult.reason;
          console.error('[AI DEBUG] Error creating remote NER pipeline:', nerError);
          this.nerPipeline = null;
        }

        // Si alguno de los modelos falla en su inicialización, lanzamos un error.
        if (sentimentError || nerError) {
          const errorMessages = [];
          if (sentimentError) errorMessages.push(`Sentiment: ${sentimentError.message || sentimentError}`);
          if (nerError) errorMessages.push(`NER: ${nerError.message || nerError}`);
          throw new Error(`Failed to initialize models: ${errorMessages.join('; ')}`);
        }
        
        this.initialized = true;
        console.log('Modelos inicializados correctamente (AIAnalyzerLocal)');
      } catch (pipelineError) {
        console.error('[AI DEBUG] Error during model initialization process in AIAnalyzerLocal:', pipelineError);
        this.sentimentPipeline = null;
        this.nerPipeline = null;
        this.initialized = false; 
        this.initPromise = null;
        throw pipelineError; 
      } finally {
        this.isInitializing = false;
      }
    })();

    try {
      await this.initPromise;
    } catch (e) {
      // El error ya fue logueado. Aquí solo nos aseguramos de que el método initialize propague el error.
      // this.initPromise ya se habrá limpiado si pipelineError ocurrió.
      console.error('[AI DEBUG] Initialization promise rejected in AIAnalyzerLocal:', e.message);
      throw e; // Propagar el error para que useAIAnalyzerLocal lo maneje
    }
  }

  // Análisis de mensajes con soporte multilingüe
  async analyzeMessage(message) {
    try {
      // Si el mensaje es "<Media omitted>", no lo procesamos con la IA.
      if (message === "<Media omitted>") {
        console.log('[AI DEBUG] Mensaje "<Media omitted>" detectado, omitiendo análisis de IA.');
        return null;
      }

      if (!this.initialized) {
        await this.initialize();
      }

      if (!this.initialized || typeof this.sentimentPipeline !== 'function' || typeof this.nerPipeline !== 'function') {
        console.error('[AI DEBUG] In analyzeMessage (AIAnalyzerLocal) - Pipelines no disponibles o no completamente inicializados.');
        return null; 
      }

      const cachedResult = this.getCachedResult(message);
      if (cachedResult) return cachedResult;

      const textToAnalyze = message;
      console.log('AIAnalyzerLocal analizando mensaje:', textToAnalyze);

      // Ejecutar análisis de sentimiento y NER en paralelo si es posible y tiene sentido
      // Por ahora, secuencial para simplicidad, ya que el resultado de NER se añade al de sentimiento
      const sentimentResults = await this.sentimentPipeline([textToAnalyze]);
      const sentimentResult = sentimentResults[0];

      if (!sentimentResult || !sentimentResult.label) {
        console.warn('[AI DEBUG] Resultado inesperado del pipeline de sentimiento en analyzeMessage (AIAnalyzerLocal):', sentimentResult);
        // Podríamos decidir devolver un resultado parcial o null
        return null;
      }
      console.log('AIAnalyzerLocal - Resultado del análisis de sentimiento:', sentimentResult);
      
      const label = sentimentResult.label; 
      let normalizedSentiment;
      if (label === '1 star') { 
        normalizedSentiment = 'negativo';
      } else if (label === '2 stars' || label === '3 stars') { 
        normalizedSentiment = 'neutral';
      } else if (label === '4 stars' || label === '5 stars') {
        normalizedSentiment = 'positivo';
      } else {
        normalizedSentiment = 'neutral'; 
        console.warn(`[AI DEBUG] Etiqueta de sentimiento no reconocida en analyzeMessage (AIAnalyzerLocal): ${sentimentResult.label}`);
      }

      // Análisis NER
      const mentionedPersons = await this.analyzeMentionedPersons(textToAnalyze);

      const analysisResult = {
        sentiment: {
          normalized: normalizedSentiment,
          score: sentimentResult.score,
          intensity: sentimentResult.score > 0.8 ? 'alto' : (sentimentResult.score < 0.3 && normalizedSentiment === 'negativo' ? 'alto' : 'normal')
        },
        messageLength: message.length,
        language: this.detectLanguage(message),
        mentionedPersons: mentionedPersons || [] // Añadir personas mencionadas
      };

      this.setCachedResult(message, analysisResult);
      return analysisResult;

    } catch (error) {
      console.error('Error en análisis de mensaje (AIAnalyzerLocal):', error);
      return null;
    }
  }

  // Método de fallback mejorado para análisis cuando falla el modelo
  fallbackAnalysis(text) {
    console.log('AIAnalyzerLocal - Usando análisis de fallback para:', text);
    const patterns = {
      positivo: {
        es: /(?:genial|excelente|fantástico|increíble|gracias|perfecto|me gusta|amor|feliz|alegr[eéía]|divert[ieí]|bien|bueno|guay|😊|👍|❤️)/i,
        ca: /(?:genial|excel·lent|fantàstic|increïble|gràcies|perfecte|m'agrada|amor|feliç|alegr[eéía]|divert[ieí]|bé|bo|guai)/i
      },
      negativo: {
        es: /(?:mal|horrible|terrible|fatal|odio|triste|enfad[oa]|molest[oa]|peor|nunca|nada|no me gusta|😠|😡|😢)/i,
        ca: /(?:malament|horrible|terrible|fatal|odi|trist|enfad[at]|molest[at]|pitjor|mai|res|no m'agrada)/i
      }
    };

    let score = {
      positivo: 0,
      negativo: 0
    };

    // Analizar patrones en ambos idiomas
    Object.entries(patterns).forEach(([sentiment, langPatterns]) => {
      Object.values(langPatterns).forEach(pattern => {
        const matches = (text.match(pattern) || []).length;
        score[sentiment] += matches;
      });
    });

    // Añadir análisis de emojis
    const emojiPatterns = {
      positivo: /[😊🙂😄😃😀🥰😍👍❤️💕✨🎉👏]/gu,
      negativo: /[😠😡🤬😤😢😩😫👎💔]/gu
    };

    Object.entries(emojiPatterns).forEach(([sentiment, pattern]) => {
      const matches = (text.match(pattern) || []).length;
      score[sentiment] += matches * 1.5; // Los emojis tienen más peso
    });

    const total = Math.max(1, score.positivo + score.negativo);
    const normalizedScore = {
      positivo: score.positivo / total,
      negativo: score.negativo / total
    };

    return {
      label: normalizedScore.positivo > normalizedScore.negativo ? 'POSITIVE' : 'NEGATIVE',
      score: Math.max(normalizedScore.positivo, normalizedScore.negativo)
    };
  }

  // Detector simple de idioma basado en patrones
  detectLanguage(text) {
    const patterns = {
      es: /(?:está|esto|aquí|así|también|después|según|día|años?|buenos\sdías|gracias)/i,
      ca: /(?:està|això|aquí|així|també|després|segons|dia|anys?|bon\sdia|gràcies)/i
    };

    let scores = {
      es: 0,
      ca: 0
    };

    Object.entries(patterns).forEach(([lang, pattern]) => {
      const matches = (text.match(pattern) || []).length;
      scores[lang] += matches;
    });

    return scores.ca > scores.es ? 'ca' : 'es';
  }

  // Método para analizar personas mencionadas - VERSIÓN EXPERIMENTAL PARA MODELO LOCAL
  async analyzeMentionedPersons(message) {
    if (!this.initialized || typeof this.nerPipeline !== 'function') {
      // No es necesario un error aquí si se llama internamente, ya se verifica antes.
      // Si se llamase externamente, sí sería bueno un console.error.
      return [];
    }
    if (!message || message.trim() === "" || message === "<Media omitted>") {
        return [];
    }

    try {
      // Añadir log para ver el mensaje y las entidades crudas
      console.log(`[AI DEBUG] AIAnalyzerLocal - analyzeMentionedPersons - Processing message: "${message}"`);
      
      const entitiesFromPipeline = await this.nerPipeline(message);
      console.log('[AI DEBUG] AIAnalyzerLocal - Entities DIRECTLY from NER pipeline:', JSON.parse(JSON.stringify(entitiesFromPipeline)));

      // Filtrar entidades de tipo persona con score aceptable (umbral más bajo para el modelo local)
      const personEntities = entitiesFromPipeline
        .filter(entity => 
            entity && 
            typeof entity.entity === 'string' && 
            (entity.entity.endsWith('PER') || entity.entity.endsWith('PERSON')) && 
            entity.score > 0.60 // Umbral más bajo para el modelo local
        );
      
      // Si no hay entidades de tipo persona, retornar array vacío
      if (personEntities.length === 0) {
        return [];
      }

      // Ordenar entidades por posición en el texto para procesarlas secuencialmente
      const sortedEntities = [...personEntities].sort((a, b) => {
        // Usar start o index dependiendo de cómo el modelo NER reporta las posiciones
        const posA = a.start !== undefined ? a.start : (a.index !== undefined ? a.index : 0);
        const posB = b.start !== undefined ? b.start : (b.index !== undefined ? b.index : 0);
        return posA - posB;
      });

      // Reconstruir nombres completos fusionando tokens adyacentes
      const reconstructedNames = [];
      let currentName = '';
      let lastPosition = -1;
      
      sortedEntities.forEach(entity => {
        const position = entity.start !== undefined ? entity.start : (entity.index !== undefined ? entity.index : -1);
        const word = entity.word.replace(/^##/, '');
        
        // Si esta entidad está justo después de la anterior o muy cerca (hasta 10 caracteres para el modelo local)
        if (position - lastPosition <= 10 && lastPosition !== -1) {
          currentName += word;
        } else {
          // Si ya teníamos un nombre en construcción, lo guardamos antes de empezar uno nuevo
          if (currentName) {
            reconstructedNames.push(currentName);
          }
          currentName = word;
        }
        
        // Actualizar la última posición para la siguiente iteración
        lastPosition = position + word.length;
      });
      
      // No olvidar añadir el último nombre en construcción
      if (currentName) {
        reconstructedNames.push(currentName);
      }
      
      // Si no pudimos reconstruir usando posiciones, usamos el método original
      if (reconstructedNames.length === 0) {
        // Método original como fallback
        const persons = personEntities.map(p => p.word.replace(/^##/, ''));
        reconstructedNames.push(...persons);
      }
      
      // Limpiar y eliminar duplicados para el resultado final
      const uniqueNames = [...new Set(reconstructedNames)];
      
      if (uniqueNames.length > 0) {
        console.log(`[AI DEBUG] AIAnalyzerLocal - Nombres encontrados para "${message}":`, JSON.parse(JSON.stringify(uniqueNames)));
      }

      return uniqueNames;
    } catch (error) {
      console.error('[AI DEBUG] Error en analyzeMentionedPersons (AIAnalyzerLocal):', error);
      return [];
    }
  }

  // Generar descripción de la emoción
  getEmotionDescription(emotion, score) {
    const descriptions = {
      joy: 'alegría',
      love: 'afecto',
      admiration: 'admiración',
      approval: 'aprobación',
      caring: 'preocupación positiva',
      excitement: 'entusiasmo',
      gratitude: 'gratitud',
      pride: 'orgullo',
      optimism: 'optimismo',
      relief: 'alivio',
      neutral: 'neutralidad',
      realization: 'comprensión',
      confusion: 'confusión',
      curiosity: 'curiosidad',
      surprise: 'sorpresa',
      anger: 'enojo',
      annoyance: 'molestia',
      disappointment: 'decepción',
      disapproval: 'desaprobación',
      disgust: 'disgusto',
      embarrassment: 'vergüenza',
      fear: 'miedo',
      grief: 'pena',
      nervousness: 'nerviosismo',
      remorse: 'remordimiento',
      sadness: 'tristeza'
    };

    return descriptions[emotion] || emotion;
  }

  // Detector mejorado de intención de quedar
  async detectMeetupIntent(message) {
    const msgLower = message.toLowerCase();
    
    // Patrones de propuestas en diferentes idiomas
    const patterns = {
      es: {
        temporal: ['mañana', 'tarde', 'noche', 'luego', 'después', 'próximo', 'siguiente', 'semana', 'finde', 'fin de semana'],
        accion: ['quedar', 'vernos', 'reunir', 'encontrar', 'juntar', 'tomar algo', 'comer', 'cenar'],
        modal: ['podríamos', 'deberíamos', 'queremos', 'vamos a', 'hay que', 'tenemos que'],
        lugar: ['bar', 'restaurante', 'casa', 'parque', 'centro', 'plaza', 'calle']
      },
      ca: {
        temporal: ['demà', 'tarda', 'nit', 'després', 'proper', 'següent', 'setmana', 'cap de setmana'],
        accion: ['quedar', 'veure\'ns', 'reunir', 'trobar', 'juntar', 'prendre algo', 'dinar', 'sopar'],
        modal: ['podríem', 'hauríem', 'volem', 'anem a', 'cal', 'hem de'],
        lugar: ['bar', 'restaurant', 'casa', 'parc', 'centre', 'plaça', 'carrer']
      }
    };

    // Puntuación basada en coincidencias
    let score = 0;
    let matches = {
      temporal: false,
      accion: false,
      modal: false,
      lugar: false
    };

    // Analizar patrones en ambos idiomas
    ['es', 'ca'].forEach(lang => {
      Object.entries(patterns[lang]).forEach(([category, words]) => {
        if (words.some(word => msgLower.includes(word))) {
          matches[category] = true;
          score += 0.25; // Cada categoría aporta 0.25 al score
        }
      });
    });

    // Análisis contextual
    const contextualFeatures = {
      hasQuestion: message.includes('?'),
      hasExclamation: message.includes('!'),
      containsTime: /\d{1,2}[:h]\d{0,2}|\d{1,2}\s*(am|pm|h|hora)/i.test(message),
      containsDate: /\d{1,2}\/\d{1,2}|\d{1,2}\s+de\s+[a-z]+/i.test(message)
    };

    // Ajustar score basado en características contextuales
    if (contextualFeatures.hasQuestion) score += 0.1;
    if (contextualFeatures.containsTime) score += 0.15;
    if (contextualFeatures.containsDate) score += 0.15;

    return {
      isProposal: score >= 0.5,
      confidence: score,
      matches,
      contextualFeatures
    };
  }

  // MÉTODO PRIMARIO DE PRUEBA - Solo para análisis de nombres en mensajes
  async testNameDetection(message) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      if (!this.initialized || typeof this.nerPipeline !== 'function') {
        console.error('[AI DEBUG] In testNameDetection - NER Pipeline no disponible.');
        return {
          success: false,
          error: "Modelo no inicializado"
        };
      }

      const mentionedPersons = await this.analyzeMentionedPersons(message);
      
      return {
        success: true,
        detectedNames: mentionedPersons,
        message
      };
    } catch (error) {
      console.error('Error en testNameDetection:', error);
      return {
        success: false,
        error: error.message,
        message
      };
    }
  }
}

// Instancia global del analizador local
const aiAnalyzerLocal = new AIAnalyzerLocal();

// Hook para usar el analizador local en componentes React
export function useAIAnalyzerLocal(testMessage) {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!testMessage) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    async function testDetection() {
      try {
        console.log('[AIAnalyzerLocal] Probando detección con mensaje:', testMessage);
        const testResults = await aiAnalyzerLocal.testNameDetection(testMessage);
        
        if (isMounted) {
          setResults(testResults);
          setLoading(false);
        }
      } catch (err) {
        console.error("[AIAnalyzerLocal] Error en prueba:", err);
        
        if (isMounted) {
          setError(err.message || "Error al ejecutar la prueba.");
          setLoading(false);
        }
      }
    }
    
    testDetection();
    
    return () => {
      isMounted = false;
    };
  }, [testMessage]);
  
  return { results, loading, error };
}

export default {
  useAIAnalyzerLocal,
  AIAnalyzerLocal: aiAnalyzerLocal,
  extractParticipantFeatures
}; 