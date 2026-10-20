import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPorraPricing } from './utils/pricing';
import { TEMAS, temaValido, PREGUNTAS_RONDA_1 } from './utils/porra';
import { trackEvent } from './utils/analytics';
import './PorraPage.css';

// Landings de los dos juegos (solo castellano). Los vídeos los sube Maria a public/videos/.
const CONTENIDO = {
  halloween: {
    video: '/videos/porra-halloween.mp4',
    titulo: 'La Porra de Halloween',
    gancho: 'Tu grupo de WhatsApp esconde cosas. Esta noche salen todas.',
    intro:
      'Veinte preguntas de miedo sobre vuestro grupo. Cada uno apuesta quién es el fantasma, quién moriría el primero ' +
      'en la peli, quién es el vampiro emocional. Luego el acta del moderador revela la verdad, con pruebas sacadas del chat.',
    decor: ['🎃', '👻', '🦇', '🕸️', '💀'],
    pasos: [
      ['Imprime', 'una hoja de preguntas por víctima y el acta del moderador, solo una. Luz baja, velas opcionales.'],
      ['Apostad', 'cada uno escribe quién cree que es la respuesta. Sin mirar el chat. Sin piedad.'],
      ['Revelad', 'el moderador lee las respuestas reales una a una, con la prueba del chat. Un punto por acierto. Quien más acierte sobrevive.'],
    ],
    cierre: 'Lo que el grupo lleva años callando, resuelto en una noche.',
    ctaTexto: 'Crear la Porra de Halloween',
  },
  navidad: {
    video: '/videos/porra-navidad.mp4',
    titulo: 'La Porra de Navidad',
    gancho: 'La familia reunida. El cuñao calentando. La abuela con un consejo. Y el chat del grupo, que lo sabe todo.',
    intro:
      'Veinte preguntas sobre vuestro grupo de WhatsApp para poner sobre la mesa entre el entrante y el turrón. Cada uno ' +
      'apuesta quién es quién, y el acta del moderador revela las respuestas reales con el dato que lo demuestra. ' +
      'Se discute, se niega, se enseña el chat. Y se ríe.',
    decor: ['🎄', '🍗', '🎁', '🥂', '🧑‍🎄'],
    pasos: [
      ['Imprime', 'una hoja de preguntas por comensal y el acta del moderador, solo una. Que la guarde quien no haga trampas.'],
      ['Apostad', 'entre plato y plato, cada uno escribe quién cree que es la respuesta. Sin mirar el chat. Sin consultar a la cuñada.'],
      ['Revelad', 'en el postre, el moderador lee las respuestas reales con su dato. Un punto por acierto. Quien más acierte elige la peli.'],
    ],
    cierre: 'Las peleas de siempre, pero con pruebas.',
    ctaTexto: 'Crear la Porra de Navidad',
  },
};

const PorraPage = ({ tema = 'navidad' }) => {
  const t = TEMAS[temaValido(tema)];
  const c = CONTENIDO[t.id];
  const [hayVideo, setHayVideo] = useState(true);
  const navigate = useNavigate();
  const { price } = getPorraPricing();

  // A la portada y abajo, a la zona de subir el chat (sin sesión muestra el aviso de registro).
  const irASubirChat = (e) => {
    e.preventDefault();
    trackEvent('porra_pagina_cta');
    navigate('/');
    let intentos = 0;
    const bajar = () => {
      const zona = document.getElementById('upload-section');
      if (zona) zona.scrollIntoView({ behavior: 'smooth' });
      else if (intentos++ < 10) setTimeout(bajar, 200);
    };
    setTimeout(bajar, 150);
  };
  const muestra = [...PREGUNTAS_RONDA_1.slice(0, 2), ...t.preguntasRonda2.slice(0, 4)];

  useEffect(() => {
    const anterior = document.title;
    document.title = `${c.titulo} · El juego de tu grupo de WhatsApp | ChatSalsa`;
    return () => { document.title = anterior; };
  }, [c.titulo]);

  const cta = (texto) => (
    <a href="/" className="porra-cta-btn" onClick={irASubirChat}>
      {t.emoji} {texto} · {price}
    </a>
  );

  return (
    <div className={`porra-page tema-${t.id}`}>
      <div className="porra-decor" aria-hidden="true">{c.decor.map((e, i) => <span key={i}>{e}</span>)}</div>

      <header className="porra-hero">
        <span className="porra-page-badge">{t.emoji} {t.badge}</span>
        <h1>{c.titulo}</h1>
        <p className="porra-gancho">{c.gancho}</p>
        <p className="porra-intro">{c.intro}</p>
        {cta(c.ctaTexto)}
        <p className="porra-page-nota">Sube el chat, se analiza en tu navegador y te descargas los dos PDFs. Pago único por chat.</p>
      </header>

      {hayVideo && (
        <section className="porra-video">
          <video controls playsInline preload="metadata" src={c.video} onError={() => setHayVideo(false)}>
            <track kind="captions" />
          </video>
        </section>
      )}

      <section className="porra-bloque">
        <h2>Cómo se juega</h2>
        <ol className="porra-pasos">
          {c.pasos.map(([titulo, texto]) => (
            <li key={titulo}><strong>{titulo}.</strong> {texto}</li>
          ))}
        </ol>
      </section>

      <section className="porra-bloque">
        <h2>Algunas de las preguntas</h2>
        <ul className="porra-preguntas">
          {muestra.map((p) => <li key={p.id}>{p.texto}</li>)}
          <li className="porra-mas">… y {20 - muestra.length} más. La Ronda 1 la responden los números del chat; la Ronda 2, «{t.ronda2.toLowerCase()}», la IA de ChatSalsa.</li>
        </ul>
      </section>

      <section className="porra-bloque porra-final">
        <h2>{c.cierre}</h2>
        <p>
          Mismo proceso que el análisis de ChatSalsa: teléfonos, correos y enlaces se anonimizan en tu navegador, los nombres
          se sustituyen antes de enviar nada a la IA y los ficheros se borran al terminar. Los PDFs se generan en tu dispositivo.
        </p>
        {cta('Empezar')}
      </section>
    </div>
  );
};

export default PorraPage;
