// Script para simular un error 429 y ver cómo funciona el sistema de colas
import { QueueServiceClient } from "@azure/storage-queue";
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const queueName = "solicitudes-chatgpt";

// Simulador de API de Azure OpenAI con límite de tasa
class AzureOpenAISimulator {
  constructor() {
    this.requestsInCurrentMinute = 0;
    this.minuteStartTime = Date.now();
    this.MAX_REQUESTS_PER_MINUTE = 3; // Simulamos un límite muy bajo para provocar 429
  }

  async sendRequest(prompt) {
    console.log(`[Azure] Recibida solicitud: "${prompt.substring(0, 30)}..."`);
    
    // Verificar límite de tasa
    const now = Date.now();
    
    // Resetear contador si ha pasado un minuto
    if (now - this.minuteStartTime >= 60000) {
      this.minuteStartTime = now;
      this.requestsInCurrentMinute = 0;
      console.log("[Azure] Contador de rate limit reseteado");
    }
    
    this.requestsInCurrentMinute++;
    
    // Si excedemos el límite, devolver error 429
    if (this.requestsInCurrentMinute > this.MAX_REQUESTS_PER_MINUTE) {
      console.log("[Azure] ❌ ERROR 429: Demasiadas solicitudes");
      throw new Error("429 Too Many Requests");
    }
    
    // Simular tiempo de procesamiento
    console.log("[Azure] Procesando solicitud...");
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Devolver respuesta simulada
    return {
      response: `Respuesta simulada para: ${prompt.substring(0, 20)}...`,
      model: "gpt-35-turbo-simulated",
      tokensUsed: Math.floor(Math.random() * 100) + 50
    };
  }
}

// Clase para gestionar la cola
class QueueManager {
  constructor() {
    this.queueServiceClient = QueueServiceClient.fromConnectionString(connectionString);
    this.queueClient = this.queueServiceClient.getQueueClient(queueName);
    this.initialized = false;
  }
  
  async initialize() {
    if (this.initialized) return;
    await this.queueClient.createIfNotExists();
    console.log(`[Cola] Cola "${queueName}" inicializada`);
    this.initialized = true;
  }
  
  async getQueueLength() {
    const properties = await this.queueClient.getProperties();
    return properties.approximateMessagesCount;
  }
  
  async enqueueMessage(message) {
    await this.initialize();
    const encoded = Buffer.from(JSON.stringify(message)).toString("base64");
    const result = await this.queueClient.sendMessage(encoded);
    console.log(`[Cola] ✅ Mensaje encolado con ID: ${result.messageId}`);
    return result.messageId;
  }
  
  async receiveAndProcessMessage(processor) {
    await this.initialize();
    
    // Recibir un mensaje
    const response = await this.queueClient.receiveMessages();
    
    if (response.receivedMessageItems.length === 0) {
      console.log("[Cola] No hay mensajes para procesar");
      return false;
    }
    
    const message = response.receivedMessageItems[0];
    console.log(`[Cola] Mensaje recibido con ID: ${message.messageId}`);
    
    // Decodificar mensaje
    const decodedMessage = JSON.parse(
      Buffer.from(message.messageText, "base64").toString()
    );
    
    try {
      // Procesar mensaje
      console.log(`[Cola] Procesando mensaje: "${decodedMessage.prompt.substring(0, 30)}..."`);
      const result = await processor(decodedMessage);
      console.log(`[Cola] ✅ Mensaje procesado correctamente`);
      
      // Eliminar mensaje de la cola
      await this.queueClient.deleteMessage(message.messageId, message.popReceipt);
      console.log(`[Cola] Mensaje eliminado de la cola`);
      
      return { success: true, result };
    } catch (error) {
      console.log(`[Cola] ❌ Error procesando mensaje: ${error.message}`);
      // Si es un error 429, no hacer nada y dejar que el mensaje vuelva a la cola
      if (error.message.includes("429")) {
        console.log("[Cola] Error de rate limit, mensaje volverá a la cola");
      }
      return { success: false, error: error.message };
    }
  }
}

