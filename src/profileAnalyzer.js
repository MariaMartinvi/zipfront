/**
 * profileAnalyzer.js - Analizador de perfiles para el cliente
 * 
 * Implementación en JavaScript del analizador de perfiles de usuarios
 * basado en el código backend original de Python (Analisis_top.py).
 */

import { detectarFormatoArchivo } from './formatDetector';

// Patrones de primera persona por idioma
const PATRONES_PRIMERA_PERSONA = {
  'es': /\byo\b|\bmi\b|\bme\b|\bconmigo\b/i,
  'en': /\bi\b|\bmy\b|\bme\b|\bmyself\b|\bmine\b/i,
  'fr': /\bje\b|\bmoi\b|\bm\'|\bme\b|\bmon\b|\bma\b|\bmes\b/i,
  'de': /\bich\b|\bmein\b|\bmir\b|\bmich\b|\bmeine\b/i,
  'it': /\bio\b|\bmio\b|\bmi\b|\bmia\b|\bmie\b|\bmiei\b|\bme\b/i
};

/**
 * Detecta el uso de primera persona en un texto según el idioma especificado
 * 
 * @param {string} texto - Texto a analizar
 * @param {string} idioma - Código de idioma ('es', 'en', 'fr', 'de', 'it')
 * @returns {boolean} - true si se detecta uso de primera persona
 */
export const detectarPrimeraPersona = (texto, idioma = 'es') => {
  // Si el idioma no está soportado, usar español
  if (!idioma || !PATRONES_PRIMERA_PERSONA[idioma]) {
    idioma = 'es';
  }
  
  // Usar el patrón específico para el idioma
  const patron = PATRONES_PRIMERA_PERSONA[idioma];
  return patron.test(texto.toLowerCase());
};

/**
 * Analiza un mensaje individual
 * 
 * @param {string} linea - Línea de texto a analizar
 * @param {string} formato - Formato del chat ('ios' o 'android')
 * @param {Object|null} mensajeAnterior - Mensaje anterior (para continuaciones)
 * @returns {Object|null} - Objeto con los datos del mensaje o null si no es válido
 */
const analizarMensaje = (linea, formato, mensajeAnterior = null) => {
  linea = linea.trim();
  
  // Si es una continuación de mensaje anterior
  if (mensajeAnterior && 
      !(linea.startsWith('[') || 
        (formato === "android" && /^\d{1,2}\/\d{1,2}\/\d{2}/.test(linea)))) {
    mensajeAnterior.texto += `\n${linea}`;
    mensajeAnterior.es_multilínea = true;
    return mensajeAnterior;
  }
  
  // Patrones para extraer componentes según el formato
  let match = null;
  
  if (formato === "ios") {
    // Patrones para formato iOS
    const patronIos1 = /^\[(\d{1,2}\/\d{1,2}\/\d{2}),\s*(\d{1,2}:\d{2}(?::\d{2})?)\]\s*([^:]+):\s*(.*)/;
    const patronIos2 = /^\[(\d{1,2}\/\d{1,2}\/\d{4})\s+(\d{1,2}:\d{2}(?::\d{2})?)\]\s*([^:]+):\s*(.*)/;
    
    match = linea.match(patronIos1) || linea.match(patronIos2);
  } else { // formato android o desconocido
    // Patrón Android estándar y alternativo
    const patronAndroid1 = /^(\d{1,2}\/\d{1,2}\/\d{2}),\s*(\d{1,2}:\d{2})\s*-\s*([^:]+):\s*(.+)/;
    const patronAndroid2 = /^(\d{1,2}\/\d{1,2}\/\d{4}),\s*(\d{1,2}:\d{2})\s*-\s*([^:]+):\s*(.+)/;
    
    match = linea.match(patronAndroid1) || linea.match(patronAndroid2);
  }
  
  if (match) {
    const [_, fecha, hora, nombre, mensaje] = match;
    try {
      // Parsear fecha y hora
      let fechaHora = parsearFechaHora(fecha, hora, formato);
      
      if (!fechaHora) {
        return null;
      }
      
      return {
        fecha: fechaHora,
        hora: hora,
        usuario: nombre.trim(),
        texto: mensaje.trim() || "",
        es_multilínea: false
      };
    } catch (e) {
      console.error(`Error al parsear fecha/hora (${fecha} ${hora}):`, e);
      return null;
    }
  }
  return null;
};

