// Utilidades del cuadro que trabajan con el chat EN EL NAVEGADOR (nada de esto sale del dispositivo):
// leer el archivo, buscar frases a mano y sacar los datos para el dibujo del estilo Moderno.
import { parseChat } from '../libro/parser';

/** Texto del chat a partir de un .txt o del .zip que exporta WhatsApp. */
export async function leerArchivoChat(file) {
  if (/\.zip$/i.test(file.name)) {
    const JSZip = (await import('jszip')).default;
    const zip = await new JSZip().loadAsync(file);
    const nombres = Object.keys(zip.files);
    const entrada = nombres.find((n) => /(^|\/)_chat\.txt$/i.test(n)) || nombres.find((n) => /\.txt$/i.test(n));
    if (!entrada) throw new Error('El zip no contiene el chat (archivo .txt). Exporta el chat desde WhatsApp y sube el zip tal cual.');
    return zip.files[entrada].async('string');
  }
  return file.text();
}

/** Mensajes de texto del chat, con autor (los del sistema, fotos, audios, etc. no cuentan). */
export function mensajesDeTexto(chatText) {
  return parseChat(chatText || '').filter((m) => m.autor && m.tipo === 'text' && (m.texto || '').trim());
}

const plano = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Busca frases en el chat (sin tildes ni mayúsculas). Devuelve [{ texto, autor }], sin repetidas. */
export function buscarFrases(mensajes, consulta, max = 30) {
  const q = plano(consulta).trim();
  if (q.length < 2) return [];
  const vistas = new Set();
  const salida = [];
  for (const m of mensajes) {
    const texto = m.texto.trim().replace(/\s+/g, ' ');
    if (texto.length > 220 || !plano(texto).includes(q) || vistas.has(texto)) continue;
    vistas.add(texto);
    salida.push({ texto, autor: m.autor });
    if (salida.length >= max) break;
  }
  return salida;
}

/**
 * Datos para el dibujo del estilo Moderno: la historia del chat en hasta `tramos` trozos de tiempo iguales.
 * Cada trozo es un círculo: a = quién escribió más en ese trozo (0 = quien más escribe en total), p = cuánto se habló (0..1).
 */
export function datosModerno(mensajes, tramos = 18) {
  const ms = mensajes.filter((m) => m.fecha);
  if (ms.length < 2) return null;
  const orden = {};
  ms.forEach((m) => { orden[m.autor] = (orden[m.autor] || 0) + 1; });
  const autores = Object.keys(orden).sort((a, b) => orden[b] - orden[a]);
  const t0 = +ms[0].fecha; const t1 = +ms[ms.length - 1].fecha;
  const ancho = Math.max(1, (t1 - t0) / tramos);
  const cubos = Array.from({ length: tramos }, () => ({}));
  ms.forEach((m) => { const c = cubos[Math.min(tramos - 1, Math.floor((+m.fecha - t0) / ancho))]; c[m.autor] = (c[m.autor] || 0) + 1; });
  const llenos = cubos.map((c) => {
    const total = Object.values(c).reduce((a, b) => a + b, 0);
    const quien = Object.keys(c).sort((a, b) => c[b] - c[a])[0];
    return { total, a: autores.indexOf(quien) };
  }).filter((c) => c.total > 0);
  const max = Math.max(...llenos.map((c) => c.total));
  return llenos.map((c) => ({ a: c.a, p: Math.round((c.total / max) * 100) / 100 }));
}

/** Título y pie propuestos: «Eva y Marcos» si son dos, y los años que abarca el chat. */
export function titulosPropuestos(mensajes) {
  const cuenta = {};
  mensajes.forEach((m) => { cuenta[m.autor] = (cuenta[m.autor] || 0) + 1; });
  const pila = Object.keys(cuenta).sort((a, b) => cuenta[b] - cuenta[a]).map((n) => n.trim().split(/\s+/)[0]);
  const conFecha = mensajes.filter((m) => m.fecha);
  const a0 = conFecha.length ? conFecha[0].fecha.getFullYear() : null;
  const a1 = conFecha.length ? conFecha[conFecha.length - 1].fecha.getFullYear() : null;
  return {
    titulo: pila.length === 2 ? `${pila[0]} y ${pila[1]}` : '',
    pie: a0 ? (a0 === a1 ? `${a0}` : `${a0} – ${a1}`) : '',
  };
}
