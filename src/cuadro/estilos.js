// Los tres estilos del cuadro regalo (Maria, 27-11-2026), todos de 1 a 12 frases:
//  - moderno:     composición geométrica abstracta (Kandinsky-Miró) generada con el chat, con las frases debajo
// `letras` son las fuentes que hay que tener cargadas antes de dibujar la lámina (lamina.js).
//  - tipografico: las frases tal cual, en letra enorme tipo póster
//  - tierno:      pastel, letra a mano y dibujitos (corazones, destellos, arcoíris). Diseño propio.
// Con pocas frases (1 a 4) manda el dibujo o la letra enorme; con muchas (5 a 12, chats de grupo) el mismo
// estilo pasa a lista y el texto gana protagonismo.
// Los dos primeros parten del lienzo de Maria «Cuadros de chats — muestra geométrica».

export const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const LISTA_DESDE = 5; // con 5 frases o más, formato de lista
export const EMOJIS = "'Noto Color Emoji', 'Apple Color Emoji', 'Segoe UI Emoji'";
const n1 = (x) => Math.round(x * 10) / 10;

/** Cómo sale quien dijo la frase: nombre de pila, inicial o nada. */
export function autorVisible(nombre, modo = 'nombre') {
  const pila = String(nombre || '').trim().split(/\s+/)[0] || '';
  if (!pila || modo === 'ninguno') return '';
  return modo === 'inicial' ? `${[...pila][0].toUpperCase()}.` : pila;
}

