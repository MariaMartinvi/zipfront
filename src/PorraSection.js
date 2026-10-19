import React, { useEffect, useState } from 'react';
import { canUsePorra, decrementPorraCredit, purchasePorra } from './firebase_auth';
import { getPorraResponse } from './fileService';
import { getPorraPricing } from './utils/pricing';
import { respuestasRonda1, respuestasRonda2 } from './utils/porra';
import { htmlPreguntas, htmlRespuestas, descargarPdf } from './utils/porraPdf';
import { trackEvent } from './utils/analytics';
import './PorraSection.css';

// "La Porra del Grupo": bloque en resultados (solo castellano). Una compra = un chat.
// Sin crédito: botón de compra. Con crédito: genera los dos PDFs con las respuestas de este chat.
const PorraSection = ({ user, chatData, skipIA = false }) => {
  const [credito, setCredito] = useState(null); // null = cargando
  const [grupo, setGrupo] = useState('');
  const [estado, setEstado] = useState('idle'); // idle | generando | listo | error
  const [error, setError] = useState('');

  useEffect(() => {
    let vivo = true;
    if (!user?.uid) return undefined;
    canUsePorra(user.uid).then((r) => { if (vivo) setCredito(r); });
    return () => { vivo = false; };
  }, [user?.uid, estado]);

  const comprar = async () => {
    trackEvent('porra_click');
    try {
      await purchasePorra(user.uid);
    } catch (e) {
      setError('No se ha podido iniciar la compra. Inténtalo de nuevo.');
    }
  };

  const generar = async () => {
    setEstado('generando');
    setError('');
    try {
      const nombreGrupo = grupo.trim() || 'Mi grupo';
      const ronda1 = respuestasRonda1(window.lastAnalysisTopData);
      let ronda2 = respuestasRonda2(null);
      if (!skipIA) {
        const ia = await getPorraResponse(chatData);
        if (!ia.success) throw new Error(ia.error);
        ronda2 = respuestasRonda2(ia.respuestas);
      }
      await decrementPorraCredit(user.uid);
      await descargarPdf(htmlPreguntas(nombreGrupo), 'porra-del-grupo-preguntas.pdf');
      await descargarPdf(htmlRespuestas(nombreGrupo, ronda1, ronda2, !skipIA), 'porra-del-grupo-respuestas.pdf');
      trackEvent('porra_descargada');
      setEstado('listo');
    } catch (e) {
      setError(e.message || 'No se ha podido generar la porra.');
      setEstado('error');
    }
  };

  const { price } = getPorraPricing();
  const tieneCredito = !!credito?.canUse;

  return (
    <section className="porra-section">
      <div className="porra-card">
        <div className="porra-head">
          <span className="porra-badge">🎄 Nuevo · Cena de Navidad</span>
          <h3>La Porra del Grupo</h3>
          <p>
            El juego de mesa de vuestro grupo de WhatsApp. Cada uno apuesta quién es quién en 20 preguntas
            y el acta del moderador revela las respuestas reales de <strong>este chat</strong>, con su dato.
          </p>
          <ul className="porra-lista">
            <li>📄 Hoja de jugador para imprimir (una por persona).</li>
            <li>🔐 Acta del moderador con las 20 respuestas y la prueba.</li>
            <li>🤖 Ronda 2 con lo que ha visto la IA{skipIA ? ' (desactivada en este chat: solo Ronda 1)' : ''}.</li>
          </ul>
        </div>

        {credito === null ? null : !tieneCredito ? (
          <div className="porra-cta">
            <button className="unlock-ai-button" onClick={comprar}>
              🎲 Crear la Porra de este grupo · {price}
            </button>
            <p className="porra-nota">Pago único por chat · Pago seguro con Stripe</p>
          </div>
        ) : estado === 'listo' ? (
          <div className="porra-cta">
            <p className="porra-ok">✅ Listo. Tienes los dos PDFs en tus descargas. ¡Feliz cena!</p>
            <button className="porra-link" onClick={() => setEstado('idle')}>Volver a descargar</button>
          </div>
        ) : (
          <div className="porra-cta">
            <label className="porra-label" htmlFor="porra-grupo">Nombre del grupo (saldrá en las hojas)</label>
            <input
              id="porra-grupo"
              className="porra-input"
              value={grupo}
              onChange={(e) => setGrupo(e.target.value)}
              placeholder="Los de siempre"
              maxLength={40}
            />
            <button className="unlock-ai-button" onClick={generar} disabled={estado === 'generando'}>
              {estado === 'generando' ? '⏳ Preparando tu Porra…' : '📥 Generar y descargar mi Porra'}
            </button>
            <p className="porra-nota">Se descargan dos PDFs: preguntas y respuestas. Guarda el de respuestas lejos del grupo.</p>
          </div>
        )}
        {error && <p className="porra-error">{error}</p>}
      </div>
    </section>
  );
};

export default PorraSection;
