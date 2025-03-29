import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './ShareConfirmation.css';

function ShareConfirmation() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Comprobar si estamos recibiendo un archivo compartido
    const checkForSharedFile = async () => {
      try {
        // Verificar si el Service Worker está activo
        if (navigator.serviceWorker.controller) {
          console.log('Solicitando archivo compartido...');
          
          // Extraer el ID del archivo de la URL (si existe)
          const params = new URLSearchParams(location.search);
          const shareId = params.get('id');
          
          if (!shareId) {
            setError('No se encontró un identificador de archivo compartido');
            setLoading(false);
            return;
          }
          
          // Solicitar el archivo al Service Worker
          navigator.serviceWorker.controller.postMessage({
            type: 'GET_SHARED_FILE',
            shareId: shareId
          });
          
          // Configurar un listener para recibir el archivo
          const messageHandler = (event) => {
            if (event.data && event.data.type === 'SHARED_FILE' && event.data.file) {
              console.log('Archivo recibido:', event.data.file);
              setFile(event.data.file);
              setLoading(false);
            } else if (event.data && event.data.type === 'SHARED_FILE_ERROR') {
              setError(event.data.error || 'Error al obtener el archivo');
              setLoading(false);
            }
          };
          
          navigator.serviceWorker.addEventListener('message', messageHandler);
          
          // Limpiar el listener cuando el componente se desmonte
          return () => {
            navigator.serviceWorker.removeEventListener('message', messageHandler);
          };
        } else {
          setError('El Service Worker no está disponible');
          setLoading(false);
        }
      } catch (err) {
        console.error('Error al verificar archivo compartido:', err);
        setError('Error al verificar el archivo compartido');
        setLoading(false);
      }
    };
    
    checkForSharedFile();
  }, [location.search]);
  
  // Función para procesar el archivo
  const handleProcessFile = () => {
    if (file) {
      // Almacenar el archivo en sessionStorage (para archivos pequeños)
      // Para archivos grandes se podría usar IndexedDB
      try {
        // Convertir el archivo a una URL de objeto
        const fileUrl = URL.createObjectURL(file);
        sessionStorage.setItem('sharedFileUrl', fileUrl);
        sessionStorage.setItem('sharedFileName', file.name);
        sessionStorage.setItem('sharedFileType', file.type);
        sessionStorage.setItem('sharedFileSize', file.size);
        
        // Navegar a la página principal con indicador para procesar
        navigate('/?process=true');
      } catch (err) {
        console.error('Error al guardar archivo:', err);
        setError('Error al preparar el archivo para procesamiento');
      }
    }
  };
  
  // Función para cancelar y volver a la página principal
  const handleCancel = () => {
    navigate('/');
  };
  
  return (
    <div className="share-confirmation">
      <div className="confirmation-card">
        <h2>Archivo compartido</h2>
        
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Cargando archivo compartido...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <p className="error-message">{error}</p>
            <button className="button cancel-button" onClick={handleCancel}>
              Volver al inicio
            </button>
          </div>
        ) : (
          <>
            <div className="file-info">
              <div className="file-icon">
                {file.type.includes('image') ? (
                  <img src="/assets/image-icon.svg" alt="Icono de imagen" />
                ) : (
                  <img src="/assets/document-icon.svg" alt="Icono de documento" />
                )}
              </div>
              <div className="file-details">
                <h3>{file.name}</h3>
                <p>{(file.size / 1024).toFixed(2)} KB</p>
                <p className="file-type">{file.type || 'Archivo'}</p>
              </div>
            </div>
            
            <div className="confirmation-message">
              <p>¿Deseas procesar este archivo para obtener un análisis con ChatGPT?</p>
            </div>
            
            <div className="action-buttons">
              <button className="button process-button" onClick={handleProcessFile}>
                Procesar
              </button>
              <button className="button cancel-button" onClick={handleCancel}>
                Cancelar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ShareConfirmation;