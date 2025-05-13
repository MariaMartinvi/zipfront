import React, { useEffect, useRef, useState } from 'react';
// Importar directamente formatDetector en lugar de chatAnalyzer
import { detectarFormatoArchivo } from './formatDetector.js';
import './ChatAnalysis.css';
import AnalisisTop from './Analisis_top';
import AzureClientComponent from './AzureClientComponent';

// Incorporar directamente las funciones necesarias de chatAnalyzer para evitar el error de importación
const analizarChat = (contenido, formatoForzado = null) => {
  console.log("Analizando chat directamente desde ChatAnalysisComponent...");
  
  try {
    // Dividir el contenido en líneas
    const lineas = contenido.split(/\r?\n/);
    
    if (!lineas || lineas.length === 0) {
      console.log("Archivo vacío");
      return { error: "Archivo vacío", success: false };
    }
    
    console.log(`Archivo leído correctamente. Total de líneas: ${lineas.length}`);
    
    // Determinar formato usando el detector
    const formato = detectarFormatoArchivo(contenido, formatoForzado, true);
    console.log(`\nFormato final a utilizar: ${formato}`);
    
    // Si el formato es desconocido, devolver error
    if (formato === "desconocido") {
      return { error: "Formato de chat no reconocido", success: false };
    }
    
    // Analizar mensajes (versión simplificada para evitar dependencias)
    const mensajes = analizarMensajesSimplificado(lineas, formato);
    
    if (mensajes.length === 0) {
      return { error: "No se encontraron mensajes válidos", success: false };
    }
    
    // Calcular estadísticas básicas
    const participantes = new Set();
    const sender_counts = {};
    const message_examples = {};
    
    // Inicializar estructura para ejemplos
    mensajes.forEach(msg => {
      if (!participantes.has(msg.nombre)) {
        participantes.add(msg.nombre);
        message_examples[msg.nombre] = [];
      }
      sender_counts[msg.nombre] = (sender_counts[msg.nombre] || 0) + 1;
    });
    
    // Extraer ejemplos (versión simplificada)
    Object.keys(message_examples).forEach(nombre => {
      const mensajesUsuario = mensajes.filter(m => m.nombre === nombre && m.tipo === "texto");
      // Tomar hasta 3 mensajes aleatorios
      for (let i = 0; i < 3 && i < mensajesUsuario.length; i++) {
        const msgRandom = mensajesUsuario[Math.floor(Math.random() * mensajesUsuario.length)];
        if (msgRandom && !message_examples[nombre].includes(msgRandom.mensaje)) {
          message_examples[nombre].push(msgRandom.mensaje.substring(0, 80));
        }
      }
    });
    
    // Preparar datos de estadísticas
    const data = {
      total_messages: mensajes.length,
      active_participants: participantes.size,
      chat_format: formato,
      sender_counts: sender_counts,
      message_examples: message_examples,
      success: true
    };
    
    return data;
  } catch (error) {
    console.error("Error durante el análisis:", error);
    return {
      error: `Error durante el análisis: ${error.message}`,
      success: false
    };
  }
};

// Función simplificada para extraer mensajes
const analizarMensajesSimplificado = (lineas, formato) => {
  const mensajes = [];
  let mensajeAnterior = null;
  
  for (const linea of lineas) {
    if (!linea.trim()) continue;
    
    const resultado = analizarMensaje(linea, formato, mensajeAnterior);
    
    if (resultado === mensajeAnterior) {
      mensajeAnterior = resultado;
      continue;
    }
    
    if (resultado) {
      mensajes.push(resultado);
      mensajeAnterior = resultado;
    }
  }
  
  return mensajes;
};

