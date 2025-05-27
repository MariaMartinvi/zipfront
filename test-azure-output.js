/**
 * Script para probar el texto final que se envía a Azure
 */

const { anonymizationService } = require('./src/services/anonymizationService.js');

async function testAzureOutput() {
  console.log('🔍 PRUEBA DE TEXTO FINAL PARA AZURE');
  console.log('=====================================');
  console.log('');

  // Contenido de prueba en español
  const testContent = `[15/02/24, 16:31:02] María García: Hola Antonio, ¿cómo estás?
[15/02/24, 16:31:15] Antonio López: Muy bien, gracias. ¿Has visto a mi hermano Carlos?
[15/02/24, 16:31:30] María García: Sí, lo vi en la Calle Mayor 123 con el Doctor Pérez.
[15/02/24, 16:31:45] Antonio López: Perfecto, mi padre vive cerca. Teléfono 666123456.
[15/02/24, 16:32:00] María García: También vi a mi prima Ana y a la profesora Elena.`;

  try {
    // Inicializar IA
    await anonymizationService.initializeAI();
    
    // Reiniciar el servicio
    anonymizationService.reset();
    
    // Procesar para Azure (esto mostrará el before y after)
    const result = await anonymizationService.processContentForAzure(testContent);
    
    // Mostrar mapeos finales
    console.log('\n📋 MAPEOS FINALES:');
    console.log('-'.repeat(30));
    const mappings = anonymizationService.getAllMappings();
    
    if (Object.keys(mappings.participants).length > 0) {
      console.log('👥 Participantes:', mappings.participants);
    }
    
    if (Object.keys(mappings.mentionedPeople).length > 0) {
      console.log('🧑 Personas mencionadas:', mappings.mentionedPeople);
    }
    
    if (Object.keys(mappings.locations).length > 0) {
      console.log('📍 Lugares:', mappings.locations);
    }
    
    // Estadísticas
    const stats = anonymizationService.getProcessingStats();
    console.log('\n📊 ESTADÍSTICAS:');
    console.log('-'.repeat(30));
    console.log(`Idioma: ${stats.currentLanguage}`);
    console.log(`Participantes: ${stats.participantsProcessed}`);
    console.log(`Personas: ${stats.mentionedPeopleProcessed}`);
    console.log(`Lugares: ${stats.locationsProcessed}`);
    console.log(`IA activa: ${stats.modelLoaded ? '✅' : '❌'}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  testAzureOutput().catch(console.error);
}

module.exports = { testAzureOutput }; 