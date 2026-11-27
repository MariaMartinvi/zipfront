// Vista previa de un cuadro: el mismo HTML que irá al PDF, dentro de un iframe con la proporción de un A4.
import React, { useMemo } from 'react';
import { htmlCuadro } from './render';

export default function CuadroVista({ cuadro, className = '' }) {
  const html = useMemo(() => htmlCuadro(cuadro), [cuadro]);
  return (
    <iframe
      title={cuadro.titulo || 'Cuadro'}
      className={`cuadro-vista ${className}`}
      srcDoc={html}
      sandbox="allow-scripts"
      loading="lazy"
      style={{ width: '100%', aspectRatio: '210 / 297', border: 0, display: 'block', background: '#fff' }}
    />
  );
}
