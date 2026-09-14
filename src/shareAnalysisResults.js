import React from 'react';

// NUEVA FUNCIÓN: Filtrar datos del juego del HTML
const removeGameDataFromHTML = (htmlContent) => {
  try {
    let cleanedContent = htmlContent;
    
    // Remover sección completa de Titulares/Headlines con datos del juego
    cleanedContent = cleanedContent.replace(
      /<h2[^>]*>.*?💡.*?[Tt]itulares.*?<\/h2>[\s\S]*?(?=<h2|$)/gi,
      ''
    );
    
    // Remover subsecciones de datos del juego específicamente
    cleanedContent = cleanedContent.replace(
      /<div[^>]*class="[^"]*game-data-section[^"]*"[^>]*>[\s\S]*?<\/div>/gi,
      ''
    );
    
    // Remover cualquier contenido que mencione "GAME_DATA" o datos específicos del juego
    cleanedContent = cleanedContent.replace(
      /GAME_DATA:[\s\S]*?(?=\n\n|\n##|$)/gi,
      ''
    );
    
    // Remover solo líneas que contengan nombres específicos del juego seguidos de dos puntos
    // Ser más específico para no eliminar perfiles reales del análisis
    cleanedContent = cleanedContent.replace(
      /<p><strong>(Usuario\s*\d+|Participante\s*\d+|Player\s*\d+|Jugador\s*\d+):<\/strong>\s*[^<]*<\/p>/gi,
      ''
    );
    
    // Remover divs con clase game-data-display
    cleanedContent = cleanedContent.replace(
      /<div[^>]*class="[^"]*game-data-display[^"]*"[^>]*>[\s\S]*?<\/div>/gi,
      ''
    );
    
    // Limpiar espacios en blanco y líneas vacías extra
    cleanedContent = cleanedContent.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    return cleanedContent;
  } catch (error) {
    console.error('Error filtrando datos del juego:', error);
    return htmlContent; // Devolver contenido original si hay error
  }
};

// Función para generar HTML standalone del análisis completo
export const generateAnalysisHTML = (htmlContent, t, currentLanguage = 'es') => {
  const titleText = t('hero.share_analysis.html_title', 'Análisis psicológico completo de conversaciones');
  
  // NUEVO: Limpiar datos del juego antes de procesar
  const cleanedContent = removeGameDataFromHTML(htmlContent);
  
  // Extraer el texto limpio para el resumen
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = cleanedContent;
  
  // Buscar secciones principales
  const sections = [];
  const h2Elements = tempDiv.querySelectorAll('h2');
  h2Elements.forEach(h2 => {
    sections.push(h2.textContent.trim());
  });

  // Obtener dirección del idioma para CSS
  const isRTL = currentLanguage === 'ar' || currentLanguage === 'he';
  const direction = isRTL ? 'rtl' : 'ltr';

  return `<!DOCTYPE html>
<html lang="${currentLanguage}" dir="${direction}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${titleText} - ChatSalsa</title>
  <style>
    /* Reset y fuentes */
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      line-height: 1.6;
      color: #333;
      direction: ${direction};
    }

    /* Contenedor principal */
    .main-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }

    /* Header compacto */
    .header {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 20px 20px 0 0;
    }
    .header h1 { font-size: 2.2em; margin: 0 0 8px 0; }
    .header p { margin: 5px 0; opacity: 0.9; }
    .header div { font-size: 0.9em; margin-top: 10px; opacity: 0.8; }

    /* Contenido principal */
    .content {
      background: white;
      padding: 40px;
      border-radius: 0 0 20px 20px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    }

    /* Estilos para el análisis */
    .chat-analysis-container h2 {
      color: #2c3e50;
      font-size: 1.8em;
      margin: 30px 0 20px 0;
      padding-bottom: 10px;
      border-bottom: 3px solid #667eea;
    }

    .chat-analysis-container h3 {
      color: #34495e;
      font-size: 1.3em;
      margin: 20px 0 10px 0;
    }

    .chat-analysis-container h4 {
      color: #2c3e50;
      font-size: 1.1em;
      margin: 15px 0 8px 0;
    }

    .chat-analysis-container p {
      margin: 10px 0;
      line-height: 1.6;
    }

    .chat-analysis-container ul, .chat-analysis-container ol {
      margin: 10px 0 10px 20px;
    }

    .chat-analysis-container li {
      margin: 5px 0;
    }

    .chat-analysis-container strong {
      color: #2c3e50;
      font-weight: 600;
    }

    /* Estilos para psychology items */
    .psychology-list {
      display: flex;
      flex-direction: column;
      gap: 20px;
      margin: 20px 0;
    }

    .psychology-item {
      display: flex;
      gap: 15px;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 15px;
      border-left: 4px solid #667eea;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      transition: transform 0.3s ease;
    }

    .psychology-item:hover {
      transform: translateY(-2px);
    }

    .avatar {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 1.2em;
      flex-shrink: 0;
    }

    .green-avatar { background: linear-gradient(135deg, #27ae60, #2ecc71); }
    .purple-avatar { background: linear-gradient(135deg, #8e44ad, #9b59b6); }
    .pink-avatar { background: linear-gradient(135deg, #e91e63, #f06292); }
    .blue-avatar { background: linear-gradient(135deg, #3498db, #5dade2); }
    .orange-avatar { background: linear-gradient(135deg, #f39c12, #f5b041); }
    .teal-avatar { background: linear-gradient(135deg, #16a085, #48c9b0); }
    .yellow-avatar { background: linear-gradient(135deg, #f1c40f, #f4d03f); }

    .psychology-content {
      flex: 1;
    }

    .psychology-content h4 {
      font-size: 1.3em;
      color: #2c3e50;
      margin-bottom: 10px;
    }

    .psychology-content p {
      margin-bottom: 15px;
      color: #5a6c7d;
    }

    .psychology-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .tag {
      padding: 5px 12px;
      border-radius: 20px;
      font-size: 0.85em;
      font-weight: 500;
      color: white;
    }

    .tag.green { background: linear-gradient(135deg, #27ae60, #2ecc71); }
    .tag.purple { background: linear-gradient(135deg, #8e44ad, #9b59b6); }
    .tag.pink { background: linear-gradient(135deg, #e91e63, #f06292); }
    .tag.blue { background: linear-gradient(135deg, #3498db, #5dade2); }
    .tag.orange { background: linear-gradient(135deg, #f39c12, #f5b041); }
    .tag.teal { background: linear-gradient(135deg, #16a085, #48c9b0); }
    .tag.yellow { background: linear-gradient(135deg, #f1c40f, #f4d03f); }
    .tag.red { background: linear-gradient(135deg, #e74c3c, #f1948a); }

    /* Subsecciones modernas */
    .subsection-item {
      margin: 20px 0;
      border-radius: 15px;
      overflow: hidden;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    }

    .subsection-header {
      padding: 15px 20px;
      color: white;
      font-weight: 600;
    }

    .alert-section .subsection-header {
      background: linear-gradient(135deg, #e74c3c, #f39c12);
    }

    .evaluation-section .subsection-header {
      background: linear-gradient(135deg, #8e44ad, #3498db);
    }

    .recommendations-section .subsection-header {
      background: linear-gradient(135deg, #27ae60, #2ecc71);
    }

    .game-data-section .subsection-header {
      background: linear-gradient(135deg, #667eea, #764ba2);
    }

    .subsection-header h4 {
      margin: 0;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .subsection-icon {
      font-size: 1.2em;
    }

    .subsection-content {
      padding: 20px;
      background: white;
    }

    .subsection-content p {
      margin: 10px 0;
    }

    .subsection-content ul {
      margin: 10px 0;
      padding-left: 20px;
    }

    .subsection-content li {
      margin: 5px 0;
    }

    /* Footer */
    .footer {
      background: #2c3e50;
      color: white;
      padding: 30px;
      text-align: center;
      margin-top: 30px;
      border-radius: 20px;
    }

    .footer h3 { margin: 0 0 10px 0; }
    .footer p { margin: 10px 0 20px 0; opacity: 0.9; }
    .cta {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      padding: 15px 30px;
      border-radius: 50px;
      text-decoration: none;
      display: inline-block;
      font-weight: 600;
      transition: transform 0.3s ease;
    }
    .cta:hover { transform: translateY(-2px); }

    /* Responsive */
    @media (max-width: 768px) {
      .main-container { padding: 10px; }
      .header { padding: 20px 15px; }
      .header h1 { font-size: 1.8em; }
      .content { padding: 25px 15px; }
      .psychology-item { 
        flex-direction: column; 
        text-align: center; 
        gap: 10px; 
      }
      .avatar {
        align-self: center;
      }
      .psychology-tags {
        justify-content: center;
      }
      .subsection-content {
        padding: 15px;
      }
    }
  </style>
</head>
<body>
  <div class="main-container">
    <div class="header">
      <h1>🧠 ${titleText}</h1>
      <p>${t('hero.share_analysis.description', 'Comparte tu análisis psicológico completo')}</p>
      <div>${t('hero.share_analysis.generated_with', 'Generado con ChatSalsa')}</div>
    </div>
    
    <div class="content">
      <div class="chat-analysis-container">
        ${cleanedContent}
      </div>
    </div>

    <div class="footer">
      <h3>${t('hero.share_analysis.footer_title', '¿Te gustó este análisis?')}</h3>
      <p>${t('hero.share_analysis.footer_description', 'Descubre más insights de tus conversaciones de WhatsApp')}</p>
      <a href="https://chatsalsa.com" class="cta">${t('hero.share_analysis.footer_cta', '🚀 Analizar Nuevo Chat Gratis')}</a>
    </div>
  </div>
</body>
</html>`;
};

// NUEVA FUNCIÓN: Extraer datos del análisis para la imagen
const extractAnalysisDataForImage = (htmlContent) => {
  try {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    // Extraer perfiles de personalidad
    const profiles = [];
    const psychologyItems = tempDiv.querySelectorAll('.psychology-item');
    
    psychologyItems.forEach((item, index) => {
      if (index < 3) { // Máximo 3 perfiles
        const nameElement = item.querySelector('h4');
        const tagsElements = item.querySelectorAll('.tag');
        
        if (nameElement) {
          const name = nameElement.textContent.trim();
          const tags = Array.from(tagsElements).map(tag => 
            tag.textContent.trim()
          ).slice(0, 2); // Máximo 2 tags por persona
          
          if (name && tags.length > 0) {
            profiles.push({ name, tags });
          }
        }
      }
    });
    
    // Extraer señales de alerta (tags rojos)
    const alertTags = [];
    const redTags = tempDiv.querySelectorAll('.tag.red, .alert-section .tag');
    
    redTags.forEach(tag => {
      const tagText = tag.textContent.trim();
      if (tagText && !alertTags.includes(tagText) && alertTags.length < 4) {
        alertTags.push(tagText);
      }
    });
    
    // Si no hay tags rojos específicos, buscar texto en negrita rojo de la sección de alertas
    if (alertTags.length === 0) {
      const alertSection = tempDiv.querySelector('.alert-section');
      if (alertSection) {
        const boldRedTexts = alertSection.querySelectorAll('strong[style*="color: #dc3545"]');
        boldRedTexts.forEach(element => {
          const text = element.textContent.trim();
          if (text && !alertTags.includes(text) && alertTags.length < 4) {
            alertTags.push(text);
          }
        });
      }
    }
    
    return { profiles, alertTags };
  } catch (error) {
    console.error('Error extrayendo datos del análisis:', error);
    return { profiles: [], alertTags: [] };
  }
};

// Función para generar imagen promocional del análisis
export const generateAnalysisImage = async (htmlContent, t, currentLanguage = 'es') => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = 1080;
    canvas.height = 1080;
    
    // Extraer datos reales del análisis
    const { profiles, alertTags } = extractAnalysisDataForImage(htmlContent);
    
    // Fondo degradado moderno - más sutil
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(0.5, '#764ba2');
    gradient.addColorStop(1, '#667eea');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Elementos decorativos de fondo (círculos sutiles)
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(150, 150, 80, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(930, 200, 60, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(200, 900, 100, 0, 2 * Math.PI);
    ctx.fill();
    ctx.globalAlpha = 1;
    
    let currentY = 50; // Empezar más arriba sin título
    
    // SECCIÓN DE PERFILES - Diseño moderno inspirado en AppPreview
    if (profiles.length > 0) {
      currentY += 30;
      
      // Mostrar cada perfil con diseño moderno tipo card - MÁS GRANDES
      profiles.slice(0, 3).forEach((profile, index) => {
        // Card del perfil con bordes redondeados - MÁS ALTA
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.beginPath();
        ctx.roundRect(95, currentY + 5, 880, 200, 20); // Aumentado de 150 a 200
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.beginPath();
        ctx.roundRect(90, currentY, 880, 195, 20); // Aumentado de 145 a 195
        ctx.fill();
        
        // Avatar circular con bordes redondeados - MÁS GRANDE
        const avatarColors = ['#22c55e', '#a855f7', '#f59e0b'];
        ctx.fillStyle = avatarColors[index % 3];
        ctx.beginPath();
        ctx.roundRect(120, currentY + 35, 120, 120, 60); // Aumentado de 80x80 a 120x120
        ctx.fill();
        
        // Inicial en el avatar - MÁS GRANDE
        ctx.fillStyle = 'white';
        ctx.font = 'bold 80px -apple-system, BlinkMacSystemFont, Arial'; // Aumentado de 64px
        ctx.textAlign = 'center';
        const inicial = profile.name.charAt(0).toUpperCase();
        ctx.fillText(inicial, 180, currentY + 115); // Ajustado posición
        
        // Nombre del perfil - MÁS PEQUEÑO
        ctx.fillStyle = '#1f2937';
        ctx.font = 'bold 70px -apple-system, BlinkMacSystemFont, Arial'; // Reducido de 90px a 70px
        ctx.textAlign = 'left';
        ctx.fillText(profile.name, 270, currentY + 70); // Ajustado posición
        
        // Tags del perfil - MÁS GRANDES
        ctx.font = 'bold 60px -apple-system, BlinkMacSystemFont, Arial'; // Aumentado de 48px
        let tagX = 270;
        const tagY = currentY + 130; // Ajustado posición
        
        for (let tagIndex = 0; tagIndex < Math.min(profile.tags.length, 3); tagIndex++) { // Reducido a 3 tags
          const tag = profile.tags[tagIndex];
          
          // Medir texto para el ancho del tag
          const tagWidth = ctx.measureText(tag).width + 40; // Más padding
          
          // Verificar si hay espacio en la línea actual
          if (tagX + tagWidth > 850 && tagIndex > 0) {
            break; // Salir del bucle si no hay más espacio
          }
          
          // Fondo del tag tipo pill con bordes redondeados - MÁS ALTO
          ctx.fillStyle = avatarColors[index % 3];
          ctx.globalAlpha = 0.15;
          ctx.beginPath();
          ctx.roundRect(tagX, tagY, tagWidth, 50, 25); // Aumentado de 32 a 50
          ctx.fill();
          ctx.globalAlpha = 1;
          
          // Texto del tag
          ctx.fillStyle = avatarColors[index % 3];
          ctx.fillText(tag, tagX + 20, tagY + 38); // Ajustado posición
          
          tagX += tagWidth + 20;
        }
        
        currentY += 220; // Más espacio entre cards (era 170)
      });
    }
    
    // SEÑALES DE ALERTA - Solo una, más grande
    if (alertTags.length > 0) {
      currentY += 30;
      
      // Card de alertas con diseño moderno y bordes redondeados - MÁS COMPACTA
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.beginPath();
      ctx.roundRect(100, currentY + 5, 880, 100, 20); // Reducido de 160 a 100
      ctx.fill();
      
      ctx.fillStyle = 'rgba(248, 113, 113, 0.95)'; // Fondo rojo suave
      ctx.beginPath();
      ctx.roundRect(95, currentY, 880, 95, 20); // Reducido de 155 a 95
      ctx.fill();
      
      // Una sola alerta, texto MÁS GRANDE
      ctx.font = 'bold 48px -apple-system, BlinkMacSystemFont, Arial'; // Aumentado de 36px a 48px
      const alert = alertTags[0]; // Solo la primera alerta
      const alertWidth = ctx.measureText(`🚩 ${alert}`).width + 50; // Más padding
      const alertX = (canvas.width - alertWidth) / 2; // Centrado
      const alertY = currentY + 30;
      
      // Fondo del tag de alerta con bordes redondeados - MÁS ALTO
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.beginPath();
      ctx.roundRect(alertX, alertY, alertWidth, 55, 27); // Más alto: 55px
      ctx.fill();
      
      // Texto de la alerta - MÁS GRANDE
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.fillText(`🚩 ${alert}`, canvas.width / 2, alertY + 38);
      
      currentY += 120; // Reducido espacio
    }
    
    // Call to action - Arreglado para que no se corte
    currentY += 40;
    
    // Badge para CTA - MÁS ANCHO para que no se corte
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.roundRect(80, currentY, 920, 120, 20); // Más ancho: de 840 a 920
    ctx.fill();
    
    ctx.font = 'bold 40px -apple-system, BlinkMacSystemFont, Arial'; // Ligeramente más grande
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.textAlign = 'center';
    ctx.fillText(t('hero.share_analysis.image_cta', '🚀 Analiza tus chats con'), canvas.width / 2, currentY + 45);
    
    ctx.font = 'bold 52px -apple-system, BlinkMacSystemFont, Arial'; // Ligeramente más grande
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(t('hero.share_analysis.brand_name', 'CHATSALSA'), canvas.width / 2, currentY + 95);
    
    canvas.toBlob(resolve, 'image/png', 0.9);
  });
};

