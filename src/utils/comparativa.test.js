import { fichaAnonima, tramoDe, percentil, huella, enviarFicha, fichaIA, MINIMO_MENSAJES } from './comparativa';

// Mensajes con la forma de libro/parser.js
const msg = (dia, hhmm, autor, texto = 'hola qué tal') => ({ fecha: new Date(`${dia}T${hhmm}:00`), dia, autor, tipo: 'text', texto });

// Chat de pareja de 10 días: Lucía escribe más, dice palabrotas y trasnocha; Marcos hace reír a Lucía.
function chatEjemplo() {
  const ms = [];
  for (let d = 1; d <= 10; d++) {
    const dia = `2025-03-${String(d).padStart(2, '0')}`;
    ms.push(msg(dia, '10:00', 'Marcos', 'te cuento una cosa graciosa'));
    ms.push(msg(dia, '10:02', 'Lucía García', 'jajajaja joder qué bueno'));
    ms.push(msg(dia, '10:05', 'Lucía García', 'oye esta noche cenamos? 😍'));
    ms.push(msg(dia, '10:09', 'Marcos', 'vale'));
    ms.push(msg(dia, '02:30', 'Lucía García', 'no puedo dormir mierda'));
    ms.push(msg(dia, '02:40', 'Lucía García', 'estás?'));
  }
  return ms.sort((a, b) => a.fecha - b.fecha);
}

test('chats cortos o de una sola persona no dan ficha', () => {
  const pocos = Array.from({ length: MINIMO_MENSAJES - 1 }, (_, i) => msg('2025-01-01', '10:00', i % 2 ? 'Eva' : 'Marcos'));
  expect(fichaAnonima(pocos)).toBeNull();
  const solo = Array.from({ length: 80 }, () => msg('2025-01-01', '10:00', 'Eva'));
  expect(fichaAnonima(solo)).toBeNull();
});

test('la ficha calcula los números del chat', () => {
  const f = fichaAnonima(chatEjemplo());
  expect(f.v).toBe(1);
  expect(f.numeros.msgDiaMiembro).toBe(3);      // 60 mensajes / 10 días / 2 personas
  expect(f.numeros.recordDiaMiembro).toBe(3);   // 6 mensajes el día más intenso / 2
  expect(f.numeros.racha).toBe(10);
  expect(f.numeros.silencio).toBe(0);
  expect(f.numeros.madrugadaPct).toBe(33.3);    // 20 de 60
  expect(f.numeros.palabrotas100).toBe(33.3);   // un «joder» y un «mierda» al día
  expect(f.numeros.risas100).toBe(16.7);        // un «jajajaja» al día
  expect(f.numeros.emojis100).toBe(16.7);
});

test('quién destaca, en chico/chica', () => {
  const f = fichaAnonima(chatEjemplo());
  expect(f.genero.masEscribe).toBe('chica');
  expect(f.genero.masMalhablado).toBe('chica');
  expect(f.genero.trasnochador).toBe('chica');
  expect(f.genero.comico).toBe('chico');        // Lucía se ríe justo después de Marcos
  expect(f.genero.carinoso).toBe('chica');
});