/**
 * Parsea una fecha y hora según el formato del chat
 * 
 * @param {string} fecha - Fecha en formato string (DD/MM/YY o MM/DD/YY)
 * @param {string} hora - Hora en formato string (HH:MM o HH:MM:SS)
 * @param {string} formato - Formato del chat ('ios' o 'android')
 * @returns {Date|null} - Objeto Date o null si hay error
 */
const parsearFechaHora = (fecha, hora, formato) => {
  try {
    // Usar el componente año para determinar el formato (yy o yyyy)
    const partesFecha = fecha.split('/');
    const tieneAnioCompleto = partesFecha[2].length === 4;
    
    // Usar el componente hora para determinar si incluye segundos
    const tieneSegundos = hora.split(':').length > 2;
    
    let fechaHora;
    
    if (formato === "ios") {
      if (tieneAnioCompleto) {
        if (tieneSegundos) {
          fechaHora = new Date(`${partesFecha[1]}/${partesFecha[0]}/${partesFecha[2]} ${hora}`);
        } else {
          fechaHora = new Date(`${partesFecha[1]}/${partesFecha[0]}/${partesFecha[2]} ${hora}:00`);
        }
      } else {
        const anioCompleto = parseInt(partesFecha[2]) < 50 ? `20${partesFecha[2]}` : `19${partesFecha[2]}`;
        if (tieneSegundos) {
          fechaHora = new Date(`${partesFecha[1]}/${partesFecha[0]}/${anioCompleto} ${hora}`);
        } else {
          fechaHora = new Date(`${partesFecha[1]}/${partesFecha[0]}/${anioCompleto} ${hora}:00`);
        }
      }
    } else { // android
      if (tieneAnioCompleto) {
        fechaHora = new Date(`${partesFecha[1]}/${partesFecha[0]}/${partesFecha[2]} ${hora}`);
      } else {
        const anioCompleto = parseInt(partesFecha[2]) < 50 ? `20${partesFecha[2]}` : `19${partesFecha[2]}`;
        fechaHora = new Date(`${partesFecha[1]}/${partesFecha[0]}/${anioCompleto} ${hora}`);
      }
    }
    
    return fechaHora;
  } catch (e) {
    console.error(`Error parseando fecha/hora:`, e);
    return null;
  }
};

/**
 * Encuentra el valor máximo en un objeto
 * 
 * @param {Object} obj - Objeto con valores numéricos
 * @returns {Array} - [clave, valor] del máximo
 */
const encontrarMaximo = (obj) => {
  if (!obj || Object.keys(obj).length === 0) {
    return [null, 0];
  }
  return Object.entries(obj).reduce((max, actual) => 
    actual[1] > max[1] ? actual : max, [null, -Infinity]);
};

/**
 * Encuentra el valor mínimo en un objeto
 * 
 * @param {Object} obj - Objeto con valores numéricos
 * @returns {Array} - [clave, valor] del mínimo
 */
const encontrarMinimo = (obj) => {
  if (!obj || Object.keys(obj).length === 0) {
    return [null, 0];
  }
  return Object.entries(obj).reduce((min, actual) => 
    actual[1] < min[1] ? actual : min, [null, Infinity]);
};

/**
 * Calcula el promedio de un array de números
 * 
 * @param {Array} arr - Array de números
 * @returns {number} - Promedio o 0 si el array está vacío
 */
const promedio = (arr) => {
  if (!arr || arr.length === 0) return 0;
  return arr.reduce((sum, val) => sum + val, 0) / arr.length;
};

/**
 * Analiza un chat para obtener los perfiles de usuarios
 * 
 * @param {string} contenido - Contenido del archivo de chat
 * @param {string} formatoForzado - Formato del chat forzado (opcional)
 * @param {string} idiomChat - Idioma del chat ('es', 'en', etc.)
 * @returns {Object} - Estadísticas de perfiles de usuarios
 */
