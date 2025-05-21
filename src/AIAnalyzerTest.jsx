import React, { useState, useEffect } from 'react';
import { useAIAnalyzerLocal } from './AIAnalyzerLocal';
import './AIAnalyzerTest.css';

const AIAnalyzer= () => {
  const [testMessage, setTestMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const { results, loading, error } = useAIAnalyzerLocal(submitted ? testMessage : null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const resetTest = () => {
    setTestMessage('');
    setSubmitted(false);
  };

  // Ejemplos de prueba predefinidos
  const examples = [
    "Sara me comentó que vendrá mañana a la reunión",
    "He hablado con Ana y dice que podemos quedar el viernes",
    "Juan y Pedro están organizando la fiesta",
    "El trabajo de María está casi terminado",
    "¿Has visto a Carmen por aquí?",
    "La sa ra está en el salón",
    "José Antonio va a llegar tarde"
  ];

  const selectExample = (example) => {
    setTestMessage(example);
    setSubmitted(false);
  };

  return (
    <div className="ai-analyzer-test">
      <h2>Prueba de Detección de Nombres</h2>
      <p className="subtitle">Usa el modelo Davlan/distilbert-base-multilingual-cased-ner-hrl</p>
      
      <div className="examples-section">
        <h3>Ejemplos para probar:</h3>
        <div className="examples-container">
          {examples.map((example, index) => (
            <button 
              key={index} 
              className="example-button" 
              onClick={() => selectExample(example)}
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="test-form">
        <div className="input-container">
          <label htmlFor="test-message">Texto para analizar:</label>
          <textarea
            id="test-message"
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            placeholder="Escribe un mensaje que contenga nombres..."
            rows={3}
            required
          />
        </div>
        <div className="buttons-container">
          <button type="submit" className="submit-button" disabled={loading || !testMessage}>
            {loading ? 'Analizando...' : 'Analizar'}
          </button>
          <button type="button" className="reset-button" onClick={resetTest}>
            Limpiar
          </button>
        </div>
      </form>

      <div className="results-container">
        {loading && <div className="loading">Analizando mensaje...</div>}
        
        {error && !loading && (
          <div className="error">
            <h3>Error:</h3>
            <p>{error}</p>
          </div>
        )}
        
        {results && !loading && (
          <div className="results">
            <h3>Resultados del análisis:</h3>
            <div className="message">
              <strong>Mensaje analizado:</strong> 
              <p>{results.message}</p>
            </div>
            {results.success ? (
              <div className="detected-names">
                <strong>Nombres detectados ({results.detectedNames.length}):</strong>
                {results.detectedNames.length > 0 ? (
                  <ul>
                    {results.detectedNames.map((name, index) => (
                      <li key={index}>{name}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No se detectaron nombres en este mensaje.</p>
                )}
              </div>
            ) : (
              <div className="error">
                <p>{results.error || "Error desconocido en el análisis"}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAnalyzer; 