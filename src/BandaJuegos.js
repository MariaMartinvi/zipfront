import React from 'react';
import { Link } from 'react-router-dom';
import { trackProductoClick } from './utils/analytics';
import './BandaJuegos.css';

// Banda fina bajo el menú (solo castellano): aviso de los juegos de Halloween y Navidad.
const BandaJuegos = () => (
  <div className="banda-juegos">
    <span className="banda-juegos-texto">✨ Nuevo: Juegos</span>
    <Link to="/porra-halloween" className="banda-juegos-link" onClick={() => trackProductoClick('halloween', 'banda')}>🎃 Halloween</Link>
    <Link to="/porra-navidad" className="banda-juegos-link" onClick={() => trackProductoClick('navidad', 'banda')}>🎄 Navidad</Link>
  </div>
);

export default BandaJuegos;