/** Números al azar pero repetibles: la misma semilla da siempre el mismo cuadro. */
export function azar(semilla) {
  let h = 1779033703 ^ String(semilla).length;
  for (const c of String(semilla)) { h = Math.imul(h ^ c.codePointAt(0), 3432918353); h = (h << 13) | (h >>> 19); }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

/**
 * Parte una frase en líneas y elige la letra más grande (en rem) con la que cabe en ancho × alto.
 * car = ancho medio de un carácter respecto al tamaño de letra; interlinea = alto de línea respecto al tamaño.
 */
export function ajustarTitular(texto, { ancho, alto, car = 0.58, interlinea = 1, max = 30, min = 3 }) {
  const palabras = String(texto || '').trim().split(/\s+/).filter(Boolean);
  const partir = (cpl) => {
    const lineas = [];
    palabras.forEach((w) => {
      const ult = lineas[lineas.length - 1];
      if (ult && [...ult].length + 1 + [...w].length <= cpl) lineas[lineas.length - 1] = `${ult} ${w}`; else lineas.push(w);
    });
    return lineas;
  };
  for (let s = max; s >= min; s -= 0.5) {
    const cpl = Math.floor(ancho / (car * s));
    if (palabras.some((w) => [...w].length > cpl)) continue;
    const lineas = partir(cpl);
    if (lineas.length * interlinea * s <= alto) return { s, lineas };
  }
  return { s: min, lineas: partir(Math.max(1, Math.floor(ancho / (car * min)))) };
}
const lineasHtml = (lineas) => lineas.map((l, i) => `<span class="l l${i % 2}">${esc(l)}</span>`).join('');

// ───────────────────────────── Moderno (Kandinsky-Miró) ─────────────────────────────
const PALETA = {
  claro: { fondo: '#EFE9DC', tinta: '#1B1B1F', gris: '#55524B', halo: ['#BFD0E6', 0.55], mezcla: 'multiply', acento: '#E9A820', diana: '#D7263D',
    colores: ['#2A8C82', '#E2702A', '#1F4FA3', '#E9A820', '#6B4BA1', '#D7352B'] },
  oscuro: { fondo: '#12162A', tinta: '#F2EDE2', gris: '#B9B5C4', halo: ['#2B2F6A', 0.7], mezcla: 'screen', acento: '#F2B632', diana: '#FF4D5E',
    colores: ['#35B0A3', '#F2B632', '#E4572E', '#F28FB1', '#C06BD0', '#3F7CD9'] },
};

/**
 * Composición abstracta (SVG, 600 × 680). Un círculo por cada tramo del chat: `datos` = [{ a: nº de persona, p: peso 0..1 }]
 * (color por persona, tamaño por lo que se habló en ese tramo). Sin datos, los círculos salen de la semilla.
 */
export function arteKandinsky({ semilla = 'chatsalsa', datos, oscuro = false } = {}) {
  const r = azar(semilla);
  const P = oscuro ? PALETA.oscuro : PALETA.claro;
  const entre = (a, b) => a + r() * (b - a);
  const T = P.tinta;
  const o = [];
  const linea = (x1, y1, x2, y2, w) => `<line x1="${n1(x1)}" y1="${n1(y1)}" x2="${n1(x2)}" y2="${n1(y2)}" stroke="${T}" stroke-width="${w}" stroke-linecap="round"/>`;

  // Fondo: halo grande, círculo de contorno y tres líneas largas que cruzan el cuadro
  o.push(`<circle cx="${n1(entre(280, 400))}" cy="${n1(entre(210, 310))}" r="${n1(entre(175, 215))}" fill="${P.halo[0]}" fill-opacity="${P.halo[1]}"/>`);
  o.push(`<circle cx="${n1(entre(110, 200))}" cy="${n1(entre(470, 560))}" r="${n1(entre(72, 100))}" fill="none" stroke="${T}" stroke-width="1"/>`);
  o.push(linea(entre(60, 100), entre(470, 520), entre(500, 540), entre(170, 210), 3));
  o.push(linea(entre(260, 300), entre(30, 60), entre(540, 570), entre(540, 570), 1.5));
  o.push(linea(-30, entre(640, 665), 630, entre(555, 580), 1));

  // Damero girado y tramado de rayas
  const dx = entre(400, 480); const dy = entre(520, 580);
  const acentoEn = Math.floor(r() * 8);
  let k = 0; let celdas = '';
  for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) if ((i + j) % 2 === 0) { celdas += `<rect x="${i * 17}" y="${j * 17}" width="17" height="17" fill="${k === acentoEn ? P.acento : T}"/>`; k++; }
  o.push(`<g transform="translate(${n1(dx)} ${n1(dy)}) rotate(${n1(entre(-26, 8))})">${celdas}<rect x="0" y="0" width="85" height="51" fill="none" stroke="${T}" stroke-width="1"/></g>`);
  let rayas = '';
  for (let i = 0; i < 7; i++) rayas += `<line x1="0" y1="${i * 8}" x2="${70 - i * 3}" y2="${i * 8}" stroke="${T}" stroke-width="2" stroke-linecap="round"/>`;
  o.push(`<g transform="translate(${n1(entre(50, 110))} ${n1(entre(90, 160))}) rotate(${n1(entre(20, 50))})">${rayas}</g>`);

  // Los círculos: muchos juntos abajo a la izquierda (el día a día) y unos pocos subiendo hacia la derecha
  const lista = Array.isArray(datos) && datos.length ? datos.slice(0, 24) : Array.from({ length: 14 + Math.floor(r() * 8) }, () => ({ a: Math.floor(r() * 6), p: r() }));
  const cs = lista.map((d, i) => {
    const t = Math.pow((i + 0.5) / lista.length, 1.7);
    return { x: 55 + t * 470 + entre(-55, 55), y: 610 - t * 470 + entre(-60, 60), R: 19 + Math.max(0, Math.min(1, Number(d.p) || 0)) * 25, c: P.colores[Math.abs(Math.floor(Number(d.a) || 0)) % P.colores.length] };
  });
  const cual = () => cs[Math.floor(r() * cs.length)];
  for (let i = 0; i < 2; i++) { const a = cual(); const b = cual(); o.push(`<path d="M${n1(a.x)} ${n1(a.y)} Q${n1(entre(150, 450))} ${n1(entre(90, 350))} ${n1(b.x)} ${n1(b.y)}" fill="none" stroke="${T}" stroke-width="1.2" stroke-dasharray="1 7" stroke-linecap="round"/>`); }
  [...cs].sort((a, b) => b.R - a.R).forEach((c) => o.push(`<circle cx="${n1(c.x)}" cy="${n1(c.y)}" r="${n1(c.R)}" fill="${c.c}" fill-opacity=".93" style="mix-blend-mode:${P.mezcla}"/>`));

  // Encima: el hilo que une los mensajes, anillos, arcos, agujas y dianas
  cs.slice(0, Math.ceil(cs.length * 0.6)).forEach((c, i, v) => {
    const s = v[i + 1];
    if (s) o.push(`<line x1="${n1(c.x)}" y1="${n1(c.y)}" x2="${n1(s.x)}" y2="${n1(s.y)}" stroke="${T}" stroke-width="1.4"/><circle cx="${n1(c.x)}" cy="${n1(c.y)}" r="2.6" fill="${T}"/><circle cx="${n1(s.x)}" cy="${n1(s.y)}" r="2.6" fill="${T}"/>`);
  });
  for (let i = 0; i < 4; i++) { const c = cual(); o.push(`<circle cx="${n1(c.x)}" cy="${n1(c.y)}" r="${n1(c.R + 7)}" fill="none" stroke="${T}" stroke-width="2"/>`); }
  for (let i = 0; i < 3; i++) {
    const c = cual(); const a0 = entre(0, Math.PI * 2); const a1 = a0 + entre(0.9, 1.3);
    [10, 18, 26].forEach((d) => {
      const R = c.R + d;
      o.push(`<path d="M${n1(c.x + R * Math.cos(a0))} ${n1(c.y + R * Math.sin(a0))} A${n1(R)} ${n1(R)} 0 0 1 ${n1(c.x + R * Math.cos(a1))} ${n1(c.y + R * Math.sin(a1))}" fill="none" stroke="${T}" stroke-width="1.6" stroke-linecap="round"/>`);
    });
  }
  for (let i = 0; i < 3; i++) {
    const c = cual(); const a = entre(-2.4, -0.6); const L = entre(95, 135);
    const bx = c.x + entre(-15, 15); const by = c.y - c.R * 0.6;
    o.push(`<path d="M${n1(bx - 8)} ${n1(by)} L${n1(bx + L * Math.cos(a))} ${n1(by + L * Math.sin(a))} L${n1(bx + 8)} ${n1(by + 5)} Z" fill="${P.acento}" stroke="${T}" stroke-width="1"/>`);
  }
  for (let i = 0; i < 3; i++) {
    const c = cual(); const R = entre(10, 16); const x = c.x + entre(-8, 8); const y = c.y + entre(-8, 8);
    o.push(`<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(R)}" fill="${P.diana}"/><circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(R / 3)}" fill="${T}"/>`);
  }
  return `<svg class="arte" role="img" aria-label="Composición geométrica abstracta generada a partir de la conversación" viewBox="0 0 600 680" preserveAspectRatio="xMidYMid slice" style="isolation:isolate">${o.join('')}</svg>`;
}

