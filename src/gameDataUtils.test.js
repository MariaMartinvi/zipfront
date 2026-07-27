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
