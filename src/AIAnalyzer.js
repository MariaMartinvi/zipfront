/**
 * AIAnalyzer.js
 * Módulo para análisis de chat usando IA en el navegador
 * Utiliza Transformers.js con DistilBERT para análisis real de texto
 */

import { useEffect, useState } from 'react';
import { pipeline, env } from '@xenova/transformers';

// Configurar el entorno de Transformers.js para usar CDN
env.allowLocalModels = false; // Volver al CDN
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

// Clase para análisis de chat usando DistilBERT
class AIAnalyzer {
  constructor() {
    this.initialized = false;
    this.isInitializing = false;
    this.MODEL_NAME = 'Xenova/bert-base-multilingual-uncased-sentiment';
    this.NER_MODEL_NAME = 'Xenova/bert-base-multilingual-cased-ner-hrl'; // Volver al modelo original que funcionaba
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
    
    // Lista de nombres comunes españoles para mejorar la detección del modelo NER
    this.commonSpanishNames = [
      "sara", "ana", "luis", "juan", "jose", "maria", "pedro", "pablo", 
      "carmen", "laura", "marta", "david", "carlos", "javier", "antonio",
      "miguel", "manuel", "rosa", "pilar", "paula", "lucia", "cristina"
    ];
    
    // Registrar configuración para depuración
    console.log('[AI DEBUG] Configuración de modelo local:', {
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

    console.log('[AI DEBUG] Starting new initialization process...');
    this.isInitializing = true;

    // Crear y asignar la promesa de inicialización.
    this.initPromise = (async () => {
      try {
        console.log('[AI DEBUG] Initializing models (pipeline calls)...');
        
        // Configurar específicamente para el modelo NER original
        const nerConfig = {
          ...this.modelConfig,
          quantized: true,
          aggregation_strategy: 'simple'
        };
        
        console.log('[AI DEBUG] Configuración para NER pipeline (modelo original):', nerConfig);
        console.log('[AI DEBUG] Intentando cargar modelo NER original:', this.NER_MODEL_NAME);

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
          console.error('[AI DEBUG] Error creating NER pipeline:', nerError);
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
        console.log('Modelos inicializados correctamente');
      } catch (pipelineError) {
        console.error('[AI DEBUG] Error during model initialization process inside initialize:', pipelineError);
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
      console.error('[AI DEBUG] Initialization promise rejected:', e.message);
      throw e; // Propagar el error para que useAIAnalyzer lo maneje
    }
  }

  // La función translateToEnglish ha sido eliminada ya que el modelo es multilingüe.

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
        console.error('[AI DEBUG] In analyzeMessage - Pipelines no disponibles o no completamente inicializados.');
        return null; 
      }

      const cachedResult = this.getCachedResult(message);
      if (cachedResult) return cachedResult;

      const textToAnalyze = message;
      console.log('Analizando mensaje:', textToAnalyze);

      // Ejecutar análisis de sentimiento y NER en paralelo si es posible y tiene sentido
      // Por ahora, secuencial para simplicidad, ya que el resultado de NER se añade al de sentimiento
      const sentimentResults = await this.sentimentPipeline([textToAnalyze]);
      const sentimentResult = sentimentResults[0];

      if (!sentimentResult || !sentimentResult.label) {
        console.warn('[AI DEBUG] Resultado inesperado del pipeline de sentimiento en analyzeMessage:', sentimentResult);
        // Podríamos decidir devolver un resultado parcial o null
        return null;
      }
      console.log('Resultado del análisis de sentimiento (analyzeMessage):', sentimentResult);
      
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
        console.warn(`[AI DEBUG] Etiqueta de sentimiento no reconocida en analyzeMessage: ${sentimentResult.label}`);
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
      console.error('Error en análisis de mensaje (outer try-catch in analyzeMessage):', error);
      return null;
    }
  }

  // La función normalizeSentimentLabel ha sido eliminada, la lógica está en los métodos de análisis.

  // Método de fallback mejorado para análisis cuando falla el modelo
  fallbackAnalysis(text) {
    console.log('Usando análisis de fallback para:', text);
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

  // Analizar propuestas de quedadas con contexto y sentimiento
  async analyzeMeetupProposals(messages, userName) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      // Analizar cada mensaje con contexto completo
      const analysisResults = await Promise.all(
        messages.map(async msg => {
          const analysis = await this.analyzeMessage(msg);
          if (!analysis) return null;

          const meetupAnalysis = await this.detectMeetupIntent(msg);
          
          return {
            ...analysis,
            meetupAnalysis,
            text: msg
          };
        })
      );

      // Filtrar resultados nulos y analizar patrones
      const validResults = analysisResults.filter(r => r !== null);
      
      // Contar propuestas efectivas
      const proposalCount = validResults.filter(r => r.meetupAnalysis.isProposal).length;
      
      // Analizar el contexto emocional de las propuestas
      const proposalSentiments = validResults
        .filter(r => r.meetupAnalysis.isProposal)
        .map(r => r.sentiment.normalized);

      // Calcular estadísticas
      const stats = {
        total: proposalCount,
        byEmotion: {
          positivo: proposalSentiments.filter(s => s === 'positivo').length,
          neutral: proposalSentiments.filter(s => s === 'neutral').length,
          negativo: proposalSentiments.filter(s => s === 'negativo').length
        },
        averageConfidence: validResults
          .filter(r => r.meetupAnalysis.isProposal)
          .reduce((acc, r) => acc + r.meetupAnalysis.confidence, 0) / Math.max(proposalCount, 1)
      };

      return {
        proposalCount,
        isFrequentProposer: proposalCount > messages.length * 0.1,
        stats,
        examples: validResults
          .filter(r => r.meetupAnalysis.isProposal)
          .slice(0, 3)
          .map(r => ({
            text: r.text,
            sentiment: r.sentiment.normalized,
            confidence: r.meetupAnalysis.confidence
          }))
      };
    } catch (error) {
      console.error('Error analizando propuestas:', error);
      return {
        proposalCount: 0,
        isFrequentProposer: false,
        stats: { total: 0, byEmotion: { positivo: 0, neutral: 0, negativo: 0 }, averageConfidence: 0 },
        examples: []
      };
    }
  }
  
