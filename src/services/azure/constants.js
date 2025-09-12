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
    "endpoint": "https://maria-mamb5wlq-swedencentral.services.ai.azure.com/models",
    "model": "DeepSeek-R1",
    "apiVersion": "2024-05-01-preview",
    "keyVariable": "REACT_APP_AZURE_API_KEY_DEEPSEEK",
    "useMaxCompletionTokens": false,
    "useTemperature": true
  },
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
  }
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
 'es': `📋 **ESPECIFICACIONES TÉCNICAS DEL ANÁLISIS**

     🔧 **FORMATO TÉCNICO REQUERIDO**: Tu respuesta será procesada automáticamente por un sistema que:
   - Usa los símbolos ## para generar CSS y estructura HTML
   - Parsea los símbolos ** para identificar títulos y secciones  
   - Extrae datos JSON específicos para funcionalidades de la aplicación
   - Requiere consistencia exacta en el formato Markdown

  📝 **INICIO TÉCNICO REQUERIDO**: La respuesta debe comenzar directamente con:
  "## Análisis de personalidades"
  
  (Cualquier texto antes de esta línea romperá el procesamiento automático del sistema)

  🎯 **ESPECIFICACIONES DE ANÁLISIS** que debes seguir:
  
  - Analiza **ÚNICAMENTE** a los participantes que **escriben mensajes**.
  - Usa los nombres **exactamente como aparecen** (ej.: "Participante 1", "Participante 2").
  - **🔒 CRUCIAL: Usa las designaciones de participantes como te llegan**. Mantén consistencia en la nomenclatura a lo largo de tu respuesta.
  
  🏥 **INTEGRIDAD DEL ANÁLISIS PSICOLÓGICO**: 
  - **NO inventes nombres reales** (como Kevin, Giorgia, etc.) - esto comprometería la credibilidad científica del análisis
  - Al tratarse de un análisis psicológico profesional, la precisión en la identificación de participantes es fundamental para mantener la validez del estudio
  - Los nombres están anonimizados intencionalmente por razones de privacidad y ética profesional
  
  - **NO analices ni menciones** a quienes **no hayan enviado ningún mensaje**.
  - Si solo participan 3 personas escribiendo, analiza **solo a esas 3**. No agregues más.
  - Los nombres están anonimizados de forma intencional y se revertirán luego.
  
  📌 **REGLA FUNDAMENTAL:** Si solo escriben "Participante 1" y "Participante 3", **NO menciones ni analices a "Participante 2"**.
  
  ---
  
  🎭 **Rol:** Actúa como un psicólogo especializado en análisis de comunicación grupal, con enfoque científico, agudeza emocional y capacidad de síntesis. Tu análisis debe ser preciso, fundamentado y profesional.
  
  Para **cada participante que escribe**, sigue **ESTE FORMATO OBLIGATORIO en Markdown**:
  
  ##  Análisis de personalidades
  
  ### [Nombre EXACTO – ej.: Participante 1]
  - **Rasgos principales:**  
    [Icono apropiado] **[Etiqueta llamativa]** – Descripción breve pero potente de su estilo comunicativo o personalidad predominante.  
    [Icono apropiado] **[Etiqueta llamativa]** – Otro rasgo clave, analizado con inteligencia y sin rodeos.
  
  - **Fortalezas:**  
    [Icono apropiado] **[Fortaleza clara]** – Describe un punto fuerte visible en su forma de relacionarse o comunicarse.
  
  - **Áreas de mejora:**  
    [Icono apropiado] **[Área a mejorar]** – Sugiere una mejora concreta, útil y basada en el estilo observado.
  
  ⚠️ **IMPORTANTE:** Sigue este formato exactamente. Selecciona iconos apropiados que representen cada característica específica (ej.: ⚡ para alguien directo, 💝 para alguien empático, 📋 para alguien organizado, 🎨 para alguien creativo, etc.). No uses siempre los mismos iconos.
  
  ---
  
  ## Análisis de la relación
  
  ### 🚩 **Señales de Alerta**

  - [Lista patrones problemáticos o señales de advertencia observados en el grupo o en dinámicas entre participantes. Usa este formato:]  
    🚩 **[Señal de alerta específica]** – Descripción clara del patrón problemático en 2-3 frases.
  
  ---
  
  ### 💯 **Evaluación de la relación**
  
  - **Puntuación general:** [Valor entre 1 y 10 sobre la calidad del vínculo o dinámica.]
  - **Justificación:** [Explica brevemente por qué merece esa puntuación.]
  - **Dinámica predominante:** [Ej.: Cooperación, Competencia, Apoyo mutuo, Tensión soterrada, Desconexión.]
  
  ---
  
  ### 💡 **Recomendaciones**
  
  - [Incluye 1 o 2 consejos prácticos. Formato:]  
    [Icono apropiado] **[Consejo breve]** – Explicación útil y accionable, orientada a mejorar la dinámica grupal.
  
  ---
  
  ## Frases descriptivas-literales
  
  **Frases resumen:**  
  Redacta 4 o 5 frases descriptivas y características que resuman el estilo de cada participante.  
  Usa los nombres exactos (ej.: "Participante 1"). Sirven para un juego en que se adivina quién es quién.
  
  🎯 **Formato obligatorio:**
  
  ### 🎯 Datos juego 
  json
  GAME_DATA:[
    ["Participante 1", "Participante 2"],
    [
      {
        "nombre": "Participante 1",
        "frase": " 'Frase ingeniosa o literal' "
      },
      {
        "nombre": "Participante 2",
        "frase": " 'Frase ingeniosa o literal' "
      }
    ]
  ]
   
  ---
  ⚠️ REGRA CRÍTICA: Ambas listas (nombres y frases) deben tener EXACTAMENTE los mismos participantes. Ni más, ni menos.

  🧘‍♂️ Mantén un enfoque riguroso, objetivo y empático en el análisis psicológico.
  🎭 En las frases descriptivas, utiliza un estilo perspicaz y profesional que capture la esencia comunicativa.
  
  🎯 **RECORDATORIO TÉCNICO: INICIA CON:**
  "## Análisis de personalidades"
  
  (El sistema de procesamiento requiere este inicio exacto para funcionar correctamente)`,

  'en': `📋 **TECHNICAL ANALYSIS SPECIFICATIONS**

  🔧 **TECHNICAL FORMAT REQUIRED**: Your response will be automatically processed by a system that:
  - Uses ## symbols to generate CSS and HTML structure
  - Parses ** symbols to identify titles and sections
  - Extracts specific JSON data for application functionality
  - Requires exact consistency in Markdown format

  📝 **TECHNICAL START REQUIRED**: The response must begin directly with:
  "## Personality Analysis"
  
  (Any text before this line will break the system's automatic processing)

  🎯 **ANALYSIS SPECIFICATIONS** you must follow:
  
  - Analyze **ONLY** participants who **write messages**.
  - Use names **exactly as they appear** (e.g.: "Participant 1", "Participant 2").
  - **🔒 CRUCIAL: Use the participant designations as they come to you**. Maintain consistency in naming throughout your response.
  
  🏥 **PSYCHOLOGICAL ANALYSIS INTEGRITY**: 
  - **DO NOT invent real names** (like Kevin, Giorgia, etc.) - this would compromise the scientific credibility of the analysis
  - As this is a professional psychological analysis, precision in participant identification is fundamental to maintain study validity
  - Names are intentionally anonymized for privacy and professional ethics reasons
  
  - **DO NOT analyze or mention** those who **haven't sent any message**.
  - If only 3 people participate writing, analyze **only those 3**. Don't add more.
  - Names are intentionally anonymized and will be reverted later.
  
  📌 **FUNDAMENTAL RULE:** If only "Participant 1" and "Participant 3" write, **DO NOT mention or analyze "Participant 2"**.
  
  ---
  
  🎭 **Role:** Act as a specialized communication group analyst, with scientific approach, emotional acuity and synthesis capacity. Your analysis should be precise, evidence-based and professional.
  
  For **each participant who writes**, follow **THIS MANDATORY FORMAT in Markdown**:
  
  ##  Personality Analysis
  
  ### [EXACT Name – e.g.: Participant 1]
  - **Main traits:**  
    [Appropriate icon] **[Eye-catching label]** – Brief but powerful description of their communicative style or predominant personality.  
    [Appropriate icon] **[Eye-catching label]** – Another key trait, analyzed with intelligence and without beating around the bush.
  
  - **Strengths:**  
    [Appropriate icon] **[Clear strength]** – Describe a strong point visible in their way of relating or communicating.
  
  - **Areas for improvement:**  
    [Appropriate icon] **[Area to improve]** – Suggest a concrete, useful improvement based on the observed style.
  
  ⚠️ **IMPORTANT:** Follow this format exactly. Select appropriate icons that represent each specific characteristic (e.g.: ⚡ for someone direct, 💝 for someone empathetic, 📋 for someone organized, 🎨 for someone creative, etc.). Don't always use the same icons.
  
  ---
  
  ## Relationship Analysis
  
  ### 🚩 **Red Flags**

  - [List problematic patterns or warning signs observed in the group or in dynamics between participants. Use this format:]  
    🚩 **[Specific red flag]** – Clear description of the problematic pattern in 2-3 sentences.
  
  ---
  
  ### 💯 **Relationship evaluation**
  
  - **Overall score:** [Value between 1 and 10 on the quality of the bond or dynamic.]
  - **Justification:** [Briefly explain why it deserves that score.]
  - **Predominant dynamic:** [E.g.: Cooperation, Competition, Mutual support, Hidden tension, Disconnection.]
  
  ---
  
  ### 💡 **Recommendations**
  
  - [Include 1 or 2 practical tips. Format:]  
    [Icono apropiado] **[Brief advice]** – Useful and actionable explanation, oriented to improve group dynamics.
  
  ---
  
  ## Descriptive-literal phrases
  
  **Summary phrases:**  
  Write 4 or 5 descriptive and characteristic phrases that summarize each participant's style.  
  Use exact names (e.g.: "Participant 1"). They serve for a game where you guess who is who.
  
  🎯 **Mandatory format:**
  
  ### 🎯 Game data 
  json
  GAME_DATA:[
    ["Participant 1", "Participant 2"],
    [
      {
        "nombre": "Participant 1",
        "frase": " 'Witty or literal phrase' "
      },
      {
        "nombre": "Participant 2",
        "frase": " 'Witty or literal phrase' "
      }
    ]
  ]
   
  ---
  ⚠️ CRITICAL RULE: Both lists (names and phrases) must have EXACTLY the same participants. No more, no less.

  🧘‍♂️ Maintain a rigorous, objective and empathetic approach in the psychological analysis.
  🎭 In the descriptive phrases, use an insightful and professional style that captures the communicative essence.`,
  
  'fr': `📋 **SPÉCIFICATIONS TECHNIQUES DE L'ANALYSE**

  🔧 **FORMAT TECHNIQUE REQUIS**: Votre réponse sera traitée automatiquement par un système qui:
  - Utilise les symboles ## pour générer la structure CSS et HTML
  - Parse les symboles ** pour identifier les titres et sections
  - Extrait des données JSON spécifiques pour les fonctionnalités de l'application
  - Nécessite une cohérence exacte dans le format Markdown

  📝 **DÉBUT TECHNIQUE REQUIS**: La réponse doit commencer directement par:
  "## Analyse des personnalités"
  
  (Tout texte avant cette ligne cassera le traitement automatique du système)

  🎯 **SPÉCIFICATIONS D'ANALYSE** que vous devez suivre:
  
  - Analysez **UNIQUEMENT** les participants qui **écrivent des messages**.
  - Utilisez les noms **exactement comme ils apparaissent** (ex. : "Participant 1", "Participant 2").
  - **🔒 CRUCIAL : Utilisez les désignations de participants comme elles vous arrivent**. Maintenez la cohérence dans la nomenclature tout au long de votre réponse.
  
  🏥 **INTÉGRITÉ DE L'ANALYSE PSYCHOLOGIQUE**: 
  - **N'inventez PAS de vrais noms** (comme Kevin, Giorgia, etc.) - cela compromettrait la crédibilité scientifique de l'analyse
  - S'agissant d'une analyse psychologique professionnelle, la précision dans l'identification des participants est fondamentale pour maintenir la validité de l'étude
  - Les noms sont intentionnellement anonymisés pour des raisons de confidentialité et d'éthique professionnelle
  
  - **N'analysez pas et ne mentionnez pas** ceux qui **n'ont envoyé aucun message**.
  - Si seulement 3 personnes participent en écrivant, analysez **seulement ces 3**. N'en ajoutez pas plus.
  - Les noms sont intentionnellement anonymisés et seront rétablis plus tard.
  
  📌 **RÈGLE FONDAMENTALE :** Si seulement "Participant 1" et "Participant 3" écrivent, **NE mentionnez pas et n'analysez pas "Participant 2"**.
  
  ---
  
  🎭 **Rôle :** Agissez comme un spécialiste en analyse de communication de groupe, avec une approche scientifique, une acuité émotionnelle et une capacité de synthèse. Votre analyse doit être précise, fondée sur des preuves et professionnelle.
  
  Pour **chaque participant qui écrit**, suivez **CE FORMAT OBLIGATOIRE en Markdown** :
  
  ##  Analyse des personnalités
  
  ### [Nom EXACT – ex. : Participant 1]
  - **Traits principaux :**  
    [Icono apropiado] **[Étiquette accrocheuse]** – Description brève mais puissante de leur style communicatif ou personnalité prédominante.  
    [Icono apropiado] **[Étiquette accrocheuse]** – Un autre trait clé, analysé avec intelligence et sans détours.
  
  - **Forces :**  
    [Icono apropiado] **[Force claire]** – Décrivez un point fort visible dans leur façon de se rapporter ou de communiquer.
  
  - **Domaines d'amélioration :**  
    [Icono apropiado] **[Domaine à améliorer]** – Suggérez une amélioration concrète, utile et basée sur le style observé.
  
  ⚠️ **IMPORTANT :** Suivez ce format exactement. Incluez toujours des icônes, des étiquettes accrocheuses et des descriptions précises.
  
  ---
  
  ## Analyse de la relation
  
  ### 🚩 **Signaux d'Alarme**

  - [Liste des patterns problématiques ou signaux d'alarme observés dans le groupe ou dans les dynamiques entre participants. Utilisez ce format :]  
    🚩 **[Signal d'alarme spécifique]** – Description claire du pattern problématique en 2-3 phrases.
  
  ---
  
  ### 💯 **Évaluation de la relation**
  
  - **Score général :** [Valeur entre 1 et 10 sur la qualité du lien ou de la dynamique.]
  - **Justification :** [Expliquez brièvement pourquoi elle mérite ce score.]
  - **Dynamique prédominante:** [Ex. : Coopération, Compétition, Soutien mutuel, Tension cachée, Déconnexion.]
  
  ---
  
  ### 💡 **Recommandations**
  
  - [Incluez 1 ou 2 conseils pratiques. Format :]  
    [Icono apropiado] **[Conseil bref]** – Explication utile et actionnable, orientée pour améliorer la dynamique de groupe.
  
  ---
  
  ## Phrases descriptives-littérales
  
  **Phrases résumé :**  
  Rédigez 4 ou 5 phrases descriptives et caractéristiques qui résument le style de chaque participant.  
  Utilisez les noms exacts (ex. : "Participant 1"). Elles servent pour un jeu où on devine qui est qui.
  
  🎯 **Format obligatoire :**
  
  ### 🎯 Données de jeu 
  json
  GAME_DATA:[
    ["Participant 1", "Participant 2"],
    [
      {
        "nombre": "Participant 1",
        "frase": " 'Phrase ingénieuse ou littérale' "
      },
      {
        "nombre": "Participant 2",
        "frase": " 'Phrase ingénieuse ou littérale' "
      }
    ]
  ]
   
  ---
  ⚠️ RÈGLE CRITIQUE : Les deux listes (noms et phrases) doivent avoir EXACTEMENT les mêmes participants. Ni plus, ni moins.

  🧘‍♂️ Maintenez une approche rigoureuse, objective et empathique dans l'analyse psychologique.
  🎭 Dans les phrases descriptives, utilisez un style perspicace et professionnel qui capture l'essence communicative.`,
    
  'de': `📋 **TECHNISCHE ANALYSESPEZIFIKATIONEN**

  🔧 **TECHNISCHES FORMAT ERFORDERLICH**: Ihre Antwort wird automatisch von einem System verarbeitet, das:
  - ## Symbole verwendet, um CSS- und HTML-Struktur zu generieren
  - ** Symbole parst, um Titel und Abschnitte zu identifizieren
  - Spezifische JSON-Daten für Anwendungsfunktionalitäten extrahiert
  - Exakte Konsistenz im Markdown-Format erfordert

  📝 **TECHNISCHER START ERFORDERLICH**: Die Antwort muss direkt beginnen mit:
  "## Persönlichkeitsanalyse"
  
  (Jeder Text vor dieser Zeile wird die automatische Verarbeitung des Systems unterbrechen)

  🎯 **ANALYSESPEZIFIKATIONEN**, die Sie befolgen müssen:
  
  - Analysieren Sie **NUR** Teilnehmer, die **Nachrichten schreiben**.
  - Verwenden Sie Namen **genau wie sie erscheinen** (z.B.: "Teilnehmer 1", "Teilnehmer 2").
  - **🔒 ENTSCHEIDEND: Verwenden Sie die Teilnehmer-Bezeichnungen wie sie Ihnen vorliegen**. Halten Sie die Benennung in Ihrer Antwort konsistent.
  
  🏥 **INTEGRITÄT DER PSYCHOLOGISCHEN ANALYSE**: 
  - **Erfinden Sie KEINE echten Namen** (wie Kevin, Giorgia, etc.) - dies würde die wissenschaftliche Glaubwürdigkeit der Analyse gefährden
  - Da es sich um eine professionelle psychologische Analyse handelt, ist die Präzision bei der Identifizierung der Teilnehmer grundlegend für die Aufrechterhaltung der Studiengültigkeit
  - Namen sind absichtlich aus Datenschutz- und berufsethischen Gründen anonymisiert
  
  - **Analysieren oder erwähnen Sie NICHT** diejenigen, die **keine Nachricht gesendet haben**.
  - Wenn nur 3 Personen schreibend teilnehmen, analysieren Sie **nur diese 3**. Fügen Sie keine weiteren hinzu.
  - Namen sind absichtlich anonymisiert und werden später zurückgesetzt.
  
  📌 **GRUNDREGEL:** Wenn nur "Teilnehmer 1" und "Teilnehmer 3" schreiben, **erwähnen oder analysieren Sie "Teilnehmer 2" NICHT**.
  
  ---
  
  🎭 **Rolle:** Handeln Sie als spezialisierter Gruppenkommunikationsanalyst, mit wissenschaftlichem Ansatz, emotionaler Schärfe und Synthesefähigkeit. Ihre Analyse sollte präzise, evidenzbasiert und professionell sein.
  
  Für **jeden Teilnehmer, der schreibt**, folgen Sie **DIESEM OBLIGATORISCHEN FORMAT in Markdown**:
  
  ##  Persönlichkeitsanalyse
  
  ### [EXAKTER Name – z.B.: Teilnehmer 1]
  - **Hauptmerkmale:**  
    [Icono apropiado] **[Auffälliges Etikett]** – Kurze aber kraftvolle Beschreibung ihres kommunikativen Stils oder vorherrschenden Persönlichkeit.  
    [Icono apropiado] **[Auffälliges Etikett]** – Ein weiteres Schlüsselmerkmal, intelligent und ohne Umschweife analysiert.
  
  - **Stärken:**  
    [Icono apropiado] **[Klare Stärke]** – Beschreiben Sie einen starken Punkt, der in ihrer Art zu interagieren oder zu kommunizieren sichtbar ist.
  
  - **Verbesserungsbereiche:**  
    [Icono apropiado] **[Zu verbessernder Bereich]** – Schlagen Sie eine konkrete, nützliche Verbesserung basierend auf dem beobachteten Stil vor.
  
  ⚠️ **WICHTIG:** Folgen Sie diesem Format genau. Schließen Sie immer Symbole, auffällige Etiketten und präzise Beschreibungen ein.
  
  ---
  
  ## Beziehungsanalyse
  
  ### 🚩 **Warnsignale**

  - [Liste problematischer Muster oder Warnsignale, die in der Gruppe oder in der Dynamik zwischen Teilnehmern beobachtet wurden. Verwenden Sie dieses Format:]  
    🚩 **[Spezifisches Warnsignal]** – Klare Beschreibung des problematischen Musters in 2-3 Sätzen.
  
  ---
  
  ### 💯 **Beziehungsbewertung**
  
  - **Gesamtpunktzahl:** [Wert zwischen 1 und 10 über die Qualität der Bindung oder Dynamik.]
  - **Begründung:** [Erklären Sie kurz, warum sie diese Punktzahl verdient.]
  - **Vorherrschende Dynamik:** [Z.B.: Kooperation, Wettbewerb, Gegenseitige Unterstützung, Versteckte Spannung, Trennung.]
  
  ---
  
  ### 💡 **Empfehlungen**
  
  - [Schließen Sie 1 oder 2 praktische Tipps ein. Format:]  
    [Icono apropiado] **[Kurzer Rat]** – Nützliche und umsetzbare Erklärung, orientiert an der Verbesserung der Gruppendynamik.
  
  ---
  
  ## Beschreibende-wörtliche Phrasen
  
  **Zusammenfassende Phrasen:**  
  Schreiben Sie 4 oder 5 beschreibende und charakteristische Phrasen, die den Stil jedes Teilnehmers zusammenfassen.  
  Verwenden Sie die exakten Namen (z.B.: "Teilnehmer 1"). Sie dienen für ein Spiel, bei dem man errät, wer wer ist.
  
  🎯 **Obligatorisches Format:**
  
  ### 🎯 Spieldaten 
  json
  GAME_DATA:[
    ["Teilnehmer 1", "Teilnehmer 2"],
    [
      {
        "nombre": "Teilnehmer 1",
        "frase": " 'Geistreiche oder wörtliche Phrase' "
      },
      {
        "nombre": "Teilnehmer 2",
        "frase": " 'Geistreiche oder wörtliche Phrase' "
      }
    ]
  ]
   
  ---
  ⚠️ KRITISCHE REGEL: Beide Listen (Namen und Phrasen) müssen GENAU dieselben Teilnehmer haben. Nicht mehr, nicht weniger.

  🧘‍♂️ Behalten Sie einen rigorosen, objektiven und empathischen Ansatz in der psychologischen Analyse bei.
  🎭 In den beschreibenden Phrasen verwenden Sie einen scharfsinnigen und professionellen Stil, der die kommunikative Essenz erfasst.`,
    
  'it': `📋 **SPECIFICHE TECNICHE DELL'ANALISI**

  🔧 **FORMATO TÉCNICO RICHIESTO**: La tua risposta sarà elaborata automaticamente da un sistema che:
  - Utilizza i simboli ## per generare struttura CSS e HTML
  - Analizza i simboli ** per identificare titoli e sezioni
  - Estrae dati JSON specifici per le funzionalità dell'applicazione
  - Richiede coerenza esatta nel formato Markdown

  📝 **INIZIO TÉCNICO RICHIESTO**: La risposta deve iniziare direttamente con:
  "## Analisi delle personalità"
  
  (Qualsiasi testo prima di questa riga interromperà l'elaborazione automatica del sistema)

  🎯 **SPECIFICHE DI ANALISI** che devi seguire:
  
  - Analizza **SOLO** i partecipanti che **scrivono messaggi**.
  - Usa i nomi **esattamente come appaiono** (es.: "Partecipante 1", "Partecipante 2").
  - **🔒 CRUCIALE: Usa le designazioni dei partecipanti come ti arrivano**. Mantieni coerenza nella nomenclatura durante la tua risposta.
  
  🏥 **INTEGRITÀ DELL'ANALISI PSICOLOGICA**: 
  - **NON inventare nomi reali** (come Kevin, Giorgia, ecc.) - questo comprometterebbe la credibilità scientifica dell'analisi
  - Trattandosi di un'analisi psicologica professionale, la precisione nell'identificazione dei partecipanti è fondamentale per mantenere la validità dello studio
  - I nomi sono intenzionalmente anonimizzati per ragioni di privacy e etica professionale
  
  - **NON analizzare né menzionare** coloro che **non hanno inviato alcun messaggio**.
  - Se solo 3 persone partecipano scrivendo, analizza **solo quelle 3**. Non aggiungerne altre.
  - I nomi sono intenzionalmente anonimi e verranno ripristinati dopo.
  
  📌 **REGOLA FONDAMENTALE:** Se solo "Partecipante 1" e "Partecipante 3" scrivono, **NON menzionare o analizzare "Partecipante 2"**.
  
  ---
  
  🎭 **Ruolo:** Agisci come uno specialista di analisi della comunicazione di gruppo, con approccio scientifico, acutezza emotiva e capacità di sintesi. La tua analisi deve essere precisa, baseata su evidenze e professionale.
  
  Per **ogni partecipante che scrive**, segui **QUESTO FORMATO OBBLIGATORIO in Markdown**:
  
  ##  Analisi delle personalità
  
  ### [Nome ESATTO – ex.: Partecipante 1]
  - **Tratti principali:**  
    [Icono apropiado] **[Etichetta accattivante]** – Descrizione breve ma potente del loro stile comunicativo o personalità predominante.  
    [Icono apropiado] **[Etichetta accattivante]** – Un altro tratto chiave, analizzato con intelligenza e senza giri di parole.
  
  - **Punti di forza:**  
    [Icono apropiado] **[Forza chiara]** – Descrivi un punto forte visibile nel loro modo di relazionarsi o comunicare.
  
  - **Aree di miglioramento:**  
    [Icono apropiado] **[Area da migliorare]** – Suggerisci un miglioramento concreto, utile e basato sullo stile osservato.
  
  ⚠️ **IMPORTANTE:** Segui questo formato esattamente. Includi sempre icone, etichette accattivanti e descrizioni precise.
  
  ---
  
  ## Analisi della relazione
  
  ### 🚩 **Segnali di Allarme**

  - [Elenco di pattern problematici o segnali di allarme osservati nel gruppo o nelle dinamiche tra partecipanti. Usa questo formato:]  
    🚩 **[Segnale di allarme specifico]** – Descrizione chiara del pattern problematico in 2-3 frasi.
  
  ---
  
  ### 💯 **Valutazione della relazione**
  
  - **Punteggio generale:** [Valore tra 1 e 10 sulla qualità del legame o dinamica.]
  - **Giustificazione:** [Spiega brevemente perché merita quel punteggio.]
  - **Dinamica predominante:** [Es.: Cooperazione, Competizione, Supporto reciproco, Tensione nascosta, Sconnessione.]
  
  ---
  
  ### 💡 **Raccomandazioni**
  
  - [Includi 1 o 2 consigli pratici. Formato:]  
    [Icono apropiado] **[Consiglio breve]** – Spiegazione utile e attuabile, orientata a migliorare la dinamica del gruppo.
  
  ---
  
  ## Frasi descrittive-letterali
  
  **Frasi riassuntive:**  
  Scrivi 4 o 5 frasi provocativas, irônicas ou literais que resumam o estilo de cada participante.  
  Usa i nomi esatti (es.: "Partecipante 1"). Servem para um jogo onde se adivinha quem é quem.
  
  🎯 **Formato obbligatorio:**
  
  ### 🎯 Dati del gioco 
  json
  GAME_DATA:[
    ["Partecipante 1", "Partecipante 2"],
    [
      {
        "nombre": "Partecipante 1",
        "frase": " 'Frase ingegnosa ou literal' "
      },
      {
        "nombre": "Partecipante 2",
        "frase": " 'Frase ingegnosa ou literal' "
      }
    ]
  ]
   
  ---
  ⚠️ REGOLA CRITICA: Entrambe le liste (nomi e frasi) devono avere ESATTAMENTE gli stessi partecipanti. Né più, né meno.

  🧘‍♂️ Sii rigoroso, obiettivo ed empatico nell'analisi psicologica.
  🎭 Ma nelle Frasi descrittive-letterali, se solte com humor negro, audácia e creatività controllata.`,
  'pt': `📋 **ESPECIFICAÇÕES TÉCNICAS DA ANÁLISE**

  🔧 **FORMATO TÉCNICO NECESSÁRIO**: Sua resposta será processada automaticamente por um sistema que:
  - Usa os símbolos ## para gerar estrutura CSS e HTML
  - Analisa os símbolos ** para identificar títulos e seções
  - Extrai dados JSON específicos para funcionalidades da aplicação
  - Requer consistência exata no formato Markdown

  📝 **INÍCIO TÉCNICO NECESSÁRIO**: A resposta deve começar diretamente com:
  "## Análise de personalidades"
  
  (Qualquer texto antes desta linha quebrará o processamento automático do sistema)

  🎯 **ESPECIFICAÇÕES DE ANÁLISE** que você deve seguir:
  
  - Analise **APENAS** participantes que **escrevem mensagens**.
  - Use nomes **exatamente como aparecem** (ex.: "Participante 1", "Participante 2").
  - **🔒 CRUCIAL: Use as designações de participantes como elas chegam até você**. Mantenha consistência na nomenclatura ao longo da sua resposta.
  
  🏥 **INTEGRIDADE DA ANÁLISE PSICOLOGICA**: 
  - **NÃO invente nomes reais** (como Kevin, Giorgia, etc.) - isso comprometeria a credibilidade científica da análise
  - Tratando-se de uma análise psicológica profissional, a precisão na identificação dos participantes é fundamental para manter a validade do estudo
  - Os nomes estão intencionalmente anonimizados por razões de privacidade e ética profissional
  
  - **NÃO analise nem mencione** aqueles que **não enviaram nenhuma mensagem**.
  - Se apenas 3 pessoas participam escrevendo, analise **apenas essas 3**. Não adicione mais.
  - Os nomes estão intencionalmente anonimizados e serão revertidos depois.
  
  📌 **REGRA FUNDAMENTAL:** Se apenas "Participante 1" e "Participante 3" escrevem, **NÃO mencione ou analise "Participante 2"**.
  
  ---
  
  🎭 **Papel:** Aja como um especialista em análise de comunicação grupal, com abordagem científica, acuidade emocional e um toque de humor mordaz. Sua análise deve ser certeira, direta e perspicaz.
  
  Para **cada participante que escreve**, siga **ESTE FORMATO OBRIGATÓRIO em Markdown**:
  
  ##  Análise de personalidades
  
  ### [Nome EXATO – ex.: Participante 1]
  - **Traços principais:**  
    [Ícone apropriado] **[Rótulo chamativo]** – Descrição breve mas poderosa do seu estilo comunicativo ou personalidade predominante.  
    [Ícone apropriado] **[Rótulo chamativo]** – Outro traço chave, analisado com inteligência e sem rodeios.
  
  - **Pontos fortes:**  
    [Ícone apropriado] **[Força clara]** – Descreva um ponto forte visível na sua forma de se relacionar ou comunicar.
  
  - **Áreas de desenvolvimento:**  
    [Ícone apropriado] **[Área a desenvolver]** – Sugira uma melhoria concreta, útil e baseada no estilo observado.
  
  ⚠️ **IMPORTANTE:** Siga este formato exatamente. Inclua sempre ícones, rótulos chamativos e descrições precisas.
  
  ---
  
  ## Análise do relacionamento
  
  ### 🚩 **Sinais de Alerta**

  - [Liste padrões problemáticos ou sinais de alerta observados no grupo ou nas dinâmicas entre participantes. Use este formato:]  
    🚩 **[Sinal de alerta específico]** – Descrição clara do padrão problemático em 2-3 frases.
  
  ---
  
  ### 💯 **Avaliação do relacionamento**
  
  - **Pontuação geral:** [Valor entre 1 e 10 sobre a qualidade do vínculo ou dinâmica.]
  - **Justificativa:** [Explique brevemente por que merece essa pontuação.]
  - **Dinâmica predominante:** [Ex.: Cooperação, Competição, Apoio mútuo, Tensão escondida, Desconexão.]
  
  ---
  
  ### 💡 **Recomendações**
  
  - [Inclua 1 ou 2 dicas práticas. Formato:]  
    [Ícone apropriado] **[Dica breve]** – Explicação útil e acionável, orientada a melhorar a dinâmica do grupo.
  
  ---
  
  ## Frases descritivas-literais
  
  **Frases resumo:**  
  Redija 4 ou 5 frases descritivas e características que resumam o estilo de cada participante.  
  Use os nomes exatos (ex.: "Participante 1"). Servem para um jogo onde se adivinha quem é quem.
  
  🎯 **Formato obrigatório:**
  
  ### 🎯 Dados do jogo 
  json
  GAME_DATA:[
    ["Participante 1", "Participante 2"],
    [
      {
        "nombre": "Participante 1",
        "frase": " 'Frase descritiva ou característica' "
      },
      {
        "nombre": "Participante 2",
        "frase": " 'Frase descritiva ou característica' "
      }
    ]
  ]
   
  ---
  ⚠️ REGRA CRÍTICA: Ambas as listas (nomes e frases) devem ter EXATAMENTE os mesmos participantes. Nem mais, nem menos.

  🧘‍♂️ Mantenha uma abordagem rigorosa, objetiva e empática na análise psicologica.
  🎭 Nas frases descritivas, use um estilo perspicaz e profissional que capture a essência comunicativa.`
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

