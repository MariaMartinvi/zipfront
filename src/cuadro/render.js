// HTML del cuadro regalo con las frases míticas de un chat. La misma plantilla sirve para la vista previa
// (iframe) y para el PDF (generador del libro). Todo se mide en «rem» y 1rem = 1 % del ancho de la página:
// así el cuadro es idéntico en pantalla, en A4 y en A3 (los dos tienen la misma proporción).

import { ESTILOS, EMOJIS, esc, autorVisible } from './estilos';

export { autorVisible };
export const FORMATOS = { A4: { w: 210, h: 297 }, A3: { w: 297, h: 420 } }; // mm
export const MIN_FRASES = 1;
export const MAX_FRASES = 12;
const ALTO = 141.4; // alto de la página en rem (proporción A)

const fuente = (familias) => `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?${familias.map((f) => `family=${f}`).join('&')}&display=block" rel="stylesheet">`;

// Plantillas de lista del primer intento (27-11-2026): APARCADAS, no se enseñan. Los estilos que se ofrecen
// son los de estilos.js (Moderno, Tipográfico, Tierno).
// Cada una: fuentes, CSS y cuánto ocupa su letra (ancho medio de un carácter y hueco útil para las frases, en rem)
const APARCADAS = {
  amorosa: {
    nombre: 'Moderna amorosa',
    fuentes: ['Playfair+Display:ital,wght@0,400;0,600;1,400;1,600', 'Poppins:wght@300;400;500'],
    ancho: 0.47, hueco: [74, 96], separador: '♥',
    css: `
      .cuadro { background: radial-gradient(circle at 12% 8%, #ffd9dc 0, transparent 38%), radial-gradient(circle at 92% 96%, #ffe3d3 0, transparent 42%), #fdf3ef; color: #4a2330; }
      .marco { padding: 11rem 13rem 9rem; }
      .sobre { font: 400 1.9rem 'Poppins', sans-serif; letter-spacing: .55em; text-transform: uppercase; color: #c9808c; }
      h1 { font: italic 600 8.4rem/1 'Playfair Display', serif; color: #b3364f; margin: 1.6rem 0 0; }
      header::after { content: '♥'; display: block; color: #e7a3ac; font-size: 2.6rem; margin-top: 3rem; }
      .txt { font-family: 'Playfair Display', ${EMOJIS}, serif; }
      .f.impar .txt { font-style: italic; color: #b3364f; }
      .aut { font: 400 calc(var(--f) * .4rem) 'Poppins', sans-serif; letter-spacing: .3em; text-transform: uppercase; color: #c9808c; }
      .sep { color: #f0bfc5; font-size: calc(var(--f) * .4rem); }
      footer { font: 300 1.7rem 'Poppins', sans-serif; letter-spacing: .45em; text-transform: uppercase; color: #c9808c; }`,
  },
  clasica: {
    nombre: 'Clásica',
    fuentes: ['Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500'],
    ancho: 0.43, hueco: [70, 92], separador: '❦',
    css: `
      .cuadro { background: #f6f0e1; color: #2d2a26; }
      .cuadro::before { content: ''; position: absolute; inset: 5rem; border: .35rem solid #2d2a26; }
      .cuadro::after { content: ''; position: absolute; inset: 6.4rem; border: .12rem solid #2d2a26; }
      .marco { padding: 14rem 15rem 12rem; }
      .sobre { font: 500 2.1rem 'Cormorant Garamond', serif; letter-spacing: .5em; text-transform: uppercase; }
      h1 { font: 500 7.6rem/1.05 'Cormorant Garamond', serif; letter-spacing: .06em; text-transform: uppercase; margin: 1.8rem 0 0; }
      header::after { content: ''; display: block; width: 16rem; border-top: .15rem solid #2d2a26; margin: 3.2rem auto 0; }
      .txt { font-family: 'Cormorant Garamond', ${EMOJIS}, serif; font-weight: 500; }
      .aut { font: italic 400 calc(var(--f) * .46rem) 'Cormorant Garamond', serif; color: #7a6f5c; }
      .sep { color: #a8997d; font-size: calc(var(--f) * .45rem); }
      footer { font: 500 2rem 'Cormorant Garamond', serif; letter-spacing: .45em; text-transform: uppercase; }`,
  },
  minimal: {
    nombre: 'Minimalista',
    fuentes: ['Poppins:wght@200;300;400;600'],
    ancho: 0.53, hueco: [66, 100], separador: '',
    css: `
      .cuadro { background: #fff; color: #111; }
      .marco { padding: 12rem 12rem 9rem; text-align: left; }
      .sobre { font: 400 1.7rem 'Poppins', sans-serif; letter-spacing: .5em; text-transform: uppercase; color: #888; }
      h1 { font: 600 6.4rem/1.05 'Poppins', sans-serif; letter-spacing: -.02em; margin: 1.6rem 0 0; }
      header::after { content: ''; display: block; width: 9rem; border-top: .5rem solid #111; margin-top: 3.4rem; }
      .frases { counter-reset: n; }
      .f { counter-increment: n; display: grid; grid-template-columns: 8rem 1fr; align-items: baseline; }
      .f::before { content: counter(n, decimal-leading-zero); font: 200 calc(var(--f) * .8rem) 'Poppins', sans-serif; color: #bbb; }
      .f > * { grid-column: 2; }
      .txt { font-family: 'Poppins', ${EMOJIS}, sans-serif; font-weight: 300; line-height: 1.3; }
      .aut { font: 400 calc(var(--f) * .36rem) 'Poppins', sans-serif; letter-spacing: .25em; text-transform: uppercase; color: #888; }
      footer { font: 400 1.6rem 'Poppins', sans-serif; letter-spacing: .45em; text-transform: uppercase; color: #888; text-align: left; }`,
  },
  divertida: {
    nombre: 'Divertida',
    fuentes: ['Baloo+2:wght@500;600;700;800'],
    ancho: 0.5, hueco: [62, 98], separador: '',
    css: `
      .cuadro { background: #fff6d6; color: #2b2540; }
      .marco { padding: 9rem 10rem 8rem; }
      .sobre { font: 600 2.2rem 'Baloo 2', sans-serif; letter-spacing: .3em; text-transform: uppercase; color: #7c4dff; }
      h1 { font: 800 8.6rem/1 'Baloo 2', sans-serif; color: #2b2540; margin: 1rem 0 0; }
      .frases { gap: calc(var(--f) * .5rem); }
      .f { max-width: 82%; padding: calc(var(--f) * .42rem) calc(var(--f) * .75rem); border-radius: calc(var(--f) * .9rem); color: #fff; text-align: left; position: relative; }
      .f.impar { align-self: flex-start; border-bottom-left-radius: .6rem; transform: rotate(-1.2deg); }
      .f.par { align-self: flex-end; border-bottom-right-radius: .6rem; transform: rotate(1.2deg); }
      .f.c0 { background: #25d366; } .f.c1 { background: #7c4dff; } .f.c2 { background: #ff6b6b; } .f.c3 { background: #1fa2ff; }
      .txt { font-family: 'Baloo 2', ${EMOJIS}, sans-serif; font-weight: 600; line-height: 1.15; }
      .aut { font: 600 calc(var(--f) * .42rem) 'Baloo 2', sans-serif; opacity: .85; }
      footer { font: 700 2rem 'Baloo 2', sans-serif; letter-spacing: .2em; text-transform: uppercase; color: #7c4dff; }`,
  },
};
export const PLANTILLAS = { ...ESTILOS, ...APARCADAS };
export const IDS_PLANTILLAS = Object.keys(ESTILOS); // las que se ofrecen

