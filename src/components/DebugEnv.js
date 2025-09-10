// Componente para debuggear variables de entorno en producción
import React, { useEffect } from 'react';

const DebugEnv = () => {
  useEffect(() => {
    console.log('=== DEBUG ENV EN RENDER ===');
    console.log('REACT_APP_OPENAI_API_KEY:', process.env.REACT_APP_OPENAI_API_KEY ? 'Configurada ✅' : 'No encontrada ❌');
    console.log('REACT_APP_MISTRAL_API_KEY:', process.env.REACT_APP_MISTRAL_API_KEY ? 'Configurada ✅' : 'No encontrada ❌');
    
    // Verificar si las APIs son accesibles
    if (process.env.REACT_APP_OPENAI_API_KEY) {
      console.log('OpenAI Key length:', process.env.REACT_APP_OPENAI_API_KEY.length);
      console.log('OpenAI Key prefix:', process.env.REACT_APP_OPENAI_API_KEY.substring(0, 10) + '...');
    }
    
    if (process.env.REACT_APP_MISTRAL_API_KEY) {
      console.log('Mistral Key length:', process.env.REACT_APP_MISTRAL_API_KEY.length);
      console.log('Mistral Key prefix:', process.env.REACT_APP_MISTRAL_API_KEY.substring(0, 10) + '...');
    }
  }, []);

  return null; // Componente invisible, solo para debug
};

export default DebugEnv;



