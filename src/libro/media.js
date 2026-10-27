// Media del zip en el navegador: imágenes reducidas a JPEG (max 1200 px), fotograma de vídeo, duración.
// Nada sale del navegador. Devuelve data URIs listas para el HTML del libro.

const cache = new Map();

export async function loadMediaIndex(zip) {
  // nombre de archivo → entrada JSZip (solo imágenes, vídeos y audios)
  const idx = new Map();
  if (!zip) return idx;
  zip.forEach((path, entry) => {
    if (entry.dir) return;
    const name = path.split('/').pop();
    if (/\.(jpe?g|png|webp|heic|mp4|mov|3gp|opus|ogg|m4a|mp3|aac)$/i.test(name)) idx.set(name, entry);
  });
  return idx;
}

async function blobOf(entry) {
  return await entry.async('blob');
}

function loadImage(blob) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(blob);
    const im = new Image();
    im.onload = () => { URL.revokeObjectURL(url); res(im); };
    im.onerror = () => { URL.revokeObjectURL(url); rej(new Error('img')); };
    im.src = url;
  });
}

function toJpeg(source, w, h, max = 1200, q = 0.86) {
  const scale = Math.min(1, max / Math.max(w, h));
  const c = document.createElement('canvas');
  c.width = Math.round(w * scale); c.height = Math.round(h * scale);
  c.getContext('2d').drawImage(source, 0, 0, c.width, c.height);
  return { uri: c.toDataURL('image/jpeg', q), w: c.width, h: c.height };
}

export async function imageUri(idx, name) {
  if (cache.has(name)) return cache.get(name);
  const entry = idx.get(name);
  if (!entry) return null;
  try {
    const im = await loadImage(await blobOf(entry));
    const out = toJpeg(im, im.naturalWidth, im.naturalHeight);
    cache.set(name, out);
    return out;
  } catch { cache.set(name, null); return null; }
}

// ¿Captura de pantalla (pantallazo)? Señales: proporción de pantalla de móvil, pocos colores
// (interfaces planas), o una franja superior uniforme (barra de estado / barra del navegador).
export async function isScreenshot(idx, name) {
  const img = await imageUri(idx, name);
  if (!img) return false;
  const ratio = img.h / img.w;
  if (ratio >= 1.9) return true;                       // 19.5:9 y similares: ninguna cámara hace fotos así
  const im = await loadImage(await (await fetch(img.uri)).blob());
  const S = 64;
  const c = document.createElement('canvas'); c.width = S; c.height = S;
  const ctx = c.getContext('2d'); ctx.drawImage(im, 0, 0, S, S);
  const d = ctx.getImageData(0, 0, S, S).data; const colors = new Set();
  for (let i = 0; i < d.length; i += 4) colors.add(((d[i] >> 4) << 8) | ((d[i + 1] >> 4) << 4) | (d[i + 2] >> 4));
  if (colors.size < 110) return true;                   // interfaz plana (web, app, chat): las fotos reales pasan de 150
  // franja superior (3 filas de 64) casi uniforme → barra de estado
  let maxDev = 0; const r0 = d[0], g0 = d[1], b0 = d[2];
  for (let y = 0; y < 3; y++) for (let x = 0; x < S; x++) { const i = (y * S + x) * 4; maxDev = Math.max(maxDev, Math.abs(d[i] - r0), Math.abs(d[i + 1] - g0), Math.abs(d[i + 2] - b0)); }
  if (maxDev < 10 && ratio >= 1.3) return true;
  return false;
}

// Fotograma más nítido de un vídeo (muestreo de 5 puntos) + duración
export async function videoFrame(idx, name) {
  const key = 'v:' + name;
  if (cache.has(key)) return cache.get(key);
  const entry = idx.get(name);
  if (!entry) return null;
  try {
    const url = URL.createObjectURL(await blobOf(entry));
    const v = document.createElement('video'); v.muted = true; v.playsInline = true; v.preload = 'auto'; v.src = url;
    await new Promise((res, rej) => { v.onloadedmetadata = res; v.onerror = rej; });
    const dur = v.duration || 0;
    const c = document.createElement('canvas');
    let best = null, bestScore = -1;
    for (let i = 1; i <= 5; i++) {
      v.currentTime = Math.min(dur * i / 6, Math.max(0, dur - 0.1));
      await new Promise(res => { v.onseeked = res; });
      c.width = v.videoWidth; c.height = v.videoHeight;
      const ctx = c.getContext('2d'); ctx.drawImage(v, 0, 0);
      const s = c.width && c.height ? sharpness(ctx, c.width, c.height) : 0;
      if (s > bestScore) { bestScore = s; best = toJpeg(c, c.width, c.height); }
    }
    URL.revokeObjectURL(url);
    const out = best ? { ...best, seconds: dur } : null;
    cache.set(key, out);
    return out;
  } catch { cache.set(key, null); return null; }
}

function sharpness(ctx, w, h) {
  const s = 96; const c = document.createElement('canvas'); c.width = s; c.height = s;
  const x = c.getContext('2d'); x.drawImage(ctx.canvas, 0, 0, w, h, 0, 0, s, s);
  const d = x.getImageData(0, 0, s, s).data; let sum = 0, mean = 0;
  for (let i = 0; i < d.length; i += 4) mean += d[i];
  mean /= (d.length / 4);
  if (mean < 40 || mean > 215) return 0;
  for (let i = 4; i < d.length - 4; i += 4) sum += Math.abs(d[i] - d[i - 4]) + Math.abs(d[i] - d[i + 4]);
  return sum;
}

export async function videoSeconds(idx, name) {
  const f = await videoFrame(idx, name);
  return f ? f.seconds : null;
}
