// Lo primero que se ve al llegar al libro (desde los resultados o tras subir el chat): su propio libro,
// cerrado, que se abre en el sitio al tocarlo, y un solo botón para ir al editor. La compra está en el editor.
// En el móvil, antes se veían primero los botones de compra y dos avisos, y la gente se iba sin ver el libro.
import React, { useState } from 'react';
import LibroAbierto from './LibroAbierto';
import './LibroLanding.css';

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
export const fechaLarga = (dia) => { const [a, m, d] = String(dia).split('-').map(Number); return `${d} de ${MESES[m - 1]} de ${a}`; };

export default function LibroEntrada({ libro, titulo, paginas, capitulos, desde, sinFotos, precioPdf, onEditar, onAbrir, onSubir }) {
  const [abierto, setAbierto] = useState(false);
  const abrir = () => { setAbierto(true); onAbrir(); };
  return (
    <div className="ll lx">
      <p className="lx-kicker">Vuestro libro · vista previa gratis</p>
      <h1>{titulo}</h1>
      <p className="lx-resumen">{paginas} páginas · {capitulos} {capitulos === 1 ? 'capítulo' : 'capítulos'}{desde && <> · desde el {fechaLarga(desde)}</>}</p>
      <div className={`lx-libro ${abierto ? 'abierto' : ''}`}>
        {abierto
          ? <LibroAbierto libro={libro} onCerrar={() => setAbierto(false)} />
          : (
            <button type="button" className="ll-libro3d lx-uno" onClick={abrir} aria-label={`Abrir el libro ${titulo}`}>
              <span className="ll-libro3d-tapa"><iframe title={`Portada de ${titulo}`} srcDoc={libro.portada} tabIndex={-1} /></span>
              <span className="ll-libro3d-canto" />
            </button>
          )}
      </div>
      <p className="lx-pie">{abierto ? 'Pulsa las páginas para pasarlas' : 'Pulsa el libro para abrirlo'} · tapa blanda 20 × 20 cm</p>
      <button type="button" className="lx-cta" onClick={onEditar}>Ver y editar el libro entero</button>
      <p className="lx-nota">
        Quita los mensajes y capítulos que quieras antes de decidir · PDF {precioPdf}
        {sinFotos && <> · ¿Con fotos? Exporta el chat con archivos y <button type="button" onClick={onSubir}>súbelo aquí</button></>}
      </p>
    </div>
  );
}
