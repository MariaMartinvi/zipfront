import { regionLibro, cargarPreciosLibro, PRECIOS_LIBRO_DEFECTO } from './precioLibro';

test.each([
  ['Europe/Madrid', 'es'], ['Atlantic/Canary', 'es'], ['America/Mexico_City', 'mx'],
  ['America/Bogota', 'latam'], ['America/New_York', 'us'], ['Europe/Paris', 'default'], ['', 'default'],
])('%s → %s', (tz, region) => {
  expect(regionLibro(tz)).toBe(region);
});

test('usa el precio del servidor', async () => {
  global.fetch = jest.fn(() => Promise.resolve({ json: () => Promise.resolve({ labels: { libro: '49 US$', pdf: '12,99 US$' }, currency: 'USD' }) }));
  await expect(cargarPreciosLibro()).resolves.toEqual({ labels: { libro: '49 US$', pdf: '12,99 US$' }, currency: 'USD' });
});

test('si el servidor falla, 29 € por defecto', async () => {
  global.fetch = jest.fn(() => Promise.reject(new Error('sin red')));
  await expect(cargarPreciosLibro()).resolves.toEqual({ labels: PRECIOS_LIBRO_DEFECTO, currency: 'EUR' });
  expect(PRECIOS_LIBRO_DEFECTO.libro).toBe('29 €');
});