// Función para comprimir datos de análisis psicológico
const compressAnalysisData = (htmlContent, currentLanguage) => {
  try {
    // Extraer datos reales del análisis para comprimir
    const { profiles, alertTags } = extractAnalysisDataForImage(htmlContent);
    
    // Crear objeto con solo los datos necesarios
    const dataToCompress = {
      profiles: profiles.slice(0, 3), // Solo primeros 3 perfiles
      alertTags: alertTags.slice(0, 3), // Solo primeras 3 alertas
      lang: currentLanguage,
      timestamp: Date.now()
    };
    
    // Comprimir datos usando btoa (base64)
    const jsonString = JSON.stringify(dataToCompress);
    const compressed = btoa(encodeURIComponent(jsonString));
    
    return compressed;
  } catch (error) {
    console.error('Error comprimiendo datos de análisis:', error);
    return null;
  }
};

// NUEVA FUNCIÓN: Extraer texto plano del análisis HTML
const extractPlainTextFromAnalysis = (htmlContent) => {
  try {
    // Crear div temporal para procesar el HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    // Remover elementos innecesarios (scripts, styles, etc.)
    const unwantedElements = tempDiv.querySelectorAll('script, style, .game-data-section, .game-data-display');
    unwantedElements.forEach(el => el.remove());
    
    // Extraer texto limpio
    let cleanText = tempDiv.innerText || tempDiv.textContent || '';
    
    // Limpiar espacios extra y líneas vacías
    cleanText = cleanText
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Máximo 2 líneas vacías consecutivas
      .replace(/[ \t]+/g, ' ') // Espacios múltiples en uno
      .trim();
    
    return cleanText;
  } catch (error) {
    console.error('Error extrayendo texto plano:', error);
    return '';
  }
};

