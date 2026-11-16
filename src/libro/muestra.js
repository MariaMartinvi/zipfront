// Páginas de muestra para la landing: un chat INVENTADO (Eva y Marcos) pasado por la misma plantilla que el
// libro de verdad (renderHTML). Así la muestra enseña exactamente lo que sale impreso.
import { parseChat } from './parser';
import { renderHTML, FONTS, PAGE } from './render';

const FOTO = 'IMG-20250712-WA0007.jpg';

const CHAT = `02/05/25, 09:12 - Eva: Buenos días ☀️ has dormido algo?
02/05/25, 09:14 - Marcos: Poco jajaja estaba nervioso por lo de hoy
02/05/25, 09:15 - Eva: Te va a ir genial, ya verás 💪
02/05/25, 09:15 - Eva: Avísame cuando salgas
02/05/25, 13:40 - Marcos: SALIÓ BIEN!!! 🎉🎉
02/05/25, 13:41 - Eva: Lo sabía!!! ❤️❤️
02/05/25, 13:41 - Eva: Esto hay que celebrarlo
02/05/25, 13:42 - Marcos: Cena esta noche? Yo invito
02/05/25, 13:42 - Eva: Hecho 😍
02/05/25, 23:58 - Marcos: Gracias por estar siempre
02/05/25, 23:59 - Eva: Siempre ❤️
20/06/25, 22:10 - Eva: Oye
20/06/25, 22:10 - Eva: Y si nos vamos a Roma en julio?
20/06/25, 22:11 - Eva: Lo digo en serio
20/06/25, 22:11 - Eva: He visto vuelos baratísimos
20/06/25, 22:30 - Marcos: Jajaja vale
20/06/25, 22:30 - Marcos: Pero yo elijo dónde comemos 🍝
20/06/25, 22:31 - Eva: Trato 😂
11/07/25, 07:02 - Marcos: ¿Lo llevas todo? Pasaporte, cargador, gafas de sol…
11/07/25, 07:05 - Eva: Que sí pesado jajaja
11/07/25, 07:05 - Eva: Estoy en el taxi
12/07/25, 18:20 - Marcos: ¿Ya has aterrizado? ✈️
12/07/25, 18:24 - Eva: Sí!! Esto es precioso 😍
12/07/25, 18:24 - Eva: Te espero en la puerta B
12/07/25, 18:25 - Marcos: Corro
12/07/25, 20:41 - Marcos: ${FOTO} (archivo adjunto)
12/07/25, 20:43 - Eva: Mírate qué guapo con la Fontana detrás
12/07/25, 20:44 - Marcos: Hemos tirado la moneda, eh. Toca volver
12/07/25, 20:44 - Eva: Volveremos 🤞
12/07/25, 23:15 - Eva: Ha sido el mejor día del año
12/07/25, 23:16 - Marcos: Del año no. De muchos años ❤️`;

const TITULOS = ['Portada', 'Capítulo', 'La conversación', 'Con vuestras fotos'];

// HTML de una sola página del libro de ejemplo (la sección que cumple `sel`), para pintarla en su propio iframe.
function pagina(css, body, sel) {
  const W = (PAGE.w + 2 * PAGE.bleed) * 96 / 25.4;
  const H = PAGE.h + 2 * PAGE.bleed;
  return `<!doctype html><html lang="es"><head><meta charset="utf-8">${FONTS}<style>${css}
      html,body{background:#fff;overflow:hidden} section{height:${H}mm;min-height:${H}mm;overflow:hidden} section:not(${sel}){display:none !important}</style></head>
      <body>${body}<script>(()=>{const z=()=>{document.documentElement.style.zoom=innerWidth/${W.toFixed(1)}};z();addEventListener('resize',z)})()</script></body></html>`;
}

function libroEjemplo(foto) {
  const mensajes = parseChat(CHAT);
  const del = (dia) => mensajes.filter((m) => m.dia === dia).map((m) => m.id);
  const man = {
    titulo: 'Eva & Marcos', subtitulo: '2025', portada: { color: '#2f3e46', foto: FOTO },
    capitulos: [
      { titulo: 'El día que salió bien', desde: '2025-05-02', hasta: '2025-05-02', on: true, mensajes: del('2025-05-02') },
      { titulo: 'Aquel verano en Roma', desde: '2025-07-12', hasta: '2025-07-12', on: true, mensajes: del('2025-07-12') },
    ],
  };
  return renderHTML(mensajes, man, { media: { [FOTO]: { uri: foto } }, derecha: 'Marcos', conIndice: false, conPersonajes: false });
}

/** Las 4 páginas de muestra como documentos HTML independientes (uno por iframe). */
export function paginasMuestra(foto = '/libro/pareja.jpg') {
  const { css, body } = libroEjemplo(foto);
  // body: portada, blanca, capítulo 1 (apertura y conversación), capítulo 2 (apertura y conversación con foto)…
  const elegir = ['section.cover', "section.chapter-open[data-cap='1']", "section.chapter-body[data-cap='0']", "section.chapter-body[data-cap='1']"];
  return elegir.map((sel, i) => ({ titulo: TITULOS[i], html: pagina(css, body, sel) }));
}

// Portadas de los libros de ejemplo de la landing (fotos de ejemplo, no de clientes).
const PORTADAS = [
  { titulo: 'Familia Pérez', subtitulo: '2019 – 2026', color: '#5b3a4a', foto: '/libro/familia.jpg' },
  { titulo: 'Te echaremos de menos', subtitulo: 'Para Carmen, después de 32 años', color: '#2b4a6f', foto: '/libro/companeras.jpg' },
  { titulo: 'Eva & Marcos', subtitulo: '2024 – 2026', color: '#2f3e46', foto: '/libro/pareja.jpg' },
];

/** Portadas de los libros de ejemplo, cada una como documento HTML para su iframe. */
export function portadasEjemplo() {
  const mensajes = parseChat(CHAT);
  return PORTADAS.map(({ titulo, subtitulo, color, foto }) => {
    const { css, body } = renderHTML(mensajes, { titulo, subtitulo, portada: { color, foto: 'portada' }, capitulos: [] },
      { media: { portada: { uri: foto } }, conIndice: false, conPersonajes: false, conStats: false });
    return { titulo, html: pagina(css, body, 'section.cover') };
  });
}
