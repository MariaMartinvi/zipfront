// fileService.js
// Servicio para operaciones con archivos

// Las constantes ahora están en el backend
import { userSession } from './utils/userSession';
import { anonymizationService } from './services/anonymizationService';
import unifiedAIService from './services/UnifiedAIService';

// Nota: Esta API_URL ya no se usa para las solicitudes a Azure (que se hacen directamente desde el cliente)
// pero se mantiene por compatibilidad con posibles usos futuros o para otras funciones
// eslint-disable-next-line no-unused-vars
const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000';

/**
 * Procesa el contenido del chat para Azure, reemplazando nombres por iniciales y eliminando fechas
 * @param {string} content - Contenido del chat
 * @returns {Object} - Objeto con el contenido procesado y el mapeo de nombres
 */
const processContentForAzure = (content, userLanguage = 'es') => {
  try {
    let processedContent = content;

    // 1. Primero anonimizar los participantes del chat (necesita el formato original con fechas)
    // USAR IDIOMA DEL USUARIO para mantener consistencia con el prompt
    processedContent = anonymizationService.anonymizeParticipants(processedContent, userLanguage);

    // 2. Limpiar el texto (eliminar fechas, timestamps, etc.) DESPUÉS de identificar participantes
    processedContent = processedContent
      // Eliminar fechas en formato MM/DD/YY o DD/MM/YY
      .replace(/\d{1,2}\/\d{1,2}\/\d{2}/g, '')
      // Eliminar timestamps en formato HH:mm o HH:mm:ss
      .replace(/\d{1,2}:\d{2}(:\d{2})?/g, '')
      // Eliminar corchetes
      .replace(/[\[\]]/g, '')
      // Eliminar guiones
      .replace(/\s*-\s*/g, ' ');

    // 3. Limitar tamaño del contenido después de limpiar fechas
    console.log(`Longitud después de limpiar fechas: ${processedContent.length} caracteres`);
    
    const MAX_CHARS = 20000;
    if (processedContent.length > MAX_CHARS) {
      console.log(`Contenido del chat demasiado largo (${processedContent.length} caracteres), limitando a los últimos ${MAX_CHARS} caracteres`);
      processedContent = "...[Contenido anterior truncado]...\n\n" + processedContent.substring(processedContent.length - MAX_CHARS);
      console.log(`Contenido truncado a ${processedContent.length} caracteres`);
    }

    // 4. Anonimizar personas mencionadas en el contenido
    const detectedLanguage = anonymizationService.detectLanguage(processedContent);
    processedContent = anonymizationService.anonymizeWithPatterns(processedContent, detectedLanguage);

    console.log('🚀🚀🚀 TEXTO QUE SE ENVÍA A AZURE 🚀🚀🚀');
    console.log('████████████████████████████████████████████');
    console.log(processedContent);
    console.log('████████████████████████████████████████████');
    
    const mappings = anonymizationService.getAllMappings();
    console.log('Mapeo de participantes:', mappings.participants);
    console.log('Mapeo de personas mencionadas:', mappings.mentionedPeople);

    // NUEVO: Verificar qué participantes aparecen en el texto final
    const participantesEnTextoFinal = [];
    Object.values(mappings.participants).forEach(participantId => {
      if (processedContent.includes(participantId + ':')) {
        participantesEnTextoFinal.push(participantId);
      }
    });
    console.log('🔍 PARTICIPANTES QUE APARECEN EN TEXTO FINAL:', participantesEnTextoFinal);
    console.log('⚠️ Si Azure analiza más participantes que estos, está inventando nombres');

    return {
      processedContent,
      nameMapping: mappings.participants
    };
  } catch (error) {
    console.error('Error procesando contenido para Azure:', error);
    return {
      processedContent: content,
      nameMapping: {}
    };
  }
};



