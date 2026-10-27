// Propuesta de capítulos sin IA: agrupa los días fuertes en bloques y los titula con lo que hay.
// Los títulos con IA (Mistral, vía zipback) sustituirán a estos cuando estén; la estructura es la misma.
import { puntuar } from './scorer.js';

const BURBUJAS_POR_PAGINA = 22;
const PESO_FOTO = 0.35;
const UMBRAL = 0.5;
const MAX_PAG_CAP = 6;
const PEGADO = /(^|\n)(The user prompt|Investig[óo] |Hecho\. |Estimando |Ubicación: \d|Tres escenarios|En resumen|Resumen:|Conclusi[óo]n)|https?:\/\/|\n\s*[-•*]\s|—/i;
const MUY_LARGO = 600;
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function tituloDeBloque(dias, resumen) {
  // hito detectado > palabra más repetida en los mensajes top > mes
  const hitos = dias.flatMap(d => resumen.get(d)?.hitos || []);
  const mapa = { viaje: 'El viaje', hotel: 'El hotel', playa: 'La playa', boda: 'La boda', cumple: 'El cumple', cumpleaños: 'El cumpleaños',
    navidad: 'Navidad', mudanza: 'La mudanza', concierto: 'El concierto', examen: 'Los exámenes', partido: 'El partido', bebé: 'El bebé',
    embaraz: 'El embarazo', hospital: 'El hospital', libro: 'El libro', curso: 'El curso', trabajo: 'El trabajo', contrato: 'El contrato' };
  for (const h of hitos) for (const k in mapa) if (h.startsWith(k)) return mapa[k];
  const [y, m] = dias[0].split('-').map(Number);
  const [y2, m2] = dias.at(-1).split('-').map(Number);
  if (y === y2 && m === m2) return `${MESES[m - 1][0].toUpperCase()}${MESES[m - 1].slice(1)} de ${y}`;
  return `De ${MESES[m - 1]} a ${MESES[m2 - 1]} de ${y2}`;
}

export function proponer(mensajes, { maxCapitulos = 14, encendidos = 8 } = {}) {
  const { resumenDias } = puntuar(mensajes);
  const resumen = new Map(resumenDias.map(d => [d.dia, d]));
  // 1) días fuertes: score por encima de la mediana*2, ordenados por fecha
  const scores = resumenDias.map(d => d.score).sort((a, b) => a - b);
  const med = scores[Math.floor(scores.length / 2)] || 1;
  const fuertes = resumenDias.filter(d => d.score >= Math.max(med * 2, 20)).map(d => d.dia).sort();
  // 2) agrupar días fuertes cercanos (≤ 4 días de hueco) en bloques
  const bloques = [];
  for (const d of fuertes) {
    const last = bloques.at(-1);
    if (last && (new Date(d) - new Date(last.at(-1))) / 864e5 <= 4) last.push(d); else bloques.push([d]);
  }
  // 3) asegurar inicio y fin
  const primero = mensajes[0]?.dia, ultimo = mensajes.at(-1)?.dia;
  if (primero && !bloques.some(b => b[0] <= primero && b.at(-1) >= primero)) bloques.unshift([primero]);
  if (ultimo && !bloques.some(b => b[0] <= ultimo && b.at(-1) >= ultimo)) bloques.push([ultimo]);
  // 4) puntuar bloques y quedarse con los mejores
  const caps = bloques.map(b => {
    const dias = resumenDias.filter(d => d.dia >= b[0] && d.dia <= b.at(-1)).map(d => d.dia);
    const score = dias.reduce((a, d) => a + (resumen.get(d)?.score || 0), 0);
    return { titulo: tituloDeBloque(dias, resumen), desde: b[0], hasta: b.at(-1), score };
  }).sort((a, b) => b.score - a.score).slice(0, maxCapitulos).sort((a, b) => a.desde.localeCompare(b.desde));
  const top = new Set([...caps].sort((a, b) => b.score - a.score).slice(0, encendidos));
  for (const c of caps) { c.on = top.has(c) || c.desde === primero || c.hasta === ultimo; delete c.score; }
  // evitar títulos repetidos
  const seen = {};
  for (const c of caps) { seen[c.titulo] = (seen[c.titulo] || 0) + 1; if (seen[c.titulo] > 1) c.titulo += ` (${seen[c.titulo]})`; }
  return caps;
}

export function montar(mensajes, capitulos, flags = {}) {
  const porDia = new Map();
  for (const m of mensajes) { (porDia.get(m.dia) || porDia.set(m.dia, []).get(m.dia)).push(m); }
  const quitados = flags.quitados || new Set();
  const caps = capitulos.map(c => {
    const dias = [...porDia.keys()].filter(d => d >= c.desde && d <= c.hasta).sort();
    const cand = dias.flatMap(d => porDia.get(d)).filter(m => (m.esMedia || m.tieneTexto) && (m.score || 0) >= UMBRAL
      && !PEGADO.test(m.texto) && m.texto.length < MUY_LARGO && !m.reenviado && m.tipo !== 'audio' && m.tipo !== 'document' && m.tipo !== 'contact' && !quitados.has(m.id));
    const ids = new Set(cand.map(m => m.id));
    for (const m of cand) {
      const nx = mensajes[m.id + 1];
      if (nx && nx.autor && nx.autor !== m.autor && nx.tipo === 'text' && (nx.score || 0) > -3 && (nx.fecha - m.fecha) < 5 * 60e3 && !quitados.has(nx.id)) ids.add(nx.id);
    }
    let sel = [...ids].sort((a, b) => a - b).map(i => mensajes[i]);
    const paginas = s => s.reduce((a, m) => a + (m.tipo === 'image' || m.tipo === 'video' ? PESO_FOTO : 1 / BURBUJAS_POR_PAGINA), 0);
    while (paginas(sel) > MAX_PAG_CAP) {
      const peor = sel.reduce((w, m) => ((m.score || 0) < (w.score || 0) ? m : w), sel[0]);
      sel = sel.filter(m => m !== peor);
    }
    return { ...c, mensajes: sel.map(m => m.id), paginas: Math.ceil(paginas(sel) + 1), fotos: sel.filter(m => m.tipo === 'image').length };
  });
  const encendidos = caps.filter(c => c.on);
  const fijas = 6;
  const total = fijas + encendidos.reduce((a, c) => a + c.paginas, 0);
  return { capitulos: caps, paginasTotales: total % 2 ? total + 1 : total };
}
