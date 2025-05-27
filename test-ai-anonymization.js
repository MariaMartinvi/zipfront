/**
 * Script de prueba para el servicio de anonimización con Transformer.js
 * Versión con IA multiidioma
 */

const { anonymizationService } = require('./src/services/anonymizationService.js');

// Datos de prueba multiidioma
const testCases = [
  {
    language: 'spa',
    content: `[15/02/24, 16:31:02] María García: Hola Antonio, ¿cómo estás?
[15/02/24, 16:31:15] Antonio López: Muy bien, gracias. ¿Has visto a mi hermano Carlos?
[15/02/24, 16:31:30] María García: Sí, lo vi en la Calle Mayor 123 con el Doctor Pérez.
[15/02/24, 16:31:45] Antonio López: Perfecto, mi padre vive cerca. Teléfono 666123456.`
  },
  {
    language: 'eng',
    content: `2/15/24, 4:31 PM - John Smith: Hello everyone!
2/15/24, 4:32 PM - Sarah Johnson: Hi John! Have you seen my brother Mike?
2/15/24, 4:33 PM - John Smith: Yes, he was at Main Street 456 with Doctor Brown.
2/15/24, 4:34 PM - Sarah Johnson: Great! My mother lives there. Phone: +1-555-123-4567.`
  },
  {
    language: 'deu',
    content: `[15.02.24, 16:31:02] Hans Müller: Hallo Anna, wie geht es dir?
[15.02.24, 16:31:15] Anna Schmidt: Gut, danke. Hast du meinen Vater Klaus gesehen?
[15.02.24, 16:31:30] Hans Müller: Ja, er war in der Hauptstraße 789 mit Professor Weber.
[15.02.24, 16:31:45] Anna Schmidt: Perfekt! Meine Mutter wohnt da. Telefon: +49-30-12345678.`
  },
  {
    language: 'zho',
    content: `[15/02/24, 16:31:02] 李明: 你好张华，你怎么样？
[15/02/24, 16:31:15] 张华: 很好，谢谢。你看到我的哥哥王力了吗？
[15/02/24, 16:31:30] 李明: 看到了，他在北京路123号和医生刘博士在一起。
[15/02/24, 16:31:45] 张华: 太好了！我的母亲住在那附近。`
  },
  {
    language: 'jpn',
    content: `[15/02/24, 16:31:02] 田中太郎: こんにちは山田さん、元気ですか？
[15/02/24, 16:31:15] 山田花子: はい、元気です。私の兄の鈴木一郎を見ましたか？
[15/02/24, 16:31:30] 田中太郎: はい、東京駅前で佐藤先生と一緒にいました。
[15/02/24, 16:31:45] 山田花子: よかった！私の母がそこに住んでいます。`
  }
];

