// "La Porra del Grupo": preguntas del juego y respuestas de la Ronda 1 a partir de
// las estadísticas que ya calcula Analisis_top (window.lastAnalysisTopData). Solo castellano.

export const PREGUNTAS_RONDA_1 = [
  { id: 1, texto: '¿Quién escribe más mensajes?' },
  { id: 2, texto: '¿Quién vive en otro huso horario y escribe de madrugada?' },
  { id: 3, texto: '¿Quién da los buenos días antes que nadie?' },
  { id: 4, texto: '¿Quién te deja en visto medio día?' },
  { id: 5, texto: '¿Quién contesta antes de que acabes de escribir?' },
  { id: 6, texto: '¿Quién manda tochos que ni el Quijote?' },
  { id: 7, texto: '¿Quién manda 7 mensajes seguidos sin que nadie conteste?' },
  { id: 8, texto: '¿Quién dice más veces "yo"?' },
  { id: 9, texto: '¿Quién habla más de los demás?' },
  { id: 10, texto: '¿Quién llena el chat de emojis?' },
];

// Temas del juego. Los dos están activos a la vez: el usuario elige. Ronda 1 es común.
export const TEMAS = {
  halloween: {
    id: 'halloween',
    emoji: '🎃',
    nombre: 'El Juego de Halloween',
    lema: 'Juegos para tu fiesta de Halloween',
    badge: 'Noche de Halloween',
    ocasion: 'la noche de Halloween',
    subtitulo: 'El juego de miedo de tu grupo de WhatsApp',
    ronda2: 'LA TENEBROSA',
    colores: ['#ff7a00', '#8A2BE2'],
    fuente: 'Creepster',
    fuenteUrl: 'https://fonts.googleapis.com/css2?family=Creepster&display=swap',
    imagenH: '/img/porra-halloween-h.jpg',
    imagenV: '/img/porra-halloween-v.jpg',
    preguntasRonda2: [
      { id: 11, texto: '¿Quién moriría el primero en una película de terror?' },
      { id: 12, texto: '¿Quién es el fantasma del grupo: aparece, asusta y desaparece?' },
      { id: 13, texto: '¿Quién tiene más secretos enterrados en el chat?' },
      { id: 14, texto: '¿Quién da más miedo cuando se enfada?' },
      { id: 15, texto: '¿Quién sobreviviría a un apocalipsis zombi solo con labia?' },
      { id: 16, texto: '¿Quién es el vampiro emocional: todo gira en torno a sus dramas?' },
      { id: 17, texto: '¿Quién resucita conversaciones muertas a las 3 de la mañana?' },
      { id: 18, texto: '¿Quién lanza las indirectas más maléficas?' },
      { id: 19, texto: '¿Quién es la bruja o el brujo: lo sabe todo antes que nadie?' },
      { id: 20, texto: '¿Quién sería el villano de la película?' },
    ],
  },
  navidad: {
    id: 'navidad',
    emoji: '🎄',
    nombre: 'El Juego de Navidad',
    lema: 'El juego para la cena de Navidad',
    badge: 'Cena de Navidad',
    ocasion: 'la cena de Navidad',
    subtitulo: 'El juego de mesa de tu grupo de WhatsApp',
    ronda2: 'LA FAMILIAR',
    colores: ['#c62828', '#2e7d32'],
    fuente: 'Mountains of Christmas',
    fuenteUrl: 'https://fonts.googleapis.com/css2?family=Mountains+of+Christmas:wght@700&display=swap',
    imagenH: '/img/porra-navidad-h.jpg',
    imagenV: '/img/porra-navidad-v.jpg',
    preguntasRonda2: [
      { id: 11, texto: '¿Quién sería el cuñao oficial de la cena?' },
      { id: 12, texto: '¿Quién lo organiza todo y luego se queja?' },
      { id: 13, texto: '¿Quién dice "voy" y luego no viene?' },
      { id: 14, texto: '¿Quién es el abuelo o la abuela del grupo: tiene consejo para todo?' },
      { id: 15, texto: '¿Quién es el niño pequeño: se enfada y se le pasa en dos mensajes?' },
      { id: 16, texto: '¿Quién saca el tema que nadie quiere sacar en la cena?' },
      { id: 17, texto: '¿Quién es el más dramático?' },
      { id: 18, texto: '¿Quién pregunta lo que ya se dijo tres mensajes arriba?' },
      { id: 19, texto: '¿Quién acabaría cantando villancicos el primero?' },
      { id: 20, texto: '¿Quién es el alma del grupo?' },
    ],
  },
};

export const temaValido = (tema) => (TEMAS[tema] ? tema : 'navidad');
export const preguntasRonda2 = (tema) => TEMAS[temaValido(tema)].preguntasRonda2;
/** Tema que se preselecciona: Halloween hasta el 2 de noviembre, después Navidad. */
export const temaSugerido = (fecha = new Date()) => {
  const m = fecha.getMonth() + 1; const d = fecha.getDate();
  return (m === 10 || (m === 11 && d <= 2)) ? 'halloween' : 'navidad';
};

