import React, { useState, useEffect } from 'react';
import { marked } from 'marked'; // Importamos marked
import DOMPurify from 'dompurify'; // Para seguridad
import { useTranslation } from 'react-i18next';
import './Chatgptresultados.css';
// Importar el servicio de cola
import chatGPTQueueService from './services/queueService';

function Chatgptresultados({ chatGptResponse, promptInput, usuarioId = "user-default" }) {
  const { t, i18n } = useTranslation();
  const [htmlContent, setHtmlContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [queueStatus, setQueueStatus] = useState(null);
  const [requestId, setRequestId] = useState(null);
  
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

      // Convertir markdown a HTML
      const rawHtml = marked.parse(chatGptResponse);
      
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
      enviarSolicitudACola(promptInput);
    }
  }, [promptInput]);

  // Función para enviar solicitud a la cola
  const enviarSolicitudACola = async (prompt) => {
    setIsLoading(true);
    setQueueStatus('Enviando solicitud a cola...');
    
    try {
      const resultado = await chatGPTQueueService.enviarSolicitud(prompt, usuarioId);
      
      if (resultado.exitoso) {
        setRequestId(resultado.solicitudId);
        setQueueStatus(`Solicitud encolada (ID: ${resultado.solicitudId.substring(0, 8)}...)`);
        console.log('Solicitud encolada con éxito:', resultado);
      } else {
        setIsLoading(false);
        setQueueStatus('Error: No se pudo encolar la solicitud');
        setHtmlContent(marked.parse("Error enviando solicitud a la cola. Por favor intente más tarde."));
      }
    } catch (error) {
      console.error("Error completo:", error);
      setIsLoading(false);
      setQueueStatus('Error: Excepción al encolar');
      setHtmlContent(marked.parse("Error en el servicio de cola. Por favor intente más tarde."));
    }
  };

  // Efecto para aplicar personalizaciones específicas según el idioma
  useEffect(() => {
    const container = document.getElementById('analysisResults');
    if (container) {
      console.log(`Idioma actualizado a: ${i18n.language}`);
    }
  }, [i18n.language]);

  // Componente de monitoreo básico
  const QueueStatus = () => (
    <div className="queue-status" style={{ 
      padding: '10px', 
      margin: '10px 0', 
      background: '#f0f7ff', 
      borderRadius: '5px',
      fontSize: '0.8rem',
      borderLeft: '4px solid #0078d4'
    }}>
      <h4 style={{ margin: '0 0 5px 0' }}>Estado de la solicitud</h4>
      <p style={{ margin: '3px 0' }}>{queueStatus || 'No hay solicitud activa'}</p>
      <p style={{ margin: '3px 0' }}>Total solicitudes procesadas: {requestCount}</p>
      {requestId && (
        <p style={{ margin: '3px 0', fontSize: '0.7rem' }}>ID: {requestId}</p>
      )}
      <button 
        onClick={() => {
          localStorage.removeItem('chatgpt_request_count');
          setRequestCount(0);
        }}
        style={{
          background: '#e0e0e0',
          border: 'none',
          padding: '3px 8px',
          borderRadius: '3px',
          cursor: 'pointer',
          fontSize: '0.7rem',
          marginTop: '5px'
        }}
      >
        Reiniciar contador
      </button>
    </div>
  );

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
        <QueueStatus />
      </div>
    );
  }

  // Si no hay contenido, mostrar mensaje
  if (!htmlContent) {
    return (
      <div className="no-content-message" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
        {chatGptResponse === null ? '' : t('app.loading_status')}
        <QueueStatus />
      </div>
    );
  }

  // Renderizar el HTML generado
  return (
    <div id="analysisResults-container">
      <QueueStatus />
      <div 
        id="analysisResults" 
        className={`chat-analysis-container language-${i18n.language}`}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  );
}

export default Chatgptresultados;