// Función para simular la aplicación completa
async function simulateApp() {
  console.log("=== SIMULACIÓN DE APLICACIÓN COMPLETA ===");
  console.log("Iniciando simulación:", new Date().toISOString());
  
  const azure = new AzureOpenAISimulator();
  const queueManager = new QueueManager();
  
  // Función para intentar procesar directamente o encolar si falla
  async function processOrEnqueue(prompt, userId) {
    const requestData = {
      prompt,
      usuarioId: userId,
      timestamp: new Date().toISOString(),
      solicitudId: `req-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
    };
    
    try {
      // Intentar procesar directamente
      console.log(`\n[App] Procesando solicitud directamente: "${prompt.substring(0, 30)}..."`);
      const result = await azure.sendRequest(prompt);
      console.log(`[App] ✅ Solicitud procesada con éxito directamente`);
      return result;
    } catch (error) {
      if (error.message.includes("429")) {
        console.log(`[App] ⚠️ Error 429 detectado, encolando solicitud...`);
        // Encolar la solicitud
        await queueManager.enqueueMessage(requestData);
        console.log(`[App] ✅ Solicitud encolada correctamente`);
        
        // Mostrar estado actual de la cola
        const queueLength = await queueManager.getQueueLength();
        console.log(`[App] Mensajes actuales en cola: ${queueLength}`);
        
        return { enqueued: true, message: "Solicitud encolada para procesamiento posterior" };
      } else {
        // Otro tipo de error
        console.log(`[App] ❌ Error no relacionado con rate limiting: ${error.message}`);
        throw error;
      }
    }
  }
  
  // Función para simular el procesador de cola (worker)
  async function processQueueWorker() {
    console.log("\n=== INICIANDO WORKER DE PROCESAMIENTO DE COLA ===");
    
    // Función para procesar mensajes de la cola
    const processMessage = async (message) => {
      return await azure.sendRequest(message.prompt);
    };
    
    // Procesar mensajes en bucle
    let running = true;
    let totalProcessed = 0;
    
    while (running && totalProcessed < 10) { // Limitamos a 10 para la simulación
      console.log(`\n[Worker] Intentando procesar mensaje de la cola...`);
      
      try {
        const result = await queueManager.receiveAndProcessMessage(processMessage);
        
        if (result.success) {
          totalProcessed++;
          console.log(`[Worker] Mensaje procesado correctamente (${totalProcessed}/10)`);
        } else if (result === false) {
          console.log(`[Worker] No hay mensajes en la cola, esperando...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        } else {
          console.log(`[Worker] Error en procesamiento: ${result.error}`);
          // Esperar un poco antes de intentar de nuevo si hay error
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
        // Mostrar estado de la cola
        const queueLength = await queueManager.getQueueLength();
        console.log(`[Worker] Mensajes restantes en cola: ${queueLength}`);
        
        if (queueLength === 0 && totalProcessed > 0) {
          console.log(`[Worker] No hay más mensajes en la cola, finalizando`);
          running = false;
        }
      } catch (error) {
        console.log(`[Worker] Error del worker: ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    console.log(`\n[Worker] Procesamiento completado. Total procesados: ${totalProcessed}`);
  }
  
  // Simular varias solicitudes rápidas (esto provocará 429)
  const prompts = [
    "Explica qué es Azure Queue Storage",
    "Cuáles son las ventajas de usar sistemas de colas",
    "Cómo funciona el rate limiting en APIs",
    "Qué es un error 429 y cómo manejarlo",
    "Mejores prácticas para sistemas distribuidos",
    "Patrones de diseño para alta disponibilidad",
    "Estrategias para manejar picos de tráfico",
    "Diferencias entre colas y tópicos en sistemas de mensajería",
  ];
  
  // 1. Simular solicitudes rápidas (para provocar 429)
  console.log("\n=== SIMULANDO SOLICITUDES RÁPIDAS ===");
  
  const results = [];
  for (const prompt of prompts) {
    try {
      const result = await processOrEnqueue(prompt, "usuario-simulacion");
      results.push(result);
      
      // No esperar entre solicitudes para provocar error 429
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.log(`Error general en solicitud: ${error.message}`);
    }
  }
  
  console.log(`\n=== RESULTADOS DE SOLICITUDES ===`);
  console.log(`Total de solicitudes: ${prompts.length}`);
  console.log(`Procesadas directamente: ${results.filter(r => !r.enqueued).length}`);
  console.log(`Encoladas: ${results.filter(r => r.enqueued).length}`);
  
  // 2. Simular el procesador de cola
  await processQueueWorker();
  
  console.log(`\n=== SIMULACIÓN COMPLETADA ===`);
  console.log(`Tiempo de finalización: ${new Date().toISOString()}`);
}

// Ejecutar la simulación
simulateApp()
  .then(() => console.log("Simulación finalizada con éxito"))
  .catch(error => console.log(`Error en simulación: ${error.message}`)); 