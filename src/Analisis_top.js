import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './Analisis_top.css';

const AnalisisTop = ({ operationId }) => {
  const { t } = useTranslation();
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);

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
    }
  };

  useEffect(() => {
    if (!operationId) {
      setError(t('app.errors.no_operation_id'));
      setCargando(false);
      return;
    }

    // Cargar los datos desde el endpoint de la API
    const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000';
    
    // Eliminar parámetro para forzar formato iOS
    const url = `${API_URL}/api/resultados-top/${operationId}`;
    console.log(`Cargando datos de top perfiles desde: ${url}`);
    
    // Asegurar que el estado de carga esté activo
    setCargando(true);
    
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
        }, 300);
      })
      .catch(err => {
        console.error('Error cargando datos:', err);
        setError(err.message);
        setCargando(false);
      });
  }, [operationId, t]);

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
          datos.categorias[categoria] && datos.categorias[categoria].nombre ? (
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