async function runAITests() {
  console.log('🚀 Iniciando pruebas con Transformer.js');
  console.log('=' .repeat(60));

  // Inicializar el servicio y cargar modelo de IA
  console.log('1️⃣ Inicializando modelo de IA...');
  const aiLoaded = await anonymizationService.initializeAI();
  
  if (!aiLoaded) {
    console.log('❌ No se pudo cargar el modelo de IA');
    console.log('📋 Las pruebas se ejecutarán con patrones regex');
  } else {
    console.log('✅ Modelo de IA cargado correctamente');
  }

  console.log('\n2️⃣ Información de idiomas soportados:');
  const languages = anonymizationService.getSupportedLanguages();
  Object.entries(languages).forEach(([code, info]) => {
    console.log(`   ${code}: ${info.name} | IA: ${info.aiSupport ? '✅' : '❌'} | Patrones: ${info.patternSupport ? '✅' : '❌'}`);
  });

  console.log('\n3️⃣ Ejecutando pruebas por idioma:');
  console.log('-'.repeat(60));

  for (const testCase of testCases) {
    console.log(`\n🌍 Procesando ${testCase.language.toUpperCase()}:`);
    
    // Reiniciar el servicio para cada prueba
    anonymizationService.reset();
    
    const startTime = performance.now();
    const result = await anonymizationService.processContentForAzure(testCase.content);
    const endTime = performance.now();

    console.log(`⏱️  Tiempo de procesamiento: ${(endTime - startTime).toFixed(2)}ms`);
    
    // Mostrar estadísticas
    const stats = anonymizationService.getProcessingStats();
    console.log(`📊 Estadísticas:`);
    console.log(`   - Idioma detectado: ${stats.currentLanguage}`);
    console.log(`   - Participantes: ${stats.participantsProcessed}`);
    console.log(`   - Personas mencionadas: ${stats.mentionedPeopleProcessed}`);
    console.log(`   - Lugares: ${stats.locationsProcessed}`);
    console.log(`   - Modelo IA activo: ${stats.modelLoaded ? '✅' : '❌'}`);

    // Mostrar el resultado
    console.log(`\n📝 Texto original:`);
    console.log(testCase.content.substring(0, 150) + '...');
    
    console.log(`\n✨ Texto anonimizado:`);
    console.log(result.substring(0, 200) + '...');

    // Mostrar mapeos
    const mappings = anonymizationService.getAllMappings();
    if (Object.keys(mappings.participants).length > 0) {
      console.log(`\n🔗 Mapeos creados:`);
      console.log(`   Participantes:`, mappings.participants);
      if (Object.keys(mappings.mentionedPeople).length > 0) {
        console.log(`   Personas mencionadas:`, mappings.mentionedPeople);
      }
      if (Object.keys(mappings.locations).length > 0) {
        console.log(`   Lugares:`, mappings.locations);
      }
    }
  }

  console.log('\n4️⃣ Comparativa de rendimiento (IA vs Patrones):');
  console.log('-'.repeat(60));

  const spanishTestContent = testCases[0].content;
  
  // Probar con IA
  anonymizationService.reset();
  anonymizationService.setAIMode(true);
  const aiStartTime = performance.now();
  const aiResult = await anonymizationService.processContentForAzure(spanishTestContent);
  const aiEndTime = performance.now();
  const aiTime = aiEndTime - aiStartTime;

  // Probar con patrones
  anonymizationService.reset();
  anonymizationService.setAIMode(false);
  const patternStartTime = performance.now();
  const patternResult = await anonymizationService.processContentForAzure(spanishTestContent);
  const patternEndTime = performance.now();
  const patternTime = patternEndTime - patternStartTime;

  console.log(`🤖 Procesamiento con IA: ${aiTime.toFixed(2)}ms`);
  console.log(`📋 Procesamiento con patrones: ${patternTime.toFixed(2)}ms`);
  console.log(`⚡ Diferencia de velocidad: ${(aiTime / patternTime).toFixed(2)}x ${aiTime > patternTime ? 'más lento' : 'más rápido'}`);

  // Comparar calidad de resultados
  console.log(`\n🔍 Comparación de resultados:`);
  console.log(`IA detectó: ${(aiResult.match(/\[PERSONA \d+\]/g) || []).length} personas`);
  console.log(`Patrones detectaron: ${(patternResult.match(/\[PERSONA \d+\]/g) || []).length} personas`);

  console.log('\n✅ Pruebas completadas');
  console.log('=' .repeat(60));
}

// Función para probar la descarga de modelos
async function testModelDownload() {
  console.log('📦 Probando descarga de modelo...');
  
  try {
    // Esto debería iniciar la descarga del modelo automáticamente
    const aiLoaded = await anonymizationService.initializeAI();
    
    if (aiLoaded) {
      console.log('✅ Modelo descargado y cargado correctamente');
      
      // Probar una predicción simple
      const testText = "Hola, soy Juan Pérez y vivo en Madrid.";
      const result = await anonymizationService.anonymizeWithAI(testText);
      console.log('🔬 Prueba simple:', result);
      
    } else {
      console.log('❌ Error descargando modelo');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

// Función principal
async function main() {
  console.log('🧪 PRUEBAS DEL SERVICIO DE ANONIMIZACIÓN CON TRANSFORMER.JS');
  console.log('================================================================');
  
  try {
    // Primero probar la descarga del modelo
    await testModelDownload();
    
    console.log('\n');
    
    // Luego ejecutar todas las pruebas
    await runAITests();
    
  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { runAITests, testModelDownload }; 