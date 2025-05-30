/**
 * Test para debuggear el problema específico del mapping en GAME_DATA
 */

// Simular el nameMapping que podría estar generando el sistema
const simulatedNameMapping = {
  'Carol Prima': 'Participante 1',
  'Laura Pricurro': 'Participante 2', 
  'Lucre': 'Participante 3',
  'Alex': 'Participante 4',
  'Daniel Moreno': 'Participante 5',
  'Maribel Mov': 'Participante 6',
  'Sergio Primo': 'Participante 7'
};

// Respuesta simulada que refleja exactamente lo que está viendo el usuario
const azureResponseWithIssue = `
GAME_DATA:[
  ["Participante 1", "Participante 2", "Participante 3", "Participante 4", "Participante 5", "Participante 6", "Participante 7"],
  [
    {
      "nombre": "Participante 2",
      "frase": " 'La mediadora emocional que siempre encuentra la forma de unir a la familia.'"
    },
    {
      "nombre": "Participante 3",
      "frase": " 'El observador silencioso que a veces se siente perdido en la conversación.'"
    },
    {
      "nombre": "Participante 5",
      "frase": " 'El alma del grupo, siempre listo para hacer reír y recordar momentos felices.'"
    },
    {
      "nombre": "Participante 6",
      "frase": " 'El organizador que mantiene a todos en la misma página, pero a veces olvida que no todo es logística.'"
    },
    {
      "nombre": "Participante 7",
      "frase": " 'El apoyo emocional que se asegura de que todos se sientan bien, pero a veces necesita cuidar de sí mismo.'"
    },
    {
      "nombre": "Participante 8",
      "frase": " 'El entusiasta del grupo, siempre trayendo alegría, pero a veces desconectado de la tristeza.'"
    },
    {
      "nombre": "Participante 9",
      "frase": " 'El conector que une a todos, pero que a veces olvida expresar sus propios sentimientos.'"
    }
  ]
]
`;

