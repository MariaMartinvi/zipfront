// Script simplificado para probar la conexión a la cola de Azure
import { QueueServiceClient } from "@azure/storage-queue";
import * as dotenv from 'dotenv';

// Imprimir mensajes de inicio
console.log("=== TEST DE CONEXIÓN A AZURE QUEUE STORAGE ===");
console.log("Inicio del script: " + new Date().toISOString());

// Cargar variables de entorno
dotenv.config();
console.log("Variables de entorno cargadas");

// Obtener la cadena de conexión
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
console.log("¿Existe cadena de conexión?", !!connectionString);
if (connectionString) {
  console.log("Longitud de la cadena:", connectionString.length);
}

// Nombre de la cola
const queueName = "solicitudes-chatgpt";
console.log("Nombre de la cola:", queueName);

// Función principal
async function testAzureConnection() {
  console.log("\nIniciando prueba de conexión a Azure...");
  
  try {
    // Verificar si tenemos la cadena de conexión
    if (!connectionString) {
      throw new Error("ERROR: No se encontró la cadena de conexión en el archivo .env");
    }
    
    console.log("Creando cliente del servicio de cola...");
    const queueServiceClient = QueueServiceClient.fromConnectionString(connectionString);
    
    console.log("Obteniendo cliente para la cola:", queueName);
    const queueClient = queueServiceClient.getQueueClient(queueName);
    
    console.log("Verificando si la cola existe...");
    const properties = await queueClient.getProperties();
    
    console.log("\n✅ ¡CONEXIÓN EXITOSA!");
    console.log(`Nombre de la cola: ${queueName}`);
    console.log(`Mensajes aproximados: ${properties.approximateMessagesCount}`);
    console.log(`ID de cola: ${properties.requestId}`);
    
    return "Conexión exitosa";
  } catch (error) {
    console.log("\n❌ ERROR DE CONEXIÓN");
    console.log("Mensaje de error:", error.message);
    console.log("Error completo:", JSON.stringify(error, null, 2));
    
    if (error.message.includes("AuthenticationFailed")) {
      console.log("\nLa clave de acceso parece ser incorrecta. Verifica tu cadena de conexión.");
    } else if (error.message.includes("getaddrinfo") || error.message.includes("ENOTFOUND")) {
      console.log("\nProblema de conexión a internet o nombre de cuenta incorrecto.");
    } else if (error.message.includes("Queue not found")) {
      console.log("\nLa cola no existe. Podría ser necesario crearla primero.");
      
      try {
        console.log("Intentando crear la cola...");
        await queueClient.create();
        console.log("¡Cola creada con éxito!");
      } catch (createError) {
        console.log("Error al crear la cola:", createError.message);
      }
    }
    
    return "Error de conexión: " + error.message;
  }
}

// Ejecutar la prueba
console.log("Ejecutando prueba de conexión...");
testAzureConnection()
  .then(result => {
    console.log("\nResultado final:", result);
    console.log("Test completado:", new Date().toISOString());
  })
  .catch(error => {
    console.log("ERROR CRÍTICO:", error);
  }); 