  // Analizar perfiles de usuarios
  async analyzeUserProfiles(participantsData, messagesByUser, messageAnalysis) {
    const profiles = {};
    
    try {
      for (const participant of participantsData) {
        const userName = participant.name;
        const userMessages = messagesByUser[userName] || [];
        
        // Filtrar análisis de mensajes para este usuario
        const userAnalysis = messageAnalysis.filter(
          analysis => analysis && analysis.userName === userName
        );

        // Calcular estadísticas de sentimiento
        const sentimentStats = {
          positivo: 0,
          neutral: 0,
          negativo: 0
        };

        userAnalysis.forEach(analysis => {
          sentimentStats[analysis.sentiment.normalized]++;
        });

        // Recopilar ejemplos de mensajes negativos
        const negativeExamples = userAnalysis
          .filter(analysis => analysis.sentiment.normalized === 'negativo')
          .sort((a, b) => (1 - b.sentiment.score) - (1 - a.sentiment.score)) // Ordenar por nivel de negatividad
          .map(analysis => ({
            text: analysis.text,
            sentiment: analysis.sentiment
          }));

        // Determinar características comunicativas
        const communicationStyle = this.determineCommunicationStyle(participant, userMessages);
        
        // Calcular sentimiento dominante
        const totalAnalyzedMessages = userAnalysis.length;
        const dominantSentiment = totalAnalyzedMessages > 0 
          ? Object.entries(sentimentStats).sort(([,a], [,b]) => b - a)[0][0]
          : 'indeterminado';

        // Calcular porcentajes de sentimientos
        const sentimentPercentages = {
          positivo: totalAnalyzedMessages > 0 ? Math.round((sentimentStats.positivo / totalAnalyzedMessages) * 100) : 0,
          neutral: totalAnalyzedMessages > 0 ? Math.round((sentimentStats.neutral / totalAnalyzedMessages) * 100) : 0,
          negativo: totalAnalyzedMessages > 0 ? Math.round((sentimentStats.negativo / totalAnalyzedMessages) * 100) : 0,
        };

        // Analizar propuestas de quedadas
        const meetupAnalysis = await this.analyzeMeetupProposals(userMessages, userName);
        
        profiles[userName] = {
          messageCount: participant.messageCount,
          percentage: participant.percentage,
          communicationStyle,
          sentiment: dominantSentiment,
          sentimentStats, // Mantenemos las cuentas brutas por si acaso
          sentimentPercentages, // Añadimos los porcentajes calculados
          negativeExamples,
          meetupProposals: meetupAnalysis.proposalCount,
          isFrequentProposer: meetupAnalysis.isFrequentProposer
        };
      }
      
      return profiles;
    } catch (error) {
      console.error('Error analizando perfiles:', error);
      return profiles;
    }
  }
  
