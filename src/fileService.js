// fileService.js
// Servicio para operaciones con archivos

// Configura la URL base de la API (usa la misma que en tu App.js)
const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000';


/**
 * Obtiene la respuesta de Mistral para una operación
 * @param {string} operationId - ID de la operación
 * @returns {Promise<Object>} - Resultado de la operación
 */
export const getMistralResponse = async (operationId) => {
  try {
    const response = await fetch(`${API_URL}/api/mistral-response/${operationId}`);
    const data = await response.json();
    
    return {
      success: true,
      data: data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Error al obtener la respuesta de Mistral'
    };
  }
};

/**
 * Función para registro de depuración, compatible con el sistema de debug de la App
 * @param {Function} addDebugMessage - Función para añadir mensajes de debug
 * @param {string} message - Mensaje a registrar
 */
export const logDebug = (addDebugMessage, message) => {
  if (typeof addDebugMessage === 'function') {
    addDebugMessage(message);
  }
  console.log('[FileService]', message);
};

/**
 * Elimina los archivos asociados a una operación del servidor
 * @param {string} operationId - ID de la operación cuyos archivos se eliminarán
 * @returns {Promise<Object>} - Resultado de la operación
 */
export const deleteFiles = async (operationId) => {
  try {
    console.log(`Eliminando archivos para la operación: ${operationId}`);
    
    const response = await fetch(`${API_URL}/api/delete-files/${operationId}`, {
      method: 'DELETE',
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Error al eliminar los archivos:', data.error);
      return {
        success: false,
        error: data.error || 'Error al eliminar los archivos'
      };
    }
    
    console.log('Archivos eliminados correctamente');
    return {
      success: true,
      message: data.message || 'Archivos eliminados correctamente'
    };
  } catch (error) {
    console.error('Error al eliminar los archivos:', error);
    return {
      success: false,
      error: error.message || 'Error al eliminar los archivos'
    };
  }
};
