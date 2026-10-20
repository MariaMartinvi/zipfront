import { OBJETIVOS, textoObjetivo, hoy, diasDesde, guardarEstado, leerEstado, borrarEstado } from './pareja';
import { getParejaPricing } from './pricing';

test('cinco objetivos, el de recuperar lleva el nombre', () => {
  expect(OBJETIVOS.map((o) => o.id)).toEqual(['le_gusto', 'avanzar', 'mejorar', 'recuperar', 'dejarlo']);
  expect(textoObjetivo('recuperar', 'Eva')).toBe('Recuperar a Eva');
});

test('fechas para el seguimiento', () => {
  expect(hoy(new Date(2026, 9, 21))).toBe('21/10/2026');
  expect(diasDesde('07/10/2026', new Date(2026, 9, 21))).toBe(14);
  expect(diasDesde('basura')).toBeNull();
});

test('el estado sobrevive al pago (localStorage)', () => {
  guardarEstado({ objetivo: 'avanzar' });
  expect(leerEstado()).toEqual({ objetivo: 'avanzar' });
  borrarEstado();
  expect(leerEstado()).toBeNull();
});

test('precios de pareja: 2,99 y 4,99 en euros; 1,99 y 2,99 US$ en Latam', () => {
  expect(getParejaPricing('Europe/Madrid', true)).toMatchObject({ price: '2,99€', pack: '4,99€' });
  expect(getParejaPricing('America/Lima', true)).toMatchObject({ region: 'latam', price: '1,99 US$', pack: '2,99 US$' });
});
