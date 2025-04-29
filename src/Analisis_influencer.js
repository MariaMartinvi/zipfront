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
  PieChart, 
  Pie, 
  Cell
} from 'recharts';
import './Analisis_Influencer.css'; // Importar los estilos

// Colores para los gráficos
const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', 
  '#82CA9D', '#F44236', '#E91E63', '#9C27B0', '#673AB7'
];

// Tipos de multimedia y sus iconos (puedes usar FontAwesome o similares)
const TIPOS_MULTIMEDIA = {
  'imagen': '🖼️',
  'video': '🎬',
  'audio': '🔊',
  'documento': '📄',
  'sticker': '😀',
  'contacto': '👤',
  'link': '🔗'
};

const AnalisisInfluencer = ({ operationId }) => {
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
    
    fetch(`${API_URL}/api/resultados-influencer/${operationId}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('No se pudieron cargar los datos de influencers');
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
      total: usuario.total_multimedia,
      porcentaje: usuario.porcentaje
    }));
  };

  // Prepara datos para el gráfico circular de tipos de contenido
  const prepararDatosTipos = () => {
    if (!datos || !datos.total_por_tipo) return [];
    
    return Object.entries(datos.total_por_tipo).map(([tipo, cantidad]) => ({
      nombre: tipo,
      value: cantidad,
      icono: TIPOS_MULTIMEDIA[tipo] || '📎'
    }));
  };

  // Prepara datos detallados del influencer principal
  const prepararDatosInfluencer = () => {
    if (!datos || !datos.influencer) return [];
    
    const { desglose } = datos.influencer;
    return Object.entries(desglose).map(([tipo, cantidad]) => ({
      nombre: tipo,
      cantidad: cantidad,
      icono: TIPOS_MULTIMEDIA[tipo] || '📎'
    }));
  };

  if (cargando) return <div className="loading-indicator"><div className="spinner"></div></div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!datos || !datos.ranking || datos.ranking.length === 0) {
    return <div className="no-data">No se encontraron datos de multimedia</div>;
  }

  const influencer = datos.influencer;
  const datosBarras = prepararDatosBarras();
  const datosTipos = prepararDatosTipos();
  const datosDetalleInfluencer = prepararDatosInfluencer();

  return (
    <div className="analisis-influencer-container">
      <h2>Análisis de Influencer en el Chat</h2>
      
      {/* Tarjeta del Influencer principal */}
      <div className="influencer-card">
        <div className="influencer-header">
          <h3>👑 Influencer del Chat</h3>
          <div className="influencer-name">{influencer.nombre}</div>
        </div>
        
        <div className="influencer-stats">
          <div className="stat-item">
            <div className="stat-value">{influencer.total_multimedia}</div>
            <div className="stat-label">Elementos compartidos</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{influencer.porcentaje}%</div>
            <div className="stat-label">Del total del chat</div>
          </div>
        </div>
        
        <div className="influencer-details">
          <h4>Desglose por tipo</h4>
          <div className="details-grid">
            {datosDetalleInfluencer.map((item, index) => (
              <div key={index} className="detail-item">
                <span className="detail-icon">{item.icono}</span>
                <span className="detail-nombre">{item.nombre}</span>
                <span className="detail-value">{item.cantidad}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Gráfico de Barras - Top 5 Usuarios */}
      <div className="chart-container">
        <h3>Top 5 Usuarios por Contenido Compartido</h3>
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
              formatter={(value, name) => [`${value} elementos`, 'Total']}
              labelFormatter={(value) => `Usuario: ${value}`}
            />
            <Legend />
            <Bar dataKey="total" name="Elementos compartidos" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Gráfico de Pastel - Tipos de Contenido */}
      <div className="chart-container">
        <h3>Distribución por Tipo de Contenido</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={datosTipos}
              cx="50%"
              cy="50%"
              labelLine={true}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              nameKey="nombre"
              label={({ nombre, icono, percent }) => `${icono} ${nombre}: ${(percent * 100).toFixed(1)}%`}
            >
              {datosTipos.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`${value} elementos`, 'Cantidad']} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AnalisisInfluencer;