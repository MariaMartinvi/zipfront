import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import lzString from 'lz-string';
import './Chatgptresultados.css'; // Reutilizamos los estilos existentes

function Juegos({ 
  headlinesGameData = null,     // Datos del juego de titulares (viene de ChatGPT response)
  topData = null,               // window.lastAnalysisTopData para juego de personalidades
  showHeadlinesGame = false,    // Control de visibilidad del juego de titulares
  showTopGame = false           // Control de visibilidad del juego de tops
}) {
  const { t } = useTranslation();
  
  // Estados para el juego de titulares
  const [showShareGameModal, setShowShareGameModal] = useState(false);
  const [gameUrl, setGameUrl] = useState('');
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);
  
  // Estados para el juego de personalidades
  const [personalityGameUrl, setPersonalityGameUrl] = useState('');
  const [showPersonalityModal, setShowPersonalityModal] = useState(false);
  const [showPersonalityCopiedMessage, setShowPersonalityCopiedMessage] = useState(false);

  // =================== FUNCIONES PARA JUEGO DE TITULARES ===================
  
  // Función para generar URL del juego de titulares
  const generateHeadlinesGameUrl = () => {
    try {
      if (!headlinesGameData) {
        alert("No hay datos de juego disponibles");
        return;
      }
      
      // Comprimir datos con LZ-String
      const compressedData = lzString.compressToEncodedURIComponent(JSON.stringify(headlinesGameData));
      
      // Crear URL del juego
      const url = `${window.location.origin}/headlines-game?h=${compressedData}`;
      
      setGameUrl(url);
      setShowShareGameModal(true);
      
    } catch (error) {
      console.error('Error generando URL del juego:', error);
      alert("Error al generar el enlace del juego");
    }
  };

  // Función para copiar al portapapeles (juego de titulares)
  const copyToClipboard = () => {
    navigator.clipboard.writeText(gameUrl).then(() => {
      setShowCopiedMessage(true);
      setTimeout(() => setShowCopiedMessage(false), 2000);
    }).catch(err => {
      console.error('Error al copiar:', err);
      // Fallback para navegadores que no soportan clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = gameUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setShowCopiedMessage(true);
      setTimeout(() => setShowCopiedMessage(false), 2000);
    });
  };

  // Función para compartir en WhatsApp (juego de titulares)
  const shareOnWhatsApp = () => {
    const message = t('share.whatsapp_message', '🎯 ¡Juego: ¿Quién es quién?!\n\n¿Puedes adivinar quién corresponde a cada titular polémico?\n\n👇 Juega aquí:\n{{url}}', { url: gameUrl });
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  // =================== FUNCIONES PARA JUEGO DE PERSONALIDADES ===================
  
  // Función para generar URL del juego de personalidades
  const generatePersonalityGameUrl = () => {
    try {
      // Usar topData pasado como prop o fallback a la variable global
      const data = topData || window.lastAnalysisTopData;
      
      if (!data || !data.categorias || !data.usuarios) {
        alert("No hay datos de análisis para compartir. Por favor, asegúrate de que el análisis estadístico esté completo.");
        return;
      }

      // Mapeo de categorías completas a códigos de una letra
      const catCodes = {
        'profesor': 'p', 'rollero': 'r', 'pistolero': 's', 'vampiro': 'v',
        'cafeconleche': 'c', 'dejaenvisto': 'd', 'narcicista': 'n', 
        'puntofinal': 'f', 'fosforo': 'o', 'menosesmas': 'm',
        'chismoso': 'h', 'happyflower': 'y', 'amoroso': 'a', 'sicopata': 'x',
        'comico': 'co', 'agradecido': 'ag', 'disculpon': 'di', 'curioso': 'cu'
      };
      
      // Obtener usuarios
      let users = [];
      if (Array.isArray(data.usuarios)) {
        users = data.usuarios;
      } else if (typeof data.usuarios === 'object') {
        users = Object.keys(data.usuarios);
      }
      
      // Crear array de nombres únicos para eliminar redundancia
      const names = [...new Set(
        Object.values(data.categorias)
          .filter(c => c && c.nombre)
          .map(c => c.nombre)
      )];
      
      // Crear pares [código, índice] para cada categoría
      const cats = [];
      Object.entries(catCodes).forEach(([cat, code]) => {
        if (data.categorias[cat]?.nombre) {
          const idx = names.indexOf(data.categorias[cat].nombre);
          if (idx >= 0) {
            cats.push([code, idx]);
          }
        }
      });
      
      // Estructura final: [usuarios, nombres, categorías]
      const result = [users, names, cats];
      
      // Comprimir con LZ-String
      const compressed = lzString.compressToEncodedURIComponent(JSON.stringify(result));
      
      // URL con parámetro z (más corto)
      const url = `${window.location.origin}/chat-game?z=${compressed}`;
      
      console.log("Datos del juego de personalidades generados:", result);
      
      // Actualizar estado y mostrar modal
      setPersonalityGameUrl(url);
      setShowPersonalityModal(true);
      
      return url;
    } catch (error) {
      console.error("Error generando URL del juego de personalidades:", error);
      alert("Error generando URL del juego de personalidades");
      return null;
    }
  };

  // Función para copiar URL del juego de personalidades al portapapeles
  const copyPersonalityToClipboard = () => {
    navigator.clipboard.writeText(personalityGameUrl)
      .then(() => {
        setShowPersonalityCopiedMessage(true);
        setTimeout(() => setShowPersonalityCopiedMessage(false), 2000);
      })
      .catch(err => {
        console.error("Error copiando al portapapeles:", err);
        // Fallback para navegadores que no soportan clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = personalityGameUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setShowPersonalityCopiedMessage(true);
        setTimeout(() => setShowPersonalityCopiedMessage(false), 2000);
      });
  };

  // Función para compartir juego de personalidades en WhatsApp
  const sharePersonalityOnWhatsApp = () => {
    const message = `¡Juega a adivinar quién es quién en nuestro chat de WhatsApp!\n\n${personalityGameUrl}\n\n🎮 Juego de adivinar personalidades`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  // =================== RENDERIZADO ===================
  
  // No mostrar nada si no hay juegos disponibles
  if (!showHeadlinesGame && !showTopGame) {
    return null;
  }

  return (
    <>
      {/* Sección de Juegos */}
      <h2 className="analysis-special-title">🎮 Juegos</h2>
      
      <div className="games-container">
        {/* Card 1: Juego de Titulares - Solo si está disponible */}
        {showHeadlinesGame && headlinesGameData && (
          <div className="game-card">
            <div className="game-icon">🎯</div>
            <div className="game-content">
              <span className="game-badge">JUEGO INTERACTIVO</span>
              <h3 className="game-title">¿Quién es quién?</h3>
              <p className="game-description">
                {t('share.game_description', 'Descubre quién corresponde a cada titular polémico')}
              </p>
              <button 
                className="game-button"
                onClick={generateHeadlinesGameUrl}
              >
                🚀 Compartir juego
              </button>
            </div>
          </div>
        )}

        {/* Card 2: Juego de Personalidades - Solo si está disponible */}
        {showTopGame && (topData || window.lastAnalysisTopData) && (
          <div className="game-card">
            <div className="game-icon">🎭</div>
            <div className="game-content">
              <span className="game-badge">JUEGO INTERACTIVO</span>
              <h3 className="game-title">¿Quién es más...?</h3>
              <p className="game-description">
                Comparte un juego para que tus amigos adivinen quién es el profesor, el vampiro y otras personalidades de tu chat.
              </p>
              <button 
                className="game-button"
                onClick={generatePersonalityGameUrl}
              >
                🚀 Compartir juego
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Modal para compartir juego de titulares */}
      {showShareGameModal && (
        <div className="share-game-modal">
          <div className="share-game-modal-content">
            <h3>{t('share.modal_title', 'Compartir Juego')}</h3>
            <p>{t('share.modal_description', 'Comparte este enlace con tus amigos para que puedan jugar:')}</p>
            <p className="warning-message">⚠️ Enlace sólo válido para este chat</p>
            
            <div className="game-url-container">
              <input 
                type="text" 
                value={gameUrl} 
                readOnly 
                onClick={(e) => e.target.select()}
              />
              <button onClick={copyToClipboard}>
                {t('share.copy_button', 'Copiar')}
              </button>
            </div>
            
            {showCopiedMessage && (
              <div className="copied-message">
                {t('share.copied_message', '¡Enlace copiado!')}
              </div>
            )}
            
            <div className="share-options">
              <button className="whatsapp-share" onClick={shareOnWhatsApp}>
                <span>WhatsApp</span>
                <span>📱</span>
              </button>
            </div>
            
            <button 
              className="close-modal-button"
              onClick={() => setShowShareGameModal(false)}
            >
              {t('share.close_button', 'Cerrar')}
            </button>
          </div>
        </div>
      )}

      {/* Modal para compartir juego de personalidades */}
      {showPersonalityModal && (
        <div className="share-game-modal">
          <div className="share-game-modal-content">
            <span className="close-modal" onClick={() => setShowPersonalityModal(false)}>&times;</span>
            <h3>¡Comparte el juego!</h3>
            <p>Envía este enlace a tus amigos para que adivinen quién es el profesor, el vampiro y demás personalidades del chat.</p>
            <p className="warning-message">⚠️ Enlace sólo válido para este chat</p>
            
            <div className="game-url-container">
              <input 
                type="text" 
                value={personalityGameUrl} 
                readOnly 
                onClick={(e) => e.target.select()} 
              />
              <button onClick={copyPersonalityToClipboard}>
                Copiar
              </button>
              {showPersonalityCopiedMessage && <div className="copied-message">¡Copiado!</div>}
            </div>
            
            <div className="share-options">
              <button className="whatsapp-share" onClick={sharePersonalityOnWhatsApp}>
                <span>WhatsApp</span>
                <span>📱</span>
              </button>
            </div>
            
            <button 
              className="close-modal-button"
              onClick={() => setShowPersonalityModal(false)}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default Juegos; 