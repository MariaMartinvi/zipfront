import { COMPARATIVA, FECHA_COMPARATIVA } from './comparativa';

test('la comparación solo lleva precios con fecha, enlace a la tienda y total en euros', () => {
  expect(FECHA_COMPARATIVA).toMatch(/\d{4}$/);
  expect(COMPARATIVA.length).toBeGreaterThan(0);
  COMPARATIVA.forEach((c) => {
    expect(c.url).toMatch(/^https:\/\//);
    expect(c.total).toMatch(/^\d+,\d{2} €$/);
    expect(c.producto).toMatch(/páginas/);
  });
});
