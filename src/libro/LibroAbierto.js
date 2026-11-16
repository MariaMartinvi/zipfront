// El libro de ejemplo a pantalla completa: la tapa se abre y se pasan las páginas (chats y fotos de verdad,
// con la misma plantilla que el libro impreso). Se cierra con la ×, con Esc o pulsando fuera.
import React, { useEffect, useMemo, useState } from 'react';
import { libroAbierto } from './muestra';

const Pagina = ({ html, titulo }) => <iframe title={titulo} srcDoc={html} tabIndex={-1} />;
const ABRIR_MS = 1100, PASAR_MS = 800;

export default function LibroAbierto({ onCerrar }) {
  const { portada, dobles } = useMemo(() => libroAbierto(), []);
  const [abierto, setAbierto] = useState(false);     // la tapa ya ha empezado a girar
  const [tapaFuera, setTapaFuera] = useState(false); // la tapa ya está a la izquierda: se quita para no tapar páginas
  const [i, setI] = useState(0);                     // doble página que se ve
  const [hoja, setHoja] = useState(null);            // hoja girando: { dir: 1 | -1, girada }

  useEffect(() => {
    const t1 = setTimeout(() => setAbierto(true), 120);
    const t2 = setTimeout(() => setTapaFuera(true), 120 + ABRIR_MS);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { clearTimeout(t1); clearTimeout(t2); document.body.style.overflow = prev; };
  }, []);

  const pasar = (dir) => {
    if (hoja || !tapaFuera || i + dir < 0 || i + dir >= dobles.length) return;
    // la hoja sale de la página derecha (adelante) o de la izquierda (atrás) y gira hasta el otro lado
    setHoja({ dir, girada: dir === -1 });
    requestAnimationFrame(() => requestAnimationFrame(() => setHoja({ dir, girada: dir === 1 })));
    setTimeout(() => { setI(i + dir); setHoja(null); }, PASAR_MS + 40);
  };

  useEffect(() => {
    const tecla = (e) => {
      if (e.key === 'Escape') onCerrar();
      if (e.key === 'ArrowRight') pasar(1);
      if (e.key === 'ArrowLeft') pasar(-1);
    };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  });

  // Mientras gira una hoja, debajo ya se ve la doble página a la que se va (por el lado que destapa la hoja)
  const destino = hoja ? i + hoja.dir : i;
  const izq = hoja && hoja.dir === -1 ? dobles[destino].izq : dobles[i].izq;
  const dcha = hoja && hoja.dir === 1 ? dobles[destino].dcha : dobles[i].dcha;

  return (
    <div className="la-fondo" role="dialog" aria-modal="true" aria-label="Libro de ejemplo abierto" onClick={onCerrar}>
      <button type="button" className="la-cerrar" onClick={onCerrar} aria-label="Cerrar el libro">×</button>
      <div className={`la-libro ${abierto ? 'abierto' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="la-pag izq"><Pagina html={izq} titulo="Página izquierda" /></div>
        <div className="la-pag dcha"><Pagina html={dcha} titulo="Página derecha" /></div>
        {!tapaFuera && (
          <div className="la-tapa">
            <div className="la-cara"><Pagina html={portada} titulo="Portada" /></div>
            <div className="la-cara dorso"><Pagina html={dobles[0].izq} titulo="Página izquierda" /></div>
          </div>
        )}
        {hoja && (
          <div className={`la-hoja ${hoja.girada ? 'girada' : ''}`}>
            <div className="la-cara"><Pagina html={hoja.dir === 1 ? dobles[i].dcha : dobles[destino].dcha} titulo="Hoja" /></div>
            <div className="la-cara dorso"><Pagina html={hoja.dir === 1 ? dobles[destino].izq : dobles[i].izq} titulo="Hoja" /></div>
          </div>
        )}
      </div>
      <div className="la-mandos" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={() => pasar(-1)} disabled={i === 0 || !tapaFuera} aria-label="Página anterior">‹</button>
        <span>{i + 1} / {dobles.length}</span>
        <button type="button" onClick={() => pasar(1)} disabled={i === dobles.length - 1 || !tapaFuera} aria-label="Página siguiente">›</button>
      </div>
      <p className="la-girar">📱↻ Gira el móvil para verlo más grande</p>
      <p className="la-nota">Libro de ejemplo con un chat inventado · el tuyo, con vuestros mensajes y fotos</p>
    </div>
  );
}
