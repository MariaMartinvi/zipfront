/**
 * anonymizationService.js - Servicio para anonimizar datos sensibles
 * 
 * Este servicio implementa funciones para detectar y anonimizar datos sensibles
 * como números de teléfono, emails, y otros identificadores personales.
 */

// Diccionario para mantener consistencia en los reemplazos
let REPLACEMENTS = {
  numbers: {},
  emails: {}
};

/**
 * Resetea los reemplazos para una nueva operación
 */
export const resetReplacements = () => {
  REPLACEMENTS = {
    numbers: {},
    emails: {}
  };
};

/**
 * Detecta y anonimiza correos electrónicos en un texto
 * 
 * @param {string} text - Texto a procesar
 * @returns {string} - Texto con emails anonimizados
 */
export const detectAndAnonymizeEmails = (text) => {
  if (!text || typeof text !== 'string') return text;
  
  // Expresión regular para detectar emails
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
  
  // Reemplazar cada email encontrado
  return text.replace(emailRegex, (match) => anonymizeEmail(match));
};

/**
 * Anonimiza una dirección de correo electrónico
 * 
 * @param {string} email - Email a anonimizar
 * @returns {string} - Email anonimizado
 */
export const anonymizeEmail = (email) => {
  // Si ya tenemos este email en el diccionario, usar el mismo reemplazo
  if (REPLACEMENTS.emails[email]) {
    return REPLACEMENTS.emails[email];
  }
  
  // Extraer la parte del dominio (mantener el dominio)
  const domainMatch = email.match(/@([\w.-]+)/);
  let anonymous;
  
  if (domainMatch) {
    const domain = domainMatch[1];
    anonymous = `email_anon@${domain}`;
  } else {
    anonymous = "email_anon@dominio.com";
  }
  
  // Guardar el reemplazo para futuras ocurrencias
  REPLACEMENTS.emails[email] = anonymous;
  return anonymous;
};

/**
 * Detecta y anonimiza números de teléfono en un texto
 * 
 * @param {string} text - Texto a procesar
 * @returns {string} - Texto con números anonimizados
 */
export const detectAndAnonymizeNumbers = (text) => {
  if (!text || typeof text !== 'string') return text;
  
  // Expresiones regulares para varios formatos de números de teléfono
  const phonePatterns = [
    // Formato internacional: +34 612 345 678
    /(\+\d{1,3}[\s.-]?)?\d{3}[\s.-]?\d{3}[\s.-]?\d{3}/g,
    // Formato con paréntesis: (612) 345 678
    /\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{3}/g,
    // Formato corto: 612345678
    /\b\d{9}\b/g,
    // Otros formatos de número según necesidad
  ];
  
  let processedText = text;
  
  // Aplicar cada patrón
  for (const pattern of phonePatterns) {
    processedText = processedText.replace(pattern, (match) => anonymizeNumber(match));
  }
  
  return processedText;
};

/**
 * Anonimiza un número manteniendo consistencia
 * 
 * @param {string} numberStr - Número a anonimizar
 * @returns {string} - Número anonimizado
 */
export const anonymizeNumber = (numberStr) => {
  // Limpiar el número para la búsqueda en el diccionario
  const cleanNumber = numberStr.replace(/[\s.-]/g, '');
  
  // Si ya tenemos este número en el diccionario, usar el mismo reemplazo
  if (REPLACEMENTS.numbers[cleanNumber]) {
    return REPLACEMENTS.numbers[cleanNumber];
  }
  
  // Anonimizar parcialmente manteniendo estructura
  let result = "";
  let digitCount = 0;
  
  // Determinar cuántos dígitos mantener (aproximadamente la mitad)
  const numDigits = (numberStr.match(/\d/g) || []).length;
  const keepDigits = Math.max(2, Math.floor(numDigits / 2));
  
  for (const char of numberStr) {
    if (/\d/.test(char)) {
      if (digitCount < keepDigits) {
        result += char;  // Mantener este dígito
      } else {
        result += 'X';   // Reemplazar con X
      }
      digitCount++;
    } else {
      result += char;    // Mantener separadores y otros caracteres
    }
  }
  
  // Guardar el reemplazo para futuras ocurrencias
  REPLACEMENTS.numbers[cleanNumber] = result;
  return result;
};

/**
 * Anonimiza todos los datos sensibles en un texto
 * 
 * @param {string} text - Texto a anonimizar
 * @returns {string} - Texto anonimizado
 */
export const anonymizeText = (text) => {
  if (!text || typeof text !== 'string') return text;
  
  // Primero anonimizar emails
  let processedText = detectAndAnonymizeEmails(text);
  
  // Luego anonimizar números de teléfono
  processedText = detectAndAnonymizeNumbers(processedText);
  
  return processedText;
};

/**
 * Obtiene el mapa de reemplazos realizados
 * 
 * @returns {Object} - Diccionario con los reemplazos
 */
export const getReplacementsMap = () => {
  return {
    numbers: { ...REPLACEMENTS.numbers },
    emails: { ...REPLACEMENTS.emails }
  };
}; 