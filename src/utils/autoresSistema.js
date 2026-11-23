// En los grupos exportados desde iPhone, WhatsApp firma los avisos («…creó el grupo», «…añadió a…», cifrado)
// con el nombre del grupo, como si fuera un participante. Esos avisos empiezan por un carácter invisible (U+200E),
// igual que «imagen omitida» y demás adjuntos, que sí son de personas.
const MEDIA = /omitid|omitted|omise|omis|ausgelassen|omess|omès|omesa|adjunt|attached|anexad|ausente/i;
const esAviso = (texto = '') => texto.startsWith('‎') && !MEDIA.test(texto);

/** Quita los «autores» que solo tienen avisos del sistema (el nombre del grupo). */
export function quitarAutoresSistema(mensajes) {
  const conMensajeReal = new Set(mensajes.filter((m) => !esAviso(m.mensaje)).map((m) => m.nombre));
  return mensajes.filter((m) => conMensajeReal.has(m.nombre));
}
