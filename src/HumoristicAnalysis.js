import React from 'react';
import './HumoristicAnalysis.css';
import { useTranslation } from 'react-i18next';
import { useTensorFlowAnalyzer } from './TensorFlowAnalyzer';

/**
 * Componente de Análisis Psicológico Humorístico
 * Usa TensorFlow.js para generar análisis detallados basados en el contenido de los chats
 */
function HumoristicAnalysis({ statistics }) {
  const { t } = useTranslation();
  const { analysis, loading, error } = useTensorFlowAnalyzer(statistics);

  // Función para convertir markdown a HTML
  const markdownToHtml = (markdown) => {
    if (!markdown) return "";
    
    // Conversión básica de markdown a HTML
    let html = markdown
      // Encabezados
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      
      // Listas
      .replace(/^\* (.*$)/gim, '<li>$1</li>')
      .replace(/^• (.*$)/gim, '<li>$1</li>')
      
      // Negrita e itálica
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      
      // Párrafos
      .replace(/^\s*$/gm, '</p><p>');
    
    // Envolver en párrafos
    html = '<p>' + html + '</p>';
    
    // Ajustar listas
    html = html.replace(/<li>/g, '</p><ul><li>').replace(/<\/li>/g, '</li></ul><p>');
    
    // Limpiar párrafos vacíos
    html = html.replace(/<p><\/p>/g, '');
    
    return html;
  };

  // Renderizar mensaje de carga
  const renderLoadingState = () => {
    return (
      <div className="loading-analysis">
        <p>{t('análisis.generando', 'Generando análisis psicológico en tu dispositivo...')}</p>
        <div className="local-spinner"></div>
        <p className="loading-hint">
          Este proceso puede tardar unos segundos mientras analizamos los patrones de comunicación.
        </p>
      </div>
    );
  };

  return (
    <div className="humoristic-analysis-container">
      <h2 className="section-title">
        <span role="img" aria-label="Lupa">🔍</span> {t('análisis.psicologico_titulo', 'Análisis Psicológico')}
      </h2>
      
      {loading && renderLoadingState()}
      
      {error && (
        <div className="analysis-error">
          <p>{error}</p>
        </div>
      )}
      
      {!loading && analysis && (
        <div 
          className="analysis-content"
          dangerouslySetInnerHTML={{ __html: markdownToHtml(analysis) }}
        />
      )}
      
      {/* Nota sobre el procesamiento */}
      {!loading && analysis && (
        <div className="analysis-note">
          <p>
            <span role="img" aria-label="info">ℹ️</span> 
            {t('análisis.nota_procesamiento', 'Este análisis ha sido generado usando tecnología de IA y procesamiento de lenguaje natural, y debe interpretarse con sentido del humor.')}
          </p>
        </div>
      )}
    </div>
  );
}

export default HumoristicAnalysis; 