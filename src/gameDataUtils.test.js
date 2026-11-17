import { eliminarGameDataDelTexto } from './gameDataUtils';

describe('eliminarGameDataDelTexto', () => {
  test('elimina el bloque completo con encabezado "🎯 Datos juego" y cerca ```json (caso real)', () => {
    const texto = `## Análisis psicológico

Daniel Moreno es resolutivo y Maria es empática.

🎯
Datos juego
\`\`\`json
GAME_DATA:[
["Daniel Moreno", "Maria"],
[
{"nombre": "Daniel Moreno", "frase": " 'Siempre tiene una solución lista.' "},
{"nombre": "Maria", "frase": " 'Es la voz de la empatía.' "}
]
]
\`\`\`

## Conclusión

Un gran equipo.`;

    const limpio = eliminarGameDataDelTexto(texto);

    expect(limpio).not.toContain('GAME_DATA');
    expect(limpio).not.toContain('Datos juego');
    expect(limpio).not.toContain('```');
    expect(limpio).not.toContain('🎯');
    // El contenido del análisis se conserva
    expect(limpio).toContain('Análisis psicológico');
    expect(limpio).toContain('resolutivo');
    expect(limpio).toContain('Conclusión');
  });

  test('elimina GAME_DATA sin encabezado ni cercas', () => {
    const texto = `Análisis del grupo.

GAME_DATA:[["A","B"],[{"nombre":"A","frase":"x"}]]

Fin del análisis.`;

    const limpio = eliminarGameDataDelTexto(texto);
    expect(limpio).not.toContain('GAME_DATA');
    expect(limpio).toContain('Análisis del grupo.');
    expect(limpio).toContain('Fin del análisis.');
  });

  test('no toca textos sin GAME_DATA', () => {
    const texto = 'Análisis normal sin datos de juego embebidos.';
    expect(eliminarGameDataDelTexto(texto)).toBe(texto);
  });
});

describe('frasesEnLugarDeGameData', () => {
  const { frasesEnLugarDeGameData } = require('./gameDataUtils');
  const texto = `## Frases descriptivas-literales

**Frases resumen:**

GAME_DATA:[
["Eva Pan", "Maria"],
[
  {"nombre": "Eva Pan", "frase": " 'Los ingresos tienen cuatro fuentes posibles' "},
  {"nombre": "Maria", "frase": " 'La inactividad se ha apoderado de esta familia' "}
]
]

---
Fin.`;

  test('cambia el bloque en crudo por las frases de cada persona (caso real de la captura)', () => {
    const limpio = frasesEnLugarDeGameData(texto);
    expect(limpio).not.toContain('GAME_DATA');
    expect(limpio).not.toContain('"nombre"');
    expect(limpio).toContain('> **Eva Pan:** «Los ingresos tienen cuatro fuentes posibles»');
    expect(limpio).toContain('> **Maria:** «La inactividad se ha apoderado de esta familia»');
    expect(limpio.indexOf('Frases resumen')).toBeLessThan(limpio.indexOf('Eva Pan:'));
    expect(limpio).toContain('Fin.');
  });

  test('si el bloque no se puede leer, lo quita sin romper el resto', () => {
    const roto = frasesEnLugarDeGameData('Antes.\n\nGAME_DATA:[ ["a", {roto\n]\n\nDespués.');
    expect(roto).not.toContain('GAME_DATA');
    expect(roto).toContain('Antes.');
  });

  test('sin bloque, el texto no cambia', () => {
    expect(frasesEnLugarDeGameData('Nada que cambiar.')).toBe('Nada que cambiar.');
  });
});
