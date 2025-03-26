import React, { useState } from 'react';
import './App.css';

function App() {
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [zipFile, setZipFile] = useState(null);

  // URL del backend
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

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
      
      // Procesar los archivos obtenidos del backend
      const extractedFiles = result.files.map(file => ({
        name: file.name,
        size: file.size,
        path: file.path,
        operationId: result.operation_id
      }));
      
      setFiles(extractedFiles);
      
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
              <span className="file-upload-subtext">o arrastra y suelta</span>
            </div>
          </label>
        </div>

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
      </main>
    </div>
  );
}

export default App;
