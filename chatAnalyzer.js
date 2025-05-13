/**
 * chatAnalyzer.js - Analizador de chats para el cliente
 * 
 * Implementación en JavaScript del analizador de chats basado en el código 
 * backend original de Python.
 */

import { detectarFormatoArchivo, isProbableChatFile } from './formatDetector';

/**
 * Analiza un mensaje individual según el formato del chat
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
    mensajeAnterior.mensaje += `\n${linea}`;
    mensajeAnterior.esMultilinea = true;
    return mensajeAnterior;
  }
  
  // Patrones para extraer componentes según el formato
  const patronIOS = /^\[(\d{1,2}\/\d{1,2}\/\d{2}),\s*(\d{1,2}:\d{2}(?::\d{2})?)\]\s*([^:]+):\s*(.*)/;
  const patronAndroid = /^(\d{1,2}\/\d{1,2}\/\d{2}),\s*(\d{1,2}:\d{2})\s*-\s*([^:]+):\s*(.+)/;
  
  let match;
  if (formato === "ios") {
    match = linea.match(patronIOS);
  } else {
    match = linea.match(patronAndroid);
  }
  
  if (match) {
    const [_, fecha, hora, nombre, mensaje] = match;
    try {
      // Parseamos la fecha
      let fechaHora = parsearFechaHora(fecha, hora, formato);
      if (!fechaHora) {
        return null;
      }
      
      // Identificar tipo de mensaje
      let tipoMensaje = "texto";
      const mensajeLower = mensaje.toLowerCase();
      
      if (/imagen omitida|image omitted|<multimedia omitido>/.test(mensajeLower)) {
        tipoMensaje = "imagen";
      } else if (/video omitido|video omitted/.test(mensajeLower)) {
        tipoMensaje = "video";
      } else if (/audio omitido|audio omitted/.test(mensajeLower)) {
        tipoMensaje = "audio";
      } else if (/documento omitido|document omitted/.test(mensajeLower)) {
        tipoMensaje = "documento";
      } else if (/sticker omitido|sticker omitted/.test(mensajeLower)) {
        tipoMensaje = "sticker";
      }
      
      return {
        fecha: fecha,
        hora: hora,
        nombre: nombre.trim(),
        mensaje: mensaje.trim() || "",
        fechaHora: fechaHora,
        tipo: tipoMensaje,
        esMultilinea: false,
        formato: formato
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
    // Dividir fecha en componentes
    const partesFecha = fecha.split('/');
    if (partesFecha.length !== 3) return null;
    
    let dia = parseInt(partesFecha[0], 10);
    let mes = parseInt(partesFecha[1], 10);
    let anio = parseInt(partesFecha[2], 10);
    
    // Ajustar año si es necesario (20xx)
    if (anio < 100) {
      anio += anio < 50 ? 2000 : 1900;
    }
    
    // Determinar formato de fecha basado en valores
    let formatoFecha;
    if (dia > 12) {
      // Si día > 12, debe ser DD/MM/YY
      formatoFecha = "DD/MM/YY";
    } else if (mes > 12) {
      // Si mes > 12, debe ser MM/DD/YY
      const temp = dia;
      dia = mes;
      mes = temp;
      formatoFecha = "MM/DD/YY";
    } else {
      // Ambos son ≤ 12, usamos DD/MM/YY por defecto
      formatoFecha = "DD/MM/YY";
      
      // Crear fecha y comprobar si es futura
      const fechaTentativa = new Date(anio, mes - 1, dia);
      if (fechaTentativa > new Date()) {
        // Si es futura, probamos el otro formato
        const temp = dia;
        dia = mes;
        mes = temp;
      }
    }
    
    // Procesar la hora
    const partesHora = hora.split(':');
    let horas = parseInt(partesHora[0], 10);
    let minutos = parseInt(partesHora[1], 10);
    let segundos = partesHora.length > 2 ? parseInt(partesHora[2], 10) : 0;
    
    // Crear objeto Date
    return new Date(anio, mes - 1, dia, horas, minutos, segundos);
  } catch (e) {
    console.error(`Error parseando fecha/hora:`, e);
    return null;
  }
};

/**
 * Analiza un chat completo
 * 
 * @param {string} contenido - Contenido completo del archivo de chat
 * @param {string|null} formatoForzado - Formato forzado (opcional)
 * @returns {Object} - Estadísticas y análisis del chat
 */
