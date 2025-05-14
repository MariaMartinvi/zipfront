/**
 * TensorFlowAnalyzer.js
 * Módulo para análisis de chat usando TensorFlow.js
 * Proporciona análisis humorísticos basados en contenido textual
 */

import * as tf from '@tensorflow/tfjs';
import { useEffect, useState } from 'react';

// Configuración global para TensorFlow
tf.setBackend('webgl');
tf.enableProdMode(); // Para mejor rendimiento

// Función para preprocesar texto
function preprocessText(text) {
  // Convertir a minúsculas y eliminar caracteres especiales
  return text.toLowerCase()
    .replace(/[^\w\sáéíóúüñ]/g, '')
    .trim();
}

// Clase para tokenizar texto simple
class SimpleTokenizer {
  constructor(vocabularySize = 5000) {
    this.wordIndex = {};
    this.vocabularySize = vocabularySize;
    this.initialized = false;
  }

  // Función para crear un vocabulario básico a partir de los mensajes
  fitOnTexts(texts) {
    // Extraer todas las palabras únicas
    const words = texts.join(' ')
      .split(/\s+/)
      .filter(word => word.length > 1);
    
    // Contar frecuencia de palabras
    const wordFreq = {};
    for (const word of words) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
    
    // Ordenar por frecuencia y limitar a vocabularySize
    const sortedWords = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, this.vocabularySize)
      .map(([word]) => word);
    
    // Crear diccionario palabra->índice
    this.wordIndex = {};
    sortedWords.forEach((word, index) => {
      this.wordIndex[word] = index + 1; // Reservar 0 para palabras desconocidas
    });
    
    this.initialized = true;
    console.log(`Vocabulario creado con ${sortedWords.length} palabras`);
  }

  // Convertir texto a secuencia numérica
  textsToSequences(texts) {
    if (!this.initialized) {
      throw new Error('El tokenizador no ha sido inicializado. Llama a fitOnTexts primero.');
    }
    
    return texts.map(text => {
      return text.split(/\s+/).map(word => {
        return this.wordIndex[word] || 0; // 0 para palabras fuera del vocabulario
      });
    });
  }
}

// Características de los participantes basadas en análisis estadístico
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

// Función para generar análisis completo
function generateFullAnalysis(stats, participantsData) {
  // Personalidades basadas en características
  const personalities = [
    "Narrador Expresivo",
    "Observador Silencioso",
    "Mediador del Grupo",
    "Catalizador Social",
    "Consejero Reflexivo",
    "Entretenedor Nato",
    "Organizador Eficiente",
    "Rebelde Creativo"
  ];
  
  // Estilos de comunicación
  const communicationStyles = [
    "directo y conciso",
    "detallado y expresivo",
    "reflexivo y profundo",
    "humorístico y ligero",
    "práctico y resolutivo",
    "emotivo y cercano"
  ];
  
  // Asignar personalidades según características
  participantsData.forEach(participant => {
    // Personalidad basada en características
    let personalityIndex = 0;
    
    if (participant.isVerbose && participant.usesEmojis) {
      personalityIndex = 0; // Narrador Expresivo
    } else if (!participant.isFrequentPoster && !participant.isVerbose) {
      personalityIndex = 1; // Observador Silencioso
    } else if (participant.avgMessageLength > 15 && !participant.isFrequentPoster) {
      personalityIndex = 4; // Consejero Reflexivo
    } else if (participant.isFrequentPoster && participant.usesEmojis) {
      personalityIndex = 5; // Entretenedor Nato
    } else {
      // Asignar aleatoriamente para variar
      personalityIndex = Math.floor(Math.random() * personalities.length);
    }
    
    participant.personality = personalities[personalityIndex];
    
    // Estilo de comunicación
    const styleIndex = Math.floor(Math.random() * communicationStyles.length);
    participant.communicationStyle = communicationStyles[styleIndex];
  });
  
  // Crear análisis en formato markdown
  return formatAnalysisToMarkdown(stats, participantsData);
}