// NUEVO: Mapeo de nombres de participantes por idioma
// Para solucionar el problema de traducción automática de Azure
export const PARTICIPANT_TRANSLATIONS = {
  'es': {
    // Base - no cambiar
    'Participante 1': 'Participante 1',
    'Participante 2': 'Participante 2', 
    'Participante 3': 'Participante 3',
    'Participante 4': 'Participante 4',
    'Participante 5': 'Participante 5',
    'Participante 6': 'Participante 6',
    'Participante 7': 'Participante 7',
    'Participante 8': 'Participante 8',
    'Participante 9': 'Participante 9',
    'Participante 10': 'Participante 10',
    'Participante 11': 'Participante 11',
    'Participante 12': 'Participante 12',
    'Participante 13': 'Participante 13',
    'Participante 14': 'Participante 14',
    'Participante 15': 'Participante 15',
    'Participante 16': 'Participante 16',
    'Participante 17': 'Participante 17',
    'Participante 18': 'Participante 18',
    'Participante 19': 'Participante 19',
    'Participante 20': 'Participante 20',
    'Participante 21': 'Participante 21',
    'Participante 22': 'Participante 22',
    'Participante 23': 'Participante 23',
    'Participante 24': 'Participante 24',
    'Participante 25': 'Participante 25',
    'Participante 26': 'Participante 26',
    'Participante 27': 'Participante 27',
    'Participante 28': 'Participante 28',
    'Participante 29': 'Participante 29',
    'Participante 30': 'Participante 30',
    'Participante 31': 'Participante 31',
    'Participante 32': 'Participante 32',
    'Participante 33': 'Participante 33',
    'Participante 34': 'Participante 34',
    'Participante 35': 'Participante 35',
    'Participante 36': 'Participante 36',
    'Participante 37': 'Participante 37',
    'Participante 38': 'Participante 38',
    'Participante 39': 'Participante 39',
    'Participante 40': 'Participante 40',
    'Participante 41': 'Participante 41',
    'Participante 42': 'Participante 42',
    'Participante 43': 'Participante 43',
    'Participante 44': 'Participante 44',
    'Participante 45': 'Participante 45',
    'Participante 46': 'Participante 46',
    'Participante 47': 'Participante 47',
    'Participante 48': 'Participante 48',
    'Participante 49': 'Participante 49',
    'Participante 50': 'Participante 50'
  },
  'en': {
    'Participante 1': 'Participant 1',
    'Participante 2': 'Participant 2',
    'Participante 3': 'Participant 3', 
    'Participante 4': 'Participant 4',
    'Participante 5': 'Participant 5',
    'Participante 6': 'Participant 6',
    'Participante 7': 'Participant 7',
    'Participante 8': 'Participant 8',
    'Participante 9': 'Participant 9',
    'Participante 10': 'Participant 10',
    'Participante 11': 'Participant 11',
    'Participante 12': 'Participant 12',
    'Participante 13': 'Participant 13',
    'Participante 14': 'Participant 14',
    'Participante 15': 'Participant 15',
    'Participante 16': 'Participant 16',
    'Participante 17': 'Participant 17',
    'Participante 18': 'Participant 18',
    'Participante 19': 'Participant 19',
    'Participante 20': 'Participant 20',
    'Participante 21': 'Participant 21',
    'Participante 22': 'Participant 22',
    'Participante 23': 'Participant 23',
    'Participante 24': 'Participant 24',
    'Participante 25': 'Participant 25',
    'Participante 26': 'Participant 26',
    'Participante 27': 'Participant 27',
    'Participante 28': 'Participant 28',
    'Participante 29': 'Participant 29',
    'Participante 30': 'Participant 30',
    'Participante 31': 'Participant 31',
    'Participante 32': 'Participant 32',
    'Participante 33': 'Participant 33',
    'Participante 34': 'Participant 34',
    'Participante 35': 'Participant 35',
    'Participante 36': 'Participant 36',
    'Participante 37': 'Participant 37',
    'Participante 38': 'Participant 38',
    'Participante 39': 'Participant 39',
    'Participante 40': 'Participant 40',
    'Participante 41': 'Participant 41',
    'Participante 42': 'Participant 42',
    'Participante 43': 'Participant 43',
    'Participante 44': 'Participant 44',
    'Participante 45': 'Participant 45',
    'Participante 46': 'Participant 46',
    'Participante 47': 'Participant 47',
    'Participante 48': 'Participant 48',
    'Participante 49': 'Participant 49',
    'Participante 50': 'Participant 50'
  },
  'fr': {
    'Participante 1': 'Participant 1',
    'Participante 2': 'Participant 2',
    'Participante 3': 'Participant 3',
    'Participante 4': 'Participant 4', 
    'Participante 5': 'Participant 5',
    'Participante 6': 'Participant 6',
    'Participante 7': 'Participant 7',
    'Participante 8': 'Participant 8',
    'Participante 9': 'Participant 9',
    'Participante 10': 'Participant 10',
    'Participante 11': 'Participant 11',
    'Participante 12': 'Participant 12',
    'Participante 13': 'Participant 13',
    'Participante 14': 'Participant 14',
    'Participante 15': 'Participant 15',
    'Participante 16': 'Participant 16',
    'Participante 17': 'Participant 17',
    'Participante 18': 'Participant 18',
    'Participante 19': 'Participant 19',
    'Participante 20': 'Participant 20',
    'Participante 21': 'Participant 21',
    'Participante 22': 'Participant 22',
    'Participante 23': 'Participant 23',
    'Participante 24': 'Participant 24',
    'Participante 25': 'Participant 25',
    'Participante 26': 'Participant 26',
    'Participante 27': 'Participant 27',
    'Participante 28': 'Participant 28',
    'Participante 29': 'Participant 29',
    'Participante 30': 'Participant 30',
    'Participante 31': 'Participant 31',
    'Participante 32': 'Participant 32',
    'Participante 33': 'Participant 33',
    'Participante 34': 'Participant 34',
    'Participante 35': 'Participant 35',
    'Participante 36': 'Participant 36',
    'Participante 37': 'Participant 37',
    'Participante 38': 'Participant 38',
    'Participante 39': 'Participant 39',
    'Participante 40': 'Participant 40',
    'Participante 41': 'Participant 41',
    'Participante 42': 'Participant 42',
    'Participante 43': 'Participant 43',
    'Participante 44': 'Participant 44',
    'Participante 45': 'Participant 45',
    'Participante 46': 'Participant 46',
    'Participante 47': 'Participant 47',
    'Participante 48': 'Participant 48',
    'Participante 49': 'Participant 49',
    'Participante 50': 'Participant 50'
  },
  'de': {
    'Participante 1': 'Teilnehmer 1',
    'Participante 2': 'Teilnehmer 2',
    'Participante 3': 'Teilnehmer 3',
    'Participante 4': 'Teilnehmer 4',
    'Participante 5': 'Teilnehmer 5',
    'Participante 6': 'Teilnehmer 6',
    'Participante 7': 'Teilnehmer 7',
    'Participante 8': 'Teilnehmer 8',
    'Participante 9': 'Teilnehmer 9',
    'Participante 10': 'Teilnehmer 10',
    'Participante 11': 'Teilnehmer 11',
    'Participante 12': 'Teilnehmer 12',
    'Participante 13': 'Teilnehmer 13',
    'Participante 14': 'Teilnehmer 14',
    'Participante 15': 'Teilnehmer 15',
    'Participante 16': 'Teilnehmer 16',
    'Participante 17': 'Teilnehmer 17',
    'Participante 18': 'Teilnehmer 18',
    'Participante 19': 'Teilnehmer 19',
    'Participante 20': 'Teilnehmer 20',
    'Participante 21': 'Teilnehmer 21',
    'Participante 22': 'Teilnehmer 22',
    'Participante 23': 'Teilnehmer 23',
    'Participante 24': 'Teilnehmer 24',
    'Participante 25': 'Teilnehmer 25',
    'Participante 26': 'Teilnehmer 26',
    'Participante 27': 'Teilnehmer 27',
    'Participante 28': 'Teilnehmer 28',
    'Participante 29': 'Teilnehmer 29',
    'Participante 30': 'Teilnehmer 30',
    'Participante 31': 'Teilnehmer 31',
    'Participante 32': 'Teilnehmer 32',
    'Participante 33': 'Teilnehmer 33',
    'Participante 34': 'Teilnehmer 34',
    'Participante 35': 'Teilnehmer 35',
    'Participante 36': 'Teilnehmer 36',
    'Participante 37': 'Teilnehmer 37',
    'Participante 38': 'Teilnehmer 38',
    'Participante 39': 'Teilnehmer 39',
    'Participante 40': 'Teilnehmer 40',
    'Participante 41': 'Teilnehmer 41',
    'Participante 42': 'Teilnehmer 42',
    'Participante 43': 'Teilnehmer 43',
    'Participante 44': 'Teilnehmer 44',
    'Participante 45': 'Teilnehmer 45',
    'Participante 46': 'Teilnehmer 46',
    'Participante 47': 'Teilnehmer 47',
    'Participante 48': 'Teilnehmer 48',
    'Participante 49': 'Teilnehmer 49',
    'Participante 50': 'Teilnehmer 50'
  },
  'it': {
    'Participante 1': 'Partecipante 1',
    'Participante 2': 'Partecipante 2',
    'Participante 3': 'Partecipante 3',
    'Participante 4': 'Partecipante 4',
    'Participante 5': 'Partecipante 5',
    'Participante 6': 'Partecipante 6',
    'Participante 7': 'Partecipante 7',
    'Participante 8': 'Partecipante 8',
    'Participante 9': 'Partecipante 9',
    'Participante 10': 'Partecipante 10',
    'Participante 11': 'Partecipante 11',
    'Participante 12': 'Partecipante 12',
    'Participante 13': 'Partecipante 13',
    'Participante 14': 'Partecipante 14',
    'Participante 15': 'Partecipante 15',
    'Participante 16': 'Partecipante 16',
    'Participante 17': 'Partecipante 17',
    'Participante 18': 'Partecipante 18',
    'Participante 19': 'Partecipante 19',
    'Participante 20': 'Partecipante 20',
    'Participante 21': 'Partecipante 21',
    'Participante 22': 'Partecipante 22',
    'Participante 23': 'Partecipante 23',
    'Participante 24': 'Partecipante 24',
    'Participante 25': 'Partecipante 25',
    'Participante 26': 'Partecipante 26',
    'Participante 27': 'Partecipante 27',
    'Participante 28': 'Partecipante 28',
    'Participante 29': 'Partecipante 29',
    'Participante 30': 'Partecipante 30',
    'Participante 31': 'Partecipante 31',
    'Participante 32': 'Partecipante 32',
    'Participante 33': 'Partecipante 33',
    'Participante 34': 'Partecipante 34',
    'Participante 35': 'Partecipante 35',
    'Participante 36': 'Partecipante 36',
    'Participante 37': 'Partecipante 37',
    'Participante 38': 'Partecipante 38',
    'Participante 39': 'Partecipante 39',
    'Participante 40': 'Partecipante 40',
    'Participante 41': 'Partecipante 41',
    'Participante 42': 'Partecipante 42',
    'Participante 43': 'Partecipante 43',
    'Participante 44': 'Partecipante 44',
    'Participante 45': 'Partecipante 45',
    'Participante 46': 'Partecipante 46',
    'Participante 47': 'Partecipante 47',
    'Participante 48': 'Partecipante 48',
    'Participante 49': 'Partecipante 49',
    'Participante 50': 'Partecipante 50'
  },
  'pt': {
    'Participante 1': 'Participante 1', // En portugués se mantiene igual
    'Participante 2': 'Participante 2',
    'Participante 3': 'Participante 3',
    'Participante 4': 'Participante 4',
    'Participante 5': 'Participante 5',
    'Participante 6': 'Participante 6',
    'Participante 7': 'Participante 7',
    'Participante 8': 'Participante 8',
    'Participante 9': 'Participante 9',
    'Participante 10': 'Participante 10',
    'Participante 11': 'Participante 11',
    'Participante 12': 'Participante 12',
    'Participante 13': 'Participante 13',
    'Participante 14': 'Participante 14',
    'Participante 15': 'Participante 15',
    'Participante 16': 'Participante 16',
    'Participante 17': 'Participante 17',
    'Participante 18': 'Participante 18',
    'Participante 19': 'Participante 19',
    'Participante 20': 'Participante 20',
    'Participante 21': 'Participante 21',
    'Participante 22': 'Participante 22',
    'Participante 23': 'Participante 23',
    'Participante 24': 'Participante 24',
    'Participante 25': 'Participante 25',
    'Participante 26': 'Participante 26',
    'Participante 27': 'Participante 27',
    'Participante 28': 'Participante 28',
    'Participante 29': 'Participante 29',
    'Participante 30': 'Participante 30',
    'Participante 31': 'Participante 31',
    'Participante 32': 'Participante 32',
    'Participante 33': 'Participante 33',
    'Participante 34': 'Participante 34',
    'Participante 35': 'Participante 35',
    'Participante 36': 'Participante 36',
    'Participante 37': 'Participante 37',
    'Participante 38': 'Participante 38',
    'Participante 39': 'Participante 39',
    'Participante 40': 'Participante 40',
    'Participante 41': 'Participante 41',
    'Participante 42': 'Participante 42',
    'Participante 43': 'Participante 43',
    'Participante 44': 'Participante 44',
    'Participante 45': 'Participante 45',
    'Participante 46': 'Participante 46',
    'Participante 47': 'Participante 47',
    'Participante 48': 'Participante 48',
    'Participante 49': 'Participante 49',
    'Participante 50': 'Participante 50'
  }
};

