// Genera los dos PDFs de "La Porra del Grupo" en el navegador (A4): hoja de jugador y
// acta del moderador con las respuestas. Nada pasa por el servidor.
import { PREGUNTAS_RONDA_1, TEMAS, temaValido } from './porra';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const PALETA = {
  halloween: { titulo: '#ffb347', sombra: '#5a1d8a', acento: '#ff7a00', acento2: '#8A2BE2', r1bg: '#fff1e6', r1: '#c2410c',
    r2bg: 'linear-gradient(135deg, #1a0b2e, #5a1d8a)', num: '#ff7a00', resp: '#5a1d8a', velo: 'rgba(11,11,20,0.55)' },
  navidad: { titulo: '#ffd36b', sombra: '#8b1a1a', acento: '#c62828', acento2: '#2e7d32', r1bg: '#e9f5ea', r1: '#1b5e20',
    r2bg: 'linear-gradient(135deg, #0f3d2e, #082419)', num: '#c62828', resp: '#0f3d2e', velo: 'rgba(5,30,20,0.55)' },
};

const ESTILOS = (t) => {
  const c = PALETA[t.id] || PALETA.navidad;
  return `
  .hoja { width: 794px; min-height: 1123px; box-sizing: border-box; padding: 0 0 40px; background: #fff;
          font-family: 'Inter', -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2d3748; font-size: 13px; }
  .cab { position: relative; height: 230px; background-size: cover; background-position: center 30%; color: #fff; overflow: hidden; }
  .cab .velo { position: absolute; inset: 0; background: linear-gradient(180deg, ${c.velo} 0%, rgba(0,0,0,0.15) 55%, rgba(0,0,0,0.6) 100%); }
  .cab .contenido { position: relative; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 0 40px; }
  .cab h1 { margin: 0; font-family: '${t.fuente}', cursive; font-weight: 700; font-size: 58px; line-height: 1; color: ${c.titulo};
            text-shadow: 0 3px 0 ${c.sombra}, 0 6px 18px rgba(0,0,0,0.7); }
  .cab .sub { margin: 10px 0 0; font-size: 15px; font-weight: 600; text-shadow: 0 1px 8px rgba(0,0,0,0.8); }
  .cab .marca { position: absolute; top: 14px; right: 20px; font-weight: bold; font-size: 14px; text-align: right; text-shadow: 0 1px 6px rgba(0,0,0,0.8); }
  .cab .marca small { display: block; font-weight: normal; font-size: 11px; }
  .cuerpo { padding: 22px 48px 0; }
  .campos { display: flex; gap: 32px; margin-bottom: 14px; font-weight: bold; }
  .campos span { flex: 1; border-bottom: 1px solid #888; padding-bottom: 4px; }
  .reglas { margin: 0 0 16px; padding: 0; list-style: none; font-size: 12px; line-height: 1.6; }
  .ronda { display: flex; justify-content: space-between; align-items: center; padding: 8px 14px; border-radius: 6px;
           font-weight: bold; margin: 14px 0 6px; }
  .ronda small { font-weight: normal; font-size: 11px; }
  .r1 { background: ${c.r1bg}; color: ${c.r1}; }
  .r2 { background: ${c.r2bg}; color: #fff; }
  .fila { display: flex; align-items: center; gap: 10px; padding: 7px 14px; border-bottom: 1px solid #edf2f7; }
  .num { width: 22px; color: ${c.num}; font-weight: bold; text-align: right; }
  .preg { flex: 1; }
  .linea { width: 200px; border-bottom: 1px solid #999; height: 14px; }
  .caja { width: 14px; height: 14px; border: 1px solid #999; border-radius: 2px; }
  .resp { width: 150px; font-weight: bold; color: ${c.resp}; }
  .dato { width: 250px; font-size: 11px; color: #444; line-height: 1.35; }
  .pie { text-align: center; color: #888; font-size: 11px; margin-top: 26px; }
  .marcador { margin: 18px 0 0; }
  .marcador h3 { color: ${c.acento}; margin: 0 0 8px; font-family: '${t.fuente}', cursive; font-size: 26px; }
  .marcador .fila { border: 0; padding: 4px 14px; }
  .nota { font-size: 11px; color: #888; }
`;
};

const cabecera = (t, detalle) => `
  <div class="cab" style="background-image:url('${t.imagenH}')">
    <div class="velo"></div>
    <div class="marca">ChatSalsa<small>chatsalsa.com</small></div>
    <div class="contenido"><h1>${esc(t.nombre)}</h1><p class="sub">${esc(t.subtitulo)} · ${esc(detalle)}</p></div>
  </div>`;

const filasPreguntas = (preguntas) => preguntas.map((p) => `
  <div class="fila"><span class="num">${p.id}</span><span class="preg">${esc(p.texto)}</span><span class="linea"></span><span class="caja"></span></div>`).join('');

