import React from 'react';

// Orden de prioridad para mostrar las categorías
const ORDEN_PRIORIDAD = ['mala_influencia', 'amoroso', 'comico', 'narcicista', 'chismoso'];

// Datos estáticos de categorías para evitar problemas con traducciones
const CATEGORIA_ICONOS = {
  'profesor': { icono: '👨‍🏫', titulo: 'El Profesor', descripcion: 'Usa el vocabulario más amplio' },
  'rollero': { icono: '📜', titulo: 'El Rollero', descripcion: 'Escribe mensajes extensos' },
  'pistolero': { icono: '🔫', titulo: 'El Pistolero', descripcion: 'Responde al instante' },
  'vampiro': { icono: '🧛', titulo: 'El Vampiro', descripcion: 'Más activo de noche' },
  'cafeconleche': { icono: '☕', titulo: 'Café con Leche', descripcion: 'El madrugador' },
  'dejaenvisto': { icono: '👻', titulo: 'Deja en Visto', descripcion: 'Tarda en responder' },
  'narcicista': { icono: '🤳', titulo: 'El Narcisista', descripcion: 'Habla de sí mismo' },
  'puntofinal': { icono: '🔚', titulo: 'Punto Final', descripcion: 'Termina conversaciones' },
  'fosforo': { icono: '🔥', titulo: 'El Fósforo', descripcion: 'Inicia conversaciones' },
  'menosesmas': { icono: '🔍', titulo: 'Menos es Más', descripcion: 'Maestro de la brevedad' },
  'chismoso': { icono: '👂', titulo: 'El Chismoso', descripcion: 'Menciona a otros' },
  'happyflower': { icono: '😊', titulo: 'Happy Flower', descripcion: 'Llena de emojis' },
  'amoroso': { icono: '❤️', titulo: 'El Amoroso', descripcion: 'Emojis de amor' },
  'bombardero': { icono: '💥', titulo: 'El Bombardero', descripcion: 'Mensajes consecutivos' },
  'comico': { icono: '🤡', titulo: 'El Cómico', descripcion: 'Hace reír al grupo' },
  'agradecido': { icono: '🙏', titulo: 'El Agradecido', descripcion: 'Da las gracias' },
  'disculpon': { icono: '🙇', titulo: 'El Disculpón', descripcion: 'Pide perdón' },
  'curioso': { icono: '🧐', titulo: 'El Curioso', descripcion: 'Hace preguntas' },
  'mala_influencia': { icono: '👹', titulo: 'Mala Influencia', descripcion: 'Menciona vicios' }
};

// Función para obtener categorías ordenadas según prioridad
const obtenerCategoriasOrdenadas = (datos) => {
  // Filtrar categorías válidas (sin "--" o "Sin datos")
  const categoriasValidas = Object.keys(CATEGORIA_ICONOS).filter(categoria => {
    return datos?.categorias?.[categoria]?.nombre && 
           datos.categorias[categoria].nombre !== 'Sin datos' &&
           datos.categorias[categoria].nombre !== '--';
  });

  // Separar en prioritarias y resto
  const categoriasPrioritarias = [];
  const categoriasResto = [];

  categoriasValidas.forEach(categoria => {
    if (ORDEN_PRIORIDAD.includes(categoria)) {
      categoriasPrioritarias.push(categoria);
    } else {
      categoriasResto.push(categoria);
    }
  });

  // Ordenar las prioritarias según ORDEN_PRIORIDAD
  categoriasPrioritarias.sort((a, b) => {
    return ORDEN_PRIORIDAD.indexOf(a) - ORDEN_PRIORIDAD.indexOf(b);
  });

  // Retornar prioritarias primero, después el resto
  return [...categoriasPrioritarias, ...categoriasResto];
};

