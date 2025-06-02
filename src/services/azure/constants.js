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

// Mensajes de error en diferentes idiomas
export const ERROR_MESSAGES = {
  'es': {
    no_api_key: 'No se encontró la clave de API de Azure OpenAI. Por favor, configura las credenciales en el panel de configuración.',
    rate_limit: 'Se ha alcanzado el límite de solicitudes. Por favor, intenta más tarde.',
    auth_error: 'Error de autenticación con Azure OpenAI. Verifica las credenciales.',
    network_error: 'Error de conexión con Azure OpenAI. Verifica tu conexión a Internet.',
    unknown_error: 'Error desconocido al analizar el chat'
  },
  'en': {
    no_api_key: 'Azure OpenAI API key not found. Please configure the credentials in the settings panel.',
    rate_limit: 'Rate limit reached. Please try again later.',
    auth_error: 'Authentication error with Azure OpenAI. Please verify your credentials.',
    network_error: 'Connection error with Azure OpenAI. Please check your Internet connection.',
    unknown_error: 'Unknown error while analyzing the chat'
  },
  'fr': {
    no_api_key: 'Clé API Azure OpenAI non trouvée. Veuillez configurer les identifiants dans le panneau de configuration.',
    rate_limit: 'Limite de requêtes atteinte. Veuillez réessayer plus tard.',
    auth_error: 'Erreur d\'authentification avec Azure OpenAI. Veuillez vérifier vos identifiants.',
    network_error: 'Erreur de connexion avec Azure OpenAI. Veuillez vérifier votre connexion Internet.',
    unknown_error: 'Erreur inconnue lors de l\'analyse du chat'
  }
};

