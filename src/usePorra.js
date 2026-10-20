import { useEffect, useState } from 'react';
import { canUsePorra, decrementPorraCredit, purchasePorra } from './firebase_auth';
import { getPorraResponse } from './fileService';
import { TEMAS, temaValido, respuestasRonda1, respuestasRonda2, nombreGrupoDesdeArchivo, CLAVE_NOMBRE_ARCHIVO } from './utils/porra';
import { htmlPreguntas, htmlRespuestas, descargarPdf } from './utils/porraPdf';
import { trackEvent } from './utils/analytics';

const nombreGrupoActual = () => {
  try {
    return nombreGrupoDesdeArchivo(...(localStorage.getItem(CLAVE_NOMBRE_ARCHIVO) || '').split('|'));
  } catch (e) {
    return 'Mi grupo';
  }
};

// Lógica de un juego (halloween / navidad) para este chat: crédito, compra y generación de los dos PDFs.
export const usePorra = ({ user, chatData, skipIA = false, tema = 'navidad' }) => {
  const t = TEMAS[temaValido(tema)];
  const [credito, setCredito] = useState(null); // null = cargando
  const [estado, setEstado] = useState('idle'); // idle | comprando | generando | listo | error
  const [error, setError] = useState('');

  useEffect(() => {
    let vivo = true;
    if (!user?.uid) return undefined;
    canUsePorra(user.uid, t.id).then((r) => { if (vivo) setCredito(r); });
    return () => { vivo = false; };
  }, [user?.uid, estado, t.id]);

  const comprar = async () => {
    trackEvent('porra_click');
    setEstado('comprando');
    try {
      await purchasePorra(user.uid, t.id);
    } catch (e) {
      setError('No se ha podido iniciar la compra. Inténtalo de nuevo.');
      setEstado('error');
    }
  };

  const generar = async () => {
    setEstado('generando');
    setError('');
    try {
      const grupo = nombreGrupoActual();
      const ronda1 = respuestasRonda1(window.lastAnalysisTopData);
      let ronda2 = respuestasRonda2(null, t.id);
      if (!skipIA) {
        const ia = await getPorraResponse(chatData, t.id);
        if (!ia.success) throw new Error(ia.error);
        ronda2 = respuestasRonda2(ia.respuestas, t.id);
      }
      await decrementPorraCredit(user.uid, t.id);
      await descargarPdf(htmlPreguntas(grupo, t.id), `juego-${t.id}-preguntas.pdf`, t.id);
      await descargarPdf(htmlRespuestas(grupo, ronda1, ronda2, !skipIA, t.id), `juego-${t.id}-respuestas.pdf`, t.id);
      trackEvent('porra_descargada');
      setEstado('listo');
    } catch (e) {
      setError(e.message || 'No se ha podido generar el juego.');
      setEstado('error');
    }
  };

  // Un solo botón: con juego comprado genera; sin él, compra.
  const accion = () => (credito?.canUse ? generar() : comprar());

  return { tema: t, credito, estado, error, accion, grupo: nombreGrupoActual() };
};