function cuerpoModerno(cuadro, frases, modo) {
  const P = cuadro.oscuro ? PALETA.oscuro : PALETA.claro;
  const n = frases.length;
  const tam = n < LISTA_DESDE ? [0, 4.4, 3.7, 3.2, 2.9][n] : Math.max(2.3, 3.5 - n * 0.1); // en lista, letra algo menor y el dibujo cede sitio
  const items = frases.map((f) => {
    const autor = autorVisible(f.autor, modo);
    return `<li><span class="l">«${esc(String(f.texto).trim())}»</span>${autor ? `<span class="aut">${esc(autor)}</span>` : ''}</li>`;
  }).join('');
  const meta = [cuadro.titulo, cuadro.pie].filter(Boolean).map(esc).join(' · ');
  return {
    css: `
      .cuadro { background: ${P.fondo}; color: ${P.tinta}; font-family: 'Jost', ${EMOJIS}, sans-serif; }
      .marco { text-align: left; }
      .arte { flex: 1; min-height: 0; width: 100%; display: block; }
      .arte { min-height: 34rem; }
      .frases { flex: none; margin: 0; padding: 2.6rem 7.3rem 0; gap: calc(var(--k) * ${n < LISTA_DESDE ? 1.3 : 1.05}rem); justify-content: flex-start; overflow: visible; }
      .frases li { display: flex; align-items: baseline; justify-content: space-between; gap: 3rem; }
      .frases .l { white-space: normal; font-size: calc(var(--k) * ${tam}rem); font-weight: 500; line-height: 1.15; letter-spacing: .01em; }
      .aut { flex: none; font-size: 1.9rem; letter-spacing: .14em; text-transform: uppercase; color: ${P.gris}; }
      footer { padding: 2.2rem 7.3rem 5.5rem; display: flex; justify-content: space-between; gap: 3rem; font-size: 1.9rem; letter-spacing: .14em; text-transform: uppercase; color: ${P.gris}; }`,
    html: `${arteKandinsky({ semilla: cuadro.semilla || `${cuadro.titulo}|${frases.map((f) => f.texto).join('|')}`, datos: cuadro.datos, oscuro: cuadro.oscuro })}
      <ul class="frases" data-var="k" style="--k: 1">${items}</ul>
      <footer><span>${meta}</span>${cuadro.sobretitulo ? `<span>${esc(cuadro.sobretitulo)}</span>` : ''}</footer>`,
  };
}