// Función auxiliar para obtener variables de entorno con un valor fallback
export const getEnvVariable = (name, fallback = null) => {
  // 1. Primero intentar obtener de process.env
  const value = process.env[name];
  
  // Verificar si la variable existe y no está vacía
  if (value !== undefined && value !== null && value !== '') {
    console.log(`Variable ${name} encontrada en process.env: ${value.substring(0, 3)}...`);
    return value;
  }
  
  // 2. Buscar en localStorage (tanto para desarrollo como producción)
    // Convertir REACT_APP_AZURE_ENDPOINT -> azure_endpoint
    const localStorageKey = name
      .toLowerCase()
      .replace('react_app_', '')
      .replace(/_/g, '_'); // No necesita escape ya que _ no es un caracter especial en regex
  
  let localValue = localStorage.getItem(localStorageKey);
  
  // También intentar con prefijo dev_ para compatibilidad con versiones anteriores
  if (!localValue) {
    const devLocalStorageKey = 'dev_' + localStorageKey;
    localValue = localStorage.getItem(devLocalStorageKey);
  }
  
  if (localValue) {
    console.log(`Variable ${name} encontrada en localStorage: ${localValue.substring(0, 3)}...`);
    return localValue;
  }
  
  // 3. Si hay un fallback, usarlo
  if (fallback !== null) {
    console.warn(`ADVERTENCIA: Variable ${name} no encontrada, usando valor de fallback`);
    return fallback;
  }
  
  console.error(`ERROR: Variable ${name} no encontrada o vacía. Buscar en .env o usar panel de configuración.`);
  return null;
};

/**
 * Guarda el chat localmente antes de enviarlo a Azure
 * @param {Object} chatData - Datos del chat a guardar
 * @returns {Promise<void>}
 */
export const saveChatLocally = async (chatData) => {
  try {
    // Verificar si el usuario está autenticado - usar método asíncrono
    console.log("Verificando autenticación para guardar chat...");
    const isAuthenticated = await userSession.isAuthenticatedAsync();
    
    if (!isAuthenticated) {
      throw new Error('Debes iniciar sesión para guardar chats');
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `chat_${timestamp}.json`;
    
    // Agregar información del usuario al chat
    const chatDataWithUser = {
      ...chatData,
      userId: userSession.getCurrentUser()?.uid,
      savedAt: timestamp
    };
    
    // Crear el blob con los datos
    const blob = new Blob([JSON.stringify(chatDataWithUser, null, 2)], { type: 'application/json' });
    
    // Intentar primero con el método moderno de descarga
    try {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.style.display = 'none';
      document.body.appendChild(a);
      
      // Usar un timeout para asegurar que el clic se procesa
      setTimeout(() => {
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
      console.log(`Chat guardado localmente como: ${fileName}`);
    } catch (downloadError) {
      console.warn('Error al descargar con método moderno, intentando método alternativo:', downloadError);
      
      // Método alternativo usando window.open
      const reader = new FileReader();
      reader.onload = function(e) {
        const dataUrl = e.target.result;
        const newWindow = window.open();
        if (newWindow) {
          newWindow.document.write(`
            <html>
              <head>
                <title>${fileName}</title>
              </head>
              <body>
                <a href="${dataUrl}" download="${fileName}">Haz clic aquí para descargar el archivo</a>
              </body>
            </html>
          `);
        } else {
          console.error('No se pudo abrir la ventana de descarga. El navegador puede estar bloqueando las ventanas emergentes.');
        }
      };
      reader.readAsDataURL(blob);
    }
  } catch (error) {
    console.error('Error al guardar el chat localmente:', error);
    throw error; // Ahora propagamos el error para manejarlo en el componente
  }
};

/**
 * Reconstruye los nombres completos en la respuesta de la IA
 * @param {string} response - Respuesta de la IA
 * @param {Object} nameMapping - Mapeo de nombres a iniciales
 * @returns {string} - Respuesta con nombres reconstruidos
 */
/**
 * Limpia la respuesta de Deepseek R1 eliminando el proceso de razonamiento inicial
 * @param {string} response - Respuesta completa de Deepseek R1
 * @returns {string} - Respuesta limpia sin proceso de razonamiento
 */
const cleanDeepseekResponse = (response) => {
  try {
    if (!response || typeof response !== 'string') {
      return response || '';
    }

    // Buscar donde empieza el formato correcto (cualquier ## en Markdown)
    const analysisStartIndex = response.search(/^##\s/m);
    
    if (analysisStartIndex !== -1) {
      // Extraer solo la parte del formato correcto
      const cleanedResponse = response.substring(analysisStartIndex);
      console.log('🧹 Eliminado proceso de razonamiento de Deepseek R1');
      return cleanedResponse;
    }
    
    // Si no encuentra el marcador, devolver la respuesta original
    console.log('⚠️ No se encontró marcador ## - manteniendo respuesta original');
    return response;
  } catch (error) {
    console.error('❌ Error limpiando respuesta de Deepseek:', error);
    return response;
  }
};

const reconstructNames = (response, nameMapping) => {
  try {
    // Verificar que response existe y es una cadena
    if (!response || typeof response !== 'string') {
      console.error('❌ Response es null, undefined o no es string:', response);
      return response || '';
    }
    
    let reconstructedResponse = response;
    
    console.log('🔧 INICIO reconstructNames');
    console.log('📥 NameMapping recibido:', nameMapping);
    
    // Crear un mapeo inverso (de participante ID a nombres completos)
    const inverseMapping = {};
    const participantNumberMapping = {}; // Mapeo por número de participante
    
    Object.entries(nameMapping).forEach(([fullName, participantId]) => {
      inverseMapping[participantId] = fullName;
      
      // Extraer el número del participante (ej: "Participante 1" → 1, "Teilnehmer 2" → 2)
      const numberMatch = participantId.match(/(\d+)/);
      if (numberMatch) {
        const participantNumber = numberMatch[1];
        participantNumberMapping[participantNumber] = fullName;
      }
    });

    console.log('🔄 Mapeo inverso creado:', inverseMapping);
    console.log('🔢 Mapeo por número creado:', participantNumberMapping);

    // 1. Mapear participantes exactos (método original)
    let totalMappings = 0;
    Object.entries(inverseMapping).forEach(([participantId, fullName]) => {
      const beforeReplace = reconstructedResponse;
      
      // Reemplazar con comillas (para JSON)
      reconstructedResponse = reconstructedResponse.replace(
        new RegExp(`"${participantId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'g'),
        `"${fullName}"`
      );
      
      // Reemplazar sin comillas (para texto)
      reconstructedResponse = reconstructedResponse.replace(
        new RegExp(`\\b${participantId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b(?=:|\\s|,|\\.|\\n|$)`, 'g'),
        fullName
      );
      
      if (beforeReplace !== reconstructedResponse) {
        console.log(`✅ Mapeado exacto: "${participantId}" → "${fullName}"`);
        totalMappings++;
      }
    });

    // 2. Mapear participantes en otros idiomas por número (nuevo método)
    const participantWords = [
      'Participante',   // Español (añadir por si acaso)
      'Participant',    // Inglés/Francés
      'Person',         // Inglés alternativo
      'Individual',     // Inglés alternativo
      'User',           // Inglés alternativo
      'Teilnehmer',     // Alemán
      'Partecipante',   // Italiano
      'Partaide',       // Euskera
      'Участник',       // Ruso
      'مشارك',          // Árabe
      '参与者',          // Chino
      '参加者'           // Japonés
    ];
    
    participantWords.forEach(word => {
      Object.entries(participantNumberMapping).forEach(([number, fullName]) => {
        const beforeReplace = reconstructedResponse;
        
        // Patrón para encontrar "Teilnehmer 1", "Participant 2", etc.
        const pattern = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+${number}\\b`, 'g');
        
        // Reemplazar por el nombre completo
        reconstructedResponse = reconstructedResponse.replace(pattern, fullName);
        
        if (beforeReplace !== reconstructedResponse) {
          console.log(`✅ Mapeado por número: "${word} ${number}" → "${fullName}"`);
          totalMappings++;
        }
      });
    });

    console.log(`📊 Total de mappings aplicados: ${totalMappings}`);
    console.log('🔧 FIN reconstructNames');

    return reconstructedResponse;
  } catch (error) {
    console.error('❌ Error reconstruyendo nombres:', error);
    return response;
  }
};

/**
 * DEPRECATED: Esta función ya no se usa - ahora usamos UnifiedAIService
 * @deprecated Use unifiedAIService.getResponse() instead
 */
export const getAzureResponse = async (chatContent, language = 'es') => {
  try {
    // Limpiar variables globales de análisis previo
    window.lastAzureResponse = null;
    window.lastNameMapping = null;

    // Verificar si el usuario está autenticado - usar método asíncrono
    console.log("Verificando autenticación del usuario...");
    const isAuthenticated = await userSession.isAuthenticatedAsync();
    
    if (!isAuthenticated) {
      throw new Error('Debes iniciar sesión para analizar chats');
    }

    console.log("Usuario autenticado correctamente");

    // Recuperar y verificar las credenciales con más detalle
    console.log("Verificando credenciales de Azure OpenAI...");
    const defaultEndpoint = getEnvVariable('REACT_APP_AZURE_ENDPOINT');
    const apiKey = getEnvVariable('REACT_APP_AZURE_API_KEY');
    
    // Verificación directa en .env para ayudar en la depuración
    console.log("Variables disponibles en process.env:");
    console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`PUBLIC_URL: ${process.env.PUBLIC_URL || 'no definido'}`);
    console.log(`REACT_APP_API_URL está definida: ${process.env.REACT_APP_API_URL ? 'Sí' : 'No'}`);
    console.log(`REACT_APP_AZURE_ENDPOINT está definida: ${process.env.REACT_APP_AZURE_ENDPOINT ? 'Sí' : 'No'}`);
    console.log(`REACT_APP_AZURE_API_KEY está definida: ${process.env.REACT_APP_AZURE_API_KEY ? 'Sí' : 'No'}`);
    
    if (!defaultEndpoint || !apiKey) {
      throw new Error('Azure OpenAI credentials not configured');
    }
    
    // AzureService se encarga del fallback automático
    
    // Procesar el contenido completo para anonimización
    console.log(`Longitud original del contenido: ${chatContent.length} caracteres`);
    
    // Procesar los nombres en el contenido completo - PASAR IDIOMA DEL USUARIO
    const { processedContent, nameMapping } = processContentForAzure(chatContent, language);
    console.log(`Longitud después de anonimizar: ${processedContent.length} caracteres`);
    
    // 🔄 USAR NUEVO SISTEMA UNIFICADO (ChatGPT + Mistral con fallback automático)
    console.log('🔄 Usando nuevo sistema unificado ChatGPT + Mistral...');
    
    try {
      const result = await unifiedAIService.getResponse(processedContent, language);
      
      if (result.success) {
        let analysisResult = result.response;
        
        // Limpiar respuesta de Deepseek R1 si es necesario
        if (analysisResult.includes('API UTILIZADA: Deepseek R1')) {
          analysisResult = cleanDeepseekResponse(analysisResult);
        }
        
        // Reconstruir los nombres en la respuesta (MANTENER LÓGICA EXISTENTE)
        analysisResult = reconstructNames(analysisResult, nameMapping);
        
        // Guardar el nameMapping globalmente para uso en otros componentes (como el juego)
        window.lastNameMapping = nameMapping;
        console.log('nameMapping guardado globalmente:', nameMapping);
        
        // Guardar también la respuesta completa para el juego
        window.lastAIResponse = analysisResult;
        console.log('Respuesta de IA guardada globalmente para el juego');
        
        return {
          success: true,
          ready: true,
          response: analysisResult
        };
      } else {
        throw new Error(result.error || 'Error en el sistema de IA');
      }
    } catch (aiServiceError) {
      console.error('❌ Error en el sistema de IA:', aiServiceError);
      
      return {
        success: false,
        error: aiServiceError.message || 'Error al procesar la solicitud con todos los modelos disponibles.'
      };
    }
  } catch (error) {
    console.error("Error al analizar el chat con el sistema de IA:", error);
    
    // Manejar errores específicos
    if (error.status === 429 || error.statusCode === 429) {
      return {
        success: false,
        error: "Límite de solicitudes alcanzado en todas las APIs. Por favor, intenta más tarde."
      };
    } else if (error.status === 401 || error.status === 403 || error.statusCode === 401 || error.statusCode === 403) {
      return {
        success: false,
        error: "Error de autenticación con Azure OpenAI. Verifica las credenciales."
      };
    } else if (error.message && error.message.includes("network")) {
      return {
        success: false,
        error: "Error de conexión con Azure OpenAI. Verifica tu conexión a Internet."
      };
    } else {
      return {
        success: false,
        error: error.message || "Error desconocido al analizar el chat"
      };
    }
  }
};

/**
 * Obtiene la respuesta para el análisis del chat
 * @param {string} chatContent - Contenido del chat
 * @param {string} language - Idioma para el análisis (es, en, fr)
 * @returns {Promise<Object>} - Resultado de la operación
 */
export const getMistralResponse = async (chatContent, language = 'es') => {
  try {
    if (!chatContent) {
      console.error('No se proporcionó contenido del chat para analizar');
      return {
        success: false,
        error: 'No se proporcionó contenido del chat para analizar'
      };
    }
    
    // IMPORTANTE: Procesar y cortar el contenido como hace getAzureResponse
    console.log(`Longitud original del contenido: ${chatContent.length} caracteres`);
    
    // Procesar los nombres en el contenido completo - PASAR IDIOMA DEL USUARIO
    const { processedContent, nameMapping } = processContentForAzure(chatContent, language);
    console.log(`Longitud después de anonimizar: ${processedContent.length} caracteres`);

    // GUARDIA DE PRIVACIDAD: si no se reconoció el formato del chat, el texto aún
    // contiene nombres reales. No se envía nada a la IA.
    const algunParticipanteAnonimizado = Object.values(nameMapping)
      .some(participantId => processedContent.includes(`${participantId}:`));
    if (!algunParticipanteAnonimizado) {
      console.error('🛑 Ningún participante anonimizado en el texto final. No se envía a la IA.');
      return {
        success: false,
        error: 'No se ha reconocido el formato del chat, así que no se ha enviado a la IA para proteger tu privacidad. Vuelve a exportar el chat desde WhatsApp e inténtalo de nuevo.'
      };
    }

    console.log('🔄 Usando nuevo sistema unificado ChatGPT + Mistral...');

    const result = await unifiedAIService.getResponse(processedContent, language);
    
    if (result.success) {
      let analysisResult = result.response;
      
      // Reconstruir los nombres en la respuesta (MANTENER LÓGICA EXISTENTE)
      analysisResult = reconstructNames(analysisResult, nameMapping);
      
      // Guardar el nameMapping globalmente para uso en otros componentes (como el juego)
      window.lastNameMapping = nameMapping;
      console.log('nameMapping guardado globalmente:', nameMapping);
      
      // Guardar también la respuesta completa para el juego
      window.lastAIResponse = analysisResult;
      console.log('Respuesta de IA guardada globalmente para el juego');
      
      return {
        success: true,
        ready: true,
        response: analysisResult
      };
    } else {
      throw new Error(result.error || 'Error en el sistema de IA');
    }
    
    return result;
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Error al obtener la respuesta de análisis'
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
 * Limpia los datos locales relacionados con una operación
 * @param {string} operationId - ID de la operación (opcional, para compatibilidad)
 * @returns {Promise<Object>} - Resultado de la operación
 */
export const deleteFiles = async (operationId) => {
  try {
    console.log(`Limpiando datos locales${operationId ? ` para la operación: ${operationId}` : ''}`);
    
    // Eliminar datos del localStorage relacionados con el análisis
    localStorage.removeItem('whatsapp_analyzer_operation_id');
    localStorage.removeItem('whatsapp_analyzer_loading');
    localStorage.removeItem('whatsapp_analyzer_fetching_mistral');
    localStorage.removeItem('whatsapp_analyzer_show_analysis');
    localStorage.removeItem('whatsapp_analyzer_chatgpt_response');
    localStorage.removeItem('whatsapp_analyzer_analysis_complete');
    localStorage.removeItem('whatsapp_analyzer_mistral_error');
    localStorage.removeItem('whatsapp_analyzer_force_fetch');
    localStorage.removeItem('whatsapp_analyzer_page_refreshed');
    
    console.log('Datos locales eliminados correctamente');
    return {
      success: true,
      message: 'Datos locales eliminados correctamente'
    };
  } catch (error) {
    console.error('Error al limpiar datos locales:', error);
    return {
      success: false,
      error: error.message || 'Error al limpiar datos locales'
    };
  }
}; 