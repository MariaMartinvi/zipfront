/**
 * Test específico para francés con Transformer.js
 */

const { anonymizationService } = require('./src/services/anonymizationService.js');

async function testFrench() {
  console.log('🇫🇷 PRUEBA ESPECÍFICA PARA FRANCÉS');
  console.log('=' .repeat(50));

  // Contenido de prueba en francés
  const frenchContent = `[15/02/24, 16:31:02] Pierre Dubois: Bonjour Marie, comment allez-vous?
[15/02/24, 16:31:15] Marie Leclerc: Très bien, merci. Avez-vous vu mon frère Jacques?
[15/02/24, 16:31:30] Pierre Dubois: Oui, je l'ai vu rue de la Paix 123 avec le Docteur Martin.
[15/02/24, 16:31:45] Marie Leclerc: Parfait! Mon père habite près de là. Téléphone: +33-1-23-45-67-89.`;

  console.log('📝 Texto original en francés:');
  console.log(frenchContent);
  console.log('\n');

  // Inicializar IA
  console.log('🔄 Inicializando modelo de IA...');
  const aiLoaded = await anonymizationService.initializeAI();
  
  if (!aiLoaded) {
    console.log('❌ No se pudo cargar la IA');
    return;
  }

  console.log('✅ Modelo cargado correctamente\n');

  // Reiniciar servicio
  anonymizationService.reset();

  // Procesar contenido francés
  console.log('🚀 Procesando contenido francés...');
  const startTime = performance.now();
  const result = await anonymizationService.processContentForAzure(frenchContent);
  const endTime = performance.now();

  console.log(`⏱️ Tiempo de procesamiento: ${(endTime - startTime).toFixed(2)}ms\n`);

  // Mostrar estadísticas
  const stats = anonymizationService.getProcessingStats();
  console.log('📊 Estadísticas:');
  console.log(`   - Idioma detectado: ${stats.currentLanguage}`);
  console.log(`   - Participantes: ${stats.participantsProcessed}`);
  console.log(`   - Personas mencionadas: ${stats.mentionedPeopleProcessed}`);
  console.log(`   - Lugares: ${stats.locationsProcessed}`);
  console.log(`   - Modelo IA activo: ${stats.modelLoaded ? '✅' : '❌'}\n`);

  // Mostrar resultado
  console.log('✨ Texto anonimizado:');
  console.log(result);
  console.log('\n');

  // Mostrar mapeos
  const mappings = anonymizationService.getAllMappings();
  if (Object.keys(mappings.participants).length > 0) {
    console.log('🔗 Mapeos creados:');
    console.log('   Participantes:', mappings.participants);
    if (Object.keys(mappings.mentionedPeople).length > 0) {
      console.log('   Personas mencionadas:', mappings.mentionedPeople);
    }
    if (Object.keys(mappings.locations).length > 0) {
      console.log('   Lugares:', mappings.locations);
    }
  }

  // Test adicional: solo la función de IA
  console.log('\n🔬 Test directo del modelo de IA:');
  const testText = "Bonjour, je suis Jean Dupont et j'habite à Paris.";
  console.log('Texto de prueba:', testText);
  
  try {
    const aiResult = await anonymizationService.anonymizeWithAI(testText);
    console.log('Resultado IA:', aiResult);
  } catch (error) {
    console.log('Error en IA:', error.message);
  }

  console.log('\n✅ Prueba completada');
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  testFrench().catch(console.error);
}

module.exports = { testFrench }; 