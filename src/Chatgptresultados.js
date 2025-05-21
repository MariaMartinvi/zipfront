import React, { useState, useEffect } from 'react';
import { marked } from 'marked'; // Importamos marked
import DOMPurify from 'dompurify'; // Para seguridad
import { useTranslation } from 'react-i18next';
import './Chatgptresultados.css';
import azureQueueService from './services/azureQueueService'; // Importamos el servicio de cola existente

// Contador global para simular límite de solicitudes
let azureRequestCount = parseInt(localStorage.getItem('azure_request_count') || '0');
const MAX_AZURE_REQUESTS = 3; // Después de 3 solicitudes, comenzará a dar error 429

function Chatgptresultados({ chatGptResponse, promptInput, usuarioId = "user-default" }) {
  const { t, i18n } = useTranslation();
  const [htmlContent, setHtmlContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [queueStatus, setQueueStatus] = useState(null);
  const [requestId, setRequestId] = useState(null);
  const [errorStatus, setErrorStatus] = useState(null);
  const [checkingQueue, setCheckingQueue] = useState(false);
  
  // Variables para monitoreo
  const [requestCount, setRequestCount] = useState(() => {
    const saved = localStorage.getItem('chatgpt_request_count');
    return saved ? parseInt(saved, 10) : 0;
  });
  
  // Procesar respuesta cuando llegue
  useEffect(() => {
    if (chatGptResponse) {
      // Configurar marked para procesar correctamente los emojis
      marked.setOptions({
        breaks: true,  // Interpretar saltos de línea como <br>
        gfm: true,     // GitHub Flavored Markdown
      });

      // Eliminar la información de la API utilizada y registrarla en la consola
      let processedResponse = chatGptResponse;
      
      // Detectar el modelo utilizado y registrarlo en la consola
      if (processedResponse.includes('API UTILIZADA: Principal (gpt-4o-mini)')) {
        console.log('api 1');
        processedResponse = processedResponse.replace(/\*{5,}\n\* API UTILIZADA: Principal \(gpt-4o-mini\)\n\*{5,}\n\n/g, '');
      } else if (processedResponse.includes('API UTILIZADA: o3-mini') || processedResponse.includes('API UTILIZADA: o3')) {
        console.log('api 2');
        processedResponse = processedResponse.replace(/\*{5,}\n\* API UTILIZADA: o3(-mini)?\n\*{5,}\n\n/g, '');
      } else if (processedResponse.includes('API UTILIZADA: Deepseek')) {
        console.log('api 3');
        processedResponse = processedResponse.replace(/\*{5,}\n\* API UTILIZADA: Deepseek[^\n]*\n\*{5,}\n\n/g, '');
      }

      // Convertir markdown a HTML
      const rawHtml = marked.parse(processedResponse);
      
      // Sanitizar el HTML (para prevenir ataques XSS)
      const cleanHtml = DOMPurify.sanitize(rawHtml);
      
      // Actualizar el estado con el HTML procesado
      setHtmlContent(cleanHtml);
      setIsLoading(false);
      
      // Incrementar contador de solicitudes usando función de actualización
      setRequestCount(prevCount => {
        const newCount = prevCount + 1;
        localStorage.setItem('chatgpt_request_count', newCount.toString());
        return newCount;
      });
    }
  }, [chatGptResponse]);

  // Escuchar nuevo prompt para enviarlo a la cola
  useEffect(() => {
    if (promptInput && promptInput.trim().length > 0) {
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

  // Función para simular llamada a Azure con límite de tasa
  const simularLlamadaAzure = async (prompt) => {
    // Incrementar contador global y guardar en localStorage
    azureRequestCount++;
    localStorage.setItem('azure_request_count', azureRequestCount.toString());
    
    console.log(`[DEBUG] Contador actual: ${azureRequestCount}, Límite: ${MAX_AZURE_REQUESTS}`);
    
    // Si excedimos el límite, simular error 429
    if (azureRequestCount >= MAX_AZURE_REQUESTS) {
      console.log(`[DEBUG] Lanzando error 429 - Contador: ${azureRequestCount}, Límite: ${MAX_AZURE_REQUESTS}`);
      
      // Crear un error que imita exactamente lo que devolvería Azure
      const error = new Error("429 Too Many Requests");
      error.status = 429;
      error.statusText = "Too Many Requests";
      error.headers = {
        "retry-after": "30" // Sugiere esperar 30 segundos
      };
      
      throw error;
    }
    
    // Simular tiempo de procesamiento (1-2 segundos)
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 1000));
    
    // Retornar respuesta exitosa simulada
    return {
      exitoso: true,
      solicitudId: `sim-${Date.now()}`
    };
  };

  // Función para procesar solicitud (directamente o enviar a la cola de Azure)
  const procesarSolicitud = async (prompt) => {
    setIsLoading(true);
    setQueueStatus('Procesando solicitud...');
    setErrorStatus(null);
    
    try {
      console.log(`[DEBUG] Iniciando procesamiento - Contador actual: ${azureRequestCount}`);
      
      // Intentar hacer la llamada directa a Azure (simulada)
      await simularLlamadaAzure(prompt);
      
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
        setErrorStatus('Texto demasiado largo');
        
        // Mensaje explicativo para el usuario
        const tokenErrorMsg = `### ⚠️ Texto demasiado largo\n\nEl texto que intentas analizar excede el límite de tokens permitido por el modelo.\n\nPor favor, reduce la longitud del texto e intenta nuevamente.\n\n**Sugerencias**:\n- Divide el análisis en conversaciones más pequeñas\n- Elimina partes irrelevantes de la conversación\n- Usa un modelo con mayor capacidad de contexto`;
        
        setHtmlContent(marked.parse(tokenErrorMsg));
        setIsLoading(false);
        return;
      }
      
      // Verificar si es un error 429 (límite de tasa)
      if (error.status === 429 || 
          error.message.includes('429') || 
          error.message.includes('RateLimitError') ||
          error.message.includes('exceeded token rate limit')) {
        
        console.log('[DEBUG] Error 429 detectado, enviando a la cola Azure...');
        setErrorStatus('429 Too Many Requests');
        
        // Extraer el tiempo de espera sugerido si está disponible
        const retryAfter = error.headers?.get('retry-after') || 
                          error.message.match(/retry after (\d+) seconds/i)?.[1] || 
                          '60';
        
        // Preparar la solicitud para la cola
        const requestData = {
          prompt,
          usuarioId,
          timestamp: new Date().toISOString(),
          modelo: 'gpt-35-turbo',
          maxTokens: 1000,
          tipoAnalisis: 'chat',
          retryAfter: parseInt(retryAfter)
        };
        
        try {
          // Enviar a la cola de Azure usando el servicio existente
          const queueResult = await azureQueueService.enqueueRequest(requestData);
          
          if (queueResult.success) {
            setRequestId(queueResult.requestId);
            setQueueStatus(`Solicitud enviada a la cola. ID: ${queueResult.requestId}`);
            
            // Mostrar mensaje explicativo al usuario con el tiempo de espera
            setHtmlContent(marked.parse(`### ⚠️ Límite de tasa alcanzado\n\nHemos alcanzado el límite de solicitudes por minuto en Azure. Su consulta ha sido agregada a la cola y será procesada cuando haya disponibilidad.\n\n**ID de solicitud**: ${queueResult.requestId}\n\n**Tiempo estimado de espera**: ${retryAfter} segundos\n\nPuede esperar en esta página o regresar más tarde para ver el resultado.`));
          } else {
            setQueueStatus(`Error al encolar: ${queueResult.error}`);
            setHtmlContent(marked.parse(`### ❌ Error al encolar solicitud\n\nNo se pudo agregar su solicitud a la cola. Por favor, intente nuevamente más tarde.\n\n**Error**: ${queueResult.error}`));
          }
        } catch (queueError) {
          // Error específico de conexión con la cola
          console.error("Error conectando con el servicio de cola:", queueError);
          setQueueStatus(`Error de conexión con la cola: ${queueError.message}`);
          setHtmlContent(marked.parse(`### ❌ Error de conexión con la cola\n\nNo se pudo conectar con el servicio de cola. Por favor, verifique su conexión e intente nuevamente.\n\n**Error técnico**: ${queueError.message}`));
        }
        
        setIsLoading(false);
      } else {
        // Otro tipo de error
        console.error("Error completo:", error);
        setIsLoading(false);
        setQueueStatus('Error: ' + (error.message || 'Desconocido'));
        setHtmlContent(marked.parse(`### ❌ Error al procesar su solicitud\n\n${error.message || "Error desconocido"}.\n\nPor favor intente más tarde o contacte con soporte si el problema persiste.`));
      }
    }
  };

  // Efecto para aplicar personalizaciones específicas según el idioma
  useEffect(() => {
    const container = document.getElementById('analysisResults');
    if (container) {
      console.log(`Idioma actualizado a: ${i18n.language}`);
    }
  }, [i18n.language]);

  // Si está cargando, mostrar indicador
  if (isLoading) {
    return (
      <div className="loading-container" style={{ textAlign: 'center', padding: '20px' }}>
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
        <p>{t('app.processing_request')}</p>
      </div>
    );
  }

  // Si no hay contenido, mostrar mensaje
  if (!htmlContent) {
    return (
      <div className="no-content-message" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
        {chatGptResponse === null ? '' : t('app.loading_status')}
      </div>
    );
  }

  // Renderizar el HTML generado
  return (
    <div id="analysisResults-container">
      <div 
        id="analysisResults" 
        className={`chat-analysis-container language-${i18n.language}`}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  );
}

export default Chatgptresultados;