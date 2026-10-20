import React from 'react';
import { Link } from 'react-router-dom';
import './BandaJuegos.css';

// Banda fina bajo el menú (solo castellano): aviso de los juegos de Halloween y Navidad.
const BandaJuegos = () => (
  <div className="banda-juegos">
    <span className="banda-juegos-texto">✨ Nuevo: juegos para tus fiestas</span>
    <Link to="/porra-halloween" className="banda-juegos-link">🎃 Halloween</Link>
    <Link to="/porra-navidad" className="banda-juegos-link">🎄 Navidad</Link>
  </div>
);

export default BandaJuegos;