const SIN_DATOS = new Set(['', '--', 'Sin datos']);
const numero = (n) => new Intl.NumberFormat('es-ES').format(Math.round(n || 0));
const minutos = (seg) => {
  const m = Math.round((seg || 0) / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return h >= 24 ? `${Math.round(h / 24)} días` : `${h} h`;
};

const nombreValido = (cat) => (cat && cat.nombre && !SIN_DATOS.has(cat.nombre) ? cat.nombre : null);

const quienEscribeMas = (datos) => {
  const entradas = Object.entries(datos?.mensajes_por_usuario || {});
  if (!entradas.length) return null;
  const [nombre, mensajes] = entradas.reduce((a, b) => (b[1] > a[1] ? b : a));
  return { nombre, mensajes };
};

// Cada entrada: categoría de Analisis_top y frase de vacile con el dato real.
const RONDA_1 = {
  1: (d) => {
    const top = quienEscribeMas(d);
    return top && { nombre: top.nombre, dato: `${numero(top.mensajes)} mensajes. El grupo es su podcast.` };
  },
  2: (d) => {
    const c = d?.categorias?.vampiro; const n = nombreValido(c);
    return n && { nombre: n, dato: `${numero(c.mensajes_noche)} mensajes de madrugada. ¿Duerme alguna vez?` };
  },
  3: (d) => {
    const c = d?.categorias?.cafeconleche; const n = nombreValido(c);
    return n && { nombre: n, dato: `Primer mensaje a las ${c.hora_formateada || '??:??'} de media. Madruga hasta en el chat.` };
  },
  4: (d) => {
    const c = d?.categorias?.dejaenvisto; const n = nombreValido(c);
    return n && { nombre: n, dato: `Tarda ${minutos(c.tiempo_respuesta_promedio)} en contestar. Y luego "ay, no lo vi".` };
  },
  5: (d) => {
    const c = d?.categorias?.pistolero; const n = nombreValido(c);
    return n && { nombre: n, dato: `Responde en ${minutos(c.tiempo_respuesta_promedio)}. ¿Trabaja o vive en WhatsApp?` };
  },
  6: (d) => {
    const c = d?.categorias?.rollero; const n = nombreValido(c);
    return n && { nombre: n, dato: `${numero(c.palabras_por_mensaje)} palabras por mensaje. Dale un libro y que lo firme.` };
  },
  7: (d) => {
    const c = d?.categorias?.bombardero; const n = nombreValido(c);
    return n && { nombre: n, dato: `Récord: ${numero(c.max_mensajes_seguidos)} mensajes seguidos sin respuesta. Monólogo con notificaciones.` };
  },
  8: (d) => {
    const c = d?.categorias?.narcicista; const n = nombreValido(c);
    return n && { nombre: n, dato: `${numero(c.menciones_yo)} veces "yo". Su biografía va por capítulos.` };
  },
  9: (d) => {
    const c = d?.categorias?.chismoso; const n = nombreValido(c);
    return n && { nombre: n, dato: `${numero(c.menciones_otros)} menciones a otros. Radio Patio en directo.` };
  },
  10: (d) => {
    const c = d?.categorias?.happyflower; const n = nombreValido(c);
    return n && { nombre: n, dato: `${numero(c.emojis_totales)} emojis. Escribe en jeroglífico moderno.` };
  },
};

/** Respuestas de la Ronda 1: [{ id, pregunta, nombre, dato }]. Sin datos → nombre '—'. */
export const respuestasRonda1 = (datos) =>
  PREGUNTAS_RONDA_1.map(({ id, texto }) => {
    const r = RONDA_1[id](datos) || null;
    return { id, pregunta: texto, nombre: r ? r.nombre : '—', dato: r ? r.dato : 'Sin datos suficientes en este chat.' };
  });

/** Respuestas de la Ronda 2 que devuelve la IA, con los nombres reales ya restaurados.
 *  Si no hay IA (usuario que no comparte el chat), devuelve las preguntas sin respuesta. */
export const respuestasRonda2 = (respuestasIA, tema = 'navidad') =>
  preguntasRonda2(tema).map(({ id, texto }) => {
    const r = (respuestasIA || []).find((x) => x.id === id);
    return {
      id,
      pregunta: texto,
      nombre: r?.nombre || '—',
      dato: r ? [r.frase, r.cita ? `«${r.cita}»` : ''].filter(Boolean).join(' ') : 'Sin análisis de IA en este chat.',
    };
  });

export const CLAVE_NOMBRE_ARCHIVO = 'whatsapp_analyzer_chat_file_name';

/** Nombre del grupo a partir del nombre del zip/txt exportado por WhatsApp
 *  ("WhatsApp Chat - Los de siempre.zip", "Chat de WhatsApp con Familia.txt"...). Sin pista → 'Mi grupo'. */
export const nombreGrupoDesdeArchivo = (...nombres) => {
  const PREFIJOS = /^(whatsapp chat (with|-) |chat de whatsapp con |chat de whatsapp - |conversa do whatsapp com |discussion whatsapp avec |whatsapp-chat mit |chat whatsapp con )/i;
  for (const n of nombres) {
    if (!n || typeof n !== 'string') continue;
    let g = n.split('/').pop().replace(/\.(zip|txt)$/i, '').replace(/\s*\(\d+\)$/, '').trim();
    if (!PREFIJOS.test(g)) continue; // "_chat", "archivo.zip"... no dicen el nombre
    g = g.replace(PREFIJOS, '').trim();
    if (g) return g.slice(0, 40);
  }
  return 'Mi grupo';
};
