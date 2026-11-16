import { regionLibro, cargarPreciosLibro, etiquetaImpreso, paisPorZona, puedeImprimir, PRECIOS_LIBRO_DEFECTO, PAISES_IMPRESION_DEFECTO } from './precioLibro';

test.each([
  ['Europe/Madrid', 'es'], ['Atlantic/Canary', 'es'], ['America/Mexico_City', 'mx'],
  ['America/Bogota', 'latam'], ['America/New_York', 'us'], ['Europe/Paris', 'default'], ['', 'default'],
])('%s → %s', (tz, region) => {
  expect(regionLibro(tz)).toBe(region);
});

test('usa el precio del servidor', async () => {
  global.fetch = jest.fn(() => Promise.resolve({ json: () => Promise.resolve({ labels: { libro: '49 US$', pdf: '12,99 US$' }, currency: 'USD' }) }));
  await expect(cargarPreciosLibro()).resolves.toEqual({ labels: { libro: '49 US$', pdf: '12,99 US$' }, currency: 'USD', tramos: null, paises: PAISES_IMPRESION_DEFECTO });
});

test('si el servidor falla, 29 € por defecto', async () => {
  global.fetch = jest.fn(() => Promise.reject(new Error('sin red')));
  await expect(cargarPreciosLibro()).resolves.toEqual({ labels: PRECIOS_LIBRO_DEFECTO, currency: 'EUR', tramos: null, paises: PAISES_IMPRESION_DEFECTO });
  expect(PRECIOS_LIBRO_DEFECTO.libro).toBe('29 €');
});

test('precio del impreso según las páginas, con los tramos del servidor', () => {
  const tramos = [{ hasta: 60, label: '29 €' }, { hasta: 120, label: '39 €' }, { hasta: 200, label: '49 €' }];
  expect(etiquetaImpreso(PRECIOS_LIBRO_DEFECTO, tramos, 30)).toBe('29 €');
  expect(etiquetaImpreso(PRECIOS_LIBRO_DEFECTO, tramos, 60)).toBe('29 €');
  expect(etiquetaImpreso(PRECIOS_LIBRO_DEFECTO, tramos, 61)).toBe('39 €');
  expect(etiquetaImpreso(PRECIOS_LIBRO_DEFECTO, tramos, 200)).toBe('49 €');
  // servidor antiguo sin tramos: el precio de siempre
  expect(etiquetaImpreso(PRECIOS_LIBRO_DEFECTO, null, 150)).toBe('29 €');
});

test.each([
  ['Europe/Madrid', 'ES', true], ['Atlantic/Canary', 'ES', true], ['Europe/Lisbon', 'PT', true], ['Europe/London', 'GB', true],
  ['America/New_York', 'US', true], ['America/Los_Angeles', 'US', true], ['America/Indiana/Indianapolis', 'US', true],
  ['America/Mexico_City', null, false], ['America/Bogota', null, false], ['America/Buenos_Aires', null, false],
  ['America/Toronto', null, false], ['Asia/Tokyo', null, false], ['', null, false],
])('%s → país %s, impreso %s', (tz, pais, imprime) => {
  expect(paisPorZona(tz)).toBe(pais);
  expect(puedeImprimir(PAISES_IMPRESION_DEFECTO, tz)).toBe(imprime);
});

test('los países los decide el servidor', () => {
  expect(puedeImprimir(['ES'], 'Europe/Paris')).toBe(false);
  expect(puedeImprimir(['ES', 'FR'], 'Europe/Paris')).toBe(true);
});
