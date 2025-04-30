import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import InstallPWA from './InstallPWA';
import ShareReceiver from './ShareReceiver';

function App() {
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [zipFile, setZipFile] = useState(null);
  const [isProcessingSharedFile, setIsProcessingSharedFile] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000';

  // Función para mostrar mensajes de depuración
  const logDebug = (message, data) => {
    console.log(`[DEBUG] ${message}`, data || '');
  };

  // Procesar el archivo ZIP enviándolo al backend
  const processZipFile = async (file) => {
    logDebug('Enviando archivo ZIP al backend:', file.name);
    // Crear un objeto FormData para enviar el archivo al backend
    const formData = new FormData();
    formData.append('zipFile', file);
    
    try {
      // Enviar el archivo al servidor
      const response = await fetch(`${API_URL}/api/extract`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error en el servidor');
      }
      
      const result = await response.json();
      logDebug('Respuesta del backend:', result);
      
      // Procesar los archivos obtenidos del backend
      const extractedFiles = result.files.map(file => ({
        name: file.name,
        size: file.size,
        path: file.path,
        operationId: result.operation_id
      }));
      
      setFiles(extractedFiles);
    } catch (error) {
      logDebug('Error al procesar ZIP:', error);
      throw error; // Re-lanzar el error para manejarlo en el componente que llama
    }
  };

  // Callback para manejar archivos compartidos (usado por ShareReceiver)
  const handleSharedFile = useCallback(async (file) => {
    logDebug('Procesando archivo compartido:', file.name);
    if (!file) return;
    
    // Verificar que sea un archivo ZIP - mejorado para manejar diferentes tipos MIME
    const isZipFile = file.type === 'application/zip' || 
                      file.type === 'application/x-zip' || 
                      file.type === 'application/x-zip-compressed' ||
                      file.name.toLowerCase().endsWith('.zip');
                      
    if (!isZipFile) {
      setError(`Por favor, comparte un archivo ZIP válido. Tipo recibido: ${file.type}`);
      return;
    }

    setError('');
    setIsLoading(true);
    setZipFile(file);
    
    try {
      await processZipFile(file);
    } catch (err) {
      logDebug('Error al procesar archivo compartido:', err.message);
      setError(`Error al procesar el archivo compartido: ${err.message}`);
    } finally {
      setIsLoading(false);
      setIsProcessingSharedFile(false);
    }
  }, []);

  // Callback para manejar errores de compartir (usado por ShareReceiver)
  const handleShareError = useCallback((errorMessage) => {
    setError(errorMessage);
    setIsProcessingSharedFile(false);
  }, []);

  // Manejar el evento de carga de archivos desde el input
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

  // Función para descargar un archivo específico
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

  // Verificar si se está compartiendo un archivo (para mostrar el spinner)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('share-target') && urlParams.has('shareId')) {
      setIsProcessingSharedFile(true);
    }
  }, []);

  return (
    <div className="App">
      {/* Componente invisible para manejar archivos compartidos */}
      <ShareReceiver 
        onShareReceived={handleSharedFile} 
        onShareError={handleShareError} 
      />
      
      <header className="App-header">
        <h1>Analiza tus chats</h1>
      </header>
      <main className="App-main">
        {isProcessingSharedFile ? (
          <div className="loading-indicator">
            <div className="spinner"></div>
            <p>Recibiendo archivo compartido...</p>
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
        
        {/* Componente de instalación de PWA */}
        <InstallPWA />
      </main>
    </div>
  );
}

export default App;