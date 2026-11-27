import { filasComparativa, filasIA } from './ComparativaChats';
// Las características (Analisis_top.js) importan AuthContext, que arranca Firebase: aquí no hace falta
jest.mock('./AuthContext', () => ({ useAuth: () => ({ user: null }) }));


const tramos = {
  msgDiaMiembro: [1, 2, 5, 10], recordDiaMiembro: [10], racha: [7], silencio: [7], respuestaMin: [5],
  madrugadaPct: [5], palabrasMsg: [5], emojis100: [10], palabrotas100: [1], risas100: [5],
};
const totales = (chats, numeros, genero = {}) => ({ chats, tramos, minimos: { numeros: 20, genero: 50 }, numeros, genero });
const ficha = { v: 1, numeros: { msgDiaMiembro: 7, respuestaMin: 1 }, genero: { masMalhablado: 'chico' } };

test('con menos de 20 chats no se enseña ningún número', () => {
  const t = totales(19, { msgDiaMiembro: [5, 5, 5, 4, 0] });
  expect(filasComparativa(ficha, t).numeros).toEqual([]);
});

test('con 20 chats sí, con la frase según estéis por encima o por debajo', () => {
  const t = totales(20, { msgDiaMiembro: [4, 4, 4, 4, 4], respuestaMin: [4, 16] });
  const { numeros } = filasComparativa(ficha, t);
  expect(numeros.find((f) => f.clave === 'msgDiaMiembro')).toMatchObject({ pct: 70, frase: 'Habláis más que el 70 % de los chats' });
  // Contestar en 1 min deja por debajo al 10 %: más rápido que el 90 %
  expect(numeros.find((f) => f.clave === 'respuestaMin').frase).toBe('Contestáis más rápido que el 90 % de los chats');
});

test('chico/chica: hace falta llegar a 50 chats con género reconocido', () => {
  const pocos = totales(100, {}, { masMalhablado: { chico: 10, chica: 39 } });
  expect(filasComparativa(ficha, pocos).genero).toEqual([]);
  const bastantes = totales(100, {}, { masMalhablado: { chico: 10, chica: 40 }, comico: { chico: 30, chica: 20 } });
  const { genero } = filasComparativa(ficha, bastantes);
  expect(genero.find((f) => f.clave === 'masMalhablado')).toMatchObject({ tuyo: 'chico', pctChico: 20, pctChica: 80 });
  expect(genero.find((f) => f.clave === 'comico')).toMatchObject({ tuyo: null, pctChico: 60 });
});

test('sin ficha o sin totales no hay nada', () => {
  expect(filasComparativa(null, totales(100, {}))).toEqual({ numeros: [], genero: [] });
  expect(filasComparativa(ficha, null)).toEqual({ numeros: [], genero: [] });
});

const ia = (chats) => ({
  chats, minimo: 10, personas: 20,
  n: { temas: chats, momento: chats, recomendacion: chats, rasgos: chats, nota: chats, dinamica: chats },
  temas: { planes: 6, humor: 3, viajes: 1 }, momento: { celebracion: 4, viaje: 6 }, recomendacion: { escuchar_mas: 2, repartir_iniciativa: 8 },
  rasgos: { divertido: 5, organizador: 15 }, dinamica: { complicidad: 7, rutina: 3 },
  nota: { 6: 4, 7: 2, 8: 2, 9: 2 },
});
const fichaIa = { v: 1, temas: ['humor', 'planes'], momento: 'celebracion', recomendacion: 'escuchar_mas', rasgos: ['divertido', 'divertido'], nota: 8, dinamica: 'complicidad' };

test('IA: nada sin análisis IA en este chat o con menos de 10 chats con IA', () => {
  expect(filasIA(null, ia(50))).toEqual([]);
  expect(filasIA(fichaIa, ia(9))).toEqual([]);
  expect(filasIA(fichaIa, undefined)).toEqual([]);
});

test('IA: con 10 chats, cada fila compara lo vuestro con el total', () => {
  const filas = Object.fromEntries(filasIA(fichaIa, ia(10)).map((f) => [f.clave, f]));
  expect(filas.temas).toMatchObject({ tuyo: 'Humor y memes · Planes y quedadas', frase: '«Humor y memes» sale entre los temas principales del 30 % de los chats' });
  expect(filas.temas.extra).toBe('Lo más hablado en todos los chats: Planes y quedadas (60 %), Humor y memes (30 %), Viajes (10 %)');
  expect(filas.nota).toMatchObject({ tuyo: '8/10', frase: 'Más alta que la del 70 % de los chats', extra: 'Media de todos los chats: 7,2' });
  expect(filas.dinamica.frase).toBe('Como en el 70 % de los chats');
  expect(filas.momento).toMatchObject({ tuyo: 'Una celebración', frase: 'Como en el 40 % de los chats' });
  expect(filas.rasgos).toMatchObject({ tuyo: 'Divertido', frase: '«Divertido» es el rasgo principal del 25 % de las personas' });
  expect(filas.recomendacion.frase).toBe('Se lo recomendamos al 20 % de los chats');
});

test('IA: momento «ninguno» no se enseña', () => {
  expect(filasIA({ ...fichaIa, momento: 'ninguno' }, ia(10)).map((f) => f.clave)).not.toContain('momento');
});

// Maria, 23-11-2026: con 0 palabrotas el punto salía a mitad de barra (empate con los demás chats de 0) y la frase
// «Más finos que el 84 %» confundía. El tramo más bajo es «casi ninguna», así que decimos en qué % de chats más finos estáis.
test('0 palabrotas: punto al inicio de la barra y frase de los más finos', () => {
  const t = totales(20, { palabrotas100: [8, 12] });
  const fila = filasComparativa({ v: 1, numeros: { palabrotas100: 0 }, genero: {} }, t).numeros[0];
  expect(fila).toMatchObject({ pct: 0, frase: 'Ni una palabrota: estáis en el 40 % de chats más finos' });
});

test('con la web en otro idioma manda la ficha (para las estadísticas por país) pero no enseña la sección', async () => {
  const { default: ComparativaChats } = await import('./ComparativaChats');
  const React = await import('react');
  const { createRoot } = await import('react-dom/client');
  const { act } = await import('react-dom/test-utils');
  const lineas = [];
  for (let d = 1; d <= 20; d++) {
    lineas.push(`[${d}/3/25, 10:00:00] Marcos: shall we grab a beer tonight?`);
    lineas.push(`[${d}/3/25, 10:05:00] Lucía García: yes please ❤️`);
    lineas.push(`[${d}/3/25, 23:30:00] Lucía García: home now`);
  }
  window.localStorage.clear();
  const llamadas = [];
  global.fetch = jest.fn((url, opts = {}) => { llamadas.push([url, opts]); return Promise.resolve({ ok: true, json: () => Promise.resolve({}) }); });
  const div = document.createElement('div');
  await act(async () => { createRoot(div).render(React.createElement(ComparativaChats, { chatData: lineas.join('\n'), aiResponse: null, idioma: 'en' })); });
  const envio = llamadas.find(([, o]) => o.method === 'POST');
  expect(envio[0]).toMatch(/\/api\/comparativa$/);
  const ficha = JSON.parse(envio[1].body);
  expect(ficha.contadores.menciones_vicios).toBe(20);                  // «beer» cuenta: listas en inglés
  expect(llamadas.filter(([, o]) => o.method !== 'POST')).toHaveLength(0); // no pide los totales
  expect(div.innerHTML).toBe('');                                       // y no enseña nada
});
