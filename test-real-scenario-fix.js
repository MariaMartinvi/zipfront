/**
 * Test que simula el escenario real del usuario
 * donde Azure devuelve nombres en inglés pero el mapeo está en español
 */

// Función reconstructNames (copiada de fileService.js con los últimos cambios)
const reconstructNames = (response, nameMapping) => {
  try {
    // Verificar que response existe y es una cadena
    if (!response || typeof response !== 'string') {
      console.error('❌ Response es null, undefined o no es string:', response);
      return response || '';
    }
    
    let reconstructedResponse = response;
    
    console.log('🔧 INICIO reconstructNames');
    console.log('📥 NameMapping recibido:', nameMapping);
    
    // Crear un mapeo de participantes anónimos a nombres reales
    // nameMapping: {'+346758XXXXX': 'Participante 4'} -> queremos mapear 'Participante 4' a nombre real
    // Para el caso actual, el mapeo es de teléfonos a participantes anónimos, así que necesitamos:
    // 1. Mapeo de participantes anónimos españoles a nombres reales (cuando tengamos nombres reales)
    // 2. Mapeo de participantes en inglés a participantes en español
    
    // Crear mapeo inverso: de 'Participante X' a nombre real (que es el teléfono por ahora)
    const participantToRealName = {};
    Object.entries(nameMapping).forEach(([realName, participantId]) => {
      participantToRealName[participantId] = realName;
    });
    
    console.log('🔄 Mapeo de participante a nombre real:', participantToRealName);

    // NUEVO: Crear mapeo de traducciones (manejar Participant -> Participante)
    const translationMapping = {};
    
    // Para cada participante en el mapeo (ej: 'Participante 4')
    Object.entries(participantToRealName).forEach(([participantId, realName]) => {
      // Mapeo directo español (Participante X -> nombre real)
      translationMapping[participantId] = realName;
      
      // Mapeo de traducción inglés (Participant X -> nombre real)
      const englishVersion = participantId.replace('Participante', 'Participant');
      if (englishVersion !== participantId) {
        translationMapping[englishVersion] = realName;
        console.log(`🌐 Mapeo de traducción creado: "${englishVersion}" → "${realName}"`);
      }
    });

    console.log('🌐 Mapeo con traducciones creado:', translationMapping);

    // Detectar participantes sin mapeo y eliminar objetos completos
    const gameDataMatch = reconstructedResponse.match(/GAME_DATA:\[([\s\S]*?)\]/);
    if (gameDataMatch) {
      let gameDataContent = gameDataMatch[1];
      console.log('🎯 Contenido GAME_DATA original:', gameDataContent);
      
      // Detectar participantes que no están en el mapeo (tanto en español como en inglés)
      const allParticipantsInGameData = [
        ...(gameDataContent.match(/"Participante \d+"/g) || []),
        ...(gameDataContent.match(/"Participant \d+"/g) || [])
      ];
      
      const unmappedParticipants = allParticipantsInGameData.filter(p => {
        const cleanParticipant = p.replace(/"/g, '');
        return !translationMapping.hasOwnProperty(cleanParticipant);
      });
      
      if (unmappedParticipants.length > 0) {
        console.warn('⚠️ ELIMINANDO participantes inventados por Azure:', [...new Set(unmappedParticipants)]);
        
        // Eliminar los objetos con participantes inventados
        unmappedParticipants.forEach(unmappedParticipant => {
          const cleanParticipant = unmappedParticipant.replace(/"/g, '');
          console.log(`🧹 Eliminando objeto con: ${cleanParticipant}`);
          
          // Eliminar el objeto completo que contiene este participante inventado
          const objectPattern = new RegExp(`\\s*{[^}]*"nombre":\\s*"${cleanParticipant.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^}]*},?`, 'g');
          gameDataContent = gameDataContent.replace(objectPattern, '');
        });
        
        // Limpiar comas extra que puedan haber quedado
        gameDataContent = gameDataContent.replace(/,\s*]/g, ']');
        gameDataContent = gameDataContent.replace(/,\s*,/g, ',');
        
        // Reemplazar la sección completa en la respuesta
        reconstructedResponse = reconstructedResponse.replace(
          /GAME_DATA:\[([\s\S]*?)\]/,
          `GAME_DATA:[${gameDataContent}]`
        );
        
        console.log('🧹 Participantes inventados eliminados');
      }
    }

    // AHORA usar UN SOLO PROCESO para mapear TODA la respuesta (incluyendo traducciones)
    let totalMappings = 0;
    Object.entries(translationMapping).forEach(([participantKey, realName]) => {
      // Usar regex que funcione tanto para texto general como para JSON
      // Busca "Participante X" o "Participant X" con o sin comillas, seguido de delimitadores
      const beforeReplace = reconstructedResponse;
      
      // Si tiene comillas, mantener las comillas
      reconstructedResponse = reconstructedResponse.replace(
        new RegExp(`"${participantKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'g'),
        `"${realName}"`
      );
      
      // Si no tiene comillas, mapear sin comillas
      reconstructedResponse = reconstructedResponse.replace(
        new RegExp(`\\b${participantKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b(?=:|\\s|,|\\.|\\n|$)`, 'g'),
        realName
      );
      
      if (beforeReplace !== reconstructedResponse) {
        console.log(`✅ Mapeado: "${participantKey}" → "${realName}"`);
        totalMappings++;
      }
    });

    console.log(`📊 Total de mappings aplicados: ${totalMappings}`);
    console.log('🔧 FIN reconstructNames');

    return reconstructedResponse;
  } catch (error) {
    console.error('❌ Error reconstruyendo nombres:', error);
    return response;
  }
};

function testRealUserScenario() {
  console.log('🧪 TEST: Escenario real del usuario');
  console.log('='.repeat(60));

  // MAPEO REAL del usuario (tal como aparece en los logs)
  const realNameMapping = {
    '+346593XXXXX': 'Participante 1',
    '+346209XXXXX': 'Participante 2', 
    '+346597XXXXX': 'Participante 3',
    '+346758XXXXX': 'Participante 4',
    '+346180XXXXX': 'Participante 5',
    '+346878XXXXX': 'Participante 12'
  };

  // RESPUESTA REAL de Azure (simulada basada en los logs del usuario)
  const azureResponseInEnglish = `
## Personality Analysis

### Participant 4
- **Main traits:**  
  🔥 **The Overachieving Organizer** – Participant 4 is the glue holding this group together, constantly managing logistics, events, and reminders with a mix of enthusiasm and exhaustion.  
  💬 **The Community Diplomat** – Handles group dynamics tactfully, mediating between participants and ensuring everyone stays informed.

### Participant 12
- **Main traits:**  
  🤔 **The Thoughtful Questioner** – Participant 12 asks clarifying questions to ensure understanding, especially about school processes and activities.
  📚 **The Learning Enthusiast** – Always eager to understand new processes and procedures.

### Participant 5
- **Main traits:**  
  ✨ **The Supportive Collaborator** – Participant 5 provides positive reinforcement and expresses gratitude for organizational efforts.
  💯 **The Grateful Contributor** – Consistently acknowledges others' efforts and shows appreciation.

## 🎯 Game data 
json
GAME_DATA:[
    ["Participant 4", "Participant 12", "Participant 5"],
    [
      {
        "nombre": "Participant 4",
        "frase": " 'If logistics were an Olympic sport, Participant 4 would take home the gold medal every single time.'"
      },
      {
        "nombre": "Participant 12", 
        "frase": " 'Participant 12 is the person who asks the questions everyone else is thinking but afraid to voice.'"
      },
      {
        "nombre": "Participant 5",
        "frase": " 'When life gives you lemons, Participant 5 turns them into a motivational smoothie and shares it with everyone.'"
      }
    ]
]

## 💡 Recommendations

- Participant 4 could delegate more responsibilities to prevent burnout.
- Participant 12 should continue asking questions - it helps the whole group.
- Participant 5's positive energy is contagious and should be celebrated.
  `;

  console.log('📱 MAPEO REAL (teléfonos → participantes):');
  console.log('-'.repeat(40));
  console.log(realNameMapping);

  console.log('\n📝 RESPUESTA ORIGINAL DE AZURE (con nombres en inglés):');
  console.log('-'.repeat(40));
  console.log(azureResponseInEnglish);

  console.log('\n🔄 APLICANDO reconstructNames...');
  console.log('-'.repeat(40));

  const reconstructedResponse = reconstructNames(azureResponseInEnglish, realNameMapping);

  console.log('\n✨ RESPUESTA DESPUÉS DE RECONSTRUCCIÓN:');
  console.log('-'.repeat(40));
  console.log(reconstructedResponse);

  console.log('\n🔍 VERIFICACIONES ESPECÍFICAS:');
  console.log('-'.repeat(40));

  // Verificar que no quedan nombres en inglés
  const stillHasEnglish = reconstructedResponse.includes('Participant 4') || 
                         reconstructedResponse.includes('Participant 12') || 
                         reconstructedResponse.includes('Participant 5');
  console.log(`❌ ¿Quedan nombres en inglés? ${stillHasEnglish}`);

  // Verificar que aparecen los teléfonos (nombres reales en este caso)
  const hasRealNames = reconstructedResponse.includes('+346758XXXXX') && 
                       reconstructedResponse.includes('+346878XXXXX') && 
                       reconstructedResponse.includes('+346180XXXXX');
  console.log(`✅ ¿Aparecen los nombres reales (teléfonos)? ${hasRealNames}`);

  // Verificar GAME_DATA específicamente
  const gameDataMatch = reconstructedResponse.match(/GAME_DATA:\[([\s\S]*?)\]/);
  if (gameDataMatch) {
    console.log('\n🎯 VERIFICACIÓN DE GAME_DATA:');
    console.log('-'.repeat(30));
    const gameDataContent = gameDataMatch[1];
    
    // Intentar parsear el JSON para verificar estructura
    try {
      const jsonStr = gameDataMatch[0].replace('GAME_DATA:', '');
      const parsedData = JSON.parse(jsonStr);
      console.log('✅ GAME_DATA se puede parsear correctamente');
      console.log('📊 Usuarios en el juego:', parsedData[0]);
      console.log('📰 Headlines en el juego:', parsedData[1]?.length || 0, 'elementos');
      
      // Verificar que los nombres en GAME_DATA son los correctos
      const gameDataHasCorrectNames = parsedData[0].every(name => 
        name.startsWith('+346') && name.endsWith('XXXXX')
      );
      console.log(`✅ ¿GAME_DATA tiene nombres correctos? ${gameDataHasCorrectNames}`);
      
    } catch (error) {
      console.log('❌ Error parseando GAME_DATA:', error.message);
    }
  }

  console.log('\n🎉 RESULTADO DEL TEST:');
  console.log('='.repeat(60));
  
  const testPassed = !stillHasEnglish && hasRealNames;
  console.log(testPassed ? '🎉 ¡TEST EXITOSO! El problema está solucionado.' : '❌ TEST FALLIDO');
  
  if (testPassed) {
    console.log('✅ Los nombres en inglés se tradujeron correctamente');
    console.log('✅ Los datos del juego deberían funcionar ahora');
    console.log('✅ Ya no debería aparecer "gameData no válido"');
  }
  
  return {
    success: testPassed,
    originalResponse: azureResponseInEnglish,
    reconstructedResponse,
    nameMapping: realNameMapping
  };
}

// Ejecutar el test
testRealUserScenario(); 