test('la ficha no lleva nombres ni texto del chat', () => {
  const json = JSON.stringify(fichaAnonima(chatEjemplo()));
  ['Lucía', 'Lucia', 'García', 'Marcos', 'joder', 'cenamos', 'graciosa'].forEach((s) => expect(json).not.toContain(s));
  expect(json).toMatch(/^[{}[\]":,.0-9a-zA-Z_-]+$/); // solo claves, números y chico/chica
});

test('nombre que no se reconoce: ese chat no cuenta para las métricas de chico/chica, el resto sí', () => {
  const ms = chatEjemplo().map((m) => ({ ...m, autor: m.autor === 'Lucía García' ? 'Cris' : m.autor }));
  const f = fichaAnonima(ms);
  expect(f.genero.masEscribe).toBeUndefined();  // la que más escribe es «Cris»: no sabemos
  expect(f.genero.comico).toBe('chico');        // Marcos sí se reconoce
  expect(f.numeros.msgDiaMiembro).toBe(3);
});

test('tramos y percentil', () => {
  const cortes = [1, 2, 5, 10];
  expect(tramoDe(0.5, cortes)).toBe(0);
  expect(tramoDe(1, cortes)).toBe(1);
  expect(tramoDe(7, cortes)).toBe(3);
  expect(tramoDe(50, cortes)).toBe(4);
  // 10 chats por tramo: con 7 tienes 30 por debajo y la mitad de tu tramo (5) → 70 %
  expect(percentil(7, cortes, [10, 10, 10, 10, 10])).toBe(70);
  expect(percentil(7, cortes, [0, 0, 0, 0, 0])).toBeNull();
});

test('la ficha se manda una sola vez por chat; si falla la red, se reintenta', async () => {
  const memoria = {};
  const storage = { getItem: (k) => memoria[k] ?? null, setItem: (k, v) => { memoria[k] = v; } };
  const ficha = fichaAnonima(chatEjemplo());
  const caido = jest.fn().mockRejectedValue(new Error('sin red'));
  expect(await enviarFicha(ficha, 'chat A', { apiUrl: 'https://api', fetchFn: caido, storage })).toBe(false);
  const ok = jest.fn().mockResolvedValue({ ok: true });
  expect(await enviarFicha(ficha, 'chat A', { apiUrl: 'https://api', fetchFn: ok, storage })).toBe(true);
  expect(await enviarFicha(ficha, 'chat A', { apiUrl: 'https://api', fetchFn: ok, storage })).toBe(false);
  expect(await enviarFicha(ficha, 'chat B', { apiUrl: 'https://api', fetchFn: ok, storage })).toBe(true);
  expect(ok).toHaveBeenCalledTimes(2);
  const [url, opciones] = ok.mock.calls[0];
  expect(url).toBe('https://api/api/comparativa');
  expect(JSON.parse(opciones.body)).toEqual(ficha); // solo la ficha: ni el texto ni la huella
  expect(memoria.cs_comparativa_enviados).not.toContain('chat A');
  expect(await enviarFicha(null, 'chat C', { apiUrl: 'https://api', fetchFn: ok, storage })).toBe(false);
});

test('dos envíos a la vez del mismo chat: solo sale uno', async () => {
  const memoria = {};
  const storage = { getItem: (k) => memoria[k] ?? null, setItem: (k, v) => { memoria[k] = v; } };
  const ok = jest.fn().mockResolvedValue({ ok: true });
  const ficha = fichaAnonima(chatEjemplo());
  const opts = { apiUrl: 'https://api', fetchFn: ok, storage };
  const res = await Promise.all([enviarFicha(ficha, 'chat D', opts), enviarFicha(ficha, 'chat D', opts)]);
  expect(res.sort()).toEqual([false, true]);
  expect(ok).toHaveBeenCalledTimes(1);
});

test('huella: igual para el mismo chat, distinta si cambia', () => {
  expect(huella('abc')).toBe(huella('abc'));
  expect(huella('abc')).not.toBe(huella('abd'));
});

test('ficha de IA: solo valores de las listas, sin nada del texto', () => {
  const respuesta = '## Análisis\nEva es muy divertida.\n\nCOMPARATIVA_DATA:{"temas":["planes","Humor","boda de Eva","planes"],"momento":"celebracion","recomendacion":"inventada","rasgos":["divertido","Eva"],"nota":8,"dinamica":"complicidad"}';
  expect(fichaIA(respuesta)).toEqual({ v: 1, temas: ['planes', 'humor'], momento: 'celebracion', rasgos: ['divertido'], nota: 8, dinamica: 'complicidad' });
});

test('ficha de IA: sin bloque, roto o vacío → null', () => {
  expect(fichaIA('## Análisis sin datos')).toBeNull();
  expect(fichaIA('COMPARATIVA_DATA:{roto')).toBeNull();
  expect(fichaIA('COMPARATIVA_DATA:{"nota":15,"temas":["nada"]}')).toBeNull();
  expect(fichaIA(null)).toBeNull();
});

test('la ficha de IA va a su propia ruta y no choca con la ficha normal del mismo chat', async () => {
  const memoria = {};
  const storage = { getItem: (k) => memoria[k] ?? null, setItem: (k, v) => { memoria[k] = v; } };
  const ok = jest.fn().mockResolvedValue({ ok: true });
  expect(await enviarFicha({ v: 1, nota: 8 }, 'chat E', { apiUrl: 'https://api', ia: true, fetchFn: ok, storage })).toBe(true);
  expect(await enviarFicha(fichaAnonima(chatEjemplo()), 'chat E', { apiUrl: 'https://api', fetchFn: ok, storage })).toBe(true);
  expect(await enviarFicha({ v: 1, nota: 8 }, 'chat E', { apiUrl: 'https://api', ia: true, fetchFn: ok, storage })).toBe(false);
  expect(ok.mock.calls.map((c) => c[0])).toEqual(['https://api/api/comparativa/ia', 'https://api/api/comparativa']);
});
