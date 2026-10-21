import { getAiPackPricing, getPorraPricing, getParejaPricing, isLatamTimeZone, isSpainTimeZone, isMexicoTimeZone, getPaymentHighlightKey } from './pricing';

test.each([
  'America/Caracas', 'America/Bogota', 'America/Lima',
  'America/Santiago', 'America/Argentina/Buenos_Aires', 'America/Buenos_Aires', 'America/Sao_Paulo',
])('%s es Latinoamérica', (tz) => {
  expect(isLatamTimeZone(tz)).toBe(true);
  expect(isMexicoTimeZone(tz)).toBe(false);
  expect(getAiPackPricing(tz, true)).toMatchObject({ region: 'latam', price: '1,99 US$' });
});

test.each(['America/Mexico_City', 'America/Tijuana', 'America/Monterrey', 'America/Cancun'])('%s es México: paga en pesos', (tz) => {
  expect(isMexicoTimeZone(tz)).toBe(true);
  expect(isLatamTimeZone(tz)).toBe(true);
  expect(getAiPackPricing(tz, true, true, true)).toMatchObject({ region: 'mx', price: '$39 MXN', original: '$99 MXN', perAnalysis: '$3.90 MXN' });
  expect(getPorraPricing(tz, true, true)).toEqual({ region: 'mx', price: '$59 MXN' });
  expect(getParejaPricing(tz, true, true)).toEqual({ region: 'mx', price: '$39 MXN', pack: '$59 MXN' });
});

test('con el precio de México apagado, Ciudad de México paga en US$ como el resto de Latam', () => {
  expect(getAiPackPricing('America/Mexico_City', true, true, false)).toMatchObject({ region: 'latam', price: '1,99 US$' });
  expect(getPorraPricing('America/Mexico_City', true, false)).toEqual({ region: 'latam', price: '2,99 US$' });
  expect(getParejaPricing('America/Mexico_City', true, false)).toMatchObject({ region: 'latam' });
});

test('México no cambia el precio de Colombia ni de España', () => {
  expect(getAiPackPricing('America/Bogota', true, true, true).region).toBe('latam');
  expect(getAiPackPricing('Europe/Madrid', true, true, true).region).toBe('es');
  expect(getPorraPricing('Europe/Madrid', true, true).price).toBe('2,99€');
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
  expect(getAiPackPricing('America/Caracas', true).perAnalysis).toBe('0,20 US$');
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

test('aviso de pago destacado: Bizum en España, PayPal en Latam, nada en el resto', () => {
  expect(getPaymentHighlightKey('Europe/Madrid')).toBe('hero.ai_purchase.bizum_badge');
  expect(getPaymentHighlightKey('America/Mexico_City')).toBe('hero.ai_purchase.paypal_badge');
  expect(getPaymentHighlightKey('America/Sao_Paulo')).toBe('hero.ai_purchase.paypal_badge');
  expect(getPaymentHighlightKey('Europe/Paris')).toBeNull();
  expect(getPaymentHighlightKey('America/New_York')).toBeNull();
});

describe('precio de La Porra del Grupo', () => {
  const { getPorraPricing } = require('./pricing');
  test('España y resto pagan 2,99 €', () => {
    expect(getPorraPricing('Europe/Madrid', true)).toEqual({ region: 'es', price: '2,99€' });
    expect(getPorraPricing('Europe/Paris', true)).toEqual({ region: 'default', price: '2,99€' });
  });
  test('Latam paga 2,99 US$ y cae a euros si Latam está desactivado', () => {
    expect(getPorraPricing('America/Bogota', true)).toEqual({ region: 'latam', price: '2,99 US$' });
    expect(getPorraPricing('America/Bogota', false)).toEqual({ region: 'default', price: '2,99€' });
  });
});
