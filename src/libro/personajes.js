// Los 12 personajes de ChatSalsa (Analisis_top.py), con las mismas reglas, sobre mensajes ya parseados.
// Devuelve, por persona, sus categorías ganadas con el dato que las justifica.

export const ICON = { profesor: '👨‍🏫', rollero: '📜', pistolero: '🔫', vampiro: '🧛', cafeconleche: '☕', dejaenvisto: '👻', narcicista: '🤳', puntofinal: '🔚', fosforo: '🔥', menosesmas: '🔍', chismoso: '👂', happyflower: '😊', amoroso: '❤️', bombardero: '💥', comico: '🤡', agradecido: '🙏', disculpon: '🙇', curioso: '🧐', mala_influencia: '👹' };
const CAT = {
  profesor:     { nombre: 'El Profesor',       f: 'La Profesora',       dato: d => `${d.palabrasUnicas} palabras distintas` },
  rollero:      { nombre: 'El Rollero',        f: 'La Rollera',         dato: d => `${d.palabrasPorMensaje.toFixed(1)} palabras por mensaje` },
  pistolero:    { nombre: 'El Pistolero',      f: 'La Pistolera',       dato: d => `responde en ${fmtMin(d.respuesta)}` },
  vampiro:      { nombre: 'El Vampiro',        f: 'La Vampira',         dato: d => `${d.pctNoche.toFixed(0)} % de sus mensajes, de noche` },
  cafeconleche: { nombre: 'El Café con leche', f: 'La Café con leche',  dato: d => `escribe de media a las ${d.horaMedia}` },
  dejaenvisto:  { nombre: 'El Deja en visto',  f: 'La Deja en visto',   dato: d => `tarda ${fmtMin(d.respuesta)} en contestar` },
  narcicista:   { nombre: 'El Narcisista',     f: 'La Narcisista',      dato: d => `${d.pctYo.toFixed(0)} % de mensajes hablando de sí` },
  puntofinal:   { nombre: 'El Punto final',    f: 'La Punto final',     dato: d => `cierra ${d.cierra} conversaciones` },
  fosforo:      { nombre: 'El Fósforo',        f: 'La Fósforo',         dato: d => `enciende ${d.inicia} conversaciones` },
  menosesmas:   { nombre: 'El Menos es más',   f: 'La Menos es más',    dato: d => `${d.longitudMedia.toFixed(0)} letras por mensaje` },
  chismoso:     { nombre: 'El Chismoso',       f: 'La Chismosa',        dato: d => `${d.pctOtros.toFixed(0)} % de mensajes sobre terceros` },
  happyflower:  { nombre: 'Happy Flower',      f: 'Happy Flower',       dato: d => `${d.emojisPorMensaje.toFixed(2)} emojis por mensaje` },
  amoroso:      { nombre: 'El Amoroso',        f: 'La Amorosa',         dato: d => `${d.emojisAmor} emojis de amor` },
  bombardero:   { nombre: 'El Bombardero',     f: 'La Bombardera',      dato: d => `rachas de ${d.rachaMax} mensajes seguidos` },
  comico:       { nombre: 'El Cómico',         f: 'La Cómica',          dato: d => `${d.pctRisa.toFixed(0)} % de mensajes con risas` },
  agradecido:   { nombre: 'El Agradecido',     f: 'La Agradecida',      dato: d => `da las gracias ${d.gracias} veces` },
  disculpon:    { nombre: 'El Disculpón',      f: 'La Disculpona',      dato: d => `pide perdón ${d.perdon} veces` },
  curioso:      { nombre: 'El Curioso',        f: 'La Curiosa',         dato: d => `${d.preguntas} preguntas` },
  mala_influencia: { nombre: 'Mala Influencia', f: 'Mala Influencia',   dato: d => `${d.vicios} menciones a vicios` },
};

const fmtMin = m => m < 1 ? `${Math.round(m * 60)} s` : m < 60 ? `${Math.round(m)} min` : `${(m / 60).toFixed(1)} h`;
const EMOJI = /\p{Extended_Pictographic}/gu;
const YO = /\b(yo|me|mi|mío|mía|mis|conmigo|jo|em|meu|meva)\b/i;

