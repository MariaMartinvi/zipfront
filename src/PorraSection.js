import React, { useEffect, useState } from 'react';
import { canUsePorra, decrementPorraCredit, purchasePorra } from './firebase_auth';
import { getPorraResponse } from './fileService';
import { getPorraPricing } from './utils/pricing';
import { TEMAS, temaValido, respuestasRonda1, respuestasRonda2, nombreGrupoDesdeArchivo, CLAVE_NOMBRE_ARCHIVO } from './utils/porra';
import { htmlPreguntas, htmlRespuestas, descargarPdf } from './utils/porraPdf';
import { trackEvent } from './utils/analytics';
import './PorraSection.css';

// "La Porra del Grupo": tarjeta en resultados (solo castellano), una por juego (halloween / navidad).
// Una compra = un chat. Sin crédito: botón de compra. Con crédito: genera los dos PDFs de este chat.
const PorraSection = ({ user, chatData, skipIA = false, tema = 'navidad' }) => {
  const t = TEMAS[temaValido(tema)];
  const [credito, setCredito] = useState(null); // null = cargando
  const [estado, setEstado] = useState('idle'); // idle | generando | listo | error
  const [error, setError] = useState('');

  useEffect(() => {
    let vivo = true;
    if (!user?.uid) return undefined;
    canUsePorra(user.uid, t.id).then((r) => { if (vivo) setCredito(r); });
    return () => { vivo = false; };
  }, [user?.uid, estado, t.id]);

  const comprar = async () => {
    trackEvent('porra_click');
    try {
      await purchasePorra(user.uid, t.id);
    } catch (e) {
      setError('No se ha podido iniciar la compra. Inténtalo de nuevo.');
    }
  };

  const generar = async () => {
    setEstado('generando');
    setError('');
    try {
      const nombreGrupo = nombreGrupoActual();
      const ronda1 = respuestasRonda1(window.lastAnalysisTopData);
      let ronda2 = respuestasRonda2(null, t.id);
      if (!skipIA) {
        const ia = await getPorraResponse(chatData, t.id);
        if (!ia.success) throw new Error(ia.error);
        ronda2 = respuestasRonda2(ia.respuestas, t.id);
      }
      await decrementPorraCredit(user.uid, t.id);
      await descargarPdf(htmlPreguntas(nombreGrupo, t.id), `porra-${t.id}-preguntas.pdf`);
      await descargarPdf(htmlRespuestas(nombreGrupo, ronda1, ronda2, !skipIA, t.id), `porra-${t.id}-respuestas.pdf`);
      trackEvent('porra_descargada');
      setEstado('listo');
    } catch (e) {
      setError(e.message || 'No se ha podido generar la porra.');
      setEstado('error');
    }
  };

  const { price } = getPorraPricing();
  const tieneCredito = !!credito?.canUse;
  const nombreGrupoActual = () => {
    try {
      return nombreGrupoDesdeArchivo(...(localStorage.getItem(CLAVE_NOMBRE_ARCHIVO) || '').split('|'));
    } catch (e) {
      return 'Mi grupo';
    }
  };

  return (
    <section id={`porra-${t.id}`} className={`porra-section porra-${t.id}`}>
      <div className="porra-card">
        <div className="porra-head">
          <span className="porra-badge">{t.emoji} Nuevo · {t.badge}</span>
          <h3>{t.nombre}</h3>
          <p>
            {t.subtitulo}. Cada uno apuesta quién es quién en 20 preguntas
            y el acta del moderador revela las respuestas reales de <strong>este chat</strong>, con su dato.
          </p>
          <ul className="porra-lista">
            <li>📄 Hoja de jugador para imprimir (una por persona).</li>
            <li>🔐 Acta del moderador con las 20 respuestas y la prueba.</li>
            <li>🤖 Ronda 2 «{t.ronda2.toLowerCase()}» con lo que ha visto la IA{skipIA ? ' (desactivada en este chat: solo Ronda 1)' : ''}.</li>
          </ul>
        </div>

        {credito === null ? null : !tieneCredito ? (
          <div className="porra-cta">
            <button className="unlock-ai-button" onClick={comprar}>
              {t.emoji} Crear {t.nombre} de este grupo · {price}
            </button>
            <p className="porra-nota">Pago único por chat · Pago seguro con Stripe</p>
          </div>
        ) : estado === 'listo' ? (
          <div className="porra-cta">
            <p className="porra-ok">✅ Listo. Tienes los dos PDFs en tus descargas. ¡A jugar!</p>
            <button className="porra-link" onClick={() => setEstado('idle')}>Volver a descargar</button>
          </div>
        ) : (
          <div className="porra-cta">
            <p className="porra-grupo">Grupo: <strong>{nombreGrupoActual()}</strong></p>
            <button className="unlock-ai-button" onClick={generar} disabled={estado === 'generando'}>
              {estado === 'generando' ? '⏳ Preparando tu Porra…' : `📥 Generar y descargar ${t.nombre}`}
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
