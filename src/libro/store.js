// Memoria de sesión para el libro: el texto del chat y el zip (para las fotos). Solo en memoria del
// navegador; no se guarda en localStorage ni se envía a ningún sitio.
let data = { chatText: null, zip: null, fileName: null };
export const libroStore = {
  set(d) { data = { ...data, ...d }; },
  get() { return data; },
  clear() { data = { chatText: null, zip: null, fileName: null }; },
};
