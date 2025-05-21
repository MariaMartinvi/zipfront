// Procesador de cola para Azure Queue Storage
import { QueueClient, QueueServiceClient } from "@azure/storage-queue";
import { OpenAIClient, AzureKeyCredential } from "@azure/openai";
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Configuración
const storageConnectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const queueName = "solicitudes-chatgpt";

// Configuración de Azure OpenAI
const openaiEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
const openaiApiKey = process.env.AZURE_OPENAI_KEY;
const openaiDeployment = process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-35-turbo"; 

class QueueProcessor {
  constructor() {
    // Cliente para la cola de Azure
    this.queueServiceClient = QueueServiceClient.fromConnectionString(storageConnectionString);
    this.queueClient = this.queueServiceClient.getQueueClient(queueName);
    
    // Cliente para Azure OpenAI
    this.openaiClient = new OpenAIClient(openaiEndpoint, new AzureKeyCredential(openaiApiKey));
    
    // Control de límites
    this.requestsInCurrentMinute = 0;
    this.minuteStartTime = Date.now();
    this.MAX_REQUESTS_PER_MINUTE = process.env.MAX_REQUESTS_PER_MINUTE || 95; // Ligeramente menor que el límite real
  }

  async initialize() {
    try {
      // Asegurarse de que existe la cola
      await this.queueClient.createIfNotExists();
      console.log("Cola inicializada correctamente");
      return true;
    } catch (error) {
      console.error("Error inicializando la cola:", error);
      return false;
    }
  }

  async procesarCola() {
    try {
      // Obtener hasta 10 mensajes a la vez (visibilityTimeout en segundos)
      const messagesResponse = await this.queueClient.receiveMessages({ 
        numberOfMessages: 1, 
        visibilityTimeout: 60 // 60 segundos para procesar
      });

      if (messagesResponse.receivedMessageItems.length === 0) {
        console.log("No hay mensajes en la cola");
        return false;
      }

      console.log(`Recibidos ${messagesResponse.receivedMessageItems.length} mensajes`);
      
      // Procesar cada mensaje
      for (const message of messagesResponse.receivedMessageItems) {
        try {
          // Control de rate limiting
          await this.aplicarRateLimiting();
          
          // Decodificar mensaje
          const messageContent = JSON.parse(
            Buffer.from(message.messageText, "base64").toString()
          );
          
          console.log(`Procesando solicitud: ${messageContent.solicitudId}`);
          
          // Llamar a OpenAI
          const respuesta = await this.llamarOpenAI(messageContent.prompt);
          
          // Aquí se implementaría la lógica para devolver la respuesta al cliente
          // Por ejemplo, a través de SignalR, una base de datos, etc.
          console.log(`Respuesta generada para solicitud ${messageContent.solicitudId}`);
          
          // Eliminar mensaje de la cola
          await this.queueClient.deleteMessage(message.messageId, message.popReceipt);
          console.log(`Mensaje eliminado de la cola`);
        } catch (error) {
          console.error(`Error procesando mensaje: ${error}`);
          // No eliminamos el mensaje de la cola para que se vuelva a procesar
        }
      }
      
      return true;
    } catch (error) {
      console.error("Error procesando cola:", error);
      return false;
    }
  }
  
  async llamarOpenAI(prompt) {
    try {
      const response = await this.openaiClient.getChatCompletions(
        openaiDeployment, 
        [
          { role: "system", content: "Eres un asistente útil y conciso." },
          { role: "user", content: prompt }
        ],
        { maxTokens: 800 }
      );
      
      return response.choices[0].message.content;
    } catch (error) {
      console.error("Error llamando a OpenAI:", error);
      throw error;
    }
  }
  
  async aplicarRateLimiting() {
    const now = Date.now();
    
    // Resetear contador si ha pasado un minuto
    if (now - this.minuteStartTime >= 60000) {
      this.minuteStartTime = now;
      this.requestsInCurrentMinute = 0;
    }
    
    this.requestsInCurrentMinute++;
    
    // Si estamos cerca del límite, esperar hasta el siguiente minuto
    if (this.requestsInCurrentMinute >= this.MAX_REQUESTS_PER_MINUTE) {
      const timeToWait = 60000 - (now - this.minuteStartTime);
      if (timeToWait > 0) {
        console.log(`Límite de velocidad alcanzado, esperando ${timeToWait/1000} segundos`);
        await new Promise(resolve => setTimeout(resolve, timeToWait));
        this.minuteStartTime = Date.now();
        this.requestsInCurrentMinute = 1;
      }
    }
  }
  
  // Método para iniciar el procesamiento continuo de la cola
  async iniciarProcesamiento() {
    await this.initialize();
    
    // Procesar continuamente con un intervalo
    setInterval(async () => {
      await this.procesarCola();
    }, 1000); // Comprobar cada segundo
  }
}

// Exportar la clase
export default QueueProcessor;

// Si el archivo se ejecuta directamente, iniciar el procesador
if (process.argv[1] === new URL(import.meta.url).pathname) {
  console.log("Iniciando procesador de cola...");
  const processor = new QueueProcessor();
  processor.iniciarProcesamiento()
    .then(() => console.log("Procesador de cola iniciado"))
    .catch(error => console.error("Error iniciando procesador:", error));
} 