export const generateStandaloneHTML = (datos, t, currentLanguage = 'es') => {
  const categoriasValidas = obtenerCategoriasOrdenadas(datos);

  const cardsHTML = categoriasValidas.map(categoria => {
    const catData = datos.categorias[categoria];
    const iconData = CATEGORIA_ICONOS[categoria];
    
    // Mapeo de categorías a claves de traducción
    const categoryTranslationMap = {
      'profesor': 'professor',
      'rollero': 'verbose', 
      'pistolero': 'gunslinger',
      'vampiro': 'vampire',
      'cafeconleche': 'morning',
      'dejaenvisto': 'ghost',
      'narcicista': 'narcissist',
      'puntofinal': 'ending',
      'fosforo': 'starter',
      'menosesmas': 'concise',
      'chismoso': 'gossip',
      'happyflower': 'emoji',
      'amoroso': 'amoroso',
      'bombardero': 'bombardero',
      'comico': 'comico',
      'agradecido': 'agradecido',
      'disculpon': 'disculpon',
      'curioso': 'curioso',
      'mala_influencia': 'mala_influencia'
    };
    
    // Obtener título y descripción traducidos
    const translationKey = categoryTranslationMap[categoria] || categoria;
    const tituloTraducido = t(`app.top_profiles.${translationKey}.title`, iconData.titulo);
    const descripcionTraducida = t(`app.top_profiles.${translationKey}.description`, iconData.descripcion);
    
    return `<div class="profile-card">
      <div class="profile-icon">${iconData.icono}</div>
      <h3>${tituloTraducido}</h3>
      <p>${descripcionTraducida}</p>
      <div class="winner">${catData.nombre}</div>
    </div>`;
  }).join('');

  const isRTL = currentLanguage === 'ar' || currentLanguage === 'he';
  const direction = isRTL ? 'rtl' : 'ltr';

  return `<!DOCTYPE html>
<html lang="${currentLanguage}" dir="${direction}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t('hero.share_top_profiles.html_title', 'Top Perfiles del Chat')} - ChatSalsa</title>
  <style>
    body { font-family: Arial; background: linear-gradient(135deg, #667eea, #764ba2); margin: 0; padding: 20px; direction: ${direction}; }
    .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 20px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 30px; text-align: center; }
    .header h1 { font-size: 2.2em; margin: 0 0 8px 0; }
    .header p { margin: 5px 0; opacity: 0.9; }
    .header div { font-size: 0.9em; margin-top: 10px; opacity: 0.8; }
    .content { padding: 40px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 25px; }
    .profile-card { background: white; border: 2px solid #f0f0f0; border-radius: 25px; padding: 40px; text-align: center; box-shadow: 0 5px 15px rgba(0,0,0,0.1); transition: transform 0.3s ease; }
    .profile-card:hover { transform: translateY(-5px); border-color: #667eea; }
    .profile-icon { font-size: 5em; margin-bottom: 25px; }
    .profile-card h3 { font-size: 1.8em; margin: 20px 0; color: #333; }
    .profile-card p { font-size: 1.3em; color: #666; margin: 20px 0; }
    .winner { background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 22px; border-radius: 15px; margin: 25px 0; font-weight: bold; font-size: 1.5em; }
    .footer { background: #333; color: white; padding: 30px; text-align: center; }
    .footer h3 { margin: 0 0 10px 0; }
    .footer p { margin: 10px 0 20px 0; opacity: 0.9; }
    .cta { background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 15px 30px; border-radius: 50px; text-decoration: none; display: inline-block; font-weight: 600; transition: transform 0.3s ease; }
    .cta:hover { transform: translateY(-2px); }
    
    @media (max-width: 768px) {
      .header { padding: 20px 15px; }
      .header h1 { font-size: 1.8em; }
      .content { padding: 25px 15px; }
      .grid { grid-template-columns: repeat(2, 1fr); gap: 15px; }
      .profile-card { padding: 15px 10px; }
      .profile-icon { font-size: 2em; margin-bottom: 8px; }
      .profile-card h3 { font-size: 1em; margin: 5px 0; }
      .profile-card p { font-size: 0.8em; margin: 5px 0; }
      .winner { padding: 8px; font-size: 0.9em; margin: 8px 0; }

      .footer { padding: 25px 15px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏆 ${t('hero.share_top_profiles.html_title', 'Top Perfiles del Chat')}</h1>
      <p>${t('hero.share_top_profiles.description', 'Descubre quién destaca en cada categoría')}</p>
      <div>${t('hero.share_top_profiles.generated_with', 'Analizado con ChatSalsa')}</div>
    </div>
    <div class="content">
      <div class="grid">${cardsHTML}</div>
    </div>
    <div class="footer">
      <h3>${t('hero.share_top_profiles.footer_title', '¿Quieres analizar tu propio chat?')}</h3>
      <p>${t('hero.share_top_profiles.footer_description', 'Descubre estadísticas fascinantes de tus conversaciones')}</p>
      <a href="https://chatsalsa.com?lang=${currentLanguage}" class="cta">${t('hero.share_top_profiles.footer_cta', '🚀 Analizar Nuevo Chat Gratis')}</a>
    </div>
  </div>
</body>
</html>`;
};

