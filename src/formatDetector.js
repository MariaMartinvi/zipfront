/**
 * formatDetector.js - Detector de formato de chats
 * 
 * Implementación en JavaScript del detector de formato de archivos de chat
 * basado en el código backend original de Python.
 */

/**
 * Detecta el formato de un archivo de chat basado en sus primeras líneas
 * 
 * @param {string[]} lines - Líneas del archivo para analizar
 * @param {boolean} debug - Si debe mostrar mensajes de depuración en consola
 * @returns {string} - Formato detectado ('ios', 'android', o 'desconocido')
 */
export const detectarFormatoChat = (lines, debug = false) => {
  if (debug) console.log('Detectando formato de chat...');
  
  if (!lines || lines.length === 0) {
    if (debug) console.log('No hay líneas para analizar');
    return 'desconocido';
  }
  
  // Patrones para diferentes formatos de chat
  const patronIOS = /^\[(\d{1,2}\/\d{1,2}\/\d{2}),\s*(\d{1,2}:\d{2}(?::\d{2})?)\]\s*([^:]+):\s*(.*)$/;
  const patronAndroid = /^(\d{1,2}\/\d{1,2}\/\d{2}),\s*(\d{1,2}:\d{2})\s*-\s*([^:]+):\s*(.+)/;
  
  let matchesIOS = 0;
  let matchesAndroid = 0;
  let matchesDesconocido = 0;
  
  // Analizar solo las primeras 20 líneas no vacías
  const linesToCheck = lines.filter(line => line.trim() !== '').slice(0, 20);
  
  for (const line of linesToCheck) {
    if (patronIOS.test(line)) {
      matchesIOS++;
    } else if (patronAndroid.test(line)) {
      matchesAndroid++;
    } else {
      matchesDesconocido++;
    }
  }
  
  if (debug) {
    console.log(`Análisis de formato:
    - Líneas iOS: ${matchesIOS}
    - Líneas Android: ${matchesAndroid}
    - Líneas desconocidas: ${matchesDesconocido}`);
  }
  
  // Determinar el formato basado en número de coincidencias
  if (matchesIOS > matchesAndroid && matchesIOS > 3) {
    if (debug) console.log('Formato detectado: iOS');
    return 'ios';
  } else if (matchesAndroid > matchesIOS && matchesAndroid > 3) {
    if (debug) console.log('Formato detectado: Android');
    return 'android';
  } else {
    if (debug) console.log('Formato no reconocido');
    return 'desconocido';
  }
};

/**
 * Detecta el formato de un archivo de chat completo
 * 
 * @param {string} fileContent - Contenido completo del archivo
 * @param {string|null} formatoForzado - Formato forzado (opcional)
 * @param {boolean} debug - Si debe mostrar mensajes de depuración
 * @returns {string} - Formato detectado
 */
export const detectarFormatoArchivo = (fileContent, formatoForzado = null, debug = false) => {
  // Si se especifica un formato forzado, usarlo sin detección
  if (formatoForzado) {
    if (debug) console.log(`Usando formato forzado: ${formatoForzado}`);
    return formatoForzado;
  }
  
  // Dividir el contenido en líneas
  const lines = fileContent.split(/\r?\n/);
  
  return detectarFormatoChat(lines, debug);
};

/**
 * Verifica si un archivo es probablemente un archivo de texto de chat
 * basado en su nombre o extensión
 * 
 * @param {string} fileName - Nombre del archivo
 * @returns {boolean} - true si es probablemente un archivo de chat
 */
export const isProbableChatFile = (fileName) => {
  // Comprobar por extensión
  if (fileName.endsWith('.txt') || fileName.endsWith('.csv')) {
    // Comprobar por palabras clave en el nombre
    const lowerName = fileName.toLowerCase();
    if (lowerName.includes('chat') || 
        lowerName.includes('whatsapp') || 
        lowerName.includes('telegram') || 
        lowerName.includes('message') ||
        lowerName.includes('conversation')) {
      return true;
    }
  }
  return false;
}; 