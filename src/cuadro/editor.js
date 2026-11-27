// Estado del editor del cuadro: la lista de frases (propuestas por la IA o añadidas a mano), cuáles salen
// y las opciones de diseño. Funciones puras, para poder probarlas; el componente es CuadroCrear.js.
import { MAX_FRASES, IDS_PLANTILLAS } from './render';

export const ACTIVAS_AL_EMPEZAR = 3; // las tres mejores salen marcadas; el usuario quita y pone
export const OPCIONES_INICIALES = { plantilla: IDS_PLANTILLAS[0], autores: 'nombre', titulo: '', pie: '', oscuro: false };

let contador = 0;
const nuevoId = () => `f${Date.now().toString(36)}${(contador++).toString(36)}`;

/** Lista del editor a partir de las frases de la IA (ya vienen ordenadas de mejor a peor). */
export function listaInicial(frases) {
  return (frases || []).map((f, i) => ({ id: nuevoId(), texto: f.texto, autor: f.autor || '', tono: f.tono || '', origen: 'ia', activa: i < ACTIVAS_AL_EMPEZAR }));
}

export const activas = (lista) => lista.filter((f) => f.activa);

/** Marca o desmarca una frase. No deja pasar de 12 marcadas. */
export function alternar(lista, id) {
  const f = lista.find((x) => x.id === id);
  if (!f) return lista;
  if (!f.activa && activas(lista).length >= MAX_FRASES) return lista;
  return lista.map((x) => (x.id === id ? { ...x, activa: !x.activa } : x));
}

/** Añade una frase elegida a mano (marcada si aún cabe). Si ya estaba, no la repite. */
export function anadir(lista, { texto, autor }) {
  const limpio = String(texto || '').trim().replace(/\s+/g, ' ');
  if (!limpio || lista.some((x) => x.texto === limpio)) return lista;
  return [...lista, { id: nuevoId(), texto: limpio, autor: autor || '', tono: '', origen: 'mano', activa: activas(lista).length < MAX_FRASES }];
}

export const editar = (lista, id, cambios) => lista.map((x) => (x.id === id ? { ...x, ...cambios } : x));
export const quitar = (lista, id) => lista.filter((x) => x.id !== id);

/** Sube o baja una frase en la lista (el orden de la lista es el orden en el cuadro). */
export function mover(lista, id, paso) {
  const i = lista.findIndex((x) => x.id === id);
  const j = i + paso;
  if (i < 0 || j < 0 || j >= lista.length) return lista;
  const copia = [...lista];
  [copia[i], copia[j]] = [copia[j], copia[i]];
  return copia;
}

/** El cuadro que se pinta (render.js) con las frases marcadas y las opciones. */
export function cuadroDe(lista, opciones, datos) {
  const o = { ...OPCIONES_INICIALES, ...opciones };
  return {
    plantilla: IDS_PLANTILLAS.includes(o.plantilla) ? o.plantilla : IDS_PLANTILLAS[0],
    autores: o.autores, titulo: o.titulo, pie: o.pie, oscuro: !!o.oscuro, datos: datos || undefined,
    semilla: `${o.titulo}|${o.pie}`,
    frases: activas(lista).slice(0, MAX_FRASES).map((f) => ({ texto: f.texto, autor: f.autor })),
  };
}

// El trabajo se guarda en este navegador para no perderlo al recargar. Solo las frases y opciones: el chat, no.
const clave = (sid) => `cs_cuadro_${sid}`;
export function guardar(sid, estado, storage = window.localStorage) {
  try { storage.setItem(clave(sid), JSON.stringify(estado)); } catch (e) { /* almacenamiento lleno o bloqueado */ }
}
export function cargar(sid, storage = window.localStorage) {
  try {
    const e = JSON.parse(storage.getItem(clave(sid)) || 'null');
    return e && Array.isArray(e.lista) ? e : null;
  } catch (e) { return null; }
}
