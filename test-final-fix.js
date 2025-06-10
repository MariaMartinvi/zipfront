/**
 * Test final para verificar que la función reconstructNames
 * maneja correctamente las traducciones Participant -> Participante
 * manteniendo los nombres anonimizados en español
 */

// Función reconstructNames corregida (del fileService.js)
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
    // En este caso, queremos mantener los nombres anonimizados, no mapearlos a nombres reales
    const translationMapping = {};
    
    // Para cada participante anonimizado (ej: 'Participante 4')
    Object.values(nameMapping).forEach(participantId => {
      // Mapeo directo español (Participante X -> Participante X) - no cambiar
      translationMapping[participantId] = participantId;
      
      // Mapeo de traducción inglés (Participant X -> Participante X)
      const englishVersion = participantId.replace('Participante', 'Participant');
      if (englishVersion !== participantId) {
        translationMapping[englishVersion] = participantId; // Traducir al español
        console.log(`🌐 Mapeo de traducción creado: "${englishVersion}" → "${participantId}"`);
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
    Object.entries(translationMapping).forEach(([participantKey, spanishName]) => {
      // Usar regex que funcione tanto para texto general como para JSON
      // Busca "Participante X" o "Participant X" con o sin comillas, seguido de delimitadores
      const beforeReplace = reconstructedResponse;
      
      // Si tiene comillas, mantener las comillas
      reconstructedResponse = reconstructedResponse.replace(
        new RegExp(`"${participantKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'g'),
        `"${spanishName}"`
      );
      
      // Si no tiene comillas, mapear sin comillas
      reconstructedResponse = reconstructedResponse.replace(
        new RegExp(`\\b${participantKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b(?=:|\\s|,|\\.|\\n|$)`, 'g'),
        spanishName
      );
      
      if (beforeReplace !== reconstructedResponse) {
        console.log(`✅ Mapeado: "${participantKey}" → "${spanishName}"`);
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

function testFinalFix() {
  console.log('🧪 TEST FINAL: Traducción correcta Participant → Participante');
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

  // RESPUESTA de Azure con nombres en inglés (problema real del usuario)
  const azureResponseWithEnglishNames = `
## Personality Analysis

### Participant 4
- **Main traits:**  
  🔥 **The Overachieving Organizer** – Participant 4 is the glue holding this group together.

### Participant 12
- **Main traits:**  
  🤔 **The Thoughtful Questioner** – Participant 12 asks clarifying questions.

### Participant 5
- **Main traits:**  
  ✨ **The Supportive Collaborator** – Participant 5 provides positive reinforcement.

## 🎯 Game data 
json
GAME_DATA:[
    ["Participant 4", "Participant 12", "Participant 5"],
    [
      {
        "nombre": "Participant 4",
        "frase": " 'If logistics were an Olympic sport, Participant 4 would take home the gold medal.'"
      },
      {
        "nombre": "Participant 12", 
        "frase": " 'Participant 12 is the person who asks the questions everyone is thinking.'"
      },
      {
        "nombre": "Participant 5",
        "frase": " 'When life gives you lemons, Participant 5 makes motivational smoothies.'"
      }
    ]
]

## 💡 Recommendations

- Participant 4 could delegate more to prevent burnout.
- Participant 12 should continue asking questions.
- Participant 5's positive energy is valuable.
  `;

  console.log('📱 MAPEO REAL:');
  console.log(realNameMapping);

  console.log('\n📝 RESPUESTA ORIGINAL (nombres en inglés):');
  console.log(azureResponseWithEnglishNames);

  console.log('\n🔄 APLICANDO CORRECCIÓN...');
  console.log('-'.repeat(40));

  const correctedResponse = reconstructNames(azureResponseWithEnglishNames, realNameMapping);

  console.log('\n✨ RESPUESTA CORREGIDA:');
  console.log('-'.repeat(40));
  console.log(correctedResponse);

  console.log('\n🔍 VERIFICACIONES:');
  console.log('-'.repeat(40));

  // Verificar que NO quedan nombres en inglés
  const hasEnglishNames = correctedResponse.includes('Participant 4') || 
                         correctedResponse.includes('Participant 12') || 
                         correctedResponse.includes('Participant 5');
  console.log(`❌ ¿Quedan nombres en inglés? ${hasEnglishNames}`);

  // Verificar que SÍ aparecen los nombres en español
  const hasSpanishNames = correctedResponse.includes('Participante 4') && 
                         correctedResponse.includes('Participante 12') && 
                         correctedResponse.includes('Participante 5');
  console.log(`✅ ¿Aparecen nombres en español? ${hasSpanishNames}`);

  // Verificar que NO aparecen números de teléfono (queremos mantener anonimato)
  const hasPhoneNumbers = correctedResponse.includes('+346758XXXXX') || 
                         correctedResponse.includes('+346878XXXXX') || 
                         correctedResponse.includes('+346180XXXXX');
  console.log(`❌ ¿Aparecen números de teléfono? ${hasPhoneNumbers} (debería ser false)`);

  // Verificar GAME_DATA
  const gameDataMatch = correctedResponse.match(/GAME_DATA:\[([\s\S]*?)\]/);
  if (gameDataMatch) {
    console.log('\n🎯 VERIFICACIÓN DE GAME_DATA:');
    console.log('-'.repeat(30));
    
    try {
      const jsonStr = gameDataMatch[0].replace('GAME_DATA:', '');
      const parsedData = JSON.parse(jsonStr);
      console.log('✅ GAME_DATA se puede parsear correctamente');
      console.log('👥 Usuarios:', parsedData[0]);
      console.log('📰 Headlines:', parsedData[1]?.length || 0, 'elementos');
      
      // Verificar que los usuarios están en español
      const usersInSpanish = parsedData[0].every(user => user.startsWith('Participante'));
      console.log(`✅ ¿Usuarios en español? ${usersInSpanish}`);
      
      // Verificar que los headlines tienen nombres en español
      const headlinesInSpanish = parsedData[1].every(headline => 
        headline.nombre && headline.nombre.startsWith('Participante')
      );
      console.log(`✅ ¿Headlines en español? ${headlinesInSpanish}`);
      
    } catch (error) {
      console.log('❌ Error parseando GAME_DATA:', error.message);
    }
  }

  console.log('\n🎉 RESULTADO FINAL:');
  console.log('='.repeat(60));
  
  const success = !hasEnglishNames && hasSpanishNames && !hasPhoneNumbers;
  console.log(success ? '🎉 ¡PROBLEMA RESUELTO!' : '❌ NECESITA MÁS TRABAJO');
  
  if (success) {
    console.log('✅ Azure → Participant X → Participante X');
    console.log('✅ El juego funcionará correctamente');
    console.log('✅ Los nombres se mantienen anonimizados');
    console.log('✅ No debería haber más errores de "gameData no válido"');
  }
  
  return {
    success,
    originalResponse: azureResponseWithEnglishNames,
    correctedResponse,
    nameMapping: realNameMapping
  };
}

// Ejecutar el test
console.log('🚀 Iniciando test final...');
testFinalFix(); 