// Función principal para compartir análisis
export const shareAnalysisResults = async (htmlContent, t, currentLanguage = 'es') => {
  console.log('🚀 INICIANDO shareAnalysisResults - navigator.share disponible:', !!navigator.share);
  
  // DETECCIÓN DE WEBVIEW ANDROID
  const isAndroidWebView = /Android.*wv\)|; wv\)/i.test(navigator.userAgent) || 
                           window.Android !== undefined ||
                           typeof window.ReactNativeWebView !== 'undefined';
  
  console.log('📱 Es Android WebView:', isAndroidWebView);
  
  console.log('🔍 navigator.userAgent:', navigator.userAgent);
  console.log('🔍 window.Android:', typeof window.Android);
  
  try {
    if (navigator.share) {
      // DETECCIÓN ADAPTATIVA: Desktop vs Móvil (como en shareTopProfiles.js)
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      console.log('🔥 Compartiendo con detección adaptativa');
      console.log('📱 Es móvil:', isMobile);
      
      // ESTRATEGIA 1: TEXTO COMPLETO + URL (SIN IMAGEN)
      const textoAnalisis = extractPlainTextFromAnalysis(htmlContent);
      const urlGenerica = `https://chatsalsa.com?lang=${currentLanguage}&utm_source=share&utm_medium=social`;
      
       // DEBUG: Verificar función t y idioma actual
       console.log('🔍 DEBUG - Función t disponible:', !!t);
       console.log('🔍 DEBUG - Idioma actual:', currentLanguage);
       
                    const mensajeIntro = t ? 
         t('hero.share_analysis.enthusiastic_message') :
         '';
       
       const mensajeCierre = t ?
         t('hero.share_analysis.closing_cta') :
         '';
         
       // DEBUG: Verificar qué traducciones se obtuvieron
       console.log('🔍 DEBUG - Mensaje intro obtenido:', mensajeIntro);
       console.log('🔍 DEBUG - Mensaje cierre obtenido:', mensajeCierre);
       
       console.log('📝 Intentando compartir TEXTO COMPLETO (sin imagen)');
       console.log('📊 Longitud del texto:', textoAnalisis.length);
       console.log('🔍 DEBUG - Función t disponible:', !!t);
       console.log('🔍 DEBUG - Idioma actual:', currentLanguage);
       console.log('🔍 DEBUG - Tipo de función t:', typeof t);
       
       // Probar directamente las claves de traducción
       if (t) {
         console.log('🔍 DEBUG - Probando clave hero.share_analysis.title:', t('hero.share_analysis.title'));
         console.log('🔍 DEBUG - Probando clave hero.share_analysis.enthusiastic_message:', t('hero.share_analysis.enthusiastic_message'));
         console.log('🔍 DEBUG - Probando clave hero.share_analysis.closing_cta:', t('hero.share_analysis.closing_cta'));
       }
       
       console.log('🔍 DEBUG - Mensaje intro obtenido:', mensajeIntro);
       console.log('🔍 DEBUG - Mensaje cierre obtenido:', mensajeCierre);
       
       try {
         if (isMobile) {
           // MÓVIL: text + url separados (URL visible)
           console.log('📱 Estrategia móvil: text + url');
           
           const textoFinal = `${mensajeIntro}\n\n${textoAnalisis}\n\n${mensajeCierre}`;
           console.log('🔍 DEBUG - Texto final a compartir:', textoFinal);
           console.log('🔍 DEBUG - Longitud texto final:', textoFinal.length);
           console.log('🔍 DEBUG - URL a compartir:', urlGenerica);
           
           await navigator.share({
             text: textoFinal,
             url: urlGenerica
           });
         } else {
           // DESKTOP: text con URL incluida
           console.log('🖥️ Estrategia desktop: text con URL incluida');
           
           const textoFinalDesktop = `${mensajeIntro}\n\n${textoAnalisis}\n\n${mensajeCierre} ${urlGenerica}`;
           console.log('🔍 DEBUG - Texto final desktop:', textoFinalDesktop);
           console.log('🔍 DEBUG - Longitud texto final desktop:', textoFinalDesktop.length);
           
           await navigator.share({
             text: textoFinalDesktop
           });
         }
        
        console.log('✅ Compartido exitosamente con TEXTO');
        return true;
        
      } catch (textError) {
        console.warn('⚠️ Error compartiendo texto, intentando FALLBACK con imagen:', textError);
        
        // FALLBACK: IMAGEN + URL (como antes)
        console.log('🖼️ Activando FALLBACK: imagen + URL');
        
        const imageBlob = await generateAnalysisImage(htmlContent, t, currentLanguage);
        const file = new File([imageBlob], 'chatsalsa-analysis.png', { type: 'image/png' });
        
        if (isMobile) {
          // MÓVIL: text + url + files
          console.log('📱 Fallback móvil: text + url + files');
          await navigator.share({
            text: mensajeIntro,
            url: urlGenerica,
            files: [file]
          });
        } else {
          // DESKTOP: text con URL incluida + files
          console.log('🖥️ Fallback desktop: text con URL incluida + files');
          await navigator.share({
            text: `${mensajeIntro} ${urlGenerica}`,
            files: [file]
          });
        }
        
        console.log('✅ Compartido exitosamente con IMAGEN (fallback)');
        return true;
      }
      
    } else if (isAndroidWebView) {
      // FALLBACK PARA ANDROID WEBVIEW: Usar Intent nativo
      console.log('📱 Usando fallback de Android WebView');
      
      const textoAnalisis = extractPlainTextFromAnalysis(htmlContent);
      const urlGenerica = `https://chatsalsa.com?lang=${currentLanguage}&utm_source=share&utm_medium=social`;
      
      const mensajeIntro = t ? 
        t('hero.share_analysis.enthusiastic_message') :
        '¡Increíble! Mira el análisis psicológico completo de nuestro chat:';
      
      const mensajeCierre = t ?
        t('hero.share_analysis.closing_cta') :
        'Analiza tus chats con CHATSALSA.COM';
      
      const textoCompleto = `${mensajeIntro}\n\n${textoAnalisis}\n\n${mensajeCierre} ${urlGenerica}`;
      
      // Usar Android Intent para compartir
      const shareUrl = `https://wa.me/?text=${encodeURIComponent(textoCompleto)}`;
      window.open(shareUrl, '_blank');
      
      console.log('✅ Compartido via WhatsApp Web');
      return true;
    } else {
      console.log('❌ navigator.share no disponible');
      
      // FALLBACK GENERAL: Copiar al portapapeles
      const textoAnalisis = extractPlainTextFromAnalysis(htmlContent);
      const urlGenerica = `https://chatsalsa.com?lang=${currentLanguage}&utm_source=share&utm_medium=social`;
      
      const mensajeIntro = t ? 
        t('hero.share_analysis.enthusiastic_message') :
        '¡Increíble! Mira el análisis psicológico completo de nuestro chat:';
      
      const mensajeCierre = t ?
        t('hero.share_analysis.closing_cta') :
        'Analiza tus chats con CHATSALSA.COM';
      
      const textoCompleto = `${mensajeIntro}\n\n${textoAnalisis}\n\n${mensajeCierre} ${urlGenerica}`;
      
      try {
        await navigator.clipboard.writeText(textoCompleto);
        alert(t ? t('messages.copied_to_clipboard', 'Copiado al portapapeles') : 'Copiado al portapapeles');
        return true;
      } catch (clipboardError) {
        console.error('Error copiando al portapapeles:', clipboardError);
        alert('Tu navegador no soporta compartir');
        return false;
      }
    }
    
  } catch (error) {
    console.error('❌ Error al compartir:', error);
    if (error.name === 'AbortError') {
      console.log('👤 Usuario canceló el compartir');
      return false;
    }
    alert(t('messages.error', 'Error al compartir'));
    return false;
  }
};

