// Un libro de ejemplo abierto en el mismo sitio de la landing: la tapa gira y se pasan las páginas
// (chats y fotos con la misma plantilla que el libro impreso). "Cerrar" vuelve a los tres libros.
import React, { useEffect, useState } from 'react';

const Pagina = ({ html, titulo }) => <iframe title={titulo} srcDoc={html} tabIndex={-1} />;
const ABRIR_MS = 1100, PASAR_MS = 800;

export default function LibroAbierto({ libro, onCerrar }) {
  const { portada, dobles } = libro;
  const [abierto, setAbierto] = useState(false);     // la tapa ya ha empezado a girar
  const [tapaFuera, setTapaFuera] = useState(false); // la tapa ya está a la izquierda: se quita para no tapar páginas
  const [i, setI] = useState(0);                     // doble página que se ve
  const [hoja, setHoja] = useState(null);            // hoja girando: { dir: 1 | -1, girada }

  useEffect(() => {
    const t1 = setTimeout(() => setAbierto(true), 60);
    const t2 = setTimeout(() => setTapaFuera(true), 60 + ABRIR_MS);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const pasar = (dir) => {
    if (hoja || !tapaFuera || i + dir < 0 || i + dir >= dobles.length) return;
    // la hoja sale de la página derecha (adelante) o de la izquierda (atrás) y gira hasta el otro lado
    setHoja({ dir, girada: dir === -1 });
    requestAnimationFrame(() => requestAnimationFrame(() => setHoja({ dir, girada: dir === 1 })));
    setTimeout(() => { setI(i + dir); setHoja(null); }, PASAR_MS + 40);
  };

  // Mientras gira una hoja, debajo ya se ve la doble página a la que se va (por el lado que destapa la hoja)
  const destino = hoja ? i + hoja.dir : i;
  const izq = hoja && hoja.dir === -1 ? dobles[destino].izq : dobles[i].izq;
  const dcha = hoja && hoja.dir === 1 ? dobles[destino].dcha : dobles[i].dcha;

  return (
    <div className="la">
      <div className={`la-libro ${abierto ? 'abierto' : ''}`} onClick={() => pasar(i < dobles.length - 1 ? 1 : -1)}>
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
      <div className="la-mandos">
        <button type="button" onClick={() => pasar(-1)} disabled={i === 0 || !tapaFuera} aria-label="Página anterior">‹</button>
        <span>{i + 1} / {dobles.length}</span>
        <button type="button" onClick={() => pasar(1)} disabled={i === dobles.length - 1 || !tapaFuera} aria-label="Página siguiente">›</button>
        <button type="button" className="la-cerrar" onClick={onCerrar}>Cerrar</button>
      </div>
    </div>
  );
}