  // Determinar estilo de comunicación basado en características
  determineCommunicationStyle(participant, messages) {
    const style = {
      conciseness: participant.isVerbose ? 'elaborado' : 'conciso',
      emotionExpression: participant.usesEmojis ? 'expresivo' : 'sobrio',
      formality: 'neutral'
    };
    
    // Detectar nivel de formalidad basado en análisis de texto
    if (messages.length > 0) {
      // Patrones de informalidad: abreviaturas, slang, etc.
      const informalPatterns = /(\blol\b|\bomg\b|\bwtf\b|\bjaja\b|\bxd\b|\bk\b|emoji)/i;
      // Patrones de formalidad: estructuras completas, palabras formales
      const formalPatterns = /(\bdebido a\b|\bconsidero\b|\bestimo\b|\bpermita\b|\bcordial|\bsinceramente\b)/i;
      
      let informalCount = 0;
      let formalCount = 0;
      
      for (const msg of messages) {
        if (informalPatterns.test(msg)) informalCount++;
        if (formalPatterns.test(msg)) formalCount++;
      }
      
      const informalRatio = informalCount / messages.length;
      const formalRatio = formalCount / messages.length;
      
      if (informalRatio > 0.3) {
        style.formality = 'informal';
      } else if (formalRatio > 0.2) {
        style.formality = 'formal';
      }
    }
    
    return style;
  }
  