/**
 * Tamaño de letra de las frases (en rem) para que quepan todas: el mayor con el que la suma de sus alturas
 * (líneas estimadas + autor + separación) entra en el hueco de la plantilla. Entre 2 y 6,5.
 */
export function tamanoFrase(frases, plantilla = 'amorosa', conAutor = true) {
  const { ancho, hueco: [w, h] } = APARCADAS[plantilla] || APARCADAS.amorosa;
  const alto = (s) => frases.reduce((a, f) => {
    const lineas = Math.max(1, Math.ceil(([...String(f.texto || '')].length * ancho * s) / w));
    return a + lineas * 1.22 * s + (conAutor ? 0.6 * s : 0) + 0.75 * s;
  }, 0);
  let s = 6.5;
  while (s > 2 && alto(s) > h) s -= 0.1;
  return Math.max(2, Math.round(s * 10) / 10);
}

// Si con las fuentes reales aún no cabe (de alto, o una línea de ancho), se encoge un poco más; y avisa cuando
// ha terminado, para la captura y el PDF. El alto se mide sumando las frases (no con scrollHeight: con interlineado
// menor que 1 el trazo de la letra cuenta como desbordado y encogería sin fin). Se repite cuando terminan de
// cargar las fuentes, siempre partiendo del tamaño inicial (la fuente de reserva mide distinto). En Moderno la lista no crece
// (flex-grow 0) y lo que se mira es que el cuadro entero no se salga. La variable que encoge es --f (listas aparcadas) o --k (estilos).
const AJUSTE = `<script>(function(){function a(){var l=document.querySelector('.frases');if(l){var v='--'+(l.getAttribute('data-var')||'f');if(!l.hasAttribute('data-ini'))l.setAttribute('data-ini',l.style.getPropertyValue(v));var s=parseFloat(l.getAttribute('data-ini'));l.style.setProperty(v,s);var c=document.querySelector('.cuadro');var mal=function(){var h=0,n=l.children,g=parseFloat(getComputedStyle(l).rowGap)||0;for(var i=0;i<n.length;i++){h+=n[i].offsetHeight;}h+=g*Math.max(0,n.length-1);if(h>l.clientHeight+1&&getComputedStyle(l).flexGrow!=='0')return true;if(c.scrollHeight>c.clientHeight+2&&getComputedStyle(l).flexGrow==='0')return true;var t=l.querySelectorAll('.l');for(var j=0;j<t.length;j++){if(t[j].offsetWidth>l.clientWidth+1)return true;}return false;};for(var i=0;i<90&&mal();i++){s*=.97;l.style.setProperty(v,s);}}document.documentElement.setAttribute('data-listo','1');}void document.body.offsetHeight;(document.fonts&&document.fonts.ready?document.fonts.ready:Promise.resolve()).then(a);if(document.fonts&&document.fonts.addEventListener)document.fonts.addEventListener('loadingdone',a);window.addEventListener('load',a);})();</script>`;

