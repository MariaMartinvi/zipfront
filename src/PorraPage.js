import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPorraPricing } from './utils/pricing';
import { PREGUNTAS_RONDA_1, PREGUNTAS_RONDA_2 } from './utils/porra';
import { trackEvent } from './utils/analytics';
import './PorraPage.css';

// Página de "La Porra del Grupo" (solo castellano). El vídeo lo sube Maria a public/videos/porra.mp4.
const VIDEO_URL = '/videos/porra.mp4';

const PorraPage = () => {
  const [hayVideo, setHayVideo] = useState(true);
  useEffect(() => {
    const anterior = document.title;
    document.title = 'La Porra del Grupo · El juego de Navidad de tu grupo de WhatsApp | ChatSalsa';
    return () => { document.title = anterior; };
  }, []);
  const { price } = getPorraPricing();
  const muestra = [...PREGUNTAS_RONDA_1.slice(0, 3), ...PREGUNTAS_RONDA_2.slice(0, 3)];

  return (
    <div className="porra-page">

      <header className="porra-hero">
        <span className="porra-badge">🎄 Para la cena de Navidad</span>
        <h1>La Porra del Grupo</h1>
        <p className="porra-sub">
          20 preguntas sobre vuestro grupo de WhatsApp. Cada uno apuesta quién es quién.
          Luego se leen las respuestas reales del chat, con su dato. Risas garantizadas.
        </p>
        <Link to="/" className="unlock-ai-button porra-cta-btn" onClick={() => trackEvent('porra_pagina_cta')}>
          🎲 Crear la Porra de mi grupo · {price}
        </Link>
        <p className="porra-nota">Sube el chat, se analiza en tu navegador y te descargas los dos PDFs. Pago único por chat.</p>
      </header>

      {hayVideo && (
        <section className="porra-video">
          <video controls playsInline preload="metadata" src={VIDEO_URL} onError={() => setHayVideo(false)}>
            <track kind="captions" />
          </video>
        </section>
      )}

      <section className="porra-como">
        <h2>Cómo se juega</h2>
        <ol>
          <li><strong>Imprime</strong> una hoja de preguntas por persona y el acta del moderador (solo una).</li>
          <li><strong>Apostad.</strong> Cada uno escribe en su hoja quién cree que es la respuesta. Sin mirar el chat.</li>
          <li><strong>Revelad.</strong> El moderador lee las respuestas reales una a una, con el dato que lo demuestra. Un punto por acierto. Quien más acierte se lleva el bote.</li>
        </ol>
      </section>

      <section className="porra-muestra">
        <h2>Algunas de las preguntas</h2>
        <ul>
          {muestra.map((p) => <li key={p.id}>{p.texto}</li>)}
          <li>… y 14 más. Las 10 de la Ronda 1 las responden los números del chat; las 10 de la Ronda 2, la IA de ChatSalsa.</li>
        </ul>
      </section>

      <section className="porra-privacidad">
        <h2>Tu chat, como siempre</h2>
        <p>
          Mismo proceso que el análisis de ChatSalsa: los teléfonos, correos y enlaces se anonimizan en tu navegador,
          los nombres se sustituyen antes de enviar nada a la IA y los ficheros se borran al terminar.
          Los PDFs se generan en tu dispositivo.
        </p>
        <Link to="/" className="unlock-ai-button porra-cta-btn" onClick={() => trackEvent('porra_pagina_cta')}>
          Empezar · {price}
        </Link>
      </section>
    </div>
  );
};

export default PorraPage;
