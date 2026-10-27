// Tarjeta "Tu chat en un libro" en la página de resultados.
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './libro.css';

export default function LibroCard() {
  const navigate = useNavigate();
  return (
    <div className="libro-card">
      <div className="libro-card-book"><span className="libro-card-pareja" aria-hidden="true">👩‍❤️‍👨</span><b>Nuestro chat</b><span>2024 – 2026</span></div>
      <div className="libro-card-text">
        <h2>¿Quieres convertir el análisis en un libro recuerdo que regalar?</h2>
        <p>Elegimos los mejores momentos del chat, los ordenamos en capítulos con vuestras fotos y los personajes de cada uno, y lo imprimimos en un libro de verdad. Tú quitas o añades lo que quieras antes de pedirlo.</p>
        <p className="libro-card-small">39 € con envío incluido · Tu chat no se guarda en ningún servidor</p>
      </div>
      <button className="libro-card-btn" onClick={() => navigate('/libro')}>Ver mi libro</button>
    </div>
  );
}
