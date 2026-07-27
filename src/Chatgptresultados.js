import React, { useState, useEffect } from 'react';
import { marked } from 'marked'; // Importamos marked
import DOMPurify from 'dompurify'; // Para seguridad
import { useTranslation } from 'react-i18next';
import './Chatgptresultados.css';
import './styles/Analisis.css';
import { useAuth } from './AuthContext';
// Las constantes ahora están en el backend
import { ShareAnalysisButton } from './shareAnalysisResults'; // NUEVO: importar botón de compartir
import { eliminarGameDataDelTexto } from './gameDataUtils';

function Chatgptresultados({ chatGptResponse, promptInput, usuarioId = "user-default" }) {
  // TODOS los hooks deben ir ANTES de cualquier return condicional
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  
  // TODOS los useState juntos
  const [htmlContent, setHtmlContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [progress, setProgress] = useState('');
  const [analysisProgress, setAnalysisProgress] = useState('');
  const [requestQueue, setRequestQueue] = useState([]);
  const [queueStatus, setQueueStatus] = useState(null);
  const [requestId, setRequestId] = useState(null);
  const [checkingQueue, setCheckingQueue] = useState(false);
  const [headlinesGameData, setHeadlinesGameData] = useState(null);
  
  // Variables para monitoreo
  const [requestCount, setRequestCount] = useState(() => {
    const saved = localStorage.getItem('chatgpt_request_count');
    return saved ? parseInt(saved, 10) : 0;
  });
  
  // TODOS los useEffect juntos
  // Procesar respuesta cuando llegue - ÚNICO useEffect para evitar duplicación
  useEffect(() => {
    if (chatGptResponse && !htmlContent) {

      
          // Buscar respuesta de IA en variable global
    const aiResponse = window.lastAIResponse || window.lastAzureResponse; // Mantener compatibilidad

    if (aiResponse) {
        // Buscar GAME_DATA en la respuesta
        const gameDataMatch = aiResponse.match(/GAME_DATA:/);
        
        if (gameDataMatch) {
          try {
            // Buscar la posición inicial del array
            const startIndex = aiResponse.indexOf('GAME_DATA:[');
            if (startIndex !== -1) {
              // Extraer desde '[' hasta encontrar el ']' que cierra el array principal
              let arrayStart = aiResponse.indexOf('[', startIndex);
              let bracketCount = 0;
              let endIndex = arrayStart;
              
              for (let i = arrayStart; i < aiResponse.length; i++) {
                if (aiResponse[i] === '[') {
                  bracketCount++;
                } else if (aiResponse[i] === ']') {
                  bracketCount--;
                  if (bracketCount === 0) {
                    endIndex = i;
                    break;
                  }
                }
              }
              
              // Extraer el JSON completo
              let jsonStr = aiResponse.substring(arrayStart, endIndex + 1);
              
              // Intentar parsear el JSON
              const parsedData = JSON.parse(jsonStr);
              
              if (parsedData && Array.isArray(parsedData) && parsedData.length >= 2) {
                let [usuarios, headlines] = parsedData;
                
                        // NUEVO: Convertir iniciales a nombres completos considerando el idioma detectado
        if (window.lastNameMapping && Object.keys(window.lastNameMapping).length > 0) {
          // Detectar el idioma de la respuesta si está disponible
          const detectedLanguage = window.lastDetectedLanguage || 'es';
          
          // Crear mapeo ajustado según el idioma detectado
          let adjustedMapping = window.lastNameMapping;
          if (detectedLanguage !== 'es') {
            adjustedMapping = window.lastNameMapping;
          }
          
          // Crear mapeo inverso con el mapeo ajustado
          const inverseMapping = {};
          Object.entries(adjustedMapping).forEach(([fullName, participantId]) => {
            inverseMapping[participantId] = fullName;
          });
          
          // Convertir usuarios
          usuarios = usuarios.map(user => inverseMapping[user] || user);
          
          // Convertir nombres en headlines
          if (Array.isArray(headlines)) {
            headlines = headlines.map(headline => {
              const nombreConvertido = inverseMapping[headline.nombre] || headline.nombre;
              return {
                ...headline,
                nombre: nombreConvertido
              };
            });
          }
        }
                
                // Guardar datos del juego
                setHeadlinesGameData([usuarios, headlines]);

              }
            }
          } catch (error) {
            console.log('Error procesando datos del juego de titulares:', error);
          }
        }
      }

      // Procesar la respuesta una sola vez
      // (quitando primero el bloque GAME_DATA, que es solo para el juego)
      let processedResponse = eliminarGameDataDelTexto(chatGptResponse);

      // NUEVO: Aplicar mapeo de nombres a toda la respuesta antes del procesamiento
      if (window.lastNameMapping && Object.keys(window.lastNameMapping).length > 0) {
        const detectedLanguage = window.lastDetectedLanguage || 'es';
        
        // Crear mapeo ajustado según el idioma detectado
        let adjustedMapping = window.lastNameMapping;
        
        // Crear mapeo inverso con el mapeo ajustado
        const inverseMapping = {};
        Object.entries(adjustedMapping).forEach(([fullName, participantId]) => {
          inverseMapping[participantId] = fullName;
        });
        
        // Aplicar mapeo inverso a toda la respuesta
        Object.entries(inverseMapping).forEach(([participantId, fullName]) => {
          const regex = new RegExp(`\\b${participantId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
          processedResponse = processedResponse.replace(regex, fullName);
        });
      }

      // NUEVO: Procesar análisis psicológico con estilo moderno
      try {
        processedResponse = processResponseWithModernPsychology(processedResponse);
      } catch (error) {
        console.error('Error procesando análisis psicológico:', error);
      }

      // NUEVO: Procesar subsecciones con cajas modernas
      try {
        processedResponse = processSubsectionsWithModernCards(processedResponse);
      } catch (error) {
        console.error('Error procesando subsecciones:', error);
      }

      // Convertir markdown a HTML
      const htmlContent = marked.parse(processedResponse);
      
      // Sanitizar el HTML
      const sanitizedContent = DOMPurify.sanitize(htmlContent);
      
      // NUEVO: Post-procesar el HTML para aplicar el diseño moderno correctamente
      const finalContent = postProcessPsychologyHTML(sanitizedContent);
      
      setHtmlContent(finalContent);
      
      // Incrementar contador de solicitudes
      setRequestCount(prevCount => {
        const newCount = prevCount + 1;
        localStorage.setItem('chatgpt_request_count', newCount.toString());
        return newCount;
      });
    }
  }, [chatGptResponse]);

  // Procesar solo cuando cambien los datos del juego
  useEffect(() => {
    if (chatGptResponse && headlinesGameData && Array.isArray(headlinesGameData) && headlinesGameData.length >= 2) {
      try {
        let processedResponse = processHeadlinesSection(chatGptResponse, headlinesGameData);
        
        // NUEVO: Aplicar mapeo de nombres a toda la respuesta antes del procesamiento (también aquí)
        if (window.lastNameMapping && Object.keys(window.lastNameMapping).length > 0) {
          const detectedLanguage = window.lastDetectedLanguage || 'es';
          
          // Crear mapeo ajustado según el idioma detectado
          let adjustedMapping = window.lastNameMapping;
          if (detectedLanguage !== 'es') {
            adjustedMapping = window.lastNameMapping;
          }
          
          // Crear mapeo inverso con el mapeo ajustado
          const inverseMapping = {};
          Object.entries(adjustedMapping).forEach(([fullName, participantId]) => {
            inverseMapping[participantId] = fullName;
          });
          
          // Aplicar mapeo inverso a toda la respuesta
          Object.entries(inverseMapping).forEach(([participantId, fullName]) => {
            const regex = new RegExp(`\\b${participantId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
            processedResponse = processedResponse.replace(regex, fullName);
          });
        }
        
        // NUEVO: Procesar análisis psicológico con estilo moderno
        try {
          processedResponse = processResponseWithModernPsychology(processedResponse);
        } catch (error) {
          console.error('Error procesando análisis psicológico:', error);
        }
        
        // NUEVO: Procesar subsecciones con cajas modernas
        try {
          processedResponse = processSubsectionsWithModernCards(processedResponse);
        } catch (error) {
          console.error('Error procesando subsecciones:', error);
        }
        
        const htmlContent = marked.parse(processedResponse);
        const sanitizedContent = DOMPurify.sanitize(htmlContent);
        
        // NUEVO: Post-procesar el HTML para aplicar el diseño moderno correctamente
        const finalContent = postProcessPsychologyHTML(sanitizedContent);
        
        setHtmlContent(finalContent);
      } catch (error) {
        console.error('Error en useEffect de headlinesGameData:', error);
      }
    }
  }, [headlinesGameData]);

  // useEffect para restablecer contadores si es necesario
  useEffect(() => {
    // Limpiar registros antiguos si es necesario
    const lastReset = localStorage.getItem('chatgpt_last_reset');
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    
    if (!lastReset || (now - parseInt(lastReset)) > oneDay) {
      // Resetear contadores diarios si han pasado más de 24 horas
      localStorage.setItem('chatgpt_request_count', '0');
      localStorage.setItem('chatgpt_last_reset', now.toString());
      setRequestCount(0);
    }
  }, []);

  // Cleanup useEffect
  useEffect(() => {
    return () => {
      // Limpiar cualquier timeout o intervalo si los hubiera
    };
  }, []);

  // Escuchar nuevo prompt para enviarlo a la cola
  useEffect(() => {
    if (promptInput && promptInput.trim().length > 0) {
      // Mostrar indicador de carga mientras se prepara el procesamiento
      setIsLoading(true);
      procesarSolicitud(promptInput);
    }
  }, [promptInput]);


  // Efecto para aplicar personalizaciones específicas según el idioma
  useEffect(() => {
    const container = document.getElementById('analysisResults');
    if (container) {
      
    }
  }, [i18n.language]);

  // FUNCIÓN procesarSolicitud - debe estar ANTES del return condicional
  const procesarSolicitud = async (prompt) => {
    setIsLoading(true);
    setQueueStatus('Procesando solicitud...');
    setError(null);
    
    // Mostrar feedback inmediato al usuario mientras se procesa
    setHtmlContent(marked.parse(`### ${t('app.processing_request')}...\n\n${t('app.please_wait')}`));
    
    try {
      // Simular tiempo de procesamiento (1-2 segundos)
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 1000));
      
      // Si llega aquí, la llamada fue exitosa
      setQueueStatus(`Solicitud procesada directamente`);
      console.log('[Simulación] Solicitud procesada con éxito directamente');
      
      // Normalmente aquí se actualizaría chatGptResponse con la respuesta real
      // Pero como es una simulación, solo mostramos un mensaje de éxito
      setHtmlContent(marked.parse(`**Respuesta simulada para**: ${prompt.substring(0, 50)}...\n\nEsta es una respuesta simulada para demostrar el sistema de colas con Azure.`));
      
    } catch (error) {
      console.log(`[DEBUG] Error capturado:`, error);
      
      // Verificar si es un error de límite de tokens
      if (error.message && 
          (error.message.includes("longer than the model's context length") || 
           error.message.includes("maximum context length"))) {
        
        console.log('[DEBUG] Error de límite de tokens detectado');
        setError('Texto demasiado largo');
        
        // Mensaje explicativo para el usuario
        const tokenErrorMsg = `### ⚠️ Texto demasiado largo\n\nEl texto que intentas analizar excede el límite de tokens permitido por el modelo.\n\nPor favor, reduce la longitud del texto e intenta nuevamente.\n\n**Sugerencias**:\n- Divide el análisis en conversaciones más pequeñas\n- Elimina partes irrelevantes de la conversación\n- Usa un modelo con mayor capacidad de contexto`;
        
        setHtmlContent(marked.parse(tokenErrorMsg));
        setIsLoading(false);
        return;
      }
      
      // Otro tipo de error
      console.error("Error completo:", error);
      setIsLoading(false);
      setQueueStatus('Error: ' + (error.message || 'Desconocido'));
      setHtmlContent(marked.parse(`### ❌ Error al procesar su solicitud\n\n${error.message || "Error desconocido"}.\n\nPor favor intente más tarde o contacte con soporte si el problema persiste.`));
    } finally {
      // Asegurarnos de que isLoading se actualice correctamente
      setIsLoading(false);
    }
  };

  // NUEVA FUNCIÓN para procesar subsecciones con cajas modernas
  const processSubsectionsWithModernCards = (response) => {
    try {
      // DEBUGGING: Buscar todas las líneas que empiecen con ###
      const allSubsections = response.match(/### [^\n]*/g);
      
      // Patrones para las 4 subsecciones específicas - SOLO ICONO + CONTENIDO
      const subsectionPatterns = [
        {
          pattern: /### 🚩[^\n]*([\s\S]*?)(?=---|\n##|$)/gi,
          className: 'alert-section',
          icon: '🚩'
        },
        {
          pattern: /### 💯[^\n]*([\s\S]*?)(?=---|\n##|$)/gi,
          className: 'evaluation-section',
          icon: '💯'
        },
        {
          pattern: /### 💡[^\n]*([\s\S]*?)(?=---|\n##|$)/gi,
          className: 'recommendations-section',
          icon: '💡'
        },
        {
          pattern: /### 🎯[^\n]*([\s\S]*?)(?=---|\n##|$)/gi,
          className: 'game-data-section',
          icon: '🎯'
        }
      ];

      let processedResponse = response;
      let sectionsFound = 0;

      subsectionPatterns.forEach(({ pattern, className, icon }) => {
        const matches = [...response.matchAll(pattern)];
        
        processedResponse = processedResponse.replace(pattern, (match, content) => {
          sectionsFound++;
          
          // Extraer el título de la primera línea del match
          const firstLine = match.split('\n')[0];
          const cleanTitle = firstLine
            .replace(`### ${icon}`, '') // Usar el icono específico en lugar de clase de caracteres
            .replace(/<\/?strong>/g, '')
            .replace(/\*\*/g, '')
            .trim();

          // Procesar el contenido para mantener markdown básico
          let processedContent = content.trim();
          
          // ESPECIAL: Si es la sección de datos del juego, procesar el JSON
          if (icon === '🎯') {
            processedContent = processGameDataContent(processedContent);
                  } else if (icon === '🚩') {
          // ESPECIAL: Si es la sección de señales de alerta, poner negritas en rojo Y agregar bolitas
          
          // Extraer textos que están en negrita para las bolitas
          const boldTexts = [];
          const boldMatches = processedContent.matchAll(/\*\*(.*?)\*\*/g);
          for (const match of boldMatches) {
            let text = match[1].trim();
            // Eliminar emojis del texto para las etiquetas
            text = text.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
            if (text && text.length > 0) {
              boldTexts.push(text);
            }
          }
          
          // Procesar contenido normal
          processedContent = processedContent
            .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #dc3545;">$1</strong>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/^(.+)$/gm, '<p>$1</p>')
            .replace(/<p><\/p>/g, '')
            .replace(/- (.*?)(?=\n|$)/g, '<li>$1</li>')
            .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
          
          // Agregar bolitas rojas al final si hay textos en negrita
          if (boldTexts.length > 0) {
            const redTags = boldTexts.map(text => `<span class="tag red">${text}</span>`).join('');
            processedContent += `<div class="psychology-tags" style="margin-top: 15px;">${redTags}</div>`;
          }
          } else {
            // Procesamiento normal para otras secciones
            processedContent = processedContent
              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              .replace(/\n\n/g, '</p><p>')
              .replace(/^(.+)$/gm, '<p>$1</p>')
              .replace(/<p><\/p>/g, '')
              .replace(/- (.*?)(?=\n|$)/g, '<li>$1</li>')
              .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
          }

          // Generar HTML de la subsección
          return `<div class="subsection-item ${className}">
  <div class="subsection-header">
    <h4><span class="subsection-icon">${icon}</span>${cleanTitle}</h4>
  </div>
  <div class="subsection-content">
    ${processedContent}
  </div>
</div>`;
        });
      });

      // Remover las líneas --- que quedan
      processedResponse = processedResponse.replace(/^---\s*$/gm, '');
      return processedResponse;
      
    } catch (error) {
      console.error('❌ Error procesando subsecciones:', error);
      return response;
    }
  };

  // FUNCIÓN processHeadlinesSection - debe estar ANTES del return condicional
  const processHeadlinesSection = (response, gameData) => {
    try {
      // VALIDACIÓN: Verificar que gameData sea válido
      if (!gameData || !Array.isArray(gameData) || gameData.length < 2) {
        console.warn('processHeadlinesSection: gameData no válido, devolviendo respuesta original');
        return response;
      }

      // Buscar el inicio de la sección de Titulares
      const titularesMatch = response.match(/## 💡 Titulares/);
      if (!titularesMatch) return response;
      
      // Buscar donde termina esta sección (siguiente ## o final del texto)
      const startIndex = titularesMatch.index;
      const nextSectionMatch = response.slice(startIndex + 20).match(/\n## /);
      const endIndex = nextSectionMatch ? 
        startIndex + 20 + nextSectionMatch.index : 
        response.length;
      
      // Extraer la parte antes y después de la sección de Titulares
      const beforeSection = response.slice(0, startIndex);
      const afterSection = response.slice(endIndex);
      
      // Crear la nueva sección con formato limpio - AHORA ES SEGURO hacer destructuring
      const [usuarios, headlines] = gameData;
      
      // VALIDACIÓN: Verificar que headlines sea válido
      if (!headlines || !Array.isArray(headlines)) {
        console.warn('processHeadlinesSection: headlines no válido, devolviendo respuesta original');
        return response;
      }
      
      // Crear mapeo inverso para obtener nombres completos
      let nameMapping = {};
      if (window.lastNameMapping && Object.keys(window.lastNameMapping).length > 0) {
        Object.entries(window.lastNameMapping).forEach(([fullName, initials]) => {
          nameMapping[initials] = fullName;
        });
      }
      
      let newTitularesSection = "## 💡 Titulares\n\n**Datos de juego:**\n\n";
      
      headlines.forEach(headline => {
        // VALIDACIÓN: Verificar que headline tenga las propiedades necesarias
        if (headline && headline.nombre && headline.frase) {
          const nombreCompleto = nameMapping[headline.nombre] || headline.nombre;
          const fraseClean = headline.frase.replace(/'/g, '').trim();
          newTitularesSection += `${nombreCompleto}: ${fraseClean}\n\n`;
        }
      });
      
      // Reconstruir la respuesta completa
      return beforeSection + newTitularesSection + afterSection;
      
    } catch (error) {
      console.error('Error procesando sección de titulares:', error);
      return response; // Devolver respuesta original si hay error
    }
  };

  // NUEVA FUNCIÓN para procesar secciones de análisis psicológico con estilo moderno
  const processResponseWithModernPsychology = (response) => {
    try {
      // REACTIVADO: Procesar análisis psicológico con descripciones completas
      let processedResponse = response;
      
      // Patrones para identificar análisis de personalidades (multi-idioma completo)
      const personalityPatterns = [
        // Español
        /## Análisis de personalidades([\s\S]*?)(?=\n## |$)/gi,
        /## 🧠 Análisis de personalidades([\s\S]*?)(?=\n## |$)/gi,
        /## 🔍 Análisis de personalidades([\s\S]*?)(?=\n## |$)/gi,
        /## 🧠 Análisis Psicológico([\s\S]*?)(?=\n## |$)/gi,
        /## 🧠 Perfiles Psicológicos([\s\S]*?)(?=\n## |$)/gi,
        /## 👥 Análisis de Personalidades([\s\S]*?)(?=\n## |$)/gi,
        /## 🎭 Personalidades del Grupo([\s\S]*?)(?=\n## |$)/gi,
        
        // Inglés
        /## Personality Analysis([\s\S]*?)(?=\n## |$)/gi,
        /## 🧠 Personality Analysis([\s\S]*?)(?=\n## |$)/gi,
        /## 🧠 Psychological Analysis([\s\S]*?)(?=\n## |$)/gi,
        /## 👥 Group Personalities([\s\S]*?)(?=\n## |$)/gi,
        /## 🎭 Group Personality Analysis([\s\S]*?)(?=\n## |$)/gi,
        
        // Francés
        /## Analyse des personnalités([\s\S]*?)(?=\n## |$)/gi,
        /## 🧠 Analyse des personnalités([\s\S]*?)(?=\n## |$)/gi,
        /## 🧠 Analyse psychologique([\s\S]*?)(?=\n## |$)/gi,
        /## 👥 Personnalités du groupe([\s\S]*?)(?=\n## |$)/gi,
        /## 🎭 Analyse des personnalités([\s\S]*?)(?=\n## |$)/gi,
        
        // Alemán
        /## Persönlichkeitsanalyse([\s\S]*?)(?=\n## |$)/gi,
        /## 🧠 Persönlichkeitsanalyse([\s\S]*?)(?=\n## |$)/gi,
        /## 🧠 Psychologische Analyse([\s\S]*?)(?=\n## |$)/gi,
        /## 👥 Gruppenpersönlichkeiten([\s\S]*?)(?=\n## |$)/gi,
        
        // Italiano
        /## Analisi delle personalità([\s\S]*?)(?=\n## |$)/gi,
        /## 🧠 Analisi delle personalità([\s\S]*?)(?=\n## |$)/gi,
        /## 🧠 Analisi psicologica([\s\S]*?)(?=\n## |$)/gi,
        /## 👥 Personalità del gruppo([\s\S]*?)(?=\n## |$)/gi,
        
        // Portugués
        /## Análise de personalidades([\s\S]*?)(?=\n## |$)/gi,
        /## 🧠 Análise de personalidades([\s\S]*?)(?=\n## |$)/gi,
        /## 🧠 Análise psicológica([\s\S]*?)(?=\n## |$)/gi,
        /## 👥 Personalidades do grupo([\s\S]*?)(?=\n## |$)/gi
      ];

      personalityPatterns.forEach(pattern => {
        processedResponse = processedResponse.replace(pattern, (match, content) => {
          return transformPsychologySection(match, content);
        });
      });

      return processedResponse;
    } catch (error) {
      console.error('Error procesando análisis psicológico:', error);
      return response;
    }
  };

  // FUNCIÓN auxiliar para transformar sección de psicología - ACTUALIZADA para el formato del prompt
  const transformPsychologySection = (fullMatch, content) => {
    try {
      // Extraer el título de la sección
      const titleMatch = fullMatch.match(/## ([^#\n]+)/);
      const sectionTitle = titleMatch ? titleMatch[1] : '🧠 Análisis Psicológico';
      
      // NUEVO: Buscar participantes con el formato ### [Nombre]
      const participantRegex = /### ([^\n]+)([\s\S]*?)(?=### |$)/g;
      let personalities = [];
      let match;
      
      while ((match = participantRegex.exec(content)) !== null) {
        let name = match[1].trim();
        const participantContent = match[2].trim();
        
                 // NUEVO: Aplicar mapeo inverso para convertir "Participant X" a nombre real
         if (window.lastNameMapping && Object.keys(window.lastNameMapping).length > 0) {
           const detectedLanguage = window.lastDetectedLanguage || 'es';
           
           // Crear mapeo ajustado según el idioma detectado
           let adjustedMapping = window.lastNameMapping;
           if (detectedLanguage !== 'es') {
             adjustedMapping = window.lastNameMapping;
           }
           
           // Crear mapeo inverso
           const inverseMapping = {};
           Object.entries(adjustedMapping).forEach(([fullName, participantId]) => {
             inverseMapping[participantId] = fullName;
           });
           
           // Aplicar mapeo inverso
           const mappedName = inverseMapping[name] || name;
           if (mappedName !== name) {
             name = mappedName;
           }
         }
        
        if (name && participantContent) {
          const personality = parseParticipantContent(name, participantContent);
          if (personality) {
            personalities.push(personality);
          }
        }
      }

      // Generar HTML moderno si se encontraron personalidades
      if (personalities.length > 0) {
        return generateModernPsychologyHTML(sectionTitle, personalities);
      }
      return fullMatch; // Devolver original si no se pudo procesar
    } catch (error) {
      console.error('❌ Error transformando sección psicológica:', error);
      return fullMatch;
    }
  };

  // NUEVA FUNCIÓN para parsear el contenido de cada participante
  const parseParticipantContent = (name, content) => {
    try {
      let traits = [];
      
      // ESTRATEGIA MEJORADA: Primero intentar con headers, luego sin header
      let traitsSection = '';
      
      // 1. Intentar con headers específicos primero - MEJORADO para todos los idiomas
      const headerPatterns = [
        // Español
        /(?:rasgos principales|traits principales):\s*([\s\S]*?)(?:\n\s*-?\s*\*\*?(?:fortalezas|áreas de mejora|strengths?|areas? for improvement)|$)/gi,
        // Inglés
        /(?:main traits?):\s*([\s\S]*?)(?:\n\s*-?\s*\*\*?(?:strengths?|areas? for improvement|fortalezas|áreas de mejora)|$)/gi,
        // Francés
        /(?:traits principaux):\s*([\s\S]*?)(?:\n\s*-?\s*\*\*?(?:forces|domaines d'amélioration|atouts|points forts)|$)/gi,
        // Alemán
        /(?:hauptmerkmale):\s*([\s\S]*?)(?:\n\s*-?\s*\*\*?(?:stärken|verbesserungsbereiche)|$)/gi,
        // Italiano
        /(?:tratti principali):\s*([\s\S]*?)(?:\n\s*-?\s*\*\*?(?:punti di forza|aree di miglioramento)|$)/gi,
        // Portugués
        /(?:traços principais):\s*([\s\S]*?)(?:\n\s*-?\s*\*\*?(?:pontos fortes|áreas de melhoria)|$)/gi
      ];
      
      // Buscar con headers primero
      for (const pattern of headerPatterns) {
        const match = pattern.exec(content);
        if (match && match[1]) {
          traitsSection = match[1].trim();
          break;
        }
      }
      
      // 2. Si no encontramos con header, buscar formato sin header (solo hasta "Strengths:")
      if (!traitsSection) {
        const noHeaderMatch = content.match(/^((?:.*?[\u{1F300}-\u{1F9FF}]\s*\*\*[^*]+\*\*.*?\n?)*?)(?:\n\s*(?:strengths?|fortalezas|forces|stärken|punti di forza|pontos fortes|atouts):\s*)/gius);
        if (noHeaderMatch && noHeaderMatch[1]) {
          traitsSection = noHeaderMatch[1].trim();
        }
      }
      
      // Si encontramos la sección, extraer traits de ella
      if (traitsSection) {
        // Buscar traits con emoji + negrita en la sección
        const emojiTraitMatches = traitsSection.match(/[\u{1F300}-\u{1F9FF}]\s*\*\*([^*]+)\*\*/gu);
        
        if (emojiTraitMatches && emojiTraitMatches.length > 0) {
          emojiTraitMatches.forEach(match => {
            // Extraer solo el texto entre ** (eliminar emoji y **)
            let trait = match.replace(/[\u{1F300}-\u{1F9FF}]\s*\*\*|\*\*/gu, '').trim();
            // Eliminar cualquier emoji restante del trait
            trait = trait.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
            // MANTENER TODO EL TEXTO, no cortar en el guión
            
            if (trait && trait.length > 2 && trait.length < 100) {
              traits.push(trait);
            }
          });
        }
      }
      
      // Fallback: Si no encontramos traits en sección específica, buscar en todo el contenido
      if (traits.length === 0) {
        // Buscar cualquier emoji + texto en negrita
        const universalEmojiTraitMatches = content.match(/[\u{1F300}-\u{1F9FF}]\s*\*\*([^*]+)\*\*/gu);
        
        if (universalEmojiTraitMatches && universalEmojiTraitMatches.length > 0) {
          universalEmojiTraitMatches.forEach(match => {
            let trait = match.replace(/[\u{1F300}-\u{1F9FF}]\s*\*\*|\*\*/gu, '').trim();
            trait = trait.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
            // MANTENER TODO EL TEXTO, no cortar en el guión
            
            // Filtrar palabras de sección (headers)
            const sectionWords = [
              'rasgos principales', 'main traits', 'traits principaux', 'hauptmerkmale',
              'fortalezas', 'strengths', 'forces', 'stärken',
              'debilidades', 'weaknesses', 'faiblesses', 'schwächen',
              'áreas de mejora', 'areas for improvement', 'domaines d\'amélioration', 'verbesserungsbereiche'
            ];
            
            const isSection = sectionWords.some(word => trait.toLowerCase().includes(word.toLowerCase()));
            
            if (trait && trait.length > 2 && trait.length < 100 && !isSection) {
              traits.push(trait);
            }
          });
        }
      }

      // Limpieza final de traits para asegurar que no haya emojis
      const cleanedTraits = traits.slice(0, 4).map(trait => {
        return trait.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
      }).filter(trait => trait.length > 0);

      const result = {
        name: cleanPersonalityName(name),
        description: content.trim(), // MANTENER TODO EL CONTENIDO ORIGINAL
        traits: cleanedTraits // Máximo 4 traits sin emojis
      };
      
      return result;
    } catch (error) {
      console.error(`❌ Error parseando contenido del participante ${name}:`, error);
      return null;
    }
  };

  // FUNCIÓN para limpiar texto de descripción
  const cleanDescriptionText = (text) => {
    return text
      .replace(/\*\*/g, '')
      .replace(/^\s*[\-\*]\s*/gm, '')
      .replace(/\n\s*\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // FUNCIÓN para limpiar nombres de personalidades
  const cleanPersonalityName = (name) => {
    return name
      .replace(/\*\*/g, '')
      .replace(/^[:\-\s]+|[:\-\s]+$/g, '')
      .trim();
  };

  // FUNCIÓN para obtener color de avatar
  const getAvatarColor = (index, name) => {
    const colors = ['green', 'purple', 'pink', 'blue', 'orange', 'teal', 'yellow'];
    // Usar el índice y el nombre para una distribución más consistente
    const nameHash = name.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return colors[(index + nameHash) % colors.length];
  };

  // FUNCIÓN para generar HTML moderno del análisis psicológico
  const generateModernPsychologyHTML = (title, personalities) => {
    const psychologyItems = personalities.map((personality, index) => {
      const avatarColor = getAvatarColor(index, personality.name);
      const firstLetter = personality.name.charAt(0).toUpperCase();
      
      const tagsHTML = personality.traits && personality.traits.length > 0 
        ? personality.traits.map(trait => {
            // Eliminar emojis del trait antes de crear el tag
            const cleanTrait = trait.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
            return `<span class="tag ${avatarColor}">${cleanTrait}</span>`;
          }).join('')
        : '';

      // NUEVO: Procesar markdown en la descripción para mantener iconos y negritas
      const processedDescription = personality.description
        // Convertir **texto** a <strong>texto</strong>
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

      return `<div class="psychology-item"><div class="avatar ${avatarColor}-avatar">${firstLetter}</div><div class="psychology-content"><h4>${personality.name}</h4><p>${processedDescription}</p><div class="psychology-tags">${tagsHTML}</div></div></div>`;
    }).join('');

    // CAMBIO: Agregar atributo data para aplicar estilos específicos
    return `<h2 class="psychology-section-title" data-psychology-title="true">${title}</h2>

<div class="psychology-list">${psychologyItems}</div>`;
  };

  // NUEVA FUNCIÓN para post-procesar el HTML y aplicar el diseño moderno
  const postProcessPsychologyHTML = (htmlContent) => {
    try {
      // Buscar secciones de psicología que se hayan convertido incorrectamente
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      
      // NUEVO: Convertir cualquier ## que no se haya procesado a h2
      let processedHTML = htmlContent;
      processedHTML = processedHTML.replace(/## ([^#\n]+)/g, '<h2>$1</h2>');
      tempDiv.innerHTML = processedHTML;
      
      // Buscar elementos <pre><code> que contengan psychology-item
      const preElements = tempDiv.querySelectorAll('pre code');
      
      preElements.forEach(codeElement => {
        const codeContent = codeElement.textContent || codeElement.innerText;
        
        // Si el contenido contiene psychology-item, reemplazarlo con HTML real
        if (codeContent.includes('psychology-item')) {
          // Decodificar entidades HTML
          const decodedHTML = codeContent
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, '&');
          
          // Crear un contenedor div y reemplazar el pre
          const newDiv = document.createElement('div');
          newDiv.className = 'psychology-list';
          newDiv.innerHTML = decodedHTML;
          
          // Reemplazar el elemento pre con el nuevo div
          const preElement = codeElement.closest('pre');
          if (preElement && preElement.parentNode) {
            preElement.parentNode.replaceChild(newDiv, preElement);
          }
        }
      });
      
      return tempDiv.innerHTML;
    } catch (error) {
      console.error('Error en post-procesamiento:', error);
      return htmlContent;
    }
  };

  // NUEVA FUNCIÓN para procesar el contenido de datos del juego de forma amigable
  const processGameDataContent = (content) => {
    try {
      // Si hay GAME_DATA disponible desde headlinesGameData
      if (headlinesGameData && Array.isArray(headlinesGameData) && headlinesGameData.length >= 2) {
        const [usuarios, headlines] = headlinesGameData;
        
        if (headlines && Array.isArray(headlines)) {
          let formattedData = '<div class="game-data-display">';
          
          headlines.forEach(headline => {
            if (headline && headline.nombre && headline.frase) {
              const fraseClean = headline.frase.replace(/'/g, '').trim();
              formattedData += `<p><strong>${headline.nombre}:</strong> ${fraseClean}</p>`;
            }
          });
          
          formattedData += '</div>';
          return formattedData;
        }
      }
      
      // Si no hay headlinesGameData, buscar en el contenido texto JSON
      const jsonMatch = content.match(/\[([\s\S]*?)\]/);
      if (jsonMatch) {
        try {
          // Intentar extraer datos del JSON en el texto
          const jsonStr = jsonMatch[0];
          const parsedData = JSON.parse(jsonStr);
          
          if (Array.isArray(parsedData) && parsedData.length >= 2) {
            const [usuarios, headlines] = parsedData;
            
            if (headlines && Array.isArray(headlines)) {
              let formattedData = '<div class="game-data-display">';
              
              headlines.forEach(headline => {
                if (headline && headline.nombre && headline.frase) {
                  const fraseClean = headline.frase.replace(/'/g, '').trim();
                  formattedData += `<p><strong>${headline.nombre}:</strong> ${fraseClean}</p>`;
                }
              });
              
              formattedData += '</div>';
              return formattedData;
            }
          }
        } catch (error) {
          console.log('Error parseando JSON en datos del juego:', error);
        }
      }
      
      // Fallback: mostrar contenido original procesado
      return content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/^(.+)$/gm, '<p>$1</p>')
        .replace(/<p><\/p>/g, '');
        
    } catch (error) {
      console.error('Error procesando datos del juego:', error);
      return content;
    }
  };

  // CRÍTICO: Verificar autenticación DESPUÉS de declarar todos los hooks
  if (!user) {
    console.error('[SEGURIDAD] Chatgptresultados: Sin usuario autenticado - bloqueando análisis psicológico');
    return null;
  }

  // Si está cargando pero ya tenemos contenido para mostrar, mostramos ambos
  if (isLoading) {
    return (
      <div>
        <div className="loading-container" style={{ 
          textAlign: 'center', 
          padding: '15px', 
          backgroundColor: '#f0f8ff',
          borderRadius: '8px',
          margin: '15px 0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div className="spinner" style={{
            border: '4px solid rgba(0, 0, 0, 0.1)',
            borderLeft: '4px solid #3498db',
            borderRadius: '50%',
            width: '30px',
            height: '30px',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 15px auto'
          }}></div>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          <p style={{ fontWeight: 'bold', color: '#3498db', margin: '0' }}>{t('app.processing_request')}</p>
        </div>
        
        {/* Mostrar el contenido parcial si existe - siempre lo mostramos, incluso durante la carga */}
        {htmlContent && (
          <div id="analysisResults-container">
            <div 
              id="analysisResults" 
              className={`chat-analysis-container language-${i18n.language}`}
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
            {/* NUEVO: Botón para compartir análisis completo también durante carga */}
            {/* DEBUG: Verificar función t antes de pasarla */}
            {console.log('🔍 DEBUG Chatgptresultados - Función t disponible:', !!t, 'Tipo:', typeof t, 'Idioma:', i18n.language)}
            <ShareAnalysisButton 
              htmlContent={htmlContent}
              t={t}
              currentLanguage={i18n.language}
            />
          </div>
        )}
      </div>
    );
  }

  // Si no hay contenido y no estamos cargando, mostrar mensaje más informativo
  if (!htmlContent && !isLoading) {
    return (
      <div className="no-content-message" style={{ 
        textAlign: 'center', 
        padding: '30px', 
        color: '#666',
        backgroundColor: '#f9f9f9',
        borderRadius: '8px',
        margin: '20px 0'
      }}>
        {chatGptResponse === null ? 
          t('app.enter_prompt') : 
          <div>
            <div className="spinner-small" style={{
              border: '3px solid rgba(0, 0, 0, 0.1)',
              borderLeft: '3px solid #999',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 10px auto'
            }}></div>
            <p>{t('app.loading_status')}</p>
          </div>
        }
      </div>
    );
  }

  // Si tenemos contenido y no estamos cargando, mostrar los resultados
  return (
    <div id="analysisResults-container">
      <div 
        id="analysisResults" 
        className={`chat-analysis-container language-${i18n.language}`}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
      {/* NUEVO: Botón para compartir análisis completo */}
      {htmlContent && (
        <>
          {/* DEBUG: Verificar función t antes de pasarla */}
          {console.log('🔍 DEBUG Chatgptresultados FINAL - Función t disponible:', !!t, 'Tipo:', typeof t, 'Idioma:', i18n.language)}
          <ShareAnalysisButton 
            htmlContent={htmlContent}
            t={t}
            currentLanguage={i18n.language}
          />
        </>
      )}
    </div>
  );
}

export default Chatgptresultados;