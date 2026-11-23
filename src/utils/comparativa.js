// «Tu chat frente al resto»: ficha anónima de un chat y comparación con los totales de todos los chats.
// La ficha lleva solo números y «chico»/«chica»: ni nombres, ni texto, ni identificadores.
// El servidor la reparte en tramos, suma contadores y la descarta.
import { equilibrio, records, diasIntensos } from './analisisExtra';
import { generoDe } from './generoNombre';

export const MINIMO_MENSAJES = 50;

const validos = (ms) => ms.filter((m) => m.autor && m.tipo !== 'system' && m.fecha);
const palabrasDe = (t) => (t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/[^a-z]+/).filter(Boolean);
const r1 = (x) => Math.round(x * 10) / 10;
const mediana = (xs) => { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

// Sin tildes (se comparan con palabrasDe). Castellano de España y Latinoamérica más lo básico en inglés.
const PALABROTAS = new Set(`
  joder jodido jodida jodete mierda mierdas cabron cabrona cabrones cono hostia hostias ostia ostias gilipollas
  puta puto putas putos putada imbecil capullo capulla cojones cojon follar polla pollas zorra subnormal mamon
  mamona pendejo pendeja pendejos chingar chingada chingado verga carajo culero huevon boludo pelotudo
  hijoputa mecago cagon cagada
  fuck fucking fucked shit bitch asshole motherfucker wtf
`.trim().split(/\s+/));
const RISA = /(^|[^a-z])(j[aeiosx]){2,}|(^|[^a-z])(h[ae]){2,}|(^|[^a-z])x+d+([^a-z]|$)|(^|[^a-z])lo+l([^a-z]|$)|😂|🤣|😆|😹/i;
const CARINO = /❤|💕|💖|💗|💓|💞|💘|😍|🥰|😘|😻|\bte quiero\b|\bte amo\b|\bte adoro\b|\blove you\b|\bcari[ñn]o\b|\bmi amor\b/i;
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu;

/**
 * Ficha anónima de un chat ya parseado (libro/parser.js), o null si el chat es demasiado corto.
 * { v: 1, numeros: { metrica: valor }, genero: { metrica: 'chico' | 'chica' } }
 */
export function fichaAnonima(mensajes) {
  const ms = validos(mensajes);
  if (ms.length < MINIMO_MENSAJES) return null;
  const eq = equilibrio(ms); // personas con al menos el 1 % de los mensajes
  if (eq.length < 2) return null;
  const miembros = eq.length;
  const rec = records(ms);
  const dias = Math.round((new Date(ms[ms.length - 1].dia) - new Date(ms[0].dia)) / 86400000) + 1;
  const textos = ms.filter((m) => m.tipo === 'text');

  // Por persona: palabrotas, risas que provoca (otra persona se ríe justo después), cariño y madrugada
  const p = {};
  const de = (a) => (p[a] || (p[a] = { palabrotas: 0, provoca: 0, carino: 0, madrugada: 0 }));
  let palabrotas = 0, risas = 0, emojis = 0, palabras = 0, madrugada = 0;
  const respuestas = [];
  ms.forEach((m, i) => {
    const x = de(m.autor);
    const t = m.texto || '';
    const nPal = palabrasDe(t).filter((w) => PALABROTAS.has(w)).length;
    x.palabrotas += nPal; palabrotas += nPal;
    if (CARINO.test(t)) x.carino++;
    emojis += (t.match(EMOJI) || []).length;
    if (m.fecha.getHours() < 6) { x.madrugada++; madrugada++; }
    const prev = ms[i - 1];
    if (RISA.test(t)) {
      risas++;
      if (prev && prev.autor !== m.autor && (m.fecha - prev.fecha) / 60000 <= 10) de(prev.autor).provoca++;
    }
    if (prev && prev.autor !== m.autor) { const dt = (m.fecha - prev.fecha) / 60000; if (dt >= 0 && dt < 60) respuestas.push(dt); }
  });
  textos.forEach((m) => { palabras += palabrasDe(m.texto).length; });
  const por100 = (n) => r1((n / ms.length) * 100);

  const numeros = {
    msgDiaMiembro: r1(ms.length / dias / miembros),
    recordDiaMiembro: r1(diasIntensos(ms, 1)[0].mensajes / miembros),
    racha: rec.racha.dias,
    silencio: rec.silencio ? rec.silencio.dias : 0,
    madrugadaPct: por100(madrugada),
    palabrasMsg: textos.length ? r1(palabras / textos.length) : 0,
    emojis100: por100(emojis),
    palabrotas100: por100(palabrotas),
    risas100: por100(risas),
  };
  const resp = respuestas.length >= 20 ? mediana(respuestas) : null;
  if (resp != null) numeros.respuestaMin = r1(resp);

  // Quién destaca en cada cosa. Solo cuenta gente con peso en el chat (5 % de los mensajes o más).
  const peso = eq.filter((x) => x.mensajes / ms.length >= 0.05);
  const elQueMas = (valor, lista = peso) => {
    if (lista.length < 2) return null;
    const [mejor, segundo] = [...lista].sort((a, b) => valor(b) - valor(a));
    return valor(segundo) === valor(mejor) ? null : mejor.nombre; // empate: no hay «el que más»
  };
  const ratio = (campo) => (x) => p[x.nombre][campo] / x.mensajes;
  const hay = (campo) => peso.reduce((a, x) => a + p[x.nombre][campo], 0) >= 5; // con menos de 5 casos no hay nada que contar
  const quien = {
    masEscribe: elQueMas((x) => x.mensajes),
    empieza: elQueMas((x) => x.pctInicia),
    masMalhablado: hay('palabrotas') ? elQueMas(ratio('palabrotas')) : null,
    comico: hay('provoca') ? elQueMas(ratio('provoca')) : null,
    carinoso: hay('carino') ? elQueMas(ratio('carino')) : null,
    tardaMas: elQueMas((x) => x.respuestaMin, peso.filter((x) => x.respuestaMin != null)),
    trasnochador: hay('madrugada') ? elQueMas(ratio('madrugada')) : null,
  };
  const genero = {};
  Object.entries(quien).forEach(([k, nombre]) => { const g = nombre && generoDe(nombre); if (g) genero[k] = g; });

  return { v: 1, numeros, genero };
}

/** Tramo (0..n) de un valor según los cortes que manda el servidor: igual que bisect_right en Python. */
export function tramoDe(valor, cortes) {
  let i = 0;
  while (i < cortes.length && valor >= cortes[i]) i++;
  return i;
}

/** % de chats con un valor menor que el tuyo (la mitad de tu propio tramo cuenta como empate). */
export function percentil(valor, cortes, cuentas) {
  const total = cuentas.reduce((a, b) => a + b, 0);
  if (!total) return null;
  const t = tramoDe(valor, cortes);
  const debajo = cuentas.slice(0, t).reduce((a, b) => a + b, 0);
  return Math.round(((debajo + (cuentas[t] || 0) / 2) / total) * 100);
}

const CLAVE_ENVIADOS = 'cs_comparativa_enviados';

/**
 * Manda la ficha una sola vez por chat y navegador. Devuelve true si la ha mandado ahora.
 * Si falla la red no se marca, así que se reintenta la próxima vez que se vea el chat.
 */
export async function enviarFicha(ficha, textoChat, { apiUrl, ia = false, fetchFn = fetch, storage = window.localStorage } = {}) {
  if (!ficha) return false;
  const h = (ia ? 'ia-' : '') + huella(textoChat);
  let enviados = [];
  try { enviados = JSON.parse(storage.getItem(CLAVE_ENVIADOS) || '[]'); } catch (e) { enviados = []; }
  if (enviados.includes(h) || enCurso.has(h)) return false;
  enCurso.add(h); // si la sección se monta dos veces seguidas, el segundo envío no sale
  try {
    const r = await fetchFn(`${apiUrl}/api/comparativa${ia ? '/ia' : ''}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ficha),
    });
    if (!r.ok) return false;
  } catch (e) { return false; } finally { enCurso.delete(h); }
  storage.setItem(CLAVE_ENVIADOS, JSON.stringify([...enviados, h].slice(-200)));
  return true;
}
const enCurso = new Set();

// Listas cerradas de la parte de IA: las mismas que zipback/services/comparativa.py (LISTAS_IA)
export const LISTAS_IA = {
  temas: ['planes', 'trabajo_estudios', 'familia', 'amor_pareja', 'amistad', 'humor', 'cotilleo', 'ocio', 'comida', 'viajes', 'dinero_compras', 'desahogo'],
  momento: ['celebracion', 'viaje', 'reencuentro', 'noticia_importante', 'plan_especial', 'reconciliacion', 'apoyo', 'broma', 'declaracion', 'ninguno'],
  recomendacion: ['escuchar_mas', 'repartir_iniciativa', 'expresar_carino', 'hablar_claro', 'resolver_conflictos', 'mas_planes_juntos', 'respetar_espacio', 'responder_antes'],
  rasgos: ['divertido', 'carinoso', 'organizador', 'protector', 'ironico', 'reflexivo', 'impulsivo', 'positivo', 'critico', 'reservado', 'hablador', 'detallista', 'independiente', 'empatico', 'competitivo'],
  dinamica: ['apoyo_mutuo', 'complicidad', 'cooperacion', 'rutina', 'tension', 'desconexion'],
};

/**
 * Ficha de la parte de IA a partir de la línea COMPARATIVA_DATA:{...} de la respuesta del análisis.
 * Se queda solo con valores de las listas (lo demás se descarta); null si no hay nada aprovechable.
 */
export function fichaIA(respuesta) {
  const m = typeof respuesta === 'string' && respuesta.match(/COMPARATIVA_DATA:\s*(\{[^{}]*\})/);
  if (!m) return null;
  let d;
  try { d = JSON.parse(m[1]); } catch (e) { return null; }
  const ficha = { v: 1 };
  const enLista = (k, x) => typeof x === 'string' && LISTAS_IA[k].includes(x.trim().toLowerCase());
  const norm = (x) => x.trim().toLowerCase();
  if (Array.isArray(d.temas)) { const t = [...new Set(d.temas.filter((x) => enLista('temas', x)).map(norm))].slice(0, 3); if (t.length) ficha.temas = t; }
  if (Array.isArray(d.rasgos)) { const r = d.rasgos.filter((x) => enLista('rasgos', x)).map(norm).slice(0, 20); if (r.length) ficha.rasgos = r; }
  ['momento', 'recomendacion', 'dinamica'].forEach((k) => { if (enLista(k, d[k])) ficha[k] = norm(d[k]); });
  const nota = Number(d.nota);
  if (Number.isInteger(nota) && nota >= 1 && nota <= 10) ficha.nota = nota;
  return Object.keys(ficha).length > 1 ? ficha : null;
}

/** Huella local del chat para no contarlo dos veces desde el mismo navegador. No sale del dispositivo. */
export function huella(texto) {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) { h ^= texto.charCodeAt(i); h = Math.imul(h, 16777619); }
  return `${texto.length}-${(h >>> 0).toString(36)}`;
}
