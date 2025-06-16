import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './TopProfilesViewer.css';

// Datos estáticos de categorías (mismo que en shareTopProfiles.js)
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

// Orden de prioridad para mostrar las categorías
const ORDEN_PRIORIDAD = ['mala_influencia', 'amoroso', 'comico', 'narcicista', 'chismoso'];

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

// Función para obtener categorías ordenadas según prioridad (mismo que shareTopProfiles.js)
const obtenerCategoriasOrdenadas = (datos) => {
  const categoriasValidas = Object.keys(CATEGORIA_ICONOS).filter(categoria => {
    return datos?.categorias?.[categoria]?.nombre && 
           datos.categorias[categoria].nombre !== 'Sin datos' &&
           datos.categorias[categoria].nombre !== '--';
  });

  const categoriasPrioritarias = [];
  const categoriasResto = [];

  categoriasValidas.forEach(categoria => {
    if (ORDEN_PRIORIDAD.includes(categoria)) {
      categoriasPrioritarias.push(categoria);
    } else {
      categoriasResto.push(categoria);
    }
  });

  categoriasPrioritarias.sort((a, b) => {
    return ORDEN_PRIORIDAD.indexOf(a) - ORDEN_PRIORIDAD.indexOf(b);
  });

  return [...categoriasPrioritarias, ...categoriasResto];
};

const TopProfilesViewer = () => {
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
      <div className="top-profiles-viewer loading">
        <div className="loading-spinner">🔄</div>
        <p>Cargando perfiles...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="top-profiles-viewer error">
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

  const categoriasValidas = obtenerCategoriasOrdenadas(datos);

  // Mapeo de categorías a claves de traducción
  const categoryTranslationMap = {
    'profesor': 'professor', 'rollero': 'verbose', 'pistolero': 'gunslinger', 'vampiro': 'vampire',
    'cafeconleche': 'morning', 'dejaenvisto': 'ghost', 'narcicista': 'narcissist', 'puntofinal': 'ending',
    'fosforo': 'starter', 'menosesmas': 'concise', 'chismoso': 'gossip', 'happyflower': 'emoji',
    'amoroso': 'amoroso', 'bombardero': 'bombardero', 'comico': 'comico', 'agradecido': 'agradecido',
    'disculpon': 'disculpon', 'curioso': 'curioso', 'mala_influencia': 'mala_influencia'
  };

  return (
    <div className="top-profiles-viewer">
      <div className="container">
        <div className="header">
          <h1>🏆 {t('hero.share_top_profiles.html_title', 'Top Perfiles del Chat')}</h1>
          <p>{t('hero.share_top_profiles.description', 'Descubre quién destaca en cada categoría')}</p>
          <div>{t('hero.share_top_profiles.generated_with', 'Analizado con ChatSalsa')}</div>
        </div>
        
        <div className="content">
          <div className="grid">
            {categoriasValidas.map(categoria => {
              const catData = datos.categorias[categoria];
              const iconData = CATEGORIA_ICONOS[categoria];
              const translationKey = categoryTranslationMap[categoria] || categoria;
              const tituloTraducido = t(`app.top_profiles.${translationKey}.title`, iconData.titulo);
              const descripcionTraducida = t(`app.top_profiles.${translationKey}.description`, iconData.descripcion);
              
              return (
                <div key={categoria} className="profile-card">
                  <div className="profile-icon">{iconData.icono}</div>
                  <h3>{tituloTraducido}</h3>
                  <p>{descripcionTraducida}</p>
                  <div className="winner">{catData.nombre}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="footer">
          <h3>{t('hero.share_top_profiles.footer_title', '¿Quieres analizar tu propio chat?')}</h3>
          <p>{t('hero.share_top_profiles.footer_description', 'Descubre estadísticas fascinantes de tus conversaciones')}</p>
          <button 
            onClick={() => navigate('/')} 
            className="cta-button"
          >
            {t('hero.share_top_profiles.footer_cta', '🚀 Analizar Nuevo Chat Gratis')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TopProfilesViewer; 