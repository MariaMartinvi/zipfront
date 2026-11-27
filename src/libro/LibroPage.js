// "Tu chat en un libro": propuesta automática + editor (capítulos on/off, quitar mensajes, portada,
// dedicatoria) + vista previa real + pedido. Todo en el navegador. Se paga ANTES de generar (Maria, 27-11-2026):
// al volver del pago (?pagado=…) el libro se recupera del navegador y se genera aquí. El PDF se descarga en el
// dispositivo; solo si es impreso se sube cifrado para la imprenta, y el servidor lo borra en cuanto ella lo tiene.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { parseChat, participantes } from './parser';
import { puntuar } from './scorer';
import { proponer, montar } from './propuesta';
import { renderHTML, PAGE, FONTS } from './render';
import { etiquetaImpreso, puedeImprimir, PAISES_IMPRESION_DEFECTO } from './precioLibro';
import { loadMediaIndex, imageUri, videoFrame, isScreenshot, videoSeconds, tienePersona, imageUriFromFile } from './media';
import { libroStore } from './store';
import LibroEntrada from './LibroEntrada';
import { paginasLibro } from './muestra';
import { trackEvent } from '../utils/analytics';
import { isSpainTimeZone, isMexicoTimeZone, isLatamTimeZone } from '../utils/pricing';
import './libro.css';

