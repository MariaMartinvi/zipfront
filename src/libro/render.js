// HTML del libro (misma plantilla para la vista previa y el PDF). 140 × 215 mm + 3 mm de sangrado.
import { EMOJI, personajes } from './personajes';

export const PAGE = { w: 140, h: 215, bleed: 3, margin: 12 };
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const fechaLarga = d => { const [y, m, dd] = d.split('-').map(Number); return `${dd} de ${MESES[m - 1]} de ${y}`; };
const fechaCorta = d => { const [y, m, dd] = d.split('-').map(Number); return `${dd} ${MESES[m - 1].slice(0, 3)} ${y}`; };
const hora = f => { const d = new Date(f); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
const dur = s => s == null ? '' : ` · ${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;

export function stats(mensajes) {
  const txt = mensajes.filter(m => m.tipo === 'text');
  const dias = new Set(mensajes.map(m => m.dia));
  const emo = {};
  for (const m of txt) for (const e of m.texto.match(EMOJI) || []) emo[e] = (emo[e] || 0) + 1;
  const horas = {};
  for (const m of mensajes) { const h = new Date(m.fecha).getHours(); horas[h] = (horas[h] || 0) + 1; }
  const horaPunta = Object.entries(horas).sort((a, b) => b[1] - a[1])[0]?.[0];
  return {
    mensajes: mensajes.length, fotos: mensajes.filter(m => m.tipo === 'image').length, dias: dias.size,
    corazones: txt.reduce((a, m) => a + (m.texto.match(/❤️|❤|🧡|💛|💚|💙|💜|🖤|🤍|💕|💖|😍|🥰/g) || []).length, 0),
    risas: txt.reduce((a, m) => a + (m.texto.match(/jaja|jeje|jiji|😂|🤣/gi) || []).length, 0),
    emojis: Object.entries(emo).sort((a, b) => b[1] - a[1]).slice(0, 5),
    horaPunta: horaPunta != null ? `${horaPunta}:00` : null,
    primero: mensajes[0]?.dia, ultimo: mensajes.at(-1)?.dia,
  };
}

/**
 * @param mensajes   lista parseada
 * @param man        { titulo, subtitulo, portada:{color, foto}, dedicatoria, capitulos:[{titulo, desde, hasta, on, mensajes:[ids]}] }
 * @param opts       { media: {name → {uri}}, videos: {name → {uri, seconds}}, nombres, derecha, genero, fotosPersona, conStats, conIndice, preview }
 */
export function renderHTML(mensajes, man, opts = {}) {
  const { media = {}, videos = {}, nombres = {}, derecha = null, genero = {}, fotosPersona = {}, conStats = true, conIndice = true, preview = false } = opts;
  const nombre = a => nombres[a] || a;
  const encendidos = man.capitulos.filter(c => c.on);
  const st = stats(mensajes);
  const autores = [...new Set(mensajes.filter(m => m.autor && m.tipo !== 'system').map(m => m.autor))];
  const der = derecha || autores[0];

  const bubbles = (ids) => {
    let out = '', ultimoDia = null, ultimoAutor = null;
    for (const id of ids) {
      const m = mensajes[id];
      if (m.dia !== ultimoDia) { out += `<div class="day">${esc(fechaLarga(m.dia))}</div>`; ultimoDia = m.dia; ultimoAutor = null; }
      const side = m.autor === der ? 'r' : 'l';
      const pi = autores.indexOf(m.autor); const pcls = side === 'l' ? ` p${(pi % 4) + 1}` : '';
      const showName = m.autor !== ultimoAutor; ultimoAutor = m.autor;
      let mediaHTML = '';
      if (m.tipo === 'image' && m.archivo && media[m.archivo]) mediaHTML = `<div class="media"><img src="${media[m.archivo].uri}"/></div>`;
      else if (m.tipo === 'video' && m.archivo && videos[m.archivo]) mediaHTML = `<div class="media video"><img src="${videos[m.archivo].uri}"/><span class="vid">vídeo${dur(videos[m.archivo].seconds)}</span></div>`;
      else if (m.tipo === 'image') mediaHTML = `<div class="media missing">foto</div>`;
      if (!mediaHTML && !m.tieneTexto) continue;
      out += `<div class="msg ${side}${pcls}" data-id="${m.id}">${showName ? `<div class="name">${esc(nombre(m.autor))}</div>` : ''}
        <div class="bubble">${mediaHTML}${m.tieneTexto ? `<div class="txt">${esc(m.texto).replace(/\n/g, '<br>')}</div>` : ''}<span class="time">${hora(m.fecha)}</span></div></div>`;
    }
    return out;
  };

  const capsHTML = (preview ? man.capitulos : encendidos).map((c, i) => {
    const k = man.capitulos.indexOf(c);
    const n = encendidos.indexOf(c) + 1;
    return `<section class="chapter-open" data-cap="${k}"><div class="num">${n || ''}</div><h2>${esc(c.titulo)}</h2>
      <div class="range">${esc(fechaCorta(c.desde))} – ${esc(fechaCorta(c.hasta))}</div></section>
    <section class="chapter-body" data-cap="${k}">${bubbles(c.mensajes)}</section>`;
  }).join('');

  const indice = conIndice ? `<section class="toc"><h2>Índice</h2>${encendidos.map((c, i) =>
    `<div class="toc-row"><span>${i + 1}. ${esc(c.titulo)}</span><span class="dots"></span><span class="pg">${esc(fechaCorta(c.desde))}</span></div>`).join('')}</section>` : '';

  const pj = personajes(mensajes, { genero });
  const personajesHTML = `<section class="people"><h2>Los personajes</h2>${autores.map(a => {
    const d = pj.datos[a] || { mensajes: 0 }, cats = (pj.porPersona[a] || []).slice(0, 4), ex = pj.extra[a] || {};
    const foto = fotosPersona[a];
    return `<div class="person"><div class="avatar">${foto ? `<img src="${foto}"/>` : esc(nombre(a).trim()[0] || '?')}</div>
      <div class="pbody"><div class="pname">${esc(nombre(a))}</div>
        <div class="cats">${cats.length ? cats.map(c => `<div class="cat"><b><span class="emo">${c.icono}</span> ${esc(c.titulo)}</b><span>${esc(c.dato)}</span></div>`).join('') : '<div class="cat"><span>sin personaje ganado esta vez</span></div>'}</div>
        <div class="pmeta">${(d.mensajes || 0).toLocaleString('es')} mensajes${ex.emoji ? ` · emoji favorito <span class="emo">${ex.emoji}</span>` : ''}${ex.horaPunta != null ? ` · hora punta ${ex.horaPunta}:00` : ''}</div>
      </div></div>`; }).join('')}<div class="pnote">Personajes según el análisis de ChatSalsa</div></section>`;

  const statsHTML = conStats ? `<section class="stats"><h2>En números</h2><div class="grid">
      <div><b>${st.mensajes.toLocaleString('es')}</b><span>mensajes</span></div><div><b>${st.fotos}</b><span>fotos</span></div>
      <div><b>${st.dias}</b><span>días hablando</span></div><div><b>${st.risas}</b><span>risas</span></div>
      <div><b>${st.corazones}</b><span>corazones</span></div><div><b>${esc(st.horaPunta || '—')}</b><span>hora punta</span></div></div>
    <div class="row"><span>Emojis favoritos</span><span class="emo">${st.emojis.map(([e]) => e).join(' ')}</span></div>
    <div class="row"><span>Del ${esc(fechaLarga(st.primero))}</span><span>al ${esc(fechaLarga(st.ultimo))}</span></div></section>` : '';

  const color = man.portada?.color || '#2f3e46';
  const portadaFoto = man.portada?.foto && media[man.portada.foto] ? media[man.portada.foto].uri : null;
  const M = PAGE.margin + PAGE.bleed;
  const css = `
  @page { size: ${PAGE.w + 2 * PAGE.bleed}mm ${PAGE.h + 2 * PAGE.bleed}mm; margin: 0; }
  * { box-sizing: border-box; } html, body { margin: 0; padding: 0; }
  body { font-family: 'Lora', Georgia, serif; color: #1d1d1b; font-size: 9.5pt; line-height: 1.35; }
  .emo, .txt { font-family: 'Lora', 'Noto Color Emoji', 'Apple Color Emoji', 'Segoe UI Emoji', Georgia, serif; }
  section { page-break-after: always; break-after: page; padding: ${M}mm; min-height: ${PAGE.h + 2 * PAGE.bleed}mm; position: relative; background: #fff; }
  .cover { background: ${esc(color)}; color: #fff; display: flex; flex-direction: column; justify-content: flex-end; }
  .cover .photo { position: absolute; inset: 0; background-size: cover; background-position: center; opacity: .55; }
  .cover h1 { font-size: 26pt; margin: 0 0 4mm; line-height: 1.1; position: relative; }
  .cover .sub { font-family: 'Poppins', sans-serif; font-weight: 300; font-size: 10pt; letter-spacing: .08em; text-transform: uppercase; position: relative; }
  .dedication { display: flex; align-items: center; justify-content: center; text-align: center; font-style: italic; font-size: 11pt; padding: 0 22mm; }
  .toc h2, .stats h2, .people h2 { font-family: 'Poppins', sans-serif; font-weight: 500; font-size: 14pt; margin: 6mm 0 7mm; }
  .toc-row { display: flex; align-items: baseline; margin: 2.2mm 0; font-size: 10pt; } .toc-row .dots { flex: 1; border-bottom: 1px dotted #999; margin: 0 2mm; }
  .toc-row .pg { font-family: 'Poppins', sans-serif; font-size: 8pt; color: #666; }
  .chapter-open { display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; page-break-before: always; break-before: page; }
  .chapter-open .num { font-family: 'Poppins', sans-serif; font-weight: 300; font-size: 40pt; color: #b7b7b2; }
  .chapter-open h2 { font-size: 20pt; font-weight: 500; margin: 2mm 0 3mm; }
  .chapter-open .range { font-family: 'Poppins', sans-serif; font-size: 8.5pt; letter-spacing: .1em; text-transform: uppercase; color: #777; }
  .chapter-body { page-break-after: auto; break-after: auto; min-height: 0; }
  .day { text-align: center; font-family: 'Poppins', sans-serif; font-size: 7.5pt; color: #777; margin: 5mm 0 3mm; letter-spacing: .05em; }
  .msg { display: flex; flex-direction: column; margin: 1.6mm 0; max-width: 82%; break-inside: avoid; position: relative; }
  .msg.r { align-self: flex-end; margin-left: auto; align-items: flex-end; }
  .msg .name { font-family: 'Poppins', sans-serif; font-size: 7pt; color: #888; margin: 0 2mm .6mm; }
  .bubble { position: relative; border-radius: 3mm; padding: 2mm 3mm 2.8mm; background: #f1efe9; }
  .msg.r .bubble { background: #dcefd6; }
  .msg.l.p2 .bubble { background: #ece6f2; } .msg.l.p3 .bubble { background: #e8eef5; } .msg.l.p4 .bubble { background: #f5ece4; }
  .bubble .time { position: absolute; right: 2.2mm; bottom: .9mm; font-family: 'Poppins', sans-serif; font-size: 6pt; color: #999; }
  .txt { padding-right: 8mm; white-space: pre-wrap; word-wrap: break-word; }
  .media { position: relative; margin: -1mm -2mm 1.5mm; border-radius: 2.5mm; overflow: hidden; }
  .media img { display: block; width: 100%; max-height: 95mm; object-fit: cover; }
  .media.missing { height: 30mm; background: #e4e2dc; color: #999; display: flex; align-items: center; justify-content: center; font-size: 8pt; }
  .media .vid { position: absolute; left: 2mm; bottom: 1.5mm; font-family: 'Poppins', sans-serif; font-size: 6.5pt; color: #fff; background: rgba(0,0,0,.45); padding: .4mm 1.6mm; border-radius: 1mm; }
  .person { display: flex; gap: 4mm; margin-bottom: 7mm; break-inside: avoid; }
  .avatar { width: 20mm; height: 20mm; border-radius: 50%; background: #e4e2dc; color: #777; display: flex; align-items: center; justify-content: center; font-family: 'Poppins', sans-serif; font-size: 16pt; overflow: hidden; flex: none; }
  .avatar img { width: 100%; height: 100%; object-fit: cover; }
  .pbody { flex: 1; min-width: 0; } .pname { font-size: 13pt; font-weight: 600; margin-bottom: 1.5mm; }
  .cat { display: flex; justify-content: space-between; gap: 3mm; border-top: 1px solid #e3e1db; padding: 1.4mm 0; font-size: 9pt; }
  .cat b { font-family: 'Poppins', sans-serif; font-weight: 500; font-size: 8.5pt; } .cat span { color: #666; text-align: right; }
  .pmeta { font-family: 'Poppins', sans-serif; font-size: 7.5pt; color: #777; margin-top: 1.5mm; }
  .pnote { position: absolute; bottom: ${M}mm; left: 0; right: 0; text-align: center; font-family: 'Poppins', sans-serif; font-size: 6.5pt; color: #aaa; letter-spacing: .08em; text-transform: uppercase; }
  .stats { page-break-before: always; break-before: page; }
  .stats .grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6mm 3mm; margin-bottom: 8mm; text-align: center; }
  .stats .grid b { display: block; font-family: 'Poppins', sans-serif; font-weight: 500; font-size: 18pt; }
  .stats .grid span { font-family: 'Poppins', sans-serif; font-size: 7.5pt; color: #777; text-transform: uppercase; letter-spacing: .06em; }
  .stats .row { display: flex; justify-content: space-between; border-top: 1px solid #e3e1db; padding: 2.5mm 0; font-size: 9.5pt; } .stats .emo { font-size: 13pt; }
  .back { page-break-before: always; break-before: page; background: ${esc(color)}; color: #fff; display: flex; align-items: flex-end; justify-content: center; font-family: 'Poppins', sans-serif; font-weight: 300; font-size: 7.5pt; letter-spacing: .1em; text-transform: uppercase; }
  `;
  const body = `<section class="cover">${portadaFoto ? `<div class="photo" style="background-image:url('${portadaFoto}')"></div>` : ''}
    <h1>${esc(man.titulo)}</h1><div class="sub">${esc(man.subtitulo || '')}</div></section>
  <section class="blank"></section>
  ${man.dedicatoria ? `<section class="dedication">${esc(man.dedicatoria)}</section>` : ''}
  ${personajesHTML}${indice}${capsHTML}${statsHTML}
  <section class="back">chatsalsa.com</section>`;
  return { css, body, html: `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${esc(man.titulo)}</title><style>${css}</style></head><body>${body}</body></html>` };
}