// ───────────────────────────── Tipográfico ─────────────────────────────
function cuerpoTipografico(cuadro, frases, modo) {
  const n = frases.length;
  const lista = n >= LISTA_DESDE;
  const sep = lista ? 2.4 : 7;
  const alto = (118 - (n - 1) * sep) / n - (modo === 'ninguno' ? 0 : lista ? 2.8 : 4.5); // hueco de cada frase, sin su línea de autor
  const colores = ['#D7352B', '#1F4FA3', '#1B1B1F', '#2A8C82'];
  const items = frases.map((f, i) => {
    const impar = i % 2 === 0;
    const mayus = impar && !lista; // en lista, todas alineadas a la izquierda y sin mayúsculas: se lee mejor
    const texto = String(f.texto).trim();
    const { s, lineas } = ajustarTitular(mayus ? texto.toUpperCase() : texto, { ancho: 84, alto, car: mayus ? 0.64 : 0.55, interlinea: 0.9, max: n === 1 ? 34 : 24, min: 2.2 });
    const autor = autorVisible(f.autor, modo);
    return `${i ? '<li class="regla" aria-hidden="true"><i></i></li>' : ''}<li class="b ${impar || lista ? 'izq' : 'der'}">${autor ? `<span class="aut">${esc(autor)}</span>` : ''}<p class="tit" style="font-size: calc(var(--k) * ${s}rem); color: ${colores[i % 4]}">${lineasHtml(lineas)}</p></li>`;
  }).join('');
  const meta = [cuadro.titulo, cuadro.pie].filter(Boolean).map(esc).join(' · ');
  return {
    css: `
      .cuadro { background: #EFE9DC; color: #1B1B1F; font-family: 'Archivo', ${EMOJIS}, sans-serif; }
      .marco { padding: 8.5rem 7.3rem 6.5rem; text-align: left; }
      .frases { margin: 0; justify-content: space-between; }
      .b { display: flex; flex-direction: column; gap: ${lista ? 0.7 : 1.8}rem; } .b.der { align-items: flex-end; text-align: right; }
      .tit { margin: 0; font-weight: 900; line-height: .9; letter-spacing: -.03em; }
      .l { display: block; width: max-content; white-space: nowrap; } .der .l { margin-left: auto; }
      .aut, footer { font-size: 2rem; font-weight: 500; letter-spacing: .14em; text-transform: uppercase; color: #55524B; }
      .regla { display: flex; align-items: center; gap: 2.6rem; } .regla i { flex: 1; height: ${lista ? 0.2 : 0.5}rem; background: #1B1B1F; }
      ${lista ? '.aut { font-size: 1.6rem; }' : ".regla::after { content: ''; width: 5.5rem; height: 5.5rem; border-radius: 50%; background: #E9A820; }"}
      .sol { position: absolute; right: 7.3rem; top: 7.5rem; width: 9rem; height: 9rem; border-radius: 50%; background: #E9A820; }
      footer { padding-top: 3rem; display: flex; justify-content: space-between; gap: 3rem; }`,
    html: `${n === 1 ? '<div class="sol" aria-hidden="true"></div>' : ''}<ul class="frases" data-var="k" style="--k: 1">${items}</ul>
      <footer><span>${meta}</span>${cuadro.sobretitulo ? `<span>${esc(cuadro.sobretitulo)}</span>` : ''}</footer>`,
  };
}

