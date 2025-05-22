// fileService.js
// Servicio para operaciones con archivos

// Nota: Esta API_URL ya no se usa para las solicitudes a Azure (que se hacen directamente desde el cliente)
// pero se mantiene por compatibilidad con posibles usos futuros o para otras funciones
// eslint-disable-next-line no-unused-vars
const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000';

/**
 * Procesa el contenido del chat para Azure, reemplazando nombres por iniciales y eliminando fechas
 * @param {string} content - Contenido del chat
 * @returns {Object} - Objeto con el contenido procesado y el mapeo de nombres
 */
const processContentForAzure = (content) => {
  try {
    // Mapa para mantener consistencia en los reemplazos
    const nameMapping = {};
    let processedContent = content;

    // Función para obtener iniciales de un nombre
    const getInitials = (name) => {
      return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase();
    };

    // Procesar el contenido línea por línea
    const lines = processedContent.split('\n');
    const processedLines = lines.map(line => {
      // Patrón para detectar el formato de iOS "[DD/MM/YY, HH:mm:ss] Nombre: Mensaje"
      const iosPattern = /\[(\d{1,2}\/\d{1,2}\/\d{2}), \d{1,2}:\d{1,2}:\d{1,2}\] ([^:]+):/;
      // Patrón para detectar el formato de Android "MM/DD/YY, HH:mm - Nombre: Mensaje"
      const androidPattern = /(\d{1,2}\/\d{1,2}\/\d{2}), \d{1,2}:\d{2} - ([^:]+):/;
      
      const iosMatch = line.match(iosPattern);
      const androidMatch = line.match(androidPattern);
      
      if (iosMatch || androidMatch) {
        const fullName = (iosMatch ? iosMatch[2] : androidMatch[2]).trim();
        
        // Si el nombre contiene un número de teléfono, no lo procesamos
        if (fullName.includes('+') || /^\d/.test(fullName)) {
          console.log('Manteniendo número de teléfono:', fullName);
          return line;
        }
        
        // Si ya procesamos este nombre, usar el mismo reemplazo
        if (nameMapping[fullName]) {
          if (iosMatch) {
            return line.replace(iosMatch[0], `[${iosMatch[1]}] ${nameMapping[fullName]}:`);
          } else {
            return line.replace(androidMatch[0], `${androidMatch[1]} - ${nameMapping[fullName]}:`);
          }
        }
        
        // Crear nuevo reemplazo
        const initials = getInitials(fullName);
        nameMapping[fullName] = initials;
        
        if (iosMatch) {
          return line.replace(iosMatch[0], `[${iosMatch[1]}] ${initials}:`);
        } else {
          return line.replace(androidMatch[0], `${androidMatch[1]} - ${initials}:`);
        }
      }
      
      // Si es un mensaje del sistema (como "You created this group")
      if (line.includes(' - ') || line.includes('] ')) {
        // Mantener el mensaje del sistema pero eliminar la fecha
        const systemMessage = line.split(' - ')[1] || line.split('] ')[1];
        return systemMessage;
      }
      
      return line;
    });

    // Unir las líneas procesadas
    processedContent = processedLines.join('\n');

    // Limpiar el texto
    processedContent = processedContent
      // Eliminar fechas en formato MM/DD/YY o DD/MM/YY
      .replace(/\d{1,2}\/\d{1,2}\/\d{2}/g, '')
      // Eliminar timestamps en formato HH:mm o HH:mm:ss
      .replace(/\d{1,2}:\d{2}(:\d{2})?/g, '')
      // Eliminar corchetes
      .replace(/[\[\]]/g, '')
      // Eliminar guiones
      .replace(/\s*-\s*/g, ' ');

    console.log('Mapeo de nombres:', nameMapping);
    console.log('Contenido procesado:', processedContent);

    return {
      processedContent,
      nameMapping
    };
  } catch (error) {
    console.error('Error procesando contenido para Azure:', error);
    return {
      processedContent: content,
      nameMapping: {}
    };
  }
};