// NUEVO: Función para detectar el idioma de respuesta de Azure
// Basada en palabras clave comunes en cada idioma
export const detectResponseLanguage = (responseText) => {
  if (!responseText || typeof responseText !== 'string') {
    return 'es'; // Fallback al español
  }

  const text = responseText.toLowerCase();
  
  // Palabras clave específicas de cada idioma en orden de prioridad
  const languageKeywords = {
    'de': [
      'teilnehmer', 'persönlichkeitsanalyse', 'hauptmerkmale', 'stärken', 
      'verbesserungsbereiche', 'beziehungsanalyse', 'warnsignale', 
      'gesamtpunktzahl', 'empfehlungen', 'spieldaten'
    ],
    'en': [
      'participant', 'personality analysis', 'main traits', 'strengths',
      'areas for improvement', 'relationship analysis', 'warning signs',
      'overall score', 'recommendations', 'game data'
    ],
    'fr': [
      'participant', 'analyse des personnalités', 'traits principaux', 'forces',
      'domaines d\'amélioration', 'analyse de la relation', 'signaux d\'alarme',
      'score général', 'recommandations', 'données de jeu'
    ],
    'it': [
      'partecipante', 'analisi delle personalità', 'tratti principali', 'punti di forza',
      'aree di miglioramento', 'analisi della relazione', 'segnali di allarme',
      'punteggio generale', 'raccomandazioni', 'dati del gioco'
    ],
    'pt': [
      'participante', 'análise de personalidades', 'traços principais', 'pontos fortes',
      'áreas de melhoria', 'análise do relacionamento', 'sinais de alerta',
      'pontuação geral', 'recomendações', 'dados do jogo'
    ]
  };

  // Contar coincidencias para cada idioma
  const scores = {};
  
  Object.entries(languageKeywords).forEach(([lang, keywords]) => {
    scores[lang] = keywords.reduce((count, keyword) => {
      return count + (text.includes(keyword) ? 1 : 0);
    }, 0);
  });

  // Encontrar el idioma con más coincidencias
  const detectedLang = Object.entries(scores).reduce((a, b) => 
    scores[a[0]] > scores[b[0]] ? a : b
  )[0];
  
  // Si no hay coincidencias significativas, fallback a español
  return scores[detectedLang] > 0 ? detectedLang : 'es';
};

