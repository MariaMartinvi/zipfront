import { getAiPackPricing, isLatamTimeZone, isSpainTimeZone } from './pricing';

test.each([
  'America/Caracas', 'America/Mexico_City', 'America/Tijuana', 'America/Bogota', 'America/Lima',
  'America/Santiago', 'America/Argentina/Buenos_Aires', 'America/Buenos_Aires', 'America/Sao_Paulo',
])('%s es Latinoamérica', (tz) => {
  expect(isLatamTimeZone(tz)).toBe(true);
  expect(getAiPackPricing(tz, true)).toMatchObject({ region: 'latam', price: '1,99€' });
});

test.each([
  'Europe/Paris', 'America/New_York', 'America/Los_Angeles', 'America/Chicago',
  'America/Toronto', 'America/Puerto_Rico', '',
])('%s paga el precio normal', (tz) => {
  expect(isLatamTimeZone(tz)).toBe(false);
  expect(getAiPackPricing(tz, true)).toMatchObject({ region: 'default', price: '5€' });
});

test('con el precio Latam desactivado, Caracas paga el normal', () => {
  expect(getAiPackPricing('America/Caracas', false)).toMatchObject({ region: 'default', price: '5€' });
});

test('el precio por análisis es coherente con el pack de 10', () => {
  expect(getAiPackPricing('Europe/Paris', true).perAnalysis).toBe('0,50€');
  expect(getAiPackPricing('Europe/Madrid', true).perAnalysis).toBe('0,30€');
  expect(getAiPackPricing('America/Caracas', true).perAnalysis).toBe('0,20€');
});

test.each(['Europe/Madrid', 'Atlantic/Canary', 'Africa/Ceuta'])('%s es España: 2,99 € si está activo', (tz) => {
  expect(isSpainTimeZone(tz)).toBe(true);
  expect(getAiPackPricing(tz, true, true)).toMatchObject({ region: 'es', price: '2,99€', perAnalysis: '0,30€' });
});

test('con el precio España desactivado, Madrid paga el normal', () => {
  expect(getAiPackPricing('Europe/Madrid', true, false)).toMatchObject({ region: 'default', price: '5€' });
});

test.each(['Europe/Lisbon', 'Europe/Paris', 'America/Caracas', ''])('%s no es España', (tz) => {
  expect(isSpainTimeZone(tz)).toBe(false);
});
