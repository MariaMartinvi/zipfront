import { filasComparativa } from './ComparativaChats';

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
