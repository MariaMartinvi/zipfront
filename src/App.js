import React, { useState, useEffect } from 'react';
import './App.css';
import InstallPWA from './InstallPWA';

function App() {
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [zipFile, setZipFile] = useState(null);
  const [isProcessingSharedFile, setIsProcessingSharedFile] = useState(false);
  const [debugMessages, setDebugMessages] = useState([]);

  // URL del backend
  const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000';

  // Función para el logging (visible en modo desarrollo)
  const addDebugMessage = (message) => {
    console.log('[App Debug]', message);
    setDebugMessages(prev => [...prev, { time: new Date().toISOString(), message }]);
  };

  // Efecto para manejar compartir archivos
  useEffect(() => {
    // Verificar parámetros en la URL
    const urlParams = new URLSearchParams(window.location.search);
    const isShared = urlParams.has('shared');
    const hasError = urlParams.has('error');
    const shareId = urlParams.get('shared');
    
    if (hasError) {
      setError('Hubo un problema al procesar el archivo compartido. Por favor, intenta de nuevo.');
      addDebugMessage('Error detectado en parámetros URL');
      return;
    }
    
    if (isShared) {
      addDebugMessage(`Parámetro 'shared' detectado en URL: ${shareId}`);
      setIsProcessingSharedFile(true);
      
      // Solicitar el archivo compartido si tenemos un ID
      if (shareId && navigator.serviceWorker.controller) {
        addDebugMessage('Solicitando archivo compartido al Service Worker');
        navigator.serviceWorker.controller.postMessage({
          type: 'GET_SHARED_FILE',
          shareId: shareId
        });
      }
    }
    
    // Función para manejar los mensajes del Service Worker
    const handleServiceWorkerMessage = (event) => {
      addDebugMessage(`Mensaje recibido: ${event.data?.type}`);
      
      if (event.data && event.data.type === 'SHARED_FILE' && event.data.file) {
        addDebugMessage(`Archivo recibido: ${event.data.file.name}`);
        handleSharedFile(event.data.file);
      } else if (event.data && event.data.type === 'SHARED_FILE_ERROR') {
        setError(`Error al recibir archivo: ${event.data.error || 'Error desconocido'}`);
        setIsProcessingSharedFile(false);
      } else if (event.data && event.data.type === 'PONG') {
        addDebugMessage('Service Worker está activo (respuesta PONG)');
      }
    };
    
    // Registrar el listener para mensajes del Service Worker
    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    
    // Verificar si el Service Worker está activo
    if (navigator.serviceWorker.controller) {
      addDebugMessage('Service Worker detectado, enviando PING');
      navigator.serviceWorker.controller.postMessage({ type: 'PING' });
    } else {
      addDebugMessage('Service Worker no detectado');
    }
    
    // Si estamos esperando un archivo compartido, establecer un timeout
    if (isProcessingSharedFile) {
      const timeout = setTimeout(() => {
        if (isProcessingSharedFile) {
          addDebugMessage('Timeout esperando archivo compartido');
          setError('No se pudo recibir el archivo compartido a tiempo. Por favor, intenta de nuevo.');
          setIsProcessingSharedFile(false);
        }
      }, 10000); // 10 segundos
      
      return () => {
        clearTimeout(timeout);
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      };
    }
    
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
    };
  }, [isProcessingSharedFile]);

  // Manejar archivos recibidos del service worker
  const handleSharedFile = async (file) => {
    addDebugMessage(`Procesando archivo compartido: ${file.name}, tipo: ${file.type}`);
    
    if (!file) {
      setError('No se pudo recibir el archivo');
      setIsProcessingSharedFile(false);
      return;
    }
    
    // Verificar que sea un archivo ZIP
    const isZipFile = file.type === 'application/zip' || 
                      file.type === 'application/x-zip' ||
                      file.type === 'application/x-zip-compressed' ||
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
      // Procesar el archivo
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
      // Mostrar la URL a la que se está enviando la solicitud
      addDebugMessage(`URL de API: ${API_URL}/api/extract`);
      
      const response = await fetch(`${API_URL}/api/extract`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        addDebugMessage(`Error en respuesta del servidor: ${response.status}, ${errorText}`);
        
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
      addDebugMessage(`Error procesando ZIP: ${error.message}`);
      throw error;
    }
  };

  // Manejar la carga manual de archivos
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

  // Función para descargar un archivo
  const downloadFile = (file) => {
    window.location.href = `${API_URL}/api/download/${file.operationId}/${encodeURIComponent(file.path)}`;
  };

  // Función para descargar todos los archivos
  const downloadAll = () => {
    if (files.length > 0) {
      const operationId = files[0].operationId;
      window.location.href = `${API_URL}/api/download-all/${operationId}`;
    }
  };

  // Reiniciar la aplicación (para debugging)
  const handleReset = () => {
    setIsProcessingSharedFile(false);
    setError('');
    setIsLoading(false);
    setDebugMessages([]);
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
        
        {/* Mostrar mensajes de depuración en modo desarrollo */}
        {process.env.NODE_ENV === 'development' && debugMessages.length > 0 && (
          <div style={{ marginTop: '20px', textAlign: 'left', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '5px', maxHeight: '200px', overflow: 'auto' }}>
            <h3>Mensajes de depuración:</h3>
            <ul style={{ fontSize: '12px', padding: '0 0 0 20px' }}>
              {debugMessages.map((msg, i) => (
                <li key={i}>{msg.time}: {msg.message}</li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Componente de instalación de PWA */}
        <InstallPWA />
      </main>
    </div>
  );
}

export default App;