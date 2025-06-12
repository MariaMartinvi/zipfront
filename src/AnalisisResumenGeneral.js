import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import './styles/Analisis.css';
import './Analisis_primer_chat.css';
import { detectarFormatoArchivo } from './formatDetector.js';
import { parseDateTime } from './dateUtils.js';
import { useAuth } from './AuthContext';

// Reutilizar la misma función analizarChat del componente original
const analizarChat = (contenido, formatoForzado = null) => {
  console.log("Analizando chat directamente desde AnalisisResumenGeneral...");
  
  try {
    const lineas = contenido.split(/\r?\n/);
    
    if (!lineas || lineas.length === 0) {
      console.log("Archivo vacío");
      return { error: "empty_file", success: false };
    }
    
    console.log(`Archivo leído correctamente. Total de líneas: ${lineas.length}`);
    
    const formato = detectarFormatoArchivo(contenido, formatoForzado, true);
    console.log(`\nFormato final a utilizar: ${formato}`);
    
    if (formato === "desconocido") {
      return { error: "format_not_recognized", success: false };
    }
    
    const mensajes = analizarMensajesSimplificado(lineas, formato);
    
    if (mensajes.length === 0) {
      return { error: "no_valid_messages", success: false };
    }
    
    const stats = {
      mensajes_por_usuario: {},
      actividad_por_hora: {},
      actividad_por_dia_semana: {},
      mensajes_por_mes: {},
      mensajes_por_dia: {},
      formato_chat: formato
    };
    
    const diasSemana = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    let primerFecha = null;
    
    mensajes.sort((a, b) => {
      return a.fechaObj - b.fechaObj;
    });
    
    mensajes.forEach(msg => {
      const fecha = msg.fechaObj;
      const hora = fecha.getHours();
      const diaSemana = fecha.getDay();
      const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      const dia = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
      
      if (!primerFecha || fecha < primerFecha) {
        primerFecha = fecha;
      }
      
      stats.mensajes_por_usuario[msg.nombre] = (stats.mensajes_por_usuario[msg.nombre] || 0) + 1;
      
      stats.actividad_por_hora[hora] = (stats.actividad_por_hora[hora] || 0) + 1;
      
      const diaSemanaStr = diasSemana[diaSemana];
      stats.actividad_por_dia_semana[diaSemanaStr] = (stats.actividad_por_dia_semana[diaSemanaStr] || 0) + 1;
      
      stats.mensajes_por_dia[dia] = (stats.mensajes_por_dia[dia] || 0) + 1;
    });
    
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
      promedio_mensajes_diarios: promedioMensajesDiarios.toFixed(2),
      dia_mas_activo: { fecha: "N/A", mensajes: 0 },
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
    
    stats.total_messages = mensajes.length;
    stats.active_participants = Object.keys(stats.mensajes_por_usuario).length;
    stats.chat_format = formato;
    stats.success = true;
    
    return stats;
  } catch (error) {
    console.error("Error durante el análisis:", error);
    return {
      error: "analysis_error",
      errorDetails: error.message,
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
  
  if (mensajeAnterior && 
      !(linea.startsWith('[') || 
        (formato === "android" && /^\d{1,2}\/\d{1,2}\/\d{2}/.test(linea)))) {
    mensajeAnterior.mensaje += `\n${linea}`;
    mensajeAnterior.esMultilinea = true;
    return mensajeAnterior;
  }
  
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
    const fechaObj = parseDateTime(fecha, hora, formato);
    
    return {
      fecha: fecha,
      hora: hora,
      fechaObj: fechaObj,
      nombre: nombre.trim(),
      mensaje: mensaje.trim() || "",
      esMultilinea: false
    };
  }
  return null;
};

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
  
  const formato = t('date.format');
  
  let fechaFormateada = formato
    .replace('d', dia)
    .replace('MMMM', meses[parseInt(mes) - 1])
    .replace('yy', anio);
  
  return fechaFormateada;
};

const AnalisisResumenGeneral = ({ operationId, chatData }) => {
  const { user, isAuthLoading } = useAuth();
  const { t } = useTranslation();
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Utilizar useMemo para almacenar los resultados del análisis
  const datosAnalizados = useMemo(() => {
    if (!chatData) return null;
    
    console.log("Analizando datos del chat en el cliente (memoizado) - Resumen General");
    
    try {
      const resultadoAnalisis = analizarChat(chatData);
      console.log("Resultado del análisis en cliente - Resumen:", resultadoAnalisis);
      return resultadoAnalisis;
    } catch (err) {
      console.error("Error analizando el chat:", err);
      return { 
        error: "analysis_error",
        errorDetails: err.message,
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
        setDatos(datosAnalizados);
        setError(null);
      } else {
        // Si el error es una clave de traducción, usarla con t(); si no, usar el texto tal como está
        const errorMessage = datosAnalizados.error && typeof datosAnalizados.error === 'string' && 
                             !datosAnalizados.error.includes(' ') && 
                             !datosAnalizados.error.includes(':')
          ? t(`app.errors.${datosAnalizados.error}`) 
          : datosAnalizados.error || t('app.errors.analysis_failed');
        
        setError(errorMessage);
      }
      setCargando(false);
    }
  }, [datosAnalizados, chatData, t]);

  // SEGURIDAD: Verificar autenticación antes de mostrar cualquier contenido
  if (isAuthLoading) {
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
    <div className="modern-analysis-container">
      {/* Summary Section - RESUMEN GENERAL */}
      <section className="summary-section">
        <div className="summary-container">
          <span className="summary-badge">{t('analysis_summary.badge')}</span>
          <h2 className="summary-title">{t('app.primer_chat.title')}</h2>
          <p className="summary-description">{t('analysis_summary.description')}</p>
          
          <div className="summary-content">
            <div className="stat-highlight-card">
              <div className="stat-icon">📅</div>
              <div className="stat-value">{formatearFecha(primer_mensaje.fecha, t)}</div>
              <div className="stat-label">{t('app.primer_chat.date_start')}</div>
            </div>
            
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{resumen.total_mensajes.toLocaleString()}</div>
                <div className="stat-label">{t('app.primer_chat.total_messages')}</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{resumen.promedio_mensajes_diarios}</div>
                <div className="stat-label">{t('app.primer_chat.messages_per_day')}</div>
              </div>
            </div>
            
            <div className="highlight-card">
              <div className="highlight-icon">👑</div>
              <div className="highlight-content">
                <div className="highlight-title">{t('app.primer_chat.most_active_user')}</div>
                <div className="highlight-value">{resumen.usuario_mas_activo.nombre}</div>
                <div className="highlight-detail">{t('app.primer_chat.with_messages', { count: resumen.usuario_mas_activo.mensajes.toLocaleString() })}</div>
              </div>
            </div>
            
            <div className="activity-grid">
              <div className="activity-card">
                <div className="activity-icon">📊</div>
                <div className="activity-label">{t('app.primer_chat.most_active_day')} ({t('messages')})</div>
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
              <div className="activity-card">
                <div className="activity-icon">🕒</div>
                <div className="activity-label">{t('app.primer_chat.most_active_hour')} ({t('messages')})</div>
                <div className="activity-value">{resumen.hora_mas_activa.hora ? `${resumen.hora_mas_activa.hora}:00` : "00:00"}</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AnalisisResumenGeneral; 