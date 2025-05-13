import React, { useEffect, useRef, useState } from 'react';
import { analizarChat, encontrarArchivosChat } from './chatAnalyzer.js';
import './ChatAnalysis.css'; // Importamos el nuevo archivo CSS
import AnalisisTop from './Analisis_top'; // Importar AnalisisTop

function ChatAnalysisComponent({ operationId }) {
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chatContent, setChatContent] = useState(null); // Almacenar el contenido del chat
  const resultsContainerRef = useRef(null);

  useEffect(() => {
    if (operationId) {
      setLoading(true);
      setError(null);
      
      // Obtener datos del chat para analizar
      fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000'}/api/obtener-chat/${operationId}`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Error al obtener datos del chat: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          if (data && data.content) {
            // Guardar el contenido del chat para compartirlo con otros componentes
            setChatContent(data.content);
            
            // Analizar el contenido del chat con analizarChat
            const resultado = analizarChat(data.content);
            setAnalysisResult(resultado);
          } else {
            throw new Error('No se recibió contenido de chat para analizar');
          }
          setLoading(false);
        })
        .catch(err => {
          console.error('Error al analizar el chat:', err);
          setError(err.message || 'Error al analizar la conversación');
          setLoading(false);
        });
    }
  }, [operationId]);

  // Renderizar los resultados del análisis cuando recibimos nuevos datos
  useEffect(() => {
    if (analysisResult && resultsContainerRef.current) {
      // Podemos usar la función render del objeto ChatAnalyzer si queremos
      // ChatAnalyzer.renderResults(analysisResult, 'analysisResultsContainer');
      
      // O podemos manejarlo directamente en el componente
      renderAnalysisResults();
    }
  }, [analysisResult]);

  // Función para renderizar los resultados de análisis en formato React
  const renderAnalysisResults = () => {
    if (!analysisResult) return null;
    
    if (!analysisResult.success) {
      return (
        <div className="error-message">
          {analysisResult.error || 'Error desconocido al analizar el chat'}
        </div>
      );
    }

    return (
      <div className="analysis-results">
        <div className="analysis-summary-card">
          <h3>Resumen del análisis</h3>
          <div className="summary-stats">
            <div className="stat-item">
              <div className="stat-value">{analysisResult.total_messages}</div>
              <div className="stat-label">Mensajes</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{analysisResult.active_participants}</div>
              <div className="stat-label">Participantes</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{analysisResult.chat_format || 'Desconocido'}</div>
              <div className="stat-label">Formato</div>
            </div>
          </div>
        </div>
        
        {renderSenderCounts()}
        {renderMessageExamples()}
      </div>
    );
  };

  // Renderizar la tabla de conteo de mensajes por remitente
  const renderSenderCounts = () => {
    if (!analysisResult?.sender_counts || Object.keys(analysisResult.sender_counts).length === 0) {
      return null;
    }

    const senderEntries = Object.entries(analysisResult.sender_counts)
      .sort((a, b) => b[1] - a[1]);
      
    const maxCount = Math.max(...senderEntries.map(([_, count]) => count));

    return (
      <div className="sender-counts-card">
        <h3>Participación en la conversación</h3>
        <div className="sender-bars">
          {senderEntries.map(([sender, count], index) => {
            const percentage = ((count / analysisResult.total_messages) * 100).toFixed(1);
            const barWidth = `${(count / maxCount) * 100}%`;
            
            return (
              <div key={index} className="sender-bar-container">
                <div className="sender-info">
                  <span className="sender-name">{sender}</span>
                  <span className="sender-message-count">{count} mensajes</span>
                </div>
                <div className="progress-bar-bg">
                  <div 
                    className="progress-bar-fill" 
                    style={{ 
                      width: barWidth,
                      backgroundColor: getColorForIndex(index)
                    }}
                  ></div>
                  <span className="percentage-label">{percentage}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Renderizar ejemplos de mensajes
  const renderMessageExamples = () => {
    if (!analysisResult?.message_examples || Object.keys(analysisResult.message_examples).length === 0) {
      return null;
    }

    return (
      <div className="message-examples-card">
        <h3>Ejemplos de mensajes</h3>
        <div className="examples-grid">
          {Object.entries(analysisResult.message_examples).map(([sender, messages], index) => (
            <div key={index} className="sender-example-card" style={{ borderTopColor: getColorForIndex(index) }}>
              <div className="sender-avatar" style={{ backgroundColor: getColorForIndex(index) }}>
                {getInitials(sender)}
              </div>
              <h4>{sender}</h4>
              <ul className="message-list">
                {messages.map((message, i) => (
                  <li key={i}>
                    <span className="message-quote">"</span>
                    {message}
                    <span className="message-quote">"</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Función para obtener un color basado en el índice
  const getColorForIndex = (index) => {
    const colors = [
      '#4285F4', // Azul
      '#EA4335', // Rojo
      '#FBBC05', // Amarillo
      '#34A853', // Verde
      '#8E24AA', // Morado
      '#16A2F8', // Celeste
      '#FD7E14', // Naranja
      '#20c997', // Turquesa
      '#6f42c1', // Indigo
      '#d63384', // Rosa
    ];
    
    return colors[index % colors.length];
  };

  // Función para obtener las iniciales de un nombre
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="chat-analysis-component">
      {loading && (
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>Analizando conversación...</p>
        </div>
      )}
      
      {error && (
        <div className="error-message">
          <p>Error: {error}</p>
        </div>
      )}
      
      <div id="analysisResultsContainer" ref={resultsContainerRef}>
        {!loading && !error && renderAnalysisResults()}
      </div>
      
      {/* Renderizar AnalisisTop con los datos del chat */}
      {chatContent && (
        <div className="top-analysis-section">
          <AnalisisTop operationId={operationId} chatData={chatContent} />
        </div>
      )}
    </div>
  );
}

export default ChatAnalysisComponent;