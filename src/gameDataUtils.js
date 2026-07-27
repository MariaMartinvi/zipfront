// Elimina el bloque GAME_DATA del texto que se muestra al usuario.
// Los datos del juego ya se extraen aparte (window.lastAIResponse), así que
// aquí solo se limpia la presentación: el bloque en sí, las cercas de código
// que lo envuelven y el encabezado tipo "🎯 Datos juego" que a veces genera la IA.
export const eliminarGameDataDelTexto = (texto) => {
  const idx = texto.indexOf('GAME_DATA:');
  if (idx === -1) return texto;

  // Encontrar el final del array por conteo de corchetes
  const arrayStart = texto.indexOf('[', idx);
  let finBloque = texto.indexOf('\n', idx);
  if (finBloque === -1) finBloque = texto.length;
  if (arrayStart !== -1) {
    let nivel = 0;
    for (let i = arrayStart; i < texto.length; i++) {
      if (texto[i] === '[') nivel++;
      else if (texto[i] === ']') {
        nivel--;
        if (nivel === 0) {
          finBloque = i + 1;
          break;
        }
      }
    }
  }

  let antes = texto.slice(0, idx);
  let despues = texto.slice(finBloque);

  // Quitar la cerca de código que lo envolvía (```json ... ```)
  antes = antes.replace(/```(?:json)?\s*$/i, '');
  despues = despues.replace(/^\s*```/, '');

  let resultado = antes + despues;

  // Quitar líneas de encabezado del bloque ("Datos juego", "Game data"...)
  resultado = resultado.replace(/^.*(?:datos\s+(?:del\s+)?juego|game\s*data).*$/gim, '');

  // Quitar líneas huérfanas que solo contienen emojis/símbolos (ej: "🎯")
  resultado = resultado.replace(/^[^\p{L}\p{N}]*🎯[^\p{L}\p{N}]*$/gmu, '');

  return resultado.trim();
};
