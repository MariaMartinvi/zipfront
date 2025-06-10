/**
 * Prueba específica para verificar que la función reconstructNames
 * maneja correctamente las traducciones Participant -> Participante
 */

// Función reconstructNames actualizada (copiada de fileService.js)
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
    
    // Crear un mapeo inverso (de participante ID a nombres completos)
    const inverseMapping = {};
    Object.entries(nameMapping).forEach(([fullName, participantId]) => {
      inverseMapping[participantId] = fullName;
    });

    console.log('🔄 Mapeo inverso creado:', inverseMapping);

    // NUEVO: Crear mapeo de traducciones (manejar Participant -> Participante)
    const translationMapping = {};
    Object.entries(inverseMapping).forEach(([participantId, fullName]) => {
      // Si Azure devuelve en inglés "Participant X", mapearlo al español "Participante X"
      const englishVersion = participantId.replace('Participante', 'Participant');
      if (englishVersion !== participantId) {
        translationMapping[englishVersion] = fullName;
        console.log(`🌐 Mapeo de traducción creado: "${englishVersion}" → "${fullName}"`);
      }
      
      // También el mapeo original
      translationMapping[participantId] = fullName;
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
    Object.entries(translationMapping).forEach(([participantKey, fullName]) => {
      // Usar regex que funcione tanto para texto general como para JSON
      // Busca "Participante X" o "Participant X" con o sin comillas, seguido de delimitadores
      const beforeReplace = reconstructedResponse;
      
      // Si tiene comillas, mantener las comillas
      reconstructedResponse = reconstructedResponse.replace(
        new RegExp(`"${participantKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'g'),
        `"${fullName}"`
      );
      
      // Si no tiene comillas, mapear sin comillas
      reconstructedResponse = reconstructedResponse.replace(
        new RegExp(`\\b${participantKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b(?=:|\\s|,|\\.|\\n|$)`, 'g'),
        fullName
      );
      
      if (beforeReplace !== reconstructedResponse) {
        console.log(`✅ Mapeado: "${participantKey}" → "${fullName}"`);
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

function testParticipantTranslation() {
  console.log('🧪 TEST: Traducción de Participant -> Participante');
  console.log('='.repeat(60));

  // Mapeo real del usuario (como aparece en los logs)
  const nameMapping = {
    '+346593XXXXX': 'Participante 1',
    '+346209XXXXX': 'Participante 2', 
    '+346597XXXXX': 'Participante 3',
    '+346758XXXXX': 'Participante 4',
    '+346180XXXXX': 'Participante 5',
    '+346878XXXXX': 'Participante 12'
  };

  // Respuesta simulada de Azure que devuelve nombres en inglés (problema real)
  const azureResponseWithEnglishNames = `
## Personality Analysis

### Participant 4
- **Main traits:**  
  🔥 **The Overachieving Organizer** – Participant 4 is the glue holding this group together.
  💬 **The Community Diplomat** – Handles group dynamics tactfully.

### Participant 12
- **Main traits:**  
  🤔 **The Thoughtful Questioner** – Participant 12 asks clarifying questions.
  📚 **The Learning Enthusiast** – Always eager to understand new processes.

### Participant 5
- **Main traits:**  
  ✨ **The Supportive Collaborator** – Participant 5 provides positive reinforcement.
  💯 **The Grateful Contributor** – Consistently acknowledges others' efforts.

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

- Participant 4 could delegate more to prevent burnout.
- Participant 12 should continue asking questions - it helps everyone.
- Participant 5's positive energy is contagious and valuable.
  `;

  console.log('📝 RESPUESTA ORIGINAL DE AZURE (con nombres en inglés):');
  console.log('-'.repeat(40));
  console.log(azureResponseWithEnglishNames);

  console.log('\n🔄 APLICANDO reconstructNames con traducción...');
  console.log('-'.repeat(40));

  const reconstructedResponse = reconstructNames(azureResponseWithEnglishNames, nameMapping);

  console.log('\n✨ RESPUESTA DESPUÉS DE RECONSTRUCCIÓN:');
  console.log('-'.repeat(40));
  console.log(reconstructedResponse);

  console.log('\n🔍 VERIFICACIONES:');
  console.log('-'.repeat(40));

  // Verificar que los nombres en inglés se cambiaron
  const hasParticipant4 = reconstructedResponse.includes('Participant 4');
  const hasParticipant12 = reconstructedResponse.includes('Participant 12'); 
  const hasParticipant5 = reconstructedResponse.includes('Participant 5');

  console.log(`❌ ¿Quedan nombres en inglés "Participant 4"? ${hasParticipant4}`);
  console.log(`❌ ¿Quedan nombres en inglés "Participant 12"? ${hasParticipant12}`);
  console.log(`❌ ¿Quedan nombres en inglés "Participant 5"? ${hasParticipant5}`);

  // Verificar que aparecen los nombres reales
  const hasRealName4 = reconstructedResponse.includes(nameMapping['+346758XXXXX']);
  const hasRealName12 = reconstructedResponse.includes(nameMapping['+346878XXXXX']); 
  const hasRealName5 = reconstructedResponse.includes(nameMapping['+346180XXXXX']);

  console.log(`✅ ¿Aparece el nombre real de Participante 4? ${hasRealName4}`);
  console.log(`✅ ¿Aparece el nombre real de Participante 12? ${hasRealName12}`);
  console.log(`✅ ¿Aparece el nombre real de Participante 5? ${hasRealName5}`);

  // Verificar GAME_DATA específicamente
  const gameDataMatch = reconstructedResponse.match(/GAME_DATA:\[([\s\S]*?)\]/);
  if (gameDataMatch) {
    console.log('\n🎯 VERIFICACIÓN DE GAME_DATA:');
    console.log('-'.repeat(30));
    const gameDataContent = gameDataMatch[1];
    console.log('Contenido de GAME_DATA después del mapping:');
    console.log(gameDataContent);
    
    // Verificar que no quedan nombres en inglés en GAME_DATA
    const englishInGameData = gameDataContent.includes('Participant');
    console.log(`❌ ¿Quedan nombres en inglés en GAME_DATA? ${englishInGameData}`);
    
    // Intentar parsear el JSON para verificar estructura
    try {
      const jsonStr = gameDataMatch[0].replace('GAME_DATA:', '');
      const parsedData = JSON.parse(jsonStr);
      console.log('✅ GAME_DATA se puede parsear correctamente:', parsedData);
    } catch (error) {
      console.log('❌ Error parseando GAME_DATA:', error.message);
    }
  }

  console.log('\n🎉 TEST COMPLETADO');
  console.log('='.repeat(60));
  
  // Resultado del test
  const success = !hasParticipant4 && !hasParticipant12 && !hasParticipant5 && 
                 hasRealName4 && hasRealName12 && hasRealName5;
  
  console.log(success ? '🎉 ¡TEST EXITOSO!' : '❌ TEST FALLIDO');
  
  return {
    success,
    originalResponse: azureResponseWithEnglishNames,
    reconstructedResponse,
    nameMapping
  };
}

// Ejecutar el test si este archivo se ejecuta directamente
if (typeof module !== 'undefined' && require.main === module) {
  testParticipantTranslation();
} else {
  // Si se importa desde Node.js, exportar la función
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { testParticipantTranslation, reconstructNames };
  } else {
    // Si se ejecuta en el navegador, hacer disponible globalmente
    window.testParticipantTranslation = testParticipantTranslation;
  }
} 