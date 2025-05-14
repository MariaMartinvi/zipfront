// Script de diagnóstico para probar el acceso a Hugging Face
console.log("Iniciando diagnóstico de acceso a Hugging Face...");

// Archivo que intenta acceder
const urlToTest = "https://huggingface.co/Xenova/distilgpt2-spanish/resolve/main/tokenizer_config.json";

// Función para probar el acceso a un archivo de Hugging Face
async function testHuggingFaceAccess() {
  try {
    console.log(`Intentando acceder a: ${urlToTest}`);
    
    // Intentar fetch con credenciales
    const response = await fetch(urlToTest, {
      method: 'GET',
      credentials: 'omit',
      mode: 'cors',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (response.ok) {
      console.log("✅ Acceso exitoso a Hugging Face");
      const data = await response.json();
      console.log("Datos recibidos:", data);
      return {
        success: true,
        status: response.status,
        data: data
      };
    } else {
      console.error(`❌ Error al acceder a Hugging Face: ${response.status} ${response.statusText}`);
      return {
        success: false,
        status: response.status,
        statusText: response.statusText
      };
    }
  } catch (error) {
    console.error("❌ Error de conexión a Hugging Face:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Función para verificar si hay cortafuegos o restricciones
async function testCORSAccess() {
  try {
    // Intentar acceder a un servicio CORS-friendly para ver si hay restricciones generales
    const response = await fetch('https://jsonplaceholder.typicode.com/todos/1');
    
    if (response.ok) {
      console.log("✅ Prueba CORS general exitosa");
      return true;
    } else {
      console.error(`❌ Prueba CORS general fallida: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error("❌ Error en prueba CORS general:", error);
    return false;
  }
}

// Ejecutar pruebas y mostrar resultados
async function runDiagnostics() {
  // Probar CORS general primero
  const corsOk = await testCORSAccess();
  
  // Probar acceso a Hugging Face
  const hfResult = await testHuggingFaceAccess();
  
  // Resultados
  console.log("\n=== RESULTADOS DEL DIAGNÓSTICO ===");
  console.log(`CORS general: ${corsOk ? "✅ Funciona" : "❌ Bloqueado"}`);
  console.log(`Hugging Face: ${hfResult.success ? "✅ Accesible" : "❌ Bloqueado"}`);
  
  if (!hfResult.success) {
    if (hfResult.status === 401 || hfResult.status === 403) {
      console.log("⚠️ PROBLEMA DETECTADO: Acceso no autorizado a Hugging Face");
      console.log("Esto confirma que hay restricciones de acceso a la API de Hugging Face.");
    } else if (hfResult.error && hfResult.error.includes("NetworkError")) {
      console.log("⚠️ PROBLEMA DETECTADO: Bloqueo de red a Hugging Face");
      console.log("La conexión a Hugging Face está siendo bloqueada por la red/cortafuegos.");
    }
  }
  
  return {
    corsOk,
    hfResult
  };
}

// Exponer para uso desde la consola
window.hfDiagnostic = {
  runTests: runDiagnostics,
  testHF: testHuggingFaceAccess,
  testCORS: testCORSAccess
};

// Ejecutar automáticamente al cargar
runDiagnostics().then(results => {
  console.log("Diagnóstico completado. Usa window.hfDiagnostic.runTests() para ejecutar nuevamente.");
});

export default {
  runDiagnostics,
  testHuggingFaceAccess,
  testCORSAccess
}; 