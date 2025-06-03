import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './ChatTopGame.css';
import lzString from 'lz-string'; // Importar lz-string para descomprimir los datos

// Categorías específicas que queremos mostrar en el juego
const SELECTED_CATEGORIES = [
  'rollero',
  'narcicista', 
  'fosforo',
  'amoroso',
  'sicopata',
  'comico',
  'mala_influencia'
];

// Mapeo de categorías con íconos - usando exactamente los mismos que en Analisis_top.js
const CATEGORY_ICONS = {
  profesor: '👨‍🏫',
  rollero: '📜',
  pistolero: '🔫',
  vampiro: '🧛',
  cafeconleche: '☕',
  dejaenvisto: '👻',
  narcicista: '🤳',
  puntofinal: '🔚',
  fosforo: '🔥',
  menosesmas: '🔍',
  chismoso: '👂',
  happyflower: '😊',
  amoroso: '❤️',
  sicopata: '🔪',
  comico: '🤡',
  agradecido: '🙏',
  disculpon: '🤝',
  curioso: '🧐',
  negativo: '😔',
  mala_influencia: '👹'
};

// Mapeo de categorías con traducciones - usando exactamente las mismas claves que en Analisis_top.js
const CATEGORY_TRANSLATIONS = {
  profesor: {
    title: 'app.top_profiles.professor.title',
    description: 'app.top_profiles.professor.description'
  },
  rollero: {
    title: 'app.top_profiles.verbose.title',
    description: 'app.top_profiles.verbose.description'
  },
  pistolero: {
    title: 'app.top_profiles.gunslinger.title',
    description: 'app.top_profiles.gunslinger.description'
  },
  vampiro: {
    title: 'app.top_profiles.vampire.title',
    description: 'app.top_profiles.vampire.description'
  },
  cafeconleche: {
    title: 'app.top_profiles.morning.title',
    description: 'app.top_profiles.morning.description'
  },
  dejaenvisto: {
    title: 'app.top_profiles.ghost.title',
    description: 'app.top_profiles.ghost.description'
  },
  narcicista: {
    title: 'app.top_profiles.narcissist.title',
    description: 'app.top_profiles.narcissist.description'
  },
  puntofinal: {
    title: 'app.top_profiles.finisher.title',
    description: 'app.top_profiles.finisher.description'
  },
  fosforo: {
    title: 'app.top_profiles.initiator.title',
    description: 'app.top_profiles.initiator.description'
  },
  menosesmas: {
    title: 'app.top_profiles.concise.title',
    description: 'app.top_profiles.concise.description'
  },
  chismoso: {
    title: 'app.top_profiles.gossip.title',
    description: 'app.top_profiles.gossip.description'
  },
  happyflower: {
    title: 'app.top_profiles.emoji.title',
    description: 'app.top_profiles.emoji.description'
  },
  amoroso: {
    title: 'app.top_profiles.amoroso.title',
    description: 'app.top_profiles.amoroso.description'
  },
  sicopata: {
    title: 'app.top_profiles.sicopata.title',
    description: 'app.top_profiles.sicopata.description'
  },
  comico: {
    title: 'app.top_profiles.comico.title',
    description: 'app.top_profiles.comico.description'
  },
  agradecido: {
    title: 'app.top_profiles.agradecido.title',
    description: 'app.top_profiles.agradecido.description'
  },
  disculpon: {
    title: 'app.top_profiles.disculpon.title',
    description: 'app.top_profiles.disculpon.description'
  },
  curioso: {
    title: 'app.top_profiles.curioso.title',
    description: 'app.top_profiles.curioso.description'
  },
  mala_influencia: {
    title: 'app.top_profiles.mala_influencia.title',
    description: 'app.top_profiles.mala_influencia.description'
  }
};

