/**
 * Utilidades para procesamiento de fechas en análisis de chats
 */

/**
 * Parsea una fecha y hora de formato de chat (iOS o Android) a un objeto Date de JavaScript
 * @param {string} fechaStr - Cadena con la fecha en formato dd/mm/yy o dd/mm/yyyy
 * @param {string} horaStr - Cadena con la hora en formato hh:mm(:ss)
 * @param {string} formato - Formato del chat ('ios' o 'android')
 * @returns {Date} - Objeto Date válido
 */
export const parseDateTime = (fechaStr, horaStr, formato) => {
  try {
    // Formatear la entrada para crear un objeto Date válido
    const partesFecha = fechaStr.split('/');
    
    if (partesFecha.length !== 3) {
      console.error(`Formato de fecha inválido: ${fechaStr}`);
      return new Date(); // Fecha inválida, devolver fecha actual
    }
    
    let dia = parseInt(partesFecha[0], 10);
    let mes = parseInt(partesFecha[1], 10) - 1; // Meses en JS son 0-11
    let anio = parseInt(partesFecha[2], 10);
    
    // Ajustar año si es formato de 2 dígitos
    if (anio < 100) {
      anio += 2000; // Asumimos años 2000+
    }
    
    // Parsear la hora
    const partesHora = horaStr.split(':');
    let hora = parseInt(partesHora[0], 10) || 0;
    let minutos = parseInt(partesHora[1], 10) || 0;
    let segundos = 0;
    
    if (partesHora.length > 2) {
      segundos = parseInt(partesHora[2], 10) || 0;
    }
    
    // Crear objeto Date
    return new Date(anio, mes, dia, hora, minutos, segundos);
  } catch (error) {
    console.error(`Error parseando fecha/hora (${fechaStr} ${horaStr}): ${error.message}`);
    return new Date(); // En caso de error, devolver fecha actual
  }
};

/**
 * Convierte una fecha en formato "dd/mm/yy hh:mm" a un objeto Date
 * @param {string} fechaHoraStr - Fecha y hora en formato "dd/mm/yy hh:mm"
 * @returns {Date} - Objeto Date
 */
export const stringToDate = (fechaHoraStr) => {
  try {
    const [fechaStr, horaStr] = fechaHoraStr.split(' ');
    return parseDateTime(fechaStr, horaStr);
  } catch (error) {
    console.error(`Error convirtiendo string a fecha: ${error.message}`);
    return new Date();
  }
};

/**
 * Determina si la fecha es válida (no es NaN)
 * @param {Date} fecha - Objeto Date a validar
 * @returns {boolean} - true si la fecha es válida
 */
export const esDateValido = (fecha) => {
  return fecha instanceof Date && !isNaN(fecha.getTime());
}; 