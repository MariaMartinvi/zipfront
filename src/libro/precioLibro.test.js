import { regionLibro, cargarPreciosLibro, etiquetaImpreso, PRECIOS_LIBRO_DEFECTO } from './precioLibro';

test.each([
  ['Europe/Madrid', 'es'], ['Atlantic/Canary', 'es'], ['America/Mexico_City', 'mx'],
  ['America/Bogota', 'latam'], ['America/New_York', 'us'], ['Europe/Paris', 'default'], ['', 'default'],
])('%s → %s', (tz, region) => {
  expect(regionLibro(tz)).toBe(region);
});

test('usa el precio del servidor', async () => {
  global.fetch = jest.fn(() => Promise.resolve({ json: () => Promise.resolve({ labels: { libro: '49 US$', pdf: '12,99 US$' }, currency: 'USD' }) }));
  await expect(cargarPreciosLibro()).resolves.toEqual({ labels: { libro: '49 US$', pdf: '12,99 US$' }, currency: 'USD', tramos: null });
});

test('si el servidor falla, 29 € por defecto', async () => {
  global.fetch = jest.fn(() => Promise.reject(new Error('sin red')));
  await expect(cargarPreciosLibro()).resolves.toEqual({ labels: PRECIOS_LIBRO_DEFECTO, currency: 'EUR', tramos: null });
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
