import React, { useState, useEffect } from 'react';
import './Analisis_top.css';

const categoriaIconos = {
  'profesor': { icono: '👨‍🏫', titulo: 'El Profesor', descripcion: 'Más palabras distintas, más vocabulario' },
  'rollero': { icono: '📜', titulo: 'El Rollero', descripcion: 'Más palabras por mensaje' },
  'pistolero': { icono: '🔫', titulo: 'El Pistolero', descripcion: 'Contesta más rápido' },
  'vampiro': { icono: '🧛', titulo: 'El Vampiro', descripcion: 'Manda más mensajes por la noche' },
  'cafeconleche': { icono: '☕', titulo: 'El Cafeconleche', descripcion: 'Manda mensajes más temprano' },
  'dejaenvisto': { icono: '👻', titulo: 'El Dejaenvisto', descripcion: 'Contesta más lento' },
  'narcicista': { icono: '🪞', titulo: 'El Narcicista', descripcion: 'Usa más la palabra yo' },
  'puntofinal': { icono: '🔚', titulo: 'El Puntofinal', descripcion: 'Acaba más conversaciones' },
  'fosforo': { icono: '🔥', titulo: 'El Fósforo', descripcion: 'Inicia conversaciones' },
  'menosesmas': { icono: '🔍', titulo: 'El Menosesmás', descripcion: 'Mensajes más cortos' },
  'chismoso': { icono: '👂', titulo: 'El Chismoso', descripcion: 'Habla más de otras personas' },
  'happyflower': { icono: '😊', titulo: 'El Happy Flower', descripcion: 'Usa más emojis' }
};

