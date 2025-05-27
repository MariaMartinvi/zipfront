/**
 * Script de prueba simple para el servicio de anonimización multiidioma sin dependencias externas
 * Ejecutar con: node test-simple-anonymization.js
 */

const { anonymizationService } = require('./src/services/anonymizationService.js');

console.log('🧪 PROBANDO SERVICIO DE ANONIMIZACIÓN SIMPLIFICADO\n');

// Ejemplo de texto en español
const chatEspañol = `[12/03/23, 14:30:15] Dr. García: Hola María López, te veo mañana en la Calle Mayor 123, Madrid.
[12/03/23, 14:31:02] María López: Perfecto, ¿traigo a mi hermano Juan?
[12/03/23, 14:32:15] Dr. García: Sí, y también puedes traer a tu padre.`;

// Ejemplo de texto en inglés
const chatIngles = `[12/03/23, 14:30:15] John Smith: Hello Sarah, I'll meet you at 5th Avenue 456, New York.
[12/03/23, 14:31:02] Sarah Johnson: Great, should I bring my brother Michael?
[12/03/23, 14:32:15] John Smith: Yes, and also your mother.`;

// Ejemplo de texto en alemán
const chatAleman = `[12/03/23, 14:30:15] Dr. Müller: Hallo Anna, ich sehe Sie morgen in der Hauptstraße 123, Berlin.
[12/03/23, 14:31:02] Anna Schmidt: Perfekt, soll ich meinen Bruder Hans mitbringen?
[12/03/23, 14:32:15] Dr. Müller: Ja, und auch Ihre Mutter.`;

async function probarAnonimizacion() {
  const ejemplos = [
    { nombre: 'Español', contenido: chatEspañol },
    { nombre: 'Inglés', contenido: chatIngles },
    { nombre: 'Alemán', contenido: chatAleman }
  ];

  for (const ejemplo of ejemplos) {
    console.log(`🌐 PROBANDO: ${ejemplo.nombre.toUpperCase()}`);
    console.log('📝 Contenido original:');
    console.log(ejemplo.contenido);
    console.log('\n🔄 Procesando...\n');

    // Resetear para cada prueba
    anonymizationService.reset();

    try {
      const inicio = Date.now();
      const resultado = await anonymizationService.processContentForAzure(ejemplo.contenido);
      const fin = Date.now();

      console.log('✅ Contenido anonimizado:');
      console.log(resultado);
      console.log(`\n⏱️  Tiempo: ${fin - inicio}ms`);

      // Mostrar estadísticas
      const stats = anonymizationService.getProcessingStats();
      console.log('\n📊 ESTADÍSTICAS:');
      console.log(`   Idioma detectado: ${stats.currentLanguage}`);
      console.log(`   Participantes: ${stats.participantsProcessed}`);
      console.log(`   Personas mencionadas: ${stats.mentionedPeopleProcessed}`);
      console.log(`   Lugares: ${stats.locationsProcessed}`);

      // Mostrar mapeos
      const mapeos = anonymizationService.getAllMappings();
      if (Object.keys(mapeos.participants).length > 0) {
        console.log('\n🗂️  MAPEOS:');
        console.log('   Participantes:', mapeos.participants);
        if (Object.keys(mapeos.mentionedPeople).length > 0) {
          console.log('   Personas:', mapeos.mentionedPeople);
        }
        if (Object.keys(mapeos.locations).length > 0) {
          console.log('   Lugares:', mapeos.locations);
        }
      }

    } catch (error) {
      console.error('❌ ERROR:', error.message);
    }

    console.log('\n' + '='.repeat(80) + '\n');
  }

  // Probar detección de idiomas
  console.log('🔍 PRUEBA DE DETECCIÓN DE IDIOMA:');
  const textosPrueba = {
    'Hola, ¿cómo estás? Me llamo Juan.': 'Español esperado',
    'Hello, how are you? My name is John.': 'Inglés esperado',
    'Hallo, wie geht es dir? Mein Name ist Hans.': 'Alemán esperado',
    'Bonjour, comment ça va? Je m\'appelle Pierre.': 'Francés esperado',
    'Ciao, come stai? Mi chiamo Marco.': 'Italiano esperado',
    'Hola, com estàs? Em dic Pere.': 'Catalán esperado',
    'Kaixo, zer moduz? Mikel naiz.': 'Euskera esperado'
  };

  for (const [texto, esperado] of Object.entries(textosPrueba)) {
    const idioma = anonymizationService.detectLanguage(texto);
    const nombreIdioma = anonymizationService.getSupportedLanguages()[idioma]?.name || idioma;
    console.log(`   "${texto}" → ${nombreIdioma} (${esperado})`);
  }

  console.log('\n🎉 PRUEBAS COMPLETADAS!');
}

// Ejecutar pruebas
probarAnonimizacion().catch(console.error); 