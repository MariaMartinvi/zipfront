/**
 * AIAnalyzer.js
 * Módulo para análisis de chat usando IA en el navegador
 * Utiliza Transformers.js con DistilBERT para análisis real de texto
 */

import { useEffect, useState } from 'react';
import { pipeline, env } from '@xenova/transformers';

// Configurar el entorno de Transformers.js
env.allowLocalModels = false; // Usar modelos desde el CDN
env.useBrowserCache = true;   // Cachear modelos para mejorar rendimiento

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
    this.sentimentAnalyzer = null;
    this.textClassifier = null;
  }

  async initialize() {
    if (this.initialized || this.isInitializing) return;
    
    try {
      this.isInitializing = true;
      console.log('Inicializando modelos de IA para análisis de chat...');
      
      // Cargar modelo para análisis de sentimiento
      this.sentimentAnalyzer = await pipeline('sentiment-analysis', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english');
      
      // Cargar modelo para clasificación de texto (temas)
      this.textClassifier = await pipeline('zero-shot-classification', 'Xenova/distilbert-base-uncased-mnli');
      
      console.log('Modelos de IA inicializados correctamente');
      this.initialized = true;
      this.isInitializing = false;
    } catch (error) {
      console.error('Error inicializando modelos de IA:', error);
      this.isInitializing = false;
      throw error;
    }
  }
  
  // Analizar sentimiento de los mensajes
  async analyzeSentiment(messages) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      // Limitar a 100 mensajes para rendimiento
      const textsToAnalyze = messages.slice(0, 100).map(msg => msg.substring(0, 512)); // Limitar longitud
      
      // Batch processing para mejorar rendimiento
      const results = await this.sentimentAnalyzer(textsToAnalyze);
      
      // Calcular estadísticas globales
      const positiveCount = results.filter(r => r.label === 'POSITIVE').length;
      const positiveRatio = positiveCount / results.length;
      
      return {
        results,
        overallSentiment: positiveRatio > 0.6 ? 'positivo' : 
                          positiveRatio < 0.4 ? 'negativo' : 'neutral',
        positiveRatio: positiveRatio
      };
    } catch (error) {
      console.error('Error analizando sentimiento:', error);
      return { 
        results: [], 
        overallSentiment: 'neutral',
        positiveRatio: 0.5
      };
    }
  }
  
  // Identificar temas en los mensajes
  async identifyTopics(messages) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      // Temas comunes en chats
      const candidateLabels = [
        'Planes sociales',
        'Trabajo y proyectos',
        'Estudios y educación', 
        'Relaciones personales',
        'Salud y bienestar',
        'Tecnología',
        'Entretenimiento',
        'Apoyo emocional',
        'Noticias y actualidad',
        'Comida y gastronomía',
        'Viajes y experiencias',
        'Humor compartido'
      ];
      
      // Concatenar mensajes agrupados para análisis más robusto
      // Limitamos para mejorar rendimiento
      const messageBatches = [];
      const batchSize = 10;
      
      for (let i = 0; i < Math.min(messages.length, 100); i += batchSize) {
        const batch = messages.slice(i, i + batchSize).join(' ');
        if (batch.length > 50) { // Ignorar batches muy pequeños
          messageBatches.push(batch);
        }
      }
      
      // Clasificación zero-shot de los batches de mensajes
      const topicResults = await Promise.all(
        messageBatches.map(batch => 
          this.textClassifier(batch.substring(0, 1024), candidateLabels)
        )
      );
      
      // Agregar resultados de todos los batches
      const topicScores = {};
      
      for (const result of topicResults) {
        result.labels.forEach((label, idx) => {
          if (!topicScores[label]) {
            topicScores[label] = { 
              totalScore: 0,
              count: 0 
            };
          }
          
          topicScores[label].totalScore += result.scores[idx];
          topicScores[label].count += 1;
        });
      }
      
      // Calcular promedio y ordenar por relevancia
      const aggregatedTopics = Object.entries(topicScores)
        .map(([topic, data]) => ({
          topic,
          score: data.totalScore / data.count,
          confidence: data.count / topicResults.length
        }))
        .sort((a, b) => b.score - a.score)
        .filter(topic => topic.score > 0.1); // Filtrar temas irrelevantes
      
      return aggregatedTopics.slice(0, 5); // Top 5 temas
    } catch (error) {
      console.error('Error identificando temas:', error);
      return [];
    }
  }
  
  // Analizar perfiles de usuarios
  async analyzeUserProfiles(participantsData, messagesByUser, sentimentResults) {
    const profiles = {};
    
    try {
      for (const participant of participantsData) {
        const userName = participant.name;
        const messages = messagesByUser[userName] || [];
        
        // Identificar temas característicos de este usuario
        let userTopics = [];
        if (messages.length > 5) {
          try {
            userTopics = await this.identifyTopics(messages.slice(0, 20));
          } catch (e) {
            console.log('Error identificando temas para usuario:', e);
          }
        }
        
        // Determinar características comunicativas basadas en datos reales
        const communicationStyle = this.determineCommunicationStyle(participant, messages);
        
        // Extraer sentimientos para este usuario
        const userSentiments = sentimentResults.filter((_, idx) => 
          messagesByUser.userIndices && 
          messagesByUser.userIndices[idx] === userName
        );
        
        const positiveRatio = userSentiments.length > 0 
          ? userSentiments.filter(s => s.label === 'POSITIVE').length / userSentiments.length
          : 0.5;
        
        profiles[userName] = {
          messageCount: participant.messageCount,
          percentage: participant.percentage,
          communicationStyle,
          topTopics: userTopics.slice(0, 3).map(t => t.topic),
          sentiment: positiveRatio > 0.7 ? 'muy positivo' : 
                    positiveRatio > 0.55 ? 'positivo' : 
                    positiveRatio > 0.45 ? 'neutral' : 
                    positiveRatio > 0.3 ? 'negativo' : 'muy negativo',
          sentimentScore: positiveRatio
        };
      }
      
      return profiles;
    } catch (error) {
      console.error('Error analizando perfiles:', error);
      
      // Retornar perfiles básicos en caso de error
      for (const participant of participantsData) {
        profiles[participant.name] = {
          messageCount: participant.messageCount,
          percentage: participant.percentage,
          communicationStyle: {
            conciseness: participant.isVerbose ? 'elaborado' : 'conciso',
            emotionExpression: participant.usesEmojis ? 'expresivo' : 'sobrio'
          },
          topTopics: [],
          sentiment: 'neutral',
          sentimentScore: 0.5
        };
      }
      
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
  
  // Método para generar análisis de grupo
  async generateGroupProfile(stats, participantsData, sentimentAnalysis, topics) {
    const totalMessages = stats.total_messages || 0;
    const totalParticipants = participantsData.length;
    const mainUser = participantsData.length > 0 ? participantsData[0].name : "N/A";
    const isMainUserFrequent = participantsData.length > 0 ? participantsData[0].isFrequentPoster : false;
    
    // Crear análisis del grupo basado en datos reales
    const groupAnalysis = `Este grupo de ${totalParticipants} participantes ha intercambiado ${totalMessages} mensajes.

El tono general de la conversación es ${sentimentAnalysis.overallSentiment} (${Math.round(sentimentAnalysis.positiveRatio * 100)}% de mensajes positivos).

${mainUser} es el participante más activo${isMainUserFrequent ? ', con una participación significativamente mayor que el resto' : ', aunque la participación está relativamente equilibrada'}.

${topics.length > 0 ? `Los principales temas detectados en la conversación son: ${topics.map(t => t.topic).join(', ')}.` : 'No se han podido identificar temas predominantes claros en la conversación.'}`;
    
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
      
      // Crear perfil individual basado en análisis
      const individualAnalysis = `${participant.name} ha enviado ${participant.messageCount} mensajes (${participant.percentage}% del total).

Estilo comunicativo: ${profile.communicationStyle?.conciseness || 'neutro'}, ${profile.communicationStyle?.emotionExpression || 'neutro'}${profile.communicationStyle?.formality !== 'neutral' ? ', ' + profile.communicationStyle?.formality : ''}.

Tono emocional: ${profile.sentiment || 'neutral'}.

${profile.topTopics && profile.topTopics.length > 0 
  ? `Temas frecuentes: ${profile.topTopics.join(', ')}.` 
  : 'No se han detectado temas recurrentes específicos.'}`;
      
      // Seleccionar un ejemplo de mensaje
      let exampleMessage = "";
      if (participant.examples && participant.examples.length > 0) {
        const example = participant.examples[0];
        // Truncar si es muy largo
        const truncatedExample = example.length > 100 ? example.substring(0, 97) + '...' : example;
        exampleMessage = `\n\nEjemplo de mensaje: "${truncatedExample}"`;
      }
      
      profiles += `\n### ${participant.name} - ${role}\n\n${individualAnalysis}${exampleMessage}\n`;
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

El tono emocional predominante es ${sentimentAnalysis.overallSentiment}, y los principales temas son ${
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
      
      console.log('Analizando sentimiento de mensajes...');
      const sentimentAnalysis = await this.analyzeSentiment(allMessages);
      
      console.log('Identificando temas en la conversación...');
      const topics = await this.identifyTopics(allMessages);
      
      console.log('Analizando perfiles de usuarios...');
      const userProfiles = await this.analyzeUserProfiles(
        participantsData, 
        messagesByUser, 
        sentimentAnalysis.results
      );
      
      // Generar cada sección del análisis
      const groupProfile = await this.generateGroupProfile(
        stats, 
        participantsData, 
        sentimentAnalysis, 
        topics
      );
      
      const individualProfiles = this.generateIndividualProfiles(
        participantsData, 
        userProfiles
      );
      
      const conclusions = this.generateConclusions(
        participantsData, 
        stats.total_messages || 0, 
        sentimentAnalysis, 
        topics
      );
      
      // Combinar secciones
      return `${groupProfile}${individualProfiles}${conclusions}`;
    } catch (error) {
      console.error("Error en el análisis:", error);
      return "Error al generar el análisis con IA. Por favor, intenta nuevamente.";
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
  
  useEffect(() => {
    async function analyzeData() {
      if (!statistics) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setProgress(10);
        
        // Extraer características de los participantes
        const participantsData = extractParticipantFeatures(statistics);
        setProgress(30);
        
        // Inicializar modelos (si es necesario)
        if (!aiAnalyzer.initialized) {
          setProgress(40);
          try {
            await aiAnalyzer.initialize();
          } catch (err) {
            console.warn("Error inicializando modelos de IA:", err);
            // Intentar continuar con funcionalidad limitada
          }
        }
        
        setProgress(60);
        
        // Generar análisis textual
        const result = await aiAnalyzer.generateFullAnalysis(statistics, participantsData);
        
        setProgress(100);
        setAnalysis(result);
        setLoading(false);
      } catch (err) {
        console.error("[AIAnalyzer] Error al generar análisis:", err);
        
        // Eliminar errores relacionados con operationId
        const errorMsg = err.message || '';
        if (!errorMsg.includes("No operation ID") && 
            !errorMsg.includes("operation_id") && 
            !errorMsg.includes("operationId")) {
          setError(`Error al generar análisis: ${errorMsg}`);
        } else {
          console.log("Ignorando error de operationId");
          setError(null);
        }
        
        setLoading(false);
      }
    }
    
    analyzeData();
  }, [statistics]);
  
  return { analysis, loading, error, progress };
}

export default {
  useAIAnalyzer,
  AIAnalyzer: aiAnalyzer,
  extractParticipantFeatures
}; 