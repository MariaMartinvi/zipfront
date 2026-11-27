import { listaInicial, activas, alternar, anadir, editar, quitar, mover, cuadroDe, guardar, cargar, ACTIVAS_AL_EMPEZAR } from './editor';
import { buscarFrases, datosModerno, titulosPropuestos, mensajesDeTexto } from './chat';
import { MAX_FRASES } from './render';

const frases = (n) => Array.from({ length: n }, (_, i) => ({ texto: `Frase ${i}`, autor: i % 2 ? 'Eva Pan' : 'Marcos', tono: 'graciosa' }));

test('al empezar salen marcadas las tres mejores de la IA', () => {
  const l = listaInicial(frases(15));
  expect(l).toHaveLength(15);
  expect(activas(l).map((f) => f.texto)).toEqual(['Frase 0', 'Frase 1', 'Frase 2']);
  expect(ACTIVAS_AL_EMPEZAR).toBe(3);
  expect(new Set(l.map((f) => f.id)).size).toBe(15);
  expect(listaInicial(null)).toEqual([]);
});

test('marcar y desmarcar, con tope de 12', () => {
  let l = listaInicial(frases(15));
  l = alternar(l, l[0].id);
  expect(activas(l)).toHaveLength(2);
  l.forEach((f) => { if (!f.activa) l = alternar(l, f.id); });
  expect(activas(l)).toHaveLength(MAX_FRASES);          // la 13.ª no entra
  expect(alternar(l, 'no-existe')).toBe(l);
});

test('añadir a mano, editar, mover y quitar', () => {
  let l = listaInicial(frases(2));
  l = anadir(l, { texto: '  Si me pierdo,   búscame en la nevera ', autor: 'Marcos' });
  expect(l[2]).toMatchObject({ texto: 'Si me pierdo, búscame en la nevera', autor: 'Marcos', origen: 'mano', activa: true });
  expect(anadir(l, { texto: 'Si me pierdo, búscame en la nevera' })).toBe(l);  // repetida
  expect(anadir(l, { texto: '   ' })).toBe(l);
  l = editar(l, l[0].id, { texto: 'Corregida' });
  expect(l[0].texto).toBe('Corregida');
  l = mover(l, l[2].id, -2 + 1);
  expect(l[1].origen).toBe('mano');
  expect(mover(l, l[0].id, -1)).toBe(l);                 // la primera no sube más
  expect(quitar(l, l[0].id)).toHaveLength(2);
});

test('el cuadro lleva solo las marcadas, en orden, y las opciones', () => {
  const l = listaInicial(frases(6));
  const c = cuadroDe(l, { plantilla: 'tierno', autores: 'inicial', titulo: 'Eva y Marcos', pie: '2024' }, [{ a: 0, p: 1 }]);
  expect(c).toMatchObject({ plantilla: 'tierno', autores: 'inicial', titulo: 'Eva y Marcos', pie: '2024', oscuro: false, datos: [{ a: 0, p: 1 }] });
  expect(c.frases).toEqual([{ texto: 'Frase 0', autor: 'Marcos' }, { texto: 'Frase 1', autor: 'Eva Pan' }, { texto: 'Frase 2', autor: 'Marcos' }]);
  expect(cuadroDe(l, { plantilla: 'inventada' }).plantilla).toBe('tipografico');  // el primero que se ofrece
});

test('el trabajo se guarda en el navegador (sin el chat) y se recupera', () => {
  const datos = {};
  const storage = { getItem: (k) => datos[k] ?? null, setItem: (k, v) => { datos[k] = v; } };
  expect(cargar('cs_test_1', storage)).toBeNull();
  const l = listaInicial(frases(3));
  guardar('cs_test_1', { lista: l, opciones: { plantilla: 'tipografico' } }, storage);
  expect(cargar('cs_test_1', storage)).toEqual({ lista: l, opciones: { plantilla: 'tipografico' } });
  expect(cargar('cs_test_2', storage)).toBeNull();        // cada pago, su cuadro
  datos.cs_cuadro_cs_test_3 = '{roto';
  expect(cargar('cs_test_3', storage)).toBeNull();
});

const CHAT = [
  '[1/3/23, 10:00:00] Eva Pan: Buenos días, desastre',
  '[1/3/23, 10:05:00] Marcos: Si me pierdo, búscame en la nevera',
  '[1/3/23, 10:06:00] Marcos: ‎imagen omitida',
  '[2/6/24, 22:00:00] Eva Pan: Qué DESASTRE de día',
  '[2/6/24, 22:01:00] Eva Pan: Qué DESASTRE de día',
  '[9/12/25, 09:00:00] Marcos: Mañana más',
].join('\n');

test('buscar frases a mano: sin tildes ni mayúsculas, sin repetidas y solo mensajes de texto', () => {
  const ms = mensajesDeTexto(CHAT);
  expect(ms).toHaveLength(5);                               // la imagen no cuenta
  expect(buscarFrases(ms, 'desastre').map((f) => f.texto)).toEqual(['Buenos días, desastre', 'Qué DESASTRE de día']);
  expect(buscarFrases(ms, 'BUSCAME')).toEqual([{ texto: 'Si me pierdo, búscame en la nevera', autor: 'Marcos' }]);
  expect(buscarFrases(ms, 'manana')).toHaveLength(1);
  expect(buscarFrases(ms, 'x')).toEqual([]);                // menos de 2 letras: nada
  expect(buscarFrases(ms, 'omitida')).toEqual([]);
});

test('datos del dibujo Moderno: un círculo por tramo con mensajes, color por persona y tamaño por lo hablado', () => {
  const ms = mensajesDeTexto(CHAT);
  const d = datosModerno(ms, 3);
  expect(d).toHaveLength(3);
  expect(d.every((c) => c.p > 0 && c.p <= 1 && c.a >= 0)).toBe(true);
  expect(Math.max(...d.map((c) => c.p))).toBe(1);
  expect(d[1].a).toBe(0);                                   // en 2024 solo escribe Eva, que es quien más escribe (0)
  expect(datosModerno(ms.slice(0, 1))).toBeNull();
});

test('título y pie propuestos', () => {
  expect(titulosPropuestos(mensajesDeTexto(CHAT))).toEqual({ titulo: 'Eva y Marcos', pie: '2023 – 2025' });
  const grupo = mensajesDeTexto(`${CHAT}\n[9/12/25, 09:01:00] Noe: Hola`);
  expect(titulosPropuestos(grupo).titulo).toBe('');         // en un grupo el título lo pone el usuario
});

test('se pueden añadir a mano varias frases seguidas y todas salen en el cuadro', () => {
  let l = listaInicial(frases(2));
  l = anadir(l, { texto: 'Si me pierdo, búscame en la nevera', autor: 'Marc' });
  l = anadir(l, { texto: '¿Peli esta noche?', autor: 'Lucía' });
  l = anadir(l, { texto: 'Mañana más', autor: 'Marc' });
  expect(l.filter((f) => f.origen === 'mano').map((f) => f.texto)).toEqual(['Si me pierdo, búscame en la nevera', '¿Peli esta noche?', 'Mañana más']);
  expect(cuadroDe(l, {}).frases).toHaveLength(5);
});