// ───────────────────────────── Tierno ─────────────────────────────
const CORAZON = 'M0 .3C0-.1 .5-.1 .5 .2C.5-.1 1-.1 1 .3C1 .6 .6 .85 .5 1C.4 .85 0 .6 0 .3Z';
const DESTELLO = 'M.5 0L.62 .38L1 .5L.62 .62L.5 1L.38 .62L0 .5L.38 .38Z';
const TONOS = ['#FF6F61', '#2B2D5B', '#2BB3A3', '#E39A1B', '#F0668A'];

/** Dibujitos de los márgenes (viewBox 100 × 141.4): arcoíris, nube, corazones, destellos y confeti. */
export function dibujitos(semilla) {
  const r = azar(semilla);
  const entre = (a, b) => a + r() * (b - a);
  const o = [];
  // Arcoíris asomando por una esquina de arriba y nube en la contraria de abajo
  const izq = r() < 0.5; const cx = izq ? 4 : 96;
  ['#FF6F61', '#F6B93B', '#2BB3A3', '#8E7CC3'].forEach((c, i) => o.push(`<circle cx="${cx}" cy="4" r="${22 - i * 3.6}" fill="none" stroke="${c}" stroke-width="3.6"/>`));
  const nx = izq ? 80 : 6; const ny = 128;
  o.push(`<g fill="#fff"><circle cx="${nx + 4}" cy="${ny + 3}" r="4"/><circle cx="${nx + 9}" cy="${ny}" r="5.4"/><circle cx="${nx + 14.5}" cy="${ny + 3}" r="4"/><rect x="${nx + 2}" y="${ny + 3}" width="15" height="4.2" rx="2.1"/></g>`);
  // Corazones, destellos y confeti por los márgenes (nunca en el centro, que es de las frases)
  for (let i = 0; i < 16; i++) {
    const lado = Math.floor(r() * 4);
    const x = lado === 0 ? entre(3, 11) : lado === 1 ? entre(89, 97) : entre(14, 86);
    const y = lado === 2 ? entre(3, 11) : lado === 3 ? entre(130, 138) : entre(26, 120);
    const t = entre(2.2, 4.6); const c = TONOS[Math.floor(r() * TONOS.length)];
    const tipo = r();
    if (tipo < 0.45) o.push(`<path d="${CORAZON}" fill="${c}" transform="translate(${n1(x)} ${n1(y)}) rotate(${n1(entre(-25, 25))}) scale(${n1(t)})"/>`);
    else if (tipo < 0.8) o.push(`<path d="${DESTELLO}" fill="${c}" transform="translate(${n1(x)} ${n1(y)}) scale(${n1(t)})"/>`);
    else o.push(`<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(t / 3.5)}" fill="${c}"/>`);
  }
  return `<svg class="dibujitos" aria-hidden="true" viewBox="0 0 100 141.4">${o.join('')}</svg>`;
}

