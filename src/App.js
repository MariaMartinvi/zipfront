import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [diagnosticInfo, setDiagnosticInfo] = useState(null);
  const [error, setError] = useState(null);
  const [showRawData, setShowRawData] = useState(false);

  useEffect(() => {
    // Verificar parámetros en la URL
    const urlParams = new URLSearchParams(window.location.search);
    const hasDiagnostics = urlParams.has('diagnostics');
    const hasError = urlParams.has('error');
    
    if (hasDiagnostics) {
      try {
        const diagnosticsData = localStorage.getItem('shareTargetDiagnostics');
        if (diagnosticsData) {
          setDiagnosticInfo(JSON.parse(diagnosticsData));
        }
      } catch (err) {
        console.error('Error al procesar diagnósticos:', err);
        setError(`Error al procesar diagnósticos: ${err.message}`);
      }
    }
    
    if (hasError) {
      try {
        const errorData = localStorage.getItem('shareTargetError');
        if (errorData) {
          setError(JSON.parse(errorData));
        } else {
          setError({ message: 'Error desconocido al procesar la solicitud de compartir' });
        }
      } catch (err) {
        setError({ message: `Error al procesar datos de error: ${err.message}` });
      }
    }
    
    // Limpiar URL
    if (hasDiagnostics || hasError) {
      window.history.replaceState({}, document.title, '/');
    }
  }, []);

  // Formatear datos para mostrarlos de forma amigable
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };
  
  const toggleRawData = () => {
    setShowRawData(!showRawData);
  };

  return (
    <div className="diagnostic-app">
      <header>
        <h1>Diagnostico de Archivos Compartidos</h1>
      </header>
      <main>
        {error && (
          <div className="error-panel">
            <h2>Error Detectado</h2>
            <div className="error-details">
              {error.timestamp && <p><strong>Hora:</strong> {formatDate(error.timestamp)}</p>}
              <p><strong>Mensaje:</strong> {error.error || error.message}</p>
              {error.stack && (
                <div>
                  <p><strong>Stack:</strong></p>
                  <pre>{error.stack}</pre>
                </div>
              )}
            </div>
          </div>
        )}
        
        {diagnosticInfo && (
          <div className="diagnostic-panel">
            <h2>Información de Diagnóstico</h2>
            <p><strong>Hora:</strong> {formatDate(diagnosticInfo.timestamp)}</p>
            
            <div className="section">
              <h3>Información de la Solicitud</h3>
              <p><strong>URL:</strong> {diagnosticInfo.url}</p>
              <p><strong>Método:</strong> {diagnosticInfo.method}</p>
            </div>
            
            <div className="section">
              <h3>Headers de la Solicitud</h3>
              <div className="headers-list">
                {Object.entries(diagnosticInfo.headers).map(([key, value]) => (
                  <div key={key} className="header-item">
                    <strong>{key}:</strong> {value}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="section">
              <h3>Datos del Formulario</h3>
              {diagnosticInfo.formDataDetails.map((item, index) => (
                <div key={index} className="form-data-item">
                  <h4>Campo: {item.fieldName}</h4>
                  <p><strong>Tipo:</strong> {item.type}</p>
                  
                  {item.type === 'File' ? (
                    <div className="file-details">
                      <p><strong>Nombre:</strong> {item.fileName}</p>
                      <p><strong>Tipo MIME:</strong> {item.fileType}</p>
                      <p><strong>Tamaño:</strong> {(item.fileSize / 1024).toFixed(2)} KB</p>
                      <p><strong>Última modificación:</strong> {formatDate(item.lastModified)}</p>
                      
                      {item.contentPreviewHex && (
                        <div className="file-preview">
                          <p><strong>Vista previa (Hex):</strong></p>
                          <pre className="hex-preview">{item.contentPreviewHex}</pre>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-details">
                      <p><strong>Longitud:</strong> {item.length} caracteres</p>
                      <div className="text-preview">
                        <pre>{item.value}</pre>
                        {item.length > 1000 && <span className="truncated">... (contenido truncado)</span>}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="raw-data-toggle">
              <button onClick={toggleRawData}>
                {showRawData ? 'Ocultar Datos Crudos' : 'Mostrar Datos Crudos'}
              </button>
              
              {showRawData && (
                <div className="raw-data">
                  <h3>Datos Crudos (JSON)</h3>
                  <pre>{JSON.stringify(diagnosticInfo, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        )}
        
        {!diagnosticInfo && !error && (
          <div className="welcome-message">
            <h2>Bienvenido a la Herramienta de Diagnóstico</h2>
            <p>Esta aplicación está diseñada para ayudar a diagnosticar problemas al compartir archivos desde WhatsApp u otras aplicaciones.</p>
            <p>Para comenzar, comparte un archivo con esta aplicación desde WhatsApp u otra aplicación.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;