// Función reconstructNames actualizada con validación (del fileService.js)
const reconstructNames = (response, nameMapping) => {
  try {
    let reconstructedResponse = response;
    
    // Crear un mapeo inverso (de participante ID a nombres completos)
    const inverseMapping = {};
    Object.entries(nameMapping).forEach(([fullName, participantId]) => {
      inverseMapping[participantId] = fullName;
    });

    console.log('🔄 Mapeo inverso creado:', inverseMapping);

    // Primero, manejar específicamente la sección GAME_DATA
    const gameDataMatch = reconstructedResponse.match(/GAME_DATA:\[([\s\S]*?)\]/);
    if (gameDataMatch) {
      let gameDataContent = gameDataMatch[1];
      console.log('🎯 Contenido GAME_DATA original:', gameDataContent);
      
      // Detectar participantes que no están en el mapeo (Azure inventó participantes)
      const allParticipantsInGameData = gameDataContent.match(/"Participante \d+"/g) || [];
      const unmappedParticipants = allParticipantsInGameData.filter(p => {
        const cleanParticipant = p.replace(/"/g, '');
        return !inverseMapping.hasOwnProperty(cleanParticipant);
      });
      
      if (unmappedParticipants.length > 0) {
        console.warn('⚠️ PROBLEMA: Azure inventó participantes que no existen en el chat:', unmappedParticipants);
        console.warn('⚠️ Esto viola las instrucciones del prompt. Los participantes válidos son:', Object.keys(inverseMapping));
        
        // Eliminar los objetos con participantes inventados
        let cleanedGameDataContent = gameDataContent;
        unmappedParticipants.forEach(unmappedParticipant => {
          const cleanParticipant = unmappedParticipant.replace(/"/g, '');
          console.log(`🧹 Eliminando objeto con participante inventado: ${cleanParticipant}`);
          
          // Eliminar el objeto completo que contiene este participante inventado
          const objectPattern = new RegExp(`\\s*{[^}]*"nombre":\\s*"${cleanParticipant}"[^}]*},?`, 'g');
          cleanedGameDataContent = cleanedGameDataContent.replace(objectPattern, '');
        });
        
        // Limpiar comas extra que puedan haber quedado
        cleanedGameDataContent = cleanedGameDataContent.replace(/,\s*]/g, ']');
        cleanedGameDataContent = cleanedGameDataContent.replace(/,\s*,/g, ',');
        
        gameDataContent = cleanedGameDataContent;
        console.log('🧹 Contenido GAME_DATA después de limpiar participantes inventados:', gameDataContent);
      }
      
      // Reemplazar participantes en el contenido de GAME_DATA
      Object.entries(inverseMapping).forEach(([participantId, fullName]) => {
        // Reemplazar dentro de strings JSON con comillas
        const quotedPattern = new RegExp(`"${participantId}"`, 'g');
        const beforeReplace = gameDataContent;
        gameDataContent = gameDataContent.replace(quotedPattern, `"${fullName}"`);
        if (beforeReplace !== gameDataContent) {
          console.log(`✅ En GAME_DATA: "${participantId}" → "${fullName}"`);
        }
      });
      
      console.log('🎯 Contenido GAME_DATA después del mapping:', gameDataContent);
      
      // Reemplazar la sección completa en la respuesta
      reconstructedResponse = reconstructedResponse.replace(
        /GAME_DATA:\[([\s\S]*?)\]/,
        `GAME_DATA:[${gameDataContent}]`
      );
    }

    // Luego, reconstruir participantes en el resto del texto usando solo el mapeo
    Object.entries(inverseMapping).forEach(([participantId, fullName]) => {
      // Buscar patrones como "Participante X" o "Participante X:" o "Participante X " o "Participante X," o "Participante X." o "Participante X\n"
      const pattern = new RegExp(`\\b${participantId}\\b(?=:|\\s|,|\\.|\\n|$)`, 'g');
      const beforeReplace = reconstructedResponse;
      reconstructedResponse = reconstructedResponse.replace(pattern, fullName);
      if (beforeReplace !== reconstructedResponse) {
        console.log(`✅ En texto general: "${participantId}" → "${fullName}"`);
      }
    });

    return reconstructedResponse;
  } catch (error) {
    console.error('Error reconstruyendo nombres:', error);
    return response;
  }
};

function debugMappingIssue() {
  console.log('🐛 DEBUG: Problema específico del mapping');
  console.log('='.repeat(70));

  console.log('📝 Mapeo simulado:', simulatedNameMapping);
  console.log('\n📥 Respuesta de Azure (como la que ve el usuario):');
  console.log(azureResponseWithIssue);

  console.log('\n🔄 Aplicando reconstructNames...');
  console.log('-'.repeat(50));

  const result = reconstructNames(azureResponseWithIssue, simulatedNameMapping);

  console.log('\n✨ Resultado final:');
  console.log('-'.repeat(50));
  console.log(result);

  // Análisis específico del problema
  console.log('\n🔍 ANÁLISIS DEL PROBLEMA:');
  console.log('-'.repeat(50));

  const gameDataMatch = result.match(/GAME_DATA:\[([\s\S]*?)\]/);
  if (gameDataMatch) {
    const content = gameDataMatch[1];
    
    // Verificar si faltan algunos participantes
    const participantesEnObjetos = content.match(/"nombre":\s*"([^"]+)"/g) || [];
    console.log('👥 Participantes encontrados en objetos:', participantesEnObjetos);

    // Verificar el primer array
    const firstArrayMatch = content.match(/\[([\s\S]*?)\]/);
    if (firstArrayMatch) {
      console.log('🎯 Primer array:', firstArrayMatch[1]);
    }

    // Buscar participantes que no se mapearon
    const unmappedParticipants = content.match(/"Participante \d+"/g) || [];
    if (unmappedParticipants.length > 0) {
      console.log('❌ Participantes no mapeados:', unmappedParticipants);
      
      // Investigar por qué no se mapearon
      unmappedParticipants.forEach(participant => {
        const cleanParticipant = participant.replace(/"/g, '');
        console.log(`   🔍 ${cleanParticipant}:`);
        console.log(`      - ¿Está en el mapeo inverso? ${simulatedNameMapping.hasOwnProperty(cleanParticipant) ? 'NO' : 'SÍ'}`);
        console.log(`      - Buscando en mapeo... ${Object.values(simulatedNameMapping).includes(cleanParticipant) ? 'ENCONTRADO' : 'NO ENCONTRADO'}`);
      });
    } else {
      console.log('✅ Todos los participantes fueron mapeados correctamente');
    }
  }

  console.log('\n🎉 DEBUG COMPLETADO');
  console.log('='.repeat(70));
}

// Ejecutar el debug
debugMappingIssue(); 