import React, { useState, useEffect } from 'react';
import './App.css';
import InstallPWA from './InstallPWA';

function App() {
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [zipFile, setZipFile] = useState(null);
  const [isProcessingSharedFile, setIsProcessingSharedFile] = useState(false);

  //const API_URL = 'http://127.0.0.1:5000';

  const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000';


  //const API_URL = process.env.NODE_ENV === 'production' 
 // ? window.location.origin 
  //: '';

  // URL del backend
 // const API_URL = process.env.REACT_APP_API_URL || window.location.origin;

  // Función para mostrar mensajes de depuración
  const logDebug = (message, data) => {
    console.log(`[DEBUG] ${message}`, data || '');
  };

  // Detectar archivos compartidos desde WhatsApp u otras apps
  useEffect(() => {
    // Verificar si la app fue abierta por compartir
    const urlParams = new URLSearchParams(window.location.search);
    const isSharedFile = urlParams.has('share-target');
    const shareId = urlParams.get('shareId');

    if (isSharedFile && shareId) {
      logDebug('Detectada solicitud de archivo compartido con ID:', shareId);
      setIsProcessingSharedFile(true);
      
      // Escuchar el evento de mensaje del Service Worker
      const messageHandler = (event) => {
        if (event.data && event.data.type === 'SHARED_FILE' && event.data.file) {
          logDebug('Archivo recibido del Service Worker:', event.data.file.name);
          handleSharedFile(event.data.file);
          navigator.serviceWorker.removeEventListener('message', messageHandler);
        }
      };
      
      // Registrar el listener para mensajes
      navigator.serviceWorker.addEventListener('message', messageHandler);
      
      // Comprobar si hay un service worker activo
      if (navigator.serviceWorker.controller) {
        // Solicitar el archivo compartido
        logDebug('Solicitando archivo compartido al Service Worker');
        navigator.serviceWorker.controller.postMessage({
          type: 'GET_SHARED_FILE',
          shareId: shareId
        });
      } else {
        logDebug('No hay Service Worker controlando esta página');
        setError('No se pudo procesar el archivo compartido. Por favor, intenta de nuevo.');
        setIsProcessingSharedFile(false);
      }
      
      return () => {
        // Limpiar el listener al desmontar
        navigator.serviceWorker.removeEventListener('message', messageHandler);
      };
    }
    
    // Escuchar notificaciones de nuevos archivos compartidos
    const fileAvailableHandler = (event) => {
      if (event.data && event.data.type === 'SHARED_FILE_AVAILABLE') {
        logDebug('Notificación de nuevo archivo compartido:', event.data.shareId);
        window.location.href = `/?share-target=true&shareId=${event.data.shareId}`;
      }
    };
    
    navigator.serviceWorker.addEventListener('message', fileAvailableHandler);
    
    return () => {
      navigator.serviceWorker.removeEventListener('message', fileAvailableHandler);
    };
  }, []);

  // Manejar archivos recibidos a través de la Web Share Target API
  const handleSharedFile = async (file) => {
    logDebug('Procesando archivo compartido:', file.name);
    if (!file) return;
    
    if (file.type !== 'application/zip' && !file.name.endsWith('.zip')) {
      setError('Por favor, comparte un archivo ZIP válido');
      setIsProcessingSharedFile(false);
      return;
    }

    setError('');
    setIsLoading(true);
    setZipFile(file);
    
    try {
      // Procesar el archivo compartido
      await processZipFile(file);
    } catch (err) {
      logDebug('Error al procesar archivo compartido:', err.message);
      setError(`Error al procesar el archivo compartido: ${err.message}`);
    } finally {
      setIsLoading(false);
      setIsProcessingSharedFile(false);
    }
  };

  // Procesar el archivo ZIP
  const processZipFile = async (file) => {
    logDebug('Enviando archivo ZIP al backend');
    // Crear un objeto FormData para enviar el archivo al backend
    const formData = new FormData();
    formData.append('zipFile', file);
    
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
  };

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

  const downloadFile = (file) => {
    window.location.href = `${API_URL}/api/download/${file.operationId}/${encodeURIComponent(file.path)}`;
  };

  const downloadAll = () => {
    if (files.length > 0) {
      const operationId = files[0].operationId;
      window.location.href = `${API_URL}/api/download-all/${operationId}`;
    }
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