const ChatTopGame = () => {
  const location = useLocation();
  const { t } = useTranslation();
  const [gameData, setGameData] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [answeredQuestionsCount, setAnsweredQuestionsCount] = useState(0);
  const [dataError, setDataError] = useState(null);
  const [loaded, setLoaded] = useState(false);
  
  // Cargar y decodificar datos de la URL
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(location.search);
      
      // Intentar obtener los datos usando diferentes formatos de parámetros
      // 'z': formato ultra ultra compacto (array optimizado)
      // 'q': formato ultra compacto (array)
      // 'd': formato comprimido (objeto)
      // 'data': formato legacy (base64)
      const superCompactData = searchParams.get('z');
      const ultraCompactData = searchParams.get('q');
      const compressedData = searchParams.get('d');
      const legacyData = searchParams.get('data');
      
      if (!superCompactData && !ultraCompactData && !compressedData && !legacyData) {
        setDataError(t('chatTopGame.error.noGameDataUrl', "No se encontraron datos del juego en la URL"));
        setLoaded(true);
        return;
      }
      
      let jsonData;
      let data;
      
      // Descomprimir datos según el formato
      if (superCompactData) {
        // Formato super ultra compacto (array optimizado con nombres de categorías cortos)
        jsonData = lzString.decompressFromEncodedURIComponent(superCompactData);
        data = JSON.parse(jsonData);
        console.log("Datos en formato super ultra compacto:", data);
      } else if (ultraCompactData) {
        // Formato ultra compacto (array)
        jsonData = lzString.decompressFromEncodedURIComponent(ultraCompactData);
        data = JSON.parse(jsonData);
        console.log("Datos en formato ultra compacto:", data);
      } else if (compressedData) {
        // Formato comprimido anterior (objeto con c y u)
        jsonData = lzString.decompressFromEncodedURIComponent(compressedData);
        data = JSON.parse(jsonData);
        console.log("Datos en formato comprimido:", data);
      } else if (legacyData) {
        // Formato legacy (base64)
        jsonData = decodeURIComponent(escape(atob(legacyData)));
        data = JSON.parse(jsonData);
        console.log("Datos en formato legacy:", data);
      }
      
      // Convertir a formato estándar para el componente
      const processedData = {
        categorias: {},
        usuarios: []
      };
      
      // Procesar según el formato de los datos
      if (Array.isArray(data)) {
        if (data.length >= 3 && Array.isArray(data[2])) {
          // Formato super ultra compacto: [usuarios, nombresUnicos, [[codigoCat,indexNombre], ...]]
          const usuarios = data[0];
          const nombresUnicos = data[1];
          const categoriasCompactas = data[2];
          
          // Mapeo de códigos cortos a nombres completos
          const codeToCategory = {
            'p': 'profesor', 'r': 'rollero', 's': 'pistolero', 'v': 'vampiro',
            'c': 'cafeconleche', 'd': 'dejaenvisto', 'n': 'narcicista',
            'f': 'puntofinal', 'o': 'fosforo', 'm': 'menosesmas',
            'h': 'chismoso', 'y': 'happyflower', 'a': 'amoroso', 'x': 'sicopata',
            'co': 'comico', 'ag': 'agradecido', 'cu': 'curioso',
            'ne': 'negativo', 'mi': 'mala_influencia'
          };
          
          if (Array.isArray(usuarios)) {
            processedData.usuarios = usuarios;
          }
          
          if (Array.isArray(categoriasCompactas)) {
            categoriasCompactas.forEach(par => {
              if (Array.isArray(par) && par.length >= 2) {
                const [codigo, nombreIndex] = par;
                const categoria = codeToCategory[codigo] || codigo;
                const nombre = nombresUnicos[nombreIndex] || 'Desconocido';
                processedData.categorias[categoria] = { nombre };
              }
            });
          }
        } else if (data.length >= 2) {
          // Formato ultra compacto anterior: [usuarios, [[cat,nombre], ...]]
          const usuarios = data[0];
          const categoriasPares = data[1];
          
          if (Array.isArray(usuarios)) {
            processedData.usuarios = usuarios;
          }
          
          if (Array.isArray(categoriasPares)) {
            categoriasPares.forEach(par => {
              if (Array.isArray(par) && par.length >= 2) {
                const [categoria, nombre] = par;
                processedData.categorias[categoria] = { nombre };
              }
            });
          }
        }
      } else {
        // Formatos anteriores (objetos)
        
        // Procesar usuarios
        if (data.u) {
          if (Array.isArray(data.u)) {
            processedData.usuarios = data.u;
          } else if (typeof data.u === 'object' && data.u !== null) {
            processedData.usuarios = Object.keys(data.u);
          }
        } else if (data.usuarios) {
          if (Array.isArray(data.usuarios)) {
            processedData.usuarios = data.usuarios;
          } else if (typeof data.usuarios === 'object' && data.usuarios !== null) {
            processedData.usuarios = Object.keys(data.usuarios);
          }
        }
        
        // Procesar categorías
        if (data.c) {
          // Formato compacto: data.c es un objeto donde la clave es la categoría
          // y el valor es directamente el nombre
          Object.entries(data.c).forEach(([categoria, nombre]) => {
            processedData.categorias[categoria] = {
              nombre: typeof nombre === 'string' ? nombre : 
                     nombre && nombre.nombre ? nombre.nombre : 'Desconocido'
            };
          });
        } else if (data.categorias) {
          // Formato anterior más detallado
          processedData.categorias = data.categorias;
        }
      }
      
      console.log("Datos procesados:", processedData);
      
      // Validar que los datos tengan la estructura correcta
      if (!processedData.categorias || !processedData.usuarios || 
          Object.keys(processedData.categorias).length === 0 || 
          processedData.usuarios.length === 0) {
        setDataError(t('chatTopGame.error.incompleteData', "Los datos del juego están incompletos o dañados"));
        setLoaded(true);
        return;
      }
      
      // Guardar los datos decodificados y procesados
      setGameData(processedData);
      setLoaded(true);
    } catch (error) {
      console.error("Error decodificando datos del juego:", error);
      setDataError(t('chatTopGame.error.loadingError', `Error cargando el juego: ${error.message}`));
      setLoaded(true);
    }
  }, [location, t]);
  
  // Manejar cambios en las respuestas del usuario
  const handleAnswerChange = (category, value) => {
    setUserAnswers(prev => ({
      ...prev,
      [category]: value
    }));
  };
  
  // Manejar envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Calcular puntuación
    let correctAnswers = 0;
    let answeredQuestions = 0;
    const categories = Object.keys(gameData.categorias);
    
    categories.forEach(category => {
      const correctAnswer = gameData.categorias[category].nombre;
      const userAnswer = userAnswers[category];
      
      // Solo contar si el usuario respondió esta pregunta
      if (userAnswer) {
        answeredQuestions++;
        if (userAnswer === correctAnswer) {
          correctAnswers++;
        }
      }
    });
    
    // Establecer puntuación
    setScore(correctAnswers);
    setAnsweredQuestionsCount(answeredQuestions);
    setSubmitted(true);
    
    // Hacer scroll hacia arriba para ver los resultados
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Si hay un error cargando los datos
  if (dataError) {
    return (
      <div className="chat-top-game error-container">
        <h1>{t('chatTopGame.error.title', 'Error')}</h1>
        <p>{dataError}</p>
        <button onClick={() => window.location.href = '/'}>
          {t('chatTopGame.button.backToHome', 'Volver al inicio')}
        </button>
      </div>
    );
  }
  
  // Mostrar spinner mientras se cargan los datos
  if (!loaded || !gameData) {
    return (
      <div className="chat-top-game loading-container">
        <div className="spinner"></div>
        <p>{t('chatTopGame.loading', 'Cargando juego...')}</p>
      </div>
    );
  }
  
  // Obtener categorías y usuarios disponibles
  const allCategories = Object.keys(gameData?.categorias || {});
  // Filtrar solo las categorías seleccionadas que existen en los datos
  const categories = allCategories.filter(category => SELECTED_CATEGORIES.includes(category));
  const usuarios = Array.isArray(gameData?.usuarios) ? gameData.usuarios : [];
  
  return (
    <div className="chat-top-game">
      <div className="game-header">
        <h1>{t('chatTopGame.header.title', '¿Quién es quién en el chat?')}</h1>
        <p>{t('chatTopGame.header.subtitle', 'Adivina qué persona del chat corresponde a cada categoría')}</p>
      </div>
      
      {submitted ? (
        <div className="game-results">
          <div className="score-card">
            <h2>{t('chatTopGame.results.title', '¡Resultado!')}</h2>
            <div className="score">
              <span className="score-value">{score}</span>
              <span className="score-total">/ {answeredQuestionsCount}</span>
            </div>
            <p>{score === answeredQuestionsCount ? 
              t('chatTopGame.results.perfect', '¡Perfecto! Has acertado todas las preguntas que has respondido.') : 
              score > answeredQuestionsCount / 2 ? 
                t('chatTopGame.results.goodJob', '¡Buen trabajo! Conoces bastante a tus amigos.') :
                t('chatTopGame.results.tryAgain', '¡Inténtalo de nuevo! Parece que no los conoces tanto como pensabas.')}
            </p>
            <button onClick={() => setSubmitted(false)}>
              {t('chatTopGame.button.playAgainResults', 'Volver a jugar')}
            </button>
          </div>
          
          <h3>{t('chatTopGame.answers.title', 'Respuestas:')}</h3>
          <div className="answers-container">
            {categories.map(category => {
              const correctAnswer = gameData.categorias[category].nombre;
              const userAnswer = userAnswers[category] || '';
              const isCorrect = correctAnswer === userAnswer;
              const hasAnswer = !!userAnswer;
              const categoryKey = category.toLowerCase().replace(/\s+/g, '_');

              return (
                <div key={category} className={`answer-card ${hasAnswer ? (isCorrect ? 'correct' : 'incorrect') : ''}`}>
                  <div className="category-info">
                    <div className="category-icon">{CATEGORY_ICONS[category] || '🏆'}</div>
                    <div className="category-details">
                      <div className="category-name">{CATEGORY_TRANSLATIONS[category] ? t(CATEGORY_TRANSLATIONS[category].title) : category.charAt(0).toUpperCase() + category.slice(1)}</div>
                      <div className="category-description">{CATEGORY_TRANSLATIONS[category] ? t(CATEGORY_TRANSLATIONS[category].description) : category}</div>
                    </div>
                  </div>
                  
                  <div className="answer-result">
                    <div className="user-answer">
                      <span>{t('chatTopGame.answers.yourAnswer', 'Tu respuesta:')} {userAnswer || t('chatTopGame.answers.notAnswered', 'No respondida')}</span>
                    </div>
                    <div className="correct-answer">
                      <span>{t('chatTopGame.answers.correctAnswer', 'Respuesta correcta:')} {correctAnswer}</span>
                    </div>
                  </div>
                  
                  <div className="result-icon">
                    {hasAnswer ? (isCorrect ? '✅' : '❌') : '➖'}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="share-again">
            <button onClick={() => window.location.reload()}>
              {t('chatTopGame.button.playAgainBottom', 'Jugar otra vez')}
            </button>
          </div>
        </div>
      ) : (
        <form className="game-form" onSubmit={handleSubmit}>
          <div className="questions-container">
            {categories.map(category => {
              const categoryKey = category.toLowerCase().replace(/\s+/g, '_');
              return (
                <div key={category} className="question-card">
                  <div className="question-header">
                    <div className="category-icon">{CATEGORY_ICONS[category] || '🏆'}</div>
                    <h3>{t('chatTopGame.question.whoIs', '¿Quién es {{categoryName}}?', { 
                      categoryName: CATEGORY_TRANSLATIONS[category] ? t(CATEGORY_TRANSLATIONS[category].title) : category.charAt(0).toUpperCase() + category.slice(1)
                    })}</h3>
                  </div>
                  
                  <div className="question-description">
                    {CATEGORY_TRANSLATIONS[category] ? t(CATEGORY_TRANSLATIONS[category].description) : category}
                  </div>
                  
                  <select 
                    value={userAnswers[category] || ''} 
                    onChange={(e) => handleAnswerChange(category, e.target.value)}
                  >
                    <option value="">{t('chatTopGame.question.selectPerson', 'Selecciona una persona')}</option>
                    {usuarios.map(usuario => (
                      <option key={usuario} value={usuario}>
                        {usuario}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
          
          <div className="submit-container">
            <button type="submit">
              {t('chatTopGame.button.viewResults', 'Ver resultados')}
            </button>
          </div>
        </form>
      )}
      
      <div className="game-footer">
        <p>{t('chatTopGame.footer.text', 'Analizador de chats WhatsApp')}</p>
      </div>
    </div>
  );
};

export default ChatTopGame; 