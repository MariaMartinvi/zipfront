// Libros de ejemplo de la landing: chats INVENTADOS pasados por la misma plantilla que el libro de verdad
// (renderHTML). Así se ve exactamente lo que sale impreso. Las fotos son de ejemplo, no de clientes.
import { parseChat } from './parser';
import { renderHTML, FONTS, PAGE } from './render';

const LIBROS = [
  {
    titulo: 'Familia Pérez', subtitulo: '2019 – 2026', color: '#5b3a4a', foto: '/libro/familia.jpg', derecha: 'Lucía',
    capitulos: [['La comida de Navidad', '2025-12-24'], ['Los 90 de la abuela', '2026-03-08']],
    chat: `24/12/25, 10:02 - Mamá: Recordad que hoy comemos a las 14:00 en casa de la abuela 🎄
24/12/25, 10:05 - Javi: Llevo yo el pan y los turrones
24/12/25, 10:06 - Lucía: Y yo el postre 🍰
24/12/25, 10:06 - Papá: Que nadie llegue tarde que os conozco
24/12/25, 10:20 - Abuela Carmen: Ya tengo el cordero en el horno ❤️
24/12/25, 10:21 - Lucía: Abuela eres la mejor
24/12/25, 13:58 - Javi: Estoy aparcando!!
24/12/25, 14:31 - Mamá: Javi el pan 😂😂
24/12/25, 14:31 - Javi: Se me ha olvidado en el coche jajaja
24/12/25, 22:10 - Abuela Carmen: Gracias por venir todos. No hay mejor regalo ❤️
24/12/25, 22:12 - Lucía: Te queremos abuela ❤️❤️
08/03/26, 11:00 - Mamá: ¡Felices 90, mamá! 🎂
08/03/26, 11:02 - Lucía: Felicidades abuela!!! 🎉🎉
08/03/26, 11:03 - Javi: 90 y más joven que todos nosotros
08/03/26, 11:15 - Abuela Carmen: Ay qué ilusión 🥰 ¿venís a merendar?
08/03/26, 11:16 - Papá: Allí estaremos
08/03/26, 19:40 - Lucía: IMG-20260308-WA0012.jpg (archivo adjunto)
08/03/26, 19:41 - Lucía: La foto de todos juntos 😍
08/03/26, 19:45 - Abuela Carmen: Esta la quiero enmarcada
08/03/26, 19:46 - Mamá: Hecho, mamá ❤️`,
  },
  {
    titulo: 'Te echaremos de menos', subtitulo: 'Para Carmen, después de 32 años', color: '#2b4a6f', foto: '/libro/companeras.jpg', derecha: 'Ana',
    capitulos: [['Los lunes con Carmen', '2025-10-06'], ['La despedida', '2026-06-26']],
    chat: `06/10/25, 08:01 - Carmen: Buenos días equipo ☕ ¿quién trae hoy los cruasanes?
06/10/25, 08:03 - Ana: Te toca a ti, que es lunes 😂
06/10/25, 08:03 - Luis: Las normas son las normas
06/10/25, 08:05 - Carmen: Vale vale, llevo 32 años trayéndolos los lunes
06/10/25, 08:06 - Marta: Y por eso te queremos ❤️
06/10/25, 12:30 - Luis: ¿Comemos en el de siempre?
06/10/25, 12:31 - Carmen: Mesa para cuatro, ya he llamado
06/10/25, 12:31 - Ana: Esta mujer está en todo
26/06/26, 09:00 - Ana: Hoy es el día... 🥲
26/06/26, 09:02 - Marta: No me lo puedo creer
26/06/26, 09:05 - Carmen: Ni yo. Gracias por estos años, de verdad ❤️
26/06/26, 09:06 - Luis: Gracias a ti. Esta oficina no va a ser lo mismo
26/06/26, 18:20 - Ana: IMG-20260626-WA0004.jpg (archivo adjunto)
26/06/26, 18:21 - Ana: Las tres de siempre 😍
26/06/26, 18:25 - Carmen: Voy a llorar otra vez
26/06/26, 18:26 - Marta: Los lunes te seguimos esperando con cruasanes ☕`,
  },
  {
    titulo: 'Eva & Marcos', subtitulo: '2024 – 2026', color: '#2f3e46', foto: '/libro/pareja.jpg', derecha: 'Marcos',
    capitulos: [['El día que salió bien', '2025-05-02'], ['Aquel verano en Roma', '2025-07-12']],
    chat: `02/05/25, 09:12 - Eva: Buenos días ☀️ has dormido algo?
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
12/07/25, 18:20 - Marcos: ¿Ya has aterrizado? ✈️
12/07/25, 18:24 - Eva: Sí!! Esto es precioso 😍
12/07/25, 18:24 - Eva: Te espero en la puerta B
12/07/25, 18:25 - Marcos: Corro
12/07/25, 20:41 - Marcos: IMG-20250712-WA0007.jpg (archivo adjunto)
12/07/25, 20:43 - Eva: Mírate qué guapo con la Fontana detrás
12/07/25, 20:44 - Marcos: Hemos tirado la moneda, eh. Toca volver
12/07/25, 20:44 - Eva: Volveremos 🤞
12/07/25, 23:15 - Eva: Ha sido el mejor día del año
12/07/25, 23:16 - Marcos: Del año no. De muchos años ❤️`,
  },
];