export const analizarChat = (contenido, formatoForzado = null) => {
  console.log("Comenzando análisis de chat...");
  
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
    
    let mensajeAnterior = null;
    const mensajes = [];
    const participantes = new Set();
    
    // Estructura para estadísticas
    const stats = {
      primer_mensaje: null,
      mensajes_por_dia: {},
      mensajes_por_usuario: {},
      actividad_por_dia_semana: {},
      actividad_por_hora: {},
      resumen: {},
      tipos_mensaje: {},
      formato_chat: formato,
      tiempo_respuesta_por_mes: {},
      mensajes_por_mes_usuario: {}
    };
    
    let primerFecha = null;
    let primerFechaStr = null;
    let mensajesTotales = 0;
    
    // Diccionario para almacenar la última vez que cada usuario habló
    const ultimaVezUsuario = {};
    
    // Días de la semana en español (como en el backend)
    const diasSemana = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    
    // Procesar cada línea
    for (const linea of lineas) {
      if (!linea.trim()) continue;
      
      const resultado = analizarMensaje(linea, formato, mensajeAnterior);
      
      if (resultado) {
        // Si es una continuación, actualizar el mensaje anterior
        if (resultado === mensajeAnterior) {
          continue;
        }
        
        mensajeAnterior = resultado;
        // Agregar a la lista de mensajes
        mensajes.push(resultado);
        
        // Actualizar estadísticas
        const fechaHora = resultado.fechaHora;
        if (primerFecha === null || fechaHora < primerFecha) {
          primerFecha = fechaHora;
          primerFechaStr = resultado.fecha;
          stats.primer_mensaje = {
            fecha: resultado.fecha,
            fecha_completa: formatDate(fechaHora, "DD/MM/YYYY HH:MM"),
            timestamp: fechaHora.getTime() / 1000
          };
        }
        
        // Actualizar contadores para gráficos
        const fechaClave = formatDate(fechaHora, "YYYY-MM-DD");
        stats.mensajes_por_dia[fechaClave] = (stats.mensajes_por_dia[fechaClave] || 0) + 1;
        stats.mensajes_por_usuario[resultado.nombre] = (stats.mensajes_por_usuario[resultado.nombre] || 0) + 1;
        stats.tipos_mensaje[resultado.tipo] = (stats.tipos_mensaje[resultado.tipo] || 0) + 1;
        
        // Estadísticas por día de la semana y hora
        const diaSemana = fechaHora.getDay(); // 0=domingo, 6=sábado
        const diaSemanaStr = diasSemana[diaSemana];
        stats.actividad_por_dia_semana[diaSemanaStr] = (stats.actividad_por_dia_semana[diaSemanaStr] || 0) + 1;
        stats.actividad_por_hora[fechaHora.getHours()] = (stats.actividad_por_hora[fechaHora.getHours()] || 0) + 1;
        
        // Estadísticas por mes para cada usuario
        const mesClave = formatDate(fechaHora, "YYYY-MM");
        if (!stats.mensajes_por_mes_usuario[mesClave]) {
          stats.mensajes_por_mes_usuario[mesClave] = {};
        }
        stats.mensajes_por_mes_usuario[mesClave][resultado.nombre] = 
          (stats.mensajes_por_mes_usuario[mesClave][resultado.nombre] || 0) + 1;
        
        // Registrar usuario
        participantes.add(resultado.nombre);
        mensajesTotales++;
        
        // Calcular tiempos de respuesta
        const usuarioActual = resultado.nombre;
        const ultimoMensajeFecha = ultimaVezUsuario[usuarioActual] || null;
        
        // Para cada usuario diferente al actual, calcular su tiempo de respuesta
        Object.entries(ultimaVezUsuario).forEach(([usuario, fechaUltimoMensaje]) => {
          if (usuario !== usuarioActual) {
            // Calcular tiempo de respuesta en minutos
            const tiempoRespuesta = (fechaHora - fechaUltimoMensaje) / 1000 / 60;
            
            // Considerar solo respuestas dentro de 24 horas
            if (tiempoRespuesta <= 1440) {
              // Obtener el mes para esta respuesta
              const mesRespuesta = formatDate(fechaHora, "YYYY-MM");
              
              if (!stats.tiempo_respuesta_por_mes[mesRespuesta]) {
                stats.tiempo_respuesta_por_mes[mesRespuesta] = {};
              }
              
              if (!stats.tiempo_respuesta_por_mes[mesRespuesta][usuarioActual]) {
                stats.tiempo_respuesta_por_mes[mesRespuesta][usuarioActual] = [];
              }
              
              // Almacenar tiempo de respuesta para este usuario en este mes
              stats.tiempo_respuesta_por_mes[mesRespuesta][usuarioActual].push(tiempoRespuesta);
            }
          }
        });
        
        // Actualizar último mensaje para este usuario
        ultimaVezUsuario[usuarioActual] = fechaHora;
      }
    }
    
    // Calcular estadísticas finales
    stats.total_messages = mensajesTotales;
    stats.active_participants = participantes.size;
    stats.chat_format = formato;
    
    // Extraer ejemplos de mensajes por usuario
    const sender_counts = {};
    const message_examples = {};
    
    // Ordenar mensajes por usuario
    const mensajesPorUsuario = {};
    participantes.forEach(usuario => {
      mensajesPorUsuario[usuario] = [];
      message_examples[usuario] = [];
    });
    
    // Agrupar mensajes por usuario
    mensajes.forEach(msg => {
      sender_counts[msg.nombre] = (sender_counts[msg.nombre] || 0) + 1;
      
      if (mensajesPorUsuario[msg.nombre] && msg.tipo === "texto" && msg.mensaje.length > 5) {
        mensajesPorUsuario[msg.nombre].push(msg);
      }
    });
    
    // Seleccionar ejemplos aleatorios para cada usuario (máximo 3)
    Object.keys(mensajesPorUsuario).forEach(usuario => {
      const mensajesUsuario = mensajesPorUsuario[usuario];
      
      // Solo considerar usuarios con al menos 5 mensajes
      if (mensajesUsuario.length >= 5) {
        // Elegir 3 mensajes al azar
        const indices = new Set();
        while (indices.size < 3 && indices.size < mensajesUsuario.length) {
          const indice = Math.floor(Math.random() * mensajesUsuario.length);
          indices.add(indice);
        }
        
        // Extraer los mensajes seleccionados
        indices.forEach(i => {
          const msgEjemplo = mensajesUsuario[i].mensaje;
          if (msgEjemplo.length <= 80) {
            message_examples[usuario].push(msgEjemplo);
          } else {
            message_examples[usuario].push(msgEjemplo.substring(0, 80) + "...");
          }
        });
      }
    });
    
    // Preparar datos de estadísticas
    const data = {
      total_messages: mensajesTotales,
      active_participants: participantes.size,
      chat_format: formato,
      sender_counts: sender_counts,
      message_examples: message_examples,
      success: true
    };
    
    return data;
  } catch (error) {
    console.error("Error durante el análisis:", error);
    return {
      error: `Error durante el análisis: ${error.message}`,
      success: false
    };
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
  
  return Object.entries(obj).reduce((max, actual) => {
    return actual[1] > max[1] ? actual : max;
  }, [null, -Infinity]);
};

/**
 * Formatea una fecha según un patrón específico
 * 
 * @param {Date} date - Objeto Date a formatear
 * @param {string} pattern - Patrón de formato (YYYY-MM-DD, DD/MM/YYYY, etc.)
 * @returns {string} - Fecha formateada
 */
const formatDate = (date, pattern) => {
  if (!date) return '';
  
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  
  pattern = pattern.replace('YYYY', year);
  pattern = pattern.replace('MM', month);
  pattern = pattern.replace('DD', day);
  pattern = pattern.replace('HH', hours);
  pattern = pattern.replace('MM', minutes);
  
  return pattern;
};

/**
 * Filtra los archivos para encontrar posibles archivos de chat
 * 
 * @param {Array} files - Lista de archivos a analizar
 * @returns {Array} - Lista de archivos que parecen ser chats
 */
export const encontrarArchivosChat = (files) => {
  return Array.from(files).filter(file => isProbableChatFile(file));
}; 