import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import './AnalysisViewer.css';

const AnalysisViewer = () => {
  const [searchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const compressedData = searchParams.get('data');
      if (compressedData) {
        // Descomprimir datos
        const jsonString = decodeURIComponent(atob(compressedData));
        const decompressedData = JSON.parse(jsonString);
        setData(decompressedData);
      } else {
        setError('No data found');
      }
    } catch (err) {
      console.error('Error decompressing data:', err);
      setError('Error loading data');
    }
  }, [searchParams]);

  if (error) {
    return (
      <div className="viewer-error">
        <h2>Error</h2>
        <p>{error}</p>
        <a href="https://chatsalsa.com">Go to ChatSalsa</a>
      </div>
    );
  }

  if (!data) {
    return <div className="viewer-loading">Loading...</div>;
  }

  // Generar datos para Open Graph
  const profileNames = data.profiles?.slice(0, 3).map(p => p.name).filter(Boolean) || [];
  const alertTags = data.alertTags?.slice(0, 2) || [];
  
  const ogTitle = '🧠 Análisis Psicológico del Chat - ChatSalsa';
  const ogDescription = `Análisis completo de personalidades: ${profileNames.join(', ')}. ${alertTags.length > 0 ? `Alertas: ${alertTags.join(', ')}.` : ''} Descubre insights únicos de tu chat de WhatsApp.`;
  const ogImage = 'https://chatsalsa.com/1024x1024.png'; // Usando imagen existente
  const ogUrl = window.location.href;

  return (
    <>
      <Helmet>
        {/* Open Graph metadatos para WhatsApp scraping */}
        <title>{ogTitle}</title>
        <meta name="description" content={ogDescription} />
        
        {/* Open Graph específicos */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={ogTitle} />
        <meta property="og:description" content={ogDescription} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:url" content={ogUrl} />
        <meta property="og:site_name" content="ChatSalsa" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={ogTitle} />
        <meta name="twitter:description" content={ogDescription} />
        <meta name="twitter:image" content={ogImage} />
        
        {/* WhatsApp específicos */}
        <meta property="og:image:width" content="1024" />
        <meta property="og:image:height" content="1024" />
        <meta property="og:image:type" content="image/png" />
      </Helmet>

      <div className="analysis-viewer">
        <header className="viewer-header">
          <h1>🧠 Análisis Psicológico del Chat</h1>
          <p>Insights únicos de personalidades</p>
        </header>

        {data.profiles && data.profiles.length > 0 && (
          <section className="profiles-section">
            <h2>Perfiles de Personalidad</h2>
            <div className="profiles-grid">
              {data.profiles.map((profile, index) => (
                <div key={index} className="profile-card">
                  <h3>{profile.name}</h3>
                  <div className="profile-tags">
                    {profile.tags.map((tag, tagIndex) => (
                      <span key={tagIndex} className="tag">{tag}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {data.alertTags && data.alertTags.length > 0 && (
          <section className="alerts-section">
            <h2>🚩 Señales de Alerta</h2>
            <div className="alert-tags">
              {data.alertTags.map((alert, index) => (
                <span key={index} className="alert-tag">{alert}</span>
              ))}
            </div>
          </section>
        )}

        <footer className="viewer-footer">
          <p>Generado con ChatSalsa</p>
          <a href="https://chatsalsa.com" className="cta-button">
            🚀 Analiza tu chat GRATIS
          </a>
        </footer>
      </div>
    </>
  );
};

export default AnalysisViewer; 