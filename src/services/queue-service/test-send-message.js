// Script para enviar un mensaje de prueba a la cola
import { QueueServiceClient } from "@azure/storage-queue";
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const queueName = "solicitudes-chatgpt";

async function sendTestMessage(customMessage = null) {
  try {
    console.log("Preparando para enviar mensaje de prueba...");
    
    // Verificar que tenemos la cadena de conexión
    if (!connectionString) {
      throw new Error("No se encontró la cadena de conexión. Verifica el archivo .env");
    }
    
    const queueServiceClient = QueueServiceClient.fromConnectionString(connectionString);
    const queueClient = queueServiceClient.getQueueClient(queueName);
    
    // Asegurarse de que la cola existe
    await queueClient.createIfNotExists();
    console.log(`Cola '${queueName}' lista para recibir mensajes`);
    
    // Crear mensaje de prueba
    const mensaje = customMessage || {
      prompt: "Explica brevemente qué es Azure Queue Storage y cuáles son sus ventajas",
      usuarioId: "test-user-" + Date.now().toString().slice(-4),
      timestamp: new Date().toISOString(),
      solicitudId: `test-${Date.now()}`
    };
    
    console.log("Mensaje a enviar:", mensaje);
    
    // Codificar y enviar mensaje
    const mensajeCodificado = Buffer.from(JSON.stringify(mensaje)).toString("base64");
    const resultado = await queueClient.sendMessage(mensajeCodificado);
    
    console.log("✅ ¡Mensaje enviado con éxito!");
    console.log("ID del mensaje:", resultado.messageId);
    console.log("Tiempo de expiración:", resultado.expiresOn);
    
    return resultado.messageId;
  } catch (error) {
    console.error("❌ Error al enviar mensaje:");
    console.error(error.message);
    
    if (error.message.includes("AuthenticationFailed")) {
      console.log("\n🔑 Sugerencia: Verifica que la clave de acceso en AZURE_STORAGE_CONNECTION_STRING sea correcta");
    } else if (error.message.includes("getaddrinfo")) {
      console.log("\n🌐 Sugerencia: Verifica tu conexión a internet o si el nombre de la cuenta es correcto");
    }
    
    return null;
  }
}

// Ejecutar si este archivo es el principal
if (process.argv[1] === new URL(import.meta.url).pathname) {
  console.log("Iniciando prueba de envío de mensaje...");
  sendTestMessage()
    .then(messageId => console.log(`\nTest finalizado: ${messageId ? "ÉXITO ✅" : "FALLO ❌"}`))
    .catch(error => console.error("Error en prueba:", error));
}

export default sendTestMessage; 