export const generatePromotionalImage = async (datos, t, currentLanguage = 'es') => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = 1080;
    canvas.height = 1080;
    
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Agregar bolitas decorativas de fondo
    const bolitas = [
      { x: 150, y: 200, radius: 80, opacity: 0.1 },
      { x: 900, y: 150, radius: 60, opacity: 0.08 },
      { x: 80, y: 500, radius: 100, opacity: 0.12 },
      { x: 950, y: 450, radius: 70, opacity: 0.09 },
      { x: 200, y: 800, radius: 90, opacity: 0.1 },
      { x: 850, y: 750, radius: 65, opacity: 0.08 },
      { x: 450, y: 950, radius: 75, opacity: 0.09 },
      { x: 650, y: 50, radius: 55, opacity: 0.07 }
    ];
    
    bolitas.forEach(bolita => {
      ctx.fillStyle = `rgba(255, 255, 255, ${bolita.opacity})`;
      ctx.beginPath();
      ctx.arc(bolita.x, bolita.y, bolita.radius, 0, 2 * Math.PI);
      ctx.fill();
    });
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`🏆 ${t('hero.share_top_profiles.html_title', 'TOP CHAT PROFILES').toUpperCase()}`, canvas.width / 2, 80);
    
    const categoriasValidas = obtenerCategoriasOrdenadas(datos);
    
    const topCategorias = categoriasValidas.slice(0, 4);
    
    topCategorias.forEach((categoria, index) => {
      const catData = datos.categorias[categoria];
      const iconData = CATEGORIA_ICONOS[categoria];
      
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = 90 + col * 450;
      const y = 200 + row * 320;
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.beginPath();
      ctx.roundRect(x, y, 400, 300, 25);
      ctx.fill();
      
      ctx.font = '100px Arial';
      ctx.fillStyle = '#333';
      ctx.textAlign = 'center';
      ctx.fillText(iconData.icono, x + 200, y + 100);
      
      ctx.font = 'bold 40px Arial';
      // Mapeo de categorías a claves de traducción
      const categoryTranslationMap = {
        'profesor': 'professor', 'rollero': 'verbose', 'pistolero': 'gunslinger', 'vampiro': 'vampire',
        'cafeconleche': 'morning', 'dejaenvisto': 'ghost', 'narcicista': 'narcissist', 'puntofinal': 'ending',
        'fosforo': 'starter', 'menosesmas': 'concise', 'chismoso': 'gossip', 'happyflower': 'emoji',
        'amoroso': 'amoroso', 'bombardero': 'bombardero', 'comico': 'comico', 'agradecido': 'agradecido',
        'disculpon': 'disculpon', 'curioso': 'curioso', 'mala_influencia': 'mala_influencia'
      };
      const translationKey = categoryTranslationMap[categoria] || categoria;
      const tituloTraducido = t(`app.top_profiles.${translationKey}.title`, iconData.titulo);
      ctx.fillText(tituloTraducido, x + 200, y + 170);
      
      ctx.font = 'bold 52px Arial';
      ctx.fillStyle = '#667eea';
      let nombre = catData.nombre;
      if (nombre.length > 12) {
        nombre = nombre.substring(0, 12) + '...';
      }
      ctx.fillText(nombre, x + 200, y + 230);
    });
    
    ctx.font = 'bold 32px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText(t('hero.share_top_profiles.image_cta', '🚀 Analyze your chats FREE with'), canvas.width / 2, 1000);
    
    ctx.font = 'bold 36px Arial';
    ctx.fillStyle = '#FFE000';
    ctx.fillText(t('hero.share_top_profiles.brand_name', 'CHATSALSA.COM'), canvas.width / 2, 1050);
    
    canvas.toBlob(resolve, 'image/png', 0.9);
  });
};

export const shareTopProfiles = async (datos, t, currentLanguage = 'es') => {
  console.log('🚀 INICIANDO shareTopProfiles - navigator.share disponible:', !!navigator.share);
  
  try {
    if (navigator.share) {
      // ESTRATEGIA ADAPTATIVA: Imagen + URL + texto (email lo usará, WhatsApp lo ignorará)
      console.log('🔥 Compartiendo imagen + URL + texto');
      
      const mensajeEntusiasta = t ? 
        t('hero.share_top_profiles.enthusiastic_message', '¡Esto es increíble! Mira los resultados del análisis de mi chat con ChatSalsa, están buenísimos!') :
        '¡Esto es increíble! Mira los resultados del análisis de mi chat con ChatSalsa, están buenísimos!';
      
      const urlGenerica = `https://chatsalsa.com?lang=${currentLanguage}`;
      
      console.log('📧 Texto (para email):', mensajeEntusiasta);
      console.log('🔗 URL:', urlGenerica);
      
      const imageBlob = await generatePromotionalImage(datos, t, currentLanguage);
      const file = new File([imageBlob], 'chatsalsa-top-profiles.png', { type: 'image/png' });
      
      await navigator.share({
        text: mensajeEntusiasta,
        url: urlGenerica,
        files: [file]
      });
      
      console.log('✅ Compartido exitosamente');
      return true;
    } else {
      console.log('❌ navigator.share no disponible');
      alert('Tu navegador no soporta compartir');
      return false;
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

export const ShareButton = ({ datos, t, currentLanguage = 'es', className = '' }) => {
  const handleShare = () => {
    shareTopProfiles(datos, t, currentLanguage);
  };

  
  return (
    <button 
      onClick={handleShare}
      className={`share-top-profiles-button ${className}`}
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        border: 'none',
        padding: '15px 30px',
        borderRadius: '25px',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        transition: 'all 0.3s ease',
        boxShadow: '0 5px 15px rgba(102, 126, 234, 0.3)',
        margin: '20px auto',
        maxWidth: '300px',
        justifyContent: 'center'
      }}
      onMouseOver={(e) => {
        e.target.style.transform = 'translateY(-2px)';
        e.target.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.4)';
      }}
      onMouseOut={(e) => {
        e.target.style.transform = 'translateY(0)';
        e.target.style.boxShadow = '0 5px 15px rgba(102, 126, 234, 0.3)';
      }}
    >
      🚀 {t ? t('hero.share_top_profiles.title', 'Compartir Top Perfiles') : 'Compartir Top Perfiles'}
    </button>
  );
};

export default {
  generateStandaloneHTML,
  generatePromotionalImage,
  shareTopProfiles,
  ShareButton
}; 