// HTML de una sola página del libro (la sección que cumple `sel`), para pintarla en su propio iframe.
function pagina(css, body, sel) {
  const W = (PAGE.w + 2 * PAGE.bleed) * 96 / 25.4;
  const H = PAGE.h + 2 * PAGE.bleed;
  return `<!doctype html><html lang="es"><head><meta charset="utf-8">${FONTS}<style>${css}
      html,body{background:#fff;overflow:hidden} section{height:${H}mm;min-height:${H}mm;overflow:hidden} section:not(${sel}){display:none !important}</style></head>
      <body>${body}<script>(()=>{const z=()=>{document.documentElement.style.zoom=innerWidth/${W.toFixed(1)}};z();addEventListener('resize',z)})()</script></body></html>`;
}

function renderLibro({ titulo, subtitulo, color, foto, derecha, capitulos, chat }) {
  const mensajes = parseChat(chat);
  const archivo = mensajes.find((m) => m.archivo)?.archivo || 'portada';
  const man = {
    titulo, subtitulo, portada: { color, foto: archivo },
    capitulos: capitulos.map(([t, dia]) => ({ titulo: t, desde: dia, hasta: dia, on: true, mensajes: mensajes.filter((m) => m.dia === dia).map((m) => m.id) })),
  };
  return renderHTML(mensajes, man, { media: { [archivo]: { uri: foto } }, derecha, conIndice: false, conPersonajes: false, conStats: false });
}

/**
 * Portada y dobles páginas (apertura + conversación) de los capítulos `ks` de un libro ya pintado con renderHTML.
 * Lo usan los ejemplos de la landing y la entrada del libro de cada uno.
 */
export function paginasLibro(css, body, ks) {
  const p = (sel) => pagina(css, body, sel);
  return {
    portada: p('section.cover'),
    dobles: ks.map((k) => ({ izq: p(`section.chapter-open[data-cap='${k}']`), dcha: p(`section.chapter-body[data-cap='${k}']`) })),
  };
}

/**
 * Los libros de ejemplo: { titulo, portada, dobles: [{ izq, dcha }] }. Cada doble página es un capítulo:
 * a la izquierda su apertura y a la derecha su conversación (el segundo, con la foto). Solo chat.
 */
export function librosEjemplo() {
  return LIBROS.map((libro) => {
    const { css, body } = renderLibro(libro);
    return { titulo: libro.titulo, ...paginasLibro(css, body, libro.capitulos.map((_, k) => k)) };
  });
}
