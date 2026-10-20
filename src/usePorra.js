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

// Resultado generado (ya pagado) guardado en el navegador para volver a descargar los PDFs sin consumir crédito.
const claveGenerado = (tema, operationId) => `juego_generado_${tema}_${operationId || 'sin_id'}`;
const leerGenerado = (tema, operationId) => {
  try { return JSON.parse(localStorage.getItem(claveGenerado(tema, operationId)) || 'null'); } catch (e) { return null; }
};
const guardarGenerado = (tema, operationId, datos) => {
  try { localStorage.setItem(claveGenerado(tema, operationId), JSON.stringify(datos)); } catch (e) { /* sin localStorage */ }
};

// Lógica de un juego (halloween / navidad) para este chat: crédito, compra, generación y descargas.
export const usePorra = ({ user, chatData, skipIA = false, tema = 'navidad', operationId = null }) => {
  const t = TEMAS[temaValido(tema)];
  const [credito, setCredito] = useState(null); // null = cargando
  const [estado, setEstado] = useState('idle'); // idle | comprando | generando | listo | error
  const [error, setError] = useState('');
  const [generado, setGenerado] = useState(() => leerGenerado(t.id, operationId));

  useEffect(() => { setGenerado(leerGenerado(t.id, operationId)); }, [t.id, operationId]);

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
      // Ya está pagado: se guarda para poder descargar las veces que haga falta
      const datos = { grupo, ronda1, ronda2, conIA: !skipIA, fecha: new Date().toISOString() };
      guardarGenerado(t.id, operationId, datos);
      setGenerado(datos);
      trackEvent('porra_descargada');
      setEstado('listo');
      // Primera descarga automática: solo la hoja de preguntas (los móviles bloquean una segunda descarga seguida)
      try { await descargarPdf(htmlPreguntas(grupo, t.id), `juego-${t.id}-preguntas.pdf`, t.id); } catch (e) { /* queda el botón */ }
    } catch (e) {
      setError(e.message || 'No se ha podido generar el juego.');
      setEstado('error');
    }
  };

  // Descargas a partir de lo ya generado (sin consumir crédito)
  const descargar = async (cual) => {
    if (!generado) return;
    setError('');
    try {
      if (cual === 'preguntas') {
        await descargarPdf(htmlPreguntas(generado.grupo, t.id), `juego-${t.id}-preguntas.pdf`, t.id);
      } else {
        await descargarPdf(htmlRespuestas(generado.grupo, generado.ronda1, generado.ronda2, generado.conIA, t.id), `juego-${t.id}-respuestas.pdf`, t.id);
      }
    } catch (e) {
      setError('No se ha podido descargar el PDF. Inténtalo de nuevo.');
    }
  };

  // Un solo botón: con juego comprado genera; sin él, compra.
  const accion = () => (credito?.canUse ? generar() : comprar());

  return { tema: t, credito, estado, error, accion, generado, descargar, grupo: nombreGrupoActual() };
};
