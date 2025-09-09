// Test simple para verificar APIs
require('dotenv').config();

async function testAPIs() {
  console.log('🔍 Verificando APIs...\n');

  // 1. Verificar variables de entorno
  console.log('📋 Variables de entorno:');
  console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Configurada ✅' : 'No encontrada ❌');
  console.log('MISTRAL_API_KEY:', process.env.MISTRAL_API_KEY ? 'Configurada ✅' : 'No encontrada ❌');

  if (!process.env.OPENAI_API_KEY && !process.env.MISTRAL_API_KEY) {
    console.log('\n❌ No se encontraron las API keys. Verifica tu archivo .env');
    return;
  }

  // 2. Test básico de OpenAI
  if (process.env.OPENAI_API_KEY) {
    console.log('\n🤖 Probando OpenAI...');
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        }
      });

      if (response.ok) {
        console.log('✅ OpenAI API: Conexión exitosa');
      } else {
        console.log('❌ OpenAI API: Error', response.status, response.statusText);
        const error = await response.text();
        console.log('Error details:', error.substring(0, 200));
      }
    } catch (error) {
      console.log('❌ OpenAI API: Error de conexión:', error.message);
    }
  }

  // 3. Test básico de Mistral
  if (process.env.MISTRAL_API_KEY) {
    console.log('\n🤖 Probando Mistral...');
    try {
      const response = await fetch('https://api.mistral.ai/v1/models', {
        headers: {
          'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`
        }
      });

      if (response.ok) {
        console.log('✅ Mistral API: Conexión exitosa');
      } else {
        console.log('❌ Mistral API: Error', response.status, response.statusText);
        const error = await response.text();
        console.log('Error details:', error.substring(0, 200));
      }
    } catch (error) {
      console.log('❌ Mistral API: Error de conexión:', error.message);
    }
  }

  console.log('\n🏁 Test completado');
}

testAPIs().catch(console.error); 