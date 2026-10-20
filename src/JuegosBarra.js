import React from 'react';
import { usePorra } from './usePorra';
import { getPorraPricing } from './utils/pricing';
import './JuegosBarra.css';

const BotonJuego = ({ user, chatData, skipIA, tema, operationId }) => {
  const { tema: t, credito, estado, error, accion, generado, descargar } = usePorra({ user, chatData, skipIA, tema, operationId });
  const { price } = getPorraPricing();
  const nombre = t.id === 'halloween' ? 'Halloween' : 'Navidad';
  const ocupado = estado === 'generando' || estado === 'comprando';

  // Ya generado para este chat: descargas libres, sin consumir crédito
  if (generado && !ocupado) {
    return (
      <div className={`juego-boton juego-${t.id}`}>
        <span className="juego-boton-nota arriba">{t.emoji} Juego de {nombre} · listo para imprimir</span>
        <div className="juego-descargas">
          <button type="button" className="juego-boton-cta" onClick={() => descargar('preguntas')}>📄 Hoja de preguntas</button>
          <button type="button" className="juego-boton-cta" onClick={() => descargar('respuestas')}>🔐 Acta de respuestas</button>
        </div>
        {credito?.canUse && <button type="button" className="juego-boton-enlace" onClick={accion}>Volver a generar (gasta un juego)</button>}
        {error && <span className="juego-boton-error">{error}</span>}
      </div>
    );
  }

  const texto = estado === 'generando' ? '⏳ Preparando… (puede tardar un minuto)'
    : estado === 'comprando' ? '⏳ Abriendo el pago…'
    : credito === null ? `${t.emoji} Juego de ${nombre}`
    : credito.canUse ? `${t.emoji} Generar juego de ${nombre}`
    : `${t.emoji} Comprar juego de ${nombre} · ${price}`;
  const nota = credito?.canUse ? 'Comprado' : skipIA ? 'Solo Ronda 1 sin IA' : '';

  return (
    <div className={`juego-boton juego-${t.id}`}>
      <button type="button" className="juego-boton-cta" onClick={accion} disabled={ocupado || credito === null}>{texto}</button>
      <span className="juego-boton-nota">{nota}</span>
      {error && <span className="juego-boton-error">{error}</span>}
    </div>
  );
};

// Franja arriba de los resultados (solo castellano): un botón por juego.
const JuegosBarra = ({ user, chatData, skipIA, operationId }) => (
  <section className="juegos-barra">
    <p className="juegos-barra-titulo">🎲 Juegos para tu grupo, con las respuestas de este chat</p>
    <div className="juegos-barra-botones">
      <BotonJuego user={user} chatData={chatData} skipIA={skipIA} tema="halloween" operationId={operationId} />
      <BotonJuego user={user} chatData={chatData} skipIA={skipIA} tema="navidad" operationId={operationId} />
    </div>
  </section>
);

export default JuegosBarra;
