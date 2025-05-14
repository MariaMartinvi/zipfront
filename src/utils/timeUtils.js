// Función para convertir minutos en formato de horas y minutos
export const formatMinutesToHoursAndMinutes = (minutes) => {
  if (!minutes || isNaN(minutes)) return '0 minutos';
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.floor(minutes % 60);
  
  if (hours === 0) {
    return `${remainingMinutes} minutos`;
  } else if (remainingMinutes === 0) {
    return `${hours} ${hours === 1 ? 'hora' : 'horas'}`;
  } else {
    return `${hours} ${hours === 1 ? 'hora' : 'horas'} y ${remainingMinutes} minutos`;
  }
}; 