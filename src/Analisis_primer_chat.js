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
  Cell
} from 'recharts';
import './Analisis_primer_chat.css'; // Importar los estilos
// Colores para los gráficos
const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', 
  '#82CA9D', '#F44236', '#E91E63', '#9C27B0', '#673AB7'
];

// Nombres de los días de la semana
const DIAS_SEMANA = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

// Función para formatear fechas
const formatearFecha = (fecha) => {
  if (!fecha) return 'N/A';
  
  const partes = fecha.split('/');
  if (partes.length !== 3) return fecha;
  
  const [dia, mes, anio] = partes;
  const meses = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  
  return `${dia} de ${meses[parseInt(mes) - 1]} de ${anio}`;
};

const AnalisisPrimerChat = ({ operationId }) => {
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
    
    fetch(`${API_URL}/api/resultados-primer-chat/${operationId}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('No se pudieron cargar los datos del primer chat');
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


  
  // Preparar datos para el gráfico de mensajes por día de la semana
  const prepararDatosDiaSemana = () => {
    if (!datos || !datos.actividad_por_dia_semana) return [];
    
    // Asegurarnos de que todos los días de la semana estén representados
    const datosCompletos = [...DIAS_SEMANA].map(dia => ({
      nombre: dia,
      mensajes: datos.actividad_por_dia_semana[dia] || 0
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

  if (cargando) return <div className="loading">Cargando datos del primer chat...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!datos || !datos.success) {
    return <div className="no-data">No se encontraron datos válidos para el análisis del primer chat</div>;
  }

  const { resumen, primer_mensaje } = datos;

  return (
    <div className="analisis-primer-chat-container">
      <h2>Análisis de Inicio y Actividad del Chat</h2>
      
      {/* Tarjeta de resumen principal */}
      <div className="resumen-card">
        <div className="resumen-header">
          <h3>📅 Detalles del Chat</h3>
        </div>
        
        <div className="resumen-content">
          <div className="stat-highlight">
            <div className="stat-value">{formatearFecha(primer_mensaje.fecha)}</div>
            <div className="stat-label">Fecha de inicio del chat</div>
          </div>
          
          <div className="stats-row">
            <div className="stat-item">
              <div className="stat-value">{resumen.total_mensajes.toLocaleString()}</div>
              <div className="stat-label">Mensajes totales</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{resumen.promedio_mensajes_diarios}</div>
              <div className="stat-label">Mensajes por día</div>
            </div>
          </div>
          
          <div className="highlight-box">
            <div className="highlight-title">
              <span className="highlight-icon">👑</span>
              <span>Usuario más activo</span>
            </div>
            <div className="highlight-content">
              <div className="highlight-value">{resumen.usuario_mas_activo.nombre}</div>
              <div className="highlight-detail">con {resumen.usuario_mas_activo.mensajes.toLocaleString()} mensajes</div>
            </div>
          </div>
          
          <div className="activity-highlights">
            <div className="activity-item">
              <div className="activity-label">Día más activo:</div>
              <div className="activity-value">{resumen.dia_semana_mas_activo.dia}</div>
            </div>
            <div className="activity-item">
              <div className="activity-label">Hora más activa:</div>
              <div className="activity-value">{resumen.hora_mas_activa.hora}:00</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Gráfico de actividad por día de la semana */}
      <div className="chart-container">
        <h3>Actividad por Día de la Semana</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={prepararDatosDiaSemana()}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="nombre" />
            <YAxis />
            <Tooltip formatter={(value) => [`${value} mensajes`, 'Mensajes']} />
            <Legend />
            <Bar 
              dataKey="mensajes" 
              name="Mensajes" 
              fill="#0088FE"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Gráfico de actividad por hora del día */}
      <div className="chart-container">
        <h3>Actividad por Hora del Día</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={prepararDatosHora()}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="horaFormateada" 
              interval={1}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis />
            <Tooltip formatter={(value) => [`${value} mensajes`, 'Mensajes']} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="mensajes" 
              name="Mensajes" 
              stroke="#8884d8"
              strokeWidth={2}
              dot={{ stroke: '#8884d8', strokeWidth: 2, r: 4 }}
              activeDot={{ stroke: '#8884d8', strokeWidth: 2, r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Gráfico de mensajes por usuario (top 5) */}
      <div className="chart-container">
        <h3>Top 5 Usuarios más Activos</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={prepararDatosUsuarios()}
              cx="50%"
              cy="50%"
              labelLine={true}
              outerRadius={100}
              fill="#8884d8"
              dataKey="mensajes"
              nameKey="nombre"
              label={({ nombre, mensajes, percent }) => 
                `${nombre}: ${mensajes} (${(percent * 100).toFixed(1)}%)`
              }
            >
              {prepararDatosUsuarios().map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`${value} mensajes`, 'Mensajes']} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AnalisisPrimerChat;