// Función para analizar un mensaje (copiada de chatAnalyzer)
const analizarMensaje = (linea, formato, mensajeAnterior = null) => {
  linea = linea.trim();
  
  // Si es una continuación de mensaje anterior
  if (mensajeAnterior && 
      !(linea.startsWith('[') || 
        (formato === "android" && /^\d{1,2}\/\d{1,2}\/\d{2}/.test(linea)))) {
    mensajeAnterior.mensaje += `\n${linea}`;
    mensajeAnterior.esMultilinea = true;
    return mensajeAnterior;
  }
  
  // Patrones para extraer componentes según el formato
  const patronIOS = /^\[(\d{1,2}\/\d{1,2}\/\d{2}),\s*(\d{1,2}:\d{2}(?::\d{2})?)\]\s*([^:]+):\s*(.*)/;
  const patronAndroid = /^(\d{1,2}\/\d{1,2}\/\d{2}),\s*(\d{1,2}:\d{2})\s*-\s*([^:]+):\s*(.+)/;
  
  let match;
  if (formato === "ios") {
    match = linea.match(patronIOS);
  } else {
    match = linea.match(patronAndroid);
  }
  
  if (match) {
    const [_, fecha, hora, nombre, mensaje] = match;
    try {
      // Identificar tipo de mensaje
      let tipoMensaje = "texto";
      const mensajeLower = mensaje.toLowerCase();
      
      if (/imagen omitida|image omitted|<multimedia omitido>/.test(mensajeLower)) {
        tipoMensaje = "imagen";
      } else if (/video omitido|video omitted/.test(mensajeLower)) {
        tipoMensaje = "video";
      } else if (/audio omitido|audio omitted/.test(mensajeLower)) {
        tipoMensaje = "audio";
      } else if (/documento omitido|document omitted/.test(mensajeLower)) {
        tipoMensaje = "documento";
      } else if (/sticker omitido|sticker omitted/.test(mensajeLower)) {
        tipoMensaje = "sticker";
      }
      
      return {
        fecha: fecha,
        hora: hora,
        nombre: nombre.trim(),
        mensaje: mensaje.trim() || "",
        tipo: tipoMensaje,
        esMultilinea: false,
        formato: formato
      };
    } catch (e) {
      console.error(`Error al parsear fecha/hora (${fecha} ${hora}):`, e);
      return null;
    }
  }
  return null;
};

// Implementación simplificada de encontrarArchivosChat
const encontrarArchivosChat = (files) => {
  if (!files || files.length === 0) return null;
  // Filtrar archivos de texto
  return Array.from(files).filter(file => 
    file.name.endsWith('.txt') || 
    file.name.endsWith('.csv') || 
    file.name.includes('chat')
  );
};

// Modificar el componente para recibir chatData directamente
function ChatAnalysisComponent({ operationId, chatData }) {
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chatContent, setChatContent] = useState(null); // Almacenar el contenido del chat
  const resultsContainerRef = useRef(null);

  useEffect(() => {
    // Si tenemos chatData directamente, usarlo sin hacer llamada al backend
    if (chatData) {
      setChatContent(chatData);
      return;
    }
    
    // Usar operationId como fallback solo si no tenemos chatData y hay un operationId
    if (operationId && !chatData) {
      setLoading(true);
      setError(null);
      
      console.warn('DEPRECATED: Usando operationId para obtener datos. Preferir pasar chatData directamente.');
      
      // Obtener datos del chat para analizar (mantener como fallback)
      fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000'}/api/obtener-chat/${operationId}`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Error al obtener datos del chat: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          if (data && data.content) {
            // Guardar el contenido del chat para pasarlo al componente AzureClientComponent
            setChatContent(data.content);
            // Ya no hacemos el análisis aquí, lo hará AzureClientComponent
          } else {
            throw new Error('No se recibió contenido de chat para analizar');
          }
        })
        .catch(err => {
          console.error('Error al obtener el chat:', err);
          setError(err.message || 'Error al obtener la conversación');
          setLoading(false);
        });
    }
  }, [operationId, chatData]);

  // Renderizar los resultados del análisis cuando recibimos nuevos datos
  useEffect(() => {
    if (analysisResult && resultsContainerRef.current) {
      renderAnalysisResults();
    }
  }, [analysisResult]);

  // Manejador para cuando el análisis de Azure se complete
  const handleAnalysisComplete = (result) => {
    setAnalysisResult(result);
    setLoading(false);
  };

  // Manejador de errores del componente Azure
  const handleAnalysisError = (errorMessage) => {
    setError(errorMessage);
    setLoading(false);
  };

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
    <div className="chat-analysis-container">
      {loading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Analizando conversación, por favor espera...</p>
        </div>
      )}
      
      {error && (
        <div className="error-container">
          <h3>Error al analizar la conversación</h3>
          <p>{error}</p>
        </div>
      )}
      
      {chatContent && !analysisResult && !error && (
        <AzureClientComponent 
          chatContent={chatContent}
          onAnalysisComplete={handleAnalysisComplete}
          onError={handleAnalysisError}
          language="es" // O pasar el idioma como prop desde un nivel superior
        />
      )}
      
      {analysisResult && (
        <div className="analysis-results" ref={resultsContainerRef}>
          <div dangerouslySetInnerHTML={{ __html: analysisResult }} />
        </div>
      )}
    </div>
  );
}

export default ChatAnalysisComponent;