const AnalisisTop = ({ operationId }) => {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);

  useEffect(() => {
    if (!operationId) {
      setError("No se ha proporcionado un ID de operación");
      setCargando(false);
      return;
    }

    // Cargar los datos desde el endpoint de la API
    const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000';
    
    fetch(`${API_URL}/api/resultados-top/${operationId}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('No se pudieron cargar los datos de top perfiles');
        }
        return response.json();
      })
      .then(data => {
        // Transformar los datos al formato esperado
        const datosTransformados = {
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
        
        setDatos(datosTransformados);
        setCargando(false);
        // Seleccionar la primera categoría por defecto
        if (datosTransformados.categorias && Object.keys(datosTransformados.categorias).length > 0) {
          setCategoriaSeleccionada(Object.keys(datosTransformados.categorias)[0]);
        }
      })
      .catch(err => {
        console.error('Error cargando datos:', err);
        setError(err.message);
        setCargando(false);
      });
  }, [operationId]);

  const renderDetalleCategoria = (categoria) => {
    if (!datos || !datos.categorias || !datos.categorias[categoria]) {
      return <p>No hay datos disponibles para esta categoría</p>;
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
              <span className="label">Palabras únicas utilizadas</span>
            </div>
            <div className="estadistica">
              <span className="valor">{formatNumber(catData.ratio)}</span>
              <span className="label">Palabras únicas por mensaje</span>
            </div>
          </>
        );
        break;
      case 'rollero':
        detalleEspecifico = (
          <div className="estadistica">
            <span className="valor">{formatNumber(catData.palabras_por_mensaje)}</span>
            <span className="label">Palabras por mensaje en promedio</span>
          </div>
        );
        break;
      case 'pistolero':
        detalleEspecifico = (
          <div className="estadistica">
            <span className="valor">{formatNumber(catData.tiempo_respuesta_promedio)}</span>
            <span className="label">Minutos en responder (promedio)</span>
          </div>
        );
        break;
      case 'vampiro':
        detalleEspecifico = (
          <>
            <div className="estadistica">
              <span className="valor">{catData.mensajes_noche || 0}</span>
              <span className="label">Mensajes nocturnos</span>
            </div>
            <div className="estadistica">
              <span className="valor">{formatNumber(catData.porcentaje)}%</span>
              <span className="label">De sus mensajes son por la noche</span>
            </div>
          </>
        );
        break;
      case 'cafeconleche':
        detalleEspecifico = (
          <div className="estadistica">
            <span className="valor">{catData.hora_formateada || '00:00'}</span>
            <span className="label">Hora promedio de mensajes</span>
          </div>
        );
        break;
      case 'dejaenvisto':
        detalleEspecifico = (
          <div className="estadistica">
            <span className="valor">{formatNumber(catData.tiempo_respuesta_promedio)}</span>
            <span className="label">Minutos para responder (promedio)</span>
          </div>
        );
        break;
      case 'narcicista':
        detalleEspecifico = (
          <>
            <div className="estadistica">
              <span className="valor">{catData.menciones_yo || 0}</span>
              <span className="label">Menciones a sí mismo</span>
            </div>
            <div className="estadistica">
              <span className="valor">{formatNumber(catData.porcentaje)}%</span>
              <span className="label">De sus mensajes hablan de sí mismo</span>
            </div>
          </>
        );
        break;
      case 'chismoso':
        detalleEspecifico = (
          <>
            <div className="estadistica">
              <span className="valor">{catData.menciones_otros || 0}</span>
              <span className="label">Menciones a otras personas</span>
            </div>
            <div className="estadistica">
              <span className="valor">{formatNumber(catData.porcentaje)}%</span>
              <span className="label">De sus mensajes mencionan a otros</span>
            </div>
          </>
        );
        break;
      case 'happyflower':
        detalleEspecifico = (
          <>
            <div className="estadistica">
              <span className="valor">{catData.emojis_totales || 0}</span>
              <span className="label">Emojis totales utilizados</span>
            </div>
            <div className="estadistica">
              <span className="valor">{formatNumber(catData.emojis_por_mensaje)}</span>
              <span className="label">Emojis por mensaje (promedio)</span>
            </div>
          </>
        );
        break;
      case 'puntofinal':
        detalleEspecifico = (
          <div className="estadistica">
            <span className="valor">{catData.conversaciones_terminadas || 0}</span>
            <span className="label">Conversaciones terminadas</span>
          </div>
        );
        break;
      case 'fosforo':
        detalleEspecifico = (
          <div className="estadistica">
            <span className="valor">{catData.conversaciones_iniciadas || 0}</span>
            <span className="label">Conversaciones iniciadas</span>
          </div>
        );
        break;
      case 'menosesmas':
        detalleEspecifico = (
          <div className="estadistica">
            <span className="valor">{formatNumber(catData.longitud_promedio)}</span>
            <span className="label">Caracteres por mensaje (promedio)</span>
          </div>
        );
        break;
      default:
        detalleEspecifico = <p>No hay detalles específicos disponibles</p>;
    }

    return (
      <div className="categoria-detalle">
        <div className="usuario-destacado">
          <span className="nombre">{catData.nombre || 'Sin nombre'}</span>
          <span className="mensajes-totales">{catData.mensajes || 0} mensajes totales</span>
        </div>
        <div className="estadisticas-container">
          {detalleEspecifico}
        </div>
      </div>
    );
  };

  if (cargando) return <div className="loading">Cargando perfiles destacados...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!datos || !datos.categorias || Object.keys(datos.categorias).length === 0) {
    return <div className="no-data">No se encontraron datos suficientes para el análisis</div>;
  }

  return (
    <div className="analisis-top-container">
      <h2 className="titulo-principal">🏆 Perfiles Destacados del Chat 🏆</h2>
      
      <div className="categorias-grid">
        {Object.keys(categoriaIconos).map(categoria => (
          datos.categorias[categoria] && datos.categorias[categoria].nombre ? (
            <div 
              key={categoria}
              className={`categoria-card ${categoriaSeleccionada === categoria ? 'seleccionada' : ''}`}
              onClick={() => setCategoriaSeleccionada(categoria)}
            >
              <div className="categoria-icono">{categoriaIconos[categoria].icono}</div>
              <div className="categoria-info">
                <div className="categoria-titulo">{categoriaIconos[categoria].titulo}</div>
                <div className="categoria-usuario">{datos.categorias[categoria].nombre}</div>
              </div>
            </div>
          ) : null
        ))}
      </div>
      
      <div className="detalle-container">
        {categoriaSeleccionada && (
          <>
            <div className="detalle-header">
              <div className="detalle-icono">{categoriaIconos[categoriaSeleccionada].icono}</div>
              <div className="detalle-info">
                <h3 className="detalle-titulo">{categoriaIconos[categoriaSeleccionada].titulo}</h3>
                <p className="detalle-descripcion">{categoriaIconos[categoriaSeleccionada].descripcion}</p>
              </div>
            </div>
            {renderDetalleCategoria(categoriaSeleccionada)}
          </>
        )}
      </div>
    </div>
  );
};

export default AnalisisTop;