/**
 * Servicio para anonimización de texto multiidioma usando Transformer.js + patrones regex
 * Versión con IA: 104 idiomas soportados automáticamente
 * Soporta: todos los idiomas principales del mundo
 */

// Importación dinámica de Transformer.js para evitar problemas de bundle
let pipeline = null;

// Importación dinámica de Compromise.js para procesamiento adicional de NLP
let nlp = null;

// Función para cargar Transformer.js de forma lazy
async function loadTransformers() {
  if (!pipeline) {
    try {
      const transformers = await import('@xenova/transformers');
      pipeline = transformers.pipeline;
      console.log('✅ Transformer.js cargado correctamente');
      return true;
    } catch (error) {
      console.warn('⚠️ Error cargando Transformer.js:', error.message);
      return false;
    }
  }
  return true;
}

// Función para cargar Compromise.js de forma lazy
async function loadCompromise() {
  if (!nlp) {
    try {
      const compromise = await import('compromise');
      nlp = compromise.default;
      console.log('✅ Compromise.js cargado correctamente');
      return true;
    } catch (error) {
      console.warn('⚠️ Error cargando Compromise.js:', error.message);
      return false;
    }
  }
  return true;
}

class AnonymizationService {
  constructor() {
    this.participantCounter = 1;
    this.mentionedPersonCounter = 1;
    this.locationCounter = 1;
    this.participantMapping = new Map(); // Para quienes escriben en el chat
    this.mentionedPersonMapping = new Map(); // Para personas mencionadas en el chat
    this.locationMapping = new Map(); // Para direcciones y números
    
    // Configuración multiidioma con códigos estándar de 2 letras
    this.supportedLanguages = {
      'es': { name: 'Español', aiSupport: true, patternSupport: true },
      'en': { name: 'English', aiSupport: true, patternSupport: true },
      'de': { name: 'Deutsch', aiSupport: true, patternSupport: true },
      'it': { name: 'Italiano', aiSupport: true, patternSupport: true },
      'fr': { name: 'Français', aiSupport: true, patternSupport: true },
      'ca': { name: 'Català', aiSupport: true, patternSupport: true },
      'eu': { name: 'Euskera', aiSupport: true, patternSupport: true },
      'pt': { name: 'Português', aiSupport: true, patternSupport: false },
      'ru': { name: 'Русский', aiSupport: true, patternSupport: false },
      'ar': { name: 'العربية', aiSupport: true, patternSupport: false },
      'zh': { name: '中文', aiSupport: true, patternSupport: false },
      'ja': { name: '日本語', aiSupport: true, patternSupport: false }
    };
    
    this.currentLanguage = 'es'; // idioma por defecto
    this.nerModel = null; // Modelo de reconocimiento de entidades
    this.modelLoaded = false;
    this.useAI = true; // Por defecto usar IA
  }

  /**
   * Inicializa el modelo de IA para reconocimiento de entidades
   */
  async initializeAI() {
    if (this.modelLoaded) return true;
    
    try {
      console.log('🔄 Cargando modelo de IA multiidioma...');
      const transformersLoaded = await loadTransformers();
      
      if (!transformersLoaded) {
        console.log('📋 Usando patrones regex como fallback');
        this.useAI = false;
        return false;
      }

      // Lista de modelos para probar en orden de preferencia
      const modelsToTry = [
        { name: 'Xenova/bert-base-NER', description: 'BERT básico para NER' },
        { name: 'Xenova/distilbert-base-uncased', description: 'DistilBERT ligero' },
        { name: 'microsoft/DialoGPT-medium', description: 'Modelo de Microsoft' },
        { name: 'Xenova/multilingual-e5-small', description: 'Modelo multiidioma pequeño' },
        { name: 'dbmdz/bert-large-cased-finetuned-conll03-english', description: 'BERT especializado en NER' },
        { name: 'Xenova/distilbert-base-multilingual-cased', description: 'DistilBERT multiidioma (original)' }
      ];

      for (const model of modelsToTry) {
        try {
          console.log(`🔄 Probando modelo: ${model.name} (${model.description})`);
          
          // Cargar modelo con configuración optimizada
          this.nerModel = await pipeline('ner', model.name, {
            aggregation_strategy: 'simple',
            device: 'cpu', // Forzar CPU para compatibilidad
            revision: 'main' // Usar la versión principal
          });
          
          this.modelLoaded = true;
          console.log(`✅ Modelo cargado exitosamente: ${model.name}`);
          return true;
          
        } catch (modelError) {
          console.warn(`⚠️ Error con modelo ${model.name}:`, modelError.message);
          continue; // Probar el siguiente modelo
        }
      }
      
      // Si ningún modelo funcionó
      console.warn('❌ Ningún modelo de IA pudo cargarse, usando patrones regex');
      this.useAI = false;
      return false;
      
    } catch (error) {
      console.warn('⚠️ Error general inicializando IA, usando patrones regex:', error.message);
      this.useAI = false;
      return false;
    }
  }

