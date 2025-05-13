import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import InstallPWA from './InstallPWA';
// Importar nuestro nuevo servicio de procesamiento de cliente
import { processZipFile, downloadProcessedFiles, createDownloadUrl } from './src/clientProcessor';
// Importar el analizador de chat y el detector de archivos de chat
import { analizarChat, encontrarArchivosChat } from './src/chatAnalyzer';
// Importar el componente de análisis
import AnalisisPrimerChat from './src/Analisis_primer_chat';

function App() {
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [zipFile, setZipFile] = useState(null);
  const [isProcessingSharedFile, setIsProcessingSharedFile] = useState(false);
  // Estado para almacenar el resultado del procesamiento completo
  const [processingResult, setProcessingResult] = useState(null);
  // Contenido del archivo de chat para análisis
  const [chatContent, setChatContent] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000';

  // Gestionar archivos recibidos por compartición (simulado, ya que no tenemos ShareReceiver)
  const handleSharedFiles = (sharedFiles) => {
    if (sharedFiles && sharedFiles.length > 0) {
      console.log("Archivos compartidos recibidos:", sharedFiles);
      setZipFile(sharedFiles[0]);
      setIsProcessingSharedFile(true);
    }
  };

  // Procesar archivos de forma asíncrona
  useEffect(() => {
    const processFiles = async () => {
      if (zipFile && isProcessingSharedFile) {
        setIsLoading(true);
        setError('');
        console.log(`Procesando archivo: ${zipFile.name}`);
        
        try {
          // Usar nuestro procesador cliente para extraer y anonimizar
          const result = await processZipFile(zipFile);
          
          if (result.success) {
            console.log("Procesamiento completado con éxito:", result);
            setFiles(result.processedFiles || []);
            setProcessingResult(result);
            
            // Buscar el archivo de chat para análisis
            const chatFile = encontrarArchivosChat(result.processedFiles);
            if (chatFile) {
              console.log("Archivo de chat encontrado para análisis:", chatFile.name);
              // Usar FileReader para leer el contenido del archivo de chat
              const reader = new FileReader();
              reader.onload = (e) => {
                const content = e.target.result;
                setChatContent(content);
              };
              reader.readAsText(chatFile.data);
            }
          } else {
            console.error("Error en el procesamiento:", result.error);
            setError(result.error || "Error procesando el archivo");
          }
        } catch (err) {
          console.error("Error durante el procesamiento:", err);
          setError(`Error: ${err.message}`);
        } finally {
          setIsLoading(false);
          setIsProcessingSharedFile(false);
        }
      }
    };

    processFiles();
  }, [zipFile, isProcessingSharedFile]);

  // Manejar la subida de archivos desde la interfaz
  const handleFileUpload = (event) => {
    const uploadedFile = event.target.files[0];
    if (uploadedFile) {
      setZipFile(uploadedFile);
      setIsProcessingSharedFile(true);
    }
  };

  // Descargar todos los archivos procesados como ZIP
  const handleDownloadAll = async () => {
    if (processingResult && processingResult.processedFiles && processingResult.processedFiles.length > 0) {
      try {
        await downloadProcessedFiles(processingResult.processedFiles, "archivos_procesados.zip");
      } catch (error) {
        console.error("Error al descargar archivos:", error);
        setError(`Error al descargar: ${error.message}`);
      }
    }
  };

  // Descargar un archivo individual
  const handleDownloadFile = (file) => {
    if (file && file.data) {
      const url = createDownloadUrl(file.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="logo-container">
          <img src="logo512.png" className="App-logo" alt="logo" />
          <h1>Visualizador de Archivos</h1>
        </div>
        <InstallPWA />
      </header>

      <main className="App-main">
        {/* No usamos ShareReceiver ya que no lo tenemos disponible */}
        <div className="file-upload">
          <h2>Subir Archivo ZIP</h2>
          <p>Selecciona un archivo ZIP para procesarlo</p>
          <input
            type="file"
            accept=".zip"
            onChange={handleFileUpload}
            disabled={isLoading}
          />
        </div>

        {isLoading && (
          <div className="loading">
            <div className="spinner"></div>
            <p>Procesando archivo...</p>
          </div>
        )}

        {error && <div className="error">{error}</div>}

        {files.length > 0 && (
          <div className="results">
            <h2>Archivos Procesados</h2>
            <button className="download-all-btn" onClick={handleDownloadAll}>
              Descargar Todos
            </button>
            <div className="files-grid">
              {files.map((file, index) => (
                <div key={index} className="file-card">
                  <div className="file-icon">
                    {file.name.endsWith('.txt') ? '📄' : 
                     file.name.endsWith('.csv') ? '📊' : 
                     file.name.endsWith('.jpg') || file.name.endsWith('.png') ? '🖼️' : 
                     file.name.endsWith('.pdf') ? '📑' : '📁'}
                  </div>
                  <div className="file-name">{file.name}</div>
                  <button 
                    className="download-btn"
                    onClick={() => handleDownloadFile(file)}
                  >
                    Descargar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {chatContent && (
          <div className="analysis-section">
            <h2>Análisis del Chat</h2>
            {/* Usamos nuestro componente de análisis pasando los datos directamente */}
            <AnalisisPrimerChat chatData={chatContent} />
          </div>
        )}
      </main>

      <footer className="App-footer">
        <p>&copy; 2023 Visualizador de Archivos</p>
      </footer>
    </div>
  );
}

export default App;