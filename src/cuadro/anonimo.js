// El chat del cuadro se anonimiza EN EL NAVEGADOR antes de salir, exactamente igual que el del análisis de IA
// (fileService.js, processContentForAzure): mismas funciones y mismo orden. Al servidor solo llegan líneas
// «Participante N: mensaje», sin fechas ni horas; los nombres reales se quedan aquí y se reponen aquí.
import { anonimizarChat } from '../utils/chatImport';
import { anonymizationService } from '../services/anonymizationService';
import { parseChat } from '../libro/parser';

const unaLinea = (s) => String(s || '').replace(/\s+/g, ' ').trim();

/** El chat anonimizado (aún con el formato de WhatsApp) y los mapas nombre real → alias. */
export function anonimizar(chatText) {
  anonymizationService.reset(); // cada chat, sus propios alias
  let t = anonimizarChat(chatText);                                    // 1. teléfonos, correos y enlaces
  t = anonymizationService.anonymizeParticipants(t, 'es');             // 2. quien escribe → «Participante N» (también dentro de los mensajes)
  t = anonymizationService.anonymizeWithPatterns(t, anonymizationService.detectLanguage(t)); // 3. personas mencionadas
  const m = anonymizationService.getAllMappings();
  return { texto: t, mapas: { ...m.locations, ...m.mentionedPeople, ...m.participants } };
}

// Línea de un mensaje tal como la deja anonymizeParticipants: «[fecha] Participante N: texto».
const LINEA_ANONIMA = /^\[[^\]]*\]\s*(Participante \d+): ?(.*)$/;

/**
 * Lo que se envía y lo que hace falta para deshacerlo después.
 * lineas: «Participante N: mensaje», una por mensaje de texto. pares: cada mensaje enviado con su original.
 *
 * Cada mensaje de texto se pone primero en una línea limpia y con el mismo formato, y a ese texto se le pasan
 * las funciones del análisis, las mismas para toda la web. Y por si acaso: solo se envía lo que ha quedado
 * como «Participante N: …».
 */
export function chatParaEnviar(chatText) {
  const orig = parseChat(chatText).filter((m) => m.fecha && m.autor && m.tipo === 'text' && unaLinea(m.texto));
  const limpio = orig.map((m) => `[1/1/20, 10:00:00] ${unaLinea(m.autor)}: ${unaLinea(m.texto)}`).join('\n');
  const { texto, mapas } = anonimizar(limpio);
  const salida = texto.split('\n');
  const alineado = salida.length === orig.length; // una línea por mensaje: la i-ésima es el i-ésimo original

  const pares = [];
  salida.forEach((l, i) => {
    const m = l.match(LINEA_ANONIMA);
    if (!m) return; // lo que no ha quedado con alias no se envía
    const a = { autor: m[1], texto: unaLinea(m[2]) };
    if (a.texto) pares.push({ a, o: alineado ? { autor: orig[i].autor, texto: unaLinea(orig[i].texto) } : null });
  });
  return { lineas: pares.map((p) => `${p.a.autor}: ${p.a.texto}`).join('\n'), pares, mapas };
}

/** Huella corta del chat anonimizado: para saber, en este navegador, si se vuelve a subir el mismo chat del pago. */
export function huellaChat(lineas) {
  let h = 2166136261;
  for (let i = 0; i < lineas.length; i += 1) { h ^= lineas.charCodeAt(i); h = Math.imul(h, 16777619); }
  return `${lineas.length}-${(h >>> 0).toString(36)}`;
}

/** Repone los nombres reales en las frases que devuelve el servidor. Solo en el navegador. */
export function nombresReales(frases, { pares, mapas }) {
  const inverso = Object.entries(mapas || {}).map(([real, alias]) => [alias, real]).sort((x, y) => y[0].length - x[0].length);
  const reponer = (s) => inverso.reduce((t, [alias, real]) => t.split(alias).join(real), s);
  return (frases || []).map((f) => {
    const texto = unaLinea(f.texto);
    const delAutor = pares.filter((p) => p.a.autor === f.autor);
    const entera = delAutor.find((p) => p.a.texto === texto);       // el mensaje entero: se usa el original tal cual
    if (entera && entera.o) return { ...f, autor: entera.o.autor, texto: entera.o.texto };
    const parte = delAutor.find((p) => p.a.texto.includes(texto));  // una oración de un mensaje más largo
    return { ...f, autor: (parte && parte.o && parte.o.autor) || reponer(f.autor), texto: reponer(texto) };
  });
}
