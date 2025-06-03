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
        
        // Buscar respuesta de Azure en variable global
        const azureResponse = window.lastAzureResponse;
        
        if (azureResponse) {
          console.log('Procesando respuesta de Azure para el juego...');
          
          // Buscar GAME_DATA en la respuesta
          const gameDataMatch = azureResponse.match(/GAME_DATA:(\[[\s\S]*?\])/);
          
          if (gameDataMatch) {
            console.log('Datos del juego encontrados en Azure');
            
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
              
              console.log('JSON extraído mejorado:', jsonStr);
              console.log('Respuesta completa de Azure:', azureResponse);
              
              // Intentar parsear el JSON completo
              let parsedData;
              try {
                parsedData = JSON.parse(jsonStr);
                console.log('JSON parseado exitosamente:', parsedData);
              } catch (parseError) {
                console.log('Error parseando JSON completo:', parseError.message);
                console.log('Intentando extraer arrays por separado');
                
                // Si falla el parse completo, intentar extraer arrays individualmente
                const firstArrayMatch = jsonStr.match(/\[(.*?)\]/);
                if (firstArrayMatch) {
                  const namesStr = firstArrayMatch[1]
                    .split(',')
                    .map(name => name.trim().replace(/"/g, '').replace(/[\[\]]/g, ''))
                    .filter(name => name.length > 0);
                  
                  console.log('Solo se pudo extraer primer array:', namesStr);
                  
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
                
                console.log('Usuarios extraídos:', usuarios);
                console.log('Headlines extraídos:', headlines);
                
                // Convertir iniciales a nombres completos si hay nameMapping disponible
                if (window.lastNameMapping && Object.keys(window.lastNameMapping).length > 0) {
                  console.log('Convirtiendo iniciales usando nameMapping:', window.lastNameMapping);
                  
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
                  
                  console.log('Usuarios convertidos:', usuarios);
                  console.log('Headlines convertidos:', headlines);
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
              console.error('Error procesando datos del juego:', error);
              setError('Error al procesar los datos del juego');
            }
          } else {
            console.log('No se encontraron datos de juego en la respuesta de Azure');
            setGameData(null);
          }
        } else {
          // Intentar obtener datos de la URL como fallback
          const searchParams = new URLSearchParams(location.search);
          const urlData = searchParams.get('h');
          
          if (urlData) {
            try {
              const decompressed = lzString.decompressFromEncodedURIComponent(urlData);
              const data = JSON.parse(decompressed);
              
              if (data && data.length >= 2) {
                setGameData({ usuarios: data[0], headlines: data[1] });
              } else {
                setError('Datos de URL inválidos');
              }
            } catch (error) {
              console.error('Error al descomprimir datos de URL:', error);
              setError('Error al cargar datos del juego desde URL');
            }
          } else {
            console.log('No hay respuesta de Azure disponible');
            setGameData(null);
          }
        }
      } catch (error) {
        console.error('Error general en extractGameData:', error);
        setError('Error al procesar los datos del juego');
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
    return null;
  }

  // No mostrar nada si no hay datos del juego
  if (!gameData) {
    return null;
  }

  // Mostrar error si existe
  if (error) {
    return (
      <div className="headlines-game-error">
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="headlines-game-container">
      <div className="headlines-game-header">
        <h2>🎯 {t('headlines_game.title', '¿Quién dijo qué?')}</h2>
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