export function personajes(mensajes, opts = {}) {
  const { genero = {} } = opts; // { 'Eva': 'f' }
  const u = {};
  const get = a => (u[a] ||= { mensajes: 0, palabras: 0, unicas: new Set(), ppm: [], resp: [], noche: 0, horas: [], yo: 0, termina: 0, inicia: 0, longitud: [], otros: 0, emojis: 0, amor: 0, racha: 0, rachaMax: 0, risa: 0, gracias: 0, perdon: 0, preguntas: 0, vicios: 0 });
  const AMOR = /[😍😘🥰😗😙😚💋❤️🧡💛💝💘💖💗💓💞💕❣️💔🩷💚🩵💙💜🖤🩶🤍🤎💟🌹🌷💐🥀💏]/gu;
  const RISA = /\b(jaja+|jeje+|jiji+|haha+|lol|xd)\b|😂|🤣|😆|😹/i;
  const GRACIAS = /\b(gracias|gràcies|agradec|agradezco|agradecid|thank|thx|merci)\b/i;
  const PERDON = /\b(perd[oó]n|perdona|disculpa|lo siento|sorry|my bad|me equivoqu[eé]|ho sento)\b/i;
  const PREGUNTA = /\?|\b(qu[eéè]|c[oó]mo|cu[aá]ndo|d[oó]nde|por qu[eé]|qui[eé]n|cu[aá]l)\b/i;
  const VICIOS = /\b(cerveza|birra|vino|copa|copas|chupito|cubata|resaca|borrach|fumar|porro|tabaco|cigarro|joder|mierda|coño|hostia|puta|cabr[oó]n|gilipollas)\b/i;
  const autores = new Set(mensajes.filter(m => m.autor && m.tipo !== 'system').map(m => m.autor));
  let prev = null;
  for (let i = 0; i < mensajes.length; i++) {
    const m = mensajes[i];
    if (!m.autor || m.tipo === 'system') continue;
    const d = get(m.autor);
    const t = m.texto || '';
    const palabras = t.toLowerCase().match(/[\p{L}\p{N}']+/gu) || [];
    d.mensajes++; d.palabras += palabras.length; palabras.forEach(w => d.unicas.add(w));
    d.ppm.push(palabras.length); d.longitud.push(t.length);
    const h = new Date(m.fecha).getHours();
    if (h >= 22 || h < 6) d.noche++;
    d.horas.push(h);
    if (YO.test(t)) d.yo++;
    for (const a of autores) if (a !== m.autor && t.toLowerCase().includes(a.toLowerCase().split(' ')[0])) { d.otros++; break; }
    d.emojis += (t.match(EMOJI) || []).length;
    d.amor += (t.match(AMOR) || []).length;
    if (RISA.test(t)) d.risa++; if (GRACIAS.test(t)) d.gracias++; if (PERDON.test(t)) d.perdon++;
    if (PREGUNTA.test(t)) d.preguntas++; if (VICIOS.test(t)) d.vicios++;
    if (prev && prev.autor === m.autor) { d.racha++; } else { d.racha = 1; } if (d.racha > d.rachaMax) d.rachaMax = d.racha;
    if (prev) {
      const dt = (m.fecha - prev.fecha) / 60000;
      if (prev.autor !== m.autor && dt < 60) d.resp.push(dt);
      if (dt > 480) d.inicia++;
      const next = mensajes[i + 1];
      if (!next || (next.fecha - m.fecha) / 60000 > 30) d.termina++;
    } else d.inicia++;
    prev = m;
  }
  const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
  const datos = {};
  for (const [a, d] of Object.entries(u)) {
    datos[a] = {
      mensajes: d.mensajes, palabrasUnicas: d.unicas.size, ratioUnicas: d.unicas.size / Math.max(d.mensajes, 1),
      palabrasPorMensaje: mean(d.ppm), respuesta: d.resp.length ? mean(d.resp) : null,
      pctNoche: d.noche / Math.max(d.mensajes, 1) * 100, horaMediaNum: mean(d.horas),
      horaMedia: (() => { const x = mean(d.horas); return `${String(Math.floor(x)).padStart(2, '0')}:${String(Math.round((x % 1) * 60)).padStart(2, '0')}`; })(),
      pctYo: d.yo / Math.max(d.mensajes, 1) * 100, cierra: d.termina, inicia: d.inicia,
      longitudMedia: mean(d.longitud), pctOtros: d.otros / Math.max(d.mensajes, 1) * 100,
      emojisPorMensaje: d.emojis / Math.max(d.mensajes, 1), emojisTotales: d.emojis,
      emojisAmor: d.amor, rachaMax: d.rachaMax, pctRisa: d.risa / Math.max(d.mensajes, 1) * 100, gracias: d.gracias, perdon: d.perdon, preguntas: d.preguntas, vicios: d.vicios,
    };
  }
  const nombres = Object.keys(datos);
  const win = (key, fn, min = false) => {
    const c = nombres.filter(n => datos[n][key] != null);
    if (!c.length) return null;
    return c.reduce((b, n) => (min ? fn(datos[n]) < fn(datos[b]) : fn(datos[n]) > fn(datos[b])) ? n : b, c[0]);
  };
  const ganadores = {
    profesor: win('ratioUnicas', d => d.ratioUnicas), rollero: win('palabrasPorMensaje', d => d.palabrasPorMensaje),
    pistolero: win('respuesta', d => d.respuesta, true), vampiro: win('pctNoche', d => d.pctNoche),
    cafeconleche: win('horaMediaNum', d => -Math.abs(d.horaMediaNum - 9)), dejaenvisto: win('respuesta', d => d.respuesta),
    narcicista: win('pctYo', d => d.pctYo), puntofinal: win('cierra', d => d.cierra), fosforo: win('inicia', d => d.inicia),
    menosesmas: win('longitudMedia', d => d.longitudMedia, true), chismoso: win('pctOtros', d => d.pctOtros),
    happyflower: win('emojisPorMensaje', d => d.emojisPorMensaje),
    amoroso: win('emojisAmor', d => d.emojisAmor), bombardero: win('rachaMax', d => d.rachaMax), comico: win('pctRisa', d => d.pctRisa),
    agradecido: win('gracias', d => d.gracias), disculpon: win('perdon', d => d.perdon), curioso: win('preguntas', d => d.preguntas),
    mala_influencia: win('vicios', d => d.vicios),
  };
  // ordenar las categorías de cada persona por lo "marcadas" que están (diferencia relativa con el otro)
  const porPersona = {};
  for (const n of nombres) porPersona[n] = [];
  const MIN = { vampiro: d => d.pctNoche >= 8, narcicista: d => d.pctYo >= 15, chismoso: d => d.pctOtros >= 5,
                happyflower: d => d.emojisPorMensaje >= 0.15, dejaenvisto: d => d.respuesta >= 5, profesor: d => d.palabrasUnicas >= 150,
                amoroso: d => d.emojisAmor >= 5, bombardero: d => d.rachaMax >= 6, comico: d => d.pctRisa >= 8, agradecido: d => d.gracias >= 5,
                disculpon: d => d.perdon >= 3, curioso: d => d.preguntas >= 10, mala_influencia: d => d.vicios >= 5 };
  for (const [k, n] of Object.entries(ganadores)) {
    if (!n) continue;
    if (MIN[k] && !MIN[k](datos[n])) continue;
    const g = genero[n] === 'f';
    porPersona[n].push({ key: k, icono: ICON[k], titulo: g ? CAT[k].f : CAT[k].nombre, dato: CAT[k].dato(datos[n]) });
  }
  const orden = ['pistolero', 'comico', 'amoroso', 'rollero', 'vampiro', 'bombardero', 'happyflower', 'fosforo', 'mala_influencia', 'curioso', 'profesor', 'agradecido', 'disculpon', 'puntofinal', 'dejaenvisto', 'menosesmas', 'narcicista', 'chismoso', 'cafeconleche'];
  for (const n of nombres) porPersona[n].sort((a, b) => orden.indexOf(a.key) - orden.indexOf(b.key));
  // emoji favorito y hora punta
  const extra = {};
  for (const n of nombres) {
    const emo = {}; const hs = {};
    for (const m of mensajes) if (m.autor === n) { for (const e of (m.texto || '').match(EMOJI) || []) emo[e] = (emo[e] || 0) + 1; const h = new Date(m.fecha).getHours(); hs[h] = (hs[h] || 0) + 1; }
    extra[n] = { emoji: Object.entries(emo).sort((a, b) => b[1] - a[1])[0]?.[0] || null,
                 horaPunta: Object.entries(hs).sort((a, b) => b[1] - a[1])[0]?.[0] };
  }
  return { datos, porPersona, extra };
}
