// "Tu chat en un libro": propuesta automática + editor (capítulos on/off, quitar mensajes, portada,
// dedicatoria) + vista previa real + pedido. Todo en el navegador; al servidor solo va el HTML del libro
// para imprimirlo (sin guardarlo) y el PDF cifrado para Gelato.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { parseChat, participantes } from './parser';
import { puntuar } from './scorer';
import { proponer, montar } from './propuesta';
import { renderHTML, PAGE } from './render';
import { loadMediaIndex, imageUri, videoFrame, isScreenshot, videoSeconds } from './media';
import { libroStore } from './store';
import './libro.css';

const API_URL = process.env.REACT_APP_API_URL || 'https://zipcd-backend-andand-gunicorn-app-app.onrender.com';
const PRECIO = 39;
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
  const [media, setMedia] = useState({});
  const [videos, setVideos] = useState({});
  const [fotosChat, setFotosChat] = useState([]);
  const [pidiendo, setPidiendo] = useState(false);
  const iframeRef = useRef(null);
  const idxRef = useRef(null);

  // 1) cargar chat + media del store (lo deja App al subir el zip)
  useEffect(() => {
    (async () => {
      const { chatText, zip, fileName } = libroStore.get();
      if (!chatText) { setEstado('sinchat'); return; }
      try {
        const ms = parseChat(chatText);
        if (ms.length < 30) { setEstado('error'); setProgreso('Este chat tiene muy pocos mensajes para un libro.'); return; }
        puntuar(ms);
        setProgreso('Eligiendo los mejores momentos…');
        const idx = await loadMediaIndex(zip); idxRef.current = idx;
        // penalizar memes y capturas antes de proponer
        const conArchivo = ms.filter(m => m.archivo && idx.has(m.archivo));
        for (const m of conArchivo.slice(0, 400)) {
          if (m.tipo === 'video') { const s = await videoSeconds(idx, m.archivo); if (s != null && s < 3) m.score -= 4; }
          else if (m.tipo === 'image' && await isScreenshot(idx, m.archivo)) m.score -= 4;
        }
        const props = proponer(ms);
        const parts = participantes(ms);
        const nombres = parts.map(p => p.nombre);
        setMensajes(ms); setCaps(props);
        setTitulo(nombres.length === 2 ? `${nombres[0]} & ${nombres[1]}` : (fileName || 'Nuestro chat').replace(/^Chat de WhatsApp con /i, '').replace(/\.zip$/i, ''));
        const y1 = ms[0].dia.slice(0, 4), y2 = ms.at(-1).dia.slice(0, 4);
        setSubtitulo(y1 === y2 ? y1 : `${y1} – ${y2}`);
        setDerecha(nombres.find(n => /^(tú|you|yo)$/i.test(n)) || nombres[0]);
        setEstado('listo');
        // 2) cargar media de los mensajes elegidos en segundo plano
        setProgreso('Preparando fotos…');
        const man = montar(ms, props);
        const ids = new Set(man.capitulos.flatMap(c => c.mensajes));
        const imgs = {}, vids = {};
        for (const m of ms) {
          if (!m.archivo || !idx.has(m.archivo)) continue;
          if (m.tipo === 'image') { const r = await imageUri(idx, m.archivo); if (r) imgs[m.archivo] = r; }
          else if (m.tipo === 'video' && ids.has(m.id)) { const r = await videoFrame(idx, m.archivo); if (r) vids[m.archivo] = r; }
        }
        setMedia(imgs); setVideos(vids);
        setFotosChat(Object.keys(imgs).filter(n => imgs[n].w >= 600).slice(0, 24));
      } catch (e) { console.error(e); setEstado('error'); setProgreso('No se ha podido leer el chat.'); }
    })();
  }, []);

  const man = useMemo(() => {
    if (!mensajes) return null;
    const m = montar(mensajes, caps, { quitados });
    return { ...m, titulo, subtitulo, dedicatoria, portada: { color, foto: portadaFoto } };
  }, [mensajes, caps, quitados, titulo, subtitulo, dedicatoria, color, portadaFoto]);

  const encendidos = caps.filter(c => c.on).length;
  const paginas = man ? man.paginasTotales : 0;
  const demasiadas = paginas > 200, pocas = encendidos === 0;

  // vista previa en iframe (mismo HTML que el PDF)
  useEffect(() => {
    if (!man || !iframeRef.current) return;
    const { css, body } = renderHTML(mensajes, man, { media, videos, derecha, preview: true });
    const doc = iframeRef.current.contentDocument;
    doc.open();
    doc.write(`<!doctype html><html><head><meta charset="utf-8"><style>${css}
      body{background:#ecebe7;padding:18px;display:flex;flex-wrap:wrap;gap:18px;justify-content:center;zoom:.62}
      section{width:${PAGE.w}mm;height:${PAGE.h}mm;min-height:0;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,.12);margin:0;break-after:auto}
      section.chapter-body{height:auto;min-height:${PAGE.h}mm}
      section.hidden{display:none}
      .msg .x{position:absolute;top:-6px;width:22px;height:22px;border-radius:50%;background:#b3261e;color:#fff;font:14px/22px sans-serif;text-align:center;cursor:pointer;display:none;z-index:2}
      .msg.l .x{right:-9px}.msg.r .x{left:-9px}.msg:hover .x{display:block}
    </style></head><body>${body}</body></html>`);
    doc.close();
    const caps0 = caps;
    doc.querySelectorAll('[data-cap]').forEach(el => el.classList.toggle('hidden', !caps0[+el.dataset.cap]?.on));
    doc.querySelectorAll('.msg').forEach(el => {
      const x = doc.createElement('div'); x.className = 'x'; x.textContent = '×'; x.title = 'Quitar del libro';
      x.onclick = e => { e.stopPropagation(); setQuitados(q => new Set([...q, +el.dataset.id])); };
      el.appendChild(x);
    });
  }, [man, mensajes, media, videos, derecha, caps]);

  const toggle = k => setCaps(cs => cs.map((c, i) => i === k ? { ...c, on: !c.on } : c));
  const renombrar = (k, t) => setCaps(cs => cs.map((c, i) => i === k ? { ...c, titulo: t } : c));
  const deshacer = () => setQuitados(new Set());

  async function generarPDF() {
    setProgreso('Generando el PDF…');
    const { html } = renderHTML(mensajes, man, { media, videos, derecha });
    const r = await fetch(`${API_URL}/api/book/pdf`, { method: 'POST', headers: { 'Content-Type': 'text/html' }, body: html });
    if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'No se pudo generar el PDF');
    return r.blob();
  }

  // Solo para revisar: descarga el PDF tal cual irá a imprenta.
  async function verPDF() {
    if (pidiendo) return;
    setPidiendo(true);
    try {
      const pdf = await generarPDF();
      const url = URL.createObjectURL(pdf); const a = document.createElement('a'); a.href = url; a.download = `${titulo.replace(/[^\w&\- ]/g, '')}.pdf`; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (e) { alert(e.message); }
    setPidiendo(false);
  }

  // Pedir: PDF → subida cifrada (caduca en 24 h) → Stripe Checkout (dirección y pago) → /libro/pedido.
  async function pedir() {
    if (pidiendo || demasiadas || pocas) return;
    setPidiendo(true);
    try {
      const pdf = await generarPDF();
      setProgreso('Subiendo el libro…');
      const fd = new FormData(); fd.append('kind', 'pdf'); fd.append('file', pdf, 'libro.pdf');
      const up = await fetch(`${API_URL}/api/book/upload`, { method: 'POST', body: fd });
      const u = await up.json().catch(() => ({}));
      if (!up.ok) throw new Error(u.error || 'No se pudo subir el PDF');
      const fileToken = u.plainUrl.split('k=')[1];
      setProgreso('Abriendo el pago…');
      const ck = await fetch(`${API_URL}/api/book/checkout`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId: u.id, fileToken, pageCount: paginas, titulo }) });
      const c = await ck.json().catch(() => ({}));
      if (!ck.ok || !c.url) throw new Error(c.error || 'No se pudo iniciar el pago');
      window.location.assign(c.url);
      return; // salimos de la página
    } catch (e) { alert(e.message); }
    setPidiendo(false);
  }

  if (estado === 'sinchat') return <div className="libro-empty"><h2>Tu chat en un libro</h2><p>Primero sube tu chat en la página principal y, desde los resultados, pulsa «Ver mi libro».</p><button onClick={() => navigate('/')}>Ir a subir el chat</button></div>;
  if (estado === 'error') return <div className="libro-empty"><h2>Tu chat en un libro</h2><p>{progreso}</p><button onClick={() => navigate('/')}>Volver</button></div>;
  if (estado === 'cargando') return <div className="libro-empty"><h2>Montando tu libro…</h2><p>{progreso}</p><div className="libro-spinner" /></div>;

  const autores = participantes(mensajes).map(p => p.nombre);
  return (
    <div className="libro">
      <div className="libro-top">
        <h1>{titulo || 'Tu libro'} <small>· vista previa</small></h1>
        {quitados.size > 0 && <button className="pill ghost" onClick={deshacer}>Deshacer ({quitados.size})</button>}
        <span className={`pill ${demasiadas ? 'warn' : ''}`}>{paginas} páginas · {PRECIO} €</span>
        <button className="pill ghost" disabled={pidiendo} onClick={verPDF} title="Descarga el PDF tal cual irá a imprenta">Ver PDF</button>
        <button className="pill go" disabled={pidiendo || demasiadas || pocas} onClick={pedir}>{pidiendo ? progreso : `Pedir libro · ${PRECIO} €`}</button>
      </div>
      <div className="libro-wrap">
        <iframe ref={iframeRef} title="libro" className="libro-pages" />
        <aside className="libro-side">
          <h2>Portada</h2>
          <input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Título" />
          <input value={subtitulo} onChange={e => setSubtitulo(e.target.value)} placeholder="Subtítulo" />
          <div className="colores">{COLORES.map(c => <button key={c} style={{ background: c }} className={c === color ? 'on' : ''} onClick={() => setColor(c)} aria-label={c} />)}</div>
          {fotosChat.length > 0 && <div className="fotos"><button className={!portadaFoto ? 'on' : ''} onClick={() => setPortadaFoto(null)}>Sin foto</button>{fotosChat.map(n => <img key={n} src={media[n].uri} alt="" className={n === portadaFoto ? 'on' : ''} onClick={() => setPortadaFoto(n)} />)}</div>}
          <h2>Dedicatoria</h2>
          <textarea value={dedicatoria} onChange={e => setDedicatoria(e.target.value.slice(0, 300))} placeholder="Opcional. Para quien es este libro…" rows={3} />
          {autores.length === 2 && <><h2>A la derecha</h2><div className="derecha">{autores.map(a => <button key={a} className={a === derecha ? 'on' : ''} onClick={() => setDerecha(a)}>{a}</button>)}</div></>}
          <h2>Capítulos</h2>
          {caps.map((c, k) => (
            <div key={k} className={`cap ${c.on ? '' : 'off'}`}>
              <div className={`sw ${c.on ? 'on' : ''}`} onClick={() => toggle(k)} role="switch" aria-checked={c.on} />
              <div className="t"><input value={c.titulo} onChange={e => renombrar(k, e.target.value)} /><span>{c.desde} → {c.hasta} · {man.capitulos[k].paginas} pág · {man.capitulos[k].fotos} fotos</span></div>
            </div>))}
          <p className="hint">{demasiadas ? 'Más de 200 páginas: apaga algún capítulo.' : pocas ? 'Enciende al menos un capítulo.' : 'Pasa el ratón por una burbuja y pulsa × para quitarla. Nada se guarda en nuestros servidores.'}</p>
        </aside>
      </div>
    </div>
  );
}
