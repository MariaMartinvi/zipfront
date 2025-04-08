import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import './Analisis_emojis.css'; // Importar los estilos (crearemos este archivo también)

// Colores para los gráficos
const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', 
  '#82CA9D', '#F44236', '#E91E63', '#9C27B0', '#673AB7'
];

const AnalisisEmojis = ({ operationId }) => {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!operationId) {
      setError("No se ha proporcionado un ID de operación");
      setCargando(false);
      return;
    }

    // Cargar los datos desde el endpoint de la API
    const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000';
    
    fetch(`${API_URL}/api/resultados-emojis/${operationId}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('No se pudieron cargar los datos de emojis');
        }
        return response.json();
      })
      .then(data => {
        setDatos(data);
        setCargando(false);
      })
      .catch(err => {
        console.error('Error cargando datos:', err);
        setError(err.message);
        setCargando(false);
      });
  }, [operationId]);

  // Prepara datos para el gráfico de barras de usuarios
  const prepararDatosBarras = () => {
    if (!datos || !datos.ranking) return [];
    
    // Tomamos los 5 primeros usuarios para no sobrecargar el gráfico
    return datos.ranking.slice(0, 5).map(usuario => ({
      nombre: usuario.nombre.length > 15 
        ? `${usuario.nombre.substring(0, 12)}...` 
        : usuario.nombre,
      total: usuario.total_emojis,
      porcentaje: usuario.porcentaje
    }));
  };

  if (cargando) return <div className="loading">Cargando datos de emojis...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!datos || !datos.ranking || datos.ranking.length === 0) {
    return <div className="no-data">No se encontraron emojis en el chat</div>;
  }

  const reyEmojis = datos.rey_emojis;
  const datosBarras = prepararDatosBarras();

  return (
    <div className="analisis-emojis-container">
      <h2>Análisis de Emojis en el Chat</h2>
      
      {/* Tarjeta del Rey de los Emojis */}
      <div className="emoji-king-card">
        <div className="emoji-king-header">
          <h3>👑 Rey de los Emojis</h3>
          <div className="emoji-king-name">{reyEmojis.nombre}</div>
        </div>
        
        <div className="emoji-king-stats">
          <div className="stat-item">
            <div className="stat-value">{reyEmojis.total_emojis}</div>
            <div className="stat-label">Emojis usados</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{reyEmojis.porcentaje}%</div>
            <div className="stat-label">Del total del chat</div>
          </div>
        </div>
        
        <div className="emoji-favorites">
          <h4>Emojis favoritos</h4>
          <div className="emoji-grid">
            {reyEmojis.emojis_favoritos.map((item, index) => (
              <div key={index} className="emoji-item">
                <span className="emoji-symbol">{item.emoji}</span>
                <span className="emoji-count">{item.cantidad}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Gráfico de Barras - Top 5 Usuarios */}
      <div className="chart-container">
        <h3>Top 5 Usuarios por Uso de Emojis</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={datosBarras}
            margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="nombre" 
              angle={-45} 
              textAnchor="end" 
              height={70} 
            />
            <YAxis />
            <Tooltip 
              formatter={(value, name) => [`${value} emojis`, 'Total']}
              labelFormatter={(value) => `Usuario: ${value}`}
            />
            <Legend />
            <Bar dataKey="total" name="Emojis usados" fill="#FF8042" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AnalisisEmojis;