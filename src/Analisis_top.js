import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './Analisis_top.css';
// Importar el detector de formato directamente
import { detectarFormatoArchivo } from './formatDetector.js';
// Importar utilidades de fecha
import { parseDateTime, esDateValido } from './dateUtils.js';

// Función para parsear correctamente fechas de diferentes formatos
// const parseDateTime = (fechaStr, horaStr, formato) => {
//   try {
//     // Formatear la entrada para crear un objeto Date válido
//     const partesFecha = fechaStr.split('/');
//     
//     if (partesFecha.length !== 3) {
//       return new Date(); // Fecha inválida, devolver fecha actual
//     }
//     
//     let dia = parseInt(partesFecha[0], 10);
//     let mes = parseInt(partesFecha[1], 10) - 1; // Meses en JS son 0-11
//     let anio = parseInt(partesFecha[2], 10);
//     
//     // Ajustar año si es formato de 2 dígitos
//     if (anio < 100) {
//       anio += 2000; // Asumimos años 2000+
//     }
//     
//     // Parsear la hora
//     const partesHora = horaStr.split(':');
//     let hora = parseInt(partesHora[0], 10) || 0;
//     let minutos = parseInt(partesHora[1], 10) || 0;
//     let segundos = 0;
//     
//     if (partesHora.length > 2) {
//       segundos = parseInt(partesHora[2], 10) || 0;
//     }
//     
//     // Crear objeto Date
//     return new Date(anio, mes, dia, hora, minutos, segundos);
//   } catch (error) {
//     console.error(`Error parseando fecha/hora (${fechaStr} ${horaStr}): ${error.message}`);
//     return new Date(); // En caso de error, devolver fecha actual
//   }
// };

