import React, { useState } from 'react';
import { OpenAI } from 'openai';
import { getEnvVariable } from './fileService';

// Componente para manejar la integración directa con Azure OpenAI desde el cliente
const AzureClientComponent = ({ 
  chatContent, 
  onAnalysisComplete, 
  onError, 
  language = 'es',
  analysisParams = {
    relationshipType: 'general',
    participantsCount: 'auto',
    analysisDepth: 'standard'
  }
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Prompts multiidioma para diferentes idiomas
  const PROMPTS = {
    'es': `Analiza la conversación proporcionada como un psicólogo observador y con sentido del humor, incisivo y directo. 
    Considera los siguientes parámetros para tu análisis:
    - Tipo de relación: ${analysisParams.relationshipType || 'general'}
    - Número de participantes: ${analysisParams.participantsCount || 'auto'}
    - Profundidad del análisis: ${analysisParams.analysisDepth || 'standard'}

    Presenta tu análisis en el siguiente formato, usando markdown para las secciones.
    Es MUY IMPORTANTE que sigas el formato exacto:

    ## 🧠 Análisis de personalidades 

    Para cada persona de la conversación (usa exactamente este formato). Intenta que aparezcan en el análisis todas las personas:
    
    ### [Nombre] 
    - **Rol en el grupo:** [Líder/Mediador/Observador/etc]
    - **Rasgos principales:** [Haz una descripción de la personalidad, puedes aportar ejemplos del chat si hacen que la respuesta sea más realista]
    - **Fortalezas:** [1-2 fortalezas]
    - **Áreas de mejora:** [1-2 áreas donde podría mejorar]
    ${analysisParams.analysisDepth === 'deep' ? '- **Patrones de comunicación:** [Describe sus patrones de comunicación típicos]\n- **Comportamiento emocional:** [Describe cómo expresa y maneja sus emociones]' : ''}

    ## 🚩 Señales de alerta
    - [Lista de aspectos preocupantes en la dinámica del grupo, si existen]

    ## 💯 Evaluación de la relación
    - **Tipo de relación:** [${analysisParams.relationshipType || 'General'}]
    - **Puntuación:** [1-10] 
    - **Justificación:** [Breve explicación de la puntuación]
    - **Nivel de confianza:** [Alto/Medio/Bajo]
    - **Dinámica predominante:** [Cooperación/Competencia/Apoyo/etc]
    ${analysisParams.analysisDepth === 'deep' ? '- **Evolución temporal:** [Describe cómo ha evolucionado la relación a lo largo del tiempo según el chat]\n- **Compatibilidad:** [Analiza la compatibilidad entre los participantes]' : ''}

    ## 🔄 Patrones de interacción
    - **Frecuencia de comunicación:** [Alta/Media/Baja]
    - **Temas recurrentes:** [Lista de 2-3 temas que aparecen con frecuencia]
    - **Conflictos identificados:** [Breve descripción de conflictos, si existen]

    ## 💡 Recomendaciones
    - [3-4 consejos prácticos para mejorar la dinámica del grupo]

    Asegúrate de ser objetivo, respetuoso y constructivo en tu análisis.`,
    
    'en': `Analyze the provided conversation as an observant psychologist with a sense of humor, incisive and direct.
    Consider the following parameters for your analysis:
    - Relationship type: ${analysisParams.relationshipType || 'general'}
    - Number of participants: ${analysisParams.participantsCount || 'auto'}
    - Analysis depth: ${analysisParams.analysisDepth || 'standard'}

    Present your analysis in the following format, using markdown for sections.
    It is VERY IMPORTANT that you follow the exact format:

    ## 🧠 Personality Analysis

    For each person in the conversation (use exactly this format). Try to include all people in the analysis:
    
    ### [Name] 
    - **Role in the group:** [Leader/Mediator/Observer/etc]
    - **Main traits:** [Describe the personality, you can provide examples from the chat to make the response more realistic]
    - **Strengths:** [1-2 strengths]
    - **Areas for improvement:** [1-2 areas where they could improve]
    ${analysisParams.analysisDepth === 'deep' ? '- **Communication patterns:** [Describe their typical communication patterns]\n- **Emotional behavior:** [Describe how they express and handle emotions]' : ''}

    ## 🚩 Warning Signs
    - [List of concerning aspects in the group dynamics, if any]

    ## 💯 Relationship Evaluation
    - **Relationship type:** [${analysisParams.relationshipType || 'General'}]
    - **Score:** [1-10] 
    - **Justification:** [Brief explanation of the score]
    - **Confidence level:** [High/Medium/Low]
    - **Predominant dynamic:** [Cooperation/Competition/Support/etc]
    ${analysisParams.analysisDepth === 'deep' ? '- **Temporal evolution:** [Describe how the relationship has evolved over time according to the chat]\n- **Compatibility:** [Analyze the compatibility between participants]' : ''}

    ## 🔄 Interaction Patterns
    - **Communication frequency:** [High/Medium/Low]
    - **Recurring topics:** [List of 2-3 topics that appear frequently]
    - **Identified conflicts:** [Brief description of conflicts, if any]

    ## 💡 Recommendations
    - [3-4 practical tips to improve group dynamics]

    Make sure to be objective, respectful, and constructive in your analysis.`,
    
    'fr': `Analysez la conversation fournie en tant que psychologue observateur avec un sens de l'humour, incisif et direct.
    Considérez les paramètres suivants pour votre analyse:
    - Type de relation: ${analysisParams.relationshipType || 'générale'}
    - Nombre de participants: ${analysisParams.participantsCount || 'auto'}
    - Profondeur d'analyse: ${analysisParams.analysisDepth || 'standard'}

    Présentez votre analyse dans le format suivant, en utilisant du markdown pour les sections.
    Il est TRÈS IMPORTANT que vous suiviez exactement ce format:

    ## 🧠 Analyse des personnalités

    Pour chaque personne dans la conversation (utilisez exactement ce format). Essayez d'inclure toutes les personnes dans l'analyse:
    
    ### [Nom] 
    - **Rôle dans le groupe:** [Leader/Médiateur/Observateur/etc]
    - **Traits principaux:** [Faites une description de la personnalité, vous pouvez fournir des exemples du chat pour rendre la réponse plus réaliste]
    - **Forces:** [1-2 forces]
    - **Axes d'amélioration:** [1-2 domaines où ils pourraient s'améliorer]
    ${analysisParams.analysisDepth === 'deep' ? '- **Modèles de communication:** [Décrivez leurs modèles de communication typiques]\n- **Comportement émotionnel:** [Décrivez comment ils expriment et gèrent les émotions]' : ''}

    ## 🚩 Signaux d'alerte
    - [Liste des aspects préoccupants dans la dynamique de groupe, s'il y en a]

    ## 💯 Évaluation de la relation
    - **Type de relation:** [${analysisParams.relationshipType || 'Générale'}]
    - **Score:** [1-10] 
    - **Justification:** [Brève explication du score]
    - **Niveau de confiance:** [Élevé/Moyen/Bas]
    - **Dynamique prédominante:** [Coopération/Compétition/Soutien/etc]
    ${analysisParams.analysisDepth === 'deep' ? '- **Évolution temporelle:** [Décrivez comment la relation a évolué au fil du temps selon le chat]\n- **Compatibilité:** [Analysez la compatibilité entre les participants]' : ''}

    ## 🔄 Modèles d'interaction
    - **Fréquence de communication:** [Élevée/Moyenne/Basse]
    - **Sujets récurrents:** [Liste de 2-3 sujets qui apparaissent fréquemment]
    - **Conflits identifiés:** [Brève description des conflits, s'il y en a]

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

  // Función para seleccionar el modelo óptimo basado en la longitud del texto
  const selectOptimalModel = (textLength) => {
    // Por ahora, usamos exclusivamente gpt-4o-mini que tiene la mejor relación rendimiento/costo
    return "gpt-4o-mini";
  };

  // Función principal para analizar el chat
  const analyzeChat = async () => {
    if (!chatContent) {
      onError("No hay contenido de chat para analizar");
      return;
    }

    try {
      setIsAnalyzing(true);
      
      // Obtener el prompt en el idioma correspondiente
      const systemPrompt = PROMPTS[language] || PROMPTS['es'];
      const userPrefix = USER_PREFIXES[language] || USER_PREFIXES['es'];
      
      // Calcular longitud del contenido
      const contentLength = chatContent.length;
      
      // Seleccionar modelo basado en la longitud
      const model = selectOptimalModel(contentLength);
      
      // Obtener credenciales de las variables de entorno o localStorage
      const endpoint = getEnvVariable('REACT_APP_AZURE_ENDPOINT');
      const apiKey = getEnvVariable('REACT_APP_AZURE_API_KEY');
      
      console.log(`Endpoint Azure: ${endpoint ? 'Configurado correctamente' : 'No configurado'}`);
      console.log(`Clave API: ${apiKey ? 'Configurada correctamente' : 'No configurada'}`);
      
      if (!endpoint || !apiKey) {
        // Mostrar un mensaje de error más útil que indique cómo configurar
        const errorMsg = 
          "Faltan credenciales de Azure OpenAI. Presiona Ctrl+Shift+A para abrir el panel de configuración y añadir tus credenciales.";
        console.error(errorMsg);
        onError(errorMsg);
        setIsAnalyzing(false);
        return;
      }
      
      // Inicializar el cliente de Azure OpenAI usando la biblioteca openai actualizada
      const client = new OpenAI({
        apiKey: apiKey,
        baseURL: `${endpoint}openai/deployments/${model}`,
        defaultQuery: { "api-version": "2024-12-01-preview" },
        defaultHeaders: { "api-key": apiKey },
        dangerouslyAllowBrowser: true
      });
      
      console.log(`Analizando chat con modelo ${model}, longitud: ${contentLength} caracteres`);
      
      // Preparar los mensajes para la API
      const messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: `${userPrefix}\n\n${chatContent}` }
      ];
      
      console.log("Enviando solicitud a Azure OpenAI...");
      
      // Hacer la solicitud a la API
      const response = await client.chat.completions.create({
        model: model,
        messages: messages,
        temperature: 0.5,
        max_tokens: 4000
      });
      
      console.log("Respuesta recibida correctamente");
      
      // Extraer la respuesta
      const analysisResult = response.choices[0].message.content;
      
      // Pasar los resultados al componente padre
      onAnalysisComplete(analysisResult);
      
    } catch (error) {
      console.error("Error al analizar el chat con Azure OpenAI:", error);
      
      // Mostrar detalles técnicos del error para diagnóstico
      console.log("Detalles técnicos del error:", {
        mensaje: error.message,
        tipo: error.constructor.name,
        código: error.status || error.statusCode,
        respuesta: error.response?.data || error.response?.body,
        stack: error.stack
      });
      
      // Manejar errores específicos
      if (error.status === 429 || error.statusCode === 429) {
        onError("Límite de solicitudes alcanzado. Por favor, intenta más tarde.");
      } else if (error.status === 401 || error.status === 403 || error.statusCode === 401 || error.statusCode === 403) {
        onError("Error de autenticación con Azure OpenAI. Verifica las credenciales con Ctrl+Shift+A.");
      } else if (error.message && error.message.includes("network")) {
        onError("Error de conexión con Azure OpenAI. Verifica tu conexión a Internet.");
      } else {
        onError(`Error al analizar el chat: ${error.message || "Error desconocido"}`);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Iniciar análisis automáticamente cuando recibimos contenido
  React.useEffect(() => {
    if (chatContent && !isAnalyzing) {
      analyzeChat();
    }
  }, [chatContent]);

  return (
    <div style={{ display: 'none' }}>
      {/* Componente invisible que solo maneja la lógica */}
    </div>
  );
};

export default AzureClientComponent; 