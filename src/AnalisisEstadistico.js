import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  AreaChart,
  Area,
  LabelList
} from 'recharts';
import { useTranslation } from 'react-i18next';
import './styles/Analisis.css';
import './Analisis_primer_chat.css'; // Importar los estilos
// Importar el detector de formato
import { detectarFormatoArchivo } from './formatDetector.js';
// Importar utilidades de fecha
import { parseDateTime, esDateValido } from './dateUtils.js';
import { formatMinutesToHoursAndMinutes } from './utils/timeUtils';
import { useAuth } from './AuthContext';

// Implementación simplificada de analizarChat
const analizarChat = (contenido, formatoForzado = null) => {
  console.log("Analizando chat directamente desde Analisis_primer_chat...");
  
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
    
    // Analizar mensajes (versión simplificada para evitar dependencias)
    const mensajes = analizarMensajesSimplificado(lineas, formato);
    
    if (mensajes.length === 0) {
      return { error: "No se encontraron mensajes válidos", success: false };
    }
    
    // Estructura para estadísticas
    const stats = {
      mensajes_por_usuario: {},
      actividad_por_hora: {},
      actividad_por_dia_semana: {},
      mensajes_por_mes: {},
      mensajes_por_dia: {}, // Añadir esta estructura para contar mensajes por día
      formato_chat: formato,
      // Nuevas estructuras para los gráficos
      mensajes_por_mes_usuario: {},
      mensajes_por_mes_porcentaje: {},
      tiempo_respuesta_por_mes: {},
      tiempo_respuesta_promedio_mes: {}
    };
    
    // Días de la semana en español
    const diasSemana = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    
    // Variables para encontrar el primer mensaje
    let primerFecha = null;
    
    // Registrar el último mensaje por usuario para calcular tiempos de respuesta
    const ultimoMensajePorUsuario = {};
    
    // Ordenar mensajes por fecha para procesar cronológicamente
    mensajes.sort((a, b) => {
      return a.fechaObj - b.fechaObj;
    });
    
    // Calcular estadísticas básicas
    mensajes.forEach(msg => {
      // Extraer componentes de fecha
      const fecha = msg.fechaObj;
      const hora = fecha.getHours();
      const diaSemana = fecha.getDay();
      // Formato YYYY-MM para el mes
      const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      // Formato YYYY-MM-DD para el día
      const dia = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
      
      // Actualizar primer fecha si es necesario
      if (!primerFecha || fecha < primerFecha) {
        primerFecha = fecha;
      }
      
      // Mensajes por usuario
      stats.mensajes_por_usuario[msg.nombre] = (stats.mensajes_por_usuario[msg.nombre] || 0) + 1;
      
      // Actividad por hora
      stats.actividad_por_hora[hora] = (stats.actividad_por_hora[hora] || 0) + 1;
      
      // Actividad por día de la semana
      const diaSemanaStr = diasSemana[diaSemana];
      stats.actividad_por_dia_semana[diaSemanaStr] = (stats.actividad_por_dia_semana[diaSemanaStr] || 0) + 1;
      
      // Mensajes por día
      stats.mensajes_por_dia[dia] = (stats.mensajes_por_dia[dia] || 0) + 1;
      
      // Mensajes por mes y usuario (estructura para gráfico de tendencia de interés)
      if (!stats.mensajes_por_mes_usuario[mes]) {
        stats.mensajes_por_mes_usuario[mes] = {};
      }
      stats.mensajes_por_mes_usuario[mes][msg.nombre] = (stats.mensajes_por_mes_usuario[mes][msg.nombre] || 0) + 1;
      
      // Calcular tiempo de respuesta
      const nombreActual = msg.nombre;
      
      // Verificar si otros usuarios ya han enviado mensajes
      for (const otroUsuario in ultimoMensajePorUsuario) {
        if (otroUsuario !== nombreActual) {
          const ultimoMsg = ultimoMensajePorUsuario[otroUsuario];
          const ultimaFecha = ultimoMsg.fechaObj;
          
          // Calcular tiempo de respuesta en minutos
          const tiempoRespuesta = (fecha - ultimaFecha) / (1000 * 60);
          
          // Solo considerar respuestas en un período razonable (menos de 24 horas)
          if (tiempoRespuesta > 0 && tiempoRespuesta < 1440) {
            // Guardar tiempo de respuesta por mes y usuario
            if (!stats.tiempo_respuesta_por_mes[mes]) {
              stats.tiempo_respuesta_por_mes[mes] = {};
            }
            
            if (!stats.tiempo_respuesta_por_mes[mes][nombreActual]) {
              stats.tiempo_respuesta_por_mes[mes][nombreActual] = [];
            }
            
            stats.tiempo_respuesta_por_mes[mes][nombreActual].push(tiempoRespuesta);
          }
        }
      }
      
      // Actualizar el último mensaje de este usuario
      ultimoMensajePorUsuario[nombreActual] = msg;
    });
    
    // Calcular tiempo de respuesta promedio por mes
    stats.tiempo_respuesta_promedio_mes = {};
    for (const mes in stats.tiempo_respuesta_por_mes) {
      stats.tiempo_respuesta_promedio_mes[mes] = {};
      for (const usuario in stats.tiempo_respuesta_por_mes[mes]) {
        const tiempos = stats.tiempo_respuesta_por_mes[mes][usuario];
        if (tiempos && tiempos.length > 0) {
          // Filtrar tiempos extremos (más de 24 horas)
          const tiemposFiltrados = tiempos.filter(t => t < 1440);
          if (tiemposFiltrados.length > 0) {
            const promedio = tiemposFiltrados.reduce((sum, t) => sum + t, 0) / tiemposFiltrados.length;
            stats.tiempo_respuesta_promedio_mes[mes][usuario] = promedio;
          }
        }
      }
    }
    
    // Convertir mensajes por mes y usuario a formato para gráficos de porcentaje
    stats.mensajes_por_mes_porcentaje = {};
    for (const mes in stats.mensajes_por_mes_usuario) {
      const usuarios = stats.mensajes_por_mes_usuario[mes];
      const totalMensajesMes = Object.values(usuarios).reduce((sum, count) => sum + count, 0);
      
      stats.mensajes_por_mes_porcentaje[mes] = {
        total: totalMensajesMes,
        usuarios: {}
      };
      
      for (const usuario in usuarios) {
        const cantidadMensajes = usuarios[usuario];
        const porcentaje = (cantidadMensajes / totalMensajesMes) * 100;
        
        stats.mensajes_por_mes_porcentaje[mes].usuarios[usuario] = {
          mensajes: cantidadMensajes,
          porcentaje: porcentaje
        };
      }
    }
    
    // Encontrar máximos para el resumen
    const diaMasActivo = Object.entries(stats.actividad_por_dia_semana)
      .reduce((max, [dia, count]) => count > max[1] ? [dia, count] : max, ["", 0]);
    
    const horaMasActiva = Object.entries(stats.actividad_por_hora)
      .reduce((max, [hora, count]) => count > max[1] ? [hora, count] : max, ["", 0]);
    
    const usuarioMasActivo = Object.entries(stats.mensajes_por_usuario)
      .reduce((max, [nombre, count]) => count > max[1] ? [nombre, count] : max, ["", 0]);
    
    // Calcular promedio de mensajes diarios
    const diasConActividad = Object.keys(stats.mensajes_por_dia).length;
    const promedioMensajesDiarios = diasConActividad > 0 ? mensajes.length / diasConActividad : 0;
    
    // Añadir información del primer mensaje
    stats.primer_mensaje = {
      fecha: primerFecha ? `${primerFecha.getDate()}/${primerFecha.getMonth() + 1}/${primerFecha.getFullYear().toString().substr(2, 2)}` : "No disponible",
      fecha_completa: primerFecha ? primerFecha.toLocaleDateString() : "No disponible",
      timestamp: primerFecha ? primerFecha.getTime() / 1000 : 0
    };
    
    // Añadir resumen
    stats.resumen = {
      total_mensajes: mensajes.length,
      fecha_inicio: stats.primer_mensaje.fecha,
      promedio_mensajes_diarios: promedioMensajesDiarios.toFixed(2), // Usar el valor calculado
      dia_mas_activo: {
        fecha: "N/A", // En el frontend no calculamos esto
        mensajes: 0
      },
      hora_mas_activa: {
        hora: horaMasActiva && horaMasActiva[0] ? horaMasActiva[0] : "0",
        mensajes: horaMasActiva && horaMasActiva[1] ? horaMasActiva[1] : 0
      },
      dia_semana_mas_activo: {
        dia: diaMasActivo && diaMasActivo[0] ? diaMasActivo[0] : "Lunes",
        mensajes: diaMasActivo && diaMasActivo[1] ? diaMasActivo[1] : 0
      },
      usuario_mas_activo: {
        nombre: usuarioMasActivo && usuarioMasActivo[0] ? usuarioMasActivo[0] : "N/A",
        mensajes: usuarioMasActivo && usuarioMasActivo[1] ? usuarioMasActivo[1] : 0
      }
    };
    
    // Añadir estadísticas globales
    stats.total_messages = mensajes.length;
    stats.active_participants = Object.keys(stats.mensajes_por_usuario).length;
    stats.chat_format = formato;
    stats.success = true;
    
    return stats;
  } catch (error) {
    console.error("Error durante el análisis:", error);
    return {
      error: `Error durante el análisis: ${error.message}`,
      success: false
    };
  }
};

