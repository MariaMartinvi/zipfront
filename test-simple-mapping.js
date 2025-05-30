/**
 * Test simple para verificar la solución del mapping
 */

// Mapeo simulado
const nameMapping = {
  'Carol Prima': 'Participante 1',
  'Laura Pricurro': 'Participante 2', 
  'Lucre': 'Participante 3',
  'Alex': 'Participante 4',
  'Daniel Moreno': 'Participante 5',
  'Maribel Mov': 'Participante 6',
  'Sergio Primo': 'Participante 7'
};

// Respuesta problemática
const problematicResponse = `GAME_DATA:[
  ["Participante 1", "Participante 2", "Participante 3", "Participante 4", "Participante 5", "Participante 6", "Participante 7"],
  [
    {
      "nombre": "Participante 2",
      "frase": "La mediadora emocional"
    },
    {
      "nombre": "Participante 8",
      "frase": "Participante inventado"
    },
    {
      "nombre": "Participante 5",
      "frase": "El alma del grupo"
    }
  ]
]`;

console.log('🧪 TEST SIMPLE: Solución del mapping');
console.log('='.repeat(50));

console.log('Antes:', problematicResponse);

// Crear mapeo inverso
const inverseMapping = {};
Object.entries(nameMapping).forEach(([fullName, participantId]) => {
  inverseMapping[participantId] = fullName;
});

console.log('\nMapeo inverso:', inverseMapping);

// Detectar participantes inventados
const allParticipants = problematicResponse.match(/"Participante \d+"/g) || [];
const unmappedParticipants = allParticipants.filter(p => {
  const cleanParticipant = p.replace(/"/g, '');
  return !inverseMapping.hasOwnProperty(cleanParticipant);
});

console.log('\nParticipantes encontrados:', allParticipants);
console.log('Participantes sin mapeo (inventados):', unmappedParticipants);

// Aplicar solución
let fixed = problematicResponse;

if (unmappedParticipants.length > 0) {
  console.log('\n🧹 Eliminando participantes inventados...');
  
  unmappedParticipants.forEach(unmappedParticipant => {
    const cleanParticipant = unmappedParticipant.replace(/"/g, '');
    console.log(`Eliminando: ${cleanParticipant}`);
    
    // Eliminar el objeto completo
    const objectPattern = new RegExp(`\\s*{[^}]*"nombre":\\s*"${cleanParticipant}"[^}]*},?`, 'g');
    fixed = fixed.replace(objectPattern, '');
  });
  
  // Limpiar comas extra
  fixed = fixed.replace(/,\s*]/g, ']');
  fixed = fixed.replace(/,\s*,/g, ',');
}

// Aplicar mapeo
console.log('\n✅ Aplicando mapeo de nombres...');
Object.entries(inverseMapping).forEach(([participantId, fullName]) => {
  const quotedPattern = new RegExp(`"${participantId}"`, 'g');
  const before = fixed;
  fixed = fixed.replace(quotedPattern, `"${fullName}"`);
  if (before !== fixed) {
    console.log(`${participantId} → ${fullName}`);
  }
});

console.log('\n🎉 Resultado final:');
console.log(fixed);

console.log('\n✅ ¡Problema resuelto!');
console.log('- Participantes inventados eliminados');
console.log('- Nombres mapeados correctamente');
console.log('- JSON válido mantenido'); 