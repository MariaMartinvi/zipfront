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
        setDatos(data);
        setCargando(false);
        // Seleccionar la primera categoría por defecto
        if (data.categorias && Object.keys(data.categorias).length > 0) {
          setCategoriaSeleccionada(Object.keys(data.categorias)[0]);
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

    switch (categoria) {
      case 'profesor':
        detalleEspecifico = (
          <>
            <div className="estadistica">
              <span className="valor">{catData.palabras_unicas}</span>
              <span className="label">Palabras únicas utilizadas</span>
            </div>
            <div className="estadistica">
              <span className="valor">{catData.ratio.toFixed(2)}</span>
              <span className="label">Palabras únicas por mensaje</span>
            </div>
          </>
        );
        break;
      case 'rollero':
        detalleEspecifico = (
          <div className="estadistica">
            <span className="valor">{catData.palabras_por_mensaje.toFixed(1)}</span>
            <span className="label">Palabras por mensaje en promedio</span>
          </div>
        );
        break;
      case 'pistolero':
        detalleEspecifico = (
          <div className="estadistica">
            <span className="valor">{catData.tiempo_respuesta_promedio.toFixed(1)}</span>
            <span className="label">Minutos en responder (promedio)</span>
          </div>
        );
        break;
      case 'vampiro':
        detalleEspecifico = (
          <>
            <div className="estadistica">
              <span className="valor">{catData.mensajes_noche}</span>
              <span className="label">Mensajes nocturnos</span>
            </div>
            <div className="estadistica">
              <span className="valor">{catData.porcentaje.toFixed(1)}%</span>
              <span className="label">De sus mensajes son por la noche</span>
            </div>
          </>
        );
        break;
      case 'cafeconleche':
        detalleEspecifico = (
          <div className="estadistica">
            <span className="valor">{catData.hora_formateada}</span>
            <span className="label">Hora promedio de mensajes</span>
          </div>
        );
        break;
      case 'dejaenvisto':
        detalleEspecifico = (
          <div className="estadistica">
            <span className="valor">{catData.tiempo_respuesta_promedio.toFixed(1)}</span>
            <span className="label">Minutos para responder (promedio)</span>
          </div>
        );
        break;
      case 'narcicista':
        detalleEspecifico = (
          <>
            <div className="estadistica">
              <span className="valor">{catData.menciones_yo}</span>
              <span className="label">Menciones a sí mismo</span>
            </div>
            <div className="estadistica">
              <span className="valor">{catData.porcentaje.toFixed(1)}%</span>
              <span className="label">De sus mensajes hablan de sí mismo</span>
            </div>
          </>
        );
        break;
      case 'puntofinal':
        detalleEspecifico = (
          <div className="estadistica">
            <span className="valor">{catData.conversaciones_terminadas}</span>
            <span className="label">Conversaciones terminadas</span>
          </div>
        );
        break;
      case 'fosforo':
        detalleEspecifico = (
          <div className="estadistica">
            <span className="valor">{catData.conversaciones_iniciadas}</span>
            <span className="label">Conversaciones iniciadas</span>
          </div>
        );
        break;
      case 'menosesmas':
        detalleEspecifico = (
          <div className="estadistica">
            <span className="valor">{catData.longitud_promedio.toFixed(1)}</span>
            <span className="label">Caracteres por mensaje (promedio)</span>
          </div>
        );
        break;
      case 'chismoso':
        detalleEspecifico = (
          <>
            <div className="estadistica">
              <span className="valor">{catData.menciones_otros}</span>
              <span className="label">Menciones a otras personas</span>
            </div>
            <div className="estadistica">
              <span className="valor">{catData.porcentaje.toFixed(1)}%</span>
              <span className="label">De sus mensajes mencionan a otros</span>
            </div>
          </>
        );
        break;
      case 'happyflower':
        detalleEspecifico = (
          <>
            <div className="estadistica">
              <span className="valor">{catData.emojis_totales}</span>
              <span className="label">Emojis totales utilizados</span>
            </div>
            <div className="estadistica">
              <span className="valor">{catData.emojis_por_mensaje.toFixed(2)}</span>
              <span className="label">Emojis por mensaje (promedio)</span>
            </div>
          </>);
          break;

      default:
        detalleEspecifico = <p>No hay detalles específicos disponibles</p>;
    }

    return (
      <div className="categoria-detalle">
        <div className="usuario-destacado">
          <span className="nombre">{catData.nombre}</span>
          <span className="mensajes-totales">{catData.mensajes} mensajes totales</span>
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