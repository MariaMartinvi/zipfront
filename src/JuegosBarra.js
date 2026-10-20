import React from 'react';
import { usePorra } from './usePorra';
import { getPorraPricing } from './utils/pricing';
import './JuegosBarra.css';

const BotonJuego = ({ user, chatData, skipIA, tema }) => {
  const { tema: t, credito, estado, error, accion } = usePorra({ user, chatData, skipIA, tema });
  const { price } = getPorraPricing();
  const ocupado = estado === 'generando' || estado === 'comprando';
  const nombre = t.id === 'halloween' ? 'Halloween' : 'Navidad';
  const texto = estado === 'generando' ? '⏳ Preparando…'
    : estado === 'comprando' ? '⏳ Abriendo el pago…'
    : credito === null ? `${t.emoji} Juego de ${nombre}`
    : credito.canUse ? `${t.emoji} Descargar juego de ${nombre}`
    : `${t.emoji} Comprar juego de ${nombre} · ${price}`;
  const nota = credito === null ? ' '
    : estado === 'listo' ? '✅ Descargado. Pulsa para volver a generar.'
    : credito.canUse ? 'Comprado · dos PDFs listos para imprimir'
    : `Pago único por chat · luego se descarga aquí${skipIA ? ' · solo Ronda 1 sin IA' : ''}`;

  return (
    <div className={`juego-boton juego-${t.id}`}>
      <button type="button" className="juego-boton-cta" onClick={accion} disabled={ocupado || credito === null}>{texto}</button>
      <span className="juego-boton-nota">{nota}</span>
      {error && <span className="juego-boton-error">{error}</span>}
    </div>
  );
};

// Franja arriba de los resultados (solo castellano): un botón por juego.
const JuegosBarra = ({ user, chatData, skipIA }) => (
  <section className="juegos-barra">
    <p className="juegos-barra-titulo">🎲 Juegos para tu grupo, con las respuestas de este chat</p>
    <div className="juegos-barra-botones">
      <BotonJuego user={user} chatData={chatData} skipIA={skipIA} tema="halloween" />
      <BotonJuego user={user} chatData={chatData} skipIA={skipIA} tema="navidad" />
    </div>
  </section>
);

export default JuegosBarra;