// Implementación completa de analizarPerfilesCompleto para reemplazar la versión del backend
const analizarPerfilesCompleto = (contenido, formatoForzado = null, idiomaChat = 'es') => {
  console.log("Analizando perfiles directamente desde Analisis_top...");
  try {
    // Determinar formato usando el detector
    const formato = detectarFormatoArchivo(contenido, formatoForzado, true);
    console.log(`\\nFormato final a utilizar: ${formato}`);
    
    if (formato === "desconocido") {
      return { error: "Formato de chat no reconocido", success: false };
    }
    
    // Analizar mensajes
    const lineas = contenido.split(/\r?\n/);
    const mensajes = extraerMensajes(lineas, formato);
    
    if (mensajes.length === 0) {
      return { error: "No se encontraron mensajes válidos", success: false };
    }
    
    // Patrones para emoji y emojis de amor
    const patronEmoji = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}]/gu;
    const patronEmojisAmor = /[😍😘🥰😗😙😚💋❤️🧡💛💝💘💖💗💓💞💕❣️❤️‍🩹❤️‍🔥💔🩷❤️🧡💛💚🩵💙💜🖤🩶🤍🤎💟🌹🌷💐🌾🪸🥀👩‍❤️‍👩👩‍❤️‍👨👩‍❤️‍👩👨‍❤️‍👨👩‍❤️‍💋‍👨💏👨‍❤️‍💋‍👨😍🥰😘]/gu;

    // Patrones de primera persona por idioma
    const patronesPrimeraPersona = {
      'es': /\byo\b|\bmi\b|\bme\b|\bconmigo\b/i,
      'en': /\bi\b|\bmy\b|\bme\b|\bmyself\b|\bmine\b/i,
      'fr': /\bje\b|\bmoi\b|\bm'|\bme\b|\bmon\b|\bma\b|\bmes\b/i,
      'de': /\bich\b|\bmein\b|\bmir\b|\bmich\b|\bmeine\b/i,
      'it': /\bio\b|\bmio\b|\bmi\b|\bmia\b|\bmie\b|\bmiei\b|\bme\b/i
    };

    // Función para detectar primera persona
    const detectarPrimeraPersona = (texto, idioma) => {
      // Si no se especifica idioma o el idioma no está soportado, usar español
      if (!idioma || !patronesPrimeraPersona[idioma]) {
        idioma = 'es';
      }
      return patronesPrimeraPersona[idioma].test(texto.toLowerCase());
    };
    
    // Obtener usuarios únicos
    const participantes = new Set();
    mensajes.forEach(m => participantes.add(m.nombre));
    
    // Inicializar estadísticas para cada usuario
    const usuarios = {};
    Array.from(participantes).forEach(usuario => {
      usuarios[usuario] = {
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
        max_mensajes_seguidos: 0,
        mensajes_risa: 0,       // Para el cómico: mensajes que generan risas
        mensajes_agradece: 0,   // Para el agradecido: mensajes de agradecimiento
        mensajes_disculpa: 0,   // Para el disculpón: mensajes de disculpa
        mensajes_pregunta: 0    // Para el curioso: mensajes con preguntas
      };
    });
    
    // Identificar conversaciones (separadas por más de 2 horas)
    const conversaciones = [];
    if (mensajes.length > 0) {
      let conversacionActual = [mensajes[0]];
      
      for (let i = 1; i < mensajes.length; i++) {
        // Calcular diferencia en horas
        const fechaActual = mensajes[i].fechaObj;
        const fechaAnterior = mensajes[i-1].fechaObj;
        const tiempoDiferencia = (fechaActual - fechaAnterior) / (1000 * 60 * 60); // en horas
        
        if (tiempoDiferencia > 2) { // Nueva conversación después de 2 horas
          if (conversacionActual.length > 0) {
            conversaciones.push(conversacionActual);
          }
          conversacionActual = [mensajes[i]];
        } else {
          conversacionActual.push(mensajes[i]);
        }
      }
      
      // Añadir la última conversación
      if (conversacionActual.length > 0) {
        conversaciones.push(conversacionActual);
      }
    }
    
    console.log(`Total de conversaciones identificadas: ${conversaciones.length}`);
    
    // Detectar mensajes consecutivos por usuario
    for (const conversacion of conversaciones) {
      let usuarioActual = null;
      let contadorConsecutivos = 1;
      const maxConsecutivos = {};
      
      for (const mensaje of conversacion) {
        const usuario = mensaje.nombre;
        
        if (usuario === usuarioActual) {
          contadorConsecutivos++;
        } else {
          // Cambio de usuario, reiniciar contador
          if (usuarioActual !== null) {
            // Actualizar el máximo para el usuario anterior
            maxConsecutivos[usuarioActual] = Math.max(
              maxConsecutivos[usuarioActual] || 0,
              contadorConsecutivos
            );
          }
          contadorConsecutivos = 1;
          usuarioActual = usuario;
        }
      }
      
      // No olvidar actualizar el último usuario de la conversación
      if (usuarioActual !== null) {
        maxConsecutivos[usuarioActual] = Math.max(
          maxConsecutivos[usuarioActual] || 0,
          contadorConsecutivos
        );
      }
      
      // Actualizar estadísticas globales de mensajes consecutivos
      for (const [usuario, maxConsec] of Object.entries(maxConsecutivos)) {
        usuarios[usuario].max_mensajes_seguidos = Math.max(
          usuarios[usuario].max_mensajes_seguidos,
          maxConsec
        );
      }
    }
    
    // Identificar inicios y finales de conversación
    const conversacionesIniciadas = {};
    const conversacionesTerminadas = {};
    
    for (const conversacion of conversaciones) {
      if (conversacion.length > 1) {
        const primerMensaje = conversacion[0];
        const ultimoMensaje = conversacion[conversacion.length - 1];
        
        const usuarioInicio = primerMensaje.nombre;
        const usuarioFinal = ultimoMensaje.nombre;
        
        usuarios[usuarioInicio].mensajes_inician_conversacion += 1;
        usuarios[usuarioFinal].mensajes_terminan_conversacion += 1;
        
        conversacionesIniciadas[usuarioInicio] = (conversacionesIniciadas[usuarioInicio] || 0) + 1;
        conversacionesTerminadas[usuarioFinal] = (conversacionesTerminadas[usuarioFinal] || 0) + 1;
      }
    }
    
    // Calcular estadísticas de cada mensaje
    for (let i = 0; i < mensajes.length; i++) {
      const mensaje = mensajes[i];
      const usuario = mensaje.nombre;
      const texto = mensaje.mensaje || '';
      // Usar el objeto fechaObj que ya creamos en analizarMensaje
      const fecha = mensaje.fechaObj;
      const hora = fecha.getHours();
      
      // Incrementar contador de mensajes
      usuarios[usuario].mensajes++;
      
      // Guardar horario y longitud
      usuarios[usuario].horario_mensajes.push(hora);
      usuarios[usuario].longitud_mensajes.push(texto.length);
      
      // Contar mensajes nocturnos (22:00 - 06:00)
      if (hora >= 22 || hora < 6) {
        usuarios[usuario].mensajes_noche++;
      }
      
      // Contar palabras y palabras únicas
      const palabras = texto.toLowerCase().match(/[a-zñáéíóúüÁÉÍÓÚÜÑ]+/g) || [];
      usuarios[usuario].palabras_totales += palabras.length;
      palabras.forEach(palabra => usuarios[usuario].palabras_unicas.add(palabra));
      usuarios[usuario].palabras_por_mensaje.push(palabras.length);
      
      // Detectar uso de primera persona
      if (detectarPrimeraPersona(texto, idiomaChat)) {
        usuarios[usuario].uso_primera_persona++;
      }
      
      // Buscar menciones a otros usuarios
      for (const otroUsuario of Object.keys(usuarios)) {
        if (otroUsuario !== usuario && texto.toLowerCase().includes(otroUsuario.toLowerCase())) {
          usuarios[usuario].menciones_otros++;
          break;
        }
      }
      
      // Calcular tiempo de respuesta
      if (i > 0) {
        const mensajeAnterior = mensajes[i-1];
        const tiempoRespuesta = (fecha - mensajeAnterior.fechaObj) / (1000 * 60); // en minutos
        if (tiempoRespuesta > 0) { // Solo considerar respuestas positivas
          usuarios[usuario].tiempo_respuesta.push(tiempoRespuesta);
        }
      }
      
      // Contar emojis
      try {
        const emojis = texto.match(patronEmoji) || [];
        const numEmojis = emojis.length;
        if (numEmojis > 0) {
          usuarios[usuario].emojis_utilizados += numEmojis;
          
          // Contar emojis de amor
          const emojisAmor = texto.match(patronEmojisAmor) || [];
          const numEmojisAmor = emojisAmor.length;
          if (numEmojisAmor > 0) {
            usuarios[usuario].emojis_amor += numEmojisAmor;
          }
        }
      } catch (e) {
        console.error("Error procesando emojis:", e);
      }
      
      // Detectar mensajes con preguntas (Para la categoría "curioso")
      if (texto.includes('?') || 
          /\b(qu[eéè]|c[oó]mo|cu[aá]ndo|d[oó]nde|por qu[eé]|qui[eé]n|cu[aá]l)\b/i.test(texto.toLowerCase())) {
        usuarios[usuario].mensajes_pregunta++;
      }
      
      // Detectar mensajes de agradecimiento (Para la categoría "agradecido")
      if (/\b(gracias|agradec|agradezco|agradecid|thank|thx)\b/i.test(texto.toLowerCase()) || 
          texto.includes('🙏')) {
        usuarios[usuario].mensajes_agradece++;
      }
      
      // Detectar mensajes de disculpa (Para la categoría "disculpón")
      if (/\b(perd[oó]n|disculpa|lo siento|sorry|my bad|me equivoqu[eé])\b/i.test(texto.toLowerCase())) {
        usuarios[usuario].mensajes_disculpa++;
      }
      
      // Detectar si el mensaje anterior fue una risa (Para la categoría "cómico")
      if (i > 0) {
        const mensajeAnterior = mensajes[i-1];
        const usuarioAnterior = mensajeAnterior.nombre;
        const textoAnterior = mensajeAnterior.mensaje || '';
        
        // Si el mensaje actual contiene risas
        if (/\b(jaja|jeje|jiji|haha|lol|lmao)\b/i.test(texto.toLowerCase()) || 
            texto.includes('😂') || texto.includes('🤣') || texto.includes('😆') || 
            texto.includes('😄') || texto.includes('😅')) {
          
          // Atribuir la "capacidad de hacer reír" al usuario del mensaje anterior
          // (Solo si son usuarios diferentes para evitar contar autorisas)
          if (usuario !== usuarioAnterior) {
            usuarios[usuarioAnterior].mensajes_risa++;
          }
        }
      }
    }
    
    // Calcular estadísticas agregadas
    const horarios_promedio = {};
    const longitudes_promedio = {};
    const tiempo_respuesta_promedio = {};
    const palabras_unicas_ratio = {};
    const palabras_por_mensaje_promedio = {};
    const menciones_yo_ratio = {};
    
    // Estructura para categorías
    const categorias = {
      profesor: { nombre: '--', palabras_unicas: 0, mensajes: 0, ratio: 0 },
      rollero: { nombre: '--', palabras_por_mensaje: 0, mensajes: 0 },
      pistolero: { nombre: '--', tiempo_respuesta_promedio: 0, mensajes: 0 },
      vampiro: { nombre: '--', mensajes_noche: 0, porcentaje: 0, mensajes: 0 },
      cafeconleche: { nombre: '--', hora_promedio: 12.0, hora_formateada: '12:00', mensajes: 0 },
      dejaenvisto: { nombre: '--', tiempo_respuesta_promedio: 0, mensajes: 0 },
      narcicista: { nombre: '--', menciones_yo: 0, porcentaje: 0, mensajes: 0 },
      puntofinal: { nombre: '--', conversaciones_terminadas: 0, mensajes: 0 },
      fosforo: { nombre: '--', conversaciones_iniciadas: 0, mensajes: 0 },
      menosesmas: { nombre: '--', longitud_promedio: 0, mensajes: 0 },
      chismoso: { nombre: '--', menciones_otros: 0, porcentaje: 0, mensajes: 0 },
      happyflower: { nombre: '--', emojis_totales: 0, emojis_por_mensaje: 0, mensajes: 0 },
      amoroso: { nombre: '--', emojis_amor: 0, porcentaje_amor: 0, mensajes: 0 },
      sicopata: { nombre: '--', max_mensajes_seguidos: 0, mensajes: 0 },
      comico: { nombre: '--', mensajes_risa: 0, porcentaje: 0, mensajes: 0 },
      agradecido: { nombre: '--', mensajes_agradece: 0, porcentaje: 0, mensajes: 0 },
      disculpon: { nombre: '--', mensajes_disculpa: 0, porcentaje: 0, mensajes: 0 },
      curioso: { nombre: '--', mensajes_pregunta: 0, porcentaje: 0, mensajes: 0 }
    };
    
    // Media estadística
    const calcularMedia = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
    
    // Calcular estadísticas por usuario
    for (const [usuario, datos] of Object.entries(usuarios)) {
      // Horario promedio
      if (datos.horario_mensajes.length > 0) {
        horarios_promedio[usuario] = calcularMedia(datos.horario_mensajes);
      }
      
      // Longitud promedio de mensajes
      if (datos.longitud_mensajes.length > 0) {
        longitudes_promedio[usuario] = calcularMedia(datos.longitud_mensajes);
      }
      
      // Tiempo de respuesta promedio
      if (datos.tiempo_respuesta.length > 0) {
        tiempo_respuesta_promedio[usuario] = calcularMedia(datos.tiempo_respuesta);
      }
      
      // Palabras únicas (ratio)
      if (datos.mensajes > 0) {
        palabras_unicas_ratio[usuario] = [
          datos.palabras_unicas.size,
          datos.palabras_unicas.size / datos.mensajes
        ];
      }
      
      // Palabras por mensaje
      if (datos.palabras_por_mensaje.length > 0) {
        palabras_por_mensaje_promedio[usuario] = calcularMedia(datos.palabras_por_mensaje);
      }
      
      // Menciones a sí mismo (ratio)
      if (datos.mensajes > 0) {
        menciones_yo_ratio[usuario] = [
          datos.uso_primera_persona || 0,
          datos.mensajes > 0 ? ((datos.uso_primera_persona || 0) / datos.mensajes) * 100 : 0
        ];
      }
    }
    
    // Asignar categorías
    
    // Profesor (más palabras únicas por mensaje)
    if (Object.keys(palabras_unicas_ratio).length > 0) {
      const usuarioProfesor = Object.entries(palabras_unicas_ratio)
        .sort((a, b) => b[1][1] - a[1][1])[0][0];
      const [cantidad, ratio] = palabras_unicas_ratio[usuarioProfesor];
      
      // Calcular la media del resto del grupo sin el profesor
      let totalPalabrasUnicasResto = 0;
      let totalMensajesResto = 0;
      let cantidadUsuariosResto = 0;
      
      for (const [usuario, datos] of Object.entries(usuarios)) {
        if (usuario !== usuarioProfesor) {
          totalPalabrasUnicasResto += datos.palabras_unicas.size;
          totalMensajesResto += datos.mensajes;
          cantidadUsuariosResto++;
        }
      }
      
      const mediaPalabrasUnicasResto = cantidadUsuariosResto > 0 ? totalPalabrasUnicasResto / cantidadUsuariosResto : 0;
      const mediaRatioResto = totalMensajesResto > 0 ? totalPalabrasUnicasResto / totalMensajesResto : 0;
      
      categorias.profesor = {
        nombre: usuarioProfesor,
        palabras_unicas: cantidad,
        ratio: ratio,
        mensajes: usuarios[usuarioProfesor].mensajes,
        media_palabras_unicas_resto: mediaPalabrasUnicasResto,
        media_ratio_resto: mediaRatioResto
      };
    }
    
    // Rollero (más palabras por mensaje)
    if (Object.keys(palabras_por_mensaje_promedio).length > 0) {
      const usuarioRollero = Object.entries(palabras_por_mensaje_promedio)
        .sort((a, b) => b[1] - a[1])[0][0];
      
      // Calcular la media del resto del grupo sin el rollero
      let totalPalabrasPorMensajeResto = 0;
      let cantidadUsuariosResto = 0;
      
      for (const [usuario, valor] of Object.entries(palabras_por_mensaje_promedio)) {
        if (usuario !== usuarioRollero) {
          totalPalabrasPorMensajeResto += valor;
          cantidadUsuariosResto++;
        }
      }
      
      const mediaPalabrasPorMensajeResto = cantidadUsuariosResto > 0 ? totalPalabrasPorMensajeResto / cantidadUsuariosResto : 0;
      
      categorias.rollero = {
        nombre: usuarioRollero,
        palabras_por_mensaje: palabras_por_mensaje_promedio[usuarioRollero],
        mensajes: usuarios[usuarioRollero].mensajes,
        media_palabras_por_mensaje_resto: mediaPalabrasPorMensajeResto
      };
    }
    
    // Pistolero (responde más rápido)
    if (Object.keys(tiempo_respuesta_promedio).length > 0) {
      const usuarioPistolero = Object.entries(tiempo_respuesta_promedio)
        .sort((a, b) => a[1] - b[1])[0][0];
      
      // Calcular la media del resto del grupo sin el pistolero
      let totalTiempoRespuestaResto = 0;
      let cantidadUsuariosResto = 0;
      
      for (const [usuario, valor] of Object.entries(tiempo_respuesta_promedio)) {
        if (usuario !== usuarioPistolero) {
          totalTiempoRespuestaResto += valor;
          cantidadUsuariosResto++;
        }
      }
      
      const mediaTiempoRespuestaResto = cantidadUsuariosResto > 0 ? totalTiempoRespuestaResto / cantidadUsuariosResto : 0;
      
      categorias.pistolero = {
        nombre: usuarioPistolero,
        tiempo_respuesta_promedio: tiempo_respuesta_promedio[usuarioPistolero],
        mensajes: usuarios[usuarioPistolero].mensajes,
        media_tiempo_respuesta_resto: mediaTiempoRespuestaResto
      };
    }
    
    // Dejaenvisto (responde más lento)
    if (Object.keys(tiempo_respuesta_promedio).length > 0) {
      const usuarioDejaenvisto = Object.entries(tiempo_respuesta_promedio)
        .sort((a, b) => b[1] - a[1])[0][0];
      
      // Calcular la media del resto del grupo sin el dejaenvisto
      let totalTiempoRespuestaResto = 0;
      let cantidadUsuariosResto = 0;
      
      for (const [usuario, valor] of Object.entries(tiempo_respuesta_promedio)) {
        if (usuario !== usuarioDejaenvisto) {
          totalTiempoRespuestaResto += valor;
          cantidadUsuariosResto++;
        }
      }
      
      const mediaTiempoRespuestaResto = cantidadUsuariosResto > 0 ? totalTiempoRespuestaResto / cantidadUsuariosResto : 0;
      
      categorias.dejaenvisto = {
        nombre: usuarioDejaenvisto,
        tiempo_respuesta_promedio: tiempo_respuesta_promedio[usuarioDejaenvisto],
        mensajes: usuarios[usuarioDejaenvisto].mensajes,
        media_tiempo_respuesta_resto: mediaTiempoRespuestaResto
      };
    }
    
    // Vampiro (más mensajes nocturnos)
    const vampirosData = [];
    for (const [usuario, datos] of Object.entries(usuarios)) {
      if (datos.mensajes > 0) {
        const porcentaje = (datos.mensajes_noche / datos.mensajes) * 100;
        vampirosData.push([usuario, datos.mensajes_noche, porcentaje]);
      }
    }
    
    if (vampirosData.length > 0) {
      const [usuarioVampiro] = vampirosData.sort((a, b) => b[1] - a[1])[0];
      const mensajesNoche = usuarios[usuarioVampiro].mensajes_noche || 0;
      const totalMensajes = usuarios[usuarioVampiro].mensajes || 1; // Evitar división por cero
      const porcentaje = totalMensajes > 0 ? (mensajesNoche / totalMensajes) * 100 : 0;
      
      // Calcular la media del resto del grupo sin el vampiro
      let totalMensajesNocheResto = 0;
      let totalMensajesResto = 0;
      
      for (const [usuario, datos] of Object.entries(usuarios)) {
        if (usuario !== usuarioVampiro) {
          totalMensajesNocheResto += datos.mensajes_noche;
          totalMensajesResto += datos.mensajes;
        }
      }
      
      const porcentajeResto = totalMensajesResto > 0 ? (totalMensajesNocheResto / totalMensajesResto) * 100 : 0;
      
      categorias.vampiro = {
        nombre: usuarioVampiro,
        mensajes_noche: mensajesNoche,
        porcentaje: porcentaje,
        mensajes: totalMensajes,
        media_mensajes_noche_resto: totalMensajesNocheResto / (Object.keys(usuarios).length - 1),
        media_porcentaje_resto: porcentajeResto
      };
    }
    
    // Cafeconleche (se levanta más temprano)
    if (Object.keys(horarios_promedio).length > 0) {
      // Ajustar horas para considerar que las primeras horas del día son "más temprano"
      const adjustedTimes = {};
      for (const [usuario, hora] of Object.entries(horarios_promedio)) {
        adjustedTimes[usuario] = hora >= 6 ? hora : hora + 24;
      }
      
      const usuarioCafeconleche = Object.entries(adjustedTimes)
        .sort((a, b) => a[1] - b[1])[0][0];
      
      const horaPromedio = horarios_promedio[usuarioCafeconleche] || 0;
      
      // Asegurarse de que la hora y los minutos son válidos
      let horaEntera = 0;
      let minutos = 0;
      
      if (!isNaN(horaPromedio)) {
        horaEntera = Math.floor(horaPromedio);
        minutos = Math.floor((horaPromedio - horaEntera) * 60);
      }
      
      // Formato de hora con ceros a la izquierda
      const horaFormateada = `${horaEntera}:${minutos.toString().padStart(2, '0')}`;
      
      // Calcular la media del resto del grupo sin el cafeconleche
      let totalHorariosResto = 0;
      let cantidadUsuariosResto = 0;
      
      for (const [usuario, hora] of Object.entries(horarios_promedio)) {
        if (usuario !== usuarioCafeconleche) {
          totalHorariosResto += hora;
          cantidadUsuariosResto++;
        }
      }
      
      const mediaHorariosResto = cantidadUsuariosResto > 0 ? totalHorariosResto / cantidadUsuariosResto : 0;
      
      // Convertir media a formato hora:minutos
      let horaMediaResto = 0;
      let minutosMediaResto = 0;
      
      if (!isNaN(mediaHorariosResto)) {
        horaMediaResto = Math.floor(mediaHorariosResto);
        minutosMediaResto = Math.floor((mediaHorariosResto - horaMediaResto) * 60);
      }
      
      const horaFormateadaResto = `${horaMediaResto}:${minutosMediaResto.toString().padStart(2, '0')}`;
      
      categorias.cafeconleche = {
        nombre: usuarioCafeconleche,
        hora_promedio: horaPromedio,
        hora_formateada: horaFormateada,
        mensajes: usuarios[usuarioCafeconleche].mensajes,
        media_hora_resto: mediaHorariosResto,
        hora_formateada_resto: horaFormateadaResto
      };
    }
    
    // Menosesmas (mensajes más cortos)
    if (Object.keys(longitudes_promedio).length > 0) {
      const usuarioMenosesmas = Object.entries(longitudes_promedio)
        .sort((a, b) => a[1] - b[1])[0][0];
      
      // Calcular la media del resto del grupo sin menosesmas
      let totalLongitudesResto = 0;
      let cantidadUsuariosResto = 0;
      
      for (const [usuario, longitud] of Object.entries(longitudes_promedio)) {
        if (usuario !== usuarioMenosesmas) {
          totalLongitudesResto += longitud;
          cantidadUsuariosResto++;
        }
      }
      
      const mediaLongitudesResto = cantidadUsuariosResto > 0 ? totalLongitudesResto / cantidadUsuariosResto : 0;
      
      categorias.menosesmas = {
        nombre: usuarioMenosesmas,
        longitud_promedio: longitudes_promedio[usuarioMenosesmas],
        mensajes: usuarios[usuarioMenosesmas].mensajes,
        media_longitud_resto: mediaLongitudesResto
      };
    }
    
    // Narcicista (más menciones a sí mismo)
    if (Object.keys(menciones_yo_ratio).length > 0) {
      const usuarioNarcicista = Object.entries(menciones_yo_ratio)
        .sort((a, b) => b[1][1] - a[1][1])[0][0];
      const [menciones, porcentaje] = menciones_yo_ratio[usuarioNarcicista];
      
      // Calcular la media del resto del grupo sin el narcicista
      let totalMencionesResto = 0;
      let totalMensajesResto = 0;
      
      for (const [usuario, [mencionesUsuario, _]] of Object.entries(menciones_yo_ratio)) {
        if (usuario !== usuarioNarcicista) {
          totalMencionesResto += mencionesUsuario;
          totalMensajesResto += usuarios[usuario].mensajes;
        }
      }
      
      const mediaMencionesResto = Object.keys(menciones_yo_ratio).length > 1 ? 
        totalMencionesResto / (Object.keys(menciones_yo_ratio).length - 1) : 0;
      const porcentajeResto = totalMensajesResto > 0 ? (totalMencionesResto / totalMensajesResto) * 100 : 0;
      
      categorias.narcicista = {
        nombre: usuarioNarcicista,
        menciones_yo: menciones,
        porcentaje: porcentaje,
        mensajes: usuarios[usuarioNarcicista].mensajes,
        media_menciones_resto: mediaMencionesResto,
        media_porcentaje_resto: porcentajeResto
      };
    }
    
    // Chismoso (más menciones a otros usuarios)
    const chismososData = [];
    for (const [usuario, datos] of Object.entries(usuarios)) {
      if (datos.mensajes > 0 && datos.menciones_otros > 0) {
        const porcentaje = (datos.menciones_otros / datos.mensajes) * 100;
        chismososData.push([usuario, datos.menciones_otros, porcentaje]);
      }
    }
    
    if (chismososData.length > 0) {
      const [usuarioChismoso] = chismososData.sort((a, b) => b[1] - a[1])[0];
      const mencionesOtros = usuarios[usuarioChismoso].menciones_otros;
      const porcentaje = (mencionesOtros / usuarios[usuarioChismoso].mensajes) * 100;
      
      // Calcular la media del resto del grupo sin el chismoso
      let totalMencionesOtrosResto = 0;
      let totalMensajesResto = 0;
      
      for (const [usuario, datos] of Object.entries(usuarios)) {
        if (usuario !== usuarioChismoso && datos.mensajes > 0) {
          totalMencionesOtrosResto += datos.menciones_otros;
          totalMensajesResto += datos.mensajes;
        }
      }
      
      const mediaMencionesOtrosResto = Object.keys(usuarios).length > 1 ? 
        totalMencionesOtrosResto / (Object.keys(usuarios).length - 1) : 0;
      const porcentajeResto = totalMensajesResto > 0 ? (totalMencionesOtrosResto / totalMensajesResto) * 100 : 0;
      
      categorias.chismoso = {
        nombre: usuarioChismoso,
        menciones_otros: mencionesOtros,
        porcentaje: porcentaje,
        mensajes: usuarios[usuarioChismoso].mensajes,
        media_menciones_otros_resto: mediaMencionesOtrosResto,
        media_porcentaje_resto: porcentajeResto
      };
    }
    
    // Puntofinal (termina más conversaciones)
    if (Object.keys(conversacionesTerminadas).length > 0) {
      const usuarioPuntofinal = Object.entries(conversacionesTerminadas)
        .sort((a, b) => b[1] - a[1])[0][0];
      
      // Calcular la media del resto del grupo sin puntofinal
      let totalConversacionesTerminadasResto = 0;
      let cantidadUsuariosResto = 0;
      
      for (const [usuario, terminaciones] of Object.entries(conversacionesTerminadas)) {
        if (usuario !== usuarioPuntofinal) {
          totalConversacionesTerminadasResto += terminaciones;
          cantidadUsuariosResto++;
        }
      }
      
      const mediaTerminacionesResto = cantidadUsuariosResto > 0 ? 
        totalConversacionesTerminadasResto / cantidadUsuariosResto : 0;
      
      categorias.puntofinal = {
        nombre: usuarioPuntofinal,
        conversaciones_terminadas: conversacionesTerminadas[usuarioPuntofinal],
        mensajes: usuarios[usuarioPuntofinal].mensajes,
        media_conversaciones_terminadas_resto: mediaTerminacionesResto
      };
    }
    
    // Fosforo (inicia más conversaciones)
    if (Object.keys(conversacionesIniciadas).length > 0) {
      const usuarioFosforo = Object.entries(conversacionesIniciadas)
        .sort((a, b) => b[1] - a[1])[0][0];
      
      // Calcular la media del resto del grupo sin fosforo
      let totalConversacionesIniciadasResto = 0;
      let cantidadUsuariosResto = 0;
      
      for (const [usuario, iniciaciones] of Object.entries(conversacionesIniciadas)) {
        if (usuario !== usuarioFosforo) {
          totalConversacionesIniciadasResto += iniciaciones;
          cantidadUsuariosResto++;
        }
      }
      
      const mediaIniciacionesResto = cantidadUsuariosResto > 0 ? 
        totalConversacionesIniciadasResto / cantidadUsuariosResto : 0;
      
      categorias.fosforo = {
        nombre: usuarioFosforo,
        conversaciones_iniciadas: conversacionesIniciadas[usuarioFosforo],
        mensajes: usuarios[usuarioFosforo].mensajes,
        media_conversaciones_iniciadas_resto: mediaIniciacionesResto
      };
    }
    
    // Happyflower (más emojis por mensaje)
    const usuariosConEmojis = [];
    for (const [usuario, datos] of Object.entries(usuarios)) {
      if (datos.mensajes > 0 && datos.emojis_utilizados > 0) {
        const emojisPorMensaje = datos.emojis_utilizados / datos.mensajes;
        usuariosConEmojis.push([usuario, datos.emojis_utilizados, emojisPorMensaje]);
      }
    }
    
    if (usuariosConEmojis.length > 0) {
      const [usuarioHappyflower] = usuariosConEmojis.sort((a, b) => b[1] - a[1])[0];
      const emojisTotales = usuarios[usuarioHappyflower].emojis_utilizados;
      const emojisPorMsg = emojisTotales / usuarios[usuarioHappyflower].mensajes;
      
      // Calcular la media del resto del grupo sin happyflower
      let totalEmojisResto = 0;
      let totalMensajesResto = 0;
      
      for (const [usuario, datos] of Object.entries(usuarios)) {
        if (usuario !== usuarioHappyflower) {
          totalEmojisResto += datos.emojis_utilizados;
          totalMensajesResto += datos.mensajes;
        }
      }
      
      const mediaEmojisTotalesResto = Object.keys(usuarios).length > 1 ? 
        totalEmojisResto / (Object.keys(usuarios).length - 1) : 0;
      const mediaEmojisPorMensajeResto = totalMensajesResto > 0 ? 
        totalEmojisResto / totalMensajesResto : 0;
      
      categorias.happyflower = {
        nombre: usuarioHappyflower,
        emojis_totales: emojisTotales,
        emojis_por_mensaje: emojisPorMsg,
        mensajes: usuarios[usuarioHappyflower].mensajes,
        media_emojis_totales_resto: mediaEmojisTotalesResto,
        media_emojis_por_mensaje_resto: mediaEmojisPorMensajeResto
      };
    }
    
    // Amoroso (más emojis de amor)
    const usuariosConEmojisAmor = [];
    for (const [usuario, datos] of Object.entries(usuarios)) {
      if (datos.mensajes > 0 && datos.emojis_amor > 0) {
        let porcentajeAmor = 0;
        if (datos.emojis_utilizados > 0) {
          porcentajeAmor = (datos.emojis_amor / datos.emojis_utilizados) * 100;
        }
        usuariosConEmojisAmor.push([usuario, datos.emojis_amor, porcentajeAmor]);
      }
    }
    
    if (usuariosConEmojisAmor.length > 0) {
      const [usuarioAmoroso] = usuariosConEmojisAmor.sort((a, b) => b[1] - a[1])[0];
      const emojisAmorTotal = usuarios[usuarioAmoroso].emojis_amor;
      let porcentajeAmor = 0;
      if (usuarios[usuarioAmoroso].emojis_utilizados > 0) {
        porcentajeAmor = (emojisAmorTotal / usuarios[usuarioAmoroso].emojis_utilizados) * 100;
      }
      
      // Calcular la media del resto del grupo sin amoroso
      let totalEmojisAmorResto = 0;
      let totalEmojisResto = 0;
      
      for (const [usuario, datos] of Object.entries(usuarios)) {
        if (usuario !== usuarioAmoroso) {
          totalEmojisAmorResto += datos.emojis_amor;
          totalEmojisResto += datos.emojis_utilizados;
        }
      }
      
      const mediaEmojisAmorResto = Object.keys(usuarios).length > 1 ? 
        totalEmojisAmorResto / (Object.keys(usuarios).length - 1) : 0;
      const mediaPorcentajeAmorResto = totalEmojisResto > 0 ? 
        (totalEmojisAmorResto / totalEmojisResto) * 100 : 0;
      
      categorias.amoroso = {
        nombre: usuarioAmoroso,
        emojis_amor: emojisAmorTotal,
        porcentaje_amor: porcentajeAmor,
        mensajes: usuarios[usuarioAmoroso].mensajes,
        media_emojis_amor_resto: mediaEmojisAmorResto,
        media_porcentaje_amor_resto: mediaPorcentajeAmorResto
      };
    }
    
    // Sicopata (más mensajes consecutivos)
    const usuariosConMensajesConsecutivos = [];
    for (const [usuario, datos] of Object.entries(usuarios)) {
      if (datos.mensajes > 0 && datos.max_mensajes_seguidos > 1) {
        usuariosConMensajesConsecutivos.push([usuario, datos.max_mensajes_seguidos]);
      }
    }
    
    if (usuariosConMensajesConsecutivos.length > 0) {
      const [usuarioSicopata] = usuariosConMensajesConsecutivos.sort((a, b) => b[1] - a[1])[0];
      const maxMensajesSeguidos = usuarios[usuarioSicopata].max_mensajes_seguidos;
      
      // Calcular la media del resto del grupo sin sicopata
      let totalMensajesSeguidosResto = 0;
      let cantidadUsuariosResto = 0;
      
      for (const [usuario, mensajesSeguidos] of usuariosConMensajesConsecutivos) {
        if (usuario !== usuarioSicopata) {
          totalMensajesSeguidosResto += mensajesSeguidos;
          cantidadUsuariosResto++;
        }
      }
      
      const mediaMensajesSeguidosResto = cantidadUsuariosResto > 0 ? 
        totalMensajesSeguidosResto / cantidadUsuariosResto : 0;
      
      categorias.sicopata = {
        nombre: usuarioSicopata,
        max_mensajes_seguidos: maxMensajesSeguidos,
        mensajes: usuarios[usuarioSicopata].mensajes,
        media_mensajes_seguidos_resto: mediaMensajesSeguidosResto
      };
    }
    
    // Cómico (genera más risas)
    const usuariosConRisas = [];
    for (const [usuario, datos] of Object.entries(usuarios)) {
      if (datos.mensajes > 0 && datos.mensajes_risa > 0) {
        const porcentaje = (datos.mensajes_risa / datos.mensajes) * 100;
        usuariosConRisas.push([usuario, datos.mensajes_risa, porcentaje]);
      }
    }
    
    if (usuariosConRisas.length > 0) {
      const [usuarioComico] = usuariosConRisas.sort((a, b) => b[1] - a[1])[0];
      const mensajesRisa = usuarios[usuarioComico].mensajes_risa;
      const porcentaje = (mensajesRisa / usuarios[usuarioComico].mensajes) * 100;
      
      // Calcular la media del resto del grupo sin el cómico
      let totalMensajesRisaResto = 0;
      let totalMensajesResto = 0;
      
      for (const [usuario, datos] of Object.entries(usuarios)) {
        if (usuario !== usuarioComico) {
          totalMensajesRisaResto += datos.mensajes_risa;
          totalMensajesResto += datos.mensajes;
        }
      }
      
      const mediaMensajesRisaResto = Object.keys(usuarios).length > 1 ? 
        totalMensajesRisaResto / (Object.keys(usuarios).length - 1) : 0;
      const mediaPorcentajeResto = totalMensajesResto > 0 ? 
        (totalMensajesRisaResto / totalMensajesResto) * 100 : 0;
      
      categorias.comico = {
        nombre: usuarioComico,
        mensajes_risa: mensajesRisa,
        porcentaje: porcentaje,
        mensajes: usuarios[usuarioComico].mensajes,
        media_mensajes_risa_resto: mediaMensajesRisaResto,
        media_porcentaje_resto: mediaPorcentajeResto
      };
    }
    
    // Agradecido (da más las gracias)
    const usuariosConAgradecimiento = [];
    for (const [usuario, datos] of Object.entries(usuarios)) {
      if (datos.mensajes > 0 && datos.mensajes_agradece > 0) {
        const porcentaje = (datos.mensajes_agradece / datos.mensajes) * 100;
        usuariosConAgradecimiento.push([usuario, datos.mensajes_agradece, porcentaje]);
      }
    }
    
    if (usuariosConAgradecimiento.length > 0) {
      const [usuarioAgradecido] = usuariosConAgradecimiento.sort((a, b) => b[1] - a[1])[0];
      const mensajesAgradece = usuarios[usuarioAgradecido].mensajes_agradece;
      const porcentaje = (mensajesAgradece / usuarios[usuarioAgradecido].mensajes) * 100;
      
      // Calcular la media del resto del grupo sin el agradecido
      let totalMensajesAgradecimientoResto = 0;
      let totalMensajesResto = 0;
      
      for (const [usuario, datos] of Object.entries(usuarios)) {
        if (usuario !== usuarioAgradecido) {
          totalMensajesAgradecimientoResto += datos.mensajes_agradece;
          totalMensajesResto += datos.mensajes;
        }
      }
      
      const mediaMensajesAgradecimientoResto = Object.keys(usuarios).length > 1 ? 
        totalMensajesAgradecimientoResto / (Object.keys(usuarios).length - 1) : 0;
      const mediaPorcentajeResto = totalMensajesResto > 0 ? 
        (totalMensajesAgradecimientoResto / totalMensajesResto) * 100 : 0;
      
      categorias.agradecido = {
        nombre: usuarioAgradecido,
        mensajes_agradece: mensajesAgradece,
        porcentaje: porcentaje,
        mensajes: usuarios[usuarioAgradecido].mensajes,
        media_mensajes_agradecimiento_resto: mediaMensajesAgradecimientoResto,
        media_porcentaje_resto: mediaPorcentajeResto
      };
    }
    
    // Disculpón (pide más perdón)
    const usuariosConDisculpas = [];
    for (const [usuario, datos] of Object.entries(usuarios)) {
      if (datos.mensajes > 0 && datos.mensajes_disculpa > 0) {
        const porcentaje = (datos.mensajes_disculpa / datos.mensajes) * 100;
        usuariosConDisculpas.push([usuario, datos.mensajes_disculpa, porcentaje]);
      }
    }
    
    if (usuariosConDisculpas.length > 0) {
      const [usuarioDisculpon] = usuariosConDisculpas.sort((a, b) => b[1] - a[1])[0];
      const mensajesDisculpa = usuarios[usuarioDisculpon].mensajes_disculpa;
      const porcentaje = (mensajesDisculpa / usuarios[usuarioDisculpon].mensajes) * 100;
      
      // Calcular la media del resto del grupo sin el disculpón
      let totalMensajesDisculpaResto = 0;
      let totalMensajesResto = 0;
      
      for (const [usuario, datos] of Object.entries(usuarios)) {
        if (usuario !== usuarioDisculpon) {
          totalMensajesDisculpaResto += datos.mensajes_disculpa;
          totalMensajesResto += datos.mensajes;
        }
      }
      
      const mediaMensajesDisculpaResto = Object.keys(usuarios).length > 1 ? 
        totalMensajesDisculpaResto / (Object.keys(usuarios).length - 1) : 0;
      const mediaPorcentajeResto = totalMensajesResto > 0 ? 
        (totalMensajesDisculpaResto / totalMensajesResto) * 100 : 0;
      
      categorias.disculpon = {
        nombre: usuarioDisculpon,
        mensajes_disculpa: mensajesDisculpa,
        porcentaje: porcentaje,
        mensajes: usuarios[usuarioDisculpon].mensajes,
        media_mensajes_disculpa_resto: mediaMensajesDisculpaResto,
        media_porcentaje_resto: mediaPorcentajeResto
      };
    }
    
    // Curioso (hace más preguntas)
    const usuariosConPreguntas = [];
    for (const [usuario, datos] of Object.entries(usuarios)) {
      if (datos.mensajes > 0 && datos.mensajes_pregunta > 0) {
        const porcentaje = (datos.mensajes_pregunta / datos.mensajes) * 100;
        usuariosConPreguntas.push([usuario, datos.mensajes_pregunta, porcentaje]);
      }
    }
    
    if (usuariosConPreguntas.length > 0) {
      const [usuarioCurioso] = usuariosConPreguntas.sort((a, b) => b[1] - a[1])[0];
      const mensajesPregunta = usuarios[usuarioCurioso].mensajes_pregunta;
      const porcentaje = (mensajesPregunta / usuarios[usuarioCurioso].mensajes) * 100;
      
      // Calcular la media del resto del grupo sin el curioso
      let totalMensajesPreguntaResto = 0;
      let totalMensajesResto = 0;
      
      for (const [usuario, datos] of Object.entries(usuarios)) {
        if (usuario !== usuarioCurioso) {
          totalMensajesPreguntaResto += datos.mensajes_pregunta;
          totalMensajesResto += datos.mensajes;
        }
      }
      
      const mediaMensajesPreguntaResto = Object.keys(usuarios).length > 1 ? 
        totalMensajesPreguntaResto / (Object.keys(usuarios).length - 1) : 0;
      const mediaPorcentajeResto = totalMensajesResto > 0 ? 
        (totalMensajesPreguntaResto / totalMensajesResto) * 100 : 0;
      
      categorias.curioso = {
        nombre: usuarioCurioso,
        mensajes_pregunta: mensajesPregunta,
        porcentaje: porcentaje,
        mensajes: usuarios[usuarioCurioso].mensajes,
        media_mensajes_pregunta_resto: mediaMensajesPreguntaResto,
        media_porcentaje_resto: mediaPorcentajeResto
      };
    }
    
    // Convertir palabras_unicas de Set a contador para poder serializar
    for (const usuario of Object.values(usuarios)) {
      if (usuario.palabras_unicas instanceof Set) {
        usuario.palabras_unicas = usuario.palabras_unicas.size;
      }
    }
    
    // Estructura final de resultados
    return {
      usuarios: usuarios,
      categorias: categorias,
      totales: {
        mensajes: mensajes.length,
        usuarios: participantes.size,
        emojis: Object.values(usuarios).reduce((sum, u) => sum + u.emojis_utilizados, 0),
        emojis_amor: Object.values(usuarios).reduce((sum, u) => sum + u.emojis_amor, 0)
      },
      formato_chat: formato,
      success: true
    };
  } catch (error) {
    console.error("Error en analizarPerfilesCompleto:", error);
    return {
      error: `Error en el análisis de perfiles: ${error.message}`,
      success: false
    };
  }
};

