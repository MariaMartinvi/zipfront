import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPorraPricing } from './utils/pricing';
import { TEMAS, temaValido, PREGUNTAS_RONDA_1 } from './utils/porra';
import { trackEvent } from './utils/analytics';
import { useAuth } from './AuthContext';
import { canUsePorra, purchasePorra } from './firebase_auth';
import './PorraPage.css';

// Landings de los dos juegos (solo castellano). Los vídeos los sube Maria a public/videos/.
const CONTENIDO = {
  halloween: {
    video: '/videos/porra-halloween.mp4',
    titulo: 'El Juego de Halloween',
    gancho: 'Tu grupo de WhatsApp esconde cosas. Esta noche salen todas.',
    intro:
      'Veinte preguntas de miedo sobre vuestro grupo. Cada uno apuesta quién es el fantasma, quién moriría el primero ' +
      'en la peli, quién es el vampiro emocional. Luego el acta del moderador revela la verdad, con pruebas sacadas del chat.',
    decor: ['🎃', '👻', '🦇', '🕸️', '💀'],
    iconos: ['🖨️', '🕯️', '💀'],
    pasos: [
      ['Imprime', 'una hoja de preguntas por víctima y el acta del moderador, solo una. Luz baja, velas opcionales.'],
      ['Apostad', 'cada uno escribe quién cree que es la respuesta. Sin mirar el chat. Sin piedad.'],
      ['Revelad', 'el moderador lee las respuestas reales una a una, con la prueba del chat. Un punto por acierto. Quien más acierte sobrevive.'],
    ],
    cierre: 'Lo que el grupo lleva años callando, resuelto en una noche.',
    ctaTexto: 'Crear el Juego de Halloween',
  },
  navidad: {
    video: '/videos/porra-navidad.mp4',
    titulo: 'El Juego de Navidad',
    gancho: 'La familia reunida. El cuñao calentando. La abuela con un consejo. Y el chat del grupo, que lo sabe todo.',
    intro:
      'Veinte preguntas sobre vuestro grupo de WhatsApp para poner sobre la mesa entre el entrante y el turrón. Cada uno ' +
      'apuesta quién es quién, y el acta del moderador revela las respuestas reales con el dato que lo demuestra. ' +
      'Se discute, se niega, se enseña el chat. Y se ríe.',
    decor: ['🎄', '🍗', '🎁', '🥂', '🧑‍🎄'],
    iconos: ['🖨️', '🍗', '🎁'],
    pasos: [
      ['Imprime', 'una hoja de preguntas por comensal y el acta del moderador, solo una. Que la guarde quien no haga trampas.'],
      ['Apostad', 'entre plato y plato, cada uno escribe quién cree que es la respuesta. Sin mirar el chat. Sin consultar a la cuñada.'],
      ['Revelad', 'en el postre, el moderador lee las respuestas reales con su dato. Un punto por acierto. Quien más acierte elige la peli.'],
    ],
    cierre: 'Las peleas de siempre, pero con pruebas.',
    ctaTexto: 'Crear el Juego de Navidad',
  },
};

const PorraPage = ({ tema = 'navidad' }) => {
  const t = TEMAS[temaValido(tema)];
  const c = CONTENIDO[t.id];
  const [hayVideo, setHayVideo] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [comprando, setComprando] = useState(false);
  const { price } = getPorraPricing();
  const muestra = [...PREGUNTAS_RONDA_1.slice(0, 2), ...t.preguntasRonda2.slice(0, 4)];

  useEffect(() => {
    const anterior = document.title;
    document.title = `${c.titulo} · El juego de tu grupo de WhatsApp | ChatSalsa`;
    // Tipografía de fiesta solo en esta página
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = t.fuenteUrl;
    document.head.appendChild(link);
    return () => { document.title = anterior; document.head.removeChild(link); };
  }, [c.titulo, t.fuenteUrl]);

  // Con sesión y el juego ya comprado: a la portada, a la tarjeta del juego (o al cajón de subir el chat).
  // Con sesión sin comprar: directo a Stripe. Sin sesión: a la portada, al aviso de registro.
  const bajarA = (ids) => {
    let intentos = 0;
    const bajar = () => {
      const zona = ids.map((id) => document.getElementById(id)).find(Boolean);
      if (zona) zona.scrollIntoView({ behavior: 'smooth' });
      else if (intentos++ < 10) setTimeout(bajar, 200);
    };
    setTimeout(bajar, 150);
  };

  const irASubirChat = async (e) => {
    e.preventDefault();
    trackEvent('porra_pagina_cta');
    if (user?.uid) {
      setComprando(true);
      try {
        const credito = await canUsePorra(user.uid, t.id);
        if (credito.canUse) {
          navigate('/');
          bajarA([`porra-${t.id}`, 'upload-section']);
          return;
        }
        trackEvent('porra_click');
        await purchasePorra(user.uid, t.id);
        return;
      } catch (err) {
        setComprando(false);
      }
    }
    navigate('/');
    bajarA(['upload-section']);
  };

  const cta = (texto) => (
    <a href="/" className="porra-cta-btn" onClick={irASubirChat} aria-disabled={comprando}>
      {t.emoji} {comprando ? 'Un momento…' : texto} · {price}
    </a>
  );

  return (
    <div className={`porra-page tema-${t.id}`} style={{ '--fuente-fiesta': `'${t.fuente}', cursive` }}>
      <header className="porra-hero">
        <picture className="porra-hero-img">
          <source media="(max-width: 700px)" srcSet={t.imagenV} />
          <img src={t.imagenH} alt="" loading="eager" />
        </picture>
        <div className="porra-hero-velo" aria-hidden="true" />
        <div className="porra-hero-contenido">
          <span className="porra-page-badge">{t.emoji} {t.badge}</span>
          <h1>{c.titulo}</h1>
          <p className="porra-gancho">{c.gancho}</p>
          {cta(c.ctaTexto)}
          <p className="porra-page-nota">
            {user ? 'Pago seguro con Stripe · Después subes el chat y descargas los dos PDFs · Un juego por chat'
                  : 'Regístrate gratis, sube el chat y descarga los dos PDFs · Pago único por chat'}
          </p>
        </div>
      </header>

      <section className="porra-bloque porra-intro-bloque">
        <p className="porra-intro">{c.intro}</p>
      </section>

      {hayVideo && (
        <section className="porra-bloque porra-video">
          <video controls playsInline preload="metadata" src={c.video} onError={() => setHayVideo(false)}>
            <track kind="captions" />
          </video>
        </section>
      )}

      <section className="porra-bloque">
        <h2>Cómo se juega</h2>
        <div className="porra-pasos">
          {c.pasos.map(([titulo, texto], i) => (
            <div className="porra-paso" key={titulo}>
              <span className="porra-paso-icono" aria-hidden="true">{c.iconos[i]}</span>
              <h3>{i + 1}. {titulo}</h3>
              <p>{texto}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="porra-bloque">
        <h2>Algunas de las preguntas</h2>
        <div className="porra-preguntas">
          {muestra.map((p) => (
            <div className="porra-pregunta" key={p.id}><span className="porra-pregunta-num">{p.id}</span>{p.texto}</div>
          ))}
        </div>
        <p className="porra-mas">… y {20 - muestra.length} más. La Ronda 1 la responden los números del chat; la Ronda 2, «{t.ronda2.toLowerCase()}», la IA de ChatSalsa.</p>
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
