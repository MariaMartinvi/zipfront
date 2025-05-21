// Script para recibir y procesar mensajes de la cola
import { QueueServiceClient } from "@azure/storage-queue";
import * as dotenv from 'dotenv';

// Imprimir mensajes de inicio
console.log("=== RECIBIR MENSAJE DE AZURE QUEUE ===");
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

async function receiveTestMessage() {
  try {
    console.log("\nPreparando recepción de mensaje...");
    
    // Crear cliente
    console.log("Creando cliente del servicio de cola...");
    const queueServiceClient = QueueServiceClient.fromConnectionString(connectionString);
    const queueClient = queueServiceClient.getQueueClient(queueName);
    
    // Verificar estado de la cola
    console.log("\nVerificando estado actual de la cola...");
    const properties = await queueClient.getProperties();
    console.log(`Mensajes aproximados en la cola: ${properties.approximateMessagesCount}`);
    
    if (properties.approximateMessagesCount < 1) {
      console.log("⚠️ No hay mensajes en la cola. Ejecuta test-send-message.js primero.");
      return false;
    }
    
    // Recibir un mensaje
    console.log("\nRecibiendo mensaje de la cola...");
    const response = await queueClient.receiveMessages();
    
    if (response.receivedMessageItems.length === 0) {
      console.log("⚠️ No se pudo recuperar ningún mensaje");
      return false;
    }
    
    // Procesar el mensaje recibido
    const message = response.receivedMessageItems[0];
    console.log(`Mensaje recibido ID: ${message.messageId}`);
    console.log(`Tiempo de inserción: ${message.insertedOn}`);
    
    // Decodificar el contenido (base64 -> JSON)
    const decodedContent = JSON.parse(
      Buffer.from(message.messageText, "base64").toString()
    );
    
    console.log("\n✅ CONTENIDO DEL MENSAJE:");
    console.log(JSON.stringify(decodedContent, null, 2));
    
    // Preguntar si desea eliminar el mensaje
    console.log("\n⚠️ ¿Deseas eliminar el mensaje de la cola? (s/n)");
    // En un entorno de prueba, lo eliminamos automáticamente
    const shouldDelete = true; // Simular una respuesta "s"
    
    if (shouldDelete) {
      console.log("Eliminando mensaje de la cola...");
      await queueClient.deleteMessage(message.messageId, message.popReceipt);
      console.log("✅ Mensaje eliminado con éxito");
      
      // Verificar estado actualizado de la cola
      const updatedProperties = await queueClient.getProperties();
      console.log(`Mensajes restantes en la cola: ${updatedProperties.approximateMessagesCount}`);
    } else {
      console.log("El mensaje permanecerá en la cola y volverá a estar disponible después del tiempo de invisibilidad");
    }
    
    return true;
  } catch (error) {
    console.log("\n❌ ERROR AL RECIBIR MENSAJE");
    console.log("Mensaje de error:", error.message);
    console.log("Detalles:", error);
    return false;
  }
}

// Ejecutar la prueba
console.log("Ejecutando recepción de mensaje de prueba...");
receiveTestMessage()
  .then(success => {
    console.log(`\nResultado final: ${success ? "ÉXITO ✅" : "FALLO ❌"}`);
    console.log("Test completado:", new Date().toISOString());
  })
  .catch(error => {
    console.log("ERROR CRÍTICO:", error);
  });