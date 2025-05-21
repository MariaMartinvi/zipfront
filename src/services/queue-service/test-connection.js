// Script para probar la conexión a la cola de Azure
import { QueueServiceClient } from "@azure/storage-queue";
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const queueName = "solicitudes-chatgpt";

async function testConnection() {
  try {
    console.log("Intentando conectar a la cola de Azure...");
    
    // Verificar que tenemos la cadena de conexión
    if (!connectionString) {
      throw new Error("No se encontró la cadena de conexión. Verifica el archivo .env");
    }
    
    const queueServiceClient = QueueServiceClient.fromConnectionString(connectionString);
    const queueClient = queueServiceClient.getQueueClient(queueName);
    
    // Verificar si la cola existe
    console.log(`Verificando cola '${queueName}'...`);
    const properties = await queueClient.getProperties();
    
    console.log("✅ ¡Conexión exitosa!");
    console.log(`Detalles de la cola: ${queueName}`);
    console.log(`Cantidad aproximada de mensajes: ${properties.approximateMessagesCount}`);
    
    return true;
  } catch (error) {
    console.error("❌ Error al conectar con la cola:");
    console.error(error.message);
    
    if (error.message.includes("AuthenticationFailed")) {
      console.log("\n🔑 Sugerencia: Verifica que la clave de acceso en AZURE_STORAGE_CONNECTION_STRING sea correcta");
    } else if (error.message.includes("getaddrinfo")) {
      console.log("\n🌐 Sugerencia: Verifica tu conexión a internet o si el nombre de la cuenta es correcto");
    } else if (error.message.includes("Queue not found")) {
      console.log("\n📝 Sugerencia: La cola no existe. Intenta crearla primero con:");
      console.log("   const queueClient = queueServiceClient.getQueueClient('solicitudes-chatgpt');");
      console.log("   await queueClient.createIfNotExists();");
    }
    
    return false;
  }
}

// Ejecutar si este archivo es el principal
if (process.argv[1] === new URL(import.meta.url).pathname) {
  console.log("Iniciando prueba de conexión...");
  testConnection()
    .then(success => console.log(`\nTest finalizado: ${success ? "ÉXITO ✅" : "FALLO ❌"}`))
    .catch(error => console.error("Error en prueba:", error));
}

export default testConnection; 