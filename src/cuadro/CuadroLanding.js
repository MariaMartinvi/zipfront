// Landing del cuadro regalo (/cuadro): las plantillas con frases de ejemplo inventadas.
// Reutiliza la maqueta editorial de la landing del libro (clases .ll de LibroLanding.css).
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CuadroVista from './CuadroVista';
import { EJEMPLOS, EJEMPLOS_LISTA } from './ejemplos';
import { PLANTILLAS, IDS_PLANTILLAS } from './render';
import { cargarPrecio, pagar, PRECIO_DEFECTO } from './api';
import { trackEvent, trackProductoClick } from '../utils/analytics';
import '../libro/LibroLanding.css';
import './CuadroLanding.css';

export default function CuadroLanding() {
  const [elegida, setElegida] = useState(IDS_PLANTILLAS[0]);
  const [precio, setPrecio] = useState(PRECIO_DEFECTO);
  const [error, setError] = useState('');
  useEffect(() => { cargarPrecio().then(setPrecio); }, []);
  const comprar = () => { trackEvent('cuadro_pago'); setError(''); pagar().catch((e) => setError(e.message)); };
  return (
    <div className="ll cl">
      <section className="ll-hero">
        <div>
          <p className="ll-kicker">Cuadro regalo</p>
          <h1>Vuestras frases, <em>en la pared</em></h1>
          <p className="ll-entradilla">Las frases memorables de vuestro chat de WhatsApp, en un cuadro para regalar. La IA propone las mejores, tú eliges cuáles salen y el estilo, y lo descargas en PDF listo para imprimir y enmarcar.</p>
          <div className="ll-acciones">
            {precio.payments !== false && <button type="button" className="ll-boton-cta" onClick={comprar}>Crear mi cuadro · {precio.label}</button>}
            <Link to="/cuadro/crear" onClick={() => trackProductoClick('cuadro', 'landing')}>Probarlo antes con un ejemplo</Link>
          </div>
          {error && <p className="cc-error" role="alert">{error}</p>}
          <ol className="cl-pasos">
            <li><b>Pagas</b> y subes el chat exportado de WhatsApp.</li>
            <li><b>La IA lee la conversación</b> y te propone 15 frases. Puedes añadir las que quieras a mano.</li>
            <li><b>Eliges de 1 a 12 frases</b>, el estilo y si salen los nombres, y descargas el PDF en A4 y A3.</li>
          </ol>
        </div>
        <figure className="cl-hero-cuadro"><CuadroVista cuadro={EJEMPLOS[elegida]} /></figure>
      </section>

      <section id="plantillas" className="cl-plantillas">
        <div className="ll-cabecera"><h2>Elige tu plantilla</h2></div>
        <p>Tres estilos, de 1 a 12 frases. Las de estos ejemplos son inventadas: en tu cuadro saldrán las de tu chat.</p>
        <ul className="cl-rejilla">
          {IDS_PLANTILLAS.map((id) => (
            <li key={id}>
              <button type="button" className={`cl-tarjeta${id === elegida ? ' cl-elegida' : ''}`} onClick={() => setElegida(id)} aria-pressed={id === elegida}>
                <CuadroVista cuadro={EJEMPLOS[id]} />
                <span>{PLANTILLAS[id].nombre}</span>
              </button>
            </li>
          ))}
        </ul>
        <p>Con muchas frases (un chat de grupo), el mismo estilo pasa a lista y el texto gana protagonismo:</p>
        <ul className="cl-rejilla">
          {IDS_PLANTILLAS.map((id) => (
            <li key={id}><div className="cl-tarjeta"><CuadroVista cuadro={EJEMPLOS_LISTA[id]} /><span>{PLANTILLAS[id].nombre} · lista</span></div></li>
          ))}
        </ul>
        <div className="ll-acciones cl-final">
          {precio.payments !== false && <button type="button" className="ll-boton-cta" onClick={comprar}>Crear mi cuadro · {precio.label}</button>}
          <span>Pago único. El chat se envía a la IA sin nombres ni teléfonos y no se guarda.</span>
        </div>
      </section>
    </div>
  );
}