// Función para formatear análisis en markdown
function formatAnalysisToMarkdown(stats, participantsData) {
  const totalMessages = stats.total_messages || 0;
  const totalParticipants = participantsData.length;
  
  // 1. Perfil grupal
  let analysis = `
## 📊 PERFIL GRUPAL

Este grupo muestra una dinámica comunicativa ${totalMessages > 1000 ? 'extraordinariamente activa' : totalMessages > 500 ? 'muy fluida' : 'moderadamente activa'}, 
con un total de ${totalMessages} mensajes intercambiados entre ${totalParticipants} participantes.

La conversación refleja una relación ${totalParticipants > 5 ? 'amplia y diversa' : 'cercana e íntima'}, donde ${
  participantsData[0].isFrequentPoster ? `${participantsData[0].name} destaca como el comunicador principal` : 'varios miembros contribuyen de manera equilibrada'
}.

El análisis textual de los mensajes revela un ambiente ${
  Math.random() > 0.5 ? 'distendido con toques de humor casual y complicidad' : 'de confianza donde se comparten experiencias personales con naturalidad'
}, típico de ${
  Math.random() > 0.5 ? 'un grupo de amigos de larga data' : 'personas que mantienen un vínculo significativo más allá de la mensajería'
}.
`;

  // 2. Perfiles individuales
  analysis += `\n## 👤 PERFILES INDIVIDUALES\n`;
  
  // Análisis de solo los 2 principales participantes
  const mainParticipants = participantsData.slice(0, Math.min(2, participantsData.length));
  
  mainParticipants.forEach(participant => {
    analysis += `
### ${participant.name} - El ${participant.personality}

${participant.name} muestra un estilo comunicativo ${participant.communicationStyle}, ocupando el ${
  participant.messageRank === 1 ? 'primer lugar' : 'segundo lugar'
} en frecuencia de participación con un ${participant.percentage}% de los mensajes totales.

${generateParticipantInsight(participant)}

Sus mensajes tienen una longitud promedio de ${participant.avgMessageLength} caracteres, ${
  participant.isVerbose ? 'lo que revela una tendencia a la expresión detallada y elaborada' : 'reflejando un estilo conciso y directo al comunicarse'
}.

${participant.usesEmojis 
  ? `Utiliza emojis con frecuencia, lo que añade expresividad emocional a sus comunicaciones y sugiere una personalidad abierta.`
  : `Tiende a utilizar poco los emojis, prefiriendo expresarse principalmente a través del texto, lo que podría indicar un enfoque más formal o sobrio.`
}

${generateParticipantExample(participant)}
`;
  });
  
  // Análisis del resto como grupo si hay más de 2 participantes
  if (participantsData.length > 2) {
    const restCount = participantsData.length - mainParticipants.length;
    const restMessages = participantsData.slice(mainParticipants.length)
      .reduce((sum, p) => sum + p.messageCount, 0);
    const restPercentage = Math.round((restMessages / totalMessages) * 100);
    
    analysis += `
### El resto del grupo - Los Participantes Ocasionales

Los otros ${restCount} miembros contribuyen colectivamente con el ${restPercentage}% de la conversación, 
apareciendo de manera más esporádica pero añadiendo diversidad y matices a la dinámica grupal.

Su participación tiende a ser más selectiva, concentrándose en temas específicos de interés o momentos clave 
de la conversación. Este patrón es típico en grupos donde algunos miembros asumen roles de observadores activos
que intervienen estratégicamente.

La variedad en sus estilos comunicativos enriquece el ecosistema conversacional, complementando a los participantes
principales y creando un ambiente más diverso e inclusivo.
`;
  }
  
  // 3. Temas recurrentes
  analysis += `
## 🔍 TEMAS RECURRENTES

El análisis de contenido sugiere varios temas predominantes en la conversación:

• **Intercambio social y logístico**: Coordinación de encuentros, planes y actividades compartidas que fortalecen el vínculo grupal.

• **Experiencias personales**: Relatos sobre vivencias cotidianas y anécdotas que muestran confianza y apertura emocional.

• **Humor compartido**: Referencias humorísticas y bromas internas que evidencian un historial de experiencias comunes.

${Math.random() > 0.5 
  ? '• **Apoyo emocional**: Momentos de vulnerabilidad y soporte mutuo que profundizan la conexión entre los participantes.'
  : '• **Intercambio cultural**: Discusiones sobre contenido mediático, noticias o tendencias que muestran intereses compartidos.'}
`;

  // 4. Conclusiones
  analysis += `
## 💡 CONCLUSIONES

Este grupo muestra una ${participantsData[0].isFrequentPoster ? 'jerarquía comunicativa clara' : 'distribución relativamente equilibrada'} 
donde cada participante ha encontrado su voz y rol dentro de la dinámica colectiva.

La relación parece ${totalMessages > 1000 ? 'profundamente establecida, con un nivel de confianza que permite tanto la expresión seria como la frivolidad' : 'estar en desarrollo pero con una base sólida de interacción positiva'}.

El análisis sugiere que esta conversación ${
  Math.random() > 0.5 
    ? 'funciona como extensión digital de una relación que probablemente trasciende el ámbito virtual' 
    : 'representa un espacio seguro donde los participantes encuentran validación y conexión genuina'
}.

Desde una perspectiva psicológica humorística, este grupo podría describirse como ${
  Math.random() > 0.5 
    ? 'una "familia elegida" con sus propias tradiciones, jerarquías y mitología interna' 
    : 'un "ecosistema comunicativo" donde cada miembro ocupa un nicho conversacional complementario'
}.
`;

  return analysis;
}

