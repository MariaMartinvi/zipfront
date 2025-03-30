import React, { useEffect, useRef, useState } from 'react';
import ChatAnalyzer from './Chatanalyzer';

function ChatAnalysisComponent({ operationId }) {
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const resultsContainerRef = useRef(null);

  useEffect(() => {
    if (operationId) {
      setLoading(true);
      setError(null);
      
      // Usando el objeto ChatAnalyzer para hacer la solicitud
      ChatAnalyzer.analyzeChatOperation(operationId)
        .then(data => {
          setAnalysisResult(data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error al analizar el chat:', err);
          setError(err.message || 'Error al analizar la conversación');
          setLoading(false);
        });
    }
  }, [operationId]);

  // Renderizar los resultados del análisis usando el DOM directo cuando recibimos nuevos datos
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
        <div className="analysis-summary">
          <p><strong>Total de mensajes:</strong> {analysisResult.total_messages}</p>
          <p><strong>Participantes activos:</strong> {analysisResult.active_participants}</p>
          <p><strong>Formato detectado:</strong> {analysisResult.chat_format || 'Desconocido'}</p>
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

    return (
      <div className="sender-counts">
        <h3>Mensajes por persona</h3>
        <table className="analysis-table">
          <thead>
            <tr>
              <th>Persona</th>
              <th>Mensajes</th>
              <th>Porcentaje</th>
            </tr>
          </thead>
          <tbody>
            {senderEntries.map(([sender, count], index) => {
              const percentage = ((count / analysisResult.total_messages) * 100).toFixed(1);
              return (
                <tr key={index}>
                  <td>{sender}</td>
                  <td>{count}</td>
                  <td>{percentage}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // Renderizar ejemplos de mensajes
  const renderMessageExamples = () => {
    if (!analysisResult?.message_examples || Object.keys(analysisResult.message_examples).length === 0) {
      return null;
    }

    return (
      <div className="message-examples">
        <h3>Ejemplos de mensajes</h3>
        <div className="examples-container">
          {Object.entries(analysisResult.message_examples).map(([sender, messages], index) => (
            <div key={index} className="sender-example">
              <h4>{sender}</h4>
              <ul>
                {messages.map((message, i) => (
                  <li key={i}>{message}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    );
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
    </div>
  );
}

export default ChatAnalysisComponent;