function cuerpoTierno(cuadro, frases, modo) {
  const n = frases.length;
  const lista = n >= LISTA_DESDE;
  const alto = ((lista ? 104 : 92) - (n - 1) * (lista ? 1.6 : 6)) / n - (modo === 'ninguno' ? 0 : lista ? 2.6 : 4);
  const items = frases.map((f, i) => {
    const { s, lineas } = ajustarTitular(String(f.texto).trim(), { ancho: lista ? 74 : 70, alto, car: 0.6, interlinea: 1.18, max: n === 1 ? 17 : 12, min: 2.2 });
    const autor = autorVisible(f.autor, modo);
    const lin = lineas.map((l, j) => `<span class="l l${(i + j) % 2}" style="color: ${TONOS[(i * 2 + j) % TONOS.length]}">${esc(l)}</span>`).join('');
    return `${i && !lista ? `<li class="mini" aria-hidden="true"><svg viewBox="0 0 1 1"><path d="${CORAZON}"/></svg></li>` : ''}<li class="b"><p class="tit" style="font-size: calc(var(--k) * ${s}rem)">${lin}</p>${autor ? `<span class="aut">— ${esc(autor)}</span>` : ''}</li>`;
  }).join('');
  const cinta = [cuadro.titulo, cuadro.pie].filter(Boolean).map(esc).join(' · ');
  return {
    css: `
      .cuadro { background: #FFF3E4; color: #2B2D5B; }
      .dibujitos { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 0; }
      .frases, footer { position: relative; z-index: 1; }
      .marco { padding: ${lista ? '13rem 13rem 9rem' : '17rem 15rem 12rem'}; align-items: center; }
      .frases { margin: 0; width: 100%; align-items: center; }
      .tit { margin: 0; line-height: 1.18; }
      .l { display: block; width: max-content; margin: 0 auto; white-space: nowrap; }
      .l0 { font-family: 'Pacifico', ${EMOJIS}, cursive; }
      .l1 { font-family: 'Fredoka', ${EMOJIS}, sans-serif; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; font-size: .78em; }
      .aut { display: block; margin-top: ${lista ? 0.2 : 1}rem; font: 500 ${lista ? 1.9 : 2.6}rem 'Fredoka', sans-serif; color: #F0668A; }
      .mini svg { width: 3rem; height: 3rem; fill: #FF9EB5; display: block; margin: 0 auto; }
      footer { margin-top: 3rem; padding: 1.2rem 4rem; border-radius: 99rem; background: #2B2D5B; color: #FFF3E4; font: 500 2.3rem 'Fredoka', sans-serif; letter-spacing: .12em; text-transform: uppercase; }`,
    html: `${dibujitos(cuadro.semilla || `${cuadro.titulo}|${n}`)}<ul class="frases" data-var="k" style="--k: 1">${items}</ul>${cinta ? `<footer>${cinta}</footer>` : ''}`,
  };
}

export const ESTILOS = {
  // El orden de aquí es el orden en que se ofrecen (Maria, 27-11-2026: primero Tipográfico)
  tipografico: { nombre: 'Tipográfico', fuentes: ['Archivo:wght@500;900'], letras: ['900 20px Archivo', '500 20px Archivo'], cuerpo: cuerpoTipografico },
  moderno: { nombre: 'Moderno', fuentes: ['Jost:wght@400;500'], letras: ['500 20px Jost', '400 20px Jost'], cuerpo: cuerpoModerno },
  tierno: { nombre: 'Tierno', fuentes: ['Pacifico', 'Fredoka:wght@500;700'], letras: ['400 20px Pacifico', '700 20px Fredoka', '500 20px Fredoka'], cuerpo: cuerpoTierno },
};