  // Método para generar análisis del grupo
  async generateGroupProfile(stats, participantsData, sentimentAnalysis, userProfiles, allMessageAnalyses) {
    const totalMessages = stats.total_messages || 0;
    const totalParticipants = participantsData.length;
    const mainUser = participantsData.length > 0 ? participantsData[0].name : "N/A";
    
    // Encontrar quién propone más quedadas
    const topProposerEntry = Object.entries(userProfiles)
      .sort(([,a], [,b]) => (b.meetupProposals || 0) - (a.meetupProposals || 0))[0];
    
    const proposerInfo = topProposerEntry && topProposerEntry[1].meetupProposals > 0
      ? `\n\n${topProposerEntry[0]} es quien más propone planes, con ${topProposerEntry[1].meetupProposals} propuestas detectadas.`
      : '';

    // Analizar si el sentimiento es muy negativo
    const isVeryNegative = sentimentAnalysis.negativeRatio > 0.4; // Más del 40% negativo
    let negativityAnalysis = '';
    
    if (isVeryNegative && sentimentAnalysis.examples && sentimentAnalysis.examples.length > 0) {
      negativityAnalysis = `\n\nSe detecta un tono general bastante negativo. Algunos ejemplos que llevan a esta conclusión:\n`;
      
      // Añadir hasta 3 ejemplos de mensajes negativos con su puntuación
      sentimentAnalysis.examples
        .filter(ex => ex.sentiment.normalized === 'negativo')
        .slice(0, 3)
        .forEach(ex => {
          const sentiment = Math.round((1 - ex.sentiment.score) * 100);
          negativityAnalysis += `\n- "${ex.text}" (${sentiment}% de negatividad)`;
        });
        
      negativityAnalysis += `\n\nEstos patrones podrían indicar tensión o desacuerdos en el grupo.`;
    }
    
    // Crear análisis del grupo basado en datos reales
    let sentimentSummaryText;
    if (sentimentAnalysis.dominant === 'indeterminado') {
      sentimentSummaryText = `El tono general de la conversación es indeterminado (no se pudieron analizar mensajes).`;
    } else {
      const positivePercentage = Math.round(sentimentAnalysis.positiveRatio * 100);
      const neutralPercentage = Math.round(sentimentAnalysis.neutralRatio * 100);
      const negativePercentage = Math.round(sentimentAnalysis.negativeRatio * 100);
      sentimentSummaryText = `El tono general de la conversación es predominantemente ${sentimentAnalysis.dominant}. Desglose:
  - Positivo: ${positivePercentage}%
  - Neutral: ${neutralPercentage}%
  - Negativo: ${negativePercentage}%`;
    }

    // ---- NUEVO: Análisis de personas mencionadas ----
    let mentionedPersonsSummary = '';
    if (allMessageAnalyses && allMessageAnalyses.length > 0) {
      console.log('[AI DEBUG] generateGroupProfile - allMessageAnalyses:', JSON.parse(JSON.stringify(allMessageAnalyses))); // Log para ver todos los análisis
      
      // Recopilamos todas las menciones
      const allMentionsRaw = [];
      allMessageAnalyses.forEach(analysis => {
        if (analysis && analysis.mentionedPersons && analysis.mentionedPersons.length > 0) {
          analysis.mentionedPersons.forEach(person => {
            // Normalizar un poco el nombre (ej. quitar #) y convertir a minúsculas para agrupar
            allMentionsRaw.push(person.replace(/#$/, '').toLowerCase());
          });
        }
      });
      
      // Intentamos agrupar menciones parciales con una segunda pasada
      const allMentions = {};
      
      // Función para verificar si un nombre es parte de otro
      const isPartOfName = (part, wholeName) => {
        return (wholeName.startsWith(part) || wholeName.endsWith(part)) && wholeName.length > part.length;
      };
      
      // Primera pasada: contar menciones directas
      allMentionsRaw.forEach(person => {
        allMentions[person] = (allMentions[person] || 0) + 1;
      });
      
      // Segunda pasada: fusionar menciones parciales
      // Crear una copia para iterar mientras modificamos el original
      const mentionEntries = Object.entries(allMentions);
      
      for (let i = 0; i < mentionEntries.length; i++) {
        const [name1, count1] = mentionEntries[i];
        
        // Si este nombre ya se marcó como fusionado, saltarlo
        if (count1 === 0) continue;
        
        for (let j = i + 1; j < mentionEntries.length; j++) {
          const [name2, count2] = mentionEntries[j];
          
          // Si este nombre ya se marcó como fusionado, saltarlo
          if (count2 === 0) continue;
          
          // Verificar si son partes del mismo nombre
          if (isPartOfName(name1, name2)) {
            // name1 es parte de name2, fusionar en name2
            allMentions[name2] += count1;
            allMentions[name1] = 0; // Marcamos como fusionado
            break; // Salimos del bucle interno
          } else if (isPartOfName(name2, name1)) {
            // name2 es parte de name1, fusionar en name1
            allMentions[name1] += count2;
            allMentions[name2] = 0; // Marcamos como fusionado
          } else if (name1.length >= 2 && name2.length >= 2) {
            // También verificar combinaciones comunes que pueden no haberse detectado en analyzeMentionedPersons
            // Por ejemplo: "pi" y "li" para formar "pili"
            const combinedName = name1 + name2;
            const commonNames = ["jose", "maria", "marta", "carmen", "jesus", "francisco", "pilar", "pili", "juanjo", "juanma"];
            
            if (commonNames.some(common => common === combinedName)) {
              // Crear nueva entrada con nombre combinado
              allMentions[combinedName] = (allMentions[combinedName] || 0) + count1 + count2;
              allMentions[name1] = 0; // Marcamos como fusionado
              allMentions[name2] = 0; // Marcamos como fusionado
              break; // Salimos del bucle interno
            }
          }
        }
      }
      
      console.log('[AI DEBUG] generateGroupProfile - allMentions count after merging:', JSON.parse(JSON.stringify(allMentions))); // Log para ver el conteo de menciones

      // Filtrar entradas marcadas como fusionadas (con valor 0)
      const filteredMentions = Object.entries(allMentions)
        .filter(([, count]) => count > 0);
        
      const sortedMentions = filteredMentions
        .sort(([, countA], [, countB]) => countB - countA)
        .slice(0, 5); // Mostrar las 5 personas más mencionadas

      if (sortedMentions.length > 0) {
        mentionedPersonsSummary = `\n\nPersonas más mencionadas en el chat:
`;
        sortedMentions.forEach(([person, count]) => {
          // Capitalizar la primera letra para mostrar
          const displayName = person.charAt(0).toUpperCase() + person.slice(1);
          mentionedPersonsSummary += `  - ${displayName} (${count} veces)\n`;
        });
      }
    }
    // ---- FIN NUEVO ----
    
    const groupAnalysis = `Este grupo de ${totalParticipants} participantes ha intercambiado ${totalMessages} mensajes.

${sentimentSummaryText}${negativityAnalysis}${mentionedPersonsSummary}

${mainUser} es el participante más activo.${proposerInfo}`;
    
    return `## PERFIL GRUPAL\n\n${groupAnalysis}`;
  }
  
  // Método para generar perfiles individuales
  generateIndividualProfiles(participantsData, userProfiles) {
    // Analizar solo los 2 principales participantes
    const mainParticipants = participantsData.slice(0, Math.min(2, participantsData.length));
    
    let profiles = `\n## PERFILES INDIVIDUALES\n`;
    
    for (const participant of mainParticipants) {
      const profile = userProfiles[participant.name] || {};
      
      // Determinar personalidad según análisis real
      let role = profile.communicationStyle?.conciseness === 'elaborado' 
                ? "Comunicador Detallado" 
                : "Comunicador Conciso";
      
      if (participant.isFrequentPoster) {
        role = profile.communicationStyle?.emotionExpression === 'expresivo'
               ? "Comunicador Expresivo" 
               : "Comunicador Principal";
      }

      // Calcular porcentajes de sentimientos
      const sentimentPercentages = profile.sentimentPercentages || { positivo: 0, neutral: 0, negativo: 0 };

      // Crear perfil individual basado en análisis
      const individualAnalysis = `${participant.name} ha enviado ${participant.messageCount} mensajes (${participant.percentage}% del total).

Estilo comunicativo: ${profile.communicationStyle?.conciseness || 'neutro'}, ${profile.communicationStyle?.emotionExpression || 'neutro'}${profile.communicationStyle?.formality !== 'neutral' ? ', ' + profile.communicationStyle?.formality : ''}.

Tono emocional general: ${profile.sentiment || 'neutral'}.
  - Positivo: ${sentimentPercentages.positivo}%
  - Neutral: ${sentimentPercentages.neutral}%
  - Negativo: ${sentimentPercentages.negativo}%`;

      // Añadir ejemplos de mensajes negativos si existen y son significativos
      let negativityExamples = '';
      if (profile.negativeExamples && profile.negativeExamples.length > 0 && sentimentPercentages.negativo > 20) {
        negativityExamples = '\n\nEjemplos de mensajes con tono negativo:';
        profile.negativeExamples
          .slice(0, 2) // Mostrar solo los 2 ejemplos más negativos
          .forEach(example => {
            const negativityScore = Math.round((1 - example.sentiment.score) * 100);
            negativityExamples += `\n- "${example.text}" (${negativityScore}% de negatividad)`;
          });
      }

      // Añadir información sobre propuestas de quedadas
      const meetupInfo = profile.meetupProposals > 0 
        ? `\n\nHa propuesto ${profile.meetupProposals} planes o quedadas${
            profile.isFrequentProposer 
              ? ' y es uno de los organizadores más activos del grupo'
              : ''
          }.`
        : '';
      
      profiles += `\n### ${participant.name} - ${role}\n\n${individualAnalysis}${negativityExamples}${meetupInfo}\n`;
    }
    
    // Si hay más participantes, agregar un resumen breve
    if (participantsData.length > 2) {
      const restCount = participantsData.length - mainParticipants.length;
      profiles += `\n### Otros participantes\n\nHay ${restCount} participantes adicionales que contribuyen con menor frecuencia.\n`;
    }
    
    return profiles;
  }
  
  // Método para generar conclusiones
  generateConclusions(participantsData, totalMessages, sentimentAnalysis, topics) {
    const mainParticipant = participantsData.length > 0 ? participantsData[0] : { isFrequentPoster: false };
    
    // Generar conclusión basada en análisis real
    const conclusionText = `El análisis de IA muestra un grupo donde ${
      mainParticipant.isFrequentPoster 
      ? 'existe un participante dominante' 
      : 'la participación está distribuida entre varios miembros'
    }.

Los patrones de comunicación sugieren una dinámica ${
      totalMessages > 1000 
      ? 'establecida y activa' 
      : 'moderada pero consistente'
    }.

El tono emocional predominante es ${sentimentAnalysis.dominant}, y los principales temas son ${
      topics.length > 0 
      ? topics.slice(0, 3).map(t => t.topic).join(', ') 
      : 'diversos y no fácilmente categorizables'
    }.`;
    
    return `\n## CONCLUSIONES\n\n${conclusionText}`;
  }
  
  // Método principal para generar análisis completo
  async generateFullAnalysis(stats, participantsData) {
    if (!stats || !participantsData || participantsData.length === 0) {
      return "No hay datos suficientes para realizar un análisis.";
    }
    
    try {
      // Inicializar modelos si es necesario
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Extraer mensajes para análisis
      const allMessages = [];
      const messagesByUser = {};
      messagesByUser.userIndices = {};
      
      // Recopilar mensajes de cada usuario
      for (const participant of participantsData) {
        const userName = participant.name;
        const examples = participant.examples || [];
        
        messagesByUser[userName] = examples;
        
        // Registrar índices para mapear mensajes a usuarios
        for (const msg of examples) {
          const idx = allMessages.length;
          allMessages.push(msg);
          messagesByUser.userIndices[idx] = userName;
        }
      }
      
      console.log('Analizando mensajes...');
      
      // --- Nuevo método: análisis de sentimientos por lotes para mayor rendimiento ---
      const bulk = await this.analyzeMessagesBulk(allMessages);
      const messageAnalysis = bulk.map((analysis, idx) => {
        if (!analysis) return null;
        return {
          ...analysis,
          text: allMessages[idx],
          userName: messagesByUser.userIndices[idx]
        };
      });
      
      // Calcular sentimiento general
      const validAnalysis = messageAnalysis.filter(a => a !== null);
      const sentimentCounts = {
        positivo: 0,
        neutral: 0,
        negativo: 0
      };
      
      // Recopilar ejemplos de mensajes negativos
      const negativeExamples = validAnalysis
        .filter(a => a.sentiment.normalized === 'negativo')
        .map(a => ({
          text: a.text,
          sentiment: a.sentiment,
          userName: a.userName
        }))
        .sort((a, b) => b.sentiment.score - a.sentiment.score); // Ordenar por intensidad de negatividad
      
      validAnalysis.forEach(analysis => {
        sentimentCounts[analysis.sentiment.normalized]++;
      });
      
      const totalAnalyzed = validAnalysis.length;
      let overallSentiment;
      if (totalAnalyzed > 0) {
        overallSentiment = {
          positiveRatio: sentimentCounts.positivo / totalAnalyzed,
          negativeRatio: sentimentCounts.negativo / totalAnalyzed,
          neutralRatio: sentimentCounts.neutral / totalAnalyzed,
          dominant: Object.entries(sentimentCounts).sort(([,a], [,b]) => b - a)[0][0],
          examples: negativeExamples
        };
      } else {
        overallSentiment = {
          positiveRatio: 0,
          negativeRatio: 0,
          neutralRatio: 0,
          dominant: 'indeterminado',
          examples: negativeExamples // Será un array vacío si totalAnalyzed es 0
        };
      }
      
      console.log('Analizando propuestas de quedadas...');
      const userProfiles = await this.analyzeUserProfiles(
        participantsData, 
        messagesByUser,
        messageAnalysis
      );
      
      // Generar cada sección del análisis
      const groupProfile = await this.generateGroupProfile(
        stats, 
        participantsData, 
        overallSentiment,
        userProfiles,
        messageAnalysis
      );
      
      const individualProfiles = this.generateIndividualProfiles(
        participantsData, 
        userProfiles
      );
      
      const conclusions = this.generateConclusions(
        participantsData, 
        stats.total_messages || 0, 
        overallSentiment,
        userProfiles
      );
      
      // Combinar secciones
      return `${groupProfile}${individualProfiles}${conclusions}`;
    } catch (error) {
      console.error("Error en el análisis:", error);
      return "Error al generar el análisis con IA. Por favor, intenta nuevamente.";
    }
  }

  // --- Nuevo método: análisis de sentimientos por lotes para mayor rendimiento ---
  async analyzeMessagesBulk(messages) {
    if (!messages || messages.length === 0) return [];

    try {
      if (!this.initialized) {
        await this.initialize();
      }

      if (!this.initialized || typeof this.sentimentPipeline !== 'function' || typeof this.nerPipeline !== 'function') {
        console.error('[AI DEBUG] analyzeMessagesBulk: Pipelines no disponibles o no completamente inicializados.');
        return messages.map(() => null);
      }

      // Análisis de sentimiento
      const sentimentPipelineResults = await this.sentimentPipeline(messages);
      if (!sentimentPipelineResults || !Array.isArray(sentimentPipelineResults)) {
        console.warn('[AI DEBUG] Resultado inesperado del pipeline de sentimiento en analyzeMessagesBulk:', sentimentPipelineResults);
        return messages.map(() => null);
      }

      // Análisis NER para cada mensaje
      // Usamos Promise.all para procesar NER en paralelo para todos los mensajes del lote
      const nerResultsPromises = messages.map(msg => this.analyzeMentionedPersons(msg));
      const nerResults = await Promise.all(nerResultsPromises);


      return sentimentPipelineResults.map((res, idx) => {
        if (!res || !res.label) {
          console.warn(`[AI DEBUG] Resultado de ítem de sentimiento inesperado en analyzeMessagesBulk para el mensaje ${idx}:`, res);
          return null;
        }
        const label = res.label; 
        let normalizedSentiment;

        if (label === '1 star') { 
          normalizedSentiment = 'negativo';
        } else if (label === '2 stars' || label === '3 stars') { 
          normalizedSentiment = 'neutral';
        } else if (label === '4 stars' || label === '5 stars') {
          normalizedSentiment = 'positivo';
        } else {
          normalizedSentiment = 'neutral';
          console.warn(`[AI DEBUG] Etiqueta de sentimiento no reconocida en analyzeMessagesBulk para el mensaje ${idx}: ${res.label}`);
        }
        
        return {
          sentiment: {
            normalized: normalizedSentiment,
            score: res.score,
            intensity: res.score > 0.8 ? 'alto' : (res.score < 0.3 && normalizedSentiment === 'negativo' ? 'alto' : 'normal')
          },
          messageLength: messages[idx].length,
          language: this.detectLanguage(messages[idx]),
          mentionedPersons: nerResults[idx] || [] // Añadir personas mencionadas del resultado NER correspondiente
        };
      });
    } catch (e) {
      console.error('[AI DEBUG] Error en analyzeMessagesBulk:', e);
      return messages.map(() => null);
    }
  }

  // --- Método para analizar personas mencionadas ---
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
      console.log(`[AI DEBUG] analyzeMentionedPersons - Processing message: "${message}"`);
      
      // 1. Detección con el modelo NER
      let uniqueNames = [];
      const entitiesFromPipeline = await this.nerPipeline(message);
      console.log('[AI DEBUG] analyzeMentionedPersons - Entities DIRECTLY from NER pipeline:', JSON.parse(JSON.stringify(entitiesFromPipeline)));

      // Filtrar entidades de tipo persona con score aceptable
      const personEntities = entitiesFromPipeline
        .filter(entity => 
            entity && 
            typeof entity.entity === 'string' && 
            (entity.entity.endsWith('PER') || entity.entity.endsWith('PERSON')) && 
            entity.score > 0.70 // Umbral reajustado para el modelo original
        );
      
      if (personEntities.length > 0) {
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
          
          // Si esta entidad está justo después de la anterior o muy cerca (6 caracteres para el modelo original)
          if (position - lastPosition <= 6 && lastPosition !== -1) {
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
        
        // Limpiar y eliminar duplicados de esta primera pasada
        uniqueNames = [...new Set(reconstructedNames)];
      }
      
      // 2. Complementar con detección de nombres comunes
      const lowerMessage = message.toLowerCase();
      this.commonSpanishNames.forEach(name => {
        // Verificar si el mensaje contiene el nombre común y no ha sido detectado ya
        // Buscamos la palabra completa con límites de palabra
        const nameRegex = new RegExp(`\\b${name}\\b`, 'i');
        if (nameRegex.test(lowerMessage) && 
            !uniqueNames.some(detected => detected.toLowerCase().includes(name))) {
          // Añadir con la primera letra en mayúscula para mejor presentación
          uniqueNames.push(name.charAt(0).toUpperCase() + name.slice(1));
          console.log(`[AI DEBUG] Nombre común detectado directamente: ${name}`);
        }
      });
      
      if (uniqueNames.length > 0) {
        console.log(`[AI DEBUG] analyzeMentionedPersons - Nombres encontrados para "${message}":`, JSON.parse(JSON.stringify(uniqueNames)));
      }

      return uniqueNames;
    } catch (error) {
      console.error('[AI DEBUG] Error en analyzeMentionedPersons:', error);
      return [];
    }
  }
}

// Instancia global del analizador
const aiAnalyzer = new AIAnalyzer();

// Hook para usar el analizador en componentes React
export function useAIAnalyzer(statistics) {
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [usingFallback, setUsingFallback] = useState(false);
  
  useEffect(() => {
    let isMounted = true;
    let participantsData = null;
    
    async function analyzeData() {
      if (!statistics) {
        if (isMounted) {
          setLoading(false);
          setProgress(0);
        }
        return;
      }
      
      try {
        if (isMounted) {
          setLoading(true);
          setError(null);
          setProgress(10);
        }
        
        participantsData = extractParticipantFeatures(statistics);
        if (isMounted) setProgress(30);
        
        // La clase AIAnalyzer ahora maneja la lógica de no reinicializar si ya está en proceso o listo.
        try {
          if (isMounted) setProgress(40); // Indica que estamos a punto de inicializar
          console.log('[AI DEBUG] useAIAnalyzer: Calling aiAnalyzer.initialize().');
          await aiAnalyzer.initialize();
          // Si initialize() lanza un error, se captura abajo.
          // Si tiene éxito, aiAnalyzer.initialized será true.
          console.log('[AI DEBUG] useAIAnalyzer: aiAnalyzer.initialize() completed. Initialized state:', aiAnalyzer.initialized);
        } catch (err) {
          console.warn("Error inicializando modelos de IA (from useAIAnalyzer):", err.message);
          if (isMounted) {
            setError(err.message || "Error al inicializar el modelo de IA. Análisis no se puede completar.");
            setLoading(false); // Detener carga
            setProgress(0); // Resetear progreso
          }
          return; // Detener la ejecución si la inicialización falla
        }

        // Verificar después de que initialize() haya completado (o fallado).
        if (!aiAnalyzer.initialized) {
          console.error('[AI DEBUG] useAIAnalyzer: Post-initialization check failed. Model not initialized.');
          if (isMounted) {
            setError("El modelo de IA no se inicializó correctamente tras el intento.");
            setLoading(false);
          }
          return;
        }
        
        if (isMounted) setProgress(60); // Indica que la inicialización (aparentemente) tuvo éxito
        
        console.log('[AI DEBUG] useAIAnalyzer: Proceeding to generateFullAnalysis.');
        const result = await aiAnalyzer.generateFullAnalysis(statistics, participantsData);
        
        if (isMounted) {
          setProgress(100);
          setAnalysis(result);
          setLoading(false);
        }
      } catch (err) {
        console.error("[AIAnalyzer Hook] Error al generar análisis (outer catch):", err);
        
        if (isMounted) {
          setError(err.message || "Error al generar el análisis. Se utilizará un análisis simplificado.");
          // setUsingFallback(true); // Ya no tenemos fallback explícito aquí
          setLoading(false);
          
          // No intentar análisis básico si la inicialización ya falló arriba
          // Solo si el error es de generateFullAnalysis en sí mismo
          if (aiAnalyzer.initialized && participantsData) { // Solo si la IA estaba lista pero falló el análisis
            // Se podría intentar un análisis más simple aquí si se desea,
            // pero el fallback principal ya está deshabilitado en analyzeMessage.
             console.warn("[AIAnalyzer Hook] Modelo estaba inicializado, pero falló generateFullAnalysis.");
          } else if (!aiAnalyzer.initialized) {
             setError("El modelo de IA no pudo inicializarse. No se puede generar el análisis.");
          } else {
            setError("No se pudieron procesar los datos del chat o error desconocido. Por favor, intenta nuevamente.");
          }
        }
      }
    }
    
    analyzeData();
    
    return () => {
      isMounted = false;
    };
  }, [statistics]);
  
  return { analysis, loading, error, progress, usingFallback };
}

export default {
  useAIAnalyzer,
  AIAnalyzer: aiAnalyzer,
  extractParticipantFeatures
}; 