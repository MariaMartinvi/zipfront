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

// En lugar de esconder el bloque GAME_DATA, lo convierte en las frases de cada persona, en el mismo sitio
// (sección "Frases descriptivas-literales"). Si el bloque no se puede leer, lo quita como siempre.
export const frasesEnLugarDeGameData = (texto) => {
  const idx = texto.indexOf('GAME_DATA:');
  if (idx === -1) return texto;
  const inicio = texto.indexOf('[', idx);
  let fin = -1;
  if (inicio !== -1) {
    let nivel = 0;
    for (let i = inicio; i < texto.length; i++) {
      if (texto[i] === '[') nivel++;
      else if (texto[i] === ']' && --nivel === 0) { fin = i + 1; break; }
    }
  }
  let frases = null;
  try {
    const datos = JSON.parse(texto.slice(inicio, fin));
    frases = (datos[1] || []).filter((f) => f && f.nombre && f.frase)
      .map((f) => `> **${f.nombre}:** «${String(f.frase).trim().replace(/^['"«]+|['"»]+$/g, '').trim()}»`);
  } catch (e) { frases = null; }
  if (!frases || !frases.length || fin === -1) return eliminarGameDataDelTexto(texto);
  const antes = texto.slice(0, idx).replace(/```(?:json)?\s*$/i, '');
  const despues = texto.slice(fin).replace(/^\s*```/, '');
  return eliminarGameDataDelTexto(`${antes}\n${frases.join('\n\n')}\n\n${despues}`);
};
