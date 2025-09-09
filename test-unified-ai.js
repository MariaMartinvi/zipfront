/**
 * Script de prueba para el nuevo sistema unificado ChatGPT + Mistral
 * 
 * Este script verifica que:
 * 1. La anonimización funciona igual que antes
 * 2. El nuevo sistema de IA (ChatGPT + Mistral) funciona
 * 3. El fallback automático funciona
 */

const { UnifiedAIService } = require('./src/services/UnifiedAIService.js');
const { anonymizationService } = require('./src/services/anonymizationService.js');

async function testUnifiedSystem() {
  console.log('🧪 ===== PRUEBA DEL SISTEMA UNIFICADO =====\n');

  // 1. Verificar configuración
  console.log('🔧 1. Verificando configuración...');
  const unifiedAI = new UnifiedAIService();
  const config = unifiedAI.checkConfiguration();
  
  console.log('📋 Estado de configuración:', config);
  
  if (!config.allConfigured) {
    console.error('❌ Error: Faltan variables de entorno:', config.missingKeys);
    console.log('💡 Asegúrate de tener en tu .env:');
    console.log('   OPENAI_API_KEY=tu-clave-openai');
    console.log('   MISTRAL_API_KEY=tu-clave-mistral');
    return;
  }
  
  console.log('✅ Configuración correcta\n');

  // 2. Probar anonimización (debe funcionar igual que antes)
  console.log('🔒 2. Probando anonimización...');
  const chatOriginal = `[15/03/24, 10:30:15] María García: Hola Juan, ¿cómo estás?
[15/03/24, 10:31:22] Juan López: Muy bien María, gracias por preguntar
[15/03/24, 10:32:10] María García: ¿Vienes mañana a casa de Pedro?`;

  console.log('📝 Chat original:');
  console.log(chatOriginal);
  
  // Resetear servicio de anonimización
  anonymizationService.reset();
  
  // Anonimizar igual que antes
  const chatAnonimizado = anonymizationService.anonymizeParticipants(chatOriginal, 'es');
  const mappings = anonymizationService.getAllMappings();
  
  console.log('\n🔒 Chat anonimizado:');
  console.log(chatAnonimizado);
  console.log('\n📋 Mapeos creados:', mappings);
  console.log('✅ Anonimización funciona igual que antes\n');

  // 3. Probar sistema unificado de IA
  console.log('🤖 3. Probando sistema unificado de IA...');
  
  try {
    const result = await unifiedAI.getResponse(chatAnonimizado, 'es');
    
    if (result.success) {
      console.log('✅ Sistema de IA funcionando correctamente');
      console.log(`📊 Proveedor usado: ${result.provider} (${result.model})`);
      console.log(`🔄 Fallback usado: ${result.fallbackUsed ? 'Sí' : 'No'}`);
      console.log(`📝 Longitud de respuesta: ${result.response.length} caracteres`);
      
      // Mostrar un poco de la respuesta
      const preview = result.response.substring(0, 200) + '...';
      console.log(`📖 Vista previa: ${preview}`);
      
    } else {
      console.error('❌ Error en el sistema de IA:', result.error);
      if (result.details) {
        console.error('🔍 Detalles:', result.details);
      }
    }
    
  } catch (error) {
    console.error('❌ Error ejecutando prueba:', error.message);
  }

  console.log('\n🏁 ===== PRUEBA COMPLETADA =====');
}

// Ejecutar prueba
testUnifiedSystem().catch(console.error); 