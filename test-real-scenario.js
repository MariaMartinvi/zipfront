/**
 * Test del escenario real del usuario
 */

// Mapeo real que podría estar generando el sistema
const realNameMapping = {
  'Carol Prima': 'Participante 1',
  'Lucre': 'Participante 2', 
  'Daniel Moreno': 'Participante 5'
  // Nota: Solo 3 personas escribieron mensajes, por eso solo hay 3 en el mapeo
};

// Respuesta EXACTA que está viendo el usuario
const userResponse = `GAME_DATA:[
  ["Participante 1", "Participante 2", "Participante 5"],
  [
    {
      "nombre": "Participante 2",
      "frase": " 'La mediadora del amor familiar que siempre encuentra la manera de unir a todos.'"
    },
    {
      "nombre": "Participante 5",
      "frase": " 'La solucionadora de problemas que siempre tiene una sonrisa y un plan.'"
    },
    {
      "nombre": "Participante 7",
      "frase": " 'El cómico del grupo que aligera la carga con una broma en el momento preciso.'"
    }
  ]
]`;

console.log('🔧 TEST DEL ESCENARIO REAL');
console.log('='.repeat(50));

console.log('📝 Mapeo real:', realNameMapping);
console.log('\n📥 Lo que ve el usuario:');
console.log(userResponse);

// Crear mapeo inverso
const inverseMapping = {};
Object.entries(realNameMapping).forEach(([fullName, participantId]) => {
  inverseMapping[participantId] = fullName;
});

console.log('\n🔄 Mapeo inverso:', inverseMapping);

// Aplicar mapeo
let result = userResponse;

// Mapear el primer array
Object.entries(inverseMapping).forEach(([participantId, fullName]) => {
  const quotedPattern = new RegExp(`"${participantId}"`, 'g');
  const before = result;
  result = result.replace(quotedPattern, `"${fullName}"`);
  if (before !== result) {
    console.log(`✅ Mapeado: "${participantId}" → "${fullName}"`);
  }
});

console.log('\n🎯 Resultado después del mapeo:');
console.log(result);

// Análisis del problema
console.log('\n🔍 ANÁLISIS:');
const stillHasParticipant7 = result.includes('"Participante 7"');
console.log(`❌ Aún contiene "Participante 7": ${stillHasParticipant7 ? 'SÍ (PROBLEMA)' : 'NO'}`);

if (stillHasParticipant7) {
  console.log('\n🚨 PROBLEMA IDENTIFICADO:');
  console.log('- Azure generó "Participante 7" pero solo hay 3 participantes en el mapeo');
  console.log('- Esto significa que Azure analizó más participantes de los que realmente escribieron');
  console.log('- Solución: Eliminar objetos con participantes que no están en el mapeo');
  
  // Eliminar participante 7
  const cleanedResult = result.replace(/\s*{\s*"nombre":\s*"Participante 7"[^}]*},?/g, '');
  const finalResult = cleanedResult.replace(/,\s*]/g, ']');
  
  console.log('\n✅ Resultado corregido:');
  console.log(finalResult);
} 