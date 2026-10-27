// Paso 1 de la propuesta: puntuación sin IA.
// Da a cada mensaje una puntuación y resume el chat por días, para que el
// modelo reciba candidatos y contexto en vez de los 3.000+ mensajes.

const AFECTO = /\b(te quiero|t'estimo|te amo|love you|te echo de menos|et trobo a faltar|miss you|guapa|guapo|cari|amor|mi vida|bonita|bonito|precios[oa]|gracias por|me encanta|orgullos[oa]|feliz|felicidades|enhorabuena|abrazo|beso|besos|muá|muak)\b/i;
const HITO = /\b(boda|casar|embaraz|bebé|nacid|cumple|cumpleaños|aniversario|navidad|reyes|nochevieja|fin de año|viaje|vuelo|hotel|playa|montaña|mudanza|piso nuevo|casa nueva|entrevista|trabajo nuevo|contrato|examen|aprobad|graduaci|hospital|operaci|médico|funeral|enterr|despedida|primera vez|por fin|sorpresa|regalo|concierto|partido|maratón|carrera|libro|curso|ateneu|novela|editorial|publicar|portada)\b/i;
const RISA = /\b(jaja+|jeje+|jiji+|haha+|lol|xd)\b|😂|🤣|😅|😆/i;
const EMOJI_FUERTE = /❤️|😍|🥰|😘|💕|💖|🎉|🥳|🙏|😭|🤗/;
const RUIDO = /^(ok|oki|okey|vale|va|sí|si|no|ya|jaja+|jeje+|jiji+|👍|👌|😂|🤣|😘|❤️|k|q|xd|bien|genial|guay|perfecto|claro|nada|ahora|luego|después|voy|llego|estoy|dime|hola|buenas|buenos días|bona nit|buenas noches|hasta luego|adiós|chao|ciao)[.!?\s]*$/i;

const log = Math.log;

export function puntuar(mensajes) {
  const n = mensajes.length;
  const porDia = new Map();
  for (const m of mensajes) {
    if (!porDia.has(m.dia)) porDia.set(m.dia, []);
    porDia.get(m.dia).push(m);
  }
  const dias = [...porDia.keys()].sort();
  const counts = dias.map(d => porDia.get(d).length);
  const mediana = [...counts].sort((a, b) => a - b)[Math.floor(counts.length / 2)] || 1;
  const vistas = new Set();
  const primerDia = mensajes[0]?.dia, ultimoDia = mensajes.at(-1)?.dia;

  for (let i = 0; i < n; i++) {
    const m = mensajes[i];
    let s = 0;
    const razones = [];
    if (['system', 'deleted', 'contact', 'document'].includes(m.tipo)) { m.score = -99; m.razones = ['sistema']; continue; }
    const t = m.texto;
    if (m.tipo === 'text' || m.tieneTexto) {
      if (RUIDO.test(t)) { s -= 3; razones.push('ruido'); }
      const len = t.length;
      if (len >= 40) { s += Math.min(3, log(len / 20)); razones.push('largo'); }
      if (AFECTO.test(t)) { s += 3; razones.push('afecto'); }
      if (HITO.test(t)) { s += 2.5; razones.push('hito'); }
      if (RISA.test(t)) { s += 0.8; razones.push('risa'); }
      if (EMOJI_FUERTE.test(t)) { s += 1; razones.push('emoji'); }
      if (/\?/.test(t) && len > 25) { s += 0.5; }
      // primera aparición de una palabra de hito
      const h = t.match(HITO);
      if (h) { const k = h[0].toLowerCase(); if (!vistas.has(k)) { vistas.add(k); s += 1.5; razones.push('primera:' + k); } }
    }
    if (m.tipo === 'image') { s += 2.5; razones.push('foto'); }
    if (m.tipo === 'video') { s += 1.5; razones.push('video'); if (m.reenviado) { s -= 3; razones.push('meme'); } }
    if (m.tipo === 'gif' || m.tipo === 'sticker') { s += 0.3; }
    if (m.tipo === 'link') { s -= 1; razones.push('enlace'); }
    if (m.tipo === 'audio') { s -= 0.5; }
    if (m.reenviado) { s -= 2; razones.push('reenviado'); }
    // respuesta rápida del otro (conversación viva)
    const prev = mensajes[i - 1];
    if (prev && prev.autor && prev.autor !== m.autor && (m.fecha - prev.fecha) < 2 * 60 * 1000) { s += 0.7; }
    // día intenso
    const nd = porDia.get(m.dia).length;
    if (nd > 3 * mediana) { s += 1.5; razones.push('día intenso'); } else if (nd > 1.5 * mediana) { s += 0.7; }
    // primera y última conversación
    if (m.dia === primerDia || m.dia === ultimoDia) { s += 1.5; razones.push('inicio/fin'); }
    // hora: madrugada y noche tardía suelen ser conversaciones de verdad
    const h = m.fecha.getHours();
    if (h >= 23 || h < 2) { s += 0.5; }
    m.score = Math.round(s * 10) / 10;
    m.razones = razones;
  }

  const resumenDias = dias.map(d => {
    const ms = porDia.get(d);
    const textos = ms.filter(m => m.tipo === 'text' && m.score > 0);
    const top = [...textos].sort((a, b) => b.score - a.score).slice(0, 4);
    return {
      dia: d, n: ms.length, fotos: ms.filter(m => m.tipo === 'image').length,
      videos: ms.filter(m => m.tipo === 'video').length,
      score: Math.round(ms.reduce((a, m) => a + Math.max(0, m.score || 0), 0)),
      hitos: [...new Set(ms.flatMap(m => (m.razones || []).filter(r => r.startsWith('primera:')).map(r => r.slice(8))))],
      top: top.map(m => `${m.autor === 'Tú' ? 'A' : 'B'}: ${m.texto.replace(/\s+/g, ' ').slice(0, 110)}`),
    };
  });
  return { mensajes, resumenDias, mediana };
}

export function candidatos(mensajes, max = 1500) {
  return mensajes.filter(m => m.score > 0).sort((a, b) => b.score - a.score).slice(0, max).sort((a, b) => a.id - b.id);
}

// Semanas: el modelo trabaja mejor con bloques de tiempo que con días sueltos.
export function resumenSemanas(resumenDias) {
  const sem = new Map();
  for (const d of resumenDias) {
    const f = new Date(d.dia);
    const lunes = new Date(f); lunes.setDate(f.getDate() - ((f.getDay() + 6) % 7));
    const k = lunes.toISOString().slice(0, 10);
    if (!sem.has(k)) sem.set(k, { semana: k, n: 0, fotos: 0, score: 0, hitos: [], top: [] });
    const s = sem.get(k);
    s.n += d.n; s.fotos += d.fotos; s.score += d.score; s.hitos.push(...d.hitos); s.top.push(...d.top.map(t => `${d.dia.slice(5)} ${t}`));
  }
  for (const s of sem.values()) { s.hitos = [...new Set(s.hitos)]; s.top = s.top.slice(0, 10); }
  return [...sem.values()];
}
