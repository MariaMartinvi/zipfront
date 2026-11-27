import { anonymizationService } from './anonymizationService';

// Cada test parte de un mapeo vacío (el servicio es un singleton)
beforeEach(() => anonymizationService.reset());

const anonimizar = (lineas) =>
  anonymizationService.anonymizeParticipants(lineas.join('\n'), 'es').split('\n');

describe('anonymizeParticipants: formatos que ya funcionaban (no romper)', () => {
  test('iOS clásico [dd/mm/aa, hh:mm:ss]', () => {
    const out = anonimizar([
      '[26/7/24, 21:06:01] Maria: Hola',
      '[26/7/24, 21:06:02] Eva Pan: Qué tal',
      '[26/7/24, 21:06:03] Maria: Bien',
    ]);
    expect(out).toEqual([
      '[26/7/24] Participante 1: Hola',
      '[26/7/24] Participante 2: Qué tal',
      '[26/7/24] Participante 1: Bien',
    ]);
    expect(anonymizationService.getAllMappings().participants).toEqual({
      'Maria': 'Participante 1',
      'Eva Pan': 'Participante 2',
    });
  });

  test('Android clásico dd/mm/aa, hh:mm - Nombre', () => {
    const out = anonimizar([
      '26/7/24, 21:06 - Maria: Hola',
      '26/7/24, 21:07 - Eva Pan: Qué tal',
    ]);
    expect(out).toEqual([
      '26/7/24 - Participante 1: Hola',
      '26/7/24 - Participante 2: Qué tal',
    ]);
  });

  test('la palabra cambia según el idioma del usuario', () => {
    const out = anonymizationService
      .anonymizeParticipants('[26/7/24, 21:06:01] Maria: Hi', 'en');
    expect(out).toBe('[26/7/24] Participant 1: Hi');
  });

  test('líneas sin cabecera de mensaje (continuación) se dejan igual', () => {
    const out = anonimizar(['[26/7/24, 21:06:01] Maria: Hola', 'segunda línea del mensaje']);
    expect(out[1]).toBe('segunda línea del mensaje');
  });
});

describe('anonymizeParticipants: formatos reales que hoy fallan (bug de los 3 participantes)', () => {
  test('iOS sin coma entre fecha y hora "[30/1/26 13:56:06]"', () => {
    const out = anonimizar([
      '[30/1/26 13:56:06] Maria: Hola',
      '[30/1/26 13:56:10] Eva Pan: Qué tal',
    ]);
    expect(out[0]).toContain('Participante 1: Hola');
    expect(out[1]).toContain('Participante 2: Qué tal');
    expect(out.join('\n')).not.toMatch(/Maria|Eva Pan/);
  });

  test('iOS con año de 4 cifras', () => {
    const out = anonimizar([
      '[30/01/2026, 13:56:06] Maria: Hola',
      '[30/01/2026, 13:56:10] Eva Pan: Qué tal',
    ]);
    expect(out.join('\n')).not.toMatch(/Maria|Eva Pan/);
    expect(out.join('\n')).toMatch(/Participante 2/);
  });

  test('iOS con carácter invisible \\u200E delante (líneas de imagen omitida)', () => {
    const out = anonimizar([
      '[30/1/26 13:56:06] Maria: Hola',
      '‎[30/1/26 13:56:10] Eva Pan: ‎Imatge omesa',
    ]);
    expect(out[1]).toContain('Participante 2:');
    expect(out[1]).not.toContain('Eva Pan');
  });

  test('Android sin segundos ni coma, año 4 cifras', () => {
    const out = anonimizar([
      '30/01/2026 13:56 - Maria: Hola',
      '30/01/2026 13:57 - Eva Pan: Qué tal',
    ]);
    expect(out.join('\n')).not.toMatch(/Maria|Eva Pan/);
  });

  test('mismo nombre siempre recibe el mismo número aunque cambie el formato de línea', () => {
    const out = anonimizar([
      '[30/1/26 13:56:06] Maria: Hola',
      '‎[30/1/26 13:56:10] Maria: ‎Imatge omesa',
    ]);
    expect(out[0]).toContain('Participante 1');
    expect(out[1]).toContain('Participante 1');
    expect(Object.keys(anonymizationService.getAllMappings().participants)).toEqual(['Maria']);
  });
});

describe('nombres de los participantes dentro de los mensajes (27-11-2026)', () => {
  beforeEach(() => anonymizationService.reset());

  test('el nombre de quien escribe también se tapa cuando otro lo nombra', () => {
    const [l1, l2, l3] = anonimizar([
      '[1/3/23, 10:00:00] Eva Pan: Hola, soy Eva',
      '[1/3/23, 10:01:00] Marcos Ruiz: eva pan, eres la mejor. Y evaluar no es Eva',
      'y dile a Marcos que venga',
    ]);
    expect(l1).toBe('[1/3/23] Participante 1: Hola, soy Participante 1');
    expect(l2).toBe('[1/3/23] Participante 2: Participante 1, eres la mejor. Y evaluar no es Participante 1'); // «evaluar» no se toca
    expect(l3).toBe('y dile a Participante 2 que venga');                                                    // línea de continuación
    expect([l1, l2, l3].join(' ')).not.toMatch(/\b(Eva|Pan|Marcos|Ruiz)\b/i);
  });

  test('nombres que también son palabras corrientes: solo se tapan escritos con mayúscula', () => {
    const [l1, l2] = anonimizar([
      '[1/3/23, 10:00:00] Rosa: me gusta el color rosa',
      '[1/3/23, 10:01:00] Mamá: Dile a Rosa que su mamá la espera',
    ]);
    expect(l1).toBe('[1/3/23] Participante 1: me gusta el color rosa');
    expect(l2).toBe('[1/3/23] Participante 2: Dile a Participante 1 que su mamá la espera');
  });

  test('un contacto que es un número de teléfono no se usa como nombre', () => {
    const [l1] = anonimizar(['[1/3/23, 10:00:00] +34 600 123 456: tengo 34 años y 600 euros']);
    expect(l1).toBe('[1/3/23] Participante 1: tengo 34 años y 600 euros');
  });
});

describe('anonymizeWithPatterns no junta un mensaje con el siguiente (27-11-2026)', () => {
  beforeEach(() => anonymizationService.reset());

  test('una dirección al final de un mensaje no se come el salto de línea', () => {
    const texto = '[1/3/23] Participante 1: quedamos en la plaza mayor\n[1/3/23] Participante 2: vale\n[1/3/23] Participante 1: en Calle Luna\n[1/3/23] Participante 2: ok';
    const salida = anonymizationService.anonymizeWithPatterns(texto, 'spa').split('\n');
    expect(salida).toHaveLength(4);
    salida.forEach((l) => expect(l).toMatch(/^\[1\/3\/23\] Participante \d: /));
  });
});
