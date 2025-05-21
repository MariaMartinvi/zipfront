// Script para enviar un mensaje de prueba a la cola
import { QueueServiceClient } from "@azure/storage-queue";
import * as dotenv from 'dotenv';

// Imprimir mensajes de inicio
console.log("=== ENVÍO DE MENSAJE DE PRUEBA A AZURE QUEUE ===");
console.log("Inicio: " + new Date().toISOString());

// Cargar variables de entorno
dotenv.config();
console.log("Variables de entorno cargadas");

// Obtener la cadena de conexión
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
if (!connectionString) {
  console.error("ERROR: No se encontró la cadena de conexión en el archivo .env");
  process.exit(1);
}

// Nombre de la cola
const queueName = "solicitudes-chatgpt";

// Función para enviar un mensaje de prueba
async function sendTestMessage() {
  try {
    console.log("\nPreparando envío de mensaje...");
    
    // Crear cliente
    console.log("Creando cliente del servicio de cola...");
    const queueServiceClient = QueueServiceClient.fromConnectionString(connectionString);
    const queueClient = queueServiceClient.getQueueClient(queueName);
    
    // Asegurarse de que la cola existe
    console.log("Asegurando que la cola existe...");
    await queueClient.createIfNotExists();
    
    // Crear mensaje de prueba
    const idPrueba = Date.now().toString().slice(-6);
    const mensaje = {
      prompt: "Explica brevemente qué es Azure Queue Storage y sus ventajas",
      usuarioId: `test-user-${idPrueba}`,
      timestamp: new Date().toISOString(),
      solicitudId: `test-${idPrueba}`
    };
    
    console.log("Mensaje a enviar:", JSON.stringify(mensaje, null, 2));
    
    // Codificar mensaje para la cola (base64)
    const mensajeCodificado = Buffer.from(JSON.stringify(mensaje)).toString("base64");
    console.log("Mensaje codificado (primeros 20 caracteres):", mensajeCodificado.substring(0, 20) + "...");
    
    // Enviar mensaje
    console.log("\nEnviando mensaje a la cola...");
    const resultado = await queueClient.sendMessage(mensajeCodificado);
    
    console.log("\n✅ ¡MENSAJE ENVIADO CON ÉXITO!");
    console.log(`ID del mensaje: ${resultado.messageId}`);
    console.log(`Tiempo de inserción: ${resultado.insertedOn}`);
    console.log(`Tiempo de expiración: ${resultado.expiresOn}`);
    
    // Verificar estado de la cola
    console.log("\nVerificando estado actual de la cola...");
    const properties = await queueClient.getProperties();
    console.log(`Mensajes aproximados en la cola: ${properties.approximateMessagesCount}`);
    
    return resultado.messageId;
  } catch (error) {
    console.log("\n❌ ERROR AL ENVIAR MENSAJE");
    console.log("Mensaje de error:", error.message);
    console.log("Detalles:", error);
    return null;
  }
}

// Ejecutar la prueba
console.log("Ejecutando envío de mensaje de prueba...");
sendTestMessage()
  .then(messageId => {
    console.log(`\nResultado final: ${messageId ? "ÉXITO ✅" : "FALLO ❌"}`);
    console.log("Test completado:", new Date().toISOString());
  })
  .catch(error => {
    console.log("ERROR CRÍTICO:", error);
  }); 