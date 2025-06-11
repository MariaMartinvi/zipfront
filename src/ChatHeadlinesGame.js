import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './ChatHeadlinesGame.css';
import lzString from 'lz-string';

const ChatHeadlinesGame = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [gameData, setGameData] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const extractGameData = () => {
      try {
        setLoading(true);
        console.log('[HeadlinesGame] Iniciando extracción de datos del juego');
        console.log('[HeadlinesGame] URL actual:', location.search);
        
        // Buscar respuesta de Azure en variable global
        const azureResponse = window.lastAzureResponse;
        console.log('[HeadlinesGame] Azure response disponible:', !!azureResponse);
        
        if (azureResponse) {
          console.log('[HeadlinesGame] Procesando respuesta de Azure para el juego...');
          
          // Buscar GAME_DATA en la respuesta
          const gameDataMatch = azureResponse.match(/GAME_DATA:(\[[\s\S]*?\])/);
          
          if (gameDataMatch) {
            console.log('[HeadlinesGame] Datos del juego encontrados en Azure');
            
            try {
              // Buscar la posición inicial del array
              const startIndex = azureResponse.indexOf('GAME_DATA:[');
              if (startIndex === -1) {
                throw new Error('No se encontró GAME_DATA en la respuesta');
              }
              
              // Extraer desde '[' hasta encontrar el ']' que cierra el array principal
              let arrayStart = azureResponse.indexOf('[', startIndex);
              let bracketCount = 0;
              let endIndex = arrayStart;
              
              for (let i = arrayStart; i < azureResponse.length; i++) {
                if (azureResponse[i] === '[') {
                  bracketCount++;
                } else if (azureResponse[i] === ']') {
                  bracketCount--;
                  if (bracketCount === 0) {
                    endIndex = i;
                    break;
                  }
                }
              }
              
              // Extraer el JSON completo
              let jsonStr = azureResponse.substring(arrayStart, endIndex + 1);
              
              console.log('[HeadlinesGame] JSON extraído mejorado:', jsonStr);
              console.log('[HeadlinesGame] Respuesta completa de Azure:', azureResponse);
              
              // Intentar parsear el JSON completo
              let parsedData;
              try {
                parsedData = JSON.parse(jsonStr);
                console.log('[HeadlinesGame] JSON parseado exitosamente:', parsedData);
              } catch (parseError) {
                console.log('[HeadlinesGame] Error parseando JSON completo:', parseError.message);
                console.log('[HeadlinesGame] Intentando extraer arrays por separado');
                
                // Si falla el parse completo, intentar extraer arrays individualmente
                const firstArrayMatch = jsonStr.match(/\[(.*?)\]/);
                if (firstArrayMatch) {
                  const namesStr = firstArrayMatch[1]
                    .split(',')
                    .map(name => name.trim().replace(/"/g, '').replace(/[\[\]]/g, ''))
                    .filter(name => name.length > 0);
                  
                  console.log('[HeadlinesGame] Solo se pudo extraer primer array:', namesStr);
                  
                  // Crear datos básicos si no hay segundo array
                  const headlines = namesStr.map((name, index) => ({
                    nombre: name,
                    frase: `Titular ${index + 1} para ${name}`
                  }));
                  
                  parsedData = [namesStr, headlines];
                }
              }
              
              if (parsedData && Array.isArray(parsedData) && parsedData.length >= 2) {
                let [usuarios, headlines] = parsedData;
                
                console.log('[HeadlinesGame] Usuarios extraídos:', usuarios);
                console.log('[HeadlinesGame] Headlines extraídos:', headlines);
                
                // Convertir iniciales a nombres completos si hay nameMapping disponible
                if (window.lastNameMapping && Object.keys(window.lastNameMapping).length > 0) {
                  console.log('[HeadlinesGame] Convirtiendo iniciales usando nameMapping:', window.lastNameMapping);
                  
                  // Crear mapeo inverso
                  const inverseMapping = {};
                  Object.entries(window.lastNameMapping).forEach(([fullName, initials]) => {
                    inverseMapping[initials] = fullName;
                  });
                  
                  // Convertir usuarios
                  usuarios = usuarios.map(user => inverseMapping[user] || user);
                  
                  // Convertir nombres en headlines
                  if (Array.isArray(headlines)) {
                    headlines = headlines.map(headline => ({
                      ...headline,
                      nombre: inverseMapping[headline.nombre] || headline.nombre
                    }));
                  }
                  
                  console.log('[HeadlinesGame] Usuarios convertidos:', usuarios);
                  console.log('[HeadlinesGame] Headlines convertidos:', headlines);
                }
                
                // Validar estructura de datos
                if (usuarios.length > 0 && headlines.length > 0) {
                  setGameData({ usuarios, headlines });
                  setError(null);
                } else {
                  setError('Los datos del juego no tienen el formato correcto');
                }
              } else {
                setError('No se pudieron procesar los datos del juego');
              }
            } catch (error) {
              console.error('[HeadlinesGame] Error procesando datos del juego:', error);
              setError('Error al procesar los datos del juego');
            }
          } else {
            console.log('[HeadlinesGame] No se encontraron datos de juego en la respuesta de Azure');
            setGameData(null);
          }
        } else {
          // Intentar obtener datos de la URL como fallback
          console.log('[HeadlinesGame] No hay Azure response, intentando datos de URL');
          const searchParams = new URLSearchParams(location.search);
          const urlData = searchParams.get('h');
          
          console.log('[HeadlinesGame] Parámetro h encontrado:', !!urlData);
          console.log('[HeadlinesGame] Longitud del parámetro h:', urlData ? urlData.length : 0);
          console.log('[HeadlinesGame] Primeros 100 caracteres del parámetro h:', urlData ? urlData.substring(0, 100) : 'N/A');
          
          if (urlData) {
            try {
              console.log('[HeadlinesGame] Intentando descomprimir datos de URL...');
              
              // Verificar que lzString esté disponible
              if (!lzString) {
                throw new Error('lz-string no está disponible');
              }
              
              const decompressed = lzString.decompressFromEncodedURIComponent(urlData);
              console.log('[HeadlinesGame] Datos descomprimidos:', decompressed);
              console.log('[HeadlinesGame] Tipo de datos descomprimidos:', typeof decompressed);
              console.log('[HeadlinesGame] Longitud de datos descomprimidos:', decompressed ? decompressed.length : 0);
              
              if (!decompressed) {
                throw new Error('Datos descomprimidos están vacíos');
              }
              
              console.log('[HeadlinesGame] Intentando parsear JSON...');
              const data = JSON.parse(decompressed);
              console.log('[HeadlinesGame] Datos parseados de URL:', data);
              console.log('[HeadlinesGame] Tipo de datos parseados:', typeof data);
              console.log('[HeadlinesGame] Es array:', Array.isArray(data));
              console.log('[HeadlinesGame] Longitud del array:', Array.isArray(data) ? data.length : 'N/A');
              
              if (data && Array.isArray(data) && data.length >= 2) {
                console.log('[HeadlinesGame] Estableciendo gameData con datos de URL');
                console.log('[HeadlinesGame] Usuarios de URL:', data[0]);
                console.log('[HeadlinesGame] Headlines de URL:', data[1]);
                console.log('[HeadlinesGame] Tipo de usuarios:', typeof data[0]);
                console.log('[HeadlinesGame] Tipo de headlines:', typeof data[1]);
                
                setGameData({ usuarios: data[0], headlines: data[1] });
                setError(null);
              } else {
                console.error('[HeadlinesGame] Datos de URL inválidos - estructura incorrecta');
                console.error('[HeadlinesGame] Datos recibidos:', data);
                setError('Datos de URL inválidos - estructura incorrecta');
              }
            } catch (error) {
              console.error('[HeadlinesGame] Error al descomprimir datos de URL:', error);
              console.error('[HeadlinesGame] Error completo:', error.stack);
              console.error('[HeadlinesGame] Parámetro h problemático:', urlData);
              setError('Error al cargar datos del juego desde URL: ' + error.message);
            }
          } else {
            console.log('[HeadlinesGame] No hay respuesta de Azure ni parámetro h disponible');
            setGameData(null);
          }
        }
      } catch (error) {
        console.error('[HeadlinesGame] Error general en extractGameData:', error);
        setError('Error al procesar los datos del juego: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    extractGameData();
  }, [location.search]);

  const handleAnswerChange = (questionIndex, selectedUser) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionIndex]: selectedUser
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    let correctAnswers = 0;
    const totalQuestions = gameData.headlines.length;

    gameData.headlines.forEach((headline, index) => {
      if (userAnswers[index] === headline.nombre) {
        correctAnswers++;
      }
    });

    setScore(correctAnswers);
    setSubmitted(true);
  };

  const resetGame = () => {
    setUserAnswers({});
    setSubmitted(false);
    setScore(0);
  };

  // No mostrar nada si está cargando
  if (loading) {
    console.log('[HeadlinesGame] Renderizando: CARGANDO...');
    return null;
  }

  // No mostrar nada si no hay datos del juego
  if (!gameData) {
    console.log('[HeadlinesGame] Renderizando: NO HAY DATOS DEL JUEGO');
    console.log('[HeadlinesGame] gameData actual:', gameData);
    return null;
  }

  // Mostrar error si existe
  if (error) {
    console.log('[HeadlinesGame] Renderizando: ERROR');
    console.log('[HeadlinesGame] Error actual:', error);
    return (
      <div className="headlines-game-error">
        <p>Error: {error}</p>
      </div>
    );
  }

  console.log('[HeadlinesGame] Renderizando: JUEGO NORMAL');
  console.log('[HeadlinesGame] gameData en render:', gameData);
  console.log('[HeadlinesGame] gameData.usuarios:', gameData?.usuarios);
  console.log('[HeadlinesGame] gameData.headlines:', gameData?.headlines);

  return (
    <div className="headlines-game-container">
      <div className="headlines-game-header">
        <h2>🎯 {t('headlines_game.title', '¿Quién es quién?')}</h2>
        <p>{t('headlines_game.subtitle', 'Adivina quién corresponde a cada titular')}</p>
      </div>

      {!submitted ? (
        <form onSubmit={handleSubmit} className="headlines-game-form">
          {gameData.headlines.map((headline, index) => (
            <div key={index} className="question-block">
              <div className="question-number">{t('headlines_game.question', 'Pregunta')} {index + 1}</div>
              <div className="question-description">{headline.frase}</div>
              
              <div className="options-container">
                <select
                  value={userAnswers[index] || ''}
                  onChange={(e) => handleAnswerChange(index, e.target.value)}
                  className="user-select"
                >
                  <option value="">{t('headlines_game.select_person', 'Selecciona una persona...')}</option>
                  {gameData.usuarios.map((user, userIndex) => (
                    <option key={userIndex} value={user}>
                      {user}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}

          <button type="submit" className="submit-button">
            {t('headlines_game.view_results', 'Ver Resultados')}
          </button>
        </form>
      ) : (
        <div className="results-container">
          <div className="score-display">
            <h3>🎉 {t('headlines_game.results', '¡Resultados!')}</h3>
            <div className="score-big">
              {score} / {gameData.headlines.length}
            </div>
            <p>
              {score === gameData.headlines.length 
                ? t('headlines_game.perfect', '¡Perfecto! 🏆')
                : score >= gameData.headlines.length / 2 
                ? t('headlines_game.good_job', '¡Bien hecho! 👏')
                : t('headlines_game.try_again', '¡Sigue intentando! 💪')
              }
            </p>
          </div>

          <div className="game-data-section">
            <div className="game-data-title">{t('headlines_game.game_data', 'Datos de juego:')}</div>
            <div className="game-data-list">
              {gameData.headlines.map((headline, index) => (
                <div key={index} className="game-data-item">
                  <span className="game-data-name">{headline.nombre}</span>
                  <span className="game-data-description">{headline.frase.replace(/'/g, '')}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="answers-review">
            <h4>{t('headlines_game.answer_review', 'Revisión de respuestas:')}</h4>
            {gameData.headlines.map((headline, index) => {
              const userAnswer = userAnswers[index];
              const isCorrect = userAnswer === headline.nombre;
              
              return (
                <div key={index} className={`answer-review ${isCorrect ? 'correct' : 'incorrect'}`}>
                  <div className="question-text">{headline.frase}</div>
                  <div className="answer-details">
                    <div className="name-headline-format">
                      <div className="name-part">{headline.nombre}</div>
                      <div className="headline-part">{headline.frase}</div>
                    </div>
                    {userAnswer && !isCorrect && (
                      <span className="user-answer">✗ {t('headlines_game.your_answer', 'Tu respuesta:')} {userAnswer}</span>
                    )}
                    {!userAnswer && (
                      <span className="no-answer">○ {t('headlines_game.no_answer', 'No respondiste')}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <button onClick={resetGame} className="reset-button">
            {t('headlines_game.play_again', 'Jugar de Nuevo')}
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatHeadlinesGame; 