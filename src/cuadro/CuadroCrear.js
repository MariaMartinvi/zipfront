// Página para crear el cuadro (/cuadro/crear?session_id=…), a la que se llega después del pago:
// sube el chat, se le proponen las frases, elige, edita y descarga la lámina. Sin pago, vuelve a /cuadro.
// El chat se anonimiza en el navegador antes de enviarse, igual que en el análisis (anonimo.js).
// La lámina se dibuja y se descarga en el navegador (lamina.js): ni las frases elegidas ni los nombres van al servidor.
import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import CuadroVista from './CuadroVista';
import { PLANTILLAS, IDS_PLANTILLAS, MAX_FRASES } from './render';
import { descargarLamina } from './lamina';
import { listaInicial, activas, alternar, anadir, editar, quitar, mover, cuadroDe, guardar, cargar, OPCIONES_INICIALES } from './editor';
import { leerArchivoChat, mensajesDeTexto, buscarFrases, datosModerno, titulosPropuestos } from './chat';
import { estadoPago, pedirFrases } from './api';
import { chatParaEnviar, nombresReales } from './anonimo';
import WhatsappInstructions, { detectPlatform } from '../WhatsappInstructions';
import { useTranslation } from 'react-i18next';
import { trackEvent } from '../utils/analytics';
import '../UploadBox.css';
import '../libro/LibroLanding.css';
import './CuadroCrear.css';

const AUTORES = [['nombre', 'Nombre'], ['inicial', 'Inicial'], ['ninguno', 'Sin nombre']];

