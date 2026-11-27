// Cuadros de ejemplo para la landing. Las frases son INVENTADAS (Maria, 27-11-2026): nunca de chats de usuarios.
const PAREJA = [
  { texto: 'Hoy es mañana', autor: 'Marc' },
  { texto: 'Contigo hasta los lunes molan', autor: 'Lucía' },
  { texto: 'Te guardo el lado bueno del sofá', autor: 'Marc' },
  { texto: 'Si te pierdes, quédate quieta, que voy yo', autor: 'Lucía' },
];
const GRUPO = [
  { texto: 'Llego en cinco minutos (aún no he salido)', autor: 'Noe' },
  { texto: 'No estoy discutiendo, estoy explicando por qué tengo razón', autor: 'Irene' },
  { texto: 'Las malas decisiones se celebran con cava', autor: 'Sara' },
  { texto: 'Una y nos vamos', autor: 'Noe' },
  { texto: 'Yo no cotilleo, me informo', autor: 'Paula' },
  { texto: 'Si no hay foto, no ha pasado', autor: 'Irene' },
  { texto: 'El lunes empiezo. No digo qué lunes.', autor: 'Sara' },
  { texto: 'Os odio lo justo para quereros siempre', autor: 'Paula' },
  { texto: 'Soñar es gratis y dormir también', autor: 'Marta' },
];

// Uno por estilo (pocas frases: manda el dibujo o la letra)
export const EJEMPLOS = {
  moderno: { plantilla: 'moderno', titulo: 'Lucía y Marc', pie: '14 feb 2026', sobretitulo: 'N.º 001', autores: 'nombre', semilla: 'lucia-marc', frases: PAREJA.slice(0, 1) },
  tipografico: { plantilla: 'tipografico', titulo: 'Lucía y Marc', pie: '14 feb 2026', sobretitulo: 'N.º 003', autores: 'nombre', frases: [{ texto: '¿Mañana?', autor: 'Lucía' }, { texto: 'Hoy es mañana.', autor: 'Marc' }] },
  tierno: { plantilla: 'tierno', titulo: 'Lucía & Marc', pie: 'Desde 2019', autores: 'nombre', semilla: 'tierno-1', frases: PAREJA.slice(1, 3) },
};

// Los mismos estilos con muchas frases (chat de grupo): pasan a lista y el texto gana protagonismo
export const EJEMPLOS_LISTA = {
  moderno: { plantilla: 'moderno', titulo: 'Las de siempre', pie: '31 dic 2025', sobretitulo: 'N.º 002', autores: 'nombre', oscuro: true, semilla: 'las-de-siempre', frases: GRUPO },
  tipografico: { plantilla: 'tipografico', titulo: 'Las de siempre', pie: '31 dic 2025', autores: 'nombre', frases: GRUPO },
  tierno: { plantilla: 'tierno', titulo: 'Las de siempre', pie: 'Amigas desde el instituto', autores: 'nombre', semilla: 'tierno-2', frases: GRUPO },
};