/** Hoja de jugador: preguntas con hueco para apostar. */
export const htmlPreguntas = (grupo, tema = 'navidad') => {
  const t = TEMAS[temaValido(tema)];
  return `
  <style>${ESTILOS(t)}</style>
  <div class="hoja">
    ${cabecera(t, 'Hoja de jugador')}
    <div class="cuerpo">
      <div class="campos"><span>Jugador/a:</span><span>Grupo: ${esc(grupo)}</span></div>
      <ul class="reglas">
        <li>1. Cada uno escribe en su hoja el nombre de quien cree que es la respuesta. Sin mirar el chat.</li>
        <li>2. Al acabar, el moderador lee las respuestas del acta una a una, con su dato.</li>
        <li>3. Un punto por acierto. Quien más acierte se lleva el bote (${t.id === 'halloween' ? 'chuches, cañas' : 'turrón, cañas'} o gloria eterna).</li>
      </ul>
      <div class="ronda r1"><span>RONDA 1 · LOS DATOS</span><small>Lo que dicen los números del chat</small></div>
      ${filasPreguntas(PREGUNTAS_RONDA_1)}
      <div class="ronda r2"><span>RONDA 2 · ${t.ronda2}</span><small>Lo que ha visto la IA de ChatSalsa</small></div>
      ${filasPreguntas(t.preguntasRonda2)}
      <div class="fila" style="border:0;margin-top:10px"><strong>Mis aciertos: ____ / 20</strong><span class="nota" style="margin-left:auto">Marca la casilla de cada pregunta que aciertes.</span></div>
      <p class="pie">Imprime una hoja por jugador · ${esc(t.nombre)} · un juego de ChatSalsa · chatsalsa.com</p>
    </div>
  </div>`;
};

const filasRespuestas = (respuestas) => respuestas.map((r) => `
  <div class="fila"><span class="num">${r.id}</span><span class="preg">${esc(r.pregunta)}</span><span class="resp">${esc(r.nombre)}</span><span class="dato">${esc(r.dato)}</span></div>`).join('');

/** Acta del moderador con las respuestas reales. `ronda2` puede ir sin IA (nombres '—'). */
export const htmlRespuestas = (grupo, ronda1, ronda2, conIA = true, tema = 'navidad') => {
  const t = TEMAS[temaValido(tema)];
  return `
  <style>${ESTILOS(t)}</style>
  <div class="hoja">
    ${cabecera(t, 'Acta del moderador · No la enseñes hasta el final')}
    <div class="cuerpo">
      <div class="campos"><span>Grupo: ${esc(grupo)}</span></div>
      <p class="nota">Lee cada respuesta en voz alta, con su dato. En caso de empate gana quien más acertó en la Ronda 2.</p>
      <div class="ronda r1"><span>RONDA 1 · LOS DATOS</span><small>Respuesta real · El dato</small></div>
      ${filasRespuestas(ronda1)}
      <div class="ronda r2"><span>RONDA 2 · ${t.ronda2}</span><small>${conIA ? 'Respuesta real · La prueba' : 'Sin análisis de IA en este chat: decidid vosotros'}</small></div>
      ${filasRespuestas(ronda2)}
      <div class="marcador">
        <h3>MARCADOR FINAL</h3>
        ${[1, 2, 3, 4, 5, 6].map(() => '<div class="fila"><span class="linea" style="width:300px"></span><span class="caja" style="width:40px"></span><span class="linea" style="width:300px"></span><span class="caja" style="width:40px"></span></div>').join('')}
      </div>
      <p class="pie">${esc(t.nombre)} · un juego de ChatSalsa · chatsalsa.com</p>
    </div>
  </div>`;
};

/** Pinta un HTML fuera de pantalla y lo guarda como PDF A4 (una o varias páginas). */
const cargarFuente = async (t) => {
  if (!t?.fuenteUrl || typeof document === 'undefined') return;
  if (!document.querySelector(`link[href="${t.fuenteUrl}"]`)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = t.fuenteUrl;
    document.head.appendChild(link);
  }
  try {
    await document.fonts.load(`700 40px '${t.fuente}'`);
    await document.fonts.ready;
  } catch (e) { /* sin la fuente se usa la de reserva */ }
};

export const descargarPdf = async (html, nombreFichero, tema = 'navidad') => {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')]);
  await cargarFuente(TEMAS[temaValido(tema)]);
  const cont = document.createElement('div');
  cont.style.cssText = 'position:fixed;left:-10000px;top:0;width:794px;background:#fff';
  cont.innerHTML = html;
  document.body.appendChild(cont);
  try {
    const canvas = await html2canvas(cont, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    const anchoMm = 210;
    const altoPaginaMm = 297;
    const altoMm = (canvas.height * anchoMm) / canvas.width;
    const img = canvas.toDataURL('image/jpeg', 0.92);
    let restante = altoMm;
    let offset = 0;
    while (restante > 0) {
      if (offset > 0) pdf.addPage();
      pdf.addImage(img, 'JPEG', 0, -offset, anchoMm, altoMm);
      offset += altoPaginaMm;
      restante -= altoPaginaMm;
    }
    pdf.save(nombreFichero);
  } finally {
    document.body.removeChild(cont);
  }
};
