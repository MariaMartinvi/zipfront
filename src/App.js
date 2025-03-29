import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [fileInfo, setFileInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Función para subir el archivo al backend (convertida a useCallback)
  const handleUpload = useCallback(async (fileToUpload) => {
    if (!fileToUpload) return;
    
    setLoading(true);
    setError(null);
    setFileInfo(null);

    try {
      const formData = new FormData();
      formData.append('file', fileToUpload);

      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al subir el archivo');
      }

      setFileInfo(data.fileInfo);
    } catch (err) {
      setError(err.message);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Efecto para manejar archivos compartidos desde otras apps (como WhatsApp)
  useEffect(() => {
    // Verificamos si venimos de una acción de compartir
    const url = new URL(window.location.href);
    if (url.pathname === '/share-target' && window.location.search) {
      // Aquí procesaríamos los datos compartidos - en una implementación real
      console.log('Archivo compartido detectado a través de Share Target API');
      // Redirigir a la página principal
      window.history.replaceState({}, '', '/');
    }
  }, []); 

  // Función para manejar la selección de archivo manual
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      handleUpload(selectedFile);
    }
  };

  // Formatear el tamaño del archivo en unidades legibles
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Formatear la fecha
  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Visor de Archivos Compartidos</h1>
        <p>Recibe archivos compartidos desde WhatsApp u otras aplicaciones</p>
      </header>

      <main className="App-main">
        <div className="upload-section">
          <label className="file-input-label">
            Seleccionar archivo
            <input 
              type="file" 
              onChange={handleFileChange} 
              className="file-input"
            />
          </label>
          <p className="or-text">o comparte un archivo desde WhatsApp</p>
        </div>

        {loading && <p className="status-message">Cargando archivo...</p>}
        
        {error && <p className="error-message">Error: {error}</p>}

        {fileInfo && (
          <div className="file-info-container">
            <h2>Información del archivo</h2>
            <div className="file-details">
              <p><strong>Nombre original:</strong> {fileInfo.originalName}</p>
              <p><strong>Tipo:</strong> {fileInfo.type}</p>
              <p><strong>Tamaño:</strong> {formatFileSize(fileInfo.size)}</p>
              <p><strong>Fecha de subida:</strong> {formatDate(fileInfo.uploadDate)}</p>
            </div>

            {fileInfo.type && fileInfo.type.startsWith('image/') && (
              <div className="file-preview">
                <h3>Vista previa</h3>
                <img 
                  src={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/uploads/${fileInfo.name}`} 
                  alt="Vista previa" 
                  className="preview-image"
                />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;