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
  
  // Función para ver el juego de titulares directamente
  const viewHeadlinesGame = () => {
    try {
      if (!headlinesGameData) {
        alert(t('games.alerts.no_game_data'));
        return;
      }
      
      // NUEVO: Marcar que se está abriendo un juego para evitar falso deslogueo
      window.isOpeningGamePopup = true;
      
      console.log('[Juegos] Abriendo juego directamente - Datos originales:', headlinesGameData);
      console.log('[Juegos] lastNameMapping disponible:', window.lastNameMapping);
      
      // Crear una copia de los datos para procesar
      let processedData = JSON.parse(JSON.stringify(headlinesGameData));
      
      // Aplicar el mapeo de nombres si está disponible
      if (window.lastNameMapping && Object.keys(window.lastNameMapping).length > 0) {
        console.log('[Juegos] Aplicando mapeo de nombres para vista directa...');
        
        // Crear mapeo inverso (de iniciales a nombres completos)
        const inverseMapping = {};
        Object.entries(window.lastNameMapping).forEach(([fullName, initials]) => {
          inverseMapping[initials] = fullName;
        });
        
        // Aplicar mapeo a usuarios y headlines
        if (Array.isArray(processedData) && processedData.length >= 2) {
          let [usuarios, headlines] = processedData;
          
          // Convertir usuarios de iniciales a nombres completos
          usuarios = usuarios.map(user => inverseMapping[user] || user);
          
          // Convertir nombres en headlines
          if (Array.isArray(headlines)) {
            headlines = headlines.map(headline => ({
              ...headline,
              nombre: inverseMapping[headline.nombre] || headline.nombre
            }));
          }
          
          processedData = [usuarios, headlines];
          console.log('[Juegos] Datos procesados para vista directa:', processedData);
        }
      }
      
      // Comprimir datos procesados con LZ-String
      const compressedData = lzString.compressToEncodedURIComponent(JSON.stringify(processedData));
      
      // Crear URL del juego y abrirla en popup a pantalla completa
      const url = `${window.location.origin}/headlines-game?h=${compressedData}`;
      
      // Configuración del popup a pantalla completa
      const popupFeatures = `
        fullscreen=yes,
        toolbar=no,
        location=no,
        directories=no,
        status=no,
        menubar=no,
        scrollbars=yes,
        resizable=yes,
        width=${window.screen.width},
        height=${window.screen.height},
        top=0,
        left=0
      `.replace(/\s/g, '');
      
      window.open(url, '_blank', popupFeatures);
      
      // NUEVO: Limpiar la flag después de un delay para permitir que la ventana se abra
      setTimeout(() => {
        window.isOpeningGamePopup = false;
        console.log('[Juegos] Flag de apertura de juego limpiada');
      }, 5000);
      
    } catch (error) {
      console.error('Error abriendo el juego:', error);
      alert(t('games.alerts.generate_error'));
      // NUEVO: Limpiar flag en caso de error
      window.isOpeningGamePopup = false;
    }
  };

  // Función para generar URL del juego de titulares
  const generateHeadlinesGameUrl = () => {
    try {
      if (!headlinesGameData) {
        alert(t('games.alerts.no_game_data'));
        return;
      }
      
      console.log('[Juegos] Datos originales del juego de titulares:', headlinesGameData);
      console.log('[Juegos] lastNameMapping disponible:', window.lastNameMapping);
      
      // Crear una copia de los datos para procesar
      let processedData = JSON.parse(JSON.stringify(headlinesGameData));
      
      // Aplicar el mapeo de nombres si está disponible
      if (window.lastNameMapping && Object.keys(window.lastNameMapping).length > 0) {
        console.log('[Juegos] Aplicando mapeo de nombres...');
        
        // Crear mapeo inverso (de iniciales a nombres completos)
        const inverseMapping = {};
        Object.entries(window.lastNameMapping).forEach(([fullName, initials]) => {
          inverseMapping[initials] = fullName;
        });
        
        console.log('[Juegos] Mapeo inverso:', inverseMapping);
        
        // Aplicar mapeo a usuarios (primera posición del array)
        if (Array.isArray(processedData) && processedData.length >= 2) {
          let [usuarios, headlines] = processedData;
          
          // Convertir usuarios de iniciales a nombres completos
          usuarios = usuarios.map(user => {
            const mappedName = inverseMapping[user] || user;
            console.log(`[Juegos] Usuario: ${user} -> ${mappedName}`);
            return mappedName;
          });
          
          // Convertir nombres en headlines
          if (Array.isArray(headlines)) {
            headlines = headlines.map(headline => {
              const mappedName = inverseMapping[headline.nombre] || headline.nombre;
              console.log(`[Juegos] Headline nombre: ${headline.nombre} -> ${mappedName}`);
              return {
                ...headline,
                nombre: mappedName
              };
            });
          }
          
          processedData = [usuarios, headlines];
          console.log('[Juegos] Datos procesados con nombres reales:', processedData);
        }
      } else {
        console.log('[Juegos] No hay mapeo de nombres disponible, usando datos originales');
      }
      
      // Comprimir datos procesados con LZ-String
      const compressedData = lzString.compressToEncodedURIComponent(JSON.stringify(processedData));
      
      // Crear URL del juego
      const url = `${window.location.origin}/headlines-game?h=${compressedData}`;
      
      console.log('[Juegos] URL generada:', url);
      setGameUrl(url);
      setShowShareGameModal(true);
      
    } catch (error) {
      console.error('Error generando URL del juego:', error);
      alert(t('games.alerts.generate_error'));
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
    console.log('🚀 shareOnWhatsApp (Headlines) - Iniciando compartir en WhatsApp');
    
    // DETECCIÓN DE WEBVIEW ANDROID
    const isAndroidWebView = /Android.*wv\)|; wv\)/i.test(navigator.userAgent) || 
                             window.Android !== undefined ||
                             typeof window.ReactNativeWebView !== 'undefined';
    
    console.log('📱 Es Android WebView:', isAndroidWebView);
    
    const message = t('share.whatsapp_message', '🎯 ¡Juego: ¿Quién es quién?!\n\n¿Puedes adivinar quién corresponde a cada titular polémico?\n\n👇 Juega aquí:\n{{url}}', { url: gameUrl });
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    
    console.log('📝 URL generada:', whatsappUrl);
    
    try {
      window.open(whatsappUrl, '_blank');
      console.log('✅ Compartido exitosamente');
    } catch (error) {
      console.error('❌ Error al compartir:', error);
      // Fallback: copiar al portapapeles
      navigator.clipboard.writeText(`${message}\n\nCompartir: ${whatsappUrl}`)
        .then(() => {
          alert(t('messages.copied_to_clipboard', 'Copiado al portapapeles. Pega el mensaje en WhatsApp.'));
        })
        .catch(() => {
          alert(t('messages.error', 'Error al compartir. Intenta copiar manualmente.'));
        });
    }
  };

  // =================== FUNCIONES PARA JUEGO DE PERSONALIDADES ===================
  
  // Función para ver el juego de personalidades directamente
  const viewPersonalityGame = () => {
    try {
      // Usar topData pasado como prop o fallback a la variable global
      const data = topData || window.lastAnalysisTopData;
      
      if (!data || !data.categorias || !data.usuarios) {
        alert(t('games.alerts.no_analysis_data'));
        return;
      }

      // NUEVO: Marcar que se está abriendo un juego para evitar falso deslogueo
      window.isOpeningGamePopup = true;

      // Mapeo de categorías completas a códigos de una letra
      const catCodes = {
        'profesor': 'p', 'rollero': 'r', 'pistolero': 's', 'vampiro': 'v',
        'cafeconleche': 'c', 'dejaenvisto': 'd', 'narcicista': 'n', 
        'puntofinal': 'f', 'fosforo': 'o', 'menosesmas': 'm',
        'chismoso': 'h', 'happyflower': 'y', 'amoroso': 'a', 'bombardero': 'x',
        'comico': 'co', 'agradecido': 'ag', 'disculpon': 'di', 'curioso': 'cu',
        'mala_influencia': 'mi'
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
      
      // URL con parámetro z y abrirla en popup a pantalla completa
      const url = `${window.location.origin}/chat-game?z=${compressed}`;
      
      // Configuración del popup a pantalla completa
      const popupFeatures = `
        fullscreen=yes,
        toolbar=no,
        location=no,
        directories=no,
        status=no,
        menubar=no,
        scrollbars=yes,
        resizable=yes,
        width=${window.screen.width},
        height=${window.screen.height},
        top=0,
        left=0
      `.replace(/\s/g, '');
      
      window.open(url, '_blank', popupFeatures);
      
      // NUEVO: Limpiar la flag después de un delay para permitir que la ventana se abra
      setTimeout(() => {
        window.isOpeningGamePopup = false;
        console.log('[Juegos] Flag de apertura de juego de personalidades limpiada');
      }, 5000);
      
    } catch (error) {
      console.error("Error abriendo el juego de personalidades:", error);
      alert(t('games.alerts.personality_error'));
      // NUEVO: Limpiar flag en caso de error
      window.isOpeningGamePopup = false;
    }
  };
  
  // Función para generar URL del juego de personalidades
  const generatePersonalityGameUrl = () => {
    try {
      // Usar topData pasado como prop o fallback a la variable global
      const data = topData || window.lastAnalysisTopData;
      
      if (!data || !data.categorias || !data.usuarios) {
        alert(t('games.alerts.no_analysis_data'));
        return;
      }

      // Mapeo de categorías completas a códigos de una letra
      const catCodes = {
        'profesor': 'p', 'rollero': 'r', 'pistolero': 's', 'vampiro': 'v',
        'cafeconleche': 'c', 'dejaenvisto': 'd', 'narcicista': 'n', 
        'puntofinal': 'f', 'fosforo': 'o', 'menosesmas': 'm',
        'chismoso': 'h', 'happyflower': 'y', 'amoroso': 'a', 'bombardero': 'x',
        'comico': 'co', 'agradecido': 'ag', 'disculpon': 'di', 'curioso': 'cu',
        'mala_influencia': 'mi'
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
      alert(t('games.alerts.personality_error'));
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
    console.log('🚀 sharePersonalityOnWhatsApp - Iniciando compartir en WhatsApp');
    
    // DETECCIÓN DE WEBVIEW ANDROID
    const isAndroidWebView = /Android.*wv\)|; wv\)/i.test(navigator.userAgent) || 
                             window.Android !== undefined ||
                             typeof window.ReactNativeWebView !== 'undefined';
    
    console.log('📱 Es Android WebView:', isAndroidWebView);
    console.log('🔍 navigator.userAgent:', navigator.userAgent);
    console.log('🔍 personalityGameUrl:', personalityGameUrl);
    
    const message = t('share.personality_whatsapp_message', '🎭 ¡Juega a adivinar quién es quién en nuestro chat de WhatsApp!\n\n{{url}}\n\n🎮 Juego de adivinar personalidades', { url: personalityGameUrl });
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    
    console.log('📝 URL generada:', whatsappUrl);
    console.log('📝 Mensaje completo:', message);
    
    try {
      window.open(whatsappUrl, '_blank');
      console.log('✅ Compartido exitosamente');
    } catch (error) {
      console.error('❌ Error al compartir:', error);
      // Fallback: copiar al portapapeles
      navigator.clipboard.writeText(`${message}\n\nCompartir: ${whatsappUrl}`)
        .then(() => {
          alert(t('messages.copied_to_clipboard', 'Copiado al portapapeles. Pega el mensaje en WhatsApp.'));
        })
        .catch(() => {
          alert(t('messages.error', 'Error al compartir. Intenta copiar manualmente.'));
        });
    }
  };

  // =================== RENDERIZADO ===================
  
  // No mostrar nada si no hay juegos disponibles
  if (!showHeadlinesGame && !showTopGame) {
    return null;
  }

  return (
    <>
      {/* Sección de Juegos */}
      <h2 className="analysis-special-title">{t('games.title')}</h2>
      
      <div className="games-container">
        {/* Card 1: Juego de Titulares - Solo si está disponible */}
        {showHeadlinesGame && headlinesGameData && (
          <div className="game-card">
            <div className="game-icon">🎯</div>
            <div className="game-content">
              <span className="game-badge">{t('games.badge')}</span>
              <h3 className="game-title">{t('games.headlines.title')}</h3>
              <p className="game-description">
                {t('games.headlines.description')}
              </p>
              <div className="game-buttons">
                <span 
                  className="game-link"
                  onClick={viewHeadlinesGame}
                >
                  {t('games.view_button', 'Ver juego')}
                </span>
                <button 
                  className="game-button"
                  onClick={generateHeadlinesGameUrl}
                >
                  {t('games.share_button')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Card 2: Juego de Personalidades - Solo si está disponible */}
        {showTopGame && (topData || window.lastAnalysisTopData) && (
          <div className="game-card">
            <div className="game-icon">🎭</div>
            <div className="game-content">
              <span className="game-badge">{t('games.badge')}</span>
              <h3 className="game-title">{t('games.personality.title')}</h3>
              <p className="game-description">
                {t('games.personality.description')}
              </p>
              <div className="game-buttons">
                <span 
                  className="game-link"
                  onClick={viewPersonalityGame}
                >
                  {t('games.view_button', 'Ver juego')}
                </span>
                <button 
                  className="game-button"
                  onClick={generatePersonalityGameUrl}
                >
                  {t('games.share_button')}
                </button>
              </div>
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
            <p className="warning-message">{t('games.share_modal.warning')}</p>
            
            <div className="game-url-container">
              <input 
                type="text" 
                value={gameUrl} 
                readOnly 
                onClick={(e) => e.target.select()}
              />
              <button onClick={copyToClipboard}>
                {t('games.share_modal.copy_button')}
              </button>
            </div>
            
            {showCopiedMessage && (
              <div className="copied-message">
                {t('games.share_modal.copied_message')}
              </div>
            )}
            
            <div className="share-options">
              <button className="whatsapp-share" onClick={shareOnWhatsApp}>
                <span>{t('games.share_modal.whatsapp')}</span>
                <span>📱</span>
              </button>
            </div>
            
            <button 
              className="close-modal-button"
              onClick={() => setShowShareGameModal(false)}
            >
              {t('games.share_modal.close_button')}
            </button>
          </div>
        </div>
      )}

      {/* Modal para compartir juego de personalidades */}
      {showPersonalityModal && (
        <div className="share-game-modal">
          <div className="share-game-modal-content">
            <span className="close-modal" onClick={() => setShowPersonalityModal(false)}>&times;</span>
            <h3>{t('games.share_modal.title')}</h3>
            <p>{t('games.share_modal.description')}</p>
            <p className="warning-message">{t('games.share_modal.warning')}</p>
            
            <div className="game-url-container">
              <input 
                type="text" 
                value={personalityGameUrl} 
                readOnly 
                onClick={(e) => e.target.select()} 
              />
              <button onClick={copyPersonalityToClipboard}>
                {t('games.share_modal.copy_button')}
              </button>
              {showPersonalityCopiedMessage && <div className="copied-message">{t('games.share_modal.copied_message')}</div>}
            </div>
            
            <div className="share-options">
              <button className="whatsapp-share" onClick={sharePersonalityOnWhatsApp}>
                <span>{t('games.share_modal.whatsapp')}</span>
                <span>📱</span>
              </button>
            </div>
            
            <button 
              className="close-modal-button"
              onClick={() => setShowPersonalityModal(false)}
            >
              {t('games.share_modal.close_button')}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default Juegos; 