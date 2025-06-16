import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import './TopProfilesViewer.css';

const TopProfilesViewer = () => {
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
  const topCategories = Object.keys(data.categorias).slice(0, 3);
  const profileNames = topCategories.map(cat => data.categorias[cat]?.nombre).filter(Boolean);
  
  const ogTitle = '🏆 Top Perfiles del Chat - ChatSalsa';
  const ogDescription = `Descubre quién domina el chat: ${profileNames.join(', ')} y más. Análisis completo de personalidades de WhatsApp.`;
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
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:type" content="image/png" />
      </Helmet>

      <div className="top-profiles-viewer">
        <header className="viewer-header">
          <h1>🏆 Top Perfiles del Chat</h1>
          <p>Análisis completo de personalidades</p>
        </header>

        <div className="profiles-grid">
          {Object.entries(data.categorias).map(([categoria, info]) => (
            <div key={categoria} className="profile-card">
              <div className="profile-icon">🎭</div>
              <h3>{categoria}</h3>
              <p className="profile-name">{info.nombre}</p>
            </div>
          ))}
        </div>

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

export default TopProfilesViewer; 