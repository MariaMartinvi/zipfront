// Servicio para manejar Azure Queue Storage
// Este servicio gestiona el envío de solicitudes a la cola cuando se detecta un error 429

// URL base para la API que procesará las solicitudes en cola
const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000';

// Nombre de la cola existente en Azure
const QUEUE_NAME = process.env.REACT_APP_AZURE_QUEUE_NAME || 'solicitudes-chatgpt';

/**
 * Servicio para manejar la cola de Azure
 */
class AzureQueueService {
  constructor() {
    // ID de sesión único para identificar solicitudes de este cliente
    this.sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    console.log('Azure Queue Service inicializado');
    console.log(`Conectando a cola: ${QUEUE_NAME}`);
  }

  /**
   * Envía una solicitud a la cola de Azure cuando se detecta un error 429
   * @param {Object} requestData - Datos de la solicitud a encolar
   * @returns {Promise<Object>} - Resultado de la operación
   */
  async enqueueRequest(requestData) {
    try {
      console.log(`Enviando solicitud a la cola de Azure existente: ${QUEUE_NAME}`);
      
      // Agregar metadatos necesarios
      const queueItem = {
        ...requestData,
        sessionId: this.sessionId,
        timestamp: new Date().toISOString(),
        queueName: QUEUE_NAME, // Incluir el nombre de la cola para tracking
        // Generar un ID único para la solicitud
        requestId: `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      };
      
      // Llamar a un endpoint de API que maneja la cola existente en Azure
      const response = await fetch(`${API_URL}/api/queue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(queueItem)
      });
      
      // Verificar respuesta
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      console.log('Solicitud encolada con éxito:', result);
      // Guardar ID de solicitud en localStorage para poder verificar estado después
      localStorage.setItem('whatsapp_analyzer_queue_id', queueItem.requestId);
      localStorage.setItem('whatsapp_analyzer_queue_timestamp', queueItem.timestamp);
      
      return {
        success: true,
        requestId: queueItem.requestId,
        message: 'Solicitud encolada con éxito. Será procesada cuando haya disponibilidad.'
      };
    } catch (error) {
      console.error('Error encolando solicitud:', error);
      return {
        success: false,
        error: error.message || 'Error desconocido al encolar la solicitud'
      };
    }
  }

  /**
   * Verifica el estado de una solicitud encolada
   * @param {string} requestId - ID de la solicitud a verificar
   * @returns {Promise<Object>} - Estado de la solicitud
   */
  async checkRequestStatus(requestId) {
    try {
      console.log(`Verificando estado de solicitud ${requestId} en cola: ${QUEUE_NAME}`);
      
      // Obtener estado desde el API que maneja la cola existente
      const response = await fetch(`${API_URL}/api/queue/status/${requestId}?queue=${QUEUE_NAME}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const status = await response.json();
      return status;
    } catch (error) {
      console.error('Error verificando estado de la solicitud:', error);
      return {
        success: false,
        error: error.message || 'Error desconocido al verificar estado'
      };
    }
  }
}

// Exportar una instancia del servicio
export default new AzureQueueService(); 