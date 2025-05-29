import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const DebugLogger = () => {
  const { user, isAuthLoading } = useAuth();
  const [logs, setLogs] = useState([]);
  const [isVisible, setIsVisible] = useState(false);

  // Función para añadir logs
  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-20), `${timestamp}: ${message}`]); // Mantener solo últimos 20 logs
  };

  // Detectar si viene de WhatsApp
  useEffect(() => {
    const userAgent = navigator.userAgent;
    const isFromWhatsApp = userAgent.includes('WhatsApp') || 
                          document.referrer.includes('whatsapp') ||
                          window.location.search.includes('whatsapp');
    
    if (isFromWhatsApp) {
      setIsVisible(true);
      addLog('🚀 Apertura desde WhatsApp detectada');
    }
  }, []);

  // Log cambios en autenticación
  useEffect(() => {
    addLog(`🔐 Auth: user=${!!user}, isLoading=${isAuthLoading}`);
  }, [user, isAuthLoading]);

  // Log cambios en URL
  useEffect(() => {
    addLog(`🌐 URL: ${window.location.pathname}${window.location.search}`);
  }, []);

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      maxHeight: '200px',
      backgroundColor: 'rgba(0,0,0,0.9)',
      color: 'white',
      fontSize: '10px',
      padding: '10px',
      zIndex: 9999,
      overflow: 'auto',
      fontFamily: 'monospace'
    }}>
      <div style={{ marginBottom: '5px', borderBottom: '1px solid #333', paddingBottom: '5px' }}>
        <strong>🐛 DEBUG LOGS</strong>
        <button 
          onClick={() => setIsVisible(false)}
          style={{
            float: 'right',
            background: 'red',
            color: 'white',
            border: 'none',
            padding: '2px 6px',
            fontSize: '10px'
          }}
        >
          ✕
        </button>
      </div>
      {logs.map((log, index) => (
        <div key={index} style={{ marginBottom: '2px' }}>
          {log}
        </div>
      ))}
    </div>
  );
};

export default DebugLogger; 