export const analizarPerfiles = (contenido, formatoForzado = null, idiomaChat = 'es') => {
  console.log("Comenzando análisis de perfiles...");
  
  try {
    // Dividir el contenido en líneas
    const lineas = contenido.split(/\r?\n/);
    
    if (!lineas || lineas.length === 0) {
      console.log("Archivo vacío");
      return { error: "Archivo vacío", success: false };
    }
    
    console.log(`Archivo leído correctamente. Total de líneas: ${lineas.length}`);
    
    // Determinar formato usando el detector
    const formato = detectarFormatoArchivo(contenido, formatoForzado, true);
    console.log(`\nFormato final a utilizar: ${formato}`);
    
    // Si el formato es desconocido, devolver error
    if (formato === "desconocido") {
      return { error: "Formato de chat no reconocido", success: false };
    }
    
    // Definir patrones para emojis
    const patronEmoji = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}]/gu;
    
    // Definir patrones para emojis de amor
    const patronEmojisAmor = /[😍😘🥰😗😙😚💋❤️🧡💛💝💘💖💗💓💞💕❣️💔🩷❤️🧡💛💚🩵💙💜🖤🩶🤍🤎💟🌹🌷💐🌾🪸🥀👩‍❤️‍👩👩‍❤️‍👨👩‍❤️‍👩👨‍❤️‍👨👩‍❤️‍💋‍👨💏👨‍❤️‍💋‍👨😍🥰😘]/gu;
    
    // Estructura para estadísticas
    const stats = {
      usuarios: {},
      categorias: {
        profesor: {nombre: '--', palabras_unicas: 0, mensajes: 0, ratio: 0},
        rollero: {nombre: '--', palabras_por_mensaje: 0, mensajes: 0},
        pistolero: {nombre: '--', tiempo_respuesta_promedio: 0, mensajes: 0},
        vampiro: {nombre: '--', mensajes_noche: 0, porcentaje: 0, mensajes: 0},
        cafeconleche: {nombre: '--', hora_promedio: 12.0, hora_formateada: '12:00', mensajes: 0},
        dejaenvisto: {nombre:'--', tiempo_respuesta_promedio: 0, mensajes: 0},
        narcicista: {nombre: '--', menciones_yo: 0, porcentaje: 0, mensajes: 0},
        puntofinal: {nombre: '--', conversaciones_terminadas: 0, mensajes: 0},
        fosforo: {nombre: '--', conversaciones_iniciadas: 0, mensajes: 0},
        menosesmas: {nombre: '--', longitud_promedio: 0, mensajes: 0},
        chismoso: {nombre: '--', menciones_otros: 0, porcentaje: 0, mensajes: 0},
        happyflower: {nombre: '--', emojis_totales: 0, emojis_por_mensaje: 0, mensajes: 0},
        amoroso: {nombre: '--', emojis_amor: 0, porcentaje_amor: 0, mensajes: 0},
        sicopata: {nombre: '--', max_mensajes_seguidos: 0, mensajes: 0}
      },
      totales: {
        mensajes: 0,
        emojis: 0,
        emojis_amor: 0,
        usuarios: 0
      },
      formato_chat: formato,
      success: true
    };
    
    // Paso 1: Analizar todos los mensajes
    let mensajeAnterior = null;
    const mensajes = [];
    
    for (const linea of lineas) {
      if (!linea.trim()) continue;
      
      const resultado = analizarMensaje(linea, formato, mensajeAnterior);
      
      if (resultado === mensajeAnterior) {
        mensajeAnterior = resultado;
        continue;
      }
      
      if (resultado) {
        mensajes.push(resultado);
        mensajeAnterior = resultado;
      }
    }
    
    console.log(`Total de mensajes analizados: ${mensajes.length}`);
    
    if (mensajes.length === 0) {
      return { error: "No se encontraron mensajes válidos", success: false };
    }
    
    // Inicializar estadísticas de usuarios
    const usuariosEncontrados = new Set();
    mensajes.forEach(m => usuariosEncontrados.add(m.usuario));
    
    // Paso 2: Inicializar estadísticas para cada usuario
    usuariosEncontrados.forEach(usuario => {
      stats.usuarios[usuario] = {
        mensajes: 0,
        palabras_totales: 0,
        palabras_unicas: new Set(),
        palabras_por_mensaje: [],
        tiempo_respuesta: [],
        mensajes_noche: 0,
        horario_mensajes: [],
        uso_primera_persona: 0,
        mensajes_terminan_conversacion: 0,
        mensajes_inician_conversacion: 0,
        longitud_mensajes: [],
        menciones_otros: 0,
        emojis_utilizados: 0,
        emojis_amor: 0,
        max_mensajes_seguidos: 0
      };
    });
    
    // Resto de la implementación en partes adicionales...
    
    return stats;
  } catch (e) {
    console.error("Error durante el análisis:", e);
    return { error: `Error durante el análisis: ${e.message}`, success: false };
  }
}; 