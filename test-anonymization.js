/**
 * Script de prueba para el servicio de anonimización multiidioma
 * Ejecutar con: node test-anonymization.js
 */

// Como es un test simple, usamos require en lugar de import
const { anonymizationService } = require('./src/services/anonymizationService.js');

console.log('🧪 INICIANDO PRUEBAS DEL SERVICIO DE ANONIMIZACIÓN MULTIIDIOMA\n');

// Ejemplos de texto en diferentes idiomas
const testCases = {
  spanish: `[12/03/23, 14:30:15] Dr. García: Hola María López, te veo mañana en la Calle Mayor 123, Madrid.
[12/03/23, 14:31:02] María López: Perfecto, ¿traigo a mi hermano Juan?
[12/03/23, 14:32:15] Dr. García: Sí, y también puedes traer a tu padre.`,

  english: `[12/03/23, 14:30:15] John Smith: Hello Sarah, I'll meet you at 5th Avenue 456, New York.
[12/03/23, 14:31:02] Sarah Johnson: Great, should I bring my brother Michael?
[12/03/23, 14:32:15] John Smith: Yes, and also your mother.`,

  catalan: `[12/03/23, 14:30:15] Pere Sala: Hola Maria, et veig demà al Carrer Aragó 123, Barcelona.
[12/03/23, 14:31:02] Maria Puig: Perfecte, porto al meu germà Joan?
[12/03/23, 14:32:15] Pere Sala: Sí, i també pots portar al teu pare.`,

  german: `[12/03/23, 14:30:15] Dr. Müller: Hallo Anna, ich sehe Sie morgen in der Hauptstraße 123, Berlin.
[12/03/23, 14:31:02] Anna Schmidt: Perfekt, soll ich meinen Bruder Hans mitbringen?
[12/03/23, 14:32:15] Dr. Müller: Ja, und auch Ihre Mutter.`
};

async function runTests() {
  try {
    // 1. Mostrar idiomas soportados
    console.log('📋 IDIOMAS SOPORTADOS:');
    const supportedLanguages = anonymizationService.getSupportedLanguages();
    for (const [code, info] of Object.entries(supportedLanguages)) {
      const spacyStatus = info.spacyAvailable ? '✅ spaCy' : '❌ spaCy';
      const compromiseStatus = info.compromiseSupport ? '✅ Compromise' : '❌ Compromise';
      console.log(`   ${code}: ${info.name} - ${spacyStatus}, ${compromiseStatus}`);
    }
    console.log('\n' + '='.repeat(80) + '\n');

    // 2. Probar cada idioma
    for (const [language, content] of Object.entries(testCases)) {
      console.log(`🌐 PROBANDO: ${language.toUpperCase()}`);
      console.log('📝 Contenido original:');
      console.log(content);
      console.log('\n🔄 Procesando...\n');

      // Resetear el servicio para cada prueba
      anonymizationService.reset();

      // Procesar contenido
      const startTime = Date.now();
      const anonymized = await anonymizationService.processContentForAzure(content);
      const endTime = Date.now();

      console.log('✅ Contenido anonimizado:');
      console.log(anonymized);
      console.log(`\n⏱️  Tiempo de procesamiento: ${endTime - startTime}ms`);

      // Mostrar estadísticas
      const stats = anonymizationService.getProcessingStats();
      console.log('\n📊 ESTADÍSTICAS:');
      console.log(`   Idioma detectado: ${stats.currentLanguage}`);
      console.log(`   Participantes procesados: ${stats.participantsProcessed}`);
      console.log(`   Personas mencionadas: ${stats.mentionedPeopleProcessed}`);
      console.log(`   Lugares procesados: ${stats.locationsProcessed}`);

      // Mostrar mapeos para debugging
      const mappings = anonymizationService.getAllMappings();
      if (Object.keys(mappings.participants).length > 0) {
        console.log('\n🗂️  MAPEOS:');
        console.log('   Participantes:', mappings.participants);
        if (Object.keys(mappings.mentionedPeople).length > 0) {
          console.log('   Personas mencionadas:', mappings.mentionedPeople);
        }
        if (Object.keys(mappings.locations).length > 0) {
          console.log('   Lugares:', mappings.locations);
        }
      }

      console.log('\n' + '='.repeat(80) + '\n');
    }

    // 3. Prueba de detección de idioma
    console.log('🔍 PRUEBA DE DETECCIÓN DE IDIOMA:');
    const testTexts = {
      'Hola, ¿cómo estás? Me llamo Juan García.': 'Español',
      'Hello, how are you? My name is John Smith.': 'Inglés',
      'Hallo, wie geht es dir? Mein Name ist Hans Müller.': 'Alemán',
      'Bonjour, comment allez-vous? Je m\'appelle Pierre Martin.': 'Francés',
      'Ciao, come stai? Il mio nome è Marco Rossi.': 'Italiano'
    };

    for (const [text, expectedLanguage] of Object.entries(testTexts)) {
      const detectedLang = anonymizationService.detectLanguage(text);
      const langName = anonymizationService.getSupportedLanguages()[detectedLang]?.name || detectedLang;
      const status = langName.toLowerCase().includes(expectedLanguage.toLowerCase()) ? '✅' : '⚠️';
      console.log(`   ${status} "${text.substring(0, 30)}..." → ${langName}`);
    }

    console.log('\n🎉 TODAS LAS PRUEBAS COMPLETADAS EXITOSAMENTE!');

  } catch (error) {
    console.error('❌ ERROR EN LAS PRUEBAS:', error.message);
    console.error(error.stack);
  }
}

// Ejecutar pruebas
runTests(); 