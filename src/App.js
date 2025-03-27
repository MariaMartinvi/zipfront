

import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import InstallPWA from './InstallPWA';

function App() {
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [zipFile, setZipFile] = useState(null);
  const [isProcessingSharedFile, setIsProcessingSharedFile] = useState(false);
  const [debugMessages, setDebugMessages] = useState([]);
  
  // Añadir un control para evitar procesamiento múltiple
  const processedFiles = useRef(new Set());
  const processingTimestamp = useRef(0);
  
  // URL del backend
  const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000';

  // Función para logging
  const addDebugMessage = (message) => {
    console.log('[App]', message);
    setDebugMessages(prev => [...prev, { time: new Date().toISOString(), message }]);
  };

  // Efecto para manejar archivos compartidos
  useEffect(() => {
    // Verificar parámetros URL solo en montaje inicial
    const handleURLParams = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const shareId = urlParams.get('shared');
      const hasError = urlParams.has('error');
      const timestamp = urlParams.get('t') || '0';
      
      // Si ya procesamos este compartir recientemente, ignorarlo
      if (shareId && processingTimestamp.current > 0) {
        const timeDiff = parseInt(timestamp) - processingTimestamp.current;
        if (Math.abs(timeDiff) < 5000) {
          addDebugMessage(`Ignorando procesamiento duplicado (diferencia ${timeDiff}ms)`);
          return;
        }
      }
      
      if (hasError) {
        const errorType = urlParams.get('error');
        let errorMessage = 'Hubo un problema al procesar el archivo compartido.';
        
        switch (errorType) {
          case 'duplicado':
            errorMessage = 'La solicitud ya fue procesada. Por favor, espera un momento.';
            break;
          case 'no-file':
            errorMessage = 'No se encontró ningún archivo en la solicitud compartida.';
            break;
          case 'process':
            errorMessage = 'Error al procesar el archivo compartido. Intenta de nuevo.';
            break;
        }
        
        setError(errorMessage);
        addDebugMessage(`Error en URL: ${errorType}`);
        return;
      }
      
      if (shareId) {
        addDebugMessage(`ID de compartir detectado: ${shareId}, timestamp: ${timestamp}`);
        processingTimestamp.current = parseInt(timestamp);
        
        if (processedFiles.current.has(shareId)) {
          addDebugMessage(`Archivo ya procesado: ${shareId}`);
          return;
        }
        
        setIsProcessingSharedFile(true);
        
        // Solicitar el archivo compartido
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'GET_SHARED_FILE',
            shareId: shareId
          });
          
          // Prevenir quedarse atascado
          setTimeout(() => {
            if (isProcessingSharedFile) {
              setIsProcessingSharedFile(false);
              setError('No se recibió respuesta a tiempo. Por favor, intenta de nuevo.');
            }
          }, 10000);
        } else {
          addDebugMessage('Service Worker no está activo');
          setIsProcessingSharedFile(false);
        }
      }
    };
    
    handleURLParams();
    
    // Función para manejar mensajes del Service Worker
    const handleServiceWorkerMessage = (event) => {
      if (!event.data || !event.data.type) return;
      
      addDebugMessage(`Mensaje recibido: ${event.data.type}`);
      
      switch (event.data.type) {
        case 'SHARED_FILE':
          if (event.data.file) {
            const file = event.data.file;
            const shareId = event.data.shareId;
            
            // Verificar si ya procesamos este archivo
            if (processedFiles.current.has(shareId)) {
              addDebugMessage(`Archivo ya procesado: ${shareId}`);
              return;
            }
            
            // Marcar como procesado
            processedFiles.current.add(shareId);
            addDebugMessage(`Procesando archivo: ${file.name}`);
            
            // Actualizar estado y procesar archivo
            handleSharedFile(file);
          }
          break;
          
        case 'SHARED_FILE_ERROR':
          setError(`Error al recibir archivo: ${event.data.error || 'Error desconocido'}`);
          setIsProcessingSharedFile(false);
          break;
          
        case 'PONG':
          addDebugMessage('Service Worker respondió (PONG)');
          break;
          
        case 'CLEARED':
          addDebugMessage('Archivos compartidos limpiados');
          break;
      }
    };
    
    // Registrar listener para mensajes
    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    
    // Limpiar
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
    };
  }, []); // Ejecutar solo en montaje

  // Manejar archivos compartidos
  const handleSharedFile = async (file) => {
    addDebugMessage(`Procesando archivo: ${file.name}, tipo: ${file.type}`);
    
    if (!file) {
      setError('No se pudo recibir el archivo');
      setIsProcessingSharedFile(false);
      return;
    }
    
    // Verificar que sea un archivo ZIP
    const isZipFile = file.type === 'application/zip' || 
                      file.type === 'application/x-zip' ||
                      file.type === 'application/x-zip-compressed' ||
                      file.type === 'application/octet-stream' ||
                      file.name.toLowerCase().endsWith('.zip');
    
    if (!isZipFile) {
      addDebugMessage(`Archivo no es ZIP: ${file.type}`);
      setError(`Por favor, comparte un archivo ZIP válido. Tipo recibido: ${file.type}`);
      setIsProcessingSharedFile(false);
      return;
    }
    
    setError('');
    setIsLoading(true);
    setZipFile(file);
    
    try {
      await processZipFile(file);
    } catch (err) {
      addDebugMessage(`Error procesando archivo: ${err.message}`);
      setError(`Error al procesar el archivo: ${err.message}`);
    } finally {
      setIsLoading(false);
      setIsProcessingSharedFile(false);
    }
  };

  // Procesar el archivo ZIP
  const processZipFile = async (file) => {
    addDebugMessage(`Enviando archivo al backend: ${file.name}`);
    
    const formData = new FormData();
    formData.append('zipFile', file);
    
    try {
      const response = await fetch(`${API_URL}/api/extract`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        addDebugMessage(`Error en respuesta: ${response.status}, ${errorText}`);
        
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error || `Error ${response.status}`);
        } catch (jsonError) {
          throw new Error(`Error del servidor: ${response.status}`);
        }
      }
      
      const result = await response.json();
      addDebugMessage(`Respuesta exitosa: ${result.files?.length || 0} archivos`);
      
      const extractedFiles = result.files.map(file => ({
        name: file.name,
        size: file.size,
        path: file.path,
        operationId: result.operation_id
      }));
      
      setFiles(extractedFiles);
    } catch (error) {
      addDebugMessage(`Error: ${error.message}`);
      throw error;
    }
  };

  // Manejar carga manual de archivos
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.type !== 'application/zip' && !file.name.endsWith('.zip')) {
      setError('Por favor, sube un archivo ZIP válido');
      return;
    }
    
    setError('');
    setIsLoading(true);
    setZipFile(file);
    
    try {
      await processZipFile(file);
    } catch (err) {
      console.error('Error al procesar:', err);
      setError(`Error al procesar el archivo: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Descargar un archivo específico
  const downloadFile = (file) => {
    window.location.href = `${API_URL}/api/download/${file.operationId}/${encodeURIComponent(file.path)}`;
  };

  // Descargar todos los archivos
  const downloadAll = () => {
    if (files.length > 0) {
      const operationId = files[0].operationId;
      window.location.href = `${API_URL}/api/download-all/${operationId}`;
    }
  };

  // Reiniciar la app
  const handleReset = () => {
    setIsProcessingSharedFile(false);
    setError('');
    setIsLoading(false);
    
    // Limpiar archivos compartidos en el Service Worker
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CLEAR_SHARED_FILES'
      });
    }
    
    // Redirigir a la página principal sin parámetros
    window.history.replaceState({}, document.title, '/');
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Extractor de archivos ZIP</h1>
      </header>
      <main className="App-main">
        {isProcessingSharedFile ? (
          <div className="loading-indicator">
            <div className="spinner"></div>
            <p>Recibiendo archivo compartido...</p>
            <button 
              onClick={handleReset}
              style={{ marginTop: '20px', padding: '8px 16px' }}
            >
              Cancelar
            </button>
          </div>
        ) : (
          <div className="file-upload-container">
            <label className="file-upload-label">
              <input 
                type="file" 
                className="file-upload-input" 
                accept=".zip,application/zip,application/x-zip,application/x-zip-compressed" 
                onChange={handleFileUpload} 
              />
              <div className="file-upload-text">
                <span>Haz clic para subir un archivo ZIP</span>
                <span className="file-upload-subtext">o comparte directamente desde WhatsApp</span>
              </div>
            </label>
          </div>
        )}

        {error && (
          <div className="error-message">
            <p>{error}</p>
            {error && (
              <button 
                onClick={handleReset} 
                style={{ marginTop: '10px', padding: '5px 10px' }}
              >
                Reintentar
              </button>
            )}
          </div>
        )}

        {isLoading && (
          <div className="loading-indicator">
            <div className="spinner"></div>
            <p>Descomprimiendo archivo...</p>
          </div>
        )}

        {files.length > 0 && (
          <div className="files-container">
            <div className="files-header">
              <h2>Archivos extraídos</h2>
              <button onClick={downloadAll} className="download-all-button">
                Descargar todos
              </button>
            </div>

            <table className="files-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Tamaño</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {files.map((file, index) => (
                  <tr key={index}>
                    <td>{file.name}</td>
                    <td>{(file.size / 1024).toFixed(2)} KB</td>
                    <td>
                      <button onClick={() => downloadFile(file)} className="download-button">
                        Descargar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Mensajes de depuración en modo desarrollo */}
        {process.env.NODE_ENV === 'development' && debugMessages.length > 0 && (
          <div style={{ marginTop: '20px', textAlign: 'left', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '5px', maxHeight: '200px', overflow: 'auto' }}>
            <h3>Mensajes de depuración:</h3>
            <ul style={{ fontSize: '12px', padding: '0 0 0 20px' }}>
              {debugMessages.map((msg, i) => (
                <li key={i}>{msg.time}: {msg.message}</li>
              ))}
            </ul>
            <button onClick={() => setDebugMessages([])} style={{ fontSize: '12px', padding: '2px 5px' }}>
              Limpiar logs
            </button>
          </div>
        )}
        
        {/* Componente de instalación de PWA */}
        <InstallPWA />
      </main>
    </div>
  );
}

export default App;