// Función para extraer mensajes de las líneas del chat
const extraerMensajes = (lineas, formato) => {
  const mensajes = [];
  let mensajeAnterior = null;
  
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
  
  return mensajes;
};

// Función para analizar un mensaje individual
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
    // Crear un objeto Date válido usando parseDateTime
    const fechaObj = parseDateTime(fecha, hora, formato);
    
    return {
      fecha: fecha,
      hora: hora,
      fechaObj: fechaObj, // Añadir el objeto Date
      nombre: nombre.trim(),
      mensaje: mensaje.trim() || "",
      esMultilinea: false
    };
  }
  return null;
};

// Variable global para rastrear si el componente ya está renderizado
let isAlreadyRendered = false;

const AnalisisTop = ({ operationId, chatData }) => {
  const { t } = useTranslation();
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [isRenderAllowed, setIsRenderAllowed] = useState(false);

  // Determinar si es seguro renderizar este componente
  useEffect(() => {
    // Si este es el primer renderizado, permitirlo
    if (!isAlreadyRendered) {
      isAlreadyRendered = true;
      setIsRenderAllowed(true);
    } else {
      // Si ya está renderizado y tenemos datos de chat, permitirlo (reemplaza versión App.js)
      if (chatData) {
        isAlreadyRendered = true;
        setIsRenderAllowed(true);
      } else {
        // De lo contrario, no permitir renderizar
        setIsRenderAllowed(false);
      }
    }

    // Reset al desmontar
    return () => {
      isAlreadyRendered = false;
    };
  }, [chatData]);

  // Mapeo de categorías con íconos y traducciones
  const categoriaIconos = {
    'profesor': { 
      icono: '👨‍🏫', 
      titulo: () => t('app.top_profiles.professor.title'), 
      descripcion: () => t('app.top_profiles.professor.description') 
    },
    'rollero': { 
      icono: '📜', 
      titulo: () => t('app.top_profiles.verbose.title'), 
      descripcion: () => t('app.top_profiles.verbose.description') 
    },
    'pistolero': { 
      icono: '🔫', 
      titulo: () => t('app.top_profiles.gunslinger.title'), 
      descripcion: () => t('app.top_profiles.gunslinger.description') 
    },
    'vampiro': { 
      icono: '🧛', 
      titulo: () => t('app.top_profiles.vampire.title'), 
      descripcion: () => t('app.top_profiles.vampire.description') 
    },
    'cafeconleche': { 
      icono: '☕', 
      titulo: () => t('app.top_profiles.morning.title'), 
      descripcion: () => t('app.top_profiles.morning.description') 
    },
    'dejaenvisto': { 
      icono: '👻', 
      titulo: () => t('app.top_profiles.ghost.title'), 
      descripcion: () => t('app.top_profiles.ghost.description') 
    },
    'narcicista': { 
      icono: '🪞', 
      titulo: () => t('app.top_profiles.narcissist.title'), 
      descripcion: () => t('app.top_profiles.narcissist.description') 
    },
    'puntofinal': { 
      icono: '🔚', 
      titulo: () => t('app.top_profiles.finisher.title'), 
      descripcion: () => t('app.top_profiles.finisher.description') 
    },
    'fosforo': { 
      icono: '🔥', 
      titulo: () => t('app.top_profiles.initiator.title'), 
      descripcion: () => t('app.top_profiles.initiator.description') 
    },
    'menosesmas': { 
      icono: '🔍', 
      titulo: () => t('app.top_profiles.concise.title'), 
      descripcion: () => t('app.top_profiles.concise.description') 
    },
    'chismoso': { 
      icono: '👂', 
      titulo: () => t('app.top_profiles.gossip.title'), 
      descripcion: () => t('app.top_profiles.gossip.description') 
    },
    'happyflower': { 
      icono: '😊', 
      titulo: () => t('app.top_profiles.emoji.title'), 
      descripcion: () => t('app.top_profiles.emoji.description') 
    },
    'amoroso': { 
      icono: '❤️', 
      titulo: () => t('app.top_profiles.amoroso.title'), 
      descripcion: () => t('app.top_profiles.amoroso.description') 
    },
    'sicopata': { 
      icono: '🔪', 
      titulo: () => t('app.top_profiles.sicopata.title'), 
      descripcion: () => t('app.top_profiles.sicopata.description') 
    },
    'comico': { 
      icono: '🤡', 
      titulo: () => 'El cómico', 
      descripcion: () => 'Tiene el don de hacer reír a los demás' 
    },
    'agradecido': { 
      icono: '🙏', 
      titulo: () => 'El agradecido', 
      descripcion: () => 'Siempre da las gracias por todo' 
    },
    'disculpon': { 
      icono: '🙇', 
      titulo: () => 'El disculpón', 
      descripcion: () => 'Pide perdón más que nadie' 
    },
    'curioso': { 
      icono: '🧐', 
      titulo: () => 'El curioso', 
      descripcion: () => 'Siempre haciendo preguntas' 
    }
  };

  useEffect(() => {
    // Si no se permite el renderizado, no hacer nada
    if (!isRenderAllowed) return;

    // Verificar si tenemos datos del chat para analizar directamente en el cliente
    if (chatData) {
      console.log("Analizando perfiles del chat en el cliente");
      setCargando(true);
      
      try {
        // Analizar los datos del chat utilizando nuestro analizador de cliente
        const resultadoAnalisis = analizarPerfilesCompleto(chatData);
        console.log("Resultado del análisis de perfiles en cliente:", resultadoAnalisis);
        
        // Establecer los datos analizados
        if (resultadoAnalisis && resultadoAnalisis.success) {
          setDatos(resultadoAnalisis);
          setError(null);
          
          // Seleccionar la primera categoría por defecto
          if (resultadoAnalisis.categorias && Object.keys(resultadoAnalisis.categorias).length > 0) {
            setCategoriaSeleccionada(Object.keys(resultadoAnalisis.categorias)[0]);
          }
        } else {
          setError(resultadoAnalisis.error || t('app.errors.analysis_failed'));
        }
      } catch (err) {
        console.error("Error analizando los perfiles del chat:", err);
        setError(`${t('app.errors.analysis_error')}: ${err.message}`);
      } finally {
        setCargando(false);
      }
      return;
    }
    
    if (!operationId) {
      setError(t('app.errors.no_operation_id'));
      setCargando(false);
      return;
    }

    // Si no hay datos directos pero hay operationId, cargar del servidor
    // (Fallback a la versión original que usa el servidor)
    const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000';
    
    console.log(`DEPRECATED: Cargando datos de top perfiles desde el backend: ${API_URL}/api/resultados-top/${operationId}`);
    console.warn("Esta funcionalidad usando operationId se eliminará en futuras versiones. Use chatData en su lugar.");
    
    // Eliminar parámetro para forzar formato iOS
    const url = `${API_URL}/api/resultados-top/${operationId}`;
    
    // Asegurar que el estado de carga esté activo
    setCargando(true);
    
    // Función para verificar que los datos estén completos
    const verificarDatosCompletos = (data) => {
      if (!data || !data.categorias) return false;
      
      // Verificar que todas las categorías necesarias estén presentes
      const categoriasRequeridas = [
        'profesor', 'rollero', 'pistolero', 'vampiro', 'cafeconleche',
        'dejaenvisto', 'narcicista', 'chismoso', 'happyflower',
        'puntofinal', 'fosforo', 'menosesmas', 'amoroso', 'sicopata',
        'comico', 'agradecido', 'disculpon', 'curioso'
      ];
      
      return categoriasRequeridas.every(categoria => 
        data.categorias[categoria] && 
        data.categorias[categoria].nombre && 
        data.categorias[categoria].mensajes !== undefined
      );
    };

    // Función para reintentar la carga si es necesario
    const cargarDatos = (intentos = 0) => {
      fetch(url)
        .then(response => {
          if (!response.ok) {
            throw new Error(t('app.errors.loading_data_top'));
          }
          return response.json();
        })
        .then(data => {
          console.log('Datos recibidos de la API:', data);
          
          // Verificar explícitamente el formato
          if (!data.formato_chat) {
            console.warn('El formato de chat no está especificado en la respuesta');
          } else {
            console.log('Formato de chat detectado:', data.formato_chat);
          }
          
          // Verificar que los datos no sean nulos o vacíos
          if (!data || !data.categorias || Object.keys(data.categorias).length === 0) {
            throw new Error(t('app.errors.empty_categories'));
          }

          // Verificar que los datos estén completos
          if (!verificarDatosCompletos(data)) {
            if (intentos < 3) { // Máximo 3 intentos
              console.log(`Datos incompletos, reintentando... (intento ${intentos + 1})`);
              setTimeout(() => cargarDatos(intentos + 1), 1000); // Esperar 1 segundo antes de reintentar
              return;
            } else {
              throw new Error(t('app.errors.incomplete_data'));
            }
          }
          
          // Transformar los datos al formato esperado
          const datosTransformados = {
            formato_chat: data.formato_chat || 'desconocido',
            categorias: {
              profesor: {
                nombre: data.categorias?.profesor?.nombre || 'Sin datos',
                palabras_unicas: data.categorias?.profesor?.palabras_unicas || 0,
                ratio: data.categorias?.profesor?.ratio || 0,
                mensajes: data.categorias?.profesor?.mensajes || 0
              },
              rollero: {
                nombre: data.categorias?.rollero?.nombre || 'Sin datos',
                palabras_por_mensaje: data.categorias?.rollero?.palabras_por_mensaje || 0,
                mensajes: data.categorias?.rollero?.mensajes || 0
              },
              pistolero: {
                nombre: data.categorias?.pistolero?.nombre || 'Sin datos',
                tiempo_respuesta_promedio: data.categorias?.pistolero?.tiempo_respuesta_promedio || 0,
                mensajes: data.categorias?.pistolero?.mensajes || 0
              },
              vampiro: {
                nombre: data.categorias?.vampiro?.nombre || 'Sin datos',
                mensajes_noche: data.categorias?.vampiro?.mensajes_noche || 0,
                porcentaje: (data.categorias?.vampiro?.porcentaje !== undefined && !isNaN(data.categorias?.vampiro?.porcentaje)) ? data.categorias?.vampiro?.porcentaje : 0,
                mensajes: data.categorias?.vampiro?.mensajes || 0
              },
              cafeconleche: {
                nombre: data.categorias?.cafeconleche?.nombre || 'Sin datos',
                hora_formateada: (data.categorias?.cafeconleche?.hora_formateada && data.categorias?.cafeconleche?.hora_formateada !== 'NaN:NaN') ? data.categorias?.cafeconleche?.hora_formateada : '00:00',
                mensajes: data.categorias?.cafeconleche?.mensajes || 0
              },
              dejaenvisto: {
                nombre: data.categorias?.dejaenvisto?.nombre || 'Sin datos',
                tiempo_respuesta_promedio: data.categorias?.dejaenvisto?.tiempo_respuesta_promedio || 0,
                mensajes: data.categorias?.dejaenvisto?.mensajes || 0
              },
              narcicista: {
                nombre: data.categorias?.narcicista?.nombre || 'Sin datos',
                menciones_yo: data.categorias?.narcicista?.menciones_yo || 0,
                porcentaje: data.categorias?.narcicista?.porcentaje || 0,
                mensajes: data.categorias?.narcicista?.mensajes || 0
              },
              chismoso: {
                nombre: data.categorias?.chismoso?.nombre || 'Sin datos',
                menciones_otros: data.categorias?.chismoso?.menciones_otros || 0,
                porcentaje: data.categorias?.chismoso?.porcentaje || 0,
                mensajes: data.categorias?.chismoso?.mensajes || 0
              },
              happyflower: {
                nombre: data.categorias?.happyflower?.nombre || 'Sin datos',
                emojis_totales: data.categorias?.happyflower?.emojis_totales || 0,
                emojis_por_mensaje: data.categorias?.happyflower?.emojis_por_mensaje || 0,
                mensajes: data.categorias?.happyflower?.mensajes || 0
              },
              puntofinal: {
                nombre: data.categorias?.puntofinal?.nombre || 'Sin datos',
                conversaciones_terminadas: data.categorias?.puntofinal?.conversaciones_terminadas || 0,
                mensajes: data.categorias?.puntofinal?.mensajes || 0
              },
              fosforo: {
                nombre: data.categorias?.fosforo?.nombre || 'Sin datos',
                conversaciones_iniciadas: data.categorias?.fosforo?.conversaciones_iniciadas || 0,
                mensajes: data.categorias?.fosforo?.mensajes || 0
              },
              menosesmas: {
                nombre: data.categorias?.menosesmas?.nombre || 'Sin datos',
                longitud_promedio: data.categorias?.menosesmas?.longitud_promedio || 0,
                mensajes: data.categorias?.menosesmas?.mensajes || 0
              },
              amoroso: {
                nombre: data.categorias?.amoroso?.nombre || 'Sin datos',
                emojis_amor: data.categorias?.amoroso?.emojis_amor || 0,
                porcentaje_amor: data.categorias?.amoroso?.porcentaje_amor || 0,
                mensajes: data.categorias?.amoroso?.mensajes || 0
              },
              sicopata: {
                nombre: data.categorias?.sicopata?.nombre || 'Sin datos',
                max_mensajes_seguidos: data.categorias?.sicopata?.max_mensajes_seguidos || 0,
                mensajes: data.categorias?.sicopata?.mensajes || 0
              }
            }
          };
          
          // Establecer los datos y esperar a que se procesen
          setDatos(datosTransformados);
          
          // Usar un pequeño timeout para asegurar que los datos se han procesado
          // antes de quitar el indicador de carga y seleccionar categoría
          setTimeout(() => {
            setCargando(false);
            // Seleccionar la primera categoría por defecto
            if (datosTransformados.categorias && Object.keys(datosTransformados.categorias).length > 0) {
              setCategoriaSeleccionada(Object.keys(datosTransformados.categorias)[0]);
            }
          }, 500); // Aumentado a 500ms para dar más tiempo al procesamiento
        })
        .catch(err => {
          console.error('Error cargando datos:', err);
          setError(err.message);
          setCargando(false);
        });
    };

    // Iniciar la carga de datos
    cargarDatos();
  }, [operationId, chatData, t, isRenderAllowed]);

  const renderDetalleCategoria = (categoria) => {
    if (!datos || !datos.categorias || !datos.categorias[categoria]) {
      return <p>{t('app.errors.no_category_data')}</p>;
    }

    const catData = datos.categorias[categoria];
    let detalleEspecifico = null;

    const formatNumber = (num) => {
      return (num !== undefined && !isNaN(num)) ? Number(num).toFixed(1) : '0.0';
    };

    switch (categoria) {
      case 'profesor':
        detalleEspecifico = (
          <>
            <div className="estadistica">
              <span className="valor">{catData.palabras_unicas || 0}</span>
              <span className="media-resto">{t('app.top_profiles.group_average')}: <span>{formatNumber(catData.media_palabras_unicas_resto)}</span></span>
              <span className="label">{t('app.top_profiles.professor.unique_words')}</span>
            </div>
            <div className="estadistica">
              <span className="valor">{formatNumber(catData.ratio)}</span>
              <span className="media-resto">{t('app.top_profiles.group_average')}: <span>{formatNumber(catData.media_ratio_resto)}</span></span>
              <span className="label">{t('app.top_profiles.professor.unique_ratio')}</span>
            </div>
          </>
        );
        break;
      case 'rollero':
        detalleEspecifico = (
          <div className="estadistica">
            <span className="valor">{formatNumber(catData.palabras_por_mensaje)}</span>
            <span className="media-resto">{t('app.top_profiles.group_average')}: <span>{formatNumber(catData.media_palabras_por_mensaje_resto)}</span></span>
            <span className="label">{t('app.top_profiles.verbose.words_per_message')}</span>
          </div>
        );
        break;
      case 'pistolero':
        detalleEspecifico = (
          <div className="estadistica">
            <span className="valor">{formatNumber(catData.tiempo_respuesta_promedio)}</span>
            <span className="media-resto">{t('app.top_profiles.group_average')}: <span>{formatNumber(catData.media_tiempo_respuesta_resto)}</span></span>
            <span className="label">{t('app.top_profiles.gunslinger.response_time')}</span>
          </div>
        );
        break;
      case 'vampiro':
        detalleEspecifico = (
          <>
            <div className="estadistica">
              <span className="valor">{catData.mensajes_noche || 0}</span>
              <span className="media-resto">{t('app.top_profiles.group_average')}: <span>{formatNumber(catData.media_mensajes_noche_resto)}</span></span>
              <span className="label">{t('app.top_profiles.vampire.night_messages')}</span>
            </div>
            <div className="estadistica">
              <span className="valor">{catData.porcentaje !== undefined && !isNaN(catData.porcentaje) ? formatNumber(catData.porcentaje) : '0.0'}%</span>
              <span className="media-resto">{t('app.top_profiles.group_average')}: <span>{formatNumber(catData.media_porcentaje_resto)}%</span></span>
              <span className="label">{t('app.top_profiles.vampire.percentage')}</span>
            </div>
          </>
        );
        break;
      case 'cafeconleche':
        detalleEspecifico = (
          <div className="estadistica">
            <span className="valor">{catData.hora_formateada && catData.hora_formateada !== 'NaN:NaN' ? catData.hora_formateada : '00:00'}</span>
            <span className="media-resto">{t('app.top_profiles.group_average')}: <span>{catData.hora_formateada_resto || '00:00'}</span></span>
            <span className="label">{t('app.top_profiles.morning.avg_time')}</span>
          </div>
        );
        break;
      case 'dejaenvisto':
        detalleEspecifico = (
          <div className="estadistica">
            <span className="valor">{formatNumber(catData.tiempo_respuesta_promedio)}</span>
            <span className="media-resto">{t('app.top_profiles.group_average')}: <span>{formatNumber(catData.media_tiempo_respuesta_resto)}</span></span>
            <span className="label">{t('app.top_profiles.ghost.response_time')}</span>
          </div>
        );
        break;
      case 'narcicista':
        detalleEspecifico = (
          <>
            <div className="estadistica">
              <span className="valor">{catData.menciones_yo || 0}</span>
              <span className="media-resto">{t('app.top_profiles.group_average')}: <span>{formatNumber(catData.media_menciones_resto)}</span></span>
              <span className="label">{t('app.top_profiles.narcissist.self_mentions')}</span>
            </div>
            <div className="estadistica">
              <span className="valor">{formatNumber(catData.porcentaje)}%</span>
              <span className="media-resto">{t('app.top_profiles.group_average')}: <span>{formatNumber(catData.media_porcentaje_resto)}%</span></span>
              <span className="label">{t('app.top_profiles.narcissist.percentage')}</span>
            </div>
          </>
        );
        break;
      case 'chismoso':
        detalleEspecifico = (
          <>
            <div className="estadistica">
              <span className="valor">{catData.menciones_otros || 0}</span>
              <span className="media-resto">{t('app.top_profiles.group_average')}: <span>{formatNumber(catData.media_menciones_otros_resto)}</span></span>
              <span className="label">{t('app.top_profiles.gossip.others_mentions')}</span>
            </div>
            <div className="estadistica">
              <span className="valor">{formatNumber(catData.porcentaje)}%</span>
              <span className="media-resto">{t('app.top_profiles.group_average')}: <span>{formatNumber(catData.media_porcentaje_resto)}%</span></span>
              <span className="label">{t('app.top_profiles.gossip.percentage')}</span>
            </div>
          </>
        );
        break;
      case 'happyflower':
        detalleEspecifico = (
          <>
            <div className="estadistica">
              <span className="valor">{catData.emojis_totales || 0}</span>
              <span className="media-resto">{t('app.top_profiles.group_average')}: <span>{formatNumber(catData.media_emojis_totales_resto)}</span></span>
              <span className="label">{t('app.top_profiles.emoji.total_emojis')}</span>
            </div>
            <div className="estadistica">
              <span className="valor">{formatNumber(catData.emojis_por_mensaje)}</span>
              <span className="media-resto">{t('app.top_profiles.group_average')}: <span>{formatNumber(catData.media_emojis_por_mensaje_resto)}</span></span>
              <span className="label">{t('app.top_profiles.emoji.emojis_per_message')}</span>
            </div>
          </>
        );
        break;
      case 'amoroso':
        detalleEspecifico = (
          <>
            <div className="estadistica">
              <span className="valor">{catData.emojis_amor || 0}</span>
              <span className="media-resto">{t('app.top_profiles.group_average')}: <span>{formatNumber(catData.media_emojis_amor_resto)}</span></span>
              <span className="label">{t('app.top_profiles.amoroso.love_emojis')}</span>
            </div>
            <div className="estadistica">
              <span className="valor">{formatNumber(catData.porcentaje_amor)}%</span>
              <span className="media-resto">{t('app.top_profiles.group_average')}: <span>{formatNumber(catData.media_porcentaje_amor_resto)}%</span></span>
              <span className="label">{t('app.top_profiles.amoroso.percentage')}</span>
            </div>
          </>
        );
        break;
      case 'puntofinal':
        detalleEspecifico = (
          <div className="estadistica">
            <span className="valor">{catData.conversaciones_terminadas || 0}</span>
            <span className="media-resto">{t('app.top_profiles.group_average')}: <span>{formatNumber(catData.media_conversaciones_terminadas_resto)}</span></span>
            <span className="label">{t('app.top_profiles.finisher.conversations_ended')}</span>
          </div>
        );
        break;
      case 'fosforo':
        detalleEspecifico = (
          <div className="estadistica">
            <span className="valor">{catData.conversaciones_iniciadas || 0}</span>
            <span className="media-resto">{t('app.top_profiles.group_average')}: <span>{formatNumber(catData.media_conversaciones_iniciadas_resto)}</span></span>
            <span className="label">{t('app.top_profiles.initiator.conversations_started')}</span>
          </div>
        );
        break;
      case 'menosesmas':
        detalleEspecifico = (
          <div className="estadistica">
            <span className="valor">{formatNumber(catData.longitud_promedio)}</span>
            <span className="media-resto">{t('app.top_profiles.group_average')}: <span>{formatNumber(catData.media_longitud_resto)}</span></span>
            <span className="label">{t('app.top_profiles.concise.avg_length')}</span>
          </div>
        );
        break;
      case 'sicopata':
        detalleEspecifico = (
          <>
            <div className="estadistica">
              <span className="valor">{catData.max_mensajes_seguidos || 0}</span>
              <span className="media-resto">{t('app.top_profiles.group_average')}: <span>{formatNumber(catData.media_mensajes_seguidos_resto)}</span></span>
              <span className="label">{t('app.top_profiles.sicopata.consecutive_messages')}</span>
            </div>
            <div className="estadistica">
              <span className="valor">{catData.max_mensajes_seguidos || 0}</span>
              <span className="media-resto">{t('app.top_profiles.group_average')}: <span>{formatNumber(catData.media_mensajes_seguidos_resto)}</span></span>
              <span className="label">{t('app.top_profiles.sicopata.record')}</span>
            </div>
          </>
        );
        break;
      case 'comico':
        detalleEspecifico = (
          <>
            <div className="estadistica">
              <span className="valor">{catData.mensajes_risa || 0}</span>
              <span className="media-resto">{t('app.top_profiles.group_average')}: <span>{formatNumber(catData.media_mensajes_risa_resto)}</span></span>
              <span className="label">Mensajes que provocan risa</span>
            </div>
            <div className="estadistica">
              <span className="valor">{formatNumber(catData.porcentaje)}%</span>
              <span className="media-resto">{t('app.top_profiles.group_average')}: <span>{formatNumber(catData.media_porcentaje_resto)}%</span></span>
              <span className="label">% de mensajes que hacen reír</span>
            </div>
          </>
        );
        break;
      case 'agradecido':
        detalleEspecifico = (
          <>
            <div className="estadistica">
              <span className="valor">{catData.mensajes_agradece || 0}</span>
              <span className="media-resto">{t('app.top_profiles.group_average')}: <span>{formatNumber(catData.media_mensajes_agradecimiento_resto)}</span></span>
              <span className="label">Veces que da las gracias</span>
            </div>
            <div className="estadistica">
              <span className="valor">{formatNumber(catData.porcentaje)}%</span>
              <span className="media-resto">{t('app.top_profiles.group_average')}: <span>{formatNumber(catData.media_porcentaje_resto)}%</span></span>
              <span className="label">% de mensajes con agradecimientos</span>
            </div>
          </>
        );
        break;
      case 'disculpon':
        detalleEspecifico = (
          <>
            <div className="estadistica">
              <span className="valor">{catData.mensajes_disculpa || 0}</span>
              <span className="media-resto">{t('app.top_profiles.group_average')}: <span>{formatNumber(catData.media_mensajes_disculpa_resto)}</span></span>
              <span className="label">Veces que pide perdón</span>
            </div>
            <div className="estadistica">
              <span className="valor">{formatNumber(catData.porcentaje)}%</span>
              <span className="media-resto">{t('app.top_profiles.group_average')}: <span>{formatNumber(catData.media_porcentaje_resto)}%</span></span>
              <span className="label">% de mensajes con disculpas</span>
            </div>
          </>
        );
        break;
      case 'curioso':
        detalleEspecifico = (
          <>
            <div className="estadistica">
              <span className="valor">{catData.mensajes_pregunta || 0}</span>
              <span className="media-resto">{t('app.top_profiles.group_average')}: <span>{formatNumber(catData.media_mensajes_pregunta_resto)}</span></span>
              <span className="label">Preguntas realizadas</span>
            </div>
            <div className="estadistica">
              <span className="valor">{formatNumber(catData.porcentaje)}%</span>
              <span className="media-resto">{t('app.top_profiles.group_average')}: <span>{formatNumber(catData.media_porcentaje_resto)}%</span></span>
              <span className="label">% de mensajes con preguntas</span>
            </div>
          </>
        );
        break;
      default:
        detalleEspecifico = <p>{t('app.errors.no_specific_details')}</p>;
    }

    return (
      <div className="categoria-detalle">
        <div className="usuario-destacado">
          <span className="nombre">{catData.nombre || 'Sin nombre'}</span>
          <span className="mensajes-totales">{catData.mensajes || 0} {t('app.top_profiles.total_messages')}</span>
        </div>
        <div className="estadisticas-container">
          {detalleEspecifico}
        </div>
      </div>
    );
  };

  // Si no se permite el renderizado, no mostrar nada
  if (!isRenderAllowed) return null;

  if (cargando) return (
    <div className="loading-container" style={{ textAlign: 'center', padding: '50px 0' }}>
      <div className="loader" style={{ 
        border: '5px solid #f3f3f3', 
        borderTop: '5px solid #3498db', 
        borderRadius: '50%', 
        width: '50px', 
        height: '50px', 
        animation: 'spin 1s linear infinite',
        margin: '0 auto 20px auto'
      }}></div>
      <p>{t('app.loading')}</p>
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
  if (error && !error.includes("No operation ID") && !error.includes("operation_id") && !error.includes("operationId")) {
    return <div className="error">{t('app.errors.generic')}: {error}</div>;
  }
  if (!datos || !datos.categorias || Object.keys(datos.categorias).length === 0) {
    return null;
  }

  return (
    <div className="analisis-top-container">
      <h2 className="titulo-principal">{t('app.top_profiles.title')}</h2>
      
      {/* Mostrar detalle por encima del grid cuando hay categoría seleccionada */}
      {categoriaSeleccionada && (
        <div className="detalle-container" style={{ marginBottom: '20px' }}>
          <div className="detalle-header">
            <div className="detalle-icono">{categoriaIconos[categoriaSeleccionada].icono}</div>
            <div className="detalle-info">
              <h3 className="detalle-titulo">{categoriaIconos[categoriaSeleccionada].titulo()}</h3>
              <p className="detalle-descripcion">{categoriaIconos[categoriaSeleccionada].descripcion()}</p>
            </div>
          </div>
          {renderDetalleCategoria(categoriaSeleccionada)}
        </div>
      )}
      
      {/* Usar la clase de grid específica */}
      <div className="categorias-grid-container">
        {Object.keys(categoriaIconos).map(categoria => (
          datos && datos.categorias && datos.categorias[categoria] && datos.categorias[categoria].nombre ? (
            <div 
              key={categoria}
              className={`categoria-card ${categoriaSeleccionada === categoria ? 'seleccionada' : ''}`}
              onClick={() => setCategoriaSeleccionada(categoria)}
            >
              <div className="categoria-icono">{categoriaIconos[categoria].icono}</div>
              <div className="categoria-info">
                <div className="categoria-titulo">{categoriaIconos[categoria].titulo()}</div>
                <div className="categoria-descripcion">{categoriaIconos[categoria].descripcion()}</div>
                <div className="categoria-usuario">{datos.categorias[categoria].nombre}</div>
              </div>
            </div>
          ) : null
        ))}
      </div>
      
      {/* Sección de participantes bajo el radar */}
      {datos && datos.usuarios && datos.categorias && (() => {
        // Recopilar todos los nombres que aparecen en alguna categoría
        const nombresEnCategorias = new Set();
        Object.values(datos.categorias).forEach(categoria => {
          if (categoria && categoria.nombre && categoria.nombre !== '--' && categoria.nombre !== 'Sin datos') {
            nombresEnCategorias.add(categoria.nombre);
          }
        });
        
        // Filtrar usuarios que no aparecen en categorías
        const participantesBajoRadar = Object.keys(datos.usuarios).filter(
          nombre => !nombresEnCategorias.has(nombre)
        );
        
        // Solo mostrar la sección si hay participantes bajo el radar
        if (participantesBajoRadar.length === 0) {
          return null;
        }
        
        return (
          <div className="bajo-radar-container" style={{ marginTop: '30px', textAlign: 'center' }}>
            <h3 style={{ fontWeight: 'bold', marginBottom: '15px' }}>
              Y volando bajo del radar tenemos a:
            </h3>
            <div className="bajo-radar-participantes" style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              justifyContent: 'center',
              gap: '10px' 
            }}>
              {participantesBajoRadar.map(nombre => (
                <div key={nombre} style={{
                  background: '#f2f2f2',
                  padding: '8px 15px',
                  borderRadius: '20px',
                  fontWeight: 'bold',
                  fontSize: '0.9rem'
                }}>
                  {nombre} ({datos.usuarios[nombre].mensajes} {t('app.top_profiles.total_messages')})
                </div>
              ))}
            </div>
            <p style={{ marginTop: '20px', fontStyle: 'italic', fontWeight: 'bold' }}>
              Próxima vez será
            </p>
          </div>
        );
      })()}
    </div>
  );
};

export default AnalisisTop;