// Componente de botón para React
export const ShareAnalysisButton = ({ htmlContent, t, currentLanguage = 'es', className = '' }) => {
  const handleShare = () => {
    shareAnalysisResults(htmlContent, t, currentLanguage);
  };

  
  return (
    <div style={{ textAlign: 'center', margin: '30px 0', padding: '20px 0', borderTop: '2px solid #eee' }}>
      <button 
        onClick={handleShare}
        className={`share-analysis-button ${className}`}
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          border: 'none',
          padding: '16px 32px',
          borderRadius: '30px',
          fontSize: '16px',
          fontWeight: '600',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          transition: 'all 0.3s ease',
          boxShadow: '0 6px 20px rgba(102, 126, 234, 0.3)',
          margin: '0 auto',
          maxWidth: '350px',
          justifyContent: 'center'
        }}
        onMouseOver={(e) => {
          e.target.style.transform = 'translateY(-3px)';
          e.target.style.boxShadow = '0 10px 30px rgba(102, 126, 234, 0.4)';
        }}
        onMouseOut={(e) => {
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.3)';
        }}
      >
        🧠 {t ? t('hero.share_analysis.title') : ''}
      </button>
    </div>
  );
};

export default {
  generateAnalysisHTML,
  generateAnalysisImage,
  shareAnalysisResults,
  ShareAnalysisButton
}; 