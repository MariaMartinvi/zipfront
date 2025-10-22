import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './AnalysisViewer.css';

// Función para decodificar datos comprimidos
const decodeCompressedData = (compressedData) => {
  try {
    const decoded = decodeURIComponent(atob(compressedData));
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Error decodificando datos:', error);
    return null;
  }
};


const AnalysisViewer = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const dataParam = searchParams.get('data');
    if (dataParam) {
      const decodedData = decodeCompressedData(dataParam);
      if (decodedData) {
        setDatos(decodedData);
        // Cambiar idioma si está especificado
        if (decodedData.lang && decodedData.lang !== i18n.language) {
          i18n.changeLanguage(decodedData.lang);
        }
      } else {
        setError('Error al decodificar los datos. El enlace puede estar corrupto.');
      }
    } else {
      setError('No se encontraron datos en el enlace.');
    }
    setLoading(false);
  }, [searchParams, i18n]);

  if (loading) {
    return (
      <div className="analysis-viewer loading">
        <div className="loading-spinner">🔄</div>
        <p>Cargando análisis...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analysis-viewer error">
        <div className="error-container">
          <h2>😞 Oops!</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/')} className="cta-button">
            🚀 Analizar Nuevo Chat
          </button>
        </div>
      </div>
    );
  }

  // Colores para avatares
  const avatarColors = ['green-avatar', 'purple-avatar', 'pink-avatar', 'blue-avatar', 'orange-avatar', 'teal-avatar', 'yellow-avatar'];

  return (
    <div className="analysis-viewer">
      <div className="main-container">
        <div className="header">
          <h1>🧠 {t('hero.share_analysis.html_title', 'Análisis psicológico completo de conversaciones')}</h1>
          <p>{t('hero.share_analysis.description', 'Comparte tu análisis psicológico completo')}</p>
          <div>{t('hero.share_analysis.generated_with', 'Generado con ChatSalsa')}</div>
        </div>
        
        <div className="content">
          {/* Perfiles de personalidad */}
          {datos.profiles && datos.profiles.length > 0 && (
            <div className="section">
              <h2>👥 Perfiles de Personalidad</h2>
              <div className="psychology-list">
                {datos.profiles.map((profile, index) => (
                  <div key={index} className="psychology-item">
                    <div className={`avatar ${avatarColors[index % avatarColors.length]}`}>
                      {profile.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="psychology-content">
                      <h4>{profile.name}</h4>
                      <p>Perfil psicológico basado en patrones de comunicación detectados.</p>
                      <div className="psychology-tags">
                        {profile.tags.map((tag, tagIndex) => (
                          <span key={tagIndex} className={`tag ${avatarColors[index % avatarColors.length].replace('-avatar', '')}`}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Señales de alerta */}
          {datos.alertTags && datos.alertTags.length > 0 && (
            <div className="section alert-section">
              <div className="subsection-item">
                <div className="subsection-header">
                  <h4>
                    <span className="subsection-icon">⚠️</span>
                    Señales de Alerta Detectadas
                  </h4>
                </div>
                <div className="subsection-content">
                  <p>Se han identificado algunos patrones que requieren atención:</p>
                  <div className="alert-tags">
                    {datos.alertTags.map((alert, index) => (
                      <span key={index} className="tag red">
                        🚩 {alert}
                      </span>
                    ))}
                  </div>
                  <p><strong>Recomendación:</strong> Considera la importancia de mantener una comunicación saludable y equilibrada.</p>
                </div>
              </div>
            </div>
          )}

          {/* Información adicional */}
          <div className="section recommendations-section">
            <div className="subsection-item">
              <div className="subsection-header">
                <h4>
                  <span className="subsection-icon">💡</span>
                  Insights del Análisis
                </h4>
              </div>
              <div className="subsection-content">
                <p>Este análisis se basa en el procesamiento de patrones de comunicación, uso de emojis, frecuencia de mensajes y otros indicadores de comportamiento digital.</p>
                <ul>
                  <li><strong>Perfiles detectados:</strong> {datos.profiles?.length || 0} personalidades únicas identificadas</li>
                  <li><strong>Señales de atención:</strong> {datos.alertTags?.length || 0} patrones que requieren consideración</li>
                  <li><strong>Análisis generado:</strong> {new Date(datos.timestamp).toLocaleDateString()}</li>
                </ul>
                <p><em>Los resultados son indicativos y deben interpretarse como entretenimiento educativo.</em></p>
              </div>
            </div>
          </div>
        </div>

        <div className="footer">
          <h3>{t('hero.share_analysis.footer_title', '¿Te gustó este análisis?')}</h3>
          <p>{t('hero.share_analysis.footer_description', 'Descubre más insights de tus conversaciones de WhatsApp')}</p>
          <button 
            onClick={() => navigate('/')} 
            className="cta-button"
          >
            {t('hero.share_analysis.footer_cta', '🚀 Analizar Nuevo Chat Gratis')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalysisViewer; 