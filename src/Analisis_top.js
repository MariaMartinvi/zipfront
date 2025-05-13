import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './Analisis_top.css';
// Importar el detector de formato directamente
import { detectarFormatoArchivo } from './formatDetector.js';

// Función simplificada para analizar perfiles
const analizarPerfilesCompleto = (contenido, formatoForzado = null, idiomaChat = 'es') => {
  console.log("Analizando perfiles directamente desde Analisis_top...");
  try {
    const formato = detectarFormatoArchivo(contenido, formatoForzado, true);
    
    if (formato === "desconocido") {
      return { error: "Formato de chat no reconocido", success: false };
    }
    
    // Analizar mensajes
    const lineas = contenido.split(/\r?\n/);
    const mensajes = extraerMensajes(lineas, formato);
    
    if (mensajes.length === 0) {
      return { error: "No se encontraron mensajes válidos", success: false };
    }
    
    // Obtener usuarios
    const usuarios = {};
    const participantes = new Set();
    mensajes.forEach(m => participantes.add(m.nombre));
    
    // Inicializar estadísticas para cada usuario
    participantes.forEach(usuario => {
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
        max_mensajes_seguidos: 0
      };
    });
    
    // Calcular estadísticas básicas
    mensajes.forEach(msg => {
      const usuario = msg.nombre;
      
      // Incrementar contadores
      usuarios[usuario].mensajes++;
      
      // Si el mensaje es entre 9PM y 6AM, es nocturno
      const hora = parseInt(msg.hora.split(':')[0], 10);
      if (hora >= 21 || hora < 6) {
        usuarios[usuario].mensajes_noche++;
      }
      
      // Registrar hora para promedio
      usuarios[usuario].horario_mensajes.push(hora);
      
      // Registrar longitud del mensaje
      if (msg.mensaje) {
        const longitud = msg.mensaje.length;
        usuarios[usuario].longitud_mensajes.push(longitud);
      }
    });
    
    // Crear categorías con datos simplificados
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
      sicopata: { nombre: '--', max_mensajes_seguidos: 0, mensajes: 0 }
    };
    
    // Asignar categorías simplificadas basadas en las estadísticas básicas
    
    // Vampiro (nocturno)
    let maxMensajesNoche = 0;
    let usuarioVampiro = '';
    
    Object.entries(usuarios).forEach(([nombre, datos]) => {
      if (datos.mensajes_noche > maxMensajesNoche) {
        maxMensajesNoche = datos.mensajes_noche;
        usuarioVampiro = nombre;
      }
    });
    
    if (usuarioVampiro) {
      const porcentaje = (maxMensajesNoche / usuarios[usuarioVampiro].mensajes) * 100;
      categorias.vampiro = {
        nombre: usuarioVampiro,
        mensajes_noche: maxMensajesNoche,
        porcentaje: porcentaje,
        mensajes: usuarios[usuarioVampiro].mensajes
      };
    }
    
    // CafeConLeche (hora promedio más temprana)
    const horasPromedio = {};
    Object.entries(usuarios).forEach(([nombre, datos]) => {
      if (datos.horario_mensajes.length > 0) {
        let suma = datos.horario_mensajes.reduce((a, b) => a + b, 0);
        horasPromedio[nombre] = suma / datos.horario_mensajes.length;
      }
    });
    
    if (Object.keys(horasPromedio).length > 0) {
      const usuarioCafeConLeche = Object.entries(horasPromedio)
        .sort((a, b) => a[1] - b[1])[0][0];
      
      const horaPromedio = horasPromedio[usuarioCafeConLeche];
      const horaEntera = Math.floor(horaPromedio);
      const minutos = Math.floor((horaPromedio - horaEntera) * 60);
      
      categorias.cafeconleche = {
        nombre: usuarioCafeConLeche,
        hora_promedio: horaPromedio,
        hora_formateada: `${horaEntera}:${minutos.toString().padStart(2, '0')}`,
        mensajes: usuarios[usuarioCafeConLeche].mensajes
      };
    }
    
    // MenosEsMas (mensajes más cortos)
    const longitudPromedio = {};
    Object.entries(usuarios).forEach(([nombre, datos]) => {
      if (datos.longitud_mensajes.length > 0) {
        let suma = datos.longitud_mensajes.reduce((a, b) => a + b, 0);
        longitudPromedio[nombre] = suma / datos.longitud_mensajes.length;
      }
    });
    
    if (Object.keys(longitudPromedio).length > 0) {
      const usuarioMenosEsMas = Object.entries(longitudPromedio)
        .sort((a, b) => a[1] - b[1])[0][0];
      
      categorias.menosesmas = {
        nombre: usuarioMenosEsMas,
        longitud_promedio: longitudPromedio[usuarioMenosEsMas],
        mensajes: usuarios[usuarioMenosEsMas].mensajes
      };
    }
    
    // Estructura final
    return {
      usuarios: usuarios,
      categorias: categorias,
      totales: {
        mensajes: mensajes.length,
        usuarios: participantes.size
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
    return {
      fecha: fecha,
      hora: hora,
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
    
    // Eliminar parámetro para forzar formato iOS
    const url = `${API_URL}/api/resultados-top/${operationId}`;
    console.log(`Cargando datos de top perfiles desde: ${url}`);
    
    // Asegurar que el estado de carga esté activo
    setCargando(true);
    
    // Función para verificar que los datos estén completos
    const verificarDatosCompletos = (data) => {
      if (!data || !data.categorias) return false;
      
      // Verificar que todas las categorías necesarias estén presentes
      const categoriasRequeridas = [
        'profesor', 'rollero', 'pistolero', 'vampiro', 'cafeconleche',
        'dejaenvisto', 'narcicista', 'chismoso', 'happyflower',
        'puntofinal', 'fosforo', 'menosesmas', 'amoroso', 'sicopata'
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
                porcentaje: data.categorias?.vampiro?.porcentaje || 0,
                mensajes: data.categorias?.vampiro?.mensajes || 0
              },
              cafeconleche: {
                nombre: data.categorias?.cafeconleche?.nombre || 'Sin datos',
                hora_formateada: data.categorias?.cafeconleche?.hora_formateada || '00:00',
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
      return num !== undefined ? Number(num).toFixed(1) : '0.0';
    };

    switch (categoria) {
      case 'profesor':
        detalleEspecifico = (
          <>
            <div className="estadistica">
              <span className="valor">{catData.palabras_unicas || 0}</span>
              <span className="label">{t('app.top_profiles.professor.unique_words')}</span>
            </div>
            <div className="estadistica">
              <span className="valor">{formatNumber(catData.ratio)}</span>
              <span className="label">{t('app.top_profiles.professor.unique_ratio')}</span>
            </div>
          </>
        );
        break;
      case 'rollero':
        detalleEspecifico = (
          <div className="estadistica">
            <span className="valor">{formatNumber(catData.palabras_por_mensaje)}</span>
            <span className="label">{t('app.top_profiles.verbose.words_per_message')}</span>
          </div>
        );
        break;
      case 'pistolero':
        detalleEspecifico = (
          <div className="estadistica">
            <span className="valor">{formatNumber(catData.tiempo_respuesta_promedio)}</span>
            <span className="label">{t('app.top_profiles.gunslinger.response_time')}</span>
          </div>
        );
        break;
      case 'vampiro':
        detalleEspecifico = (
          <>
            <div className="estadistica">
              <span className="valor">{catData.mensajes_noche || 0}</span>
              <span className="label">{t('app.top_profiles.vampire.night_messages')}</span>
            </div>
            <div className="estadistica">
              <span className="valor">{formatNumber(catData.porcentaje)}%</span>
              <span className="label">{t('app.top_profiles.vampire.percentage')}</span>
            </div>
          </>
        );
        break;
      case 'cafeconleche':
        detalleEspecifico = (
          <div className="estadistica">
            <span className="valor">{catData.hora_formateada || '00:00'}</span>
            <span className="label">{t('app.top_profiles.morning.avg_time')}</span>
          </div>
        );
        break;
      case 'dejaenvisto':
        detalleEspecifico = (
          <div className="estadistica">
            <span className="valor">{formatNumber(catData.tiempo_respuesta_promedio)}</span>
            <span className="label">{t('app.top_profiles.ghost.response_time')}</span>
          </div>
        );
        break;
      case 'narcicista':
        detalleEspecifico = (
          <>
            <div className="estadistica">
              <span className="valor">{catData.menciones_yo || 0}</span>
              <span className="label">{t('app.top_profiles.narcissist.self_mentions')}</span>
            </div>
            <div className="estadistica">
              <span className="valor">{formatNumber(catData.porcentaje)}%</span>
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
              <span className="label">{t('app.top_profiles.gossip.others_mentions')}</span>
            </div>
            <div className="estadistica">
              <span className="valor">{formatNumber(catData.porcentaje)}%</span>
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
              <span className="label">{t('app.top_profiles.emoji.total_emojis')}</span>
            </div>
            <div className="estadistica">
              <span className="valor">{formatNumber(catData.emojis_por_mensaje)}</span>
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
              <span className="label">{t('app.top_profiles.amoroso.love_emojis')}</span>
            </div>
            <div className="estadistica">
              <span className="valor">{formatNumber(catData.porcentaje_amor)}%</span>
              <span className="label">{t('app.top_profiles.amoroso.percentage')}</span>
            </div>
          </>
        );
        break;
      case 'puntofinal':
        detalleEspecifico = (
          <div className="estadistica">
            <span className="valor">{catData.conversaciones_terminadas || 0}</span>
            <span className="label">{t('app.top_profiles.finisher.conversations_ended')}</span>
          </div>
        );
        break;
      case 'fosforo':
        detalleEspecifico = (
          <div className="estadistica">
            <span className="valor">{catData.conversaciones_iniciadas || 0}</span>
            <span className="label">{t('app.top_profiles.initiator.conversations_started')}</span>
          </div>
        );
        break;
      case 'menosesmas':
        detalleEspecifico = (
          <div className="estadistica">
            <span className="valor">{formatNumber(catData.longitud_promedio)}</span>
            <span className="label">{t('app.top_profiles.concise.avg_length')}</span>
          </div>
        );
        break;
      case 'sicopata':
        detalleEspecifico = (
          <>
            <div className="estadistica">
              <span className="valor">{catData.max_mensajes_seguidos || 0}</span>
              <span className="label">{t('app.top_profiles.sicopata.consecutive_messages')}</span>
            </div>
            <div className="estadistica">
              <span className="valor">{catData.max_mensajes_seguidos || 0}</span>
              <span className="label">{t('app.top_profiles.sicopata.record')}</span>
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
  if (error) return <div className="error">{t('app.errors.generic')}: {error}</div>;
  if (!datos || !datos.categorias || Object.keys(datos.categorias).length === 0) {
    return <div className="no-data">{t('app.top_profiles.no_data')}</div>;
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
    </div>
  );
};

export default AnalisisTop;