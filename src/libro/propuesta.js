// Propuesta de capítulos sin IA: agrupa los días fuertes en bloques y los titula con lo que hay.
// Los títulos con IA (Mistral, vía zipback) sustituirán a estos cuando estén; la estructura es la misma.
import { puntuar } from './scorer.js';

const BURBUJAS_POR_PAGINA = 14;   // ~14 burbujas por página de 20×20 (la paginación real la hace el navegador)
const PESO_FOTO = 0.5;            // dos fotos por página
const RAFAGA_MS = 3 * 60e3;       // fotos de la misma persona en 3 min = ráfaga
const MAX_POR_RAFAGA = 3;
const PRESUPUESTO_CAP = 8;        // páginas por capítulo: el bloque se acota a los días más intensos que quepan
const PEGADO = /(^|\n)(The user prompt|Investig[óo] |Hecho\. |Estimando |Ubicación: \d|Tres escenarios|En resumen|Resumen:|Conclusi[óo]n)|https?:\/\/|\n\s*[-•*]\s|—/i;
const MUY_LARGO = 600;
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

// Lo que entra en el libro es la conversación entera; solo se queda fuera lo que no es conversación.
export function esConversacion(m) {
  if (!m || m.tipo === 'system' || m.tipo === 'deleted' || m.tipo === 'link' || m.reenviado) return false;
  if (m.tipo === 'audio') return !!m.archivo;  // los audios van con QR si están en el zip
  if (['document', 'contact', 'sticker', 'gif', 'media'].includes(m.tipo)) return false;
  if (m.captura || m.videoCorto) return false;  // pantallazos y vídeos-meme: fuera (lo marca el navegador al leer el zip)
  if (m.esMedia) return true;
  if (!m.tieneTexto) return false;
  if (m.texto.length >= MUY_LARGO || PEGADO.test(m.texto)) return false;
  return true;
}

const pesoPaginas = ms => ms.reduce((a, m) => a + (m.tipo === 'image' || m.tipo === 'video' ? PESO_FOTO : 1 / BURBUJAS_POR_PAGINA), 0);

// Acota un bloque de días al tramo contiguo de más puntuación que quepa en el presupuesto de páginas.
function acotar(dias, resumen, porDia) {
  const peso = dias.map(d => pesoPaginas((porDia.get(d) || []).filter(esConversacion)));
  const sc = dias.map(d => resumen.get(d)?.score || 0);
  let mejor = { i: 0, j: 0, score: -1 };
  for (let i = 0; i < dias.length; i++) {
    let p = 0, s = 0;
    for (let j = i; j < dias.length; j++) {
      p += peso[j]; s += sc[j];
      if (p > PRESUPUESTO_CAP && j > i) break;
      if (s > mejor.score) mejor = { i, j, score: s };
      if (p > PRESUPUESTO_CAP) break;
    }
  }
  return dias.slice(mejor.i, mejor.j + 1);
}

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
  const porDia = new Map();
  for (const m of mensajes) { (porDia.get(m.dia) || porDia.set(m.dia, []).get(m.dia)).push(m); }
  const caps = bloques.map(b => {
    const todos = resumenDias.filter(d => d.dia >= b[0] && d.dia <= b.at(-1)).map(d => d.dia);
    const dias = acotar(todos, resumen, porDia);
    const score = dias.reduce((a, d) => a + (resumen.get(d)?.score || 0), 0);
    return { titulo: tituloDeBloque(dias, resumen), desde: dias[0], hasta: dias.at(-1), score };
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
    // la conversación entera de esos días; solo fuera lo que no es conversación y lo quitado a mano
    let sel = dias.flatMap(d => porDia.get(d)).filter(m => esConversacion(m) && !quitados.has(m.id));
    // ráfagas de fotos (la misma persona, pocos minutos): nos quedamos con las 3 mejores
    const fuera = new Set();
    for (let i = 0; i < sel.length; i++) {
      const m = sel[i]; if (m.tipo !== 'image' || fuera.has(m.id)) continue;
      const grupo = [m];
      for (let j = i + 1; j < sel.length && sel[j].fecha - grupo[grupo.length - 1].fecha < RAFAGA_MS; j++) if (sel[j].tipo === 'image' && sel[j].autor === m.autor && !fuera.has(sel[j].id)) grupo.push(sel[j]);
      if (grupo.length > MAX_POR_RAFAGA) [...grupo].sort((a, b) => (b.score || 0) - (a.score || 0)).slice(MAX_POR_RAFAGA).forEach(x => fuera.add(x.id));
    }
    sel = sel.filter(m => !fuera.has(m.id));
    const paginas = pesoPaginas;
    return { ...c, mensajes: sel.map(m => m.id), paginas: Math.ceil(paginas(sel) + 1), fotos: sel.filter(m => m.tipo === 'image').length };
  });
  const encendidos = caps.filter(c => c.on);
  const fijas = 6;
  const total = fijas + encendidos.reduce((a, c) => a + c.paginas, 0);
  return { capitulos: caps, paginasTotales: total % 2 ? total + 1 : total };
}
