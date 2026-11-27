// Página para crear el cuadro (/cuadro/crear).
//  - Con ?session_id=… de un pago hecho: sube el chat, la IA propone las frases, elige, edita y descarga el PDF.
//  - Sin pago: modo ejemplo, con frases inventadas, para trastear con los estilos antes de comprar.
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import CuadroVista from './CuadroVista';
import { htmlCuadro, PLANTILLAS, IDS_PLANTILLAS, MAX_FRASES } from './render';
import { EJEMPLOS_LISTA } from './ejemplos';
import { listaInicial, activas, alternar, anadir, editar, quitar, mover, cuadroDe, guardar, cargar, OPCIONES_INICIALES } from './editor';
import { leerArchivoChat, mensajesDeTexto, buscarFrases, datosModerno, titulosPropuestos } from './chat';
import { cargarPrecio, pagar, estadoPago, pedirFrases, descargarPdf, PRECIO_DEFECTO } from './api';
import { trackEvent } from '../utils/analytics';
import '../libro/LibroLanding.css';
import './CuadroCrear.css';

const AUTORES = [['nombre', 'Nombre'], ['inicial', 'Inicial'], ['ninguno', 'Sin nombre']];

export default function CuadroCrear() {
  const [params] = useSearchParams();
  const sid = params.get('session_id') || '';
  const demo = !sid;
  const [fase, setFase] = useState(demo ? 'editar' : 'comprobando'); // comprobando | sinpago | subir | leyendo | editar
  const [lista, setLista] = useState(() => (demo ? listaInicial(EJEMPLOS_LISTA.moderno.frases) : []));
  const [opciones, setOpciones] = useState(() => (demo ? { ...OPCIONES_INICIALES, titulo: 'Las de siempre', pie: '2019 – 2026' } : OPCIONES_INICIALES));
  const [mensajes, setMensajes] = useState(null); // el chat, solo en memoria
  const [consiente, setConsiente] = useState(false);
  const [archivo, setArchivo] = useState(null);
  const [error, setError] = useState('');
  const [busca, setBusca] = useState('');
  const [bajando, setBajando] = useState('');
  const [precio, setPrecio] = useState(PRECIO_DEFECTO);

  // Al llegar del pago: comprobarlo y recuperar el trabajo guardado en este navegador, si lo hay
  useEffect(() => {
    if (demo) { cargarPrecio().then(setPrecio); return; }
    let vivo = true;
    estadoPago(sid).then(() => {
      if (!vivo) return;
      const previo = cargar(sid);
      if (previo) { setLista(previo.lista); setOpciones({ ...OPCIONES_INICIALES, ...previo.opciones }); setFase('editar'); } else { trackEvent('cuadro_comprado'); setFase('subir'); }
    }).catch(() => vivo && setFase('sinpago'));
    return () => { vivo = false; };
  }, [sid, demo]);

  useEffect(() => { if (!demo && fase === 'editar') guardar(sid, { lista, opciones }); }, [demo, fase, sid, lista, opciones]);

  const datos = useMemo(() => (mensajes ? datosModerno(mensajes) : null), [mensajes]);
  const cuadro = useMemo(() => cuadroDe(lista, opciones, datos), [lista, opciones, datos]);
  const marcadas = activas(lista).length;
  const encontradas = useMemo(() => (mensajes ? buscarFrases(mensajes, busca) : []), [mensajes, busca]);
  const opcion = (cambios) => setOpciones((o) => ({ ...o, ...cambios }));

  async function leerChat(conIA) {
    if (!archivo) return;
    setError('');
    try {
      const texto = await leerArchivoChat(archivo);
      const ms = mensajesDeTexto(texto);
      if (ms.length < 20) throw new Error('No hemos encontrado mensajes en ese archivo. Sube el chat exportado de WhatsApp (.zip o .txt).');
      setMensajes(ms);
      if (!conIA) return;
      setFase('leyendo');
      const r = await pedirFrases(sid, texto);
      trackEvent('cuadro_frases');
      setLista(listaInicial(r.frases));
      setOpciones((o) => ({ ...o, ...titulosPropuestos(ms) }));
      setFase('editar');
    } catch (e) {
      if (e.code === 'sin_usos') { setFase('editar'); setError('Ya habíamos elegido las frases de este cuadro. Puedes buscar y añadir más a mano.'); return; }
      setError(e.message || 'No se ha podido leer el chat.');
      if (conIA) setFase('subir');
    }
  }

  async function bajar(formato) {
    setError(''); setBajando(formato);
    try {
      await descargarPdf(sid, htmlCuadro(cuadro, { formato }), `cuadro-chatsalsa-${formato}.pdf`);
      trackEvent('cuadro_descargado');
    } catch (e) { setError(e.message || 'No se pudo generar el PDF.'); }
    setBajando('');
  }

  if (fase === 'comprobando') return <div className="ll cc"><p className="cc-aviso">Comprobando el pago…</p></div>;
  if (fase === 'sinpago') {
    return (
      <div className="ll cc"><div className="cc-caja">
        <h1>No encontramos ese pago</h1>
        <p>Si acabas de pagar, espera unos segundos y recarga la página. Si el problema sigue, escríbenos y lo arreglamos.</p>
        <p><Link to="/cuadro">Volver al cuadro regalo</Link> · <Link to="/contact">Contacto</Link></p>
      </div></div>
    );
  }
  if (fase === 'subir' || fase === 'leyendo') {
    return (
      <div className="ll cc"><div className="cc-caja">
        <p className="ll-kicker">Pago recibido · paso 1 de 2</p>
        <h1>Sube vuestro chat</h1>
        <p>Exporta el chat desde WhatsApp (sin archivos, pesa menos) y sube aquí el .zip o el .txt.</p>
        <input type="file" accept=".zip,.txt" disabled={fase === 'leyendo'} onChange={(e) => { setArchivo(e.target.files[0] || null); setError(''); }} aria-label="Archivo del chat" />
        <label className="cc-consiente">
          <input type="checkbox" checked={consiente} disabled={fase === 'leyendo'} onChange={(e) => setConsiente(e.target.checked)} />
          <span>Acepto que el texto del chat se envíe a nuestro servidor y a la IA para elegir las frases. Va sin nombres, teléfonos, fotos ni audios, y no se guarda.</span>
        </label>
        <button type="button" className="ll-boton-cta" disabled={!archivo || !consiente || fase === 'leyendo'} onClick={() => leerChat(true)}>
          {fase === 'leyendo' ? 'Leyendo vuestro chat…' : 'Elegir mis frases'}
        </button>
        {fase === 'leyendo' && <p className="cc-aviso">La IA está leyendo la conversación. Suele tardar menos de un minuto; no cierres la página.</p>}
        {error && <p className="cc-error" role="alert">{error}</p>}
      </div></div>
    );
  }

  return (
    <div className="ll cc">
      {demo && (
        <div className="cc-demo">
          <span>Esto es un ejemplo con frases inventadas. Para hacerlo con vuestro chat:</span>
          {precio.payments !== false && <button type="button" className="ll-boton-cta" onClick={() => { trackEvent('cuadro_pago'); pagar().catch((e) => setError(e.message)); }}>Crear mi cuadro · {precio.label}</button>}
        </div>
      )}
      <div className="cc-editor">
        <div className="cc-panel">
          <h1>{demo ? 'Prueba el editor' : 'Vuestro cuadro'}</h1>

          <h2>Estilo</h2>
          <div className="cc-botones">
            {IDS_PLANTILLAS.map((id) => <button key={id} type="button" aria-pressed={opciones.plantilla === id} onClick={() => opcion({ plantilla: id })}>{PLANTILLAS[id].nombre}</button>)}
          </div>
          {opciones.plantilla === 'moderno' && (
            <label className="cc-check"><input type="checkbox" checked={opciones.oscuro} onChange={(e) => opcion({ oscuro: e.target.checked })} /> Fondo oscuro</label>
          )}

          <h2>Frases <small>{marcadas} de {MAX_FRASES} como máximo</small></h2>
          <p className="cc-nota">{marcadas <= 4 ? 'Con pocas frases manda el dibujo o la letra grande.' : 'Con muchas frases el cuadro pasa a lista.'} Puedes corregir el texto.</p>
          <ul className="cc-frases">
            {lista.map((f, i) => (
              <li key={f.id} className={f.activa ? 'cc-activa' : ''}>
                <input type="checkbox" checked={f.activa} onChange={() => setLista((l) => alternar(l, f.id))} aria-label={`Incluir: ${f.texto}`} />
                <div>
                  <textarea rows={2} value={f.texto} maxLength={220} onChange={(e) => setLista((l) => editar(l, f.id, { texto: e.target.value }))} aria-label="Texto de la frase" />
                  <input type="text" value={f.autor} maxLength={40} placeholder="Quién lo dijo" onChange={(e) => setLista((l) => editar(l, f.id, { autor: e.target.value }))} aria-label="Quién lo dijo" />
                </div>
                <span className="cc-acciones">
                  <button type="button" disabled={i === 0} onClick={() => setLista((l) => mover(l, f.id, -1))} aria-label="Subir">↑</button>
                  <button type="button" disabled={i === lista.length - 1} onClick={() => setLista((l) => mover(l, f.id, 1))} aria-label="Bajar">↓</button>
                  <button type="button" onClick={() => setLista((l) => quitar(l, f.id))} aria-label="Quitar de la lista">×</button>
                </span>
              </li>
            ))}
          </ul>

          <h2>Añadir frases a mano</h2>
          {mensajes ? (
            <>
              <input type="search" className="cc-busca" value={busca} placeholder="Busca una palabra de la frase…" onChange={(e) => setBusca(e.target.value)} aria-label="Buscar en el chat" />
              {busca.trim().length >= 2 && (
                <ul className="cc-resultados">
                  {encontradas.length === 0 && <li className="cc-nota">Nada con «{busca}».</li>}
                  {encontradas.map((r) => (
                    <li key={r.texto}><button type="button" onClick={() => setLista((l) => anadir(l, r))}><b>{r.autor.split(' ')[0]}:</b> {r.texto}</button></li>
                  ))}
                </ul>
              )}
            </>
          ) : demo ? (
            <p className="cc-nota">Con vuestro chat podrás buscar cualquier frase y añadirla.</p>
          ) : (
            <p className="cc-nota">Para buscar en el chat, súbelo otra vez (se queda en tu dispositivo, no se envía):{' '}
              <input type="file" accept=".zip,.txt" onChange={(e) => { setArchivo(e.target.files[0] || null); }} aria-label="Archivo del chat" />
              {archivo && <button type="button" onClick={() => leerChat(false)}>Abrir</button>}
            </p>
          )}

          <h2>Textos del cuadro</h2>
          <label className="cc-campo">Título <input type="text" value={opciones.titulo} maxLength={40} onChange={(e) => opcion({ titulo: e.target.value })} /></label>
          <label className="cc-campo">Pie <input type="text" value={opciones.pie} maxLength={40} onChange={(e) => opcion({ pie: e.target.value })} /></label>
          <div className="cc-botones">
            {AUTORES.map(([v, t]) => <button key={v} type="button" aria-pressed={opciones.autores === v} onClick={() => opcion({ autores: v })}>{t}</button>)}
          </div>
        </div>

        <div className="cc-vista">
          <figure className="cc-cuadro">{marcadas > 0 ? <CuadroVista cuadro={cuadro} /> : <p className="cc-aviso">Marca al menos una frase.</p>}</figure>
          {!demo && (
            <div className="cc-descargar">
              <button type="button" className="ll-boton-cta" disabled={!marcadas || !!bajando} onClick={() => bajar('A4')}>{bajando === 'A4' ? 'Generando…' : 'Descargar PDF en A4'}</button>
              <button type="button" className="cc-secundario" disabled={!marcadas || !!bajando} onClick={() => bajar('A3')}>{bajando === 'A3' ? 'Generando…' : 'Descargar en A3'}</button>
              <p className="cc-nota">Puedes cambiarlo y descargarlo las veces que quieras. Guarda el enlace de esta página para volver.</p>
            </div>
          )}
          {error && <p className="cc-error" role="alert">{error}</p>}
        </div>
      </div>
    </div>
  );
}
