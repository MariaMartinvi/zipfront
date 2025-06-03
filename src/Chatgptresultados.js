import React, { useState, useEffect } from 'react';
import { marked } from 'marked'; // Importamos marked
import DOMPurify from 'dompurify'; // Para seguridad
import { useTranslation } from 'react-i18next';
import './Chatgptresultados.css';
import './styles/Analisis.css';
import azureQueueService from './services/azureQueueService'; // Importamos el servicio de cola existente
import lzString from 'lz-string';
import { useAuth } from './AuthContext';

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
  
  // Estados para el modal de compartir (igual que en App.js)
  const [showShareGameModal, setShowShareGameModal] = useState(false);
  const [gameUrl, setGameUrl] = useState('');
  
  // Estados para el juego de titulares
  const [showHeadlinesShare, setShowHeadlinesShare] = useState(false);
  const [headlinesUrl, setHeadlinesUrl] = useState("");
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);
  
  // NUEVO: Estados para el juego de personalidades
  const [personalityGameUrl, setPersonalityGameUrl] = useState('');
  const [showPersonalityModal, setShowPersonalityModal] = useState(false);
  const [showPersonalityCopiedMessage, setShowPersonalityCopiedMessage] = useState(false);
  
  // Estados para gestión de solicitudes
  const [activeRequests, setActiveRequests] = useState(new Set());
  
  // Variables para monitoreo
  const [requestCount, setRequestCount] = useState(() => {
    const saved = localStorage.getItem('chatgpt_request_count');
    return saved ? parseInt(saved, 10) : 0;
  });
  
  // TODOS los useEffect juntos
  // Procesar respuesta cuando llegue
  useEffect(() => {
    if (chatGptResponse) {
      console.log('Procesando respuesta para extraer datos del juego de titulares...');
      
      // Buscar respuesta de Azure en variable global
      const azureResponse = window.lastAzureResponse;
      
      if (azureResponse) {
        // Buscar GAME_DATA en la respuesta
        const gameDataMatch = azureResponse.match(/GAME_DATA:/);
        
        if (gameDataMatch) {
          try {
            // Buscar la posición inicial del array
            const startIndex = azureResponse.indexOf('GAME_DATA:[');
            if (startIndex !== -1) {
              // Extraer desde '[' hasta encontrar el ']' que cierra el array principal
              let arrayStart = azureResponse.indexOf('[', startIndex);
              let bracketCount = 0;
              let endIndex = arrayStart;
              
              for (let i = arrayStart; i < azureResponse.length; i++) {
                if (azureResponse[i] === '[') {
                  bracketCount++;
                } else if (azureResponse[i] === ']') {
                  bracketCount--;
                  if (bracketCount === 0) {
                    endIndex = i;
                    break;
                  }
                }
              }
              
              // Extraer el JSON completo
              let jsonStr = azureResponse.substring(arrayStart, endIndex + 1);
              
              // Intentar parsear el JSON
              const parsedData = JSON.parse(jsonStr);
              
              if (parsedData && Array.isArray(parsedData) && parsedData.length >= 2) {
                let [usuarios, headlines] = parsedData;
                
                // Convertir iniciales a nombres completos si hay nameMapping disponible
                if (window.lastNameMapping && Object.keys(window.lastNameMapping).length > 0) {
                  // Crear mapeo inverso
                  const inverseMapping = {};
                  Object.entries(window.lastNameMapping).forEach(([fullName, initials]) => {
                    inverseMapping[initials] = fullName;
                  });
                  
                  // Convertir usuarios
                  usuarios = usuarios.map(user => inverseMapping[user] || user);
                  
                  // Convertir nombres en headlines
                  if (Array.isArray(headlines)) {
                    headlines = headlines.map(headline => ({
                      ...headline,
                      nombre: inverseMapping[headline.nombre] || headline.nombre
                    }));
                  }
                }
                
                // Guardar datos del juego
                setHeadlinesGameData([usuarios, headlines]);
                console.log('Datos del juego de titulares procesados:', [usuarios, headlines]);
              }
            }
          } catch (error) {
            console.log('Error procesando datos del juego de titulares:', error);
          }
        }
      }

      // Procesar la respuesta para reemplazar la sección de Titulares (CON VALIDACIÓN)
      let processedResponse = chatGptResponse;
      
      // Si hay datos del juego, reemplazar la sección de Titulares (CON VALIDACIÓN)
      if (azureResponse && headlinesGameData && Array.isArray(headlinesGameData) && headlinesGameData.length >= 2) {
        try {
          processedResponse = processHeadlinesSection(chatGptResponse, headlinesGameData);
        } catch (error) {
          console.error('Error procesando headlinesGameData en useEffect principal:', error);
          // Si hay error, usar la respuesta original sin procesar
          processedResponse = chatGptResponse;
        }
      }

      // NUEVO: Procesar análisis psicológico con estilo moderno
      try {
        processedResponse = processResponseWithModernPsychology(processedResponse);
      } catch (error) {
        console.error('Error procesando análisis psicológico:', error);
        // Si hay error, continuar con la respuesta sin procesar la psicología
      }

      // NUEVO: Procesar subsecciones con cajas modernas
      try {
        processedResponse = processSubsectionsWithModernCards(processedResponse);
      } catch (error) {
        console.error('Error procesando subsecciones:', error);
        // Si hay error, continuar con la respuesta sin procesar las subsecciones
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

  // Efecto separado para procesar el contenido cuando headlinesGameData cambie
  useEffect(() => {
    if (chatGptResponse && headlinesGameData && Array.isArray(headlinesGameData) && headlinesGameData.length >= 2) {
      try {
        let processedResponse = processHeadlinesSection(chatGptResponse, headlinesGameData);
        
        // NUEVO: Procesar análisis psicológico con estilo moderno
        try {
          processedResponse = processResponseWithModernPsychology(processedResponse);
        } catch (error) {
          console.error('Error procesando análisis psicológico en useEffect headlinesGameData:', error);
        }
        
        // NUEVO: Procesar subsecciones con cajas modernas
        try {
          processedResponse = processSubsectionsWithModernCards(processedResponse);
        } catch (error) {
          console.error('Error procesando subsecciones en useEffect headlinesGameData:', error);
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
  }, [headlinesGameData, chatGptResponse]);

  // useEffect para verificar el idioma del usuario y procesar el texto
  useEffect(() => {
    if (chatGptResponse) {
      // Detectar idioma del usuario (predeterminado a español)
      const userLanguage = i18n.language?.substring(0, 2) || 'es';
      console.log(`Idioma detectado: ${userLanguage}`);
      
      // Solo procesar el HTML si no se ha procesado antes
      if (!htmlContent) {
        try {
          // Solo procesar con headlinesGameData si es válido
          const gameDataToUse = (headlinesGameData && Array.isArray(headlinesGameData) && headlinesGameData.length >= 2) 
            ? headlinesGameData 
            : null;
          
          let processedResponse = processHeadlinesSection(chatGptResponse, gameDataToUse);
          
          // NUEVO: Procesar análisis psicológico con estilo moderno
          try {
            processedResponse = processResponseWithModernPsychology(processedResponse);
          } catch (error) {
            console.error('Error procesando análisis psicológico en useEffect idioma:', error);
          }
          
          // NUEVO: Procesar subsecciones con cajas modernas
          try {
            processedResponse = processSubsectionsWithModernCards(processedResponse);
          } catch (error) {
            console.error('Error procesando subsecciones en useEffect idioma:', error);
          }
          
          const htmlContent = marked.parse(processedResponse);
          const sanitizedContent = DOMPurify.sanitize(htmlContent);
          
          // NUEVO: Post-procesar el HTML para aplicar el diseño moderno correctamente
          const finalContent = postProcessPsychologyHTML(sanitizedContent);
          
          setHtmlContent(finalContent);
        } catch (error) {
          console.error('Error procesando respuesta:', error);
          setError('Error al procesar la respuesta');
        }
      }
    }
  }, [chatGptResponse, i18n.language, htmlContent, headlinesGameData]);

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
      setActiveRequests(new Set());
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

  // Verificar periódicamente el estado de la solicitud encolada
  useEffect(() => {
    let intervalId = null;
    
    if (requestId && !checkingQueue) {
      setCheckingQueue(true);
      
      // Verificar el estado cada 10 segundos
      intervalId = setInterval(async () => {
        try {
          const status = await azureQueueService.checkRequestStatus(requestId);
          
          console.log('Estado de la solicitud en cola:', status);
          
          if (status.success) {
            setQueueStatus(`Estado: ${status.status || 'pendiente'}`);
            
            // Si la solicitud ya fue procesada
            if (status.status === 'completed' && status.result) {
              clearInterval(intervalId);
              setCheckingQueue(false);
              setQueueStatus('Solicitud procesada con éxito');
              
              // Mostrar el resultado
              const rawHtml = marked.parse(status.result);
              const cleanHtml = DOMPurify.sanitize(rawHtml);
              setHtmlContent(cleanHtml);
            }
          } else {
            setQueueStatus(`Error verificando estado: ${status.error}`);
          }
        } catch (error) {
          console.error('Error verificando estado:', error);
          setQueueStatus('Error al verificar estado de la solicitud');
        }
      }, 10000);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [requestId, checkingQueue]);

  // Efecto para aplicar personalizaciones específicas según el idioma
  useEffect(() => {
    const container = document.getElementById('analysisResults');
    if (container) {
      console.log(`Idioma actualizado a: ${i18n.language}`);
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
      console.log('🔧 Procesando subsecciones con cajas modernas...');
      console.log('📄 Contenido a analizar (primeros 500 chars):', response.substring(0, 500));
      
      // DEBUGGING: Buscar todas las líneas que empiecen con ###
      const allSubsections = response.match(/### [^\n]*/g);
      console.log('🔍 Todas las subsecciones encontradas:', allSubsections);
      
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
        console.log(`🔍 Buscando patrón ${icon}: ${matches.length} coincidencias encontradas`);
        
        // DEBUG ESPECIAL para 🎯
        if (icon === '🎯') {
          console.log(`🎯 DEBUG: Patrón usado:`, pattern);
          console.log(`🎯 DEBUG: Buscando en texto que contiene "### 🎯":`, response.includes('### 🎯'));
          
          // Buscar manualmente la sección
          const manualMatch = response.match(/### 🎯[^#]*?([\s\S]*?)(?=---|\n##|$)/gi);
          console.log(`🎯 DEBUG: Búsqueda manual encontró:`, manualMatch ? manualMatch.length : 0, 'coincidencias');
          if (manualMatch) {
            console.log(`🎯 DEBUG: Primera coincidencia manual:`, manualMatch[0].substring(0, 200) + '...');
          }
        }
        
        matches.forEach((match, index) => {
          const firstLine = match[0].split('\n')[0];
          const title = firstLine.replace(`### ${icon}`, '').replace(/<\/?strong>/g, '').replace(/\*\*/g, '').trim();
          console.log(`📦 Match ${index + 1} - Título: "${title}", Contenido: ${match[1]?.substring(0, 100)}...`);
        });
        
        processedResponse = processedResponse.replace(pattern, (match, content) => {
          sectionsFound++;
          console.log(`✅ Procesando subsección ${sectionsFound} con icono ${icon}`);
          
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
              const text = match[1].trim();
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

      console.log(`📊 Total de subsecciones procesadas: ${sectionsFound}`);

      // Remover las líneas --- que quedan
      processedResponse = processedResponse.replace(/^---\s*$/gm, '');

      console.log('✅ Subsecciones procesadas correctamente');
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
      
      // Patrones para identificar análisis de personalidades (multi-idioma)
      const personalityPatterns = [
        /## Análisis de personalidades([\s\S]*?)(?=\n## |$)/gi,
        /## 🧠 Análisis de personalidades([\s\S]*?)(?=\n## |$)/gi,
        /## 🔍 Análisis de personalidades([\s\S]*?)(?=\n## |$)/gi,
        /## 🧠 Análisis Psicológico([\s\S]*?)(?=\n## |$)/gi,
        /## 🧠 Perfiles Psicológicos([\s\S]*?)(?=\n## |$)/gi,
        /## 👥 Análisis de Personalidades([\s\S]*?)(?=\n## |$)/gi,
        /## 🎭 Personalidades del Grupo([\s\S]*?)(?=\n## |$)/gi,
        /## 🧠 Personality Analysis([\s\S]*?)(?=\n## |$)/gi,
        /## 🧠 Psychological Analysis([\s\S]*?)(?=\n## |$)/gi,
        /## 👥 Group Personalities([\s\S]*?)(?=\n## |$)/gi
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
      
      console.log('🔍 Procesando sección psicológica:', sectionTitle);
      console.log('📄 Contenido a procesar:', content.substring(0, 200) + '...');
      
      // NUEVO: Buscar participantes con el formato ### [Nombre]
      const participantRegex = /### ([^\n]+)([\s\S]*?)(?=### |$)/g;
      let personalities = [];
      let match;
      
      while ((match = participantRegex.exec(content)) !== null) {
        const name = match[1].trim();
        const participantContent = match[2].trim();
        
        console.log(`👤 Encontrado participante: "${name}"`);
        console.log(`📝 Contenido del participante (primeros 100 chars): ${participantContent.substring(0, 100)}...`);
        
        if (name && participantContent) {
          const personality = parseParticipantContent(name, participantContent);
          if (personality) {
            console.log(`✅ Personalidad procesada exitosamente:`, personality);
            personalities.push(personality);
          } else {
            console.warn(`⚠️ No se pudo procesar la personalidad para: ${name}`);
          }
        }
      }

      console.log(`📊 Total personalidades encontradas: ${personalities.length}`);

      // Generar HTML moderno si se encontraron personalidades
      if (personalities.length > 0) {
        console.log('🎨 Generando HTML moderno para', personalities.length, 'personalidades');
        return generateModernPsychologyHTML(sectionTitle, personalities);
      }
      
      console.log('⚠️ No se encontraron personalidades, devolviendo formato original');
      return fullMatch; // Devolver original si no se pudo procesar
    } catch (error) {
      console.error('❌ Error transformando sección psicológica:', error);
      return fullMatch;
    }
  };

  // NUEVA FUNCIÓN para parsear el contenido de cada participante
  const parseParticipantContent = (name, content) => {
    try {
      console.log(`🔧 Parseando contenido para: ${name}`);
      let traits = [];
      
      // MEJORADO: Buscar múltiples patrones para extraer traits
      // 1. Buscar la sección "Rasgos principales"
      const rasgosMatch = content.match(/\*\*Rasgos principales:\*\*\s*([\s\S]*?)(?=\*\*[^*]|\n\n|$)/i);
      
      if (rasgosMatch) {
        console.log(`📋 Encontrada sección "Rasgos principales" para ${name}`);
        const rasgosSection = rasgosMatch[1];
        // Extraer títulos que están entre ** (sin incluir los ** en el resultado)
        const titleMatches = rasgosSection.match(/\*\*([^*]+)\*\*/g);
        
        if (titleMatches) {
          traits = titleMatches.map(match => 
            match.replace(/\*\*/g, '').trim()
          );
          console.log(`🎯 Traits extraídos de "Rasgos principales":`, traits);
        }
      } else {
        console.log(`⚠️ No se encontró sección "Rasgos principales" para ${name}`);
      }
      
      // 2. Si no encontramos en "Rasgos principales", buscar cualquier texto en negrita que parezca un trait
      if (traits.length === 0) {
        console.log(`🔍 Buscando traits en cualquier texto en negrita para ${name}`);
        const allBoldMatches = content.match(/\*\*([^*]+)\*\*/g);
        if (allBoldMatches) {
          console.log(`📝 Textos en negrita encontrados:`, allBoldMatches);
          // Filtrar para obtener solo traits (evitar palabras como "Fortalezas", "Debilidades", etc.)
          const excludeWords = ['rasgos principales', 'fortalezas', 'debilidades', 'áreas de mejora', 'strengths', 'weaknesses'];
          traits = allBoldMatches
            .map(match => match.replace(/\*\*/g, '').trim())
            .filter(text => {
              const lowerText = text.toLowerCase();
              return !excludeWords.some(word => lowerText.includes(word)) && 
                     text.length > 2 && text.length < 30; // Longitud razonable para un trait
            })
            .slice(0, 4); // Máximo 4 traits
          console.log(`🎯 Traits filtrados de textos en negrita:`, traits);
        }
      }
      
      // 3. Si aún no tenemos traits, buscar en todo el contenido palabras clave
      if (traits.length === 0) {
        console.log(`🔍 Usando extracción de keywords para ${name}`);
        traits = extractTraitsFromContent('', content, '');
        console.log(`🎯 Traits extraídos por keywords:`, traits);
      }
      
      // 4. Fallback final si no se encuentran traits
      if (traits.length === 0) {
        console.log(`🎯 Usando traits por defecto para ${name}`);
        traits = ['Comunicativo', 'Sociable', 'Activo'];
      }

      const result = {
        name: cleanPersonalityName(name),
        description: content.trim(), // MANTENER TODO EL CONTENIDO ORIGINAL
        traits: traits.slice(0, 4) // Máximo 4 traits
      };
      
      console.log(`✅ Resultado final para ${name}:`, result);
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

  // FUNCIÓN actualizada para extraer traits del contenido estructurado
  const extractTraitsFromContent = (role, traits, strengths) => {
    const allText = `${role} ${traits} ${strengths}`.toLowerCase();
    const extractedTraits = [];
    
    // Traits comunes en múltiples idiomas
    const commonTraits = {
      // Español
      'líder': 'Líder', 'lider': 'Líder', 'comunicativo': 'Comunicativo', 'comunicativa': 'Comunicativa',
      'organizador': 'Organizador', 'organizadora': 'Organizadora', 'sociable': 'Sociable',
      'reflexivo': 'Reflexivo', 'reflexiva': 'Reflexiva', 'directo': 'Directo', 'directa': 'Directa',
      'práctico': 'Práctico', 'práctica': 'Práctica', 'alegre': 'Alegre', 'expresivo': 'Expresivo',
      'expresiva': 'Expresiva', 'positivo': 'Positivo', 'positiva': 'Positiva', 'mediador': 'Mediador',
      'observador': 'Observador', 'cómico': 'Cómico', 'analítico': 'Analítico', 'creativo': 'Creativo',
      'empático': 'Empático', 'optimista': 'Optimista', 'paciente': 'Paciente', 'enérgico': 'Enérgico',
      'coordinador': 'Coordinador', 'proactivo': 'Proactivo', 'humorístico': 'Humorístico',
      
      // English
      'leader': 'Leader', 'communicative': 'Communicative', 'organizer': 'Organizer', 'social': 'Social',
      'analytical': 'Analytical', 'creative': 'Creative', 'direct': 'Direct', 'practical': 'Practical',
      'positive': 'Positive', 'mediator': 'Mediator', 'observer': 'Observer', 'funny': 'Funny',
      'empathetic': 'Empathetic', 'optimistic': 'Optimistic', 'patient': 'Patient', 'energetic': 'Energetic',
      'coordinator': 'Coordinator', 'proactive': 'Proactive', 'humorous': 'Humorous'
    };

    // Buscar traits en el texto
    Object.entries(commonTraits).forEach(([key, value]) => {
      if (allText.includes(key) && !extractedTraits.includes(value)) {
        extractedTraits.push(value);
      }
    });

    // Si no se encontraron traits específicos, usar traits por defecto basados en el rol
    if (extractedTraits.length === 0) {
      const roleToTraits = {
        'líder': ['Líder', 'Proactivo', 'Organizador'],
        'leader': ['Leader', 'Proactive', 'Organizer'],
        'coordinador': ['Coordinador', 'Comunicativo', 'Sociable'],
        'coordinator': ['Coordinator', 'Communicative', 'Social'],
        'mediador': ['Mediador', 'Empático', 'Paciente'],
        'mediator': ['Mediator', 'Empathetic', 'Patient'],
        'observador': ['Observador', 'Analítico', 'Reflexivo'],
        'observer': ['Observer', 'Analytical', 'Reflective'],
        'cómico': ['Cómico', 'Alegre', 'Sociable'],
        'funny': ['Funny', 'Cheerful', 'Social']
      };

      const lowerRole = role.toLowerCase();
      for (const [key, traits] of Object.entries(roleToTraits)) {
        if (lowerRole.includes(key)) {
          return traits.slice(0, 3);
        }
      }

      // Traits por defecto si no se encuentra nada
      return ['Comunicativo', 'Sociable', 'Activo'];
    }

    return extractedTraits.slice(0, 4); // Máximo 4 traits
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
      
      const tagsHTML = personality.traits.map(trait => 
        `<span class="tag ${avatarColor}">${trait}</span>`
      ).join('');

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

  // Función para generar URL del juego de titulares (igual que en App.js)
  const generateHeadlinesGameUrl = () => {
    try {
      if (!headlinesGameData) {
        alert("No hay datos de juego disponibles");
        return;
      }
      
      // Comprimir datos con LZ-String
      const compressedData = lzString.compressToEncodedURIComponent(JSON.stringify(headlinesGameData));
      
      // Crear URL del juego
      const url = `${window.location.origin}/headlines-game?h=${compressedData}`;
      
      setGameUrl(url);
      setShowShareGameModal(true);
      
    } catch (error) {
      console.error('Error generando URL del juego:', error);
      alert("Error al generar el enlace del juego");
    }
  };

  // Función para copiar al portapapeles (igual que en App.js)
  const copyToClipboard = () => {
    navigator.clipboard.writeText(gameUrl).then(() => {
      setShowCopiedMessage(true);
      setTimeout(() => setShowCopiedMessage(false), 2000);
    }).catch(err => {
      console.error('Error al copiar:', err);
      // Fallback para navegadores que no soportan clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = gameUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setShowCopiedMessage(true);
      setTimeout(() => setShowCopiedMessage(false), 2000);
    });
  };

  // Función para compartir en WhatsApp (igual que en App.js)
  const shareOnWhatsApp = () => {
    const message = t('share.whatsapp_message', '🎯 ¡Juego: ¿Quién dijo qué?!\n\n¿Puedes adivinar quién corresponde a cada titular polémico?\n\n👇 Juega aquí:\n{{url}}', { url: gameUrl });
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  // NUEVO: Funciones para el juego de personalidades (copiadas de App.js)
  const generatePersonalityGameUrl = () => {
    try {
      // Verificar que tengamos datos de análisis
      const data = window.lastAnalysisTopData;
      
      if (!data || !data.categorias || !data.usuarios) {
        alert("No hay datos de análisis para compartir. Por favor, asegúrate de que el análisis estadístico esté completo.");
        return;
      }

      // Mapeo de categorías completas a códigos de una letra
      const catCodes = {
        'profesor': 'p', 'rollero': 'r', 'pistolero': 's', 'vampiro': 'v',
        'cafeconleche': 'c', 'dejaenvisto': 'd', 'narcicista': 'n', 
        'puntofinal': 'f', 'fosforo': 'o', 'menosesmas': 'm',
        'chismoso': 'h', 'happyflower': 'y', 'amoroso': 'a', 'sicopata': 'x',
        'comico': 'co', 'agradecido': 'ag', 'disculpon': 'di', 'curioso': 'cu'
      };
      
      // Obtener usuarios
      let users = [];
      if (Array.isArray(data.usuarios)) {
        users = data.usuarios;
      } else if (typeof data.usuarios === 'object') {
        users = Object.keys(data.usuarios);
      }
      
      // Crear array de nombres únicos para eliminar redundancia
      const names = [...new Set(
        Object.values(data.categorias)
          .filter(c => c && c.nombre)
          .map(c => c.nombre)
      )];
      
      // Crear pares [código, índice] para cada categoría
      const cats = [];
      Object.entries(catCodes).forEach(([cat, code]) => {
        if (data.categorias[cat]?.nombre) {
          const idx = names.indexOf(data.categorias[cat].nombre);
          if (idx >= 0) {
            cats.push([code, idx]);
          }
        }
      });
      
      // Estructura final: [usuarios, nombres, categorías]
      const result = [users, names, cats];
      
      // Comprimir con LZ-String
      const compressed = lzString.compressToEncodedURIComponent(JSON.stringify(result));
      
      // URL con parámetro z (más corto)
      const url = `${window.location.origin}/chat-game?z=${compressed}`;
      
      console.log("Datos del juego de personalidades generados:", result);
      
      // Actualizar estado y mostrar modal
      setPersonalityGameUrl(url);
      setShowPersonalityModal(true);
      
      return url;
    } catch (error) {
      console.error("Error generando URL del juego de personalidades:", error);
      alert("Error generando URL del juego de personalidades");
      return null;
    }
  };

  // Función para copiar URL del juego de personalidades al portapapeles
  const copyPersonalityToClipboard = () => {
    navigator.clipboard.writeText(personalityGameUrl)
      .then(() => {
        setShowPersonalityCopiedMessage(true);
        setTimeout(() => setShowPersonalityCopiedMessage(false), 2000);
      })
      .catch(err => {
        console.error("Error copiando al portapapeles:", err);
        // Fallback para navegadores que no soportan clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = personalityGameUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setShowPersonalityCopiedMessage(true);
        setTimeout(() => setShowPersonalityCopiedMessage(false), 2000);
      });
  };

  // Función para compartir juego de personalidades en WhatsApp
  const sharePersonalityOnWhatsApp = () => {
    const message = `¡Juega a adivinar quién es quién en nuestro chat de WhatsApp!\n\n${personalityGameUrl}\n\n🎮 Juego de adivinar personalidades`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

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
      
      {/* Sección de Juegos al final */}
      {headlinesGameData && (
        <>
          <h2 className="analysis-special-title">🎮 Juegos</h2>
          
          <div className="games-container">
            {/* Card 1: Juego de Titulares */}
            <div className="game-card">
              <div className="game-icon">🎯</div>
              <div className="game-content">
                <span className="game-badge">JUEGO INTERACTIVO</span>
                <h3 className="game-title">¿Quién dijo qué?</h3>
                <p className="game-description">
                  {t('share.game_description', 'Descubre quién corresponde a cada titular polémico')}
                </p>
                <button 
                  className="game-button"
                  onClick={generateHeadlinesGameUrl}
                >
                  🚀 {t('share.share_game_button', 'Jugar Ahora')}
                </button>
              </div>
            </div>

            {/* Card 2: Juego de Personalidades */}
            <div className="game-card">
              <div className="game-icon">🎭</div>
              <div className="game-content">
                <span className="game-badge">JUEGO INTERACTIVO</span>
                <h3 className="game-title">🎮 Compartir juego de personalidades</h3>
                <p className="game-description">
                  Comparte un juego para que tus amigos adivinen quién es el profesor, el vampiro y otras personalidades de tu chat.
                </p>
                <button 
                  className="game-button"
                  onClick={generatePersonalityGameUrl}
                >
                  🚀 Crear juego
                </button>
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* Modal para compartir juego */}
      {showShareGameModal && (
        <div className="share-game-modal">
          <div className="share-game-modal-content">
            <h3>{t('share.modal_title', 'Compartir Juego')}</h3>
            <p>{t('share.modal_description', 'Comparte este enlace con tus amigos para que puedan jugar:')}</p>
            
            <div className="game-url-container">
              <input 
                type="text" 
                value={gameUrl} 
                readOnly 
                onClick={(e) => e.target.select()}
              />
              <button onClick={copyToClipboard}>
                {t('share.copy_button', 'Copiar')}
              </button>
            </div>
            
            {showCopiedMessage && (
              <div className="copied-message">
                {t('share.copied_message', '¡Enlace copiado!')}
              </div>
            )}
            
            <div className="share-options">
              <button className="whatsapp-share" onClick={shareOnWhatsApp}>
                <span>WhatsApp</span>
                <span>📱</span>
              </button>
            </div>
            
            <button 
              className="close-modal-button"
              onClick={() => setShowShareGameModal(false)}
            >
              {t('share.close_button', 'Cerrar')}
            </button>
          </div>
        </div>
      )}

      {/* NUEVO: Modal para compartir juego de personalidades */}
      {showPersonalityModal && (
        <div className="share-game-modal">
          <div className="share-game-modal-content">
            <span className="close-modal" onClick={() => setShowPersonalityModal(false)}>&times;</span>
            <h3>¡Comparte el juego!</h3>
            <p>Envía este enlace a tus amigos para que adivinen quién es el profesor, el vampiro y demás personalidades del chat.</p>
            
            <div className="game-url-container">
              <input 
                type="text" 
                value={personalityGameUrl} 
                readOnly 
                onClick={(e) => e.target.select()} 
              />
              <button onClick={copyPersonalityToClipboard}>
                Copiar
              </button>
              {showPersonalityCopiedMessage && <span className="copied-message">¡Copiado!</span>}
            </div>
            
            <div className="share-options">
              <button className="whatsapp-share" onClick={sharePersonalityOnWhatsApp}>
                <span>WhatsApp</span>
                <span>📱</span>
              </button>
            </div>
            
            <button 
              className="close-modal-button"
              onClick={() => setShowPersonalityModal(false)}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Chatgptresultados;