export default function CuadroCrear() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const sid = params.get('session_id') || '';
  const [fase, setFase] = useState('comprobando'); // comprobando | sinpago | subir | leyendo | editar
  const [lista, setLista] = useState([]);
  const [opciones, setOpciones] = useState(OPCIONES_INICIALES);
  const [mensajes, setMensajes] = useState(null); // el chat, solo en memoria
  const [archivo, setArchivo] = useState(null);
  const [error, setError] = useState('');
  const [busca, setBusca] = useState('');
  const [arrastrando, setArrastrando] = useState(false);
  const [anadida, setAnadida] = useState(''); // última frase añadida a mano, para que se note
  const anadirAMano = (r) => {
    setLista((l) => anadir(l, r));
    setAnadida(r.texto.length > 60 ? `${r.texto.slice(0, 57)}…` : r.texto);
    setBusca(''); // lista para buscar la siguiente
  };
  const [bajando, setBajando] = useState('');
  const [caduca, setCaduca] = useState(0); // hasta cuándo se puede descargar (24 h desde el pago)

  // Al llegar del pago: comprobarlo y recuperar el trabajo guardado en este navegador, si lo hay
  useEffect(() => {
    if (!sid) return undefined;
    let vivo = true;
    estadoPago(sid).then((e) => {
      if (!vivo) return;
      setCaduca(e.caduca || 0);
      const previo = cargar(sid);
      if (previo) { setLista(previo.lista); setOpciones({ ...OPCIONES_INICIALES, ...previo.opciones }); setFase('editar'); } else { trackEvent('cuadro_comprado'); setFase('subir'); }
    }).catch((e) => vivo && setFase(e.status === 410 ? 'caducado' : 'sinpago'));
    return () => { vivo = false; };
  }, [sid]);

  useEffect(() => { if (sid && fase === 'editar') guardar(sid, { lista, opciones }); }, [fase, sid, lista, opciones]);

  const datos = useMemo(() => (mensajes ? datosModerno(mensajes) : null), [mensajes]);
  const cuadro = useMemo(() => cuadroDe(lista, opciones, datos), [lista, opciones, datos]);
  const marcadas = activas(lista).length;
  const encontradas = useMemo(() => (mensajes ? buscarFrases(mensajes, busca) : []), [mensajes, busca]);
  const opcion = (cambios) => setOpciones((o) => ({ ...o, ...cambios }));

  async function leerChat() {
    if (!archivo) return;
    setError('');
    try {
      const texto = await leerArchivoChat(archivo);
      const ms = mensajesDeTexto(texto);
      if (ms.length < 20) throw new Error('No hemos encontrado mensajes en ese archivo. Sube el .zip del chat exportado de WhatsApp.');
      const envio = chatParaEnviar(texto); // anonimizado aquí: del navegador no salen nombres ni teléfonos
      setMensajes(ms); // para buscar frases a mano mientras la página siga abierta
      setFase('leyendo');
      const r = await pedirFrases(sid, envio.lineas);
      trackEvent('cuadro_frases');
      setLista(listaInicial(nombresReales(r.frases, envio)));
      setOpciones((o) => ({ ...o, ...titulosPropuestos(ms) }));
      setFase('editar');
    } catch (e) {
      if (e.code === 'sin_usos') { setFase('editar'); setError('Ya hemos elegido las frases de este chat varias veces. Puedes buscar y añadir más a mano.'); return; }
      setError(e.message || 'No se ha podido leer el chat.');
      setFase('subir');
    }
  }

  async function bajar(formato) {
    setError(''); setBajando(formato);
    try {
      await descargarLamina(cuadro, formato); // se dibuja y se descarga en este dispositivo: no pasa por el servidor
      trackEvent('cuadro_descargado');
    } catch (e) { setError(e.message || 'No se pudo generar la lámina.'); }
    setBajando('');
  }

  if (!sid) return <Navigate to="/cuadro" replace />;
  if (fase === 'comprobando') return <div className="ll cc"><p className="cc-aviso">Comprobando el pago…</p></div>;
  if (fase === 'caducado') {
    return (
      <div className="ll cc"><div className="cc-caja">
        <h1>Este cuadro ha caducado</h1>
        <p>Había 24 horas para crearlo y descargarlo desde el pago, y no guardamos ninguna lámina. Si no llegaste a descargarla, escríbenos y lo vemos.</p>
        <p><Link to="/cuadro">Volver al cuadro</Link> · <Link to="/contact">Contacto</Link></p>
      </div></div>
    );
  }
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
        <p>Sube aquí el archivo .zip del chat exportado desde WhatsApp. Tienes 24 horas desde el pago para crear y descargar tu lámina.</p>
        <label className={`ll-soltar cc-soltar ${arrastrando ? 'arrastrando' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setArrastrando(true); }} onDragLeave={() => setArrastrando(false)}
          onDrop={(e) => { e.preventDefault(); setArrastrando(false); if (fase !== 'leyendo') { setArchivo(e.dataTransfer.files[0] || null); setError(''); } }}>
          <input type="file" accept=".zip,application/zip,application/x-zip,application/x-zip-compressed,application/octet-stream,*/*" disabled={fase === 'leyendo'} onChange={(e) => { setArchivo(e.target.files[0] || null); setError(''); }} aria-label="Archivo del chat" />
          <b>{archivo ? archivo.name : 'Suelta aquí el zip'}</b>
          <span className="ll-boton-cta">{archivo ? 'Cambiar archivo' : 'Elegir archivo'}</span>
        </label>
        <details className="upload-help">
          <summary>{t('app.upload.how_export')}</summary>
          <WhatsappInstructions platform={detectPlatform()} compact />
        </details>
        <button type="button" className="ll-boton-cta" disabled={!archivo || fase === 'leyendo'} onClick={() => leerChat()}>
          {fase === 'leyendo' ? 'Eligiendo las mejores frases…' : 'Elegir mis frases'}
        </button>
        {fase === 'leyendo'
          ? <p className="cc-aviso">Estamos eligiendo las mejores frases de vuestro chat. Suele tardar menos de un minuto; no cierres la página.</p>
          : <p className="cc-nota">Para elegirlas, el texto del chat se envía anonimizado (sin nombres, teléfonos, fotos ni audios) y no se guarda.</p>}
        {error && <p className="cc-error" role="alert">{error}</p>}
      </div></div>
    );
  }

  return (
    <div className="ll cc">
      <div className="cc-editor">
        <div className="cc-panel">
          <h1>Vuestro cuadro</h1>

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

          {mensajes && ( // solo con el chat cargado en esta página; tras recargar no se pide subirlo otra vez (Maria)
            <>
              <h2>Añadir frases a mano</h2>
              {anadida && <p className="cc-ok" role="status">✓ Añadida al cuadro: «{anadida}». Puedes buscar y añadir más.</p>}
              <input type="search" className="cc-busca" value={busca} placeholder="Busca una palabra de la frase…" onChange={(e) => setBusca(e.target.value)} aria-label="Buscar en el chat" />
              {busca.trim().length >= 2 && (
                <ul className="cc-resultados">
                  {encontradas.length === 0 && <li className="cc-nota">Nada con «{busca}».</li>}
                  {encontradas.map((r) => {
                    const ya = lista.some((f) => f.texto === r.texto);
                    return (
                      <li key={r.texto}>
                        <button type="button" disabled={ya} className={ya ? 'cc-ya' : ''} onClick={() => anadirAMano(r)}>
                          <b>{r.autor.split(' ')[0]}:</b> {r.texto}<span className="cc-anadir">{ya ? '✓ Añadida' : '+ Añadir'}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
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
          <div className="cc-descargar">
              <button type="button" className="ll-boton-cta" disabled={!marcadas || !!bajando} onClick={() => bajar('A4')}>{bajando === 'A4' ? 'Creando la lámina…' : 'Descargar la lámina (A4)'}</button>
              <button type="button" className="cc-secundario" disabled={!marcadas || !!bajando} onClick={() => bajar('A3')}>{bajando === 'A3' ? 'Creando la lámina…' : 'Descargar en A3'}</button>
              <p className="cc-nota">Edítala hasta que quede perfecta y descárgala ahora: la lámina se crea en tu dispositivo y no la guardamos ni pasa por nuestro servidor. Tienes 24 horas desde el pago{caduca ? ` (hasta las ${new Date(caduca * 1000).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })} del ${new Date(caduca * 1000).toLocaleDateString('es', { day: 'numeric', month: 'long' })})` : ''}; si cambias de dispositivo tendrás que subir el chat otra vez.</p>
          </div>
          {error && <p className="cc-error" role="alert">{error}</p>}
        </div>
      </div>
    </div>
  );
}