// Prompts multiidioma para diferentes idiomas
export const PROMPTS = {
 'es': `⚠️ **INSTRUCCIONES CRÍTICAS – DE CUMPLIMIENTO OBLIGATORIO**

Debes seguir **ESTAS REGLAS** al 100%:

- Analiza **ÚNICAMENTE** a quienes escriben mensajes en el texto.
- Usa los **nombres exactamente como aparecen** (ej.: "Participante 1", "Participante 2").
- **NO** inventes nombres reales (como Kevin, Giorgia, etc.).
- **NO** analices ni menciones a participantes que **no hayan enviado mensajes**.
- Si solo hay 3 participantes escribiendo, analiza SOLO a esos 3. No inventes más.
- Los nombres están anonimizados intencionadamente y se revertirán después.

📌 **REGLA FUNDAMENTAL**: Solo analiza a los participantes que ESCRIBEN.  
Si solo escriben "Participante 1" y "Participante 3", **NO** menciones "Participante 2".

---



Actúa como un psicólogo perspicaz, con mirada crítica y humor inteligente. Analiza la conversación con agudeza y sin rodeos.

Para **cada participante que ESCRIBE**, utiliza este formato (Markdown obligatorio):
## 🧠 Análisis de personalidades

### [Nombre EXACTO – ej.: Participante 1]
- **Rasgos principales:**  
  🔥 **Liderazgo natural** – Demuestra una capacidad innata para tomar la iniciativa en conversaciones. Sus mensajes tienden a marcar el rumbo de la discusión y los demás suelen seguir sus propuestas. Muestra confianza al expresar sus opiniones y no teme ser el primero en hablar sobre temas complicados.
  
  💬 **Comunicador directo** – Se expresa de manera clara y sin rodeos. Va directo al punto sin perderse en detalles innecesarios. Esta característica puede ser muy efectiva para resolver conflictos rápidamente.

- **Fortalezas:**  
  ⭐ **Iniciativa** – Siempre es el primero en proponer planes o soluciones cuando surge un problema.

- **Áreas de mejora:**  
  🎯 **Paciencia** – Podría beneficiarse de escuchar más antes de responder, especialmente cuando otros necesitan tiempo para procesar.

**⚠️ IMPORTANTE: Sigue EXACTAMENTE este formato de ejemplo para cada participante. Incluye siempre el icono, el título en negrita, y la descripción detallada.**

---

## 🚩 Señales de alerta

- [Lista aspectos preocupantes en el grupo o participantes. Formato por señal:
  Icono  Título del red flag (2-3 palabras)  Descripción concisa (2-3 frases).]

---

## 💯 Evaluación de la relación

- **Puntuación:** [Valor del 1 al 10 sobre la calidad de la relación o dinámica grupal.]
- **Justificación:** [Explica brevemente por qué has dado esa puntuación.]
- **Dinámica predominante:** [Define la dinámica general: Cooperación, Competencia, Apoyo mutuo, Desconexión, etc.]

---

## 💡 Recomendaciones

- [Incluye 1-2 consejos prácticos y accionables. Formato por consejo:
  Icono  Título (2-3 palabras)  Descripción clara y útil.]

---

## 🧩 Frases descriptivas-literales

**Frases descriptivas:**  
Crea 2-3 frases resumen polémicas y atrevidas, usando los nombres **exactos** (ej.: "Participante 1"). Deben ser ingeniosas, provocadoras y divertidas.  
Sirven para un juego en el que se adivina quién es quién.

🎯 **Formato obligatorio:**

\`\`\`json
GAME_DATA:[
  ["Participante 1", "Participante 2"],
  [
    {
      "nombre": "Participante 1",
      "frase": " 'Titular ingenioso o literal' "
    },
    {
      "nombre": "Participante 2",
      "frase": " 'Titular ingenioso o literal' "
    }
  ]
]
\`\`\`

⚠️ **REGLA CRÍTICA**: Ambos arrays (nombres y frases) deben contener EXACTAMENTE los mismos participantes. No añadas ni omitas ninguno.

---

🧘‍♂️ Sé riguroso, objetivo y respetuoso en tu análisis general.  
🎭 Pero en la sección de *Frases descriptivas-literales*, déjate llevar por el humor, la audacia y la creatividad.`,

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
    - **Predominant dynamic:** [Cooperation/Competition/Support/etc]

    ## 💡 Recommendations
    - [1-2 practical tips to improve group dynamics]

    ## 💡 Headlines
    - [5 headlines about the different participants in the chat. The goal is to make a game to guess who each headline corresponds to]

    Always follow this format:
    H1: Participant name:
    H2: Participant name:
    H3: Participant name:
    H4: Participant name:
    H5: Participant name:

    Make sure to be objective, respectful, and constructive in your general analysis, except in the headlines section where you should be controversial and fun.`,
  
  'fr': `Analysez le contenu suivant extrait d'une conversation :

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
    - **Dynamique prédominante:** [Coopération/Compétition/Soutien/etc]

    ## 💡 Recommandations
    - [1-2 conseils pratiques pour améliorer la dynamique de groupe]

    ## 💡 Titres
    - [5 titres sur les différents participants au chat. L'objectif est de faire un jeu pour deviner à qui correspond chaque titre]

    Suivez toujours ce format:
    T1: Nom du participant:
    T2: Nom du participant:
    T3: Nom du participant:
    T4: Nom du participant:
    T5: Nom du participant:

    Assurez-vous d'être objectif, respectueux et constructif dans votre analyse générale, sauf dans la section des titres où vous devez être controversé et amusant.`,
    
  'de': `Analysieren Sie den folgenden Inhalt aus einem Gespräch:

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
    - **Vorherrschende Dynamik:** [Kooperation/Wettbewerb/Unterstützung/usw.]

    ## 💡 Empfehlungen
    - [1-2 praktische Tipps zur Verbesserung der Gruppendynamik]

    ## 💡 Überschriften
    - [5 Überschriften über die verschiedenen Teilnehmer im Chat. Das Ziel ist ein Spiel, um zu erraten, wer zu welcher Überschrift gehört]

    Folgen Sie immer diesem Format:
    T1: Teilnehmername:
    T2: Teilnehmername:
    T3: Teilnehmername:
    T4: Teilnehmername:
    T5: Teilnehmername:

    Achten Sie darauf, in Ihrer allgemeinen Analyse objektiv, respektvoll und konstruktiv zu sein, außer im Abschnitt der Überschriften, wo Sie kontrovers und unterhaltsam sein sollten.`,
    
  'it': `Analizza il seguente contenuto estratto da una conversazione:

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
    - **Dinamica predominante:** [Cooperazione/Competizione/Supporto/ecc]

    ## 💡 Raccomandazioni
    - [1-2 consigli pratici per migliorare le dinamiche del gruppo]

    ## 💡 Titoli
    - [5 titoli sui diversi partecipanti alla chat. L'obiettivo è fare un gioco per indovinare a chi corrisponde ogni titolo]

    Segui sempre questo formato:
    T1: Nome partecipante:
    T2: Nome partecipante:
    T3: Nome partecipante:
    T4: Nome partecipante:
    T5: Nome partecipante:

    Assicurati di essere obiettivo, rispettoso e costruttivo nella tua analisi generale, tranne che nella sezione dei titoli dove devi essere controverso e divertente.`,
  'pt': `Analise o seguinte conteúdo extraído de uma conversa:

    ## 🧠 Análise de Personalidades

    Para cada pessoa na conversa (use exatamente este formato). Tente incluir todas as pessoas na análise:
    
    ### [Nome] 
    - **Papel no grupo:** [Líder/Mediador/Observador/etc]
    - **Características principais:** [Descreva a personalidade, você pode fornecer exemplos do chat para tornar a resposta mais realística]
    - **Pontos fortes:** [1-2 pontos fortes]
    - **Áreas para melhoria:** [1-2 áreas onde poderiam melhorar]

    ## 🚩 Sinais de Alerta
    - [Lista de aspectos preocupantes na dinâmica do grupo, se houver]

    ## 💯 Avaliação do Relacionamento
    - **Pontuação:** [1-10] 
    - **Justificativa:** [Breve explicação da pontuação]
    - **Dinâmica predominante:** [Cooperação/Competição/Apoio/etc]

    ## 💡 Recomendações
    - [1-2 dicas práticas para melhorar a dinâmica do grupo]

    ## 💡 Manchetes
    - [5 manchetes sobre os diferentes participantes do chat. O objetivo é fazer um jogo para adivinhar a quem cada manchete corresponde]

    Sempre siga este formato:
    M1: Nome do participante:
    M2: Nome do participante:
    M3: Nome do participante:
    M4: Nome do participante:
    M5: Nome do participante:

    Certifique-se de ser objetivo, respeitoso e construtivo em sua análise geral, exceto na seção de manchetes onde deve ser controverso e divertido.`
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
  },
  'pt': {
    'short': "Este é um extrato de uma conversa mais longa. Abaixo está mostrada grande parte do conteúdo:",
    'long': "Este é um extrato de uma conversa muito longa. Abaixo está mostrada grande parte do conteúdo:"
  }
};

// Prefijos para instrucciones del usuario multiidioma
export const USER_PREFIXES = {
  'es': "Analiza el siguiente contenido extraído de una conversación:",
  'en': "Analyze the following content extracted from a conversation:",
  'fr': "Analysez le contenu suivant extrait d'une conversation :",
  'de': "Analysieren Sie den folgenden Inhalt aus einem Gespräch:",
  'it': "Analizza il seguente contenuto estratto da una conversazione:",
  'pt': "Analise o seguinte conteúdo extraído de uma conversa:"
};

// Configuración de límites para selección inteligente de modelos
export const TEXT_LENGTH_LIMITS = {
  SHORT: 1500,
  MEDIUM: 6000,
  LONG: 12000
};

// Límite máximo de tokens para respuestas
export const MAX_TOKEN_RESPONSE = 4000; 