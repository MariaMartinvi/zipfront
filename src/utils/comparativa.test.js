import { fichaAnonima, fichaCaracteristicas, tramoDe, percentil, huella, enviarFicha, fichaIA, MINIMO_MENSAJES } from './comparativa';
import { perfilesDelChat } from '../Analisis_top';
// Las características (Analisis_top.js) importan AuthContext, que arranca Firebase: aquí no hace falta
jest.mock('../AuthContext', () => ({ useAuth: () => ({ user: null }) }));


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

test('la ficha lleva el país y las sumas de lo que no cuentan las características', () => {
  const f = fichaAnonima(chatEjemplo(), 'CL');
  expect(f.pais).toBe('CL');
  expect(f.sumas).toEqual({ mensajes: 60, personas: 2, dias: 10, diasActivos: 10, manana: 0, audios: 0, fotos: 0, stickers: 0, borrados: 0 });
  expect(f.sumasGenero).toEqual({
    chica: { personas: 1, mensajes: 40, manana: 0, audios: 0 },
    chico: { personas: 1, mensajes: 20, manana: 0, audios: 0 },
  });
  // Nombre que no se reconoce: no suma en chico/chica (pero sí en las sumas del chat)
  const g = fichaAnonima(chatEjemplo().map((m) => ({ ...m, autor: m.autor === 'Lucía García' ? 'Cris' : m.autor })), 'ES');
  expect(g.sumasGenero.chica).toBeUndefined();
  expect(g.sumas.mensajes).toBe(60);
});

test('madrugadores, audios, fotos, stickers, borrados y días con mensajes', () => {
  const extra = [
    { ...msg('2025-03-03', '07:15', 'Marcos'), tipo: 'audio', texto: '' },
    { ...msg('2025-03-03', '07:20', 'Lucía García'), tipo: 'image', texto: '' },
    { ...msg('2025-03-20', '12:00', 'Marcos'), tipo: 'sticker', texto: '' },
    { ...msg('2025-03-20', '12:01', 'Lucía García'), tipo: 'deleted', texto: '' },
  ];
  const f = fichaAnonima([...chatEjemplo(), ...extra].sort((a, b) => a.fecha - b.fecha), 'ES');
  expect(f.sumas).toMatchObject({ manana: 2, audios: 1, fotos: 1, stickers: 1, borrados: 1, diasActivos: 11, dias: 20 });
  expect(f.sumasGenero.chico).toMatchObject({ manana: 1, audios: 1 });
  expect(f.sumasGenero.chica).toMatchObject({ manana: 1, audios: 0 });
});

// Resultado con la forma de analizarPerfilesCompleto (Analisis_top.js)
const persona = (extra) => ({
  mensajes: 10, palabras_totales: 50, palabras_unicas: new Set(['a', 'b', 'c']), mensajes_noche: 2, uso_primera_persona: 1,
  mensajes_inician_conversacion: 1, mensajes_terminan_conversacion: 0, menciones_otros: 0, emojis_utilizados: 4, emojis_amor: 1,
  max_mensajes_seguidos: 3, mensajes_risa: 2, mensajes_agradece: 0, mensajes_disculpa: 1, mensajes_pregunta: 3,
  menciones_vicios: 0, menciones_palabrotas: 0, horario_mensajes: [10, 12], longitud_mensajes: [20, 30], tiempo_respuesta: [1.5, 3],
  ...extra,
});
const RESULTADO = {
  success: true,
  usuarios: {
    'Marcos': persona({ menciones_vicios: 5, menciones_palabrotas: 1 }),
    'Lucía García': persona({ palabras_unicas: 7, emojis_amor: 3 }),
    'Cris': persona({}),
  },
  categorias: { mala_influencia: { nombre: 'Marcos' }, amoroso: { nombre: 'Lucía García' }, vampiro: { nombre: 'Cris' }, profesor: { nombre: '--' } },
};

test('características: chico/chica de quien gana y contadores de la app, sin nombres', () => {
  const c = fichaCaracteristicas(RESULTADO);
  expect(c.caracteristicas).toEqual({ mala_influencia: 'chico', amoroso: 'chica' }); // Cris: no sabemos; «--»: nadie
  expect(c.contadores).toMatchObject({
    personas: 3, mensajes: 30, menciones_vicios: 5, menciones_palabrotas: 1, emojis_amor: 5, palabras_unicas: 13,
    suma_hora: 66, suma_longitud: 150, suma_respuesta_min: 15, respuestas: 6,
  });
  expect(c.contadoresGenero.chico).toMatchObject({ personas: 1, menciones_vicios: 5, emojis_amor: 1 });
  expect(c.contadoresGenero.chica).toMatchObject({ personas: 1, emojis_amor: 3, palabras_unicas: 7 });
  expect(JSON.stringify(c)).toMatch(/^[{}[\]":,.0-9a-zA-Z_-]+$/); // solo claves, números y chico/chica
  expect(fichaCaracteristicas({ success: false })).toBeNull();
  expect(fichaCaracteristicas(null)).toBeNull();
});

test('características con el cálculo real de la app (perfilesDelChat)', () => {
  const lineas = [];
  for (let d = 1; d <= 20; d++) {
    lineas.push(`[${d}/3/25, 10:00:00] Marcos: vamos a por una cerveza esta noche?`);
    lineas.push(`[${d}/3/25, 10:05:00] Lucía García: joder qué ganas ❤️`);
    lineas.push(`[${d}/3/25, 23:30:00] Lucía García: estoy en casa ya`);
  }
  const resultado = perfilesDelChat(lineas.join('\n'));
  const c = fichaCaracteristicas(resultado);
  const u = resultado.usuarios;
  expect(c.contadores.mensajes).toBe(u['Marcos'].mensajes + u['Lucía García'].mensajes);
  expect(c.contadores.menciones_vicios).toBe(u['Marcos'].menciones_vicios + u['Lucía García'].menciones_vicios);
  expect(c.contadoresGenero.chica.menciones_palabrotas).toBe(u['Lucía García'].menciones_palabrotas);
  // Quien gana cada característica es quien la app enseña
  Object.entries(c.caracteristicas).forEach(([k, g]) => {
    expect(g).toBe(resultado.categorias[k].nombre === 'Marcos' ? 'chico' : 'chica');
  });
  expect(c.caracteristicas.vampiro).toBe('chica');
  expect(perfilesDelChat(lineas.join('\n'))).toBe(resultado); // el mismo chat no se calcula dos veces
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
  expect(fichaIA(respuesta, 'MX')).toEqual({ v: 1, temas: ['planes', 'humor'], momento: 'celebracion', rasgos: ['divertido'], nota: 8, dinamica: 'complicidad', pais: 'MX' });
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
