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
    console.log(`Analizando fecha: ${fechaStr}, hora: ${horaStr}, formato: ${formato}`);
    
    // Formatear la entrada para crear un objeto Date válido
    const partesFecha = fechaStr.split('/');
    
    if (partesFecha.length !== 3) {
      console.error(`Formato de fecha inválido: ${fechaStr}`);
      return new Date(); // Fecha inválida, devolver fecha actual
    }
    
    // Extraer componentes como string primero para debug
    const parte1 = partesFecha[0];
    const parte2 = partesFecha[1];
    const parte3 = partesFecha[2];
    
    console.log(`Partes de fecha: ${parte1}/${parte2}/${parte3}`);
    
    // Convertir a números
    let diaOrMes1 = parseInt(parte1, 10);
    let diaOrMes2 = parseInt(parte2, 10);
    let anio = parseInt(parte3, 10);
    
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
    
    const ahora = new Date();
    console.log(`Fecha actual: ${ahora.toISOString()}`);
    
    // Casos no ambiguos primero
    if (diaOrMes1 > 12 && diaOrMes2 <= 12) {
      // Definitivamente DD/MM/YYYY
      console.log(`Formato no ambiguo DD/MM: ${diaOrMes1}/${diaOrMes2}/${anio}`);
      return new Date(anio, diaOrMes2 - 1, diaOrMes1, hora, minutos, segundos);
    } 
    else if (diaOrMes1 <= 12 && diaOrMes2 > 12) {
      // Definitivamente MM/DD/YYYY
      console.log(`Formato no ambiguo MM/DD: ${diaOrMes1}/${diaOrMes2}/${anio}`);
      return new Date(anio, diaOrMes1 - 1, diaOrMes2, hora, minutos, segundos);
    }
    
    // Casos ambiguos - ambos valores pueden ser día o mes
    console.log(`Formato ambiguo: ${diaOrMes1}/${diaOrMes2}/${anio}`);
    
    // Probar formato DD/MM/YYYY
    const fechaDDMM = new Date(anio, diaOrMes2 - 1, diaOrMes1, hora, minutos, segundos);
    console.log(`Interpretación DD/MM: ${fechaDDMM.toISOString()}`);
    
    // Probar formato MM/DD/YYYY
    const fechaMMDD = new Date(anio, diaOrMes1 - 1, diaOrMes2, hora, minutos, segundos);
    console.log(`Interpretación MM/DD: ${fechaMMDD.toISOString()}`);
    
    // Verificar cuál está en el futuro
    const esDDMMFuturo = fechaDDMM > ahora;
    const esMMDDFuturo = fechaMMDD > ahora;
    
    console.log(`¿DD/MM en futuro? ${esDDMMFuturo}, ¿MM/DD en futuro? ${esMMDDFuturo}`);
    
    // Si una fecha está en el futuro y la otra no, elegir la que no está en el futuro
    if (esDDMMFuturo && !esMMDDFuturo) {
      console.log(`Eligiendo MM/DD porque DD/MM está en futuro`);
      return fechaMMDD;
    } else if (!esDDMMFuturo && esMMDDFuturo) {
      console.log(`Eligiendo DD/MM porque MM/DD está en futuro`);
      return fechaDDMM;
    }
    
    // Si ambas están en el futuro o ambas en el pasado, elegir la más cercana a hoy
    const diffDDMM = Math.abs(fechaDDMM.getTime() - ahora.getTime());
    const diffMMDD = Math.abs(fechaMMDD.getTime() - ahora.getTime());
    
    if (diffDDMM <= diffMMDD) {
      console.log(`Eligiendo DD/MM por proximidad (diff=${diffDDMM})`);
      return fechaDDMM;
    } else {
      console.log(`Eligiendo MM/DD por proximidad (diff=${diffMMDD})`);
      return fechaMMDD;
    }
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