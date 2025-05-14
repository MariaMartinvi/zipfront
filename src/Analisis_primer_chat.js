import React, { useState, useEffect } from 'react';
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

// Colores para los gráficos
const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', 
  '#82CA9D', '#F44236', '#E91E63', '#9C27B0', '#673AB7'
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

const AnalisisPrimerChat = ({ operationId, chatData }) => {
  const { t, i18n } = useTranslation();
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Obtenemos los días de la semana según el idioma actual
  const obtenerDiasSemana = () => {
    return [
      t('weekdays.monday'),
      t('weekdays.tuesday'),
      t('weekdays.wednesday'),
      t('weekdays.thursday'),
      t('weekdays.friday'),
      t('weekdays.saturday'),
      t('weekdays.sunday')
    ];
  };

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

  useEffect(() => {
    // Verificar si tenemos datos del chat para analizar directamente en el cliente
    if (chatData) {
      console.log("Analizando datos del chat en el cliente");
      setCargando(true);
      
      try {
        // Analizar los datos del chat utilizando nuestro analizador de cliente
        const resultadoAnalisis = analizarChat(chatData);
        console.log("Resultado del análisis en cliente:", resultadoAnalisis);
        
        // Establecer los datos analizados
        if (resultadoAnalisis && resultadoAnalisis.success) {
          setDatos(resultadoAnalisis);
          setError(null);
        } else {
          setError(resultadoAnalisis.error || t('app.errors.analysis_failed'));
        }
      } catch (err) {
        console.error("Error analizando el chat:", err);
        setError(`${t('app.errors.analysis_error')}: ${err.message}`);
      } finally {
        setCargando(false);
      }
      return;
    }
    
    // Si no hay datos directos para analizar, mostrar un mensaje de error
    setError(t('app.errors.no_data'));
    setCargando(false);
    
  }, [chatData, t]);

  // Preparar datos para el gráfico de mensajes por día de la semana
  const prepararDatosDiaSemana = () => {
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
  };

  // Preparar datos para el gráfico de actividad por hora
  const prepararDatosHora = () => {
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
  };

  // Preparar datos para el gráfico de mensajes por usuario
  const prepararDatosUsuarios = () => {
    if (!datos || !datos.mensajes_por_usuario) return [];
    
    // Convertir el objeto a un array y ordenar por número de mensajes (descendente)
    return Object.entries(datos.mensajes_por_usuario)
      .map(([nombre, mensajes]) => ({ nombre, mensajes }))
      .sort((a, b) => b.mensajes - a.mensajes)
      .slice(0, 5); // Tomar solo los 5 usuarios más activos
  };

  // Función para acortar nombres en dispositivos móviles
  const acortarNombre = (nombre) => {
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
  };

  // Preparar datos para el gráfico de tiempo de respuesta por mes
  const prepararDatosTiempoRespuesta = () => {
    try {
      if (!datos) {
        console.log("No hay datos disponibles");
        return [];
      }
      
      if (!datos.tiempo_respuesta_promedio_mes) {
        console.log("No hay datos de tiempo_respuesta_promedio_mes");
        return [];
      }
      
      const tiempoRespuesta = datos.tiempo_respuesta_promedio_mes;
      if (Object.keys(tiempoRespuesta).length === 0) {
        console.log("tiempo_respuesta_promedio_mes está vacío");
        return [];
      }
      
      console.log("Preparando datos de tiempo de respuesta:", tiempoRespuesta);
      
      // Ordenar meses cronológicamente
      const mesesOrdenados = Object.keys(tiempoRespuesta).sort();
      
      console.log("Meses ordenados:", mesesOrdenados);
      
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
      
      console.log("Datos preparados para el gráfico:", datosGrafico);
      
      // Verificar si tenemos datos de usuario en cada punto
      if (datosGrafico.length > 0) {
        const primerMes = datosGrafico[0];
        const usuarios = Object.keys(primerMes).filter(k => !['mes', 'mesFormateado'].includes(k));
        if (usuarios.length === 0) {
          console.log("No se encontraron usuarios en los datos");
          return [];
        }
      }
      
      return datosGrafico;
    } catch (error) {
      console.error("Error al preparar datos de tiempo de respuesta:", error);
      return [];
    }
  };

  // Preparar datos para el gráfico de mensajes por mes y usuario (porcentaje)
  const prepararDatosMensajesPorMes = () => {
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
  };

  // Obtener una lista de usuarios únicos para las leyendas
  const obtenerUsuariosUnicos = () => {
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
    const usuariosOrdenados = Array.from(mensajesPorUsuario.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([usuario]) => usuario)
      .slice(0, 5); // Tomar los 5 usuarios más activos
    
    console.log("Top 5 usuarios más activos:", usuariosOrdenados);
    
    return usuariosOrdenados;
  };

  // Renderizar el contenido principal
  if (cargando) {
    return (
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
  }
  
  // Mostrar error solo si no está relacionado con operationId
  if (error && !error.includes("No operation ID") && !error.includes("operation_id") && !error.includes("operationId")) {
    return <div className="error">{error}</div>;
  }
  
  if (!datos || !datos.success) {
    // Eliminar el mensaje de error "no_data"
    return null;
  }

  // Extraer datos del objeto, con valores por defecto en caso de que falten
  const resumen = datos.resumen || {
    total_mensajes: 0,
    fecha_inicio: 'No disponible',
    promedio_mensajes_diarios: 0,
    dia_mas_activo: { fecha: 'N/A', mensajes: 0 },
    hora_mas_activa: { hora: 'N/A', mensajes: 0 },
    dia_semana_mas_activo: { dia: 'N/A', mensajes: 0 },
    usuario_mas_activo: { nombre: 'N/A', mensajes: 0 }
  };

  const primer_mensaje = datos.primer_mensaje || {
    fecha: 'No disponible',
    fecha_completa: 'No disponible',
    timestamp: 0
  };

  return (
    <div className="analisis-primer-chat-container">
      <h3>{t('app.primer_chat.title')}</h3>
      
      {/* Tarjeta de resumen principal */}
      <div className="resumen-card">
                
        <div className="resumen-content">
          <div className="stat-highlight">
            <div className="stat-value">{formatearFecha(primer_mensaje.fecha, t)}</div>
            <div className="stat-label">{t('app.primer_chat.date_start')}</div>
          </div>
          
          <div className="stats-row">
            <div className="stat-item">
              <div className="stat-value">{resumen.total_mensajes.toLocaleString()}</div>
              <div className="stat-label">{t('app.primer_chat.total_messages')}</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{resumen.promedio_mensajes_diarios}</div>
              <div className="stat-label">{t('app.primer_chat.messages_per_day')}</div>
            </div>
          </div>
          
          <div className="highlight-box">
            <div className="highlight-title">
              <span className="highlight-icon">👑</span>
              <span>{t('app.primer_chat.most_active_user')}</span>
            </div>
            <div className="highlight-content">
              <div className="highlight-value">{resumen.usuario_mas_activo.nombre}</div>
              <div className="highlight-detail">{t('app.primer_chat.with_messages', { count: resumen.usuario_mas_activo.mensajes.toLocaleString() })}</div>
            </div>
          </div>
          
          <div className="activity-highlights">
            <div className="activity-item">
              <div className="activity-label">{t('app.primer_chat.most_active_day')}</div>
              <div className="activity-value">
                {resumen.dia_semana_mas_activo.dia === "Lunes" ? t('weekdays.monday') :
                 resumen.dia_semana_mas_activo.dia === "Martes" ? t('weekdays.tuesday') :
                 resumen.dia_semana_mas_activo.dia === "Miércoles" ? t('weekdays.wednesday') :
                 resumen.dia_semana_mas_activo.dia === "Jueves" ? t('weekdays.thursday') :
                 resumen.dia_semana_mas_activo.dia === "Viernes" ? t('weekdays.friday') :
                 resumen.dia_semana_mas_activo.dia === "Sábado" ? t('weekdays.saturday') :
                 resumen.dia_semana_mas_activo.dia === "Domingo" ? t('weekdays.sunday') :
                 resumen.dia_semana_mas_activo.dia}
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-label">{t('app.primer_chat.most_active_hour')}</div>
              <div className="activity-value">{resumen.hora_mas_activa.hora ? `${resumen.hora_mas_activa.hora}:00` : "00:00"}</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Gráfico de actividad por día de la semana */}
      <div className="chart-container">
        <h3>{t('app.primer_chat.activity_by_day')}</h3>
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
            <Legend />
            <Bar 
              dataKey="mensajes" 
              name={t('messages')} 
              fill="#25D366"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Gráfico de actividad por hora del día */}
      <div className="chart-container">
        <h3>{t('app.primer_chat.activity_by_hour')}</h3>
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
            <Legend />
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
      
      {/* Gráfico de mensajes por usuario (top 5) */}
      <div className="chart-container">
        <h3>{t('app.primer_chat.top_users')}</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={prepararDatosUsuarios()}
              cx="50%"
              cy="50%"
              labelLine={windowWidth > 480}
              outerRadius={windowWidth <= 480 ? 80 : 100}
              fill="#8884d8"
              dataKey="mensajes"
              nameKey="nombre"
              label={({ nombre, mensajes, percent }) => 
                windowWidth <= 480 
                  ? `${(percent * 100).toFixed(0)}%`
                  : `${acortarNombre(nombre)}: ${mensajes} (${(percent * 100).toFixed(1)}%)`
              }
            >
              {prepararDatosUsuarios().map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value, name) => [`${value} ${t('messages')}`, acortarNombre(name)]} />
            {windowWidth <= 480 && (
              <Legend
                layout="vertical"
                verticalAlign="bottom"
                align="center"
                formatter={(value) => acortarNombre(value)}
              />
            )}
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      {/* NUEVO: Gráfico de tendencia mes a mes del tiempo de respuesta */}
      <div className="chart-container tiempo-respuesta-chart">
        <h3>{t('app.primer_chat.response_time_trend')}</h3>
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
              label={{ value: t('app.top_profiles.gunslinger.response_time'), angle: -90, position: 'insideLeft', offset: -5 }}
              domain={['auto', 'auto']}
            />
            <Tooltip 
              formatter={(value, name) => [`${value} ${t('app.top_profiles.gunslinger.response_time').toLowerCase()}`, acortarNombre(name)]}
              labelFormatter={(label) => `${t('app.primer_chat.response_time_trend')}: ${label}`}
            />
            <Legend 
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              wrapperStyle={{paddingTop: '20px', bottom: 0, width: '100%'}}
              formatter={(value) => acortarNombre(value)}
            />
            {(() => {
              // Verificar si hay datos
              const datosGrafico = prepararDatosTiempoRespuesta();
              if (!datosGrafico || datosGrafico.length === 0) {
                // Eliminar el texto con mensaje de "no_data"
                return null;
              }
              
              // Obtener los 5 usuarios más activos
              const usuariosActivos = obtenerUsuariosUnicos();
              
              console.log("Usuarios más activos para gráfico de tiempo respuesta:", usuariosActivos);
              
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
        
        {/* Mensaje informativo opcional */}
        {!prepararDatosTiempoRespuesta() || prepararDatosTiempoRespuesta().length === 0 ? (
          // Eliminar mensaje informativo
          null
        ) : null}
      </div>

      {/* NUEVO: Gráfico de porcentaje de mensajes por usuario por mes */}
      <div className="chart-container">
        <h3>{t('app.primer_chat.interest_trend')}</h3>
        {(() => {
          const datosGrafico = prepararDatosMensajesPorMes();
          console.log("Datos para el gráfico de porcentajes:", datosGrafico);
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
                  label={{ value: t('app.top_profiles.vampire.percentage'), angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  formatter={(value, name) => [`${(value * 100).toFixed(1)}%`, acortarNombre(name)]}
                  labelFormatter={(label) => `${t('app.primer_chat.interest_trend')}: ${label}`}
                />
                <Legend 
                  layout="horizontal"
                  verticalAlign="bottom" 
                  align="center"
                  wrapperStyle={{paddingTop: '20px'}}
                  formatter={(value) => acortarNombre(value)}
                />
                {(() => {
                  // Si no hay datos, mostrar mensaje
                  if (datosGrafico.length === 0) {
                    // Eliminar el texto con mensaje de "no_data"
                    return null;
                  }
                  
                  // Extraer los nombres de usuario del primer elemento (excluyendo props especiales)
                  const usuariosDisponibles = Object.keys(datosGrafico[0]).filter(
                    key => !['mes', 'mesFormateado', 'total'].includes(key)
                  );
                  
                  console.log("Usuarios disponibles para gráfico:", usuariosDisponibles);
                  
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
  );
};

export default AnalisisPrimerChat;