/**
 * HTML completo del cuadro.
 * cuadro: { plantilla, titulo, sobretitulo, pie, frases: [{ texto, autor }], autores: 'nombre' | 'inicial' | 'ninguno' }
 * opts.formato: 'A4' | 'A3' para el PDF; sin formato es la vista previa (ocupa el ancho del iframe).
 */
export function htmlCuadro(cuadro, { formato } = {}) {
  const id = PLANTILLAS[cuadro.plantilla] ? cuadro.plantilla : 'moderno';
  const p = PLANTILLAS[id];
  const modo = cuadro.autores || 'nombre';
  const frases = (cuadro.frases || []).filter((f) => f && String(f.texto || '').trim()).slice(0, MAX_FRASES);
  const pagina = FORMATOS[formato];
  const base = `${pagina ? `@page { size: ${pagina.w}mm ${pagina.h}mm; margin: 0; } html { font-size: ${pagina.w / 100}mm; }` : 'html { font-size: 1vw; }'}
    * { box-sizing: border-box; } html, body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .cuadro { position: relative; width: 100rem; height: ${ALTO}rem; overflow: hidden; }
    .marco { position: relative; z-index: 1; height: 100%; display: flex; flex-direction: column; text-align: center; }
    header, footer { flex: none; } h1 { overflow-wrap: anywhere; }
    .frases { flex: 1; min-height: 0; overflow: hidden; list-style: none; margin: 4rem 0; padding: 0; display: flex; flex-direction: column; justify-content: space-evenly; }`;
  const pagina_html = (css, cuerpo) => `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${esc(cuadro.titulo || 'Cuadro')}</title>${fuente(p.fuentes)}<style>
    ${base}
    ${css}
  </style></head><body><div class="cuadro p-${id}"><div class="marco">${cuerpo}</div></div>${AJUSTE}</body></html>`;
  if (p.cuerpo) { // estilos nuevos: cada uno pinta su cuerpo
    const c = p.cuerpo(cuadro, frases, modo);
    return pagina_html(c.css, c.html);
  }
  const f0 = tamanoFrase(frases, id, modo !== 'ninguno');
  const items = frases.map((f, i) => {
    const autor = autorVisible(f.autor, modo);
    return `${i && p.separador ? `<li class="sep" aria-hidden="true">${p.separador}</li>` : ''}<li class="f ${i % 2 ? 'par' : 'impar'} c${i % 4}"><p class="txt">${esc(String(f.texto).trim())}</p>${autor ? `<span class="aut">${esc(autor)}</span>` : ''}</li>`;
  }).join('');
  return pagina_html(`
    .f { margin: 0; } .sep { line-height: 1; }
    .txt { margin: 0; font-size: calc(var(--f) * 1rem); line-height: 1.22; overflow-wrap: anywhere; }
    .aut { display: block; margin-top: calc(var(--f) * .18rem); }
    ${p.css}`, `
    <header>${cuadro.sobretitulo ? `<div class="sobre">${esc(cuadro.sobretitulo)}</div>` : ''}<h1>${esc(cuadro.titulo || '')}</h1></header>
    <ul class="frases" style="--f: ${f0}">${items}</ul>
    ${cuadro.pie ? `<footer>${esc(cuadro.pie)}</footer>` : ''}`);
}