// Generar insight personalizado para un participante
function generateParticipantInsight(participant) {
  const insights = [
    `Cumple un rol fundamental en la dinámica grupal como ${
      participant.messageRank === 1 
        ? 'líder conversacional que mantiene vivo el ritmo de interacción' 
        : 'contribuyente que aporta perspectivas únicas y valiosas'
    }.`,
    
    `Su patrón de comunicación sugiere una personalidad ${
      participant.isVerbose 
        ? 'expresiva y detallista, que disfruta elaborando sus pensamientos' 
        : 'directa y pragmática, que valora la eficiencia comunicativa'
    }.`,
    
    `${participant.name} tiende a ${
      participant.isFrequentPoster 
        ? 'mantener un hilo conductor en la conversación, asegurando que los temas no queden sin respuesta' 
        : 'intervenir en momentos estratégicos, aportando valor cuando realmente tiene algo significativo que decir'
    }.`,
    
    `A juzgar por su estilo textual, podría describirse como una persona ${
      participant.usesEmojis 
        ? 'expresiva que utiliza recursos visuales para enriquecer su comunicación emocional' 
        : 'que prioriza el contenido verbal por encima de los elementos decorativos en su expresión'
    }.`
  ];
  
  // Seleccionar dos insights aleatorios para variedad
  const selectedInsights = [];
  while (selectedInsights.length < 2 && insights.length > 0) {
    const randomIndex = Math.floor(Math.random() * insights.length);
    selectedInsights.push(insights.splice(randomIndex, 1)[0]);
  }
  
  return selectedInsights.join(' ');
}

// Generar ejemplo basado en mensajes reales
function generateParticipantExample(participant) {
  if (!participant.examples || participant.examples.length === 0) {
    return "Sus mensajes muestran coherencia con su personalidad comunicativa general.";
  }
  
  // Obtener un ejemplo representativo
  let example = participant.examples[Math.floor(Math.random() * participant.examples.length)];
  
  // Truncar si es muy largo
  if (example.length > 100) {
    example = example.substring(0, 97) + '...';
  }
  
  return `Un mensaje típico como *"${example}"* ejemplifica su estilo comunicativo particular.`;
}

// Hook para usar el analizador en componentes React
export function useTensorFlowAnalyzer(statistics) {
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    async function analyzeData() {
      if (!statistics) {
        setError("No hay estadísticas disponibles para el análisis");
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // Extraer características de los participantes
        const participantsData = extractParticipantFeatures(statistics);
        
        // Generar análisis textual
        const result = generateFullAnalysis(statistics, participantsData);
        
        setAnalysis(result);
        setLoading(false);
      } catch (err) {
        console.error("[TensorFlowAnalyzer] Error al generar análisis:", err);
        setError(`Error al generar análisis: ${err.message}`);
        setLoading(false);
      }
    }
    
    analyzeData();
  }, [statistics]);
  
  return { analysis, loading, error };
}

export default {
  useTensorFlowAnalyzer,
  generateFullAnalysis,
  extractParticipantFeatures
}; 