/**
 * Script DIRECTO para mostrar texto final para Azure
 */

const { anonymizationService } = require('./src/services/anonymizationService.js');

async function showAzureText() {
  const text = `[15/02/24, 16:31:02] María García: Hola Antonio, ¿cómo estás?
[15/02/24, 16:31:15] Antonio López: Muy bien, gracias. ¿Has visto a mi hermano Carlos?
[15/02/24, 16:31:30] María García: Sí, lo vi en la Calle Mayor 123 con el Doctor Pérez.`;

  console.log('PROCESANDO...\n');
  
  // Inicializar
  await anonymizationService.initializeAI();
  anonymizationService.reset();
  
  // Procesar (esto mostrará el resultado automáticamente)
  await anonymizationService.processContentForAzure(text);
}

showAzureText().catch(console.error); 