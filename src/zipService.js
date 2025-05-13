/**
 * zipService.js - Servicio para manejar descompresión de archivos ZIP en el cliente
 * 
 * Este servicio utiliza la biblioteca JSZip para descomprimir archivos ZIP directamente
 * en el navegador, eliminando la necesidad de enviar el archivo al servidor.
 */

// Importamos JSZip, necesitamos instalarlo con: npm install jszip --save
import JSZip from 'jszip';

/**
 * Extrae un archivo ZIP en el navegador
 * 
 * @param {File} zipFile - Archivo ZIP a descomprimir
 * @returns {Promise<Array>} - Lista de archivos extraídos con sus datos
 */
export const extractZip = async (zipFile) => {
  try {
    console.log(`Descomprimiendo archivo: ${zipFile.name}`);
    
    // Generar un ID único para esta operación
    const operationId = generateOperationId();
    
    // Inicializar el objeto JSZip
    const zip = new JSZip();
    
    // Cargar y parsear el archivo ZIP
    const zipData = await zip.loadAsync(zipFile);
    
    // Lista para almacenar los archivos extraídos
    const extractedFiles = [];
    
    // Procesar cada archivo en el ZIP
    const fileProcessingPromises = [];
    
    // Iterar sobre todos los archivos en el ZIP
    zipData.forEach((relativePath, zipEntry) => {
      // Ignorar directorios
      if (zipEntry.dir) return;
      
      // Crear una promesa para procesar este archivo
      const filePromise = (async () => {
        // Obtener el contenido del archivo como ArrayBuffer (binario) o String (texto)
        let fileContent;
        let isTextFile = isText(relativePath);
        
        if (isTextFile) {
          // Para archivos de texto, obtener como String
          fileContent = await zipEntry.async('string');
        } else {
          // Para archivos binarios, obtener como ArrayBuffer
          fileContent = await zipEntry.async('arraybuffer');
        }
        
        // Extraer solo el nombre del archivo (sin la ruta)
        const fileName = relativePath.split('/').pop();
        
        // Añadir a la lista de archivos extraídos
        extractedFiles.push({
          name: fileName,
          path: relativePath,
          content: fileContent,
          size: fileContent.length || (fileContent.byteLength || 0),
          operation_id: operationId,
          has_text: isTextFile,
          // Inicialmente no está anonimizado
          anonymized: false
        });
      })();
      
      fileProcessingPromises.push(filePromise);
    });
    
    // Esperar a que todos los archivos se procesen
    await Promise.all(fileProcessingPromises);
    
    console.log(`Extracción completada. ${extractedFiles.length} archivos procesados.`);
    
    return {
      status: 'success',
      operation_id: operationId,
      files: extractedFiles,
      anonymized: false
    };
    
  } catch (error) {
    console.error('Error al descomprimir ZIP:', error);
    throw new Error(`Error al descomprimir el archivo: ${error.message}`);
  }
};

/**
 * Genera un ID único para la operación
 * 
 * @returns {string} - ID de operación único
 */
export const generateOperationId = () => {
  return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Comprime una lista de archivos en un nuevo archivo ZIP
 * 
 * @param {Array} files - Lista de archivos a comprimir
 * @param {string} zipName - Nombre para el archivo ZIP resultante
 * @returns {Promise<Blob>} - Archivo ZIP como Blob
 */
export const createZip = async (files, zipName = 'files.zip') => {
  try {
    const zip = new JSZip();
    
    // Añadir cada archivo al ZIP
    files.forEach(file => {
      if (file.has_text) {
        // Para archivos de texto, almacenar como string
        zip.file(file.path, file.content);
      } else {
        // Para archivos binarios, almacenar como ArrayBuffer
        zip.file(file.path, file.content);
      }
    });
    
    // Generar el archivo ZIP
    const zipBlob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 6 // Nivel de compresión (1-9)
      }
    });
    
    return zipBlob;
  } catch (error) {
    console.error('Error al crear ZIP:', error);
    throw new Error(`Error al crear el archivo ZIP: ${error.message}`);
  }
};

/**
 * Verifica si un archivo es probablemente un archivo de texto basado en su extensión
 * 
 * @param {string} filename - Nombre del archivo a verificar
 * @returns {boolean} - true si es un archivo de texto
 */
export const isText = (filename) => {
  const textExtensions = [
    '.txt', '.log', '.csv', '.md', '.json', '.xml', '.html', '.htm',
    '.js', '.jsx', '.ts', '.tsx', '.css', '.scss', '.less',
    '.yaml', '.yml', '.ini', '.conf', '.cfg', '.properties'
  ];
  
  const extension = '.' + filename.split('.').pop().toLowerCase();
  return textExtensions.includes(extension);
}; 