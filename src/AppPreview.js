import React, { useState, useEffect } from 'react';
import './AppPreview.css';

const AppPreview = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);

  const toggleModal = () => {
    setIsModalVisible(!isModalVisible);
  };

  // Función para obtener información de depuración del backend
  const fetchDebugInfo = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000';
      console.log('Obteniendo información de debug desde:', `${API_URL}/api/debug-info`);
      
      const response = await fetch(`${API_URL}/api/debug-info`);
      if (!response.ok) {
        throw new Error(`Error ${response.status}: No se pudo obtener información de depuración`);
      }
      
      const data = await response.json();
      console.log('Información de debug recibida:', data);
      setDebugInfo(data);
    } catch (error) {
      console.error('Error al obtener información de depuración:', error);
      setDebugInfo({ error: error.message });
    }
  };

  // Cargar información de depuración al montar el componente
  useEffect(() => {
    fetchDebugInfo();
  }, []);

  return (
    <div className="app-preview-container">
      <div className="app-preview-content">
        <div className="app-preview-text">
          <h2>Descubre los secretos de tus conversaciones</h2>
          <p>
            Combinamos la estadística y la  <strong>Inteligencia Artificial avanzada de Mistral</strong> (desarrollada en la UE) 
            para revelarte datos fascinantes sobre los  perfiles psicológicos de los participantes y las dinámicas de grupo.
          </p>
          
          <div className="security-badge">
            <span className="security-icon">🔒</span>
            <span className="security-text">100% privado y seguro</span>
          </div>
          
          <ul className="app-preview-features">
            <li>
              <span className="feature-icon">🧠</span>
              <span><strong>Análisis psicológico</strong> de los patrones de comunicación.</span>
            </li>
            <li>
              <span className="feature-icon">📊</span>
              <span>Estadísticas detalladas sobre quién domina las conversaciones.</span>
            </li>
            <li>
              <span className="feature-icon">😀</span>
              <span>Interpretación emocional basada en el uso de emojis y lenguaje.</span>
            </li>
            <li>
              <span className="feature-icon">🔍</span>
              <span>Descubre personalidades ocultas y dinámicas de grupo.</span>
            </li>
          </ul>
          
          <div className="privacy-container">
            <div className="privacy-item">
              <span className="privacy-icon">⚡</span>
              <span>Los chats se analizan al momento y se eliminan inmediatamente</span>
            </div>
            
           
            <div className="privacy-item">
              <span className="privacy-icon">🔐</span>
              <span>Los datos no se almacenan ni se usan para entrenar IA</span>
            </div>
          </div>
          
          <div className="cta-container">
            <button 
              className="cta-button"
              onClick={() => window.location.href = '/register'}
            >
              ¡Descubre la psicología de tu chat!
            </button>
          </div>
        </div>
        <div className="app-preview-image">
          <img src="/ejemplo.png" alt="Ejemplo de análisis de chat" />
          <div className="image-overlay">
            <span className="image-caption">¡Así lucirá tu análisis!</span>
          </div>
          
          {/* Indicador adicional de que hay más contenido */}
          <div className="image-more-indicator">
            <span>Ver análisis completo</span>
            <div className="more-arrow">↓</div>
          </div>
          
          <button 
            className="expand-button" 
            onClick={toggleModal}
            aria-label="Ver imagen completa"
          >
            <span className="expand-icon">+</span>
            <span className="expand-text">Ver completo</span>
          </button>
        </div>
      </div>
      
      {/* Información de depuración (visible solo en desarrollo) */}
      {process.env.NODE_ENV === 'development' && debugInfo && (
        <div className="debug-panel">
          <h4>Información de Depuración</h4>
          
          {debugInfo.error ? (
            <div className="debug-error">
              Error: {debugInfo.error}
            </div>
          ) : (
            <div className="debug-content">
              <div className="debug-section">
                <h5>Análisis Recientes</h5>
                <table className="debug-table">
                  <thead>
                    <tr>
                      <th>Operation ID</th>
                      <th>Formato</th>
                      <th>Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {debugInfo.recent_analyses && debugInfo.recent_analyses.length > 0 ? (
                      debugInfo.recent_analyses.map((analysis, idx) => (
                        <tr key={idx} className={analysis.formato_chat === 'ios' ? 'ios-format' : ''}>
                          <td>{analysis.operation_id}</td>
                          <td>{analysis.formato_chat}</td>
                          <td>{analysis.date}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="3">No hay análisis recientes</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              <div className="debug-section">
                <h5>Archivos de Chat Recientes</h5>
                <table className="debug-table">
                  <thead>
                    <tr>
                      <th>Operation ID</th>
                      <th>Archivo</th>
                      <th>Formato Detectado</th>
                      <th>Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {debugInfo.recent_chats && debugInfo.recent_chats.length > 0 ? (
                      debugInfo.recent_chats.map((chat, idx) => (
                        <tr key={idx} className={chat.formato_detectado === 'ios' ? 'ios-format' : ''}>
                          <td>{chat.operation_id}</td>
                          <td>{chat.file_name}</td>
                          <td>{chat.formato_detectado}</td>
                          <td>{chat.date}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="4">No hay archivos de chat recientes</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              <div className="debug-section">
                <h5>Mensajes de Log Relacionados con Formato iOS</h5>
                <div className="debug-logs">
                  {debugInfo.log_messages && debugInfo.log_messages.length > 0 ? (
                    <ul>
                      {debugInfo.log_messages.map((log, idx) => (
                        <li key={idx} className={log.toLowerCase().includes('ios') ? 'ios-log' : ''}>
                          {log}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No hay mensajes de log relevantes</p>
                  )}
                </div>
              </div>
              
              <div className="debug-section">
                <h5>Información del Sistema</h5>
                <table className="debug-table">
                  <tbody>
                    <tr>
                      <td>API URL:</td>
                      <td>{debugInfo.app_info.api_url}</td>
                    </tr>
                    <tr>
                      <td>Entorno:</td>
                      <td>{debugInfo.app_info.env}</td>
                    </tr>
                    <tr>
                      <td>Plataforma:</td>
                      <td>{debugInfo.app_info.platform}</td>
                    </tr>
                    <tr>
                      <td>Python:</td>
                      <td>{debugInfo.app_info.python_version}</td>
                    </tr>
                    <tr>
                      <td>Timestamp:</td>
                      <td>{debugInfo.app_info.timestamp}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          <button onClick={fetchDebugInfo} className="debug-refresh">Actualizar Información</button>
        </div>
      )}
      
      {isModalVisible && (
        <div className="modal-overlay" onClick={toggleModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Cómo funciona Chat Salsa Analytics</h3>
            <ol>
              <li>Exporta tu chat de WhatsApp (no guardamos tus conversaciones)</li>
              <li>Sube el archivo .txt o .zip</li>
              <li>Recibe análisis detallados inmediatamente</li>
              <li>Descubre patrones de comunicación y estadísticas interesantes</li>
            </ol>
            <button className="close-modal-btn" onClick={toggleModal}>
              Cerrar
            </button>
          </div>
        </div>
      )}
      
      <div className="app-preview-testimonials">
        <h3>Lo que dicen nuestros usuarios</h3>
        <div className="testimonials-container">
          <div className="testimonial">
            <div className="testimonial-content">
              "¡Increíble! El análisis psicológico me permitió entender mejor a mis amigos y por qué respondemos como lo hacemos."
            </div>
            <div className="testimonial-author">Carlos P.</div>
          </div>
          <div className="testimonial">
            <div className="testimonial-content">
              "Me sorprendió descubrir los patrones emocionales en nuestro grupo familiar. La IA detectó tensiones que ni siquiera habíamos notado."
            </div>
            <div className="testimonial-author">Ana M.</div>
          </div>
          <div className="testimonial">
            <div className="testimonial-content">
              "Tranquilidad total sabiendo que mis datos están seguros y se eliminan automáticamente. El análisis psicológico fue fascinante."
            </div>
            <div className="testimonial-author">Laura T.</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppPreview; 