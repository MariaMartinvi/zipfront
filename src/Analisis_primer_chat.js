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
import './styles/Analisis.css';
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

// Función para formatear nombres de meses
const formatearMes = (fechaMes) => {
  if (!fechaMes) return 'N/A';
  
  const [anio, mes] = fechaMes.split('-');
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  
  return `${meses[parseInt(mes) - 1]} ${anio}`;
};

const AnalisisPrimerChat = ({ operationId }) => {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

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
    if (!operationId) {
      setError("No se ha proporcionado un ID de operación");
      setCargando(false);
      return;
    }

    console.log(`Cargando datos de análisis para operación: ${operationId}`);
    const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000';

    // Eliminar parámetro para forzar formato iOS
    const url = `${API_URL}/api/resultados-primer-chat/${operationId}`;
    console.log(`Cargando datos desde: ${url}`);
    
    fetch(url)
      .then(response => {
        console.log(`Respuesta recibida con status: ${response.status}`);
        if (!response.ok) {
          throw new Error(`Error ${response.status}: No se pudieron cargar los datos del primer chat`);
        }
        return response.json();
      })
      .then(data => {
        console.log('Datos recibidos:', data);
        // Verificar formato
        if (!data.formato_chat) {
          console.warn('El formato de chat no está especificado en la respuesta');
        } else {
          console.log('Formato de chat detectado:', data.formato_chat);
        }
        
        setDatos(data);
        setCargando(false);
      })
      .catch(err => {
        console.error("Error cargando datos:", err);
        setError(`Error al cargar los datos: ${err.message}`);
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
          mesFormateado: formatearMes(mes)
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
    
    // Ordenar meses cronológicamente
    const mesesOrdenados = Object.keys(datos.mensajes_por_mes_porcentaje).sort();
    
    // Obtener lista de usuarios para incluir en el gráfico
    const usuariosGrafico = obtenerUsuariosUnicos().filter(usuario => {
      // Verificar si este usuario tiene datos en algún mes
      return mesesOrdenados.some(mes => {
        const datosMes = datos.mensajes_por_mes_porcentaje[mes];
        return datosMes.usuarios && datosMes.usuarios[usuario] && datosMes.usuarios[usuario].porcentaje > 0;
      });
    }).slice(0, 5); // Limitar a 5 usuarios
    
    console.log("Usuarios para el gráfico:", usuariosGrafico);
    
    // Preparar datos para el gráfico
    return mesesOrdenados.map(mes => {
      const datosMes = datos.mensajes_por_mes_porcentaje[mes];
      const datosUsuarios = datosMes.usuarios || {};
      
      // Crear objeto base con el mes
      const resultado = {
        mes,
        mesFormateado: formatearMes(mes),
        total: datosMes.total
      };
      
      // Calcular el total de porcentajes para asegurar que suman 100%
      let totalPorcentaje = 0;
      usuariosGrafico.forEach(usuario => {
        if (datosUsuarios[usuario] && typeof datosUsuarios[usuario].porcentaje === 'number') {
          totalPorcentaje += datosUsuarios[usuario].porcentaje;
        }
      });
      
      // Agregar datos de cada usuario como proporción (0-1)
      usuariosGrafico.forEach(usuario => {
        if (datosUsuarios[usuario] && typeof datosUsuarios[usuario].porcentaje === 'number') {
          // Convertir el porcentaje a una proporción (dividir por 100)
          resultado[usuario] = datosUsuarios[usuario].porcentaje / 100;
        } else {
          // Si no hay datos para este usuario en este mes, asignar 0
          resultado[usuario] = 0;
        }
      });
      
      return resultado;
    });
  };

  // Obtener una lista de usuarios únicos para las leyendas
  const obtenerUsuariosUnicos = () => {
    if (!datos) return [];
    
    const usuarios = new Set();
    
    // Usuarios de tiempo de respuesta
    if (datos.tiempo_respuesta_promedio_mes) {
      console.log("Extrayendo usuarios de tiempo_respuesta_promedio_mes");
      Object.values(datos.tiempo_respuesta_promedio_mes).forEach(usuariosDatos => {
        Object.keys(usuariosDatos).forEach(usuario => {
          console.log(`  - Añadiendo usuario: ${usuario}`);
          usuarios.add(usuario);
        });
      });
    }
    
    // Usuarios de mensajes por mes
    if (datos.mensajes_por_mes_porcentaje) {
      console.log("Extrayendo usuarios de mensajes_por_mes_porcentaje");
      Object.values(datos.mensajes_por_mes_porcentaje).forEach(datosMes => {
        if (datosMes.usuarios) {
          Object.keys(datosMes.usuarios).forEach(usuario => {
            console.log(`  - Añadiendo usuario: ${usuario}`);
            usuarios.add(usuario);
          });
        }
      });
    }
    
    // Si no hay usuarios, verificar mensajes_por_usuario
    if (usuarios.size === 0 && datos.mensajes_por_usuario) {
      console.log("Extrayendo usuarios de mensajes_por_usuario");
      Object.keys(datos.mensajes_por_usuario).forEach(usuario => {
        console.log(`  - Añadiendo usuario: ${usuario}`);
        usuarios.add(usuario);
      });
    }
    
    const listaUsuarios = Array.from(usuarios);
    console.log("Total de usuarios únicos encontrados:", listaUsuarios.length);
    console.log("Lista de usuarios:", listaUsuarios);
    
    return listaUsuarios;
  };

  if (cargando) return null;
  if (error) return <div className="error">Error: {error}</div>;
  if (!datos || !datos.success) {
    return <div className="no-data">No se encontraron datos válidos para el análisis del primer chat</div>;
  }

  const { resumen, primer_mensaje } = datos;

  return (
    <div className="analisis-primer-chat-container">
      <h3>Análisis de Inicio y Actividad del Chat</h3>
      
      {/* Tarjeta de resumen principal */}
      <div className="resumen-card">
                
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
            <XAxis 
              dataKey="nombre" 
              angle={windowWidth <= 480 ? -45 : 0}
              textAnchor={windowWidth <= 480 ? "end" : "middle"}
              height={windowWidth <= 480 ? 60 : 30}
            />
            <YAxis />
            <Tooltip formatter={(value) => [`${value} mensajes`, 'Mensajes']} />
            <Legend />
            <Bar 
              dataKey="mensajes" 
              name="Mensajes" 
              fill="#25D366"
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
              interval={getXAxisInterval()}
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
        <h3>Top 5 Usuarios más Activos</h3>
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
            <Tooltip formatter={(value, name) => [`${value} mensajes`, acortarNombre(name)]} />
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
        <h3>Tendencia del Tiempo de Respuesta (minutos)</h3>
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
              label={{ value: 'Minutos', angle: -90, position: 'insideLeft', offset: -5 }}
              domain={['auto', 'auto']}
            />
            <Tooltip 
              formatter={(value, name) => [`${value} min`, acortarNombre(name)]}
              labelFormatter={(label) => `Tiempo de respuesta: ${label}`}
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
                return <text x={300} y={140} textAnchor="middle">No hay datos disponibles</text>;
              }
              
              // Extraer los nombres de usuario del primer elemento (excluyendo props especiales)
              const primerMes = datosGrafico[0];
              const usuarios = Object.keys(primerMes).filter(
                key => !['mes', 'mesFormateado'].includes(key)
              );
              
              console.log("Usuarios para gráfico de tiempo respuesta:", usuarios);
              
              // Renderizar líneas para cada usuario (máximo 5)
              return usuarios.slice(0, 5).map((usuario, index) => (
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
          <div style={{textAlign: 'center', padding: '20px', color: '#666'}}>
            No hay datos suficientes para mostrar tiempos de respuesta.
          </div>
        ) : null}
      </div>

      {/* NUEVO: Gráfico de porcentaje de mensajes por usuario por mes */}
      <div className="chart-container">
        <h3>Tendencia de Interés (Mensajes por Usuario por Mes)</h3>
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
                  label={{ value: 'Porcentaje', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  formatter={(value, name) => [`${(value * 100).toFixed(1)}%`, acortarNombre(name)]}
                  labelFormatter={(label) => `Distribución mensajes: ${label}`}
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
                    return <text x={150} y={200} textAnchor="middle" fill="#999">No hay datos disponibles</text>;
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
