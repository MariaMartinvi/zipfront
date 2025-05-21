import React, { useState } from 'react';
// Ya no importamos OpenAI directamente
import { getEnvVariable } from './fileService';
// Importar el nuevo servicio
import AzureService from './services/azure/AzureService';

// Componente para manejar la integración directa con Azure OpenAI desde el cliente
const AzureClientComponent = ({ 
  chatContent, 
  onAnalysisComplete, 
  onError, 
  language = 'es',
  analysisParams = {
    relationshipType: 'general',
    participantsCount: 'auto',
    analysisDepth: 'standard'
  }
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [nameMapping, setNameMapping] = useState({});

  // Función para limpiar el contenido antes de enviarlo a Azure
  const cleanContent = (content) => {
    // Mapeo para guardar nombres originales -> iniciales
    const mapping = {};
    
    // Convertir cada línea
    const lines = content.split('\n');
    const cleanedLines = lines.map(line => {
      // Patrón para extraer nombre y mensaje (ya sin fechas)
      const match = line.match(/([^:]+):\s*(.*)/);
      if (match) {
        const [_, name, message] = match;
        const fullName = name.trim();
        
        // Si no hemos visto este nombre antes, crear sus iniciales
        if (!mapping[fullName]) {
          const initials = fullName
            .split(' ')
            .map(word => word[0])
            .join('.');
          mapping[fullName] = initials;
        }
        
        // Devolver línea con iniciales
        return `${mapping[fullName]}: ${message}`;
      }
      return line;
    });
    
    return {
      cleanedContent: cleanedLines.join('\n'),
      nameMapping: mapping
    };
  };

  // Función para restaurar los nombres en la respuesta
  const restoreNames = (content) => {
    let restoredContent = content;
    Object.entries(nameMapping).forEach(([fullName, initials]) => {
      const regex = new RegExp(`\\b${initials}\\b`, 'g');
      restoredContent = restoredContent.replace(regex, fullName);
    });
    return restoredContent;
  };

  // Función principal para analizar el chat con nuevo servicio
  const analyzeChat = async () => {
    if (!chatContent) {
      if (typeof onError === 'function') {
        onError("No hay contenido de chat para analizar");
      } else {
        console.error("No hay contenido de chat para analizar");
      }
      return;
    }

    try {
      setIsAnalyzing(true);
      
      // Limpiar contenido (quitar fechas y convertir nombres a iniciales)
      const { cleanedContent, nameMapping: newNameMapping } = cleanContent(chatContent);
      setNameMapping(newNameMapping);
      
      // Aplicar limitación de caracteres - tomar solo los últimos 10,000 caracteres
      const MAX_CHARS = 10000;
      let limitedContent = cleanedContent;
      
      if (cleanedContent.length > MAX_CHARS) {
        console.log(`Contenido del chat demasiado largo (${cleanedContent.length} caracteres), limitando a los últimos ${MAX_CHARS} caracteres`);
        limitedContent = "...[Contenido anterior truncado]...\n\n" + cleanedContent.substring(cleanedContent.length - MAX_CHARS);
        console.log(`Contenido truncado a ${limitedContent.length} caracteres`);
      }
      
      // Usar el nuevo servicio AzureService para obtener la respuesta
      const result = await AzureService.getResponse(limitedContent, language);
      
      if (result.success && result.response) {
        // Restaurar nombres en la respuesta
        const analysisResult = restoreNames(result.response);
        
        // Pasar los resultados al componente padre
        if (typeof onAnalysisComplete === 'function') {
          onAnalysisComplete(analysisResult);
        }
      } else {
        // Si hay un error en el servicio
        throw new Error(result.error || "Error desconocido al analizar el chat");
      }
      
    } catch (error) {
      console.error("Error al analizar el chat con Azure OpenAI:", error);
      
      // Mostrar detalles técnicos del error para diagnóstico
      console.log("Detalles técnicos del error:", {
        mensaje: error.message,
        tipo: error.constructor.name,
        código: error.status || error.statusCode,
        stack: error.stack
      });
      
      // Manejar errores específicos
      let errorMessage = error.message || "Error desconocido al analizar el chat";
      
      // Verificar si onError es una función antes de llamarla
      if (typeof onError === 'function') {
        onError(errorMessage);
      } else {
        console.error(errorMessage);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Iniciar análisis automáticamente cuando recibimos contenido
  React.useEffect(() => {
    if (chatContent && !isAnalyzing) {
      analyzeChat();
    }
  }, [chatContent]);

  return (
    <div style={{ display: 'none' }}>
      {/* Componente invisible que solo maneja la lógica */}
    </div>
  );
};

export default AzureClientComponent; 