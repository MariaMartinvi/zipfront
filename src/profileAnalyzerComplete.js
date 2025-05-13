/**
 * profileAnalyzerComplete.js - Implementación completa del analizador de perfiles
 * 
 * Este archivo integra todas las partes del analizador para crear la versión completa
 * que será usada desde Analisis_top.js
 */

import { analizarPerfiles } from './profileAnalyzer';
import { 
  identificarConversaciones, 
  detectarMensajesConsecutivos, 
  identificarIniciosFines,
  procesarEstadisticasMensajes
} from './profileAnalyzerUtils';

/**
 * Calcula las estadísticas completas y categoriza los usuarios
 * 
 * @param {string} contenido - Contenido del chat
 * @param {string} formatoForzado - Formato forzado (opcional)
 * @param {string} idiomaChat - Idioma del chat ('es', 'en', etc.)
 * @returns {Object} - Perfiles categorizados
 */
export const analizarPerfilesCompleto = (contenido, formatoForzado = null, idiomaChat = 'es') => {
  try {
    // Obtener estadísticas básicas
    const stats = analizarPerfiles(contenido, formatoForzado, idiomaChat);
    
    if (!stats.success) {
      return stats; // Devolver el error
    }
    
    // Analizar los mensajes para obtener detalles adicionales
    const lineas = contenido.split(/\r?\n/);
    const formato = stats.formato_chat;
    
    // Extraer mensajes y usuarios
    const mensajes = [];
    let mensajeAnterior = null;
    
    // Procesar cada línea para extraer mensajes
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
    
    // Identificar conversaciones
    const conversaciones = identificarConversaciones(mensajes);
    
    // Detectar mensajes consecutivos
    const maxConsecutivos = detectarMensajesConsecutivos(conversaciones);
    
    // Para cada usuario, actualizar mensajes consecutivos
    Object.entries(maxConsecutivos).forEach(([usuario, max]) => {
      if (stats.usuarios[usuario]) {
        stats.usuarios[usuario].max_mensajes_seguidos = max;
      }
    });
    
    // Identificar quién inicia y termina conversaciones
    const { iniciadas, terminadas } = identificarIniciosFines(conversaciones);
    
    // Actualizar estadísticas de inicio/fin de conversación
    Object.entries(iniciadas).forEach(([usuario, cantidad]) => {
      if (stats.usuarios[usuario]) {
        stats.usuarios[usuario].mensajes_inician_conversacion = cantidad;
      }
    });
    
    Object.entries(terminadas).forEach(([usuario, cantidad]) => {
      if (stats.usuarios[usuario]) {
        stats.usuarios[usuario].mensajes_terminan_conversacion = cantidad;
      }
    });
    
    // Procesar estadísticas por mensaje
    procesarEstadisticasMensajes(stats, mensajes, idiomaChat);
    
    // Calcular estadísticas finales
    const calcularEstadisticasFinales = (stats) => {
      // Diccionarios auxiliares para categorías
      const horarioPromedio = {};
      const longitudPromedio = {};
      const tiempoRespuestaPromedio = {};
      const palabrasUnicasRatio = {};
      const palabrasPorMensajePromedio = {};
      const mencionesYoRatio = {};
      
      stats.totales.usuarios = Object.keys(stats.usuarios).length;
      
      // Calcular estadísticas por usuario
      Object.entries(stats.usuarios).forEach(([usuario, datos]) => {
        // Horario promedio
        if (datos.horario_mensajes && datos.horario_mensajes.length > 0) {
          const sum = datos.horario_mensajes.reduce((a, b) => a + b, 0);
          horarioPromedio[usuario] = sum / datos.horario_mensajes.length;
        }
        
        // Longitud promedio de mensajes
        if (datos.longitud_mensajes && datos.longitud_mensajes.length > 0) {
          const sum = datos.longitud_mensajes.reduce((a, b) => a + b, 0);
          longitudPromedio[usuario] = sum / datos.longitud_mensajes.length;
        }
        
        // Tiempo de respuesta promedio
        if (datos.tiempo_respuesta && datos.tiempo_respuesta.length > 0) {
          const sum = datos.tiempo_respuesta.reduce((a, b) => a + b, 0);
          tiempoRespuestaPromedio[usuario] = sum / datos.tiempo_respuesta.length;
        }
        
        // Palabras únicas (ratio)
        if (datos.mensajes > 0) {
          palabrasUnicasRatio[usuario] = [
            datos.palabras_unicas.size,
            datos.palabras_unicas.size / datos.mensajes
          ];
        }
        
        // Palabras por mensaje
        if (datos.palabras_por_mensaje && datos.palabras_por_mensaje.length > 0) {
          const sum = datos.palabras_por_mensaje.reduce((a, b) => a + b, 0);
          palabrasPorMensajePromedio[usuario] = sum / datos.palabras_por_mensaje.length;
        }
        
        // Menciones a sí mismo (ratio)
        if (datos.mensajes > 0) {
          mencionesYoRatio[usuario] = [
            datos.uso_primera_persona,
            (datos.uso_primera_persona / datos.mensajes) * 100
          ];
        }
      });
      
      // Asignar categorías
      
      // Profesor (más palabras únicas por mensaje)
      if (Object.keys(palabrasUnicasRatio).length > 0) {
        const usuarioProfesor = Object.entries(palabrasUnicasRatio)
          .sort((a, b) => b[1][1] - a[1][1])[0][0];
        
        const [cantidad, ratio] = palabrasUnicasRatio[usuarioProfesor];
        stats.categorias.profesor = {
          nombre: usuarioProfesor,
          palabras_unicas: cantidad,
          ratio: ratio,
          mensajes: stats.usuarios[usuarioProfesor].mensajes
        };
      }
      
      // Rollero (más palabras por mensaje)
      if (Object.keys(palabrasPorMensajePromedio).length > 0) {
        const usuarioRollero = Object.entries(palabrasPorMensajePromedio)
          .sort((a, b) => b[1] - a[1])[0][0];
        
        stats.categorias.rollero = {
          nombre: usuarioRollero,
          palabras_por_mensaje: palabrasPorMensajePromedio[usuarioRollero],
          mensajes: stats.usuarios[usuarioRollero].mensajes
        };
      }
      
      // Pistolero (responde más rápido)
      if (Object.keys(tiempoRespuestaPromedio).length > 0) {
        const usuarioPistolero = Object.entries(tiempoRespuestaPromedio)
          .sort((a, b) => a[1] - b[1])[0][0];
        
        stats.categorias.pistolero = {
          nombre: usuarioPistolero,
          tiempo_respuesta_promedio: tiempoRespuestaPromedio[usuarioPistolero],
          mensajes: stats.usuarios[usuarioPistolero].mensajes
        };
      }
      
      // Dejaenvisto (responde más lento)
      if (Object.keys(tiempoRespuestaPromedio).length > 0) {
        const usuarioDejaEnVisto = Object.entries(tiempoRespuestaPromedio)
          .sort((a, b) => b[1] - a[1])[0][0];
        
        stats.categorias.dejaenvisto = {
          nombre: usuarioDejaEnVisto,
          tiempo_respuesta_promedio: tiempoRespuestaPromedio[usuarioDejaEnVisto],
          mensajes: stats.usuarios[usuarioDejaEnVisto].mensajes
        };
      }
      
      // Vampiro (más mensajes nocturnos)
      const vampiroData = Object.entries(stats.usuarios)
        .map(([usuario, datos]) => {
          const porcentaje = datos.mensajes > 0 
            ? (datos.mensajes_noche / datos.mensajes) * 100 
            : 0;
          return [usuario, datos.mensajes_noche, porcentaje];
        })
        .filter(([_, mensajes]) => mensajes > 0)
        .sort((a, b) => b[1] - a[1]);
      
      if (vampiroData.length > 0) {
        const [usuarioVampiro, mensajesNoche] = vampiroData[0];
        const porcentaje = (mensajesNoche / stats.usuarios[usuarioVampiro].mensajes) * 100;
        
        stats.categorias.vampiro = {
          nombre: usuarioVampiro,
          mensajes_noche: mensajesNoche,
          porcentaje: porcentaje,
          mensajes: stats.usuarios[usuarioVampiro].mensajes
        };
      }
      
      // Cafeconleche (se levanta más temprano)
      if (Object.keys(horarioPromedio).length > 0) {
        // Ajustar horas para considerar que las primeras horas del día son "más temprano"
        const adjustedTimes = {};
        for (const [user, time] of Object.entries(horarioPromedio)) {
          adjustedTimes[user] = time >= 6 ? time : time + 24;
        }
        
        const usuarioCafeConLeche = Object.entries(adjustedTimes)
          .sort((a, b) => a[1] - b[1])[0][0];
        
        const horaPromedio = horarioPromedio[usuarioCafeConLeche];
        const horaEntera = Math.floor(horaPromedio);
        const minutos = Math.floor((horaPromedio - horaEntera) * 60);
        
        stats.categorias.cafeconleche = {
          nombre: usuarioCafeConLeche,
          hora_promedio: horaPromedio,
          hora_formateada: `${horaEntera}:${minutos.toString().padStart(2, '0')}`,
          mensajes: stats.usuarios[usuarioCafeConLeche].mensajes
        };
      }
      
      // Menosesmas (mensajes más cortos)
      if (Object.keys(longitudPromedio).length > 0) {
        const usuarioMenosEsMas = Object.entries(longitudPromedio)
          .sort((a, b) => a[1] - b[1])[0][0];
        
        stats.categorias.menosesmas = {
          nombre: usuarioMenosEsMas,
          longitud_promedio: longitudPromedio[usuarioMenosEsMas],
          mensajes: stats.usuarios[usuarioMenosEsMas].mensajes
        };
      }
      
      // Narcicista (más menciones a sí mismo)
      if (Object.keys(mencionesYoRatio).length > 0) {
        const usuarioNarcicista = Object.entries(mencionesYoRatio)
          .sort((a, b) => b[1][1] - a[1][1])[0][0];
        
        const [menciones, porcentaje] = mencionesYoRatio[usuarioNarcicista];
        stats.categorias.narcicista = {
          nombre: usuarioNarcicista,
          menciones_yo: menciones,
          porcentaje: porcentaje,
          mensajes: stats.usuarios[usuarioNarcicista].mensajes
        };
      }
      
      // Chismoso (más menciones a otros usuarios)
      const chismosoData = Object.entries(stats.usuarios)
        .map(([usuario, datos]) => {
          const porcentaje = datos.mensajes > 0 
            ? (datos.menciones_otros / datos.mensajes) * 100 
            : 0;
          return [usuario, datos.menciones_otros, porcentaje];
        })
        .filter(([_, menciones]) => menciones > 0)
        .sort((a, b) => b[1] - a[1]);
      
      if (chismosoData.length > 0) {
        const [usuarioChismoso, mencionesOtros, porcentaje] = chismosoData[0];
        
        stats.categorias.chismoso = {
          nombre: usuarioChismoso,
          menciones_otros: mencionesOtros,
          porcentaje: porcentaje,
          mensajes: stats.usuarios[usuarioChismoso].mensajes
        };
      }
      
      // Puntofinal (termina más conversaciones)
      if (Object.keys(terminadas).length > 0) {
        const usuarioPuntoFinal = Object.entries(terminadas)
          .sort((a, b) => b[1] - a[1])[0][0];
        
        stats.categorias.puntofinal = {
          nombre: usuarioPuntoFinal,
          conversaciones_terminadas: terminadas[usuarioPuntoFinal],
          mensajes: stats.usuarios[usuarioPuntoFinal].mensajes
        };
      }
      
      // Fosforo (inicia más conversaciones)
      if (Object.keys(iniciadas).length > 0) {
        const usuarioFosforo = Object.entries(iniciadas)
          .sort((a, b) => b[1] - a[1])[0][0];
        
        stats.categorias.fosforo = {
          nombre: usuarioFosforo,
          conversaciones_iniciadas: iniciadas[usuarioFosforo],
          mensajes: stats.usuarios[usuarioFosforo].mensajes
        };
      }
      
      // Happyflower (más emojis por mensaje)
      const happyflowerData = Object.entries(stats.usuarios)
        .map(([usuario, datos]) => {
          const emojisPorMensaje = datos.mensajes > 0 
            ? datos.emojis_utilizados / datos.mensajes
            : 0;
          return [usuario, datos.emojis_utilizados, emojisPorMensaje];
        })
        .filter(([_, emojis]) => emojis > 0)
        .sort((a, b) => b[1] - a[1]);
      
      if (happyflowerData.length > 0) {
        const [usuarioHappyflower, emojisTotal, emojisPorMsg] = happyflowerData[0];
        
        stats.categorias.happyflower = {
          nombre: usuarioHappyflower,
          emojis_totales: emojisTotal,
          emojis_por_mensaje: emojisPorMsg,
          mensajes: stats.usuarios[usuarioHappyflower].mensajes
        };
      }
      
      // Amoroso (más emojis de amor)
      const amorosoData = Object.entries(stats.usuarios)
        .map(([usuario, datos]) => {
          const porcentajeAmor = datos.emojis_utilizados > 0
            ? (datos.emojis_amor / datos.emojis_utilizados) * 100
            : 0;
          return [usuario, datos.emojis_amor, porcentajeAmor];
        })
        .filter(([_, emojis]) => emojis > 0)
        .sort((a, b) => b[1] - a[1]);
      
      if (amorosoData.length > 0) {
        const [usuarioAmoroso, emojisAmor, porcentajeAmor] = amorosoData[0];
        
        stats.categorias.amoroso = {
          nombre: usuarioAmoroso,
          emojis_amor: emojisAmor,
          porcentaje_amor: porcentajeAmor,
          mensajes: stats.usuarios[usuarioAmoroso].mensajes
        };
      }
      
      // Sicopata (más mensajes consecutivos)
      const sicopataData = Object.entries(stats.usuarios)
        .map(([usuario, datos]) => [usuario, datos.max_mensajes_seguidos])
        .filter(([_, max]) => max > 1)
        .sort((a, b) => b[1] - a[1]);
      
      if (sicopataData.length > 0) {
        const [usuarioSicopata, maxConsecutivos] = sicopataData[0];
        
        stats.categorias.sicopata = {
          nombre: usuarioSicopata,
          max_mensajes_seguidos: maxConsecutivos,
          mensajes: stats.usuarios[usuarioSicopata].mensajes
        };
      }
      
      return stats;
    };
    
    // Calcular estadísticas finales y categorizar usuarios
    const statsFinales = calcularEstadisticasFinales(stats);
    
    // Preparar para serialización JSON (convertir Sets a Arrays)
    Object.values(statsFinales.usuarios).forEach(usuario => {
      if (usuario.palabras_unicas && usuario.palabras_unicas instanceof Set) {
        usuario.palabras_unicas = Array.from(usuario.palabras_unicas);
      }
    });
    
    return statsFinales;
    
  } catch (error) {
    console.error("Error en analizarPerfilesCompleto:", error);
    return {
      error: `Error en el análisis de perfiles: ${error.message}`,
      success: false
    };
  }
};

/**
 * Analiza un mensaje individual
 * (Duplicado de profileAnalyzer.js para evitar dependencias circulares)
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
 * (Duplicado de profileAnalyzer.js para evitar dependencias circulares)
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