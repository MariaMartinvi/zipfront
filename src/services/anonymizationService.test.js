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