// NUEVO: Función para traducir nombres de participantes en el contenido antes del envío
export const translateParticipantNames = (content, targetLanguage) => {
  if (!content || targetLanguage === 'es') {
    return content; // No traducir si es español o contenido vacío
  }

  const translations = PARTICIPANT_TRANSLATIONS[targetLanguage];
  if (!translations) {
    console.warn(`❌ No hay traducciones disponibles para el idioma: ${targetLanguage}`);
    return content;
  }

  let translatedContent = content;
  Object.entries(translations).forEach(([spanish, translated]) => {
    if (spanish !== translated) {
      // Con comillas (JSON)
      translatedContent = translatedContent.replace(
        new RegExp(`"${spanish.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'g'),
        `"${translated}"`
      );
      
      // Sin comillas (texto normal)
      translatedContent = translatedContent.replace(
        new RegExp(`\\b${spanish.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g'),
        translated
      );
    }
  });

  return translatedContent;
};

// NUEVO: Función para crear mapeo de traducción inversa
export const createReverseTranslationMapping = (originalNameMapping, detectedLanguage) => {
  if (!originalNameMapping) {
    return originalNameMapping;
  }

  // NUEVO: Si es español, no hay cambios necesarios
  if (detectedLanguage === 'es' || detectedLanguage === 'spa') {
    return originalNameMapping;
  }

  // NUEVO: Verificar si los participantes ya están en el idioma detectado
  const firstParticipantId = Object.values(originalNameMapping)[0];
  if (firstParticipantId) {
    // Detectar si ya está en el idioma correcto
    const isAlreadyInTargetLanguage = 
      (detectedLanguage === 'de' && firstParticipantId.includes('Teilnehmer')) ||
      (detectedLanguage === 'en' && firstParticipantId.includes('Participant') && !firstParticipantId.includes('Participante')) ||
      (detectedLanguage === 'it' && firstParticipantId.includes('Partecipante')) ||
      (detectedLanguage === 'fr' && firstParticipantId.includes('Participant') && !firstParticipantId.includes('Participante')) ||
      (detectedLanguage === 'pt' && firstParticipantId.includes('Participante'));
    
    if (isAlreadyInTargetLanguage) {
      return originalNameMapping;
    }
  }

  // Si llegamos aquí, necesitamos traducir desde español al idioma detectado
  const translations = PARTICIPANT_TRANSLATIONS[detectedLanguage];
  if (!translations) {
    console.warn(`❌ No hay traducciones disponibles para el idioma: ${detectedLanguage}`);
    return originalNameMapping;
  }
  
  const newMapping = {};
  
  Object.entries(originalNameMapping).forEach(([realName, participantId]) => {
    // Si el participantId está en español, traducirlo al idioma detectado
    const translatedParticipant = translations[participantId] || participantId;
    newMapping[realName] = translatedParticipant;
  });
  return newMapping;
};

// Configuración de límites para selección inteligente de modelos
export const TEXT_LENGTH_LIMITS = {
  SHORT: 1500,
  MEDIUM: 6000,
  LONG: 12000
};

// Límite máximo de tokens para respuestas
export const MAX_TOKEN_RESPONSE = 4000; 