import { generoDe } from './generoNombre';

test('nombres claros, con mayúsculas, tildes, apellidos y emojis', () => {
  expect(generoDe('Marcos')).toBe('chico');
  expect(generoDe('MARÍA José')).toBe('chica'); // cuenta la primera palabra
  expect(generoDe('Jesús García')).toBe('chico');
  expect(generoDe('Begoña')).toBe('chica');
  expect(generoDe('❤️ Lucía ❤️')).toBe('chica');
  expect(generoDe('Mamá')).toBe('chica');
  expect(generoDe('Papi')).toBe('chico');
});

test('ambiguos, desconocidos y números de teléfono: null', () => {
  expect(generoDe('Álex')).toBeNull();
  expect(generoDe('Cris')).toBeNull();
  expect(generoDe('Andreu')).toBeNull();
  expect(generoDe('Xyzzy')).toBeNull();
  expect(generoDe('+34 612 34 56 78')).toBeNull();
  expect(generoDe('')).toBeNull();
  expect(generoDe(null)).toBeNull();
});

test('ningún nombre está en las dos listas a la vez sin querer', () => {
  // Si un nombre estuviera en ambas devolvería null: lo comprobamos con algunos que sí deben resolverse
  ['ana', 'eva', 'laura', 'david', 'pablo', 'hugo'].forEach((n) => expect(generoDe(n)).not.toBeNull());
});
