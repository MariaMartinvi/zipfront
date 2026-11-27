// Landing del cuadro regalo (/cuadro): las plantillas con frases de ejemplo inventadas.
// Reutiliza la maqueta editorial de la landing del libro (clases .ll de LibroLanding.css).
import React, { useEffect, useState } from 'react';
import CuadroVista from './CuadroVista';
import { EJEMPLOS, EJEMPLOS_LISTA } from './ejemplos';
import { PLANTILLAS, IDS_PLANTILLAS } from './render';
import { cargarPrecio, pagar, PRECIO_DEFECTO } from './api';
import { trackEvent } from '../utils/analytics';
import '../libro/LibroLanding.css';
import './CuadroLanding.css';

// Solo en desarrollo: para comprobar a mano cómo sale la lámina dibujada en el navegador (no va al build de producción)
if (process.env.NODE_ENV === 'development') {
  window.__laminaPrueba = async (id, lista) => {
    const { dibujarLamina } = await import('./lamina');
    return dibujarLamina((lista ? EJEMPLOS_LISTA : EJEMPLOS)[id]);
  };
  window.__laminaArchivo = async (id, formato) => { // tamaño del archivo final, sin descargarlo
    const { dibujarLamina } = await import('./lamina');
    const { jsPDF } = await import('jspdf');
    const lienzo = await dibujarLamina(EJEMPLOS[id]);
    const [w, h] = formato === 'A3' ? [297, 420] : [210, 297];
    const pdf = new jsPDF({ unit: 'mm', format: [w, h], orientation: 'portrait', compress: true });
    pdf.addImage(lienzo.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, w, h, undefined, 'FAST');
    const b = pdf.output('blob');
    return { bytes: b.size, tipo: b.type, paginas: pdf.getNumberOfPages(), ancho: pdf.internal.pageSize.getWidth(), alto: pdf.internal.pageSize.getHeight() };
  };
}

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
          <p className="ll-entradilla">Nuestro sistema inteligente elige las frases más relevantes de vuestro chat, tú eliges la plantilla y descargas la lámina en alta calidad para impresión, lista para enmarcar.</p>
          <div className="ll-acciones">
            {precio.payments !== false && <button type="button" className="ll-boton-cta" onClick={comprar}>Crear mi cuadro · {precio.label}</button>}
          </div>
          {error && <p className="cc-error" role="alert">{error}</p>}
          <ol className="cl-pasos">
            <li><b>Pagas</b> y subes el chat exportado de WhatsApp.</li>
            <li><b>Nuestro sistema inteligente lee la conversación</b> y te propone 15 frases. Puedes añadir las que quieras a mano.</li>
            <li><b>Eliges de 1 a 12 frases</b> y el estilo. Lo editas hasta que quede perfecto y descargas la lámina en alta resolución, de más de 3000 px (A4, A3).</li>
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
          <span>Pago único, para un chat (puedes subirlo las veces que necesites). Es una lámina digital para descargar e imprimir: no enviamos nada a casa. La lámina se crea en tu dispositivo y te la descargas en el momento: no la guardamos ni pasa por nuestro servidor. Tienes 24 horas desde el pago. El chat se envía anonimizado, sin nombres ni teléfonos, y no se guarda.</span>
        </div>
      </section>
    </div>
  );
}
