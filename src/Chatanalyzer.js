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
        
        mensajesTotales++;
        participantes.add(resultado.nombre);
        
        // Calcular tiempo de respuesta
        const nombreActual = resultado.nombre;
        
        // Verificar si otros usuarios ya han enviado mensajes
        for (const [otroUsuario, ultimaVez] of Object.entries(ultimaVezUsuario)) {
          // Solo calcular tiempo de respuesta para usuarios diferentes al actual
          if (otroUsuario !== nombreActual) {
            // Verificar si este mensaje es una respuesta a ese usuario
            const ultimaVezDt = ultimaVez.fechaHora;
            const tiempoRespuesta = (fechaHora - ultimaVezDt) / (1000 * 60); // en minutos
            
            // Solo considerar respuestas en un período razonable (menos de 24 horas)
            if (tiempoRespuesta > 0 && tiempoRespuesta < 1440) {
              // Guardar tiempo de respuesta por mes y usuario
              if (!stats.tiempo_respuesta_por_mes[mesClave]) {
                stats.tiempo_respuesta_por_mes[mesClave] = {};
              }
              if (!stats.tiempo_respuesta_por_mes[mesClave][nombreActual]) {
                stats.tiempo_respuesta_por_mes[mesClave][nombreActual] = [];
              }
              stats.tiempo_respuesta_por_mes[mesClave][nombreActual].push(tiempoRespuesta);
            }
          }
        }
        
        // Actualizar la última vez que este usuario envió un mensaje
        ultimaVezUsuario[nombreActual] = {
          fechaHora: fechaHora,
          resultado: resultado
        };
      }
    }
    
    if (mensajes.length === 0) {
      return { error: "No se encontraron mensajes válidos", success: false };
    }
    
    // Calcular estadísticas adicionales
    const diasConActividad = Object.keys(stats.mensajes_por_dia).length;
    const promedioMensajesDiarios = diasConActividad > 0 ? mensajesTotales / diasConActividad : 0;
    
    // Encontrar máximos
    const diaMasActivo = encontrarMaximo(stats.mensajes_por_dia);
    const horaMasActiva = encontrarMaximo(stats.actividad_por_hora);
    const diaSemanaMasActivo = encontrarMaximo(stats.actividad_por_dia_semana);
    const usuarioMasActivo = encontrarMaximo(stats.mensajes_por_usuario);
    
    // Crear resumen
    stats.resumen = {
      total_mensajes: mensajesTotales,
      fecha_inicio: primerFechaStr,
      promedio_mensajes_diarios: Math.round(promedioMensajesDiarios * 100) / 100,
      dia_mas_activo: {
        fecha: diaMasActivo.clave || "N/A",
        mensajes: diaMasActivo.valor || 0
      },
      hora_mas_activa: {
        hora: horaMasActiva.clave !== undefined ? horaMasActiva.clave : "N/A",
        mensajes: horaMasActiva.valor || 0
      },
      dia_semana_mas_activo: {
        dia: diaSemanaMasActivo.clave || "N/A",
        mensajes: diaSemanaMasActivo.valor || 0
      },
      usuario_mas_activo: {
        nombre: usuarioMasActivo.clave || "N/A",
        mensajes: usuarioMasActivo.valor || 0
      }
    };
    
    // Calcular tiempo de respuesta promedio por mes
    const tiempoRespuestaPromedioMes = {};
    for (const [mes, usuarios] of Object.entries(stats.tiempo_respuesta_por_mes)) {
      tiempoRespuestaPromedioMes[mes] = {};
      for (const [usuario, tiempos] of Object.entries(usuarios)) {
        if (tiempos && tiempos.length > 0) {
          // Filtrar tiempos extremos (más de 24 horas)
          const tiemposFiltrados = tiempos.filter(t => t < 1440);
          if (tiemposFiltrados.length > 0) {
            const promedio = tiemposFiltrados.reduce((sum, t) => sum + t, 0) / tiemposFiltrados.length;
            tiempoRespuestaPromedioMes[mes][usuario] = promedio;
          }
        }
      }
    }
    stats.tiempo_respuesta_promedio_mes = tiempoRespuestaPromedioMes;
    
    // Convertir mensajes por mes y usuario a formato para gráficos de porcentaje
    const mensajesPorMesPorcentaje = {};
    for (const [mes, usuarios] of Object.entries(stats.mensajes_por_mes_usuario)) {
      const totalMensajesMes = Object.values(usuarios).reduce((sum, n) => sum + n, 0);
      mensajesPorMesPorcentaje[mes] = {
        total: totalMensajesMes,
        usuarios: {}
      };
      for (const [usuario, cantidad] of Object.entries(usuarios)) {
        const porcentaje = totalMensajesMes > 0 ? (cantidad / totalMensajesMes) * 100 : 0;
        mensajesPorMesPorcentaje[mes].usuarios[usuario] = {
          mensajes: cantidad,
          porcentaje: porcentaje
        };
      }
    }
    stats.mensajes_por_mes_porcentaje = mensajesPorMesPorcentaje;
    
    // Añadir flag de éxito
    stats.success = true;
    
    return stats;
  } catch (e) {
    console.error("Error durante el análisis:", e);
    return { error: `Error durante el análisis: ${e.message}`, success: false };
  }
};

/**
 * Encuentra la clave con el valor máximo en un objeto
 * 
 * @param {Object} obj - Objeto con claves y valores numéricos
 * @returns {Object} - Objeto con clave y valor máximo
 */
const encontrarMaximo = (obj) => {
  if (!obj || Object.keys(obj).length === 0) {
    return { clave: null, valor: 0 };
  }
  let maxClave = null;
  let maxValor = -Infinity;
  for (const [clave, valor] of Object.entries(obj)) {
    if (valor > maxValor) {
      maxValor = valor;
      maxClave = clave;
    }
  }
  return { clave: maxClave, valor: maxValor };
};

/**
 * Formatea una fecha según el patrón especificado
 * 
 * @param {Date} date - Objeto Date a formatear
 * @param {string} pattern - Patrón de formato (YYYY, MM, DD, HH, MM, SS)
 * @returns {string} - Fecha formateada
 */
const formatDate = (date, pattern) => {
  if (!date) return '';
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return pattern
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('MM', minutes)
    .replace('SS', seconds);
};

/**
 * Encuentra un archivo de chat adecuado entre los archivos extraídos
 * 
 * @param {Array} files - Lista de archivos extraídos
 * @returns {Object|null} - Archivo de chat encontrado o null
 */
export const encontrarArchivosChat = (files) => {
  if (!files || files.length === 0) return null;
  
  // Priorizar archivos con _chat.txt en el nombre
  const priorityFiles = files.filter(f => f.name.includes('_chat.txt'));
  if (priorityFiles.length > 0) {
    return priorityFiles[0];
  }
  
  // Buscar archivos de texto que probablemente sean chats
  const chatFiles = files.filter(f => isProbableChatFile(f.name));
  if (chatFiles.length > 0) {
    return chatFiles[0];
  }
  
  // Si no hay archivos específicos, usar cualquier .txt o .csv
  const textFiles = files.filter(f => f.name.endsWith('.txt') || f.name.endsWith('.csv'));
  if (textFiles.length > 0) {
    return textFiles[0];
  }
  
  return null;
}; 