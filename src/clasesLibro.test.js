// La página del editor del libro (src/libro/libro.css) tiene `.libro { min-height: 100vh; fondo gris }`, y ese CSS
// se queda cargado al navegar a otra página. Si otro componente usa la clase `libro` suelta, hereda esa altura:
// en Precios, la tarjeta del libro estiraba las tres tarjetas a toda la pantalla (23-11-2026).
import fs from 'fs';
import path from 'path';

const ficheros = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
  const p = path.join(dir, e.name);
  if (e.isDirectory()) return e.name === 'libro' ? [] : ficheros(p);
  return /\.js$/.test(e.name) && !/\.test\.js$/.test(e.name) ? [p] : [];
});

test('fuera del editor del libro nadie usa la clase «libro» suelta', () => {
  const culpables = ficheros('src').filter((f) => /className=["'{`][^"'`]*(?<![\w-])libro(?![\w-])/.test(fs.readFileSync(f, 'utf8')));
  expect(culpables).toEqual([]);
});
