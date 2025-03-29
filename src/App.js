import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import './App.css';
import InstallPWA from './InstallPWA';

function App() {
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [zipFile, setZipFile] = useState(null);
  const [chatGptResponse, setChatGptResponse] = useState("");
  const [showChatGptResponse, setShowChatGptResponse] = useState(false);
  const location = useLocation();
  
  // URL del backend
  const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000';

  // Función para el logging
  const addDebugMessage = (message) => {
    console.log('[App Debug]', message);
  };

  // Efecto para procesar archivo de sessionStorage si viene de la página de confirmación
  useEffect(() => {
    const checkForProcessFlag = async () => {
      const params = new URLSearchParams(location.search);
      const shouldProcess = params.get('process') === 'true';
      
      if (shouldProcess) {
        // Limpiar la URL para evitar reprocesamiento
        window.history.replaceState({}, document.title, '/');
        
        // Obtener datos del archivo de sessionStorage
        const fileUrl = sessionStorage.getItem('sharedFileUrl');
        const fileName = sessionStorage.getItem('sharedFileName');
        const fileType = sessionStorage.getItem('sharedFileType');
        const fileSize = sessionStorage.getItem('sharedFileSize');
        
        if (fileUrl && fileName) {
          try {
            addDebugMessage(`Procesando archivo desde sessionStorage: ${fileName}`);
            
            // Convertir la URL del objeto a un Blob
            const response = await fetch(fileUrl);
            const blob = await response.blob();
            
            // Crear un objeto File
            const file = new File([blob], fileName, { type: fileType || 'application/octet-stream' });
            
            // Procesar el archivo
            handleSharedFile(file);
            
            // Limpiar sessionStorage
            sessionStorage.removeItem('sharedFileUrl');
            sessionStorage.removeItem('sharedFileName');
            sessionStorage.removeItem('sharedFileType');
            sessionStorage.removeItem('sharedFileSize');
            
          } catch (err) {
            console.error('Error al procesar archivo de sessionStorage:', err);
            setError('Error al procesar el archivo compartido');
          }
        }
      }
    };
    
    checkForProcessFlag();
  }, [location.search]);

  // Manejar archivos compartidos
  const handleSharedFile = async (file) => {
    addDebugMessage(`Procesando archivo: ${file.name}, tipo: ${file.type}`);
    
    if (!file) {
      setError('No se pudo recibir el archivo');
      return;
    }
    
    setError('');
    setIsLoading(true);
    setZipFile(file);
    
    try {
      // Procesar el archivo
      await processFile(file);
    } catch (err) {
      addDebugMessage(`Error procesando archivo: ${err.message}`);
      setError(`Error al procesar el archivo: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Procesar el archivo (puede ser ZIP o texto)
  const processFile = async (file) => {
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
      
      // Manejar la respuesta de ChatGPT si existe
      if (result.chatgpt_response) {
        addDebugMessage('Respuesta de ChatGPT recibida');
        setChatGptResponse(result.chatgpt_response);
        setShowChatGptResponse(true);
      } else {
        setChatGptResponse("");
        setShowChatGptResponse(false);
      }
      
      const extractedFiles = result.files.map(file => ({
        name: file.name,
        size: file.size,
        path: file.path,
        operationId: result.operation_id,
        hasText: file.has_text
      }));
      
      setFiles(extractedFiles);
    } catch (error) {
      addDebugMessage(`Error procesando archivo: ${error.message}`);
      throw error;
    }
  };

  // Manejar la carga manual de archivos
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    handleSharedFile(file);
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

  return (
    <div className="App">
      <header className="App-header">
        <h1>Extractor de archivos con análisis de ChatGPT</h1>
      </header>
      <main className="App-main">
        {!isLoading && files.length === 0 && (
          <div className="file-upload-container">
            <label className="file-upload-label">
              <input 
                type="file" 
                className="file-upload-input" 
                onChange={handleFileUpload} 
              />
              <div className="file-upload-text">
                <span>Haz clic para subir un archivo</span>
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
            <p>Analizando archivo...</p>
          </div>
        )}

        {/* Mostrar la respuesta de ChatGPT si está disponible */}
        {showChatGptResponse && chatGptResponse && (
          <div className="chatgpt-response">
            <h2>Análisis de ChatGPT</h2>
            <div className="response-content">
              {chatGptResponse.split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </div>
        )}

        {files.length > 0 && (
          <div className="files-container">
            <div className="files-header">
              <h2>Archivos extraídos</h2>
              {files.length > 1 && (
                <button onClick={downloadAll} className="download-all-button">
                  Descargar todos
                </button>
              )}
            </div>

            <table className="files-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Tamaño</th>
                  <th>Tipo</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {files.map((file, index) => (
                  <tr key={index}>
                    <td>{file.name}</td>
                    <td>{(file.size / 1024).toFixed(2)} KB</td>
                    <td>{file.hasText ? 'Texto' : 'Binario'}</td>
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