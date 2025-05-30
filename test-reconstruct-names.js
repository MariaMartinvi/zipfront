/**
 * Test específico para verificar la función reconstructNames
 * especialmente con la sección GAME_DATA
 */

// Definir la función reconstructNames directamente aquí (versión actualizada)
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

function testReconstructNames() {
  console.log('🧪 TEST: Función reconstructNames (ACTUALIZADO)');
  console.log('='.repeat(60));

  // Mapeo del ejemplo real del usuario
  const nameMapping = {
    'Boyfriend': 'Participante 1',
    'Maria Martín Villaró': 'Participante 2'
  };

  // Respuesta simulada de Azure con GAME_DATA (como en el ejemplo del usuario)
  const azureResponse = `
## 🧠 Análisis de personalidades

### Participante 1
- **Rol en el grupo:** Líder comunicativo
- **Rasgos principales:** Participante 1 muestra gran iniciativa en las conversaciones.

### Participante 2
- **Rol en el grupo:** Observador reflexivo
- **Rasgos principales:** Participante 2 tiende a ser más reservado pero aporta comentarios valiosos.

## 💡 Frases descriptivas

GAME_DATA:[
  ["Participante 1", "Participante 2"],
  [
    {
      "nombre": "Participante 1",
      "frase": " 'El organizador que siempre tiene un plan, incluso cuando el caos se desata.'"
    },
    {
      "nombre": "Participante 2",
      "frase": " 'El colaborador que nunca se queda sin palabras y siempre tiene una idea brillante en la manga.'"
    }
  ]
]

## 💡 Recomendaciones

- Participante 1 podría dar más espacio a Participante 2 para que participe más.
- Participante 2 debería expresar más sus opiniones.
  `;

  console.log('📝 RESPUESTA ORIGINAL DE AZURE:');
  console.log('-'.repeat(40));
  console.log(azureResponse);

  console.log('\n🔄 APLICANDO reconstructNames...');
  console.log('-'.repeat(40));

  const reconstructedResponse = reconstructNames(azureResponse, nameMapping);

  console.log('\n✨ RESPUESTA DESPUÉS DE RECONSTRUCCIÓN:');
  console.log('-'.repeat(40));
  console.log(reconstructedResponse);

  console.log('\n🔍 VERIFICACIONES:');
  console.log('-'.repeat(40));

  // Verificar que los nombres se cambiaron en el texto general
  const hasBoyfriendInText = reconstructedResponse.includes('Boyfriend');
  const hasMariaInText = reconstructedResponse.includes('Maria Martín Villaró');

  console.log(`✅ Boyfriend aparece en texto general: ${hasBoyfriendInText ? 'SÍ' : 'NO'}`);
  console.log(`✅ Maria Martín Villaró aparece en texto general: ${hasMariaInText ? 'SÍ' : 'NO'}`);

  // Verificar específicamente la sección GAME_DATA
  const gameDataMatch = reconstructedResponse.match(/GAME_DATA:\[([\s\S]*?)\]/);
  if (gameDataMatch) {
    const gameDataContent = gameDataMatch[1];
    console.log('\n🎯 CONTENIDO FINAL DE GAME_DATA:');
    console.log(gameDataContent);
    
    const hasBoyfriendInGameData = gameDataContent.includes('"Boyfriend"');
    const hasMariaInGameData = gameDataContent.includes('"Maria Martín Villaró"');
    
    console.log(`✅ Boyfriend en GAME_DATA: ${hasBoyfriendInGameData ? 'SÍ' : 'NO'}`);
    console.log(`✅ Maria Martín Villaró en GAME_DATA: ${hasMariaInGameData ? 'SÍ' : 'NO'}`);
    
    // Verificar que NO queden participantes sin mapear en OBJETOS
    const stillHasParticipant1InObjects = gameDataContent.includes('"nombre": "Participante 1"');
    const stillHasParticipant2InObjects = gameDataContent.includes('"nombre": "Participante 2"');
    
    console.log(`❌ Objetos aún contienen "nombre": "Participante 1": ${stillHasParticipant1InObjects ? 'SÍ (PROBLEMA)' : 'NO (CORRECTO)'}`);
    console.log(`❌ Objetos aún contienen "nombre": "Participante 2": ${stillHasParticipant2InObjects ? 'SÍ (PROBLEMA)' : 'NO (CORRECTO)'}`);

    // Verificar que el JSON siga siendo válido
    try {
      const gameDataParsed = JSON.parse(`[${gameDataContent}]`);
      console.log('✅ JSON de GAME_DATA sigue siendo válido: SÍ');
      console.log('📊 Datos parseados:', JSON.stringify(gameDataParsed, null, 2));
    } catch (error) {
      console.log('❌ JSON de GAME_DATA inválido:', error.message);
    }
  } else {
    console.log('❌ No se encontró sección GAME_DATA en la respuesta');
  }

  console.log('\n🎉 TEST COMPLETADO');
  console.log('='.repeat(60));
}

// Ejecutar el test
testReconstructNames(); 