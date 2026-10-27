// Compartir UN personaje como imagen cuadrada ("Soy El Cómico del grupo 🤡 · chatsalsa.com").
// Es lo que la gente manda al grupo; cada imagen trae a más miembros del mismo chat a la web.
// Todo en el navegador (canvas); no se sube nada.

const FONDOS = ['#25D366', '#128C7E', '#7122AC', '#8A2BE2', '#075E54', '#e8590c', '#0b7285', '#c2255c'];

function fondoPara(texto) {
  let h = 0;
  for (const c of String(texto)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return FONDOS[h % FONDOS.length];
}

function ajustarLineas(ctx, texto, maxAncho) {
  const palabras = String(texto).split(/\s+/); const lineas = []; let actual = '';
  for (const p of palabras) {
    const prueba = actual ? `${actual} ${p}` : p;
    if (ctx.measureText(prueba).width > maxAncho && actual) { lineas.push(actual); actual = p; } else actual = prueba;
  }
  if (actual) lineas.push(actual);
  return lineas;
}

export async function imagenPersonaje({ icono, titulo, descripcion, nombre, lema }) {
  const S = 1080;
  const c = document.createElement('canvas'); c.width = S; c.height = S;
  const ctx = c.getContext('2d');
  const color = fondoPara(titulo);
  const g = ctx.createLinearGradient(0, 0, S, S); g.addColorStop(0, color); g.addColorStop(1, '#1d1d1b');
  ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
  // tarjeta blanca
  ctx.fillStyle = 'rgba(255,255,255,0.96)';
  const r = 48, x = 90, y = 150, w = S - 180, h = S - 330;
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); ctx.fill();
  ctx.textAlign = 'center'; ctx.fillStyle = '#1d1d1b';
  ctx.font = '200px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
  ctx.fillText(icono, S / 2, y + 260);
  ctx.font = '600 44px Poppins, system-ui, sans-serif'; ctx.fillStyle = '#777';
  ctx.fillText((lema || 'En nuestro grupo yo soy…').toUpperCase(), S / 2, y + 340);
  ctx.font = '700 84px Poppins, system-ui, sans-serif'; ctx.fillStyle = '#1d1d1b';
  const tl = ajustarLineas(ctx, titulo, w - 120); let yy = y + 450;
  for (const l of tl) { ctx.fillText(l, S / 2, yy); yy += 92; }
  ctx.font = '400 38px Poppins, system-ui, sans-serif'; ctx.fillStyle = '#555';
  for (const l of ajustarLineas(ctx, descripcion, w - 140).slice(0, 3)) { ctx.fillText(l, S / 2, yy + 10); yy += 50; }
  ctx.font = '600 56px Poppins, system-ui, sans-serif'; ctx.fillStyle = color;
  ctx.fillText(nombre, S / 2, y + h - 60);
  // pie
  ctx.fillStyle = '#fff'; ctx.font = '600 40px Poppins, system-ui, sans-serif';
  ctx.fillText('chatsalsa.com · descubre quién eres tú', S / 2, S - 70);
  return new Promise(res => c.toBlob(res, 'image/png', 0.92));
}

export async function compartirPersonaje(datos, t) {
  const blob = await imagenPersonaje(datos);
  const archivo = new File([blob], 'chatsalsa-personaje.png', { type: 'image/png' });
  const texto = t('share_personaje.text', { titulo: datos.titulo, defaultValue: 'En nuestro grupo yo soy {{titulo}} 😂 Descubre quién eres tú: https://chatsalsa.com?utm_source=share&utm_medium=personaje' });
  try {
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [archivo] })) {
      await navigator.share({ files: [archivo], text: texto });
      return 'shared';
    }
  } catch (e) { if (e && e.name === 'AbortError') return 'cancel'; }
  // sin share nativo (escritorio): descargar la imagen y abrir WhatsApp con el texto
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = archivo.name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank', 'noopener');
  return 'download';
}
