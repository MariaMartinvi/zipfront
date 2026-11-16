// Tarjeta "Tu chat en un libro" al final de los resultados del análisis: una opción más, sin compromiso.
// El chat ya está en memoria (libroStore), así que "Ver mi libro" abre el editor directamente.
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cargarPreciosLibro, puedeImprimir, PRECIOS_LIBRO_DEFECTO, PAISES_IMPRESION_DEFECTO } from './precioLibro';
import { trackProductoClick } from '../utils/analytics';
import './libro.css';

export default function LibroCard() {
  const navigate = useNavigate();
  const [precios, setPrecios] = useState(PRECIOS_LIBRO_DEFECTO);
  const [paises, setPaises] = useState(PAISES_IMPRESION_DEFECTO);
  useEffect(() => { cargarPreciosLibro().then(({ labels, paises: p }) => { setPrecios(labels); setPaises(p); }); }, []);

  return (
    <div className="libro-card">
      <div className="libro-card-book" style={{ backgroundImage: 'url(/libro/pareja.jpg)' }} aria-hidden="true"><b>Vuestro chat</b></div>
      <div className="libro-card-text">
        <span className="libro-card-nuevo">Nuevo</span>
        <h2>¿Y si este chat fuera un libro?</h2>
        <p>Si te apetece, convertimos los mejores días de la conversación en un libro para guardar o regalar. Lo ves entero gratis y quitas lo que quieras antes de decidir.</p>
        <p className="libro-card-small">PDF {precios.pdf}{puedeImprimir(paises) && <> · impreso desde {precios.libro}, envío incluido</>} · Para que salgan las fotos, exporta el chat con archivos</p>
      </div>
      <button className="libro-card-btn" onClick={() => { trackProductoClick('libro', 'resultados'); navigate('/libro'); }}>Ver mi libro gratis →</button>
    </div>
  );
}
