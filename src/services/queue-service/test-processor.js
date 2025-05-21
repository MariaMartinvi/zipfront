const QueueProcessor = require('./QueueProcessor');

async function testProcessor() {
  try {
    console.log("Iniciando procesador de cola en modo prueba...");
    
    const processor = new QueueProcessor();
    await processor.initialize();
    
    // Procesar solo 3 veces
    for (let i = 0; i < 3; i++) {
      console.log(`--- Iteración ${i+1}/3 ---`);
      const resultado = await processor.procesarCola();
      console.log(`Resultado: ${resultado ? "Se procesaron mensajes" : "No se encontraron mensajes"}`);
      
      // Esperar 2 segundos entre iteraciones
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log("Test del procesador completado con éxito");
    return true;
  } catch (error) {
    console.error("Error en test del procesador:", error);
    return false;
  }
}

testProcessor()
  .then(result => console.log(`Test finalizado: ${result ? "ÉXITO" : "FALLO"}`));