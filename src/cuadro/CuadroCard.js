// Tarjeta del cuadro regalo en los resultados del análisis, junto a la del libro.
import React from 'react';
import { useNavigate } from 'react-router-dom';
import CuadroVista from './CuadroVista';
import { EJEMPLOS } from './ejemplos';
import { trackProductoClick } from '../utils/analytics';
import '../libro/libro.css';
import './CuadroCard.css';

export default function CuadroCard() {
  const navigate = useNavigate();
  return (
    <div className="libro-card cuadro-card">
      <div className="cuadro-card-cuadro" aria-hidden="true"><CuadroVista cuadro={EJEMPLOS.moderno} /></div>
      <div className="libro-card-text">
        <span className="libro-card-nuevo">Nuevo</span>
        <h2>Un cuadro con vuestras frases memorables</h2>
        <p>Nuestro sistema inteligente elige las frases míticas de este chat y tú decides cuáles salen. Tres estilos, en una lámina de alta resolución lista para imprimir y enmarcar.</p>
      </div>
      <button className="libro-card-btn" onClick={() => { trackProductoClick('cuadro', 'resultados'); navigate('/cuadro'); }}>Ver los cuadros →</button>
    </div>
  );
}
