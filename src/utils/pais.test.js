import { paisDeZona } from './pais';

test('zona horaria → país', () => {
  expect(paisDeZona('Europe/Madrid')).toBe('ES');
  expect(paisDeZona('Atlantic/Canary')).toBe('ES');
  expect(paisDeZona('America/Santiago')).toBe('CL');
  expect(paisDeZona('America/Argentina/Buenos_Aires')).toBe('AR');
  expect(paisDeZona('America/Mexico_City')).toBe('MX');
  expect(paisDeZona('Europe/Paris')).toBe('FR');
});

test('zona desconocida o rara → otros', () => {
  expect(paisDeZona('Asia/Tokyo')).toBe('otros');
  expect(paisDeZona('UTC')).toBe('otros');
  expect(paisDeZona(undefined)).toBe('otros');
  expect(paisDeZona('<script>')).toBe('otros');
});
