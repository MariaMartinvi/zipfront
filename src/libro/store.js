// Memoria del libro: el texto del chat y el zip (para las fotos) en memoria, y además una copia en el
// almacén local del navegador (IndexedDB) para poder cerrar y seguir editando más tarde.
// Nada sale del navegador. Se borra al subir otro chat o con "Borrar mi libro".
let data = { chatText: null, zip: null, fileName: null, file: null };

const DB = 'chatsalsa-libro', STORE = 'kv';
function abrir() {
  return new Promise((res, rej) => {
    try {
      const r = indexedDB.open(DB, 1);
      r.onupgradeneeded = () => r.result.createObjectStore(STORE);
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    } catch (e) { rej(e); }
  });
}
async function kvSet(k, v) {
  try { const db = await abrir(); await new Promise((res, rej) => { const t = db.transaction(STORE, 'readwrite'); t.objectStore(STORE).put(v, k); t.oncomplete = res; t.onerror = () => rej(t.error); }); db.close(); } catch (e) { /* sin almacén: seguimos solo en memoria */ }
}
async function kvGet(k) {
  try { const db = await abrir(); const v = await new Promise((res, rej) => { const r = db.transaction(STORE).objectStore(STORE).get(k); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); db.close(); return v; } catch (e) { return undefined; }
}
async function kvDel(k) {
  try { const db = await abrir(); await new Promise((res, rej) => { const t = db.transaction(STORE, 'readwrite'); t.objectStore(STORE).delete(k); t.oncomplete = res; t.onerror = () => rej(t.error); }); db.close(); } catch (e) { /* nada */ }
}

export const libroStore = {
  // Nuevo chat: lo guarda en memoria y en el navegador, y olvida la edición del libro anterior.
  set(d) {
    data = { ...data, ...d };
    if (d.file) { kvSet('archivo', { file: d.file, fileName: d.fileName || d.file.name, cuando: Date.now() }); kvDel('edicion'); }
  },
  get() { return data; },
  // Recupera el chat guardado en el navegador (si lo hay) cuando la memoria está vacía (p. ej. tras recargar).
  async recuperar() {
    if (data.chatText) return data;
    const g = await kvGet('archivo');
    if (!g || !g.file) return data;
    try {
      const JSZip = (await import('jszip')).default;
      const zip = await new JSZip().loadAsync(g.file);
      const entrada = Object.keys(zip.files).find(n => /(^|\/)_chat\.txt$/i.test(n)) || Object.keys(zip.files).find(n => /\.txt$/i.test(n));
      if (!entrada) return data;
      data = { chatText: await zip.files[entrada].async('string'), zip, fileName: g.fileName, file: g.file };
    } catch (e) { /* archivo ilegible: como si no hubiera nada */ }
    return data;
  },
  guardarEdicion(ed) { return kvSet('edicion', { ...ed, cuando: Date.now() }); },
  cargarEdicion() { return kvGet('edicion'); },
  async borrar() { data = { chatText: null, zip: null, fileName: null, file: null }; await kvDel('archivo'); await kvDel('edicion'); },
  clear() { data = { chatText: null, zip: null, fileName: null, file: null }; },
};