const API_URL = process.env.REACT_APP_API_URL || 'https://zipcd-backend-andand-gunicorn-app-app.onrender.com';
// Región como el resto de ChatSalsa (por zona horaria); el precio real lo decide el servidor.
function regionLibro() {
  let tz = '';
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { /* nada */ }
  if (isMexicoTimeZone(tz)) return 'mx';
  if (isLatamTimeZone(tz)) return 'latam';
  if (isSpainTimeZone(tz)) return 'es';
  if (/^America\//.test(tz) || /^(Pacific\/Honolulu|US\/)/.test(tz)) return 'us';
  return 'default';
}
const REGION = regionLibro();
const CLAVE_PAGADO = 'libro_pagado'; // pago hecho y libro aún sin generar (por si hay que volver a subir el chat)

function descargar(blob, nombre) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = nombre;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
const LABELS_DEFECTO = { libro: '29 €', pdf: '12,99 €' };
const COLORES = ['#2f3e46', '#5b3a4a', '#3a4a3f', '#1d1d1b', '#8c5a2b', '#2b4a6f'];

export default function LibroPage() {
  const navigate = useNavigate();
  const [estado, setEstado] = useState('cargando'); // cargando | listo | sinchat | error
  const [progreso, setProgreso] = useState('Leyendo el chat…');
  const [mensajes, setMensajes] = useState(null);
  const [caps, setCaps] = useState([]);
  const [quitados, setQuitados] = useState(() => new Set());
  const [titulo, setTitulo] = useState('');
  const [subtitulo, setSubtitulo] = useState('');
  const [dedicatoria, setDedicatoria] = useState('');
  const [color, setColor] = useState(COLORES[0]);
  const [portadaFoto, setPortadaFoto] = useState(null);
  const [derecha, setDerecha] = useState(null);
  const [conPersonajes, setConPersonajes] = useState(true);
  const [media, setMedia] = useState({});
  const [videos, setVideos] = useState({});
  const [fotosChat, setFotosChat] = useState([]);
  const [pidiendo, setPidiendo] = useState(false);
  const [cargandoFotos, setCargandoFotos] = useState('');
  const [paginasReales, setPaginasReales] = useState(0);
  const [paginasImprenta, setPaginasImprenta] = useState(0);
  const [tramos, setTramos] = useState(null);
  const [paises, setPaises] = useState(PAISES_IMPRESION_DEFECTO);
  const [enviarIgual, setEnviarIgual] = useState(false);  // vive en un país donde imprimimos aunque su zona horaria no lo diga
  const [precios, setPrecios] = useState(LABELS_DEFECTO);
  const [galeria, setGaleria] = useState(false);
  const [qrs] = useState({}); // vídeos con QR: apagados (no se guardan vídeos en el servidor)
  // Pago hecho: viene en la URL al volver de Stripe; si hubo que volver a subir el chat, se guardó en el navegador
  const [pagado] = useState(() => {
    const q = new URLSearchParams(window.location.search).get('pagado');
    try { if (q) localStorage.setItem(CLAVE_PAGADO, q); return q || localStorage.getItem(CLAVE_PAGADO) || ''; } catch (e) { return q || ''; }
  });
  const [compra, setCompra] = useState(null); // { fase: 'comprobando' | 'generando' | 'error', error }
  const [entrada, setEntrada] = useState(!pagado);  // primero, su libro (LibroEntrada); luego, el editor
  const renderListo = useRef(null); // promesa que se resuelve cuando la vista previa termina de paginar
  const cssRef = useRef('');
  const iframeRef = useRef(null);
  const idxRef = useRef(null);
  const retomado = useRef(false); // true si se ha retomado una edición guardada (no pisar su portada)

  // precios de la región (el servidor manda)
  useEffect(() => {
    fetch(`${API_URL}/api/book/config?region=${REGION}`).then(r => r.json()).then(c => { if (c && c.labels) setPrecios(c.labels); if (c && c.tramos) setTramos(c.tramos); if (c && c.countries) setPaises(c.countries); }).catch(() => {});
  }, []);

  // 1) cargar chat + media del store (lo deja App al subir el zip)
  useEffect(() => {
    (async () => {
      setProgreso('Leyendo el chat…');
      const { chatText, zip, fileName } = await libroStore.recuperar();  // memoria o, tras recargar, el guardado en el navegador
      if (!chatText) { setEstado('sinchat'); return; }
      const guardado = await libroStore.cargarEdicion();  // edición anterior de este mismo chat, si la hay
      try {
        // El chat que guarda la web está anonimizado (teléfonos → X), y eso rompe los nombres de archivo
        // de las fotos (IMG-20250402-WA0006.jpg). Para el libro leemos el texto original del zip;
        // no sale del navegador.
        let texto = chatText;
        try {
          const entrada = zip && Object.keys(zip.files).find(n => /(^|\/)_chat\.txt$/i.test(n)) || zip && Object.keys(zip.files).find(n => /\.txt$/i.test(n));
          if (entrada) texto = await zip.files[entrada].async('string');
        } catch (e) { console.warn('chat original', e); }
        const ms = parseChat(texto);
        if (ms.length < 30) { setEstado('error'); setProgreso('Este chat tiene muy pocos mensajes para un libro.'); return; }
        puntuar(ms);
        setProgreso('Eligiendo los mejores momentos…');
        const idx = await loadMediaIndex(zip); idxRef.current = idx;
        // penalizar memes y capturas antes de proponer
        // fotos y vídeos que no están en el zip (chat exportado sin archivos): no hay hueco que reservar
        for (const m of ms) if (m.esMedia && (!m.archivo || !idx.has(m.archivo))) m.sinArchivo = true;
        const conArchivo = ms.filter(m => m.archivo && idx.has(m.archivo));
        let nv = 0, ni = 0;
        for (const m of conArchivo) {
          if (m.tipo === 'video' && nv++ < 40) { const s = await videoSeconds(idx, m.archivo); if (s != null && s < 3) { m.videoCorto = true; m.score -= 4; } }
          else if (m.tipo === 'image' && ni++ < 400 && await isScreenshot(idx, m.archivo)) { m.captura = true; m.score -= 4; }
        }
        const props = proponer(ms);
        const parts = participantes(ms);
        const nombres = parts.map(p => p.nombre);
        setMensajes(ms);
        const y1 = ms[0].dia.slice(0, 4), y2 = ms.at(-1).dia.slice(0, 4);
        const g = guardado && guardado.fileName === fileName && guardado.nMensajes === ms.length ? guardado : null;
        if (g) {
          // retomar donde lo dejó: capítulos (encendidos y títulos), mensajes quitados, portada, dedicatoria…
          setCaps(props.map((c, i) => g.caps && g.caps[i] ? { ...c, on: g.caps[i].on, titulo: g.caps[i].titulo || c.titulo } : c));
          setQuitados(new Set(g.quitados || []));
          setTitulo(g.titulo || ''); setSubtitulo(g.subtitulo || ''); setDedicatoria(g.dedicatoria || '');
          if (g.color) setColor(g.color);
          if (g.portadaFoto && !String(g.portadaFoto).startsWith('portada:')) setPortadaFoto(g.portadaFoto);
          setDerecha(g.derecha || nombres[0]);
          setConPersonajes(g.conPersonajes !== false);
        } else {
          setCaps(props);
          setTitulo(nombres.length === 2 ? `${nombres[0]} & ${nombres[1]}` : (fileName || 'Nuestro chat').replace(/^Chat de WhatsApp con /i, '').replace(/\.zip$/i, ''));
          setSubtitulo(y1 === y2 ? y1 : `${y1} – ${y2}`);
          setDerecha(nombres.find(n => /^(tú|you|yo)$/i.test(n)) || nombres[0]);
        }
        retomado.current = !!g;
        if (g) setEntrada(false);  // ya lo estaba editando: directo al editor
        setEstado('listo');
        trackEvent('libro_creado');  // ha subido un chat y ve su libro en el editor
        // 2) cargar media en segundo plano: primero las fotos de los capítulos elegidos, luego
        //    unas cuantas más como candidatas a portada. Progresivo: la vista previa se va rellenando.
        const man = montar(ms, props);
        const ids = new Set(man.capitulos.flatMap(c => c.mensajes));
        const conMedia = ms.filter(m => m.archivo && idx.has(m.archivo));
        const cola = [...conMedia.filter(m => ids.has(m.id)), ...conMedia.filter(m => !ids.has(m.id) && m.tipo === 'image').slice(0, 60)];
        const imgs = {}, vids = {};
        let n = 0;
        for (const m of cola) {
          n++;
          if (n % 5 === 0) { setCargandoFotos(`${n}/${cola.length}`); setMedia({ ...imgs }); setVideos({ ...vids }); }
          try {
            if (m.tipo === 'image') { if (!imgs[m.archivo]) { const r = await imageUri(idx, m.archivo); if (r) imgs[m.archivo] = r; } }
            else if (m.tipo === 'video' && ids.has(m.id)) { const r = await videoFrame(idx, m.archivo); if (r) vids[m.archivo] = r; }
          } catch (e) { console.warn('media', m.archivo, e); }
        }
        setMedia(imgs); setVideos(vids); setCargandoFotos('');
        setFotosChat(Object.keys(imgs).filter(n => imgs[n].w >= 600).slice(0, 24));
        // portada por defecto: la primera foto del chat en la que sale una persona (y no es un pantallazo)
        for (const m of ms) {
          if (m.tipo !== 'image' || m.captura || !imgs[m.archivo] || imgs[m.archivo].w < 500) continue;
          if (retomado.current) break;
          if (await tienePersona(idx, m.archivo)) { setPortadaFoto(f => f || m.archivo); break; }
        }
      } catch (e) { console.error(e); setEstado('error'); setProgreso('No se ha podido leer el chat.'); }
    })();
  }, []);

  const man = useMemo(() => {
    if (!mensajes) return null;
    const m = montar(mensajes, caps, { quitados });
    return { ...m, titulo, subtitulo, dedicatoria, portada: { color, foto: portadaFoto } };
  }, [mensajes, caps, quitados, titulo, subtitulo, dedicatoria, color, portadaFoto]);

  // La entrada: portada y los 3 primeros capítulos encendidos, con la misma plantilla que el libro impreso
  const libroEntrada = useMemo(() => {
    if (!man || !entrada) return null;
    const { css, body } = renderHTML(mensajes, man, { media, videos, derecha, conIndice: false, conPersonajes: false, conStats: false });
    const ks = man.capitulos.map((c, k) => (c.on ? k : -1)).filter(k => k >= 0).slice(0, 3);
    return ks.length ? paginasLibro(css, body, ks) : null;
  }, [man, entrada, mensajes, media, videos, derecha]);

  const encendidos = caps.filter(c => c.on).length;
  const paginas = paginasReales || (man ? man.paginasTotales : 0);
  const imprime = enviarIgual || puedeImprimir(paises);
  // Chat exportado sin medios (lo normal si viene del análisis): ningún mensaje trae su foto
  const sinFotos = !!mensajes && !mensajes.some(m => m.tipo === 'image' && m.archivo);
  const demasiadas = paginas > 200, pocas = encendidos === 0;

  // vista previa en iframe: mismo HTML que el PDF, y las páginas se parten de verdad midiendo en el navegador
  useEffect(() => {
    if (!man || !iframeRef.current) return;
    const { css, body } = renderHTML(mensajes, man, { media, videos, qrs, derecha, conPersonajes, preview: true });
    cssRef.current = css;
    const doc = iframeRef.current.contentDocument;
    const W = PAGE.w + 2 * PAGE.bleed, H = PAGE.h + 2 * PAGE.bleed;
    const zoom = zoomPara(iframeRef.current, W);
    const x = Math.round(20 / zoom);  // la × mide siempre ~20 px en pantalla, también con las páginas encogidas (móvil)
    doc.open();
    doc.write(`<!doctype html><html><head><meta charset="utf-8">${FONTS}<style>${css}
      body{background:#ecebe7;padding:18px;display:grid;grid-template-columns:repeat(2,${W}mm);gap:6px 10px;justify-content:center;zoom:${zoom}}
      body::before{content:'';display:block} /* la portada va a la derecha, como en un libro */
      section{width:${W}mm;height:${H}mm;min-height:0;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,.12);margin:0;break-after:auto}
      section.hidden{display:none}
      .msg .x{position:absolute;top:${-x / 3}px;width:${x}px;height:${x}px;border-radius:50%;background:#b3261e;color:#fff;font:${Math.round(x * 0.65)}px/${x}px sans-serif;text-align:center;cursor:pointer;z-index:2;display:none}
      .msg.l .x{right:${-x / 2.5}px}.msg.r .x{left:${-x / 2.5}px}
      .msg{cursor:pointer}.msg.sel .x{display:block}.msg.sel .bubble{outline:${Math.max(2, Math.round(2 / zoom))}px solid #b3261e88}
      @media (hover:hover){.msg:hover .x{display:block}.msg:hover .bubble{outline:${Math.max(2, Math.round(2 / zoom))}px solid #b3261e88}}
    </style></head><body>${body}</body></html>`);
    doc.close();
    const caps0 = caps;
    let cancelado = false;
    const acabar = () => {
      if (cancelado) return;
      paginar(doc);
      doc.querySelectorAll('[data-cap]').forEach(el => el.classList.toggle('hidden', !caps0[+el.dataset.cap]?.on));
      doc.querySelectorAll('.msg').forEach(el => {
        const x = doc.createElement('div'); x.className = 'x'; x.textContent = '×'; x.title = 'Quitar del libro';
        x.onclick = e => { e.stopPropagation(); setQuitados(q => new Set([...q, +el.dataset.id])); };
        el.appendChild(x);
        // en el móvil no hay "pasar el ratón": tocar un mensaje lo marca y enseña su ×
        el.onclick = () => { doc.querySelectorAll('.msg.sel').forEach(o => o !== el && o.classList.remove('sel')); el.classList.toggle('sel'); };
      });
      setPaginasReales(contarPaginas(doc));
      setPaginasImprenta(contarInteriores(doc));
      if (renderListo.current) { renderListo.current(); renderListo.current = null; }
    };
    // esperar a las fuentes (si tardan más de 2 s, paginamos igual)
    Promise.race([doc.fonts ? doc.fonts.ready : Promise.resolve(), new Promise(r => setTimeout(r, 2000))]).then(acabar);
    return () => { cancelado = true; };
  }, [man, mensajes, media, videos, qrs, derecha, conPersonajes, caps, entrada]);

  async function subirPortada(e) {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    try {
      const r = await imageUriFromFile(f);
      const key = 'portada:' + f.name;
      setMedia(m => ({ ...m, [key]: r }));
      setFotosChat(fs => fs.includes(key) ? fs : [key, ...fs]);
      setPortadaFoto(key);
    } catch (err) { alert('No se ha podido leer la imagen'); }
    e.target.value = '';
  }

  // Guardar la edición en el navegador cada vez que cambia algo (con medio segundo de margen)
  const guardarEdicion = () => {
    const { fileName } = libroStore.get();
    return libroStore.guardarEdicion({ fileName, nMensajes: mensajes.length, caps: caps.map(c => ({ on: c.on, titulo: c.titulo })),
      quitados: [...quitados], titulo, subtitulo, dedicatoria, color, portadaFoto, derecha, conPersonajes });
  };
  useEffect(() => {
    if (estado !== 'listo' || !mensajes) return undefined;
    const t = setTimeout(guardarEdicion, 500);
    return () => clearTimeout(t);
  }, [estado, mensajes, caps, quitados, titulo, subtitulo, dedicatoria, color, portadaFoto, derecha, conPersonajes]); // eslint-disable-line react-hooks/exhaustive-deps

  async function borrarLibro() {
    if (!window.confirm('¿Borrar este libro y el chat guardado en este navegador?')) return;
    await libroStore.borrar();
    navigate('/libro-recuerdo');
  }

  const toggle = k => setCaps(cs => cs.map((c, i) => i === k ? { ...c, on: !c.on } : c));
  const renombrar = (k, t) => setCaps(cs => cs.map((c, i) => i === k ? { ...c, titulo: t } : c));
  const deshacer = () => setQuitados(new Set());

  // El PDF se hace con exactamente lo que se ve: las páginas ya partidas en la vista previa.
  async function generarPDFSimple(marcaDeAgua = false) {
    setProgreso('Generando el PDF…');
    const doc = iframeRef.current?.contentDocument;
    if (!doc || !doc.body) throw new Error('La vista previa aún no está lista');
    const body = doc.body.cloneNode(true);
    body.querySelectorAll('.x, section.hidden').forEach(el => el.remove());
    // fotos que no se pudieron leer: fuera (la burbuja entera si no tenía texto)
    body.querySelectorAll('.media.missing').forEach(el => { const msg = el.closest('.msg'); if (msg && !msg.querySelector('.txt')) msg.remove(); else el.remove(); });
    const back = body.querySelector('section.back');
    if (marcaDeAgua) {
      // muestra: solo las 8 primeras páginas (portada, personajes, índice y el arranque del primer capítulo)
      [...body.querySelectorAll('section')].forEach((sec, i) => { if (i >= 8 && sec !== back) sec.remove(); });
    }
    // número par de páginas y mínimo de 28 (imprenta): rellenamos con blancas antes de la contraportada
    let n = body.querySelectorAll('section').length;
    while (!marcaDeAgua && (n < 28 || n % 2)) { const b = doc.createElement('section'); b.className = 'blank'; body.insertBefore(b, back); n++; }
    const H = PAGE.h + 2 * PAGE.bleed;
    const marca = marcaDeAgua ? `section::after{content:'chatsalsa.com · vista previa';position:absolute;left:0;right:0;top:50%;transform:rotate(-30deg);text-align:center;font-family:'Poppins',sans-serif;font-size:22pt;font-weight:600;letter-spacing:.1em;color:rgba(0,0,0,.13);pointer-events:none;z-index:9}
      section.cover::after,section.back::after{color:rgba(255,255,255,.22)}` : '';
    const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${(titulo || 'libro').replace(/[<>&]/g, '')}</title>${FONTS}<style>${cssRef.current}
      section{height:${H}mm;min-height:${H}mm;overflow:hidden}${marca}</style></head><body>${body.innerHTML}</body></html>`;
    const r = await fetch(`${API_URL}/api/book/pdf`, { method: 'POST', headers: { 'Content-Type': 'text/html' }, body: html });
    if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'No se pudo generar el PDF');
    return r.blob();
  }

  // PDF para imprenta, como lo pide Gelato para fotolibros: un PDF con
  //   pág. 1  = pliego de cubierta (trasera + lomo + delantera), medido por Gelato según las páginas
  //   pág. 2  = guarda en blanco
  //   pág. 3… = N páginas interiores (N par, mínimo 30)
  //   última  = guarda en blanco
  // y pageCount = N. Devuelve { blob, pageCount }.
  async function generarPDF(marcaDeAgua = false) {
    if (marcaDeAgua) return { blob: await generarPDFSimple(true), pageCount: 0 };
    setProgreso('Generando el PDF…');
    const doc = iframeRef.current?.contentDocument;
    if (!doc || !doc.body) throw new Error('La vista previa aún no está lista');
    const body = doc.body.cloneNode(true);
    body.querySelectorAll('.x, section.hidden').forEach(el => el.remove());
    body.querySelectorAll('.media.missing').forEach(el => { const msg = el.closest('.msg'); if (msg && !msg.querySelector('.txt')) msg.remove(); else el.remove(); });
    const portada = body.querySelector('section.cover');
    const contra = body.querySelector('section.back');
    const secciones = [...body.querySelectorAll('section')].filter(sc => sc !== portada && sc !== contra);
    if (secciones[0] && secciones[0].classList.contains('blank')) secciones.shift(); // la guarda la ponemos nosotros
    const blanca = () => '<section class="blank"></section>';
    const interiores = secciones.map(sc => sc.outerHTML);
    while (interiores.length < 30 || interiores.length % 2) interiores.push(blanca());
    if (interiores.length > 200) throw new Error(`El libro tiene ${interiores.length} páginas; el máximo es 200. Apaga algún capítulo.`);
    const N = interiores.length;
    const P = PAGE.h + 2 * PAGE.bleed;
    const interiorHTML = `<!doctype html><html lang="es"><head><meta charset="utf-8">${FONTS}<style>${cssRef.current}
      section{height:${P}mm;min-height:${P}mm;overflow:hidden}</style></head><body>${blanca()}${interiores.join('')}${blanca()}</body></html>`;

    setProgreso('Midiendo la cubierta…');
    const rc = await fetch(`${API_URL}/api/book/cubierta?paginas=${N}`);
    const dim = await rc.json().catch(() => ({}));
    if (!rc.ok || !dim.W) throw new Error('No se pudieron obtener las medidas de la cubierta');
    const a = dim.areas || {};
    const area = (...keys) => { for (const k of keys) if (a[k]) return a[k]; return null; };
    const front = area('contentFrontSize', 'frontSize', 'front') || { left: dim.W / 2, top: 0, width: dim.W / 2, height: dim.H };
    const backA = area('contentBackSize', 'backSize', 'back') || { left: 0, top: 0, width: dim.W / 2, height: dim.H };
    const spine = area('spineSize', 'spine') || { left: backA.left + backA.width, top: 0, width: Math.max(0, front.left - backA.left - backA.width), height: dim.H };
    const color = man?.portada?.color || '#2f3e46';
    const fotoUri = man?.portada?.foto && media[man.portada.foto] ? media[man.portada.foto].uri : null;
    const esc = t => String(t || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const box = r => `left:${r.left}mm;top:${r.top}mm;width:${r.width}mm;height:${r.height}mm`;
    // el sangrado lo cubre el fondo de color de toda la hoja
    const cubiertaHTML = `<!doctype html><html lang="es"><head><meta charset="utf-8">${FONTS}<style>
      @page { size: ${dim.W}mm ${dim.H}mm; margin: 0; } html,body{margin:0;padding:0}
      .hoja{position:relative;width:${dim.W}mm;height:${dim.H}mm;background:${esc(color)};overflow:hidden;font-family:'Lora',Georgia,serif;color:#fff}
      .area{position:absolute;overflow:hidden}
      .front .photo{position:absolute;inset:0;background-size:cover;background-position:center;opacity:.6}
      .front .txt{position:absolute;left:12mm;right:12mm;bottom:16mm}
      .front h1{font-size:30pt;line-height:1.08;margin:0 0 4mm;font-weight:600}
      .front .sub{font-family:'Poppins',sans-serif;font-weight:300;font-size:10pt;letter-spacing:.1em;text-transform:uppercase}
      .spine{display:flex;align-items:center;justify-content:center}
      .spine span{transform:rotate(90deg);white-space:nowrap;font-family:'Poppins',sans-serif;font-size:${Math.min(9, Math.max(5, spine.width * 0.6))}pt;letter-spacing:.06em}
      .back{display:flex;align-items:flex-end;justify-content:center}
      .back span{margin-bottom:14mm;font-family:'Poppins',sans-serif;font-weight:300;font-size:8pt;letter-spacing:.14em;text-transform:uppercase;opacity:.85}
    </style></head><body><div class="hoja">
      <div class="area back" style="${box(backA)}"><span>chatsalsa.com</span></div>
      <div class="area spine" style="${box(spine)}">${spine.width >= 6 ? `<span>${esc(titulo)}</span>` : ''}</div>
      <div class="area front" style="${box(front)}">${fotoUri ? `<div class="photo" style="background-image:url('${fotoUri}')"></div>` : ''}
        <div class="txt"><h1>${esc(titulo)}</h1><div class="sub">${esc(subtitulo)}</div></div></div>
    </div></body></html>`;

    setProgreso('Generando el PDF…');
    const r = await fetch(`${API_URL}/api/book/pdf-libro`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cubierta: cubiertaHTML, interior: interiorHTML }) });
    if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'No se pudo generar el PDF');
    return { blob: await r.blob(), pageCount: N };
  }

  // PDF de muestra: gratis, con marca de agua en cada página, sin subir nada al servidor.
  async function muestra() {
    if (pidiendo || pocas) return;
    setPidiendo(true);
    try {
      const pdf = (await generarPDF(true)).blob;
      const url = URL.createObjectURL(pdf); const a = document.createElement('a'); a.href = url; a.download = `${(titulo || 'libro').replace(/[^\w&\- ]/g, '')} - muestra.pdf`; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (e) { alert(e.message); }
    setPidiendo(false);
  }

  // Pedir: primero se paga, sin generar ni subir nada. La edición ya está guardada en este navegador; al volver
  // del pago (?pagado=…) se genera el libro aquí mismo (efecto de abajo).
  async function pedir(product = 'libro') {
    if (pidiendo || demasiadas || pocas) return;
    if (product === 'pdf') trackEvent('libro_pago_pdf'); else trackEvent('libro_pago_impreso');  // pulsa el botón de pagar
    setPidiendo(true); setProgreso('Abriendo el pago…');
    try {
      await guardarEdicion();
      const pageCount = product === 'pdf' ? paginas : paginasImprenta; // con las páginas que se cobran
      const ck = await fetch(`${API_URL}/api/book/checkout`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageCount, titulo, product, region: REGION }) });
      const c = await ck.json().catch(() => ({}));
      if (!ck.ok || !c.url) throw new Error(c.error || 'No se pudo iniciar el pago');
      window.location.assign(c.url);
      return; // salimos de la página
    } catch (e) { alert(e.message); }
    setPidiendo(false);
  }

  // Vuelta del pago: comprobar el pago y generar el libro con el libro recuperado del navegador.
  //  - PDF: se descarga en el dispositivo y no sale de aquí.
  //  - Impreso: se descarga su copia y se sube cifrado para la imprenta (el servidor lo borra en cuanto ella lo tiene).
  async function terminarCompra() {
    setCompra({ fase: 'comprobando' });
    try {
      const r = await fetch(`${API_URL}/api/book/estado?session_id=${encodeURIComponent(pagado)}`);
      const d = await r.json().catch(() => ({}));
      if (r.status === 402) { setTimeout(terminarCompra, 2000); return; } // Stripe aún no ha marcado el pago
      if (!r.ok) throw new Error(d.error || 'No hemos podido comprobar el pago.');
      if (d.orderId) { try { localStorage.removeItem(CLAVE_PAGADO); } catch (e) { /* nada */ } navigate(`/libro/pedido?session_id=${encodeURIComponent(pagado)}`); return; }
      const nombre = `${(titulo || 'libro').replace(/[^\w&\- áéíóúñÁÉÍÓÚÑ]/g, '')}.pdf`;
      if (d.product === 'pdf') {
        setCompra({ fase: 'generando' }); setProgreso('Generando tu libro…');
        descargar(await generarPDFSimple(false), nombre);
      } else {
        if (paginasImprenta !== d.pageCount) {
          throw new Error(`El libro tiene ahora ${paginasImprenta} páginas y el pago fue para ${d.pageCount}. Déjalo como estaba (enciende o apaga capítulos) y pulsa «Terminar el pedido».`);
        }
        setCompra({ fase: 'generando' });
        const { blob, pageCount } = await generarPDF();
        descargar(blob, nombre);  // su copia, en su dispositivo
        setProgreso('Enviando el libro a la imprenta…');
        const fd = new FormData(); fd.append('session_id', pagado); fd.append('pageCount', String(pageCount)); fd.append('file', blob, 'libro.pdf');
        const up = await fetch(`${API_URL}/api/book/pedido`, { method: 'POST', body: fd });
        const u = await up.json().catch(() => ({}));
        if (!up.ok) throw new Error(u.error || 'No hemos podido mandar el libro a la imprenta.');
      }
      try { localStorage.removeItem(CLAVE_PAGADO); } catch (e) { /* nada */ }
      navigate(`/libro/pedido?session_id=${encodeURIComponent(pagado)}${d.product === 'pdf' ? '&descargado=1' : ''}`);
    } catch (e) { setCompra({ fase: 'error', error: e.message }); }
  }
  useEffect(() => {
    // espera a que el libro esté montado y la vista previa paginada
    if (!pagado || compra || estado !== 'listo' || !paginasImprenta) return;
    terminarCompra();
  }, [pagado, compra, estado, paginasImprenta]); // eslint-disable-line react-hooks/exhaustive-deps

  if (pagado && estado === 'sinchat') return (
    <div className="libro-empty"><h2>Pago recibido</h2>
      <p>Para terminar tu libro, sube el mismo chat en este dispositivo (exportado con archivos). Por privacidad, tu libro no se guarda en nuestros servidores, así que se crea aquí.</p>
      <button onClick={() => navigate('/libro-recuerdo')}>Subir el chat</button></div>
  );
  if (estado === 'sinchat') return <div className="libro-empty"><h2>Tu chat en un libro</h2><p>Sube tu chat (exportado con archivos) y verás tu libro al momento.</p><button onClick={() => navigate('/libro-recuerdo')}>Subir el chat</button></div>;
  if (estado === 'error') return <div className="libro-empty"><h2>Tu chat en un libro</h2><p>{progreso}</p><button onClick={() => navigate('/')}>Volver</button></div>;
  if (estado === 'cargando') return <div className="libro-empty"><h2>Montando tu libro…</h2><p>{progreso}</p><div className="libro-spinner" /></div>;

  const autores = participantes(mensajes).map(p => p.nombre);
  if (entrada && libroEntrada) {
    const primero = caps.find(c => c.on);
    return (
      <LibroEntrada libro={libroEntrada} titulo={titulo || 'Vuestro libro'} paginas={paginasReales ? paginas : `unas ${Math.max(10, Math.round(paginas / 10) * 10)}`} capitulos={encendidos}
        desde={primero && primero.desde} sinFotos={sinFotos} precioPdf={precios.pdf}
        onAbrir={() => trackEvent('libro_abierto')}
        onEditar={() => { trackEvent('libro_editor'); setEntrada(false); window.scrollTo(0, 0); }}
        onSubir={() => navigate('/libro-recuerdo')} />
    );
  }
  return (
    <div className="libro">
      <div className="libro-top">
        <h1>{titulo || 'Tu libro'} <small>· vista previa</small></h1>
        {quitados.size > 0 && <button className="pill ghost" onClick={deshacer}>Deshacer ({quitados.size})</button>}
        {cargandoFotos && <span className="pill ghost">Cargando fotos {cargandoFotos}</span>}
        <span className={`pill ${demasiadas ? 'warn' : ''}`}>{paginas} páginas</span>
        <button className="pill ghost" disabled={pidiendo || pocas} onClick={muestra} title="Las 8 primeras páginas en PDF, con marca de agua, para ver la calidad">PDF de muestra</button>
        {imprime ? <>
          <button className="pill ghost" disabled={pidiendo || demasiadas || pocas} onClick={() => pedir('pdf')} title="Descarga inmediata del libro en PDF, sin marca de agua">{`Solo PDF · ${precios.pdf}`}</button>
          <button className="pill go" disabled={pidiendo || demasiadas || pocas} onClick={() => pedir('libro')}>{pidiendo ? progreso : `Pedir libro impreso · ${etiquetaImpreso(precios, tramos, paginasImprenta)} · PDF incluido`}</button>
        </> : <>
          <button className="pill go" disabled={pidiendo || demasiadas || pocas} onClick={() => pedir('pdf')} title="Descarga inmediata del libro en PDF, sin marca de agua">{pidiendo ? progreso : `Descargar el libro en PDF · ${precios.pdf}`}</button>
          <button className="pill ghost" onClick={() => setEnviarIgual(true)} title={`El libro impreso se envía a: ${paises.join(', ')}`}>Pedirlo impreso (solo España, PT, FR, IT, DE, UK y EE. UU.)</button>
        </>}
      </div>
      <div className="libro-wrap">
        <div className="libro-vista">
          {pagado && compra && (
            <div className={`libro-compra ${compra.fase === 'error' ? 'error' : ''}`} role={compra.fase === 'error' ? 'alert' : 'status'}>
              {compra.fase === 'error'
                ? <><b>No hemos podido terminar tu libro.</b> {compra.error} <button className="pill go" onClick={() => setCompra(null)}>Terminar el pedido</button></>
                : <><b>Pago recibido.</b> {compra.fase === 'comprobando' ? 'Comprobando el pago…' : progreso || 'Generando tu libro…'} No cierres la página.</>}
            </div>
          )}
          <p className="libro-aviso">✏️ Toca un mensaje para quitarlo · en el panel, capítulos, título, portada y dedicatoria{sinFotos && <> · 📸 ¿Con fotos? Exporta el chat con archivos y <button type="button" onClick={() => navigate('/libro-recuerdo')}>súbelo aquí</button></>}</p>
          <iframe ref={iframeRef} title="libro" className="libro-pages" />
        </div>
        <aside className="libro-side">
          <h2>Portada</h2>
          <input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Título" />
          <input value={subtitulo} onChange={e => setSubtitulo(e.target.value)} placeholder="Subtítulo" />
          <div className="colores">{COLORES.map(c => <button key={c} style={{ background: c }} className={c === color ? 'on' : ''} onClick={() => setColor(c)} aria-label={c} />)}</div>
          <div className="portada-btns">
            <button className={!portadaFoto ? 'on' : ''} onClick={() => setPortadaFoto(null)}>Sin foto</button>
            {fotosChat.length > 0 && <button className={galeria ? 'on' : ''} onClick={() => setGaleria(g => !g)}>{galeria ? 'Cerrar galería' : 'Elegir del chat'}</button>}
            <label className="portada-subir">Subir foto<input type="file" accept="image/*" onChange={subirPortada} /></label>
          </div>
          {portadaFoto && media[portadaFoto] && <img className="portada-elegida" src={media[portadaFoto].uri} alt="Portada" />}
          {galeria && <div className="fotos">
            {fotosChat.map(n => <img key={n} src={media[n].uri} alt="" className={n === portadaFoto ? 'on' : ''} onClick={() => setPortadaFoto(n)} />)}
            <label className="subir" title="Subir una foto de tu ordenador">+<span>Subir</span>
              <input type="file" accept="image/*" onChange={subirPortada} /></label>
          </div>}
          <h2>Dedicatoria</h2>
          <textarea value={dedicatoria} onChange={e => setDedicatoria(e.target.value.slice(0, 300))} placeholder="Opcional. Para quien es este libro…" rows={3} />
          {autores.length === 2 && <><h2>A la derecha</h2><div className="derecha">{autores.map(a => <button key={a} className={a === derecha ? 'on' : ''} onClick={() => setDerecha(a)}>{a}</button>)}</div></>}
          <p className="libro-guardado">💾 Se guarda solo en este navegador. Puedes cerrar y seguir luego.</p>
          <h2>Páginas</h2>
          <div className={`cap ${conPersonajes ? '' : 'off'}`}>
            <div className={`sw ${conPersonajes ? 'on' : ''}`} onClick={() => setConPersonajes(v => !v)} role="switch" aria-checked={conPersonajes} />
            <div className="t"><b>Los personajes</b><span>Quién es quién en el chat</span></div>
          </div>
          <h2>Capítulos</h2>
          {caps.map((c, k) => (
            <div key={k} className={`cap ${c.on ? '' : 'off'}`}>
              <div className={`sw ${c.on ? 'on' : ''}`} onClick={() => toggle(k)} role="switch" aria-checked={c.on} />
              <div className="t"><input value={c.titulo} onChange={e => renombrar(k, e.target.value)} /><span>{c.desde} → {c.hasta} · {man.capitulos[k].paginas} pág · {man.capitulos[k].fotos} fotos</span></div>
            </div>))}
          <p className="hint">{demasiadas ? 'Más de 200 páginas: apaga algún capítulo.' : pocas ? 'Enciende al menos un capítulo.' : 'Toca un mensaje y pulsa la × para quitarlo. Nada se guarda en nuestros servidores.'}</p>
          <button className="libro-borrar" onClick={borrarLibro}>Borrar mi libro de este navegador</button>
        </aside>
      </div>
    </div>
  );
}

// Parte cada capítulo (y la página de personajes, que en chats de grupo no cabe en una) en páginas de verdad:
// va metiendo elementos en una sección de altura fija y, cuando se desborda, pasa el último (y su cabecera de
// día, si quedó sola) a una sección nueva.
function paginar(doc) {
  for (const body of [...doc.querySelectorAll('section.chapter-body, section.people')]) {
    const kids = [...body.children];
    const nueva = () => { const s = doc.createElement('section'); s.className = body.className; if (body.dataset.cap) s.dataset.cap = body.dataset.cap; body.parentNode.insertBefore(s, body); return s; };
    let cur = nueva();
    for (const k of kids) {
      cur.appendChild(k);
      if (cur.scrollHeight > cur.clientHeight + 1 && cur.children.length > 1) {
        const prev = k.previousElementSibling;
        const nx = nueva();
        if (prev && prev.classList.contains('day') && cur.children.length > 2) nx.appendChild(prev);
        nx.appendChild(k); cur = nx;
      }
    }
    if (!cur.children.length) cur.remove();
    body.remove();
  }
}

// Páginas interiores que se mandan a imprimir (sin portada, contraportada ni la blanca del principio), como
// en generarPDF: mínimo 30 y número par. Es lo que cobra el servidor por tramos.
function contarInteriores(doc) {
  const secs = [...doc.querySelectorAll('section')].filter(s => !s.classList.contains('hidden') && !s.classList.contains('cover') && !s.classList.contains('back'));
  let n = secs.length - (secs[0] && secs[0].classList.contains('blank') ? 1 : 0);
  while (n < 30 || n % 2) n++;
  return n;
}

function contarPaginas(doc) {
  let n = [...doc.querySelectorAll('section')].filter(s => !s.classList.contains('hidden')).length;
  if (n < 28) n = 28;
  return n % 2 ? n + 1 : n;
}

// Zoom para que quepan dos páginas (una doble) en el ancho del iframe.
function zoomPara(iframe, Wmm) {
  const px = Wmm * 96 / 25.4;
  const ancho = (iframe && iframe.clientWidth) || 1000;
  return Math.max(0.3, Math.min(1, (ancho - 60) / (2 * px + 10))).toFixed(3);
}
