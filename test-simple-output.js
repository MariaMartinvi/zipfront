/**
 * Test simple para ver claramente el before y after
 */

const { anonymizationService } = require('./src/services/anonymizationService.js');

async function showBeforeAfter() {
  // Texto de prueba
  const originalText = `[15/02/24, 16:31:02] María García: Hola Antonio, ¿cómo estás?
[15/02/24, 16:31:15] Antonio López: Muy bien, gracias. ¿Has visto a mi hermano Carlos?
[15/02/24, 16:31:30] María García: Sí, lo vi en la Calle Mayor 123 con el Doctor Pérez.`;

  console.clear();
  console.log('🔍 COMPARACIÓN BEFORE vs AFTER');
  console.log('='.repeat(80));
  
  console.log('\n📄 ANTES (texto original):');
  console.log('-'.repeat(40));
  console.log(originalText);
  
  console.log('\n🔄 Procesando...');
  
  try {
    // Inicializar y procesar
    await anonymizationService.initializeAI();
    anonymizationService.reset();
    
    const processedText = await anonymizationService.processContentForAzure(originalText);
    
    console.log('\n📤 DESPUÉS (para Azure):');
    console.log('-'.repeat(40));
    console.log(processedText);
    
    console.log('\n📋 Mapeos:');
    console.log('-'.repeat(40));
    const mappings = anonymizationService.getAllMappings();
    console.log('Participantes:', mappings.participants);
    console.log('Personas:', mappings.mentionedPeople);
    console.log('Lugares:', mappings.locations);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  console.log('\n' + '='.repeat(80));
}

if (require.main === module) {
  showBeforeAfter();
}

module.exports = { showBeforeAfter }; 