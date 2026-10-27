// Parser de exports de WhatsApp (iOS y Android, ES/EN/CA/PT).
// Mismos patrones que ChatSalsa (formatDetector.js) para que ambos vean los mismos chats.
// Entrada: texto del _chat.txt. Salida: lista de mensajes normalizados.

export const PATRON_IOS = /^\[(\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}),?\s*(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[ap]\.?\s*m\.?)?)\]\s*([^:]+):\s*(.*)$/i;
export const PATRON_ANDROID = /^(\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}),?\s*(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[ap]\.?\s*m\.?)?)\s*-\s*([^:]+):\s*(.+)/i;
const PATRON_SIN_AUTOR_IOS = /^\[(\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}),?\s*(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[ap]\.?\s*m\.?)?)\]\s*(.*)$/i;
const PATRON_SIN_AUTOR_ANDROID = /^(\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}),?\s*(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[ap]\.?\s*m\.?)?)\s*-\s*(.*)$/i;
const INICIO = /^‎?\[?\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}/;

// Marcadores de media y sistema en los idiomas que nos importan.
const MEDIA = [
  [/<?\s*(imagen|image|imatge|imagem|photo|foto)\s+(omitida|omitted|omesa|omitido|ausente)\s*>?/i, 'image'],
  [/<?\s*(v[ií]deo|vídeo)\s+(omitido|omitted|omès|ausente)\s*>?/i, 'video'],
  [/<?\s*(audio|áudio)\s+(omitido|omitted|omès|ausente)\s*>?/i, 'audio'],
  [/<?\s*(sticker|adhesivo)\s+(omitido|omitted|omès|ausente)\s*>?/i, 'sticker'],
  [/<?\s*(gif)\s+(omitido|omitted|omès)\s*>?/i, 'gif'],
  [/<?\s*(documento|document)\s+(omitido|omitted|omès)\s*>?/i, 'document'],
  [/<?\s*(contacto|contact)\s+(omitido|omitted)\s*>?/i, 'contact'],
  [/<?\s*(multimedia|media|mèdia|mídia)\s+(omitid[oa]|omitted|omès|omitida|ausente)\s*>?/i, 'media'],
  [/\.(jpe?g|png|heic)\s*(<(adjunto|attached|adjunt|anexado)>|\((archivo adjunto|file attached|fitxer adjunt|arquivo anexado)\))/i, 'image'],
  [/\.(mp4|mov|3gp)\s*(<(adjunto|attached|adjunt|anexado)>|\((archivo adjunto|file attached|fitxer adjunt|arquivo anexado)\))/i, 'video'],
  [/\.(opus|m4a|mp3|ogg)\s*(<(adjunto|attached|adjunt|anexado)>|\((archivo adjunto|file attached|fitxer adjunt|arquivo anexado)\))/i, 'audio'],
  [/\.(webp)\s*(<(adjunto|attached|adjunt|anexado)>|\((archivo adjunto|file attached|fitxer adjunt|arquivo anexado)\))/i, 'sticker'],
  [/\.(pdf|docx?|xlsx?|pptx?|pkpass)\s*(<(adjunto|attached|adjunt|anexado)>|\((archivo adjunto|file attached|fitxer adjunt|arquivo anexado)\))/i, 'document'],
  [/^[\w\-]+\.\s*\((archivo adjunto|file attached)\)/i, 'document'],
  [/\.vcf\s*(<(adjunto|attached|adjunt|anexado)>|\((archivo adjunto|file attached|fitxer adjunt|arquivo anexado)\))/i, 'contact'],
];
const ADJUNTO = /([\w\-. ]+\.(jpe?g|png|webp|heic|mp4|mov|3gp|opus|m4a|mp3|ogg|pdf|docx?|vcf|pkpass))\s*(?:<(adjunto|attached|adjunt|anexado)>|\((archivo adjunto|file attached|fitxer adjunt|arquivo anexado)\))/i;
const SISTEMA = [
  /cifrad[oa]s? de extremo a extremo/i, /end-to-end encrypted/i, /xifrats? d'extrem a extrem/i,
  /\[llamada\]|\[call\]|llamada perdida|missed (voice|video) call|videollamada perdida/i,
  /cambió el código de seguridad|security code changed/i,
  /se unió usando|joined using|añadió a|added|salió del grupo|left/i,
  /cambió el asunto|changed the subject|cambió la imagen del grupo|changed this group's icon/i,
  /mensajes temporales|disappearing messages/i,
];
const BORRADO = /^(este mensaje fue eliminado|se eliminó este mensaje|you deleted this message|this message was deleted|eliminaste este mensaje|has eliminat aquest missatge|aquest missatge s'ha eliminat|esta mensagem foi apagada|você apagou esta mensagem|has eliminado este mensaje)\.?$/i;
const REENVIADO = /^‎?\[?(reenviado|forwarded|reenviat|encaminhada)\]?\s*/i;
const EDITADO = /\s*<?(este mensaje fue editado|this message was edited|aquest missatge s'ha editat)>?\.?$/i;
const SOLO_URL = /^(https?:\/\/\S+\s*)+$/i;

function parseFecha(fecha, hora) {
  const f = fecha.split(/[/.-]/).map(Number);
  let [a, b, c] = f;
  if (c < 100) c += 2000;
  // WhatsApp usa el orden del idioma del teléfono: d/m/y en ES, m/d/y en EN-US. Decidimos por el valor.
  let dia, mes;
  if (a > 12) { dia = a; mes = b; } else if (b > 12) { mes = a; dia = b; } else { dia = a; mes = b; } // ambiguo: asumimos d/m
  let [h, m, s] = hora.replace(/\s*[ap]\.?\s*m\.?$/i, '').split(':').map(Number);
  const pm = /p\.?\s*m\.?$/i.test(hora), am = /a\.?\s*m\.?$/i.test(hora);
  if (pm && h < 12) h += 12;
  if (am && h === 12) h = 0;
  return new Date(c, mes - 1, dia, h, m, s || 0);
}

export function detectarOrdenFecha(lineas) {
  // Si alguna fecha tiene el primer campo > 12, es d/m; si el segundo > 12, es m/d.
  let dm = 0, md = 0;
  for (const l of lineas) {
    const m = l.match(/^‎?\[?(\d{1,2})[/.-](\d{1,2})[/.-]\d{2,4}/);
    if (!m) continue;
    if (+m[1] > 12) dm++; else if (+m[2] > 12) md++;
  }
  return md > dm ? 'mdy' : 'dmy';
}

export function parseChat(texto) {
  const lineas = texto.replace(/\r\n?/g, '\n').split('\n');
  const orden = detectarOrdenFecha(lineas);
  const mensajes = [];
  let actual = null;
  const mk = (fecha, hora, autor, texto) => {
    const d = fecha.split(/[/.-]/);
    const fechaNorm = orden === 'mdy' ? `${d[1]}/${d[0]}/${d[2]}` : fecha;
    return { fecha: parseFecha(fechaNorm, hora), autor: autor ? autor.trim().replace(/^‎/, '') : null, texto };
  };
  for (const raw of lineas) {
    const linea = raw.replace(/^‎/, '').replace(/‎/g, '');
    if (INICIO.test(linea)) {
      if (actual) mensajes.push(actual);
      let m;
      if ((m = linea.match(PATRON_IOS)) || (m = linea.match(PATRON_ANDROID))) {
        actual = mk(m[1], m[2], m[3], m[4]);
      } else if ((m = linea.match(PATRON_SIN_AUTOR_IOS)) || (m = linea.match(PATRON_SIN_AUTOR_ANDROID))) {
        actual = mk(m[1], m[2], null, m[3]);
      } else {
        actual = { fecha: null, autor: null, texto: linea };
      }
    } else if (actual) {
      actual.texto += '\n' + linea;
    }
  }
  if (actual) mensajes.push(actual);
  return mensajes.filter(m => m.fecha).map(normalizar);
}

function normalizar(m, i) {
  let texto = m.texto.trim();
  let tipo = 'text';
  let reenviado = false, editado = false, archivo = null;
  texto = texto.replace(/[\u200e\u200f\u202a-\u202e]/g, '').trim(); // marcas de dirección que mete WhatsApp
  if (REENVIADO.test(texto)) { reenviado = true; texto = texto.replace(REENVIADO, ''); }
  if (EDITADO.test(texto)) { editado = true; texto = texto.replace(EDITADO, ''); }
  const adj = texto.match(ADJUNTO);
  if (adj) archivo = adj[1].trim();
  for (const [re, t] of MEDIA) {
    if (re.test(texto)) { tipo = t; texto = texto.replace(ADJUNTO, '').replace(re, '').replace(/^[\w\-]+(\.\w+)?\s*$/m, '').trim(); break; }
  }
  if (!m.autor || SISTEMA.some(re => re.test(texto))) tipo = m.autor && tipo !== 'text' ? tipo : 'system';
  if (BORRADO.test(texto)) tipo = 'deleted';
  if (tipo === 'text' && SOLO_URL.test(texto)) tipo = 'link';
  const esMedia = ['image', 'video', 'audio', 'sticker', 'gif', 'document', 'contact', 'media'].includes(tipo);
  return {
    id: i, fecha: m.fecha, dia: m.fecha.toISOString().slice(0, 10), autor: m.autor,
    tipo, texto, archivo, reenviado, editado,
    tieneTexto: texto.length > 0, esMedia,
  };
}

export function participantes(mensajes) {
  const c = {};
  for (const m of mensajes) if (m.autor && m.tipo !== 'system') c[m.autor] = (c[m.autor] || 0) + 1;
  return Object.entries(c).sort((a, b) => b[1] - a[1]).map(([nombre, n]) => ({ nombre, n }));
}
