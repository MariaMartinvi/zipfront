// fileService.js
// Servicio para operaciones con archivos

// Configura la URL base de la API solo para endpoints de Stripe
const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000';

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
    .replace(/\_/g, '_');
  
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
 * Obtiene la respuesta de Azure OpenAI para un chat directamente desde el cliente
 * @param {string} chatContent - Contenido del chat para analizar
 * @param {string} language - Idioma para el análisis (es, en, fr)
 * @returns {Promise<Object>} - Resultado de la operación
 */
export const getAzureResponse = async (chatContent, language = 'es') => {
  try {
    // Recuperar y verificar las credenciales con más detalle
    console.log("Verificando credenciales de Azure OpenAI...");
    const endpoint = getEnvVariable('REACT_APP_AZURE_ENDPOINT');
    const apiKey = getEnvVariable('REACT_APP_AZURE_API_KEY');
    
    // Verificación directa en .env para ayudar en la depuración
    console.log("Variables disponibles en process.env:");
    console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`PUBLIC_URL: ${process.env.PUBLIC_URL || 'no definido'}`);
    console.log(`REACT_APP_API_URL está definida: ${process.env.REACT_APP_API_URL ? 'Sí' : 'No'}`);
    console.log(`REACT_APP_AZURE_ENDPOINT está definida: ${process.env.REACT_APP_AZURE_ENDPOINT ? 'Sí' : 'No'}`);
    console.log(`REACT_APP_AZURE_API_KEY está definida: ${process.env.REACT_APP_AZURE_API_KEY ? 'Sí' : 'No'}`);
    
    if (!endpoint || !apiKey) {
      // Error detallado para ayudar en la depuración
      const mensajeError = `
        Faltan credenciales de Azure OpenAI:
        - Endpoint: ${endpoint ? 'Configurado' : 'Falta'}
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
    
    // Selección del modelo
    const model = "gpt-4o-mini"; // Modelo actual recomendado
    
    // Inicializar el cliente de Azure OpenAI
    const client = new OpenAI({
      apiKey: apiKey,
      baseURL: `${endpoint}openai/deployments/${model}`,
      defaultQuery: { "api-version": "2024-12-01-preview" },
      defaultHeaders: { "api-key": apiKey },
      dangerouslyAllowBrowser: true
    });
    
    // Obtener el prompt en el idioma correspondiente
    const systemPrompt = PROMPTS[language] || PROMPTS['es'];
    const userPrefix = USER_PREFIXES[language] || USER_PREFIXES['es'];
    
    // Preparar los mensajes para la API
    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: `${userPrefix}\n\n${chatContent}` }
    ];
    
    console.log(`Enviando solicitud a Azure OpenAI utilizando modelo: ${model}`);
    
    // Hacer la solicitud a la API
    const response = await client.chat.completions.create({
      model: model,
      messages: messages,
      temperature: 0.5,
      max_tokens: 4000
    });
    
    // Extraer la respuesta
    const analysisResult = response.choices[0].message.content;
    
    return {
      success: true,
      ready: true,
      response: analysisResult
    };
  } catch (error) {
    console.error("Error al analizar el chat con Azure OpenAI:", error);
    
    // Manejar errores específicos
    if (error.status === 429 || error.statusCode === 429) {
      return {
        success: false,
        error: "Límite de solicitudes alcanzado. Por favor, intenta más tarde."
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
