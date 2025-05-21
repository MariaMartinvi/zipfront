/**
 * constants.js - Constantes para el servicio de Azure
 * 
 * Este archivo contiene todas las configuraciones, prompts y mensajes utilizados
 * por el servicio de integración con Azure OpenAI.
 */

// APIs alternativas para el sistema de fallback
export const ALTERNATIVE_APIS = [
  {
    "name": "Deepseek R1",
    "endpoint": "https://deepseek-r1-api-swedencentral.openai.azure.com/",
    "model": "deepseek-r1",
    "apiVersion": "2023-05-15"
  },
  {
    "name": "o3-mini",
    "endpoint": "https://maria-mamb5wlq-swedencentral.cognitiveservices.azure.com/",
    "model": "o3-mini",
    "apiVersion": "2025-01-01-preview"
  }
  // Se pueden añadir más APIs según sea necesario
];

// Prompts multiidioma para diferentes idiomas
export const PROMPTS = {
  'es': `Analiza la conversación proporcionada como un psicólogo observador y con sentido del humor, incisivo y directo. 
    Presenta tu análisis en el siguiente formato , usando markdown para las secciones.
    Es MUY IMPORTANTE que sigas el formato exacto:

    ## 🧠 Análisis de personalidades 

    Para cada persona de la conversación (usa exacestructuradotamente este formato). Intenta que aparezcan en el análisis todas las personas:
    
    ### [Nombre] 
    - **Rol en el grupo:** [Líder/Mediador/Observador/etc]
    - **Rasgos principales:** [Haz una descripción de la personalidad, puedes aportar ejemplos del chat si hacen que la respuesta sea más realista]
    - **Fortalezas:** [1-2 fortalezas]
    - **Áreas de mejora:** [1-2 áreas donde podría mejorar]

    Ejemplos de formato correcto para nombres:
    ### Laura Mateos 
    ### Maria Martín 
    ### Juan Pérez 

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

    Examples of correct format for names:
    ### Laura Mateos 
    ### Maria Martín 
    ### John Smith 

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

    Exemples de format correct pour les noms:
    ### Laura Mateos 
    ### Maria Martín 
    ### Jean Dupont 

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
    
  'de': `Analysieren Sie das bereitgestellte Gespräch als aufmerksamer Psychologe mit Humor, scharfsinnig und direkt.
    Präsentieren Sie Ihre Analyse im folgenden Format und verwenden Sie Markdown für die Abschnitte.
    Es ist SEHR WICHTIG, dass Sie das genaue Format einhalten:

    ## 🧠 Persönlichkeitsanalyse

    Für jede Person im Gespräch (verwenden Sie genau dieses Format). Versuchen Sie, alle Personen in die Analyse einzubeziehen:
    
    ### [Name] 
    - **Rolle in der Gruppe:** [Anführer/Vermittler/Beobachter/usw.]
    - **Hauptmerkmale:** [Beschreiben Sie die Persönlichkeit, Sie können Beispiele aus dem Chat anführen, um die Antwort realistischer zu gestalten]
    - **Stärken:** [1-2 Stärken]
    - **Verbesserungsbereiche:** [1-2 Bereiche, in denen sie sich verbessern könnten]

    ## 🚩 Warnsignale
    - [Liste der besorgniserregenden Aspekte in der Gruppendynamik, falls vorhanden]

    ## 💯 Beziehungsbewertung
    - **Punktzahl:** [1-10] 
    - **Begründung:** [Kurze Erklärung der Punktzahl]
    - **Vertrauensniveau:** [Hoch/Mittel/Niedrig]
    - **Vorherrschende Dynamik:** [Kooperation/Wettbewerb/Unterstützung/usw.]

    ## 💡 Empfehlungen
    - [3-4 praktische Tipps zur Verbesserung der Gruppendynamik]

    Achten Sie darauf, in Ihrer Analyse objektiv, respektvoll und konstruktiv zu sein.`,
    
  'it': `Analizza la conversazione fornita come uno psicologo osservatore con senso dell'umorismo, incisivo e diretto.
    Presenta la tua analisi nel seguente formato, utilizzando il markdown per le sezioni.
    È MOLTO IMPORTANTE che tu segua esattamente questo formato:

    ## 🧠 Analisi delle personalità

    Per ogni persona nella conversazione (usa esattamente questo formato). Cerca di includere tutte le persone nell'analisi:
    
    ### [Nome] 
    - **Ruolo nel gruppo:** [Leader/Mediatore/Osservatore/ecc]
    - **Tratti principali:** [Descrivi la personalità, puoi fornire esempi dalla chat per rendere la risposta più realistica]
    - **Punti di forza:** [1-2 punti di forza]
    - **Aree di miglioramento:** [1-2 aree in cui potrebbero migliorare]

    ## 🚩 Segnali di allerta
    - [Elenco degli aspetti preoccupanti nelle dinamiche del gruppo, se presenti]

    ## 💯 Valutazione della relazione
    - **Punteggio:** [1-10] 
    - **Giustificazione:** [Breve spiegazione del punteggio]
    - **Livello di fiducia:** [Alto/Medio/Basso]
    - **Dinamica predominante:** [Cooperazione/Competizione/Supporto/ecc]

    ## 💡 Raccomandazioni
    - [3-4 consigli pratici per migliorare le dinamiche del gruppo]

    Assicurati di essere obiettivo, rispettoso e costruttivo nella tua analisi.`
};

// Mensajes de error multiidioma
export const ERROR_MESSAGES = {
  'es': {
    'no_api_key': "Error: No se ha configurado la clave API de Azure. Por favor, configura la variable de entorno AZURE_API_KEY.",
    'error_title': "## 🚨 Error en el Análisis",
    'error_message': "Lo sentimos, no pudimos completar el análisis de la conversación debido a un problema técnico.",
    'error_details': "**Detalles del error:**",
    'try_again': "Por favor, intenta nuevamente más tarde o contacta al soporte técnico si el problema persiste."
  },
  'en': {
    'no_api_key': "Error: No Azure API key configured. Please set the AZURE_API_KEY environment variable.",
    'error_title': "## 🚨 Analysis Error",
    'error_message': "We're sorry, we couldn't complete the conversation analysis due to a technical issue.",
    'error_details': "**Error details:**",
    'try_again': "Please try again later or contact technical support if the problem persists."
  },
  'fr': {
    'no_api_key': "Erreur : Clé API Azure non configurée. Veuillez définir la variable d'environnement AZURE_API_KEY.",
    'error_title': "## 🚨 Erreur d'Analyse",
    'error_message': "Nous sommes désolés, nous n'avons pas pu compléter l'analyse de la conversation en raison d'un problème technique.",
    'error_details': "**Détails de l'erreur :**",
    'try_again': "Veuillez réessayer plus tard ou contacter le support technique si le problème persiste."
  },
  'de': {
    'no_api_key': "Fehler: Kein Azure-API-Schlüssel konfiguriert. Bitte setzen Sie die Umgebungsvariable AZURE_API_KEY.",
    'error_title': "## 🚨 Analysefehler",
    'error_message': "Es tut uns leid, wir konnten die Konversationsanalyse aufgrund eines technischen Problems nicht abschließen.",
    'error_details': "**Fehlerdetails:**",
    'try_again': "Bitte versuchen Sie es später erneut oder kontaktieren Sie den technischen Support, wenn das Problem weiterhin besteht."
  },
  'it': {
    'no_api_key': "Errore: Nessuna chiave API Azure configurata. Imposta la variabile di ambiente AZURE_API_KEY.",
    'error_title': "## 🚨 Errore di Analisi",
    'error_message': "Siamo spiacenti, non è stato possibile completare l'analisi della conversazione a causa di un problema tecnico.",
    'error_details': "**Dettagli dell'errore:**",
    'try_again': "Riprova più tardi o contatta il supporto tecnico se il problema persiste."
  }
};

// Mensajes de truncamiento multiidioma
export const TRUNCATION_MESSAGES = {
  'es': {
    'short': "Este es un extracto de una conversación más larga. A continuación se muestra gran parte del contenido:",
    'long': "Este es un extracto de una conversación muy larga. A continuación se muestra gran parte del contenido:"
  },
  'en': {
    'short': "This is an extract from a longer conversation. Below is much of the content:",
    'long': "This is an extract from a very long conversation. Below is much of the content:"
  },
  'fr': {
    'short': "Ceci est un extrait d'une conversation plus longue. Voici une grande partie du contenu :",
    'long': "Ceci est un extrait d'une très longue conversation. Voici une grande partie du contenu :"
  },
  'de': {
    'short': "Dies ist ein Auszug aus einer längeren Konversation. Im Folgenden wird ein großer Teil des Inhalts angezeigt:",
    'long': "Dies ist ein Auszug aus einer sehr langen Konversation. Im Folgenden wird ein großer Teil des Inhalts angezeigt:"
  },
  'it': {
    'short': "Questo è un estratto di una conversazione più lunga. Di seguito è riportata gran parte del contenuto:",
    'long': "Questo è un estratto di una conversazione molto lunga. Di seguito è riportata gran parte del contenuto:"
  }
};

// Prefijos para instrucciones del usuario multiidioma
export const USER_PREFIXES = {
  'es': "Analiza el siguiente contenido extraído de una conversación:",
  'en': "Analyze the following content extracted from a conversation:",
  'fr': "Analysez le contenu suivant extrait d'une conversation :",
  'de': "Analysieren Sie den folgenden Inhalt aus einem Gespräch:",
  'it': "Analizza il seguente contenuto estratto da una conversazione:"
};

// Configuración de límites para selección inteligente de modelos
export const TEXT_LENGTH_LIMITS = {
  SHORT: 1500,
  MEDIUM: 6000,
  LONG: 12000
};

// Límite máximo de tokens para respuestas
export const MAX_TOKEN_RESPONSE = 4000; 