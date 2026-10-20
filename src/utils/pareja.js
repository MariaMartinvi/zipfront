// "Consigue tu objetivo · Chat de pareja": objetivos y utilidades sin dependencias de React.

export const OBJETIVOS = [
  { id: 'le_gusto', emoji: '💘', texto: 'Saber si le gusto' },
  { id: 'avanzar', emoji: '🚀', texto: 'Que esto avance' },
  { id: 'mejorar', emoji: '❤️', texto: 'Mejorar nuestra relación' },
  { id: 'recuperar', emoji: '🔄', texto: 'Recuperar a {X}' },
  { id: 'dejarlo', emoji: '🤔', texto: 'Saber si debo dejarlo' },
];

export const textoObjetivo = (id, otra) => (OBJETIVOS.find((o) => o.id === id)?.texto || '').replace('{X}', otra || '');

export const CLAVE_ESTADO = 'pareja_estado';

/** Clave estable y anónima para el par de personas: SHA-256 de los dos nombres ordenados (32 caracteres). */
export const clavePar = async (a, b) => {
  const texto = [a, b].map((x) => (x || '').trim().toLowerCase()).sort().join('|');
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
  return Array.from(new Uint8Array(bytes)).map((x) => x.toString(16).padStart(2, '0')).join('').slice(0, 32);
};

export const hoy = (fecha = new Date()) =>
  `${String(fecha.getDate()).padStart(2, '0')}/${String(fecha.getMonth() + 1).padStart(2, '0')}/${fecha.getFullYear()}`;

/** Días entre una fecha "dd/mm/aaaa" y hoy. */
export const diasDesde = (ddmmaaaa, ahora = new Date()) => {
  const [d, m, a] = String(ddmmaaaa || '').split('/').map(Number);
  if (!d || !m || !a) return null;
  return Math.floor((ahora - new Date(a, m - 1, d)) / 86400000);
};

export const guardarEstado = (estado) => {
  try { localStorage.setItem(CLAVE_ESTADO, JSON.stringify(estado)); } catch (e) { /* sin localStorage */ }
};

export const leerEstado = () => {
  try { return JSON.parse(localStorage.getItem(CLAVE_ESTADO) || 'null'); } catch (e) { return null; }
};

export const borrarEstado = () => {
  try { localStorage.removeItem(CLAVE_ESTADO); } catch (e) { /* sin localStorage */ }
};
