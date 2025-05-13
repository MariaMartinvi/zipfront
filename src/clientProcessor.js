/**
 * clientProcessor.js - Coordinador de procesamiento cliente
 * 
 * Este servicio coordina el proceso completo de extraer un archivo ZIP y
 * anonimizar su contenido, todo en el lado del cliente.
 */

import { extractZip, createZip, isText } from './zipService';
import { anonymizeText, resetReplacements, getReplacementsMap } from './anonymizationService';

/**
 * Procesa un archivo ZIP: extrae, anonimiza y devuelve resultados
 * 
 * @param {File} zipFile - El archivo ZIP a procesar
 * @returns {Promise<Object>} - Resultado de la operación con archivos procesados
 */
export const processZipFile = async (zipFile) => {
  try {
    console.log(`Iniciando procesamiento completo de: ${zipFile.name}`);
    
    // Paso 1: Extraer el ZIP
    const extractionResult = await extractZip(zipFile);
    
    // Si hay un error en la extracción, propagar el error
    if (extractionResult.status !== 'success') {
      throw new Error(extractionResult.error || 'Error en la extracción');
    }
    
    const { operation_id, files } = extractionResult;
    
    // Paso 2: Anonimizar archivos de texto
    // Resetear el mapa de reemplazos para esta operación
    resetReplacements();
    
    // Anonimizar archivos que contienen texto
    const processedFiles = files.map(file => {
      // Solo anonimizar si es un archivo de texto
      if (file.has_text && typeof file.content === 'string') {
        // Anonimizar el contenido del archivo
        const anonymizedContent = anonymizeText(file.content);
        
        // Actualizar el contenido del archivo
        return {
          ...file,
          content: anonymizedContent,
          anonymized: true
        };
      }
      
      // Para archivos que no son de texto, mantener sin cambios
      return file;
    });
    
    // Obtener las estadísticas de la anonimización
    const replacementsMap = getReplacementsMap();
    const anonymizedNumbers = Object.keys(replacementsMap.numbers).length;
    const anonymizedEmails = Object.keys(replacementsMap.emails).length;
    
    // Crear objeto de resultado similar al que devolvía el backend
    const result = {
      status: 'success',
      operation_id,
      files: processedFiles.map(file => ({
        name: file.name,
        size: file.content.length || (file.content.byteLength || 0),
        path: file.path,
        operation_id,
        has_text: file.has_text,
        anonymized: file.anonymized || false,
        // No incluimos el contenido en la respuesta principal para ahorrar memoria
        // El contenido se accederá directamente desde la colección de archivos
      })),
      anonymized: true,
      anonymizationStats: {
        anonymizedNumbers,
        anonymizedEmails,
        processedFiles: processedFiles.filter(f => f.has_text).length,
        totalFiles: processedFiles.length
      },
      // Almacenar el mapa de reemplazos para referencia o descarga
      replacementsMap
    };
    
    console.log(`Procesamiento completado. Operación ID: ${operation_id}`);
    
    return {
      ...result,
      // Mantener acceso a los archivos con contenido
      rawFiles: processedFiles
    };
    
  } catch (error) {
    console.error('Error en el procesamiento completo:', error);
    throw new Error(`Error al procesar el archivo: ${error.message}`);
  }
};

/**
 * Descarga todos los archivos procesados como un nuevo ZIP
 * 
 * @param {Object} processingResult - Resultado del procesamiento con rawFiles
 * @returns {Promise<Blob>} - Archivo ZIP como Blob para descargar
 */
export const downloadProcessedFiles = async (processingResult) => {
  try {
    if (!processingResult || !processingResult.rawFiles) {
      throw new Error('No hay archivos procesados disponibles');
    }
    
    const { operation_id, rawFiles } = processingResult;
    const zipName = `all_files_${operation_id}.zip`;
    
    // Crear ZIP con los archivos procesados
    const zipBlob = await createZip(rawFiles, zipName);
    
    // Devolver el blob para su descarga
    return {
      blob: zipBlob,
      filename: zipName
    };
    
  } catch (error) {
    console.error('Error al preparar la descarga:', error);
    throw new Error(`Error al preparar los archivos para descarga: ${error.message}`);
  }
};

/**
 * Obtiene el contenido de un archivo específico
 * 
 * @param {Object} processingResult - Resultado del procesamiento
 * @param {string} filePath - Ruta del archivo a obtener
 * @returns {Object|null} - El archivo solicitado o null si no se encuentra
 */
export const getFileContent = (processingResult, filePath) => {
  if (!processingResult || !processingResult.rawFiles) {
    console.error('No hay archivos procesados disponibles');
    return null;
  }
  
  const file = processingResult.rawFiles.find(f => f.path === filePath);
  if (!file) {
    console.error(`Archivo no encontrado: ${filePath}`);
    return null;
  }
  
  return file;
};

/**
 * Genera un objeto URL para descargar un solo archivo
 * 
 * @param {Object} file - Archivo a descargar
 * @returns {Object} - Objeto con URL y tipo MIME para descarga
 */
export const createDownloadUrl = (file) => {
  if (!file || !file.content) {
    throw new Error('Archivo inválido o sin contenido');
  }
  
  // Determinar el tipo MIME basado en la extensión
  let mime = 'application/octet-stream';  // Por defecto
  const extension = file.name.split('.').pop().toLowerCase();
  
  // Mapa básico de extensiones a tipos MIME
  const mimeTypes = {
    'txt': 'text/plain',
    'html': 'text/html',
    'css': 'text/css',
    'js': 'text/javascript',
    'json': 'application/json',
    'xml': 'application/xml',
    'csv': 'text/csv',
    'pdf': 'application/pdf',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif'
  };
  
  if (mimeTypes[extension]) {
    mime = mimeTypes[extension];
  }
  
  // Crear blob y URL
  let blob;
  
  if (typeof file.content === 'string') {
    blob = new Blob([file.content], { type: mime });
  } else {
    blob = new Blob([file.content], { type: mime });
  }
  
  const url = URL.createObjectURL(blob);
  
  return {
    url,
    mimeType: mime,
    filename: file.name
  };
}; 