  /**
   * Encuentra el ID del participante basado en su nombre
   * @param {string} entityText - Nombre detectado por la IA
   * @returns {string|null} - ID del participante o null si no se encuentra
   */
  findParticipantId(entityText) {
    const entityLower = entityText.toLowerCase().trim();
    
    for (const [participantName, participantId] of this.participantMapping.entries()) {
      const participantLower = participantName.toLowerCase().trim();
      
      // Coincidencia exacta
      if (entityLower === participantLower) {
        return participantId;
      }
      
      // Si el participante tiene nombre completo, comprobar partes
      const participantWords = participantLower.split(/\s+/);
      const entityWords = entityLower.split(/\s+/);
      
      // Si entidad coincide con cualquier palabra del participante
      if (participantWords.some(word => word === entityLower)) {
        return participantId;
      }
      
      // Si alguna palabra de la entidad coincide con alguna del participante
      if (entityWords.some(entityWord => 
          participantWords.some(participantWord => 
            entityWord === participantWord && entityWord.length > 2
          )
        )) {
        return participantId;
      }
      
      // Coincidencia parcial (como antes)
      if (participantLower.includes(entityLower) || entityLower.includes(participantLower)) {
        return participantId;
      }
    }
    return null;
  }

  /**
   * Post-procesamiento para asegurar que todos los nombres de participantes se reemplacen
   * @param {string} content - Contenido ya procesado por IA/regex
   * @returns {string} - Contenido con participantes garantizados anonimizados
   */
  postProcessParticipantNames(content) {
    let processedContent = content;
    
    // Recorrer todos los participantes y sus variaciones
    for (const [participantName, participantId] of this.participantMapping.entries()) {
      const participantWords = participantName.split(/\s+/);
      
      // Crear patrones para el nombre completo y cada palabra individual
      const patternsToReplace = [
        participantName, // Nombre completo
        ...participantWords.filter(word => word.length > 2) // Palabras individuales (evitar artículos)
      ];
      
      for (const pattern of patternsToReplace) {
        // Escapar caracteres especiales para regex
        const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escapedPattern}\\b`, 'gi');
        
        const beforeReplace = processedContent;
        processedContent = processedContent.replace(regex, participantId);
        
        if (beforeReplace !== processedContent) {
          console.log(`✅ Post-procesamiento: "${pattern}" → "${participantId}"`);
        }
      }
    }
    
    return processedContent;
  }

  /**
   * Anonimización adicional usando Compromise.js (NLP)
   * @param {string} content - Contenido ya procesado
   * @returns {Promise<string>} - Contenido con anonimización adicional
   */
  async anonymizeWithCompromise(content) {
    try {
      const compromiseLoaded = await loadCompromise();
      if (!compromiseLoaded) {
        console.log('📋 Compromise no disponible, saltando capa adicional');
        return content;
      }

      let processedContent = content;
      const doc = nlp(content);
      
      // Detectar personas que Compromise identifica
      const people = doc.people().out('array');
      console.log('🔍 Compromise detectó personas:', people);
      
      for (const person of people) {
        if (person.length < 2) continue; // Saltar nombres muy cortos
        
        // Verificar si es un participante conocido
        const participantId = this.findParticipantId(person);
        if (participantId) {
          // Es un participante, usar su ID
          const regex = new RegExp(`\\b${person.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
          processedContent = processedContent.replace(regex, participantId);
          console.log(`✅ Compromise - participante: "${person}" → "${participantId}"`);
        } else {
          // Es una persona mencionada nueva
          if (!this.mentionedPersonMapping.has(person)) {
            const personId = `[PERSONA ${this.mentionedPersonCounter++}]`;
            this.mentionedPersonMapping.set(person, personId);
            const regex = new RegExp(`\\b${person.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
            processedContent = processedContent.replace(regex, personId);
            console.log(`✅ Compromise - nueva persona: "${person}" → "${personId}"`);
          }
        }
      }
      
      // Detectar lugares que Compromise identifica
      const places = doc.places().out('array');
      console.log('🔍 Compromise detectó lugares:', places);
      
      for (const place of places) {
        if (place.length < 3) continue; // Saltar lugares muy cortos
        
        if (!this.locationMapping.has(place)) {
          const locationId = `[LUGAR ${this.locationCounter++}]`;
          this.locationMapping.set(place, locationId);
          const regex = new RegExp(`\\b${place.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
          processedContent = processedContent.replace(regex, locationId);
          console.log(`✅ Compromise - lugar: "${place}" → "${locationId}"`);
        }
      }
      
      // Detectar organizaciones
      const organizations = doc.organizations().out('array');
      console.log('🔍 Compromise detectó organizaciones:', organizations);
      
      for (const org of organizations) {
        if (org.length < 3) continue;
        
        const regex = new RegExp(`\\b${org.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        processedContent = processedContent.replace(regex, '[ORGANIZACIÓN]');
        console.log(`✅ Compromise - organización: "${org}" → "[ORGANIZACIÓN]"`);
      }

      console.log(`✅ Capa adicional Compromise completada - ${people.length} personas, ${places.length} lugares, ${organizations.length} organizaciones procesadas`);
      return processedContent;
      
    } catch (error) {
      console.warn('⚠️ Error en procesamiento con Compromise:', error.message);
      return content;
    }
  }

  /**
   * Detecta el idioma del contenido usando patrones básicos
   * @param {string} content - Contenido del chat
   * @returns {string} - Código de idioma detectado
   */
  detectLanguage(content) {
    try {
      // Limpiar el contenido para mejor detección
      const cleanContent = content
        .replace(/\[\d{1,2}\/\d{1,2}\/\d{2}, \d{1,2}:\d{1,2}:\d{1,2}\]/g, '') // timestamps iOS
        .replace(/\d{1,2}\/\d{1,2}\/\d{2}, \d{1,2}:\d{2} -/g, '') // timestamps Android
        .replace(/Participante \d+:/g, '') // participantes ya anonimizados
        .toLowerCase()
        .trim();

      if (cleanContent.length < 10) {
        return this.currentLanguage; // Muy poco texto, usar idioma por defecto
      }

      // Detección básica por patrones de palabras comunes
      const patterns = {
        'es': ['hola', 'cómo', 'estás', 'llamo', 'me', 'te', 'veo', 'mañana', 'traigo', 'hermano', 'padre', 'puedes', 'traer', 'sí', 'también', 'en', 'la'],
        'en': ['hello', 'the', 'and', 'you', 'are', 'with', 'this', 'that', 'have', 'from', 'will', 'great', 'should', 'bring', 'yes', 'also', 'your', 'meet', 'at'],
        'de': ['ich', 'und', 'der', 'die', 'das', 'mit', 'sie', 'ist', 'ein', 'auf', 'hallo', 'sehe', 'morgen', 'in', 'soll', 'meinen', 'ja', 'auch', 'ihre'],
        'fr': ['je', 'de', 'le', 'et', 'à', 'un', 'être', 'avoir', 'que', 'pour', 'bonjour', 'vous', 'comment', 'mon', 'mes', 'avec', 'ça', 'va'],
        'it': ['io', 'di', 'il', 'la', 'e', 'che', 'un', 'essere', 'avere', 'da', 'ciao', 'come', 'mio', 'nome', 'con', 'stai', 'chiamo', 'mi'],
        'ca': ['el', 'la', 'de', 'que', 'i', 'a', 'en', 'un', 'ser', 'amb', 'com', 'estàs', 'em', 'dic', 'també', 'porto', 'meu', 'demà'],
        'eu': ['eta', 'da', 'bat', 'izan', 'du', 'dut', 'gara', 'dira', 'hau', 'hori', 'kaixo', 'ikusiko', 'bihar', 'ekarri', 'zer', 'moduz', 'naiz'],
        'pt': ['eu', 'você', 'como', 'está', 'olá', 'bem', 'muito', 'para', 'com', 'não'],
        'ru': ['я', 'ты', 'как', 'дела', 'привет', 'хорошо', 'что', 'это', 'не'],
        'ar': ['مرحبا', 'كيف', 'أنت', 'الحال', 'بخير', 'ما', 'هذا', 'لا'],
        'zh': ['你好', '怎么样', '很好', '什么', '这个', '那个', '不是', '我'],
        'ja': ['こんにちは', 'どう', 'です', 'ます', 'これ', 'それ', 'ない', 'です']
      };

      let maxScore = 0;
      let detectedLang = 'es';

      for (const [lang, words] of Object.entries(patterns)) {
        const score = words.reduce((count, word) => {
          return count + (cleanContent.includes(word) ? 1 : 0);
        }, 0);

        if (score > maxScore) {
          maxScore = score;
          detectedLang = lang;
        }
      }

      // Si ningún patrón coincide suficientemente, usar detección por caracteres especiales
      if (maxScore < 2) {
        if (cleanContent.includes('ñ') || cleanContent.includes('¿') || cleanContent.includes('¡')) {
          detectedLang = 'es';
        } else if (cleanContent.includes('ü') || cleanContent.includes('ß')) {
          detectedLang = 'de';
        } else if (cleanContent.includes('ç') && cleanContent.includes('à')) {
          detectedLang = 'fr';
        } else if (cleanContent.includes('ç') && cleanContent.includes('è')) {
          detectedLang = 'ca';
        } else if (cleanContent.includes('tx') || cleanContent.includes('kx')) {
          detectedLang = 'eu';
        } else if (cleanContent.match(/[\u4e00-\u9fff]/)) {
          detectedLang = 'zh';
        } else if (cleanContent.match(/[\u3040-\u309f\u30a0-\u30ff]/)) {
          detectedLang = 'ja';
        } else if (cleanContent.match(/[\u0600-\u06ff]/)) {
          detectedLang = 'ar';
        } else if (cleanContent.match(/[\u0400-\u04ff]/)) {
          detectedLang = 'ru';
        }
      }

      // Lógica especial para distinguir español de catalán
      if (detectedLang === 'ca') {
        const spanishWords = ['hola', 'cómo', 'me', 'te', 'hermano', 'padre', 'sí', 'también'];
        const catWords = ['com', 'em', 'germà', 'pare', 'també', 'porto'];
        
        const spanishScore = spanishWords.filter(word => cleanContent.includes(word)).length;
        const catScore = catWords.filter(word => cleanContent.includes(word)).length;
        
        if (spanishScore > catScore) {
          detectedLang = 'es';
        }
      }

      this.currentLanguage = detectedLang;
      console.log(`Idioma detectado: ${this.supportedLanguages[detectedLang]?.name || detectedLang}`);
      return detectedLang;
    } catch (error) {
      console.warn('Error en detección de idioma:', error.message);
      return 'es'; // Fallback a español
    }
  }

  /**
   * Obtiene la palabra "participante" en el idioma especificado
   * @param {string} language - Código de idioma
   * @returns {string} - Palabra "participante" en el idioma correspondiente
   */
  getParticipantWord(language) {
    const participantWords = {
      'es': 'Participante',
      'en': 'Participant', 
      'de': 'Teilnehmer',
      'it': 'Partecipante',
      'fr': 'Participant',
      'ca': 'Participant',
      'eu': 'Partaide',
      'pt': 'Participante',
      'ru': 'Участник',
      'ar': 'مشارك',
      'zh': '参与者',
      'ja': '参加者'
    };
    
    return participantWords[language] || participantWords['es']; // fallback a español
  }

  /**
   * Anonimiza los nombres de los participantes del chat
   * @param {string} content - Contenido del chat
   * @returns {string} - Contenido con participantes anonimizados
   */
  anonymizeParticipants(content) {
    // Detectar el idioma del contenido antes de procesar participantes
    const detectedLanguage = this.detectLanguage(content);
    console.log(`🌐 Idioma detectado para participantes: ${detectedLanguage}`);
    
    // Obtener la palabra "participante" en el idioma detectado
    const participantWord = this.getParticipantWord(detectedLanguage);
    console.log(`📝 Usando palabra "${participantWord}" para participantes`);
    
    const lines = content.split('\n');
    const processedLines = lines.map(line => {
      // Patrón para iOS: [DD/MM/YY, HH:mm:ss] Nombre: Mensaje
      const iosPattern = /\[(\d{1,2}\/\d{1,2}\/\d{2}), \d{1,2}:\d{1,2}:\d{1,2}\] ([^:]+):/;
      // Patrón para Android: MM/DD/YY, HH:mm - Nombre: Mensaje
      const androidPattern = /(\d{1,2}\/\d{1,2}\/\d{2}), \d{1,2}:\d{2} - ([^:]+):/;
      
      const iosMatch = line.match(iosPattern);
      const androidMatch = line.match(androidPattern);
      
      if (iosMatch || androidMatch) {
        const participant = (iosMatch ? iosMatch[2] : androidMatch[2]).trim();
        
        // Si ya procesamos este participante, usar el mismo ID
        if (this.participantMapping.has(participant)) {
          const participantId = this.participantMapping.get(participant);
          if (iosMatch) {
            return line.replace(iosMatch[0], `[${iosMatch[1]}] ${participantId}:`);
          } else {
            return line.replace(androidMatch[0], `${androidMatch[1]} - ${participantId}:`);
          }
        }
        
        // Crear nuevo ID para el participante usando la palabra correcta según el idioma
        const participantId = `${participantWord} ${this.participantCounter++}`;
        this.participantMapping.set(participant, participantId);
        console.log(`👤 Nuevo participante: "${participant}" → "${participantId}"`);
        
        if (iosMatch) {
          return line.replace(iosMatch[0], `[${iosMatch[1]}] ${participantId}:`);
        } else {
          return line.replace(androidMatch[0], `${androidMatch[1]} - ${participantId}:`);
        }
      }
      
      return line;
    });

    console.log('Mapeo de participantes creado:', Object.fromEntries(this.participantMapping));
    return processedLines.join('\n');
  }

  /**
   * Anonimización usando IA (Transformer.js)
   * @param {string} content - Contenido del chat
   * @returns {string} - Contenido anonimizado con IA
   */
  async anonymizeWithAI(content) {
    if (!this.modelLoaded) {
      console.log('🔄 Modelo no cargado, usando patrones regex...');
      return this.anonymizeWithPatterns(content, this.currentLanguage);
    }

    try {
      // Limpiar contenido para procesamiento (preservar estructura)
      const cleanContent = content
        .replace(/\[\d{1,2}\/\d{1,2}\/\d{2}, \d{1,2}:\d{1,2}:\d{1,2}\]/g, '[TIMESTAMP]') // preservar timestamps iOS
        .replace(/\d{1,2}\/\d{1,2}\/\d{2}, \d{1,2}:\d{2} -/g, '[TIMESTAMP] -') // preservar timestamps Android
        .replace(/Participante \d+:/g, '[PARTICIPANT]:'); // preservar participantes ya procesados

      // Ejecutar reconocimiento de entidades con IA
      const entities = await this.nerModel(cleanContent);
      
      console.log('🔍 Entidades detectadas por IA:', entities.map(e => `${e.word} (${e.entity_group || e.entity})`));
      
      let processedContent = content;
      
      // Procesar entidades detectadas (ordenar por posición descendente para evitar conflictos de índices)
      const sortedEntities = entities
        .filter(entity => entity.word && entity.word.length > 1) // Filtrar entidades muy cortas
        .sort((a, b) => b.start - a.start);
      
      for (const entity of sortedEntities) {
        let entityText = entity.word;
        const entityType = entity.entity_group || entity.entity;
        
        // Limpiar el texto de la entidad (BERT a veces incluye ##)
        entityText = entityText.replace(/^##/, '').trim();
        
        if (entityText.length < 2) continue; // Saltar entidades muy cortas
        
        let replacement = '';
        
        switch (entityType) {
          case 'PER':
          case 'PERSON':
          case 'B-PER':
          case 'I-PER':
            // Verificar si es un participante del chat
            const isParticipant = Array.from(this.participantMapping.keys()).some(participant => 
              participant.toLowerCase().includes(entityText.toLowerCase()) || 
              entityText.toLowerCase().includes(participant.toLowerCase())
            );
            
            if (isParticipant) {
              // Si es participante mencionado, usar su ID de participante
              const participantId = this.findParticipantId(entityText);
              if (participantId) {
                replacement = participantId;
                console.log(`✅ Reemplazando participante mencionado: "${entityText}" → "${participantId}"`);
              } else {
                console.log(`⚠️ No se encontró ID para participante: ${entityText}`);
                continue; // Si no se encuentra el ID, saltar
              }
            } else {
              // Es una persona mencionada normal → [PERSONA X]
              if (!this.mentionedPersonMapping.has(entityText)) {
                const personId = `[PERSONA ${this.mentionedPersonCounter++}]`;
                this.mentionedPersonMapping.set(entityText, personId);
                replacement = personId;
              } else {
                replacement = this.mentionedPersonMapping.get(entityText);
              }
            }
            break;
            
          case 'LOC':
          case 'LOCATION':
          case 'B-LOC':
          case 'I-LOC':
            if (!this.locationMapping.has(entityText)) {
              const locationId = `[LUGAR ${this.locationCounter++}]`;
              this.locationMapping.set(entityText, locationId);
              replacement = locationId;
            } else {
              replacement = this.locationMapping.get(entityText);
            }
            break;
            
          case 'ORG':
          case 'ORGANIZATION':
          case 'B-ORG':
          case 'I-ORG':
            replacement = '[ORGANIZACIÓN]';
            break;
            
          default:
            continue; // No procesar otros tipos
        }
        
        if (replacement) {
          // Reemplazar en el contenido con coincidencia de palabra completa
          const regex = new RegExp(`\\b${entityText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
          const beforeReplace = processedContent;
          processedContent = processedContent.replace(regex, replacement);
          
          if (beforeReplace !== processedContent) {
            console.log(`✅ Reemplazado: "${entityText}" → "${replacement}"`);
          }
        }
      }
      
      // Complementar con patrones regex para roles familiares y profesionales
      processedContent = this.addRolePatterns(processedContent, this.currentLanguage);
      
      console.log(`✅ Procesamiento con IA completado - ${entities.length} entidades detectadas, ${this.mentionedPersonCounter - 1} personas anonimizadas`);
      return processedContent;
      
    } catch (error) {
      console.warn('⚠️ Error en procesamiento con IA, usando patrones regex:', error.message);
      return this.anonymizeWithPatterns(content, this.currentLanguage);
    }
  }

  /**
   * Añade patrones de roles familiares y profesionales
   * @param {string} content - Contenido a procesar
   * @param {string} language - Código de idioma
   * @returns {string} - Contenido con roles anonimizados
   */
  addRolePatterns(content, language) {
    const rolePatterns = {
      'spa': {
        'FAMILIAR': /\b(hermano|hermana|padre|madre|hijo|hija|abuelo|abuela|tío|tía|primo|prima)\b/gi,
        'PROFESIONAL': /\b(doctor|doctora|profesor|profesora|médico|médica|abogado|abogada|ingeniero|ingeniera)\b/gi
      },
      'eng': {
        'FAMILIAR': /\b(brother|sister|father|mother|son|daughter|grandfather|grandmother|uncle|aunt|cousin)\b/gi,
        'PROFESIONAL': /\b(doctor|professor|lawyer|engineer|teacher|nurse|physician)\b/gi
      },
      'deu': {
        'FAMILIAR': /\b(bruder|schwester|vater|mutter|sohn|tochter|großvater|großmutter|onkel|tante)\b/gi,
        'PROFESIONAL': /\b(doktor|professor|anwalt|ingenieur|lehrer|arzt)\b/gi
      },
      'fra': {
        'FAMILIAR': /\b(frère|sœur|père|mère|fils|fille|grand-père|grand-mère|oncle|tante)\b/gi,
        'PROFESIONAL': /\b(docteur|professeur|avocat|ingénieur|enseignant|médecin)\b/gi
      },
      'ita': {
        'FAMILIAR': /\b(fratello|sorella|padre|madre|figlio|figlia|nonno|nonna|zio|zia)\b/gi,
        'PROFESIONAL': /\b(dottore|professore|avvocato|ingegnere|insegnante|medico)\b/gi
      },
      'cat': {
        'FAMILIAR': /\b(germà|germana|pare|mare|fill|filla|avi|àvia|oncle|tia)\b/gi,
        'PROFESIONAL': /\b(doctor|professora|advocat|enginyer|mestre|metge)\b/gi
      },
      'eus': {
        'FAMILIAR': /\b(anaia|ahizpa|aita|ama|seme|alaba|aitona|amona|osaba|izeba)\b/gi,
        'PROFESIONAL': /\b(doktore|irakasle|abokatu|injineru|mediku)\b/gi
      }
    };

    const langRoles = rolePatterns[language] || rolePatterns['spa'];
    let processedContent = content;
    
    for (const [category, pattern] of Object.entries(langRoles)) {
      processedContent = processedContent.replace(pattern, `[${category}]`);
    }

    return processedContent;
  }

  /**
   * Anonimización usando patrones específicos por idioma (fallback)
   * @param {string} content - Contenido del chat
   * @param {string} language - Código de idioma
   * @returns {string} - Contenido anonimizado
   */
  anonymizeWithPatterns(content, language) {
    let processedContent = content;

    // Patrones de nombres comunes por idioma
    const namePatterns = {
      'spa': [
        // Nombres españoles comunes
        /\b(María|José|Antonio|Ana|Manuel|Carmen|Francisco|Laura|David|Elena|Carlos|Isabel|Alejandro|Patricia|Miguel|Rosa|Juan|Cristina|Pedro|Dolores|García|Rodríguez|González|Fernández|López|Martínez|Sánchez|Pérez)\b/gi,
        // Títulos profesionales
        /\b(Doctor|Doctora|Dr\.|Dra\.|Profesor|Profesora|Prof\.|Señor|Señora|Sr\.|Sra\.)\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+/gi
      ],
      'eng': [
        // Nombres ingleses comunes
        /\b(John|Mary|James|Patricia|Robert|Jennifer|Michael|Linda|William|Elizabeth|David|Barbara|Richard|Susan|Joseph|Jessica|Thomas|Sarah|Christopher|Karen|Smith|Johnson|Williams|Brown|Jones|Garcia|Miller|Davis)\b/gi,
        // Títulos profesionales
        /\b(Doctor|Dr\.|Professor|Prof\.|Mister|Mr\.|Misses|Mrs\.|Miss)\s+[A-Z][a-z]+/gi
      ],
      'deu': [
        // Nombres alemanes comunes
        /\b(Hans|Anna|Klaus|Maria|Wolfgang|Elisabeth|Günter|Ursula|Karl|Ingrid|Heinrich|Christa|Hermann|Petra|Gerhard|Monika|Müller|Schmidt|Schneider|Fischer|Weber|Meyer)\b/gi,
        // Títulos profesionales
        /\b(Doktor|Dr\.|Professor|Prof\.|Herr|Frau)\s+[A-ZÄÖÜ][a-zäöüß]+/gi
      ],
      'fra': [
        // Nombres franceses comunes
        /\b(Pierre|Marie|Jean|Monique|Michel|Françoise|Philippe|Catherine|Alain|Sylvie|Jacques|Martine|Bernard|Christine|Martin|Bernard|Thomas|Petit|Robert|Richard)\b/gi,
        // Títulos profesionales
        /\b(Docteur|Dr\.|Professeur|Prof\.|Monsieur|M\.|Madame|Mme\.|Mademoiselle|Mlle\.)\s+[A-ZÀÂÄÉÈÊËÏÎÔÖÙÛÜŸÇ][a-zàâäéèêëïîôöùûüÿç]+/gi
      ],
      'ita': [
        // Nombres italianos comunes
        /\b(Giuseppe|Maria|Antonio|Anna|Francesco|Giuseppina|Giovanni|Rosa|Luigi|Angela|Vincenzo|Giovanna|Rossi|Russo|Ferrari|Esposito|Bianchi|Romano)\b/gi,
        // Títulos profesionales
        /\b(Dottore|Dott\.|Professore|Prof\.|Signore|Sig\.|Signora|Sig\.ra)\s+[A-ZÀÈÉÌÍÎÒÓÙÚ][a-zàèéìíîòóùú]+/gi
      ],
      'cat': [
        // Nombres catalanes
        /\b(Pere|Maria|Joan|Anna|Josep|Montserrat|Francesc|Rosa|Antoni|Carmen|Jordi|Dolors|Ramon|Pilar|Xavier|Teresa|Pau|Núria|Sala|Puig|Roca|Soler|Vila)\b/gi,
        // Títulos profesionales catalanes
        /\b(Doctor|Doctora|Dr\.|Dra\.|Professor|Professora|Senyor|Sr\.|Senyora|Sra\.)\s+[A-ZÀÈÉÍÒÓÚ][a-zàèéíòóúç]+/gi
      ],
      'eus': [
        // Nombres euskeras
        /\b(Mikel|Maite|Jon|Amaia|Iker|Nagore|Aitor|Leire|Unai|Ane|Gorka|Miren|Asier|Garazi|Ander|Oihana|Etxeberria|Agirre|Echeverría|Urrutia)\b/gi,
        // Títulos profesionales euskeras
        /\b(Doktore|Irakasle|Jaun|And\.)\s+[A-Z][a-z]+/gi
      ]
    };

    // Aplicar patrones específicos del idioma
    const patterns = namePatterns[language] || namePatterns['spa'];
    
    patterns.forEach(pattern => {
      processedContent = processedContent.replace(pattern, (match) => {
        if (!this.mentionedPersonMapping.has(match)) {
          const personId = `[PERSONA ${this.mentionedPersonCounter++}]`;
          this.mentionedPersonMapping.set(match, personId);
          return personId;
        }
        return this.mentionedPersonMapping.get(match);
      });
    });

    // Patrones de direcciones y lugares por idioma
    const locationPatterns = {
      'spa': [
        /\b(Calle|Avenida|Plaza|Paseo|Carrera)\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ\s]+\d*/gi,
        /\b(Madrid|Barcelona|Valencia|Sevilla|Zaragoza|Málaga|Murcia|Palma|Las Palmas|Bilbao)\b/gi
      ],
      'eng': [
        /\b(Street|Avenue|Road|Boulevard|Drive)\s+[A-Z][a-z\s]+\d*/gi,
        /\b(New York|Los Angeles|Chicago|Houston|Phoenix|Philadelphia|San Antonio|San Diego|Dallas|San Jose)\b/gi
      ],
      'deu': [
        /\b(Straße|Allee|Platz|Weg|Gasse)\s+[A-ZÄÖÜ][a-zäöüß\s]+\d*/gi,
        /\b(Berlin|Hamburg|München|Köln|Frankfurt|Stuttgart|Düsseldorf|Dortmund|Essen|Leipzig)\b/gi
      ],
      'fra': [
        /\b(Rue|Avenue|Boulevard|Place|Chemin)\s+[A-ZÀÂÄÉÈÊËÏÎÔÖÙÛÜŸÇ][a-zàâäéèêëïîôöùûüÿç\s]+\d*/gi,
        /\b(Paris|Marseille|Lyon|Toulouse|Nice|Nantes|Strasbourg|Montpellier|Bordeaux|Lille)\b/gi
      ],
      'ita': [
        /\b(Via|Viale|Piazza|Corso|Strada)\s+[A-ZÀÈÉÌÍÎÒÓÙÚ][a-zàèéìíîòóùú\s]+\d*/gi,
        /\b(Roma|Milano|Napoli|Torino|Palermo|Genova|Bologna|Firenze|Bari|Catania)\b/gi
      ],
      'cat': [
        /\b(Carrer|Avinguda|Plaça|Passeig)\s+[A-ZÀÈÉÍÒÓÚ][a-zàèéíòóúç\s]+\d*/gi,
        /\b(Barcelona|Girona|Lleida|Tarragona|Sabadell|Terrassa|Badalona|Hospitalet)\b/gi
      ],
      'eus': [
        /\b(Kalea|Etorbidea|Plaza)\s+[A-Z][a-z\s]+\d*/gi,
        /\b(Bilbao|Donostia|Vitoria|Gasteiz|Iruña|Pamplona|Barakaldo|Getxo)\b/gi
      ]
    };

    const locPatterns = locationPatterns[language] || locationPatterns['spa'];
    locPatterns.forEach(pattern => {
      processedContent = processedContent.replace(pattern, (match) => {
        if (!this.locationMapping.has(match)) {
          const locationId = `[LUGAR ${this.locationCounter++}]`;
          this.locationMapping.set(match, locationId);
          return locationId;
        }
        return this.locationMapping.get(match);
      });
    });

    // Añadir patrones de roles
    processedContent = this.addRolePatterns(processedContent, language);

    return processedContent;
  }

  /**
   * Anonimiza números según las reglas especificadas
   * @param {string} content - Contenido del chat
   * @returns {string} - Contenido con números anonimizados
   */
  anonymizeNumbers(content) {
    // Preservar timestamps y fechas
    const dateTimePattern = /\[\d{1,2}\/\d{1,2}\/\d{2}, \d{1,2}:\d{1,2}:\d{1,2}\]|\d{1,2}\/\d{1,2}\/\d{2}, \d{1,2}:\d{2} -/g;
    
    const dateMatches = [];
    let match;
    while ((match = dateTimePattern.exec(content)) !== null) {
      dateMatches.push({
        start: match.index,
        end: match.index + match[0].length
      });
    }
    
    const numberPattern = /(?:@\d+|\b\d{1,3}\b)/g;
    
    return content.replace(numberPattern, (match, offset) => {
      // Verificar si este número está dentro de un timestamp
      const isInTimestamp = dateMatches.some(dateMatch => 
        offset >= dateMatch.start && offset < dateMatch.end
      );
      
      if (isInTimestamp) {
        return match; // Preservar números en timestamps
      }
      
      // Procesar números
      if (match.startsWith('@')) {
        const number = match.substring(1);
        return number.length === 1 ? '' : '@' + number[0];
      }
      
      const length = match.length;
      return length === 1 ? '' : match[0];
    });
  }

  /**
   * Aplica limpieza específica por idioma
   * @param {string} content - Contenido a limpiar
   * @param {string} language - Código de idioma
   * @returns {string} - Contenido limpio
   */
  applyLanguageSpecificCleanup(content, language) {
    const cleanupPatterns = {
      'spa': [
        /\b\d{8}[A-Z]\b/g,                      // DNI españoles
        /\b(?:\+34|0034|34)?[6789]\d{8}\b/g,    // Teléfonos españoles
        /\b\d{5}\b/g                            // Códigos postales
      ],
      'deu': [
        /\b(?:\+49|0049|49)?[1-9]\d{10,11}\b/g, // Teléfonos alemanes
        /\b\d{5}\b/g                            // Códigos postales
      ],
      'fra': [
        /\b(?:\+33|0033|33)?[1-9]\d{8}\b/g,     // Teléfonos franceses
        /\b\d{5}\b/g                            // Códigos postales
      ],
      'ita': [
        /\b(?:\+39|0039|39)?[3][0-9]{8,9}\b/g,  // Teléfonos italianos
        /\b\d{5}\b/g                            // Códigos postales
      ]
    };

    const patterns = cleanupPatterns[language] || [];
    let cleanedContent = content;

    patterns.forEach((pattern, index) => {
      if (index === 0) {
        cleanedContent = cleanedContent.replace(pattern, '[ID_DOCUMENTO]');
      } else if (index === 1) {
        cleanedContent = cleanedContent.replace(pattern, '[TELÉFONO]');
      } else if (index === 2) {
        cleanedContent = cleanedContent.replace(pattern, '[CÓDIGO_POSTAL]');
      }
    });

    return cleanedContent;
  }

  /**
   * Procesa el contenido para Azure (versión con IA)
   * @param {string} content - Contenido del chat
   * @returns {Promise<string>} - Contenido procesado
   */
  async processContentForAzure(content) {
    console.log('🚀 Iniciando procesamiento con IA multiidioma...');
    console.log('📄 TEXTO ORIGINAL:');
    console.log('=' .repeat(50));
    console.log(content);
    console.log('=' .repeat(50));
    
    // 1. Inicializar IA si no está cargada
    if (this.useAI && !this.modelLoaded) {
      await this.initializeAI();
    }
    
    // 2. Detectar idioma del contenido
    const detectedLanguage = this.detectLanguage(content);
    console.log(`Procesando en idioma: ${this.supportedLanguages[detectedLanguage]?.name || detectedLanguage}`);
    
    // 3. Anonimizar participantes (independiente del método)
    let processedContent = this.anonymizeParticipants(content);
    
    // 4. Anonimizar personas mencionadas (IA o patrones)
    if (this.useAI && this.modelLoaded) {
      processedContent = await this.anonymizeWithAI(processedContent);
    } else {
      processedContent = this.anonymizeWithPatterns(processedContent, detectedLanguage);
    }
    
    // 4.5. Post-procesamiento para garantizar que todos los participantes estén anonimizados
    processedContent = this.postProcessParticipantNames(processedContent);
    
    // 4.7. Capa adicional con Compromise.js para máxima anonimización
    processedContent = await this.anonymizeWithCompromise(processedContent);
    
    // 5. Anonimizar números (preservando timestamps)
    processedContent = this.anonymizeNumbers(processedContent);
    
    // 6. Aplicar limpieza específica del idioma
    processedContent = this.applyLanguageSpecificCleanup(processedContent, detectedLanguage);
    
    console.log(`✅ Procesamiento completado para idioma: ${detectedLanguage}`);
    
    // MOSTRAR TEXTO FINAL PARA AZURE DE FORMA MUY CLARA
    console.log('\n');
    console.log('🚀🚀🚀 TEXTO QUE SE ENVÍA A AZURE 🚀🚀🚀');
    console.log('████████████████████████████████████████████');
    console.log(processedContent);
    console.log('████████████████████████████████████████████');
    console.log('');
    
    return processedContent;
  }

  /**
   * Obtiene el mapeo actual de participantes
   */
  getParticipantMapping() {
    return this.participantMapping;
  }

  /**
   * Obtiene el mapeo actual de personas mencionadas
   */
  getMentionedPersonMapping() {
    return this.mentionedPersonMapping;
  }

  /**
   * Reinicia los contadores y mapeos
   */
  reset() {
    this.participantCounter = 1;
    this.mentionedPersonCounter = 1;
    this.locationCounter = 1;
    this.participantMapping.clear();
    this.mentionedPersonMapping.clear();
    this.locationMapping.clear();
    this.currentLanguage = 'spa';
  }

  /**
   * Obtiene información sobre los idiomas soportados
   */
  getSupportedLanguages() {
    const languageInfo = {};
    for (const [code, config] of Object.entries(this.supportedLanguages)) {
      languageInfo[code] = {
        name: config.name,
        aiSupport: config.aiSupport && this.useAI,
        modelLoaded: this.modelLoaded,
        patternSupport: config.patternSupport
      };
    }
    return languageInfo;
  }

  /**
   * Obtiene estadísticas del procesamiento actual
   */
  getProcessingStats() {
    return {
      currentLanguage: this.currentLanguage,
      participantsProcessed: this.participantCounter - 1,
      mentionedPeopleProcessed: this.mentionedPersonCounter - 1,
      locationsProcessed: this.locationCounter - 1,
      totalMappings: this.participantMapping.size + this.mentionedPersonMapping.size + this.locationMapping.size,
      aiEnabled: this.useAI,
      modelLoaded: this.modelLoaded,
      languageSupport: this.getSupportedLanguages()
    };
  }

  /**
   * Configura el idioma por defecto
   */
  setDefaultLanguage(languageCode) {
    if (this.supportedLanguages[languageCode]) {
      this.currentLanguage = languageCode;
      console.log(`Idioma por defecto cambiado a: ${this.supportedLanguages[languageCode].name}`);
    } else {
      console.warn(`Idioma no soportado: ${languageCode}`);
    }
  }

  /**
   * Configura el modo de procesamiento (IA o patrones)
   */
  setAIMode(enabled) {
    this.useAI = enabled;
    console.log(`Modo IA ${enabled ? 'activado' : 'desactivado'}`);
  }

  /**
   * Obtiene todos los mapeos actuales para debugging
   */
  getAllMappings() {
    return {
      participants: Object.fromEntries(this.participantMapping),
      mentionedPeople: Object.fromEntries(this.mentionedPersonMapping),
      locations: Object.fromEntries(this.locationMapping)
    };
  }
}

// Crear instancia del servicio
const anonymizationService = new AnonymizationService();

// Exportación compatible con diferentes entornos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { anonymizationService };
} else if (typeof window !== 'undefined') {
  window.anonymizationService = anonymizationService;
}

// También hacer disponible por defecto
if (typeof exports !== 'undefined') {
  exports.anonymizationService = anonymizationService;
} 