// Configuración de APIs alternativas
const ALTERNATIVE_APIS = [
  {
    "name": "Principal (gpt-4o-mini)",
    "endpoint": null, // Se tomará de la configuración
    "model": "gpt-4o-mini",
    "apiVersion": "2025-01-01-preview",
    "useMaxCompletionTokens": false,
    "useTemperature": true
  },
  {
    "name": "o3-mini",
    "endpoint": null, // Se tomará de la configuración
    "model": "o3-mini",
    "apiVersion": "2025-01-01-preview",
    "useMaxCompletionTokens": true,
    "useTemperature": false
  },
  {
    "name": "Deepseek R1",
    "endpoint": null, // Usando el endpoint principal para evitar problemas DNS
    "model": "deepseek-r1",
    "apiVersion": "2025-01-01-preview",
    "useMaxCompletionTokens": false,
    "useTemperature": true
  }
];

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
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `chat_${timestamp}.json`;
    
    // Crear el blob con los datos
    const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Crear y simular clic en el enlace de descarga
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log(`Chat guardado localmente como: ${fileName}`);
  } catch (error) {
    console.error('Error al guardar el chat localmente:', error);
  }
};

/**
 * Reconstruye los nombres completos en la respuesta de la IA
 * @param {string} response - Respuesta de la IA
 * @param {Object} nameMapping - Mapeo de nombres a iniciales
 * @returns {string} - Respuesta con nombres reconstruidos
 */
const reconstructNames = (response, nameMapping) => {
  try {
    let reconstructedResponse = response;
    
    // Crear un mapeo inverso (de iniciales a nombres)
    const inverseMapping = {};
    Object.entries(nameMapping).forEach(([fullName, initials]) => {
      inverseMapping[initials] = fullName;
    });

    // Reemplazar las iniciales por nombres completos
    Object.entries(inverseMapping).forEach(([initials, fullName]) => {
      // Buscar patrones como "E:" o "E " o "E," o "E." o "E\n" o "E\n\n"
      const pattern = new RegExp(`\\b${initials}\\b(?=:|\\s|,|\\.|\\n|$)`, 'g');
      reconstructedResponse = reconstructedResponse.replace(pattern, fullName);
    });

    return reconstructedResponse;
  } catch (error) {
    console.error('Error reconstruyendo nombres:', error);
    return response;
  }
};

/**
 * Obtiene la respuesta de Azure OpenAI para un chat directamente desde el cliente
 * @param {string} chatContent - Contenido del chat para analizar
 * @param {string} language - Idioma para el análisis (es, en, fr)
 * @returns {Promise<Object>} - Resultado de la operación
 */
