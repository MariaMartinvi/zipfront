import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import InstallPWA from './InstallPWA';
import ShareReceiver from './ShareReceiver';
// Importar nuestro nuevo servicio de procesamiento de cliente
import { processZipFile, downloadProcessedFiles, createDownloadUrl } from './src/clientProcessor';

function App() {
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [zipFile, setZipFile] = useState(null);
  const [isProcessingSharedFile, setIsProcessingSharedFile] = useState(false);
  // Estado para almacenar el resultado del procesamiento completo
  const [processingResult, setProcessingResult] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000';

  // Función para mostrar mensajes de depuración
  const logDebug = (message, data) => {
    console.log(`[DEBUG] ${message}`, data || '');
  };

  // Procesar el archivo ZIP en el cliente (reemplaza la versión anterior)
  const handleZipProcessing = async (file) => {
    logDebug('Procesando archivo ZIP en el cliente:', file.name);
    
    try {
      // Usar nuestro nuevo procesador de cliente
      const result = await processZipFile(file);
      logDebug('Resultado del procesamiento cliente:', result);
      
      // Guardar el resultado completo para uso posterior (incluye rawFiles)
      setProcessingResult(result);
      
      // Actualizar la lista de archivos visible - mantener formato idéntico al original
      const extractedFiles = result.files.map(file => ({
        name: file.name,
        size: file.size,
        path: file.path,
        operationId: result.operation_id
      }));
      
      setFiles(extractedFiles);
      return result;
    } catch (error) {
      logDebug('Error al procesar ZIP en cliente:', error);
      throw error;
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
      // Usar nuestra nueva función de procesamiento
      await handleZipProcessing(file);
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
      // Usar nuestra nueva función de procesamiento
      await handleZipProcessing(file);
    } catch (err) {
      console.error('Error al procesar:', err);
      setError(`Error al procesar el archivo: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para descargar un archivo específico (actualizada para cliente)
  const downloadFile = async (file) => {
    try {
      logDebug('Descargando archivo:', file.path);
      
      if (!processingResult) {
        throw new Error('No hay resultados de procesamiento disponibles');
      }
      
      // Buscar el archivo en los resultados del procesamiento
      const fileToDownload = processingResult.rawFiles.find(f => f.path === file.path);
      
      if (!fileToDownload) {
        throw new Error(`Archivo no encontrado: ${file.path}`);
      }
      
      // Crear URL para descarga
      const downloadInfo = createDownloadUrl(fileToDownload);
      
      // Crear un enlace temporal y hacer clic en él para descargar
      const a = document.createElement('a');
      a.href = downloadInfo.url;
      a.download = downloadInfo.filename;
      document.body.appendChild(a);
      a.click();
      
      // Limpiar
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadInfo.url);
      }, 100);
      
    } catch (error) {
      console.error('Error al descargar archivo:', error);
      setError(`Error al descargar: ${error.message}`);
    }
  };

  // Función para descargar todos los archivos (actualizada para cliente)
  const downloadAll = async () => {
    try {
      if (!processingResult) {
        throw new Error('No hay resultados de procesamiento disponibles');
      }
      
      logDebug('Descargando todos los archivos...');
      
      // Generar el ZIP con todos los archivos procesados
      const downloadInfo = await downloadProcessedFiles(processingResult);
      
      // Crear un enlace temporal y hacer clic en él para descargar
      const a = document.createElement('a');
      a.href = URL.createObjectURL(downloadInfo.blob);
      a.download = downloadInfo.filename;
      document.body.appendChild(a);
      a.click();
      
      // Limpiar
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
      }, 100);
      
    } catch (error) {
      console.error('Error al descargar todos los archivos:', error);
      setError(`Error al descargar: ${error.message}`);
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