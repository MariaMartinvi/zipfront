// Análisis gratis de la página de resultados que se calculan en el navegador, sin IA:
// días más intensos, récords, equilibrio, antes y ahora y (en grupos) quién contesta a quién.
// Entrada: mensajes ya parseados (libro/parser.js): { fecha: Date, dia: 'aaaa-mm-dd', autor, tipo, texto }.

const DIA_MS = 86400000;
const validos = (mensajes) => mensajes.filter((m) => m.autor && m.tipo !== 'system' && m.fecha);
const contar = (lista, clave) => lista.reduce((a, x) => { const k = clave(x); a[k] = (a[k] || 0) + 1; return a; }, {});
const top = (obj, n) => Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, n);
const mediana = (xs) => { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const diasEntre = (a, b) => Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / DIA_MS);

/** Los n días con más mensajes: [{ dia, mensajes, quien (quién escribió más ese día) }]. */
export function diasIntensos(mensajes, n = 5) {
  const ms = validos(mensajes);
  return top(contar(ms, (m) => m.dia), n).map(([dia, total]) => ({
    dia, mensajes: total, quien: top(contar(ms.filter((m) => m.dia === dia), (m) => m.autor), 1)[0][0],
  }));
}

/** Récords del chat. Cada uno puede ser null si el chat no da para calcularlo. */
export function records(mensajes) {
  const ms = validos(mensajes);
  if (!ms.length) return null;
  const dias = [...new Set(ms.map((m) => m.dia))].sort();

  // Racha más larga de días seguidos hablando
  let racha = { dias: 1, desde: dias[0], hasta: dias[0] }, ini = dias[0];
  for (let i = 1; i <= dias.length; i++) {
    if (i === dias.length || diasEntre(dias[i - 1], dias[i]) !== 1) {
      const largo = diasEntre(ini, dias[i - 1]) + 1;
      if (largo > racha.dias) racha = { dias: largo, desde: ini, hasta: dias[i - 1] };
      ini = dias[i];
    }
  }

  // Silencio más largo: días completos sin ningún mensaje
  let silencio = null;
  for (let i = 1; i < dias.length; i++) {
    const hueco = diasEntre(dias[i - 1], dias[i]) - 1;
    if (hueco >= 2 && (!silencio || hueco > silencio.dias)) silencio = { dias: hueco, desde: dias[i - 1], hasta: dias[i] };  // 1 día sin hablar no es un récord
  }

  // Mensaje más largo (en palabras)
  const palabras = (m) => (m.texto || '').trim().split(/\s+/).filter(Boolean).length;
  const largo = ms.filter((m) => m.tipo === 'text').reduce((b, m) => (palabras(m) > (b ? palabras(b) : 0) ? m : b), null);

  // El mensaje más tardío de la madrugada (entre las 00:00 y las 05:59)
  const minutos = (m) => m.fecha.getHours() * 60 + m.fecha.getMinutes();
  const tarde = ms.filter((m) => m.fecha.getHours() < 6).reduce((b, m) => (!b || minutos(m) > minutos(b) ? m : b), null);

  return {
    racha,
    silencio,
    mensajeLargo: largo && palabras(largo) >= 20 ? { autor: largo.autor, palabras: palabras(largo), dia: largo.dia } : null,
    madrugada: tarde ? { autor: tarde.autor, dia: tarde.dia, hora: `${String(tarde.fecha.getHours()).padStart(2, '0')}:${String(tarde.fecha.getMinutes()).padStart(2, '0')}` } : null,
    diasHablando: dias.length,
  };
}

/** Por persona: % de mensajes, conversaciones que empieza (tras 8 h de silencio) y mediana de respuesta en minutos. */
export function equilibrio(mensajes) {
  const ms = validos(mensajes);
  const p = {};
  const de = (a) => (p[a] || (p[a] = { nombre: a, mensajes: 0, inicia: 0, resp: [] }));
  let prev = null;
  for (const m of ms) {
    const x = de(m.autor);
    x.mensajes++;
    if (!prev || (m.fecha - prev.fecha) / 3600000 > 8) x.inicia++;
    else if (prev.autor !== m.autor) { const dt = (m.fecha - prev.fecha) / 60000; if (dt >= 0 && dt < 60) x.resp.push(dt); }
    prev = m;
  }
  const inicios = Object.values(p).reduce((a, x) => a + x.inicia, 0) || 1;
  // Fuera quien casi no escribe (menos del 1 %: un número que mandó un mensaje suelto)
  return Object.values(p).filter((x) => x.mensajes / ms.length >= 0.01).sort((a, b) => b.mensajes - a.mensajes).map((x) => ({
    nombre: x.nombre, mensajes: x.mensajes,
    pctMensajes: Math.round((x.mensajes / ms.length) * 100),
    pctInicia: Math.round((x.inicia / inicios) * 100),
    respuestaMin: x.resp.length >= 5 ? mediana(x.resp) : null,
  }));
}

/** Primeros 90 días frente a los últimos 90 (solo si el chat dura al menos 180 días). */
export function antesYAhora(mensajes) {
  const ms = validos(mensajes);
  if (!ms.length) return null;
  const t0 = ms[0].fecha.getTime(), t1 = ms[ms.length - 1].fecha.getTime();
  if (t1 - t0 < 180 * DIA_MS) return null;
  const tramo = (lista) => {
    if (!lista.length) return null;
    const horas = contar(lista, (m) => m.fecha.getHours());
    const [quien, n] = top(contar(lista, (m) => m.autor), 1)[0];
    return { porDia: Math.round(lista.length / 90), horaPunta: `${top(horas, 1)[0][0]}:00`, quien, pctQuien: Math.round((n / lista.length) * 100) };
  };
  const antes = tramo(ms.filter((m) => m.fecha.getTime() < t0 + 90 * DIA_MS));
  const ahora = tramo(ms.filter((m) => m.fecha.getTime() > t1 - 90 * DIA_MS));
  return antes && ahora ? { antes, ahora } : null;
}

/** Solo grupos (3 o más personas): quién contesta a quién y quién reaviva el grupo tras un día de silencio. */
export function dinamicaGrupo(mensajes) {
  const ms = validos(mensajes);
  // Grupo de verdad: al menos 3 personas que escriben cada una un 2 % o más de los mensajes
  const porAutor = contar(ms, (m) => m.autor);
  if (Object.values(porAutor).filter((x) => x / ms.length >= 0.02).length < 3) return null;
  const pares = {}, reaviva = {};
  let prev = null;
  for (const m of ms) {
    if (prev) {
      const min = (m.fecha - prev.fecha) / 60000;
      if (prev.autor !== m.autor && min >= 0 && min <= 10) { const k = `${m.autor}\u0000${prev.autor}`; pares[k] = (pares[k] || 0) + 1; }
      if (min > 24 * 60) reaviva[m.autor] = (reaviva[m.autor] || 0) + 1;
    }
    prev = m;
  }
  return {
    pares: top(pares, 3).map(([k, veces]) => { const [quien, aQuien] = k.split('\u0000'); return { quien, aQuien, veces }; }),
    reaviva: top(reaviva, 3).map(([nombre, veces]) => ({ nombre, veces })),
  };
}