// Función simplificada para extraer mensajes
const analizarMensajesSimplificado = (lineas, formato) => {
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

// Colores para los gráficos - Nueva paleta moderna
const COLORS = [
  '#25D366', // Primary green (WhatsApp green)
  '#8B5CF6', // Accent purple  
  '#E91E63', // Accent pink
  '#FF6B35', // Accent orange
  '#128C7E', // Primary green dark
  '#7C3AED', // Purple variant
  '#F472B6', // Pink variant
  '#FB923C', // Orange variant
  '#059669', // Green variant
  '#8B5A2B'  // Brown accent
];

// Función para formatear fechas
const formatearFecha = (fecha, t) => {
  if (!fecha) return 'N/A';
  
  const partes = fecha.split('/');
  if (partes.length !== 3) return fecha;
  
  const [dia, mes, anio] = partes;
  const meses = [
    t('date.months.january'),
    t('date.months.february'),
    t('date.months.march'),
    t('date.months.april'),
    t('date.months.may'),
    t('date.months.june'),
    t('date.months.july'),
    t('date.months.august'),
    t('date.months.september'),
    t('date.months.october'),
    t('date.months.november'),
    t('date.months.december')
  ];
  
  // Obtener el formato de la traducción y reemplazar los valores
  const formato = t('date.format');
  
  // Reemplazar los marcadores de posición en el formato
  let fechaFormateada = formato
    .replace('d', dia)
    .replace('MMMM', meses[parseInt(mes) - 1])
    .replace('yy', anio);
  
  return fechaFormateada;
};

// Función para formatear nombres de meses
const formatearMes = (fechaMes, t) => {
  if (!fechaMes) return 'N/A';
  
  const [anio, mes] = fechaMes.split('-');
  const meses = [
    t('date.months.january'),
    t('date.months.february'),
    t('date.months.march'),
    t('date.months.april'),
    t('date.months.may'),
    t('date.months.june'),
    t('date.months.july'),
    t('date.months.august'),
    t('date.months.september'),
    t('date.months.october'),
    t('date.months.november'),
    t('date.months.december')
  ];
  
  return `${meses[parseInt(mes) - 1]} ${anio}`;
};

// Función para analizar el patrón horario de los mensajes
const obtenerPatronHorario = (datosHora) => {
  if (!datosHora || datosHora.length === 0) return null;
  
  // Contar mensajes por franja horaria
  let mensajesMañana = 0; // 0-11
  let mensajesTarde = 0;  // 12-19
  let mensajesNoche = 0;  // 20-23
  let totalMensajes = 0;
  
  datosHora.forEach(dato => {
    const hora = dato.hora;
    const mensajes = dato.mensajes || 0;
    totalMensajes += mensajes;
    
    if (hora >= 0 && hora < 12) {
      mensajesMañana += mensajes;
    } else if (hora >= 12 && hora < 20) {
      mensajesTarde += mensajes;
    } else {
      mensajesNoche += mensajes;
    }
  });
  
  // Calcular porcentajes
  const porcentajeMañana = totalMensajes > 0 ? (mensajesMañana / totalMensajes) * 100 : 0;
  const porcentajeTarde = totalMensajes > 0 ? (mensajesTarde / totalMensajes) * 100 : 0;
  const porcentajeNoche = totalMensajes > 0 ? (mensajesNoche / totalMensajes) * 100 : 0;
  
  // Determinar el patrón predominante
  if (porcentajeMañana > porcentajeTarde && porcentajeMañana > porcentajeNoche) {
    return {
      tipo: 'madrugadores',
      icono: '🌞',
      porcentaje: porcentajeMañana.toFixed(1)
    };
  } else if (porcentajeNoche > porcentajeMañana && porcentajeNoche > porcentajeTarde) {
    return {
      tipo: 'nocturnos',
      icono: '🌙',
      porcentaje: porcentajeNoche.toFixed(1)
    };
  } else {
    return {
      tipo: 'diurnos',
      icono: '⏱️',
      porcentaje: porcentajeTarde.toFixed(1)
    };
  }
};

const AnalisisEstadistico = ({ operationId, chatData }) => {
  const { user, isAuthLoading } = useAuth(); // Añadir isAuthLoading para verificar el estado de carga
  const { t, i18n } = useTranslation();
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);  
  const [error, setError] = useState(null);  
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);  
  
  // Memoizar la función obtenerDiasSemana para evitar recreaciones en cada renderizado  
  const obtenerDiasSemana = useCallback(() => {
    return [
      t('weekdays.monday'),
      t('weekdays.tuesday'),
      t('weekdays.wednesday'),
      t('weekdays.thursday'),
      t('weekdays.friday'),
      t('weekdays.saturday'),
      t('weekdays.sunday')
    ];
  }, [t]);

  // Obtener una lista de usuarios únicos para las leyendas
  const obtenerUsuariosUnicos = useCallback(() => {
    if (!datos) return [];
    
    // Crear un mapa para contar mensajes totales por usuario
    const mensajesPorUsuario = new Map();
    
    // Contar mensajes de tiempo_respuesta_promedio_mes
    if (datos.tiempo_respuesta_promedio_mes) {
      Object.values(datos.tiempo_respuesta_promedio_mes).forEach(usuariosDatos => {
        Object.keys(usuariosDatos).forEach(usuario => {
          mensajesPorUsuario.set(usuario, (mensajesPorUsuario.get(usuario) || 0) + 1);
        });
      });
    }
    
    // Contar mensajes de mensajes_por_mes_porcentaje
    if (datos.mensajes_por_mes_porcentaje) {
      Object.values(datos.mensajes_por_mes_porcentaje).forEach(datosMes => {
        if (datosMes.usuarios) {
          Object.entries(datosMes.usuarios).forEach(([usuario, datos]) => {
            mensajesPorUsuario.set(usuario, (mensajesPorUsuario.get(usuario) || 0) + datos.mensajes);
          });
        }
      });
    }
    
    // Si no hay datos en los anteriores, usar mensajes_por_usuario
    if (mensajesPorUsuario.size === 0 && datos.mensajes_por_usuario) {
      Object.entries(datos.mensajes_por_usuario).forEach(([usuario, mensajes]) => {
        mensajesPorUsuario.set(usuario, mensajes);
      });
    }
    
    // Convertir a array y ordenar por número de mensajes (descendente)
    return Array.from(mensajesPorUsuario.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([usuario]) => usuario)
      .slice(0, 5); // Tomar los 5 usuarios más activos
  }, [datos]);

  // Función para acortar nombres en dispositivos móviles
  const acortarNombre = useCallback((nombre) => {
    // Si no hay nombre, devolver vacío
    if (!nombre) return '';
    
    // En dispositivos móviles, acortar nombres largos
    if (windowWidth <= 480) {
      if (nombre.length > 10) {
        // Para nombres compuestos, intentar mantener el primer nombre
        const partes = nombre.split(' ');
        if (partes.length > 1) {
          // Solo mantener la primera parte y la inicial de la segunda
          return `${partes[0]} ${partes[1].charAt(0)}.`;
        }
        // Para nombres simples, acortar
        return nombre.substring(0, 8) + '...';
      }
    } else if (windowWidth <= 768) {
      // Para tablets, acortar solo nombres muy largos
      if (nombre.length > 15) {
        const partes = nombre.split(' ');
        if (partes.length > 1) {
          // Mantener primer nombre y inicial del apellido
          return `${partes[0]} ${partes[1].charAt(0)}.`;
        }
        return nombre.substring(0, 12) + '...';
      }
    }
    
    // En pantallas grandes, mostrar nombre completo
    return nombre;
  }, [windowWidth]);

  // Preparar datos para el gráfico de tiempo de respuesta por mes
  const prepararDatosTiempoRespuesta = useCallback(() => {
    try {
      if (!datos) {
        return [];
      }
      
      if (!datos.tiempo_respuesta_promedio_mes) {
        return [];
      }
      
      const tiempoRespuesta = datos.tiempo_respuesta_promedio_mes;
      if (Object.keys(tiempoRespuesta).length === 0) {
        return [];
      }
      
      // Ordenar meses cronológicamente
      const mesesOrdenados = Object.keys(tiempoRespuesta).sort();
      
      // Preparar datos para el gráfico
      const datosGrafico = mesesOrdenados.map(mes => {
        const usuarios = tiempoRespuesta[mes] || {};
        const resultado = {
          mes,
          mesFormateado: formatearMes(mes, t)
        };
        
        // Agregar datos de cada usuario
        Object.entries(usuarios).forEach(([usuario, tiempo]) => {
          if (tiempo !== undefined && !isNaN(tiempo)) {
            resultado[usuario] = Math.round(tiempo * 10) / 10; // Redondear a 1 decimal
          }
        });
        
        return resultado;
      });
      
      // Verificar si tenemos datos de usuario en cada punto
      if (datosGrafico.length > 0) {
        const primerMes = datosGrafico[0];
        const usuarios = Object.keys(primerMes).filter(k => !['mes', 'mesFormateado'].includes(k));
        if (usuarios.length === 0) {
          return [];
        }
      }
      
      return datosGrafico;
    } catch (error) {
      console.error("Error al preparar datos de tiempo de respuesta:", error);
      return [];
    }
  }, [datos, t]);

  // Preparar datos para el gráfico de mensajes por día de la semana
  const prepararDatosDiaSemana = useCallback(() => {
    if (!datos || !datos.actividad_por_dia_semana) return [];
    
    // Obtener los días de la semana traducidos
    const diasSemana = obtenerDiasSemana();
    
    // Asegurarnos de que todos los días de la semana estén representados
    // Usamos los nombres en español del backend como claves, pero mostramos los nombres traducidos
    const diasBackend = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
    
    const datosCompletos = diasBackend.map((diaBackend, index) => ({
      nombreBackend: diaBackend, // Nombre original para acceder a los datos
      nombre: diasSemana[index], // Nombre traducido para mostrar
      mensajes: datos.actividad_por_dia_semana[diaBackend] || 0
    }));
    
    return datosCompletos;
  }, [datos, obtenerDiasSemana]);

  // Preparar datos para el gráfico de actividad por hora
  const prepararDatosHora = useCallback(() => {
    if (!datos || !datos.actividad_por_hora) return [];
    
    // Crear un array con todas las horas (0-23)
    const datosHoras = [];
    for (let i = 0; i < 24; i++) {
      datosHoras.push({
        hora: i,
        mensajes: datos.actividad_por_hora[i] || 0,
        horaFormateada: `${i}:00`
      });
    }
    
    return datosHoras;
  }, [datos]);

  // Preparar datos para el gráfico de mensajes por usuario
  const prepararDatosUsuarios = useCallback(() => {
    if (!datos || !datos.mensajes_por_usuario) return [];
    
    // Convertir el objeto a un array y ordenar por número de mensajes (descendente)
    return Object.entries(datos.mensajes_por_usuario)
      .map(([nombre, mensajes]) => ({ nombre, mensajes }))
      .sort((a, b) => b.mensajes - a.mensajes)
      .slice(0, 5); // Tomar solo los 5 usuarios más activos
  }, [datos]);

  // Preparar datos para el gráfico de mensajes por mes y usuario (porcentaje)
  const prepararDatosMensajesPorMes = useCallback(() => {
    if (!datos || !datos.mensajes_por_mes_porcentaje) return [];
    
    // Obtener los 5 usuarios más activos en total
    const usuariosMasActivos = obtenerUsuariosUnicos();
    
    // Ordenar meses cronológicamente
    const mesesOrdenados = Object.keys(datos.mensajes_por_mes_porcentaje).sort();
    
    // Preparar datos para el gráfico
    return mesesOrdenados.map(mes => {
      const datosMes = datos.mensajes_por_mes_porcentaje[mes];
      const datosUsuarios = datosMes.usuarios || {};
      
      // Crear objeto base con el mes
      const resultado = {
        mes,
        mesFormateado: formatearMes(mes, t),
        total: datosMes.total
      };
      
      // Agregar datos de los 5 usuarios más activos en total
      usuariosMasActivos.forEach(usuario => {
        if (datosUsuarios[usuario]) {
          resultado[usuario] = datosUsuarios[usuario].porcentaje / 100;
        } else {
          resultado[usuario] = 0;
        }
      });

      // Calcular el porcentaje de "Otros" sumando todos los usuarios que no están en el top 5
      let porcentajeOtros = 0;
      Object.entries(datosUsuarios).forEach(([usuario, datos]) => {
        if (!usuariosMasActivos.includes(usuario)) {
          porcentajeOtros += datos.porcentaje / 100;
        }
      });
      
      // Agregar "Otros" si hay algún porcentaje
      if (porcentajeOtros > 0) {
        resultado['Otros'] = porcentajeOtros;
      }
      
      return resultado;
    });
  }, [datos, obtenerUsuariosUnicos, t]);

  // Analizar tendencia de tiempos de respuesta
  const analizarTendenciaTiempoRespuesta = useCallback(() => {
    try {
      const datosGrafico = prepararDatosTiempoRespuesta();
      
      if (!datosGrafico || datosGrafico.length < 3) {
        return null;
      }
      
      // Obtener los usuarios principales que aparecen en la gráfica
      const usuariosPrincipales = obtenerUsuariosUnicos();
      
      if (!usuariosPrincipales || usuariosPrincipales.length === 0) {
        return null;
      }
      
      // Para cada usuario principal, analizar tendencias sostenidas durante múltiples meses
      const tendencias = [];
      
      usuariosPrincipales.forEach(usuario => {
        // Obtener los meses con datos para este usuario
        let mesesConDatos = [];
        
        for (let i = 0; i < datosGrafico.length; i++) {
          const dato = datosGrafico[i];
          if (dato[usuario] !== undefined) {
            mesesConDatos.push({
              mes: dato.mes,
              mesFormateado: dato.mesFormateado,
              tiempo: dato[usuario],
              indice: i
            });
          }
        }
        
        // Necesitamos al menos 3 meses con datos para este usuario
        if (mesesConDatos.length >= 3) {
          // Ordenar por índice para asegurar orden cronológico
          mesesConDatos.sort((a, b) => a.indice - b.indice);
          
          // Analizar diferentes ventanas de tiempo (mínimo 3 meses)
          for (let inicio = 0; inicio < mesesConDatos.length - 2; inicio++) {
            for (let fin = inicio + 2; fin < mesesConDatos.length; fin++) {
              // Obtener los datos del mes inicial y final
              const mesInicial = mesesConDatos[inicio];
              const mesFinal = mesesConDatos[fin];
              
              // Calcular la variación porcentual total
              const variacionPorcentual = ((mesFinal.tiempo - mesInicial.tiempo) / mesInicial.tiempo) * 100;
              
              // Verificar si la tendencia es consistente (siempre creciente o decreciente)
              let esConsistente = true;
              const esCreciente = variacionPorcentual > 0;
              
              // Verificar cada mes intermedio para confirmar la consistencia de la tendencia
              for (let i = inicio + 1; i <= fin; i++) {
                if (i === inicio) continue; // Saltar el primer mes
                
                const mesPrevio = mesesConDatos[i-1];
                const mesActual = mesesConDatos[i];
                
                const cambioMensual = mesActual.tiempo - mesPrevio.tiempo;
                
                // Si la tendencia general es creciente, cada cambio mensual debería ser >= 0
                // Si la tendencia general es decreciente, cada cambio mensual debería ser <= 0
                // Permitimos pequeñas fluctuaciones (1% del valor)
                const umbralTolerancia = mesPrevio.tiempo * 0.01;
                if ((esCreciente && cambioMensual < -umbralTolerancia) || 
                    (!esCreciente && cambioMensual > umbralTolerancia)) {
                  esConsistente = false;
                  break;
                }
              }
              
              // Solo registrar tendencias significativas (>5%) y consistentes
              if (Math.abs(variacionPorcentual) >= 5 && esConsistente) {
                tendencias.push({
                  usuario,
                  variacionPorcentual,
                  mesesAnalizados: [mesInicial.mesFormateado, mesFinal.mesFormateado],
                  primerValor: mesInicial.tiempo,
                  ultimoValor: mesFinal.tiempo,
                  esIncremento: variacionPorcentual > 0,
                  duracionMeses: fin - inicio + 1, // Número de meses en la tendencia
                  esReciente: fin === mesesConDatos.length - 1 // Si incluye el mes más reciente
                });
              }
            }
          }
        }
      });
      
      if (tendencias.length === 0) {
        return null;
      }
      
      // Ordenar tendencias según criterios
      const maxDuracion = Math.max(...tendencias.map(t => t.duracionMeses));
      const tendenciasLargas = tendencias.filter(t => t.duracionMeses >= maxDuracion - 1);
      const tendenciasLargasRecientes = tendenciasLargas.filter(t => t.esReciente);
      
      if (tendenciasLargasRecientes.length > 0) {
        tendenciasLargasRecientes.sort((a, b) => Math.abs(b.variacionPorcentual) - Math.abs(a.variacionPorcentual));
        return tendenciasLargasRecientes[0];
      }
      
      if (tendenciasLargas.length > 0) {
        tendenciasLargas.sort((a, b) => Math.abs(b.variacionPorcentual) - Math.abs(a.variacionPorcentual));
        return tendenciasLargas[0];
      }
      
      tendencias.sort((a, b) => {
        if (b.duracionMeses !== a.duracionMeses) {
          return b.duracionMeses - a.duracionMeses;
        }
        return Math.abs(b.variacionPorcentual) - Math.abs(a.variacionPorcentual);
      });
      
      return tendencias[0];
      
    } catch (error) {
      console.error("Error al analizar tendencia de tiempo de respuesta:", error);
      return null;
    }
  }, [prepararDatosTiempoRespuesta, obtenerUsuariosUnicos]);

  // Analizar tendencia de frecuencia de mensajes por usuario
  const analizarTendenciaInteres = useCallback(() => {
    try {
      const datosGrafico = prepararDatosMensajesPorMes();
      
      if (!datosGrafico || datosGrafico.length < 3) {
        return null;
      }
      
      // Obtener usuarios disponibles (excluyendo propiedades especiales)
      const usuariosDisponibles = Object.keys(datosGrafico[0]).filter(
        key => !['mes', 'mesFormateado', 'total', 'Otros'].includes(key)
      );
      
      if (usuariosDisponibles.length === 0) {
        return null;
      }
      
      // Para cada usuario, analizar tendencias sostenidas durante múltiples meses
      const tendencias = [];
      
      usuariosDisponibles.forEach(usuario => {
        // Analizar diferentes ventanas de tiempo (mínimo 3 meses)
        for (let inicio = 0; inicio < datosGrafico.length - 2; inicio++) {
          for (let fin = inicio + 2; fin < datosGrafico.length; fin++) {
            // Obtener los datos del mes inicial y final
            const mesInicial = datosGrafico[inicio];
            const mesFinal = datosGrafico[fin];
            
            // Verificar que ambos meses tienen datos para este usuario
            if (mesInicial[usuario] !== undefined && mesFinal[usuario] !== undefined) {
              // Calcular la variación total en puntos porcentuales
              const variacionPuntosPorcentuales = (mesFinal[usuario] - mesInicial[usuario]) * 100;
              
              // Verificar si la tendencia es consistente (siempre creciente o decreciente)
              let esConsistente = true;
              const esCreciente = variacionPuntosPorcentuales > 0;
              
              // Verificar cada mes intermedio para confirmar la consistencia de la tendencia
              for (let i = inicio + 1; i < fin; i++) {
                const mesPrevio = datosGrafico[i-1];
                const mesActual = datosGrafico[i];
                
                if (mesPrevio[usuario] === undefined || mesActual[usuario] === undefined) {
                  esConsistente = false;
                  break;
                }
                
                const cambioMensual = mesActual[usuario] - mesPrevio[usuario];
                
                if ((esCreciente && cambioMensual < -0.01) || (!esCreciente && cambioMensual > 0.01)) {
                  esConsistente = false;
                  break;
                }
              }
              
              // Solo registrar tendencias significativas (>5 puntos porcentuales) y consistentes
              if (Math.abs(variacionPuntosPorcentuales) >= 5 && esConsistente) {
                tendencias.push({
                  usuario,
                  variacionPuntosPorcentuales,
                  mesInicial: mesInicial.mesFormateado,
                  mesFinal: mesFinal.mesFormateado,
                  valorInicial: mesInicial[usuario] * 100,
                  valorFinal: mesFinal[usuario] * 100,
                  esIncremento: variacionPuntosPorcentuales > 0,
                  duracionMeses: fin - inicio + 1,
                  esReciente: fin === datosGrafico.length - 1
                });
              }
            }
          }
        }
      });
      
      if (tendencias.length === 0) {
        return null;
      }
      
      // Ordenar tendencias
      const maxDuracion = Math.max(...tendencias.map(t => t.duracionMeses));
      const tendenciasLargas = tendencias.filter(t => t.duracionMeses >= maxDuracion - 1);
      const tendenciasLargasRecientes = tendenciasLargas.filter(t => t.esReciente);
      
      if (tendenciasLargasRecientes.length > 0) {
        tendenciasLargasRecientes.sort((a, b) => Math.abs(b.variacionPuntosPorcentuales) - Math.abs(a.variacionPuntosPorcentuales));
        return tendenciasLargasRecientes[0];
      }
      
      if (tendenciasLargas.length > 0) {
        tendenciasLargas.sort((a, b) => Math.abs(b.variacionPuntosPorcentuales) - Math.abs(a.variacionPuntosPorcentuales));
        return tendenciasLargas[0];
      }
      
      tendencias.sort((a, b) => {
        if (b.duracionMeses !== a.duracionMeses) {
          return b.duracionMeses - a.duracionMeses;
        }
        return Math.abs(b.variacionPuntosPorcentuales) - Math.abs(a.variacionPuntosPorcentuales);
      });
      
      return tendencias[0];
      
    } catch (error) {
      console.error("Error al analizar tendencia de interés:", error);
      return null;
    }
  }, [prepararDatosMensajesPorMes]);

  // Effect to handle window resize for responsive display
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate interval for X-axis labels based on screen width
  const getXAxisInterval = () => {
    if (windowWidth <= 480) return 3; // Mobile: every 3 hours
    if (windowWidth <= 768) return 2; // Tablet: every 2 hours
    return 1; // Desktop: every hour
  };

  // Utilizar useMemo para almacenar los resultados del análisis
  const datosAnalizados = useMemo(() => {
    if (!chatData) return null;
    
    console.log("Analizando datos del chat en el cliente (memoizado)");
    
    try {
      // Analizar los datos del chat utilizando nuestro analizador de cliente
      const resultadoAnalisis = analizarChat(chatData);
      console.log("Resultado del análisis en cliente:", resultadoAnalisis);
      return resultadoAnalisis;
    } catch (err) {
      console.error("Error analizando el chat:", err);
      return { 
        error: `${t('app.errors.analysis_error')}: ${err.message}`, 
        success: false 
      };
    }
  }, [chatData, t]);
  
  // Efecto para procesar los datos analizados
  useEffect(() => {
    if (!chatData) {
      setError(t('app.errors.no_data'));
      setCargando(false);
      return;
    }
    
    if (datosAnalizados) {
      if (datosAnalizados.success) {
        // Establecer los datos inmediatamente cuando estén disponibles
        setDatos(datosAnalizados);
        setError(null);
      } else {
        setError(datosAnalizados.error || t('app.errors.analysis_failed'));
      }
      // Marcar como no cargando inmediatamente después de procesar los datos
      setCargando(false);
    }
  }, [datosAnalizados, chatData, t]);

  // SEGURIDAD: Verificar autenticación antes de mostrar cualquier contenido
  if (isAuthLoading) {
    // Mostrar loading mientras se verifica la autenticación
    return (
      <div className="analisis-placeholder">
        <p>Verificando sesión...</p>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="analisis-placeholder">
        <p>{t('app.errors.login_required')}</p>
      </div>
    );
  }

  if (cargando && !datosAnalizados) {
    return (
      <div className="loading-container" style={{ textAlign: 'center', padding: '20px 0', backgroundColor: '#f0f8ff', borderRadius: '8px', margin: '15px 0' }}>
        <div className="loader" style={{ 
          border: '5px solid #f3f3f3', 
          borderTop: '5px solid #3498db', 
          borderRadius: '50%', 
          width: '50px', 
          height: '50px', 
          animation: 'spin 1s linear infinite',
          margin: '0 auto 15px auto'
        }}></div>
        <p style={{ fontWeight: 'bold', color: '#3498db' }}>{t('app.loading')}</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!datos || !datos.success) {
    // Si hay datos analizados pero aún no se han procesado, mostrar cargando
    if (datosAnalizados && datosAnalizados.success) {
      return (
        <div className="loading-container" style={{ textAlign: 'center', padding: '20px 0', backgroundColor: '#f0f8ff', borderRadius: '8px', margin: '15px 0' }}>
          <div className="loader" style={{ 
            border: '5px solid #f3f3f3', 
            borderTop: '5px solid #3498db', 
            borderRadius: '50%', 
            width: '50px', 
            height: '50px', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto 15px auto'
          }}></div>
          <p style={{ fontWeight: 'bold', color: '#3498db' }}>{t('app.loading')}</p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      );
    }
    return null;
  }

  // Ya no necesitamos estas variables porque la sección summary está en otro componente

  return (
    <div className="modern-analysis-container">
      {/* Charts Section - ANÁLISIS ESTADÍSTICO */}
      <section className="charts-section">
        <div className="charts-container">
          <span className="charts-badge">{t('analysis_summary.visual_analysis.badge')}</span>
          <h2 className="charts-title">Análisis Estadístico</h2>
          <p className="charts-description">{t('analysis_summary.visual_analysis.description')}</p>
          
          <div className="charts-grid">
            {/* Gráfico de actividad por día de la semana */}
            <div className="chart-card">
              <div className="chart-header">
                <h3>{t('app.primer_chat.activity_by_day')} ({t('messages')})</h3>
              </div>
              <div className="chart-content">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={prepararDatosDiaSemana()}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="nombre" 
                      angle={windowWidth <= 480 ? -45 : 0}
                      textAnchor={windowWidth <= 480 ? "end" : "middle"}
                      height={windowWidth <= 480 ? 60 : 30}
                    />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} ${t('messages')}`, t('messages')]} />
                    <Bar 
                      dataKey="mensajes" 
                      name={t('messages')} 
                      fill="#25D366"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Gráfico de actividad por hora del día */}
            <div className="chart-card">
              <div className="chart-header">
                <h3>{t('app.primer_chat.activity_by_hour')} ({t('messages')})</h3>
                
                {/* Mensaje de patrón horario */}
                {(() => {
                  const datosHora = prepararDatosHora();
                  const patronHorario = obtenerPatronHorario(datosHora);
                  
                  if (patronHorario) {
                    let mensaje = '';
                    
                    if (patronHorario.tipo === 'madrugadores') {
                      mensaje = t('app.primer_chat.morning_pattern', { 
                        percentage: patronHorario.porcentaje,
                        emoji: patronHorario.icono
                      }) || `${patronHorario.icono} Este es un grupo de madrugadores: el ${patronHorario.porcentaje}% de los mensajes se envían antes del mediodía.`;
                    } else if (patronHorario.tipo === 'nocturnos') {
                      mensaje = t('app.primer_chat.night_pattern', { 
                        percentage: patronHorario.porcentaje,
                        emoji: patronHorario.icono
                      }) || `${patronHorario.icono} Este es un grupo de nocturnos: el ${patronHorario.porcentaje}% de los mensajes se envían después de las 20:00h.`;
                    } else {
                      mensaje = t('app.primer_chat.afternoon_pattern', { 
                        percentage: patronHorario.porcentaje,
                        emoji: patronHorario.icono
                      }) || `${patronHorario.icono} Este es un grupo diurno: el ${patronHorario.porcentaje}% de los mensajes se envían entre las 12:00h y las 20:00h.`;
                    }
                    
                    return (
                      <div className="chart-insight">
                        <p>{mensaje}</p>
                      </div>
                    );
                  }
                  
                  return null;
                })()}
              </div>
              <div className="chart-content">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={prepararDatosHora()}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="horaFormateada" 
                      interval={getXAxisInterval()}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} ${t('messages')}`, t('messages')]} />
                    <Line 
                      type="monotone" 
                      dataKey="mensajes" 
                      name={t('messages')} 
                      stroke="#4285f4"
                      strokeWidth={2}
                      dot={{ stroke: '#4285f4', strokeWidth: 2, r: 4 }}
                      activeDot={{ stroke: '#4285f4', strokeWidth: 2, r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Gráfico de mensajes por usuario (top 5) */}
            <div className="chart-card">
              <div className="chart-header">
                <h3>{t('app.primer_chat.top_users')}</h3>
              </div>
              <div className="chart-content">
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={prepararDatosUsuarios()}
                      cx="50%"
                      cy="50%"
                      labelLine={windowWidth > 480}
                      outerRadius={windowWidth <= 480 ? 80 : 120}
                      fill="#8884d8"
                      dataKey="mensajes"
                      nameKey="nombre"
                      label={({ nombre, mensajes, percent }) => 
                        windowWidth <= 480 
                          ? `${(percent * 100).toFixed(0)}%`
                          : `${acortarNombre(nombre)}: ${mensajes} (${(percent * 100).toFixed(1)}%)`
                      }
                      labelStyle={{
                        fontSize: windowWidth <= 480 ? '14px' : '16px',
                        fontWeight: 'bold',
                        fill: '#333'
                      }}
                    >
                      {prepararDatosUsuarios().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name) => [`${value} ${t('messages')}`, acortarNombre(name)]}
                      contentStyle={{
                        fontSize: '16px',
                        fontWeight: 'bold'
                      }}
                    />
                    <Legend
                      layout={windowWidth <= 480 ? "vertical" : "horizontal"}
                      verticalAlign="bottom"
                      align="center"
                      wrapperStyle={{
                        fontSize: '18px', 
                        fontWeight: 'bold',
                        paddingTop: '20px'
                      }}
                      formatter={(value) => acortarNombre(value)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trends Section */}
      <section className="trends-section">
        <div className="trends-container">
          <span className="trends-badge">{t('analysis_summary.trends.badge')}</span>
          <h2 className="trends-title">{t('analysis_summary.trends.title')}</h2>
          <p className="trends-description">{t('analysis_summary.trends.description')}</p>
          
          <div className="trends-grid">
            {/* Gráfico de tiempo de respuesta */}
            <div className="trend-card">
              <div className="trend-header">
                <h3>{t('app.primer_chat.response_time_trend')}</h3>
                
                {/* Mostrar tendencia destacada si existe */}
                {(() => {
                  const tendencia = analizarTendenciaTiempoRespuesta();
                  
                  if (tendencia) {
                    const porcentaje = Math.abs(tendencia.variacionPorcentual).toFixed(0);
                    const nombreUsuario = tendencia.usuario;
                    const accion = tendencia.esIncremento ? t('app.primer_chat.increased') : t('app.primer_chat.decreased');
                    const icono = tendencia.esIncremento ? '⏱️' : '⚡';
                    
                    // Valores iniciales y finales redondeados a 1 decimal
                    const valorInicial = Math.round(tendencia.primerValor * 10) / 10;
                    const valorFinal = Math.round(tendencia.ultimoValor * 10) / 10;
                    
                    // Obtener el índice del usuario para usar el mismo color que en la gráfica
                    const usuariosActivos = obtenerUsuariosUnicos();
                    const usuarioIndex = usuariosActivos.indexOf(nombreUsuario);
                    const colorUsuario = usuarioIndex >= 0 ? COLORS[usuarioIndex % COLORS.length] : '#3498db';
                    
                    // Estilo personalizado para el borde con el color del usuario
                    const estiloPersonalizado = {
                      borderLeftColor: colorUsuario,
                      borderLeftWidth: '4px'
                    };
                    
                    // Texto que indica la duración de la tendencia
                    const duracionMeses = tendencia.duracionMeses;
                    const textoTendencia = duracionMeses > 3 
                      ? t('app.primer_chat.sustained_trend', { count: duracionMeses }) 
                      : '';
                    
                    return (
                      <div 
                        className={`trend-insight ${tendencia.esIncremento ? 'incremento' : 'decremento'}`}
                        style={estiloPersonalizado}
                      >
                        <div className="trend-insight-header">
                          <span className="trend-icon">{icono}</span>
                          <span className="trend-title-text">{t('app.primer_chat.trend_highlight')}</span>
                        </div>
                        <p className="trend-message">
                          <strong style={{ color: colorUsuario }}>{nombreUsuario}</strong>
                          {` ${accion} ${porcentaje}% ${t('app.primer_chat.response_time_trend_msg')} ${tendencia.mesesAnalizados[0]} ${t('app.primer_chat.to')} ${tendencia.mesesAnalizados[1]}`}
                          {textoTendencia && <span className="trend-duration"> ({textoTendencia})</span>}
                          {'.'}
                        </p>
                        <div className="trend-details">
                          <div className="trend-value">
                            <span className="trend-label">{tendencia.mesesAnalizados[0]}:</span>
                            <span className="trend-number">{formatMinutesToHoursAndMinutes(valorInicial)}</span>
                          </div>
                          <div className="trend-arrow">→</div>
                          <div className="trend-value">
                            <span className="trend-label">{tendencia.mesesAnalizados[1]}:</span>
                            <span className="trend-number" style={{ color: tendencia.esIncremento ? '#e74c3c' : '#2ecc71' }}>
                              {formatMinutesToHoursAndMinutes(valorFinal)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  
                  return null;
                })()}
              </div>
              
              <div className="trend-content">
                <ResponsiveContainer width="100%" height={450}>
                  <LineChart
                    data={prepararDatosTiempoRespuesta()}
                    margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="mesFormateado" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      domain={['auto', 'auto']}
                    />
                    <Tooltip 
                      formatter={(value, name) => [`${formatMinutesToHoursAndMinutes(value)}`, acortarNombre(name)]}
                      labelFormatter={(label) => `${t('app.primer_chat.response_time_trend')}: ${label}`}
                    />
                    <Legend 
                      layout="horizontal"
                      verticalAlign="bottom"
                      align="center"
                      wrapperStyle={{paddingTop: '20px', bottom: 0, width: '100%', fontSize: '16px', fontWeight: 'bold'}}
                      formatter={(value) => acortarNombre(value)}
                    />
                    {(() => {
                      // Verificar si hay datos
                      const datosGrafico = prepararDatosTiempoRespuesta();
                      if (!datosGrafico || datosGrafico.length === 0) {
                        return null;
                      }
                      
                      // Obtener los 5 usuarios más activos
                      const usuariosActivos = obtenerUsuariosUnicos();
                      
                      // Renderizar líneas solo para los usuarios más activos
                      return usuariosActivos.map((usuario, index) => (
                        <Line 
                          key={usuario}
                          type="monotone" 
                          dataKey={usuario} 
                          name={usuario} 
                          stroke={COLORS[index % COLORS.length]}
                          strokeWidth={3}
                          dot={{ stroke: COLORS[index % COLORS.length], strokeWidth: 2, r: 5 }}
                          activeDot={{ stroke: COLORS[index % COLORS.length], strokeWidth: 2, r: 7 }}
                          connectNulls
                        />
                      ));
                    })()}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gráfico de porcentaje de mensajes por usuario por mes */}
            <div className="trend-card">
              <div className="trend-header">
                <h3>{t('app.primer_chat.interest_trend')}</h3>
                
                {/* Mostrar tendencia destacada de interés si existe */}
                {(() => {
                  const tendencia = analizarTendenciaInteres();
                  
                  if (tendencia) {
                    const puntosPorcentuales = Math.abs(tendencia.variacionPuntosPorcentuales).toFixed(1);
                    const nombreUsuario = tendencia.usuario;
                    const accion = tendencia.esIncremento ? t('app.primer_chat.increased_msgs') : t('app.primer_chat.decreased_msgs');
                    const icono = tendencia.esIncremento ? '📈' : '📉';
                    
                    // Valores iniciales y finales redondeados a 1 decimal
                    const valorInicialInteres = Math.round(tendencia.valorInicial * 10) / 10;
                    const valorFinalInteres = Math.round(tendencia.valorFinal * 10) / 10;
                    
                    // Obtener el índice del usuario para usar el mismo color que en la gráfica
                    const usuariosActivos = obtenerUsuariosUnicos();
                    const usuarioIndex = usuariosActivos.indexOf(nombreUsuario);
                    const colorUsuario = usuarioIndex >= 0 ? COLORS[usuarioIndex % COLORS.length] : '#3498db';
                    
                    // Estilo personalizado para el borde con el color del usuario
                    const estiloPersonalizado = {
                      borderLeftColor: colorUsuario,
                      borderLeftWidth: '4px'
                    };
                    
                    // Texto que indica la duración de la tendencia
                    const duracionMeses = tendencia.duracionMeses;
                    const textoTendencia = duracionMeses > 3 
                      ? t('app.primer_chat.sustained_trend', { count: duracionMeses }) 
                      : '';
                    
                    return (
                      <div 
                        className={`trend-insight ${tendencia.esIncremento ? 'incremento' : 'decremento'}`}
                        style={estiloPersonalizado}
                      >
                        <div className="trend-insight-header">
                          <span className="trend-icon">{icono}</span>
                          <span className="trend-title-text">{t('app.primer_chat.trend_highlight')}</span>
                        </div>
                        <p className="trend-message">
                          <strong style={{ color: colorUsuario }}>{nombreUsuario}</strong>
                          {` ${accion} ${puntosPorcentuales} ${t('app.primer_chat.percentage_points')} ${t('app.primer_chat.from')} ${tendencia.mesInicial} ${t('app.primer_chat.to')} ${tendencia.mesFinal}`}
                          {textoTendencia && <span className="trend-duration"> ({textoTendencia})</span>}
                          {'.'}
                        </p>
                        <div className="trend-details">
                          <div className="trend-value">
                            <span className="trend-label">{tendencia.mesInicial}:</span>
                            <span className="trend-number">{valorInicialInteres}%</span>
                          </div>
                          <div className="trend-arrow">→</div>
                          <div className="trend-value">
                            <span className="trend-label">{tendencia.mesFinal}:</span>
                            <span className="trend-number" style={{ color: tendencia.esIncremento ? '#2ecc71' : '#e74c3c' }}>
                              {valorFinalInteres}%
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  
                  return null;
                })()}
              </div>
              
              <div className="trend-content">
                {(() => {
                  const datosGrafico = prepararDatosMensajesPorMes();
                  return (
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart
                        data={datosGrafico}
                        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                        stackOffset="expand"
                        layout="horizontal"
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="mesFormateado" 
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis 
                          tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                          domain={[0, 1]}
                        />
                        <Tooltip 
                          formatter={(value, name) => [`${(value * 100).toFixed(1)}%`, acortarNombre(name)]}
                          labelFormatter={(label) => `${t('app.primer_chat.interest_trend')}: ${label}`}
                        />
                        <Legend 
                          layout="horizontal"
                          verticalAlign="bottom" 
                          align="center"
                          wrapperStyle={{paddingTop: '20px', fontSize: '16px', fontWeight: 'bold'}}
                          formatter={(value) => acortarNombre(value)}
                        />
                        {(() => {
                          // Si no hay datos, mostrar mensaje
                          if (datosGrafico.length === 0) {
                            return null;
                          }
                          
                          // Extraer los nombres de usuario del primer elemento (excluyendo props especiales)
                          const usuariosDisponibles = Object.keys(datosGrafico[0]).filter(
                            key => !['mes', 'mesFormateado', 'total'].includes(key)
                          );
                          
                          // Renderizar barras para cada usuario
                          return usuariosDisponibles.map((usuario, index) => (
                            <Bar 
                              key={`bar-${usuario}`}
                              dataKey={usuario} 
                              name={usuario}
                              stackId="a"
                              fill={COLORS[index % COLORS.length]}
                              isAnimationActive={true}
                            >
                              <LabelList 
                                key={`label-${usuario}`}
                                dataKey={usuario} 
                                position="center" 
                                formatter={(value) => (value >= 0.1 ? `${Math.round(value * 100)}%` : '')}
                                style={{ fill: 'white', fontSize: 10, fontWeight: 'bold' }}
                              />
                            </Bar>
                          ));
                        })()}
                      </BarChart>
                    </ResponsiveContainer>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AnalisisEstadistico;
