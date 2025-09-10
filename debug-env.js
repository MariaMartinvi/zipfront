// Script para debuggear variables de entorno en Render
console.log('=== DEBUG VARIABLES DE ENTORNO ===');
console.log('REACT_APP_OPENAI_API_KEY:', process.env.REACT_APP_OPENAI_API_KEY ? 'Configurada ✅' : 'No encontrada ❌');
console.log('REACT_APP_MISTRAL_API_KEY:', process.env.REACT_APP_MISTRAL_API_KEY ? 'Configurada ✅' : 'No encontrada ❌');

// Mostrar todas las variables que empiecen con REACT_APP_
console.log('\n=== TODAS LAS VARIABLES REACT_APP_ ===');
Object.keys(process.env).filter(key => key.startsWith('REACT_APP_')).forEach(key => {
  console.log(`${key}:`, process.env[key] ? 'Configurada ✅' : 'No encontrada ❌');
});

export { };