export const getAzureResponse = async (chatContent, language = 'es') => {
  try {
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
      // Error detallado para ayudar en la depuración
      const mensajeError = `
        Faltan credenciales de Azure OpenAI:
        - Endpoint: ${defaultEndpoint ? 'Configurado' : 'Falta'}
        - API Key: ${apiKey ? 'Configurada' : 'Falta'}
        
        Por favor, verifica que en tu archivo .env tienes:
        REACT_APP_AZURE_ENDPOINT=https://tu-servicio.openai.azure.com/
        REACT_APP_AZURE_API_KEY=tu-api-key
        
        Ten en cuenta que debes reiniciar el servidor de desarrollo después de modificar el archivo .env
      `;
      
      console.error(mensajeError);
      return {
        success: false,
        error: 'Faltan credenciales de Azure OpenAI. Verifica las variables de entorno y reinicia la aplicación.'
      };
    }
    
    // Importar la librería de OpenAI dinámicamente para no cargarla si no se usa
    const { OpenAI } = await import('openai');
    
    // Prompts multiidioma para diferentes idiomas
    const PROMPTS = {
      'es': `Analiza la conversación proporcionada como un psicólogo observador y con sentido del humor, incisivo y directo. 
      Presenta tu análisis en el siguiente formato, usando markdown para las secciones.
      Es MUY IMPORTANTE que sigas el formato exacto:

      ## 🧠 Análisis de personalidades 

      Para cada persona de la conversación (usa exacestructuradotamente este formato). Intenta que aparezcan en el análisis todas las personas:
      
      ### [Nombre] 
      - **Rol en el grupo:** [Líder/Mediador/Observador/etc]
      - **Rasgos principales:** [Haz una descripción de la personalidad, puedes aportar ejemplos del chat si hacen que la respuesta sea más realista]
      - **Fortalezas:** [1-2 fortalezas]
      - **Áreas de mejora:** [1-2 áreas donde podría mejorar]

      ## 🚩 Señales de alerta
      - [Lista de aspectos preocupantes en la dinámica del grupo, si existen]

      ## 💯 Evaluación de la relación
      - **Puntuación:** [1-10] 
      - **Justificación:** [Breve explicación de la puntuación]
      - **Nivel de confianza:** [Alto/Medio/Bajo]
      - **Dinámica predominante:** [Cooperación/Competencia/Apoyo/etc]

      ## 💡 Recomendaciones
      - [3-4 consejos prácticos para mejorar la dinámica del grupo]

      Asegúrate de ser objetivo, respetuoso y constructivo en tu análisis.`,
      
      'en': `Analyze the provided conversation as an observant psychologist with a sense of humor, incisive and direct.
      Present your analysis in the following format, using markdown for sections.
      It is VERY IMPORTANT that you follow the exact format:

      ## 🧠 Personality Analysis

      For each person in the conversation (use exactly this format). Try to include all people in the analysis:
      
      ### [Name] 
      - **Role in the group:** [Leader/Mediator/Observer/etc]
      - **Main traits:** [Describe the personality, you can provide examples from the chat to make the response more realistic]
      - **Strengths:** [1-2 strengths]
      - **Areas for improvement:** [1-2 areas where they could improve]

      ## 🚩 Warning Signs
      - [List of concerning aspects in the group dynamics, if any]

      ## 💯 Relationship Evaluation
      - **Score:** [1-10] 
      - **Justification:** [Brief explanation of the score]
      - **Confidence level:** [High/Medium/Low]
      - **Predominant dynamic:** [Cooperation/Competition/Support/etc]

      ## 💡 Recommendations
      - [3-4 practical tips to improve group dynamics]

      Make sure to be objective, respectful, and constructive in your analysis.`,
      
      'fr': `Analysez la conversation fournie en tant que psychologue observateur avec un sens de l'humour, incisif et direct.
      Présentez votre analyse dans le format suivant, en utilisant du markdown pour les sections.
      Il est TRÈS IMPORTANT que vous suiviez exactement ce format:

      ## 🧠 Analyse des personnalités

      Pour chaque personne dans la conversation (utilisez exactement ce format). Essayez d'inclure toutes les personnes dans l'analyse:
      
      ### [Nom] 
      - **Rôle dans le groupe:** [Leader/Médiateur/Observateur/etc]
      - **Traits principaux:** [Faites une description de la personnalité, vous pouvez fournir des exemples du chat pour rendre la réponse plus réaliste]
      - **Forces:** [1-2 forces]
      - **Axes d'amélioration:** [1-2 domaines où ils pourraient s'améliorer]

      ## 🚩 Signaux d'alerte
      - [Liste des aspects préoccupants dans la dynamique de groupe, s'il y en a]

      ## 💯 Évaluation de la relation
      - **Score:** [1-10] 
      - **Justification:** [Brève explication du score]
      - **Niveau de confiance:** [Élevé/Moyen/Bas]
      - **Dynamique prédominante:** [Coopération/Compétition/Soutien/etc]

      ## 💡 Recommandations
      - [3-4 conseils pratiques pour améliorer la dynamique de groupe]

      Assurez-vous d'être objectif, respectueux et constructif dans votre analyse.`,
    };

    // Prefijos para instrucciones del usuario multiidioma
    const USER_PREFIXES = {
      'es': "Analiza el siguiente contenido extraído de una conversación:",
      'en': "Analyze the following content extracted from a conversation:",
      'fr': "Analysez le contenu suivant extrait d'une conversation :",
      'de': "Analysieren Sie den folgenden Inhalt aus einem Gespräch:",
      'it': "Analizza il seguente contenuto estratto da una conversazione:"
    };
    
    // Preparar la lista de APIs disponibles
    const apisToTry = ALTERNATIVE_APIS.map(api => ({
      ...api,
      endpoint: api.endpoint || defaultEndpoint
    }));
    
    // Limitar tamaño del contenido antes de enviarlo a la API
    console.log(`Longitud original del contenido: ${chatContent.length} caracteres`);
    
    // Primero procesar los nombres para reducir el tamaño del texto
    const { processedContent, nameMapping } = processContentForAzure(chatContent);
    console.log(`Longitud después de procesar nombres: ${processedContent.length} caracteres`);
    
    // Aplicar limitación de caracteres - tomar solo los últimos 10,000 caracteres
    const MAX_CHARS = 10000;
    let limitedContent = processedContent;
    
    if (processedContent.length > MAX_CHARS) {
      console.log(`Contenido del chat demasiado largo (${processedContent.length} caracteres), limitando a los últimos ${MAX_CHARS} caracteres`);
      limitedContent = "...[Contenido anterior truncado]...\n\n" + processedContent.substring(processedContent.length - MAX_CHARS);
      console.log(`Contenido truncado a ${limitedContent.length} caracteres`);
    }
    
    // Obtener el prompt en el idioma correspondiente
    const systemPrompt = PROMPTS[language] || PROMPTS['es'];
    const userPrefix = USER_PREFIXES[language] || USER_PREFIXES['es'];
    
    // Preparar los mensajes para la API
    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: `${userPrefix}\n\n${limitedContent}` }
    ];

    // Guardar el chat localmente antes de enviarlo
    await saveChatLocally({
      timestamp: new Date().toISOString(),
      messages: messages,
      language: language,
      contentLength: limitedContent.length,
      model: apisToTry[0].model,
      nameMapping // Incluir el mapeo de nombres en el archivo guardado
    });
    
    // Intentar cada API en secuencia
    console.log(`>>> APIs disponibles para fallback: ${apisToTry.length}`);
    for (let i = 0; i < apisToTry.length; i++) {
      const api = apisToTry[i];
      
      console.log(`>>> INTENTANDO CON: ${api.name} (modelo: ${api.model}) [${i+1}/${apisToTry.length}]`);
      console.log(`Enviando solicitud utilizando API: ${api.name}, modelo: ${api.model}`);
      
      // Definir baseURL fuera del bloque try para que esté disponible en el bloque catch
      const baseURL = `${api.endpoint}openai/deployments/${api.model}`;
      console.log(`>>> URL completa para ${api.name}: ${baseURL} (API version: ${api.apiVersion})`);
      
      try {
        // Inicializar el cliente de Azure OpenAI para esta API
        const client = new OpenAI({
          apiKey: apiKey,
          baseURL: baseURL,
          defaultQuery: { "api-version": api.apiVersion },
          defaultHeaders: { "api-key": apiKey },
          dangerouslyAllowBrowser: true,
          timeout: 60000 // 1 minuto es suficiente para el fallback
        });
        
        console.log(`>>> Intentando con ${api.name} (${api.model})...`);
        
        const response = await client.chat.completions.create({
          model: api.model,
          messages: messages,
          temperature: api.useTemperature !== false ? 0.5 : undefined,
          max_tokens: api.useMaxCompletionTokens ? undefined : 4000,
          max_completion_tokens: api.useMaxCompletionTokens ? 4000 : undefined
        });
        
        console.log(`>>> ÉXITO con ${api.name} (modelo: ${api.model})`);
        let analysisResult = response.choices[0].message.content;
        
        // Reconstruir los nombres en la respuesta
        analysisResult = reconstructNames(analysisResult, nameMapping);
        
        const apiHeader = `*****************************************************\n* API UTILIZADA: ${api.name}\n*****************************************************\n\n`;
        return {
          success: true,
          ready: true,
          response: apiHeader + analysisResult
        };
        
      } catch (error) {
        console.error(`>>> ERROR con ${api.name} (${api.model}):`, error);
        
        // Si es error de rate limit y hay más modelos disponibles
        if ((error.status === 429 || error.statusCode === 429 || 
             error.message?.includes("rate limit")) && 
            i < apisToTry.length - 1) {
          console.log(`>>> LÍMITE ALCANZADO con ${api.name} - Pasando a ${apisToTry[i+1].name}...`);
          continue; // Intentar inmediatamente con el siguiente modelo
        }
        
        // Para otros errores, si hay más modelos, continuar
        if (i < apisToTry.length - 1) {
          console.log(`>>> ERROR GENERAL con ${api.name}, probando ${apisToTry[i+1].name}...`);
          continue;
        }
        
        // Si es el último modelo, propagar el error
        throw error;
      }
    }
    
    // Si llegamos aquí, todas las APIs fallaron
    console.error("Todas las APIs disponibles fallaron al procesar la solicitud");
    
    return {
      success: false,
      error: "No pudimos procesar tu solicitud en este momento. Todos los modelos están ocupados o no disponibles. Por favor, intenta más tarde."
    };
  } catch (error) {
    console.error("Error al analizar el chat con Azure OpenAI:", error);
    
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
    
    console.log('Analizando chat con Azure OpenAI');
    return await getAzureResponse(chatContent, language);
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