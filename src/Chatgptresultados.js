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

      // Procesar la respuesta para reemplazar la sección de titulares
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

      // Convertir markdown a HTML
      const htmlContent = marked.parse(processedResponse);
      
      // Sanitizar el HTML
      const sanitizedContent = DOMPurify.sanitize(htmlContent);
      
      setHtmlContent(sanitizedContent);
      
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
        const processedResponse = processHeadlinesSection(chatGptResponse, headlinesGameData);
        const htmlContent = marked.parse(processedResponse);
        const sanitizedContent = DOMPurify.sanitize(htmlContent);
        setHtmlContent(sanitizedContent);
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
          
          const processedResponse = processHeadlinesSection(chatGptResponse, gameDataToUse);
          const htmlContent = marked.parse(processedResponse);
          const sanitizedContent = DOMPurify.sanitize(htmlContent);
          setHtmlContent(sanitizedContent);
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
      
      {/* Botón del juego de titulares */}
      {headlinesGameData && (
        <div className="headlines-game-button-container" style={{
          marginTop: '2rem',
          padding: '1.5rem',
          borderTop: '2px solid #eee',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h3 style={{ marginBottom: '1rem', color: '#2c3e50' }}>
            🎯 {t('share.game_title', '¿Quién dijo qué?')}
          </h3>
          <p style={{ marginBottom: '1.5rem', color: '#6c757d' }}>
            {t('share.game_description', 'Descubre quién corresponde a cada titular polémico')}
          </p>
          <button 
            onClick={generateHeadlinesGameUrl}
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'background-color 0.3s ease',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#0056b3'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#007bff'}
          >
            🚀 {t('share.share_game_button', 'Compartir Juego de Titulares')}
          </button>
        </div>
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
    </div>
  );
}

export default Chatgptresultados;