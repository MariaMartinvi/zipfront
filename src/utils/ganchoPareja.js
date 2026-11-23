// Aviso de pago para parejas: en vez del texto genérico, un adelanto con datos reales y gratis de su chat
// («Lucía escribe el 62 % de los mensajes y empieza el 70 % de las conversaciones…»). Solo castellano.
import { equilibrio } from './analisisExtra';

const duracion = (min) => (min < 1 ? 'menos de 1 min' : min < 60 ? `${Math.round(min)} min` : `${(min / 60).toFixed(1).replace('.', ',')} h`);

/** Frase con datos de la pareja, o null si el chat no es de exactamente dos personas o es muy corto. */
export function ganchoPareja(mensajes) {
  const validos = mensajes.filter((m) => m.autor && m.tipo !== 'system' && m.fecha);
  if (validos.length < 20) return null;
  const eq = equilibrio(validos);
  if (eq.length !== 2) return null;
  const [a, b] = eq; // a es quien más escribe
  const inicia = a.pctInicia >= b.pctInicia ? a : b;
  let frase = `${a.nombre} escribe el ${a.pctMensajes} % de los mensajes`;
  frase += inicia === a ? ` y empieza el ${a.pctInicia} % de las conversaciones` : `; ${b.nombre} empieza el ${b.pctInicia} % de las conversaciones`;
  if (a.respuestaMin != null && b.respuestaMin != null) {
    const [rapido, lento] = a.respuestaMin <= b.respuestaMin ? [a, b] : [b, a];
    frase += `; ${rapido.nombre} contesta en ${duracion(rapido.respuestaMin)} y ${lento.nombre} en ${duracion(lento.respuestaMin)}`;
  }
  return `${frase}.`;
}
