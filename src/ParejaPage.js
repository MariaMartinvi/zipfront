import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { canUsePareja, decrementParejaCredit, purchasePareja, leerSeguimientoPareja, guardarSeguimientoPareja } from './firebase_auth';
import { prepararChatPareja, getParejaAnalysis } from './fileService';
import { extractChatContent, anonimizarChat } from './utils/chatImport';
import { getParejaPricing } from './utils/pricing';
import { OBJETIVOS, textoObjetivo, clavePar, hoy, diasDesde, guardarEstado, leerEstado, borrarEstado } from './utils/pareja';
import { trackEvent, trackProductoClick } from './utils/analytics';
import UploadBox from './UploadBox';
import './ParejaPage.css';

const ESTILOS = [['divertido', '😄 Divertido'], ['carinoso', '🥰 Cariñoso'], ['coqueto', '😏 Coqueto'], ['atrevido', '🔥 Atrevido']];

const Copiar = ({ texto }) => {
  const [hecho, setHecho] = useState(false);
  return (
    <button type="button" className="pareja-copiar" onClick={() => {
      try { navigator.clipboard.writeText(texto); setHecho(true); setTimeout(() => setHecho(false), 1500); } catch (e) { /* sin portapapeles */ }
    }}>{hecho ? '✓ Copiado' : 'Copiar'}</button>
  );
};

export const Resultado = ({ a, otra, onNuevo }) => (
  <div className="pareja-resultado">
    {a.alerta_seguridad && (
      <div className="pareja-alerta">
        <strong>⚠️ Antes de nada: lo importante eres tú</strong>
        <p>{a.diagnostico}</p>
        <p>Si sientes miedo o control en esta relación, no estás sola ni solo. En España puedes llamar al <strong>016</strong> (gratuito, no deja rastro en la factura) o escribir a <strong>016-online@igualdad.gob.es</strong>. En una emergencia, al <strong>112</strong>.</p>
      </div>
    )}
    <section className="pareja-puntuacion">
      <div className="pareja-numero">{a.puntuacion}<span>/100</span></div>
      <div>
        <h3>Lo cerca que estás de tu objetivo</h3>
        {!a.alerta_seguridad && <p>{a.diagnostico}</p>}
      </div>
    </section>

    {a.evolucion && (
      <section className="pareja-bloque pareja-evolucion">
        <h3>📈 Tu evolución <span className="pareja-cambio">{a.evolucion.cambio}</span></h3>
        <p><strong>Lo que has aplicado:</strong> {a.evolucion.que_has_aplicado}</p>
        <p><strong>Lo que ha cambiado en {otra}:</strong> {a.evolucion.que_ha_cambiado_en_la_otra_persona}</p>
        <p><strong>Ajuste del plan:</strong> {a.evolucion.ajuste_del_plan}</p>
      </section>
    )}

    <div className="pareja-banderas">
      <div className="verde"><h4>🟢 Bandera verde</h4><p>{a.bandera_verde}</p></div>
      <div className="roja"><h4>🔴 Bandera roja</h4><p>{a.bandera_roja}</p></div>
    </div>

    {a.lo_que_hiciste_bien.length > 0 && (
      <section className="pareja-bloque">
        <h3>👏 Lo que hiciste bien</h3>
        {a.lo_que_hiciste_bien.map((m, i) => (
          <div className="pareja-momento" key={i}>
            <blockquote>«{m.tu_mensaje}»{m.fecha && <small> · {m.fecha}</small>}</blockquote>
            <p>{m.por_que_funciono}</p>
          </div>
        ))}
      </section>
    )}

    {a.momentos_mejorables.length > 0 && (
      <section className="pareja-bloque">
        <h3>✍️ Momentos en los que podrías haberlo dicho mejor</h3>
        {a.momentos_mejorables.map((m, i) => (
          <div className="pareja-momento" key={i}>
            <blockquote>«{m.tu_mensaje}»{m.fecha && <small> · {m.fecha}</small>}</blockquote>
            <p>{m.por_que_no_ayudo}</p>
            {m.alternativa && <p className="pareja-alternativa"><strong>Mejor así:</strong> «{m.alternativa}» <Copiar texto={m.alternativa} /></p>}
          </div>
        ))}
      </section>
    )}

    <section className="pareja-bloque pareja-tono">
      <div><h4>Tu tono ahora</h4><p>{a.tono_actual}</p></div>
      <span aria-hidden="true">→</span>
      <div><h4>El tono que te conviene</h4><p>{a.tono_recomendado}</p></div>
    </section>

    {a.plan_2_semanas.length > 0 && (
      <section className="pareja-bloque">
        <h3>🗓️ Tu plan para las próximas 2 semanas</h3>
        <ol className="pareja-plan">{a.plan_2_semanas.map((p, i) => <li key={i}>{p}</li>)}</ol>
      </section>
    )}

    {ESTILOS.some(([k]) => a.mensajes_ejemplo[k].length) && (
      <section className="pareja-bloque">
        <h3>💬 Mensajes listos para enviar</h3>
        <div className="pareja-estilos">
          {ESTILOS.filter(([k]) => a.mensajes_ejemplo[k].length).map(([k, titulo]) => (
            <div key={k} className="pareja-estilo">
              <h4>{titulo}</h4>
              {a.mensajes_ejemplo[k].map((m, i) => <p key={i}>«{m}» <Copiar texto={m} /></p>)}
            </div>
          ))}
        </div>
      </section>
    )}

    <button type="button" className="pareja-boton secundario" onClick={onNuevo}>Analizar otro chat</button>
  </div>
);

// "Consigue tu objetivo · Chat de pareja" (solo castellano)
const ParejaPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const precios = getParejaPricing();
  const [estado, setEstado] = useState(() => leerEstado() || {});
  const [credito, setCredito] = useState(null);
  const [anterior, setAnterior] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const actualizar = (cambios) => setEstado((e) => { const n = { ...e, ...cambios }; guardarEstado(n); return n; });

  useEffect(() => { trackProductoClick('doctor_amor', 'landing'); }, []);

  useEffect(() => {
    const anteriorTitulo = document.title;
    document.title = 'Consigue tu objetivo · Analiza tu chat de pareja | ChatSalsa';
    return () => { document.title = anteriorTitulo; };
  }, []);

  useEffect(() => {
    if (!user?.uid) return undefined;
    let vivo = true;
    canUsePareja(user.uid).then((r) => { if (vivo) setCredito(r); });
    return () => { vivo = false; };
  }, [user?.uid, estado.resultado]);

  const otraNombre = (estado.participantes || []).find((p) => p !== estado.usuarioNombre);

  useEffect(() => {
    if (!user?.uid || !estado.usuarioNombre || !otraNombre) { setAnterior(null); return undefined; }
    let vivo = true;
    clavePar(estado.usuarioNombre, otraNombre)
      .then((clave) => leerSeguimientoPareja(user.uid, clave))
      .then((r) => { if (vivo) setAnterior(r); })
      .catch(() => {});
    return () => { vivo = false; };
  }, [user?.uid, estado.usuarioNombre, otraNombre]);

  const paso = !user ? 'intro'
    : estado.resultado ? 'resultado'
    : !estado.procesado ? 'subir'
    : !estado.usuarioNombre ? 'quien'
    : !estado.objetivo ? 'objetivo'
    : 'paywall';

  useEffect(() => { if (paso === 'paywall' && credito && !credito.canUse) trackEvent('pareja_paywall'); }, [paso, credito]);

  const empezar = (ruta) => {
    try { localStorage.setItem('despues_login', '/pareja'); } catch (e) { /* sin localStorage */ }
    navigate(ruta);
  };

  const subir = async (file) => {
    if (!file) return;
    setError('');
    setCargando(true);
    try {
      let chat;
      if (/\.zip$/i.test(file.name) || /zip/.test(file.type)) {
        const JSZip = (await import('jszip')).default;
        const extraido = await extractChatContent(await new JSZip().loadAsync(file));
        if (!extraido.chat) throw new Error(extraido.error || 'No se encontró el chat dentro del zip');
        chat = extraido.chat;
      } else {
        chat = anonimizarChat(await file.text());
      }
      const { procesado, mapping, participantes } = prepararChatPareja(chat);
      if (participantes.length !== 2) {
        setError(participantes.length > 2
          ? `Este chat tiene ${participantes.length} participantes. Esta pantalla es para chats de dos personas; para grupos usa el análisis normal desde la portada.`
          : 'No hemos reconocido el chat. Exporta la conversación desde WhatsApp (sin medios) y vuelve a intentarlo.');
        return;
      }
      setEstado(() => { const n = { procesado, mapping, participantes }; guardarEstado(n); return n; });
    } catch (e) {
      setError(e.message || 'No se ha podido leer el archivo.');
    } finally {
      setCargando(false);
    }
  };

  const comprar = async (producto) => {
    trackEvent('pareja_click');
    setError('');
    setCargando(true);
    try {
      await purchasePareja(user.uid, producto);
    } catch (e) {
      setError(e.message === 'Producto no disponible' ? 'Este pago todavía no está disponible. Vuelve a intentarlo en un rato.' : 'No se ha podido iniciar el pago. Inténtalo de nuevo.');
      setCargando(false);
    }
  };

  const analizar = async () => {
    setError('');
    setCargando(true);
    try {
      const seguimiento = anterior ? { fecha: anterior.fecha, puntuacion: anterior.puntuacion, plan: anterior.plan } : null;
      const r = await getParejaAnalysis({ ...estado, otraNombre, seguimiento });
      if (!r.success) throw new Error(r.error);
      await decrementParejaCredit(user.uid);
      const clave = await clavePar(estado.usuarioNombre, otraNombre);
      await guardarSeguimientoPareja(user.uid, clave, { fecha: hoy(), puntuacion: r.analisis.puntuacion, plan: r.analisis.plan_2_semanas });
      trackEvent('pareja_resultado');
      actualizar({ resultado: r.analisis });
    } catch (e) {
      setError(e.message || 'No se ha podido generar el análisis.');
    } finally {
      setCargando(false);
    }
  };

  const nuevo = () => { borrarEstado(); setEstado({}); setError(''); };

  return (
    <div className="pareja">
      {paso === 'intro' ? (
        <header className="pareja-hero">
          <picture className="pareja-hero-img">
            <source media="(max-width: 700px)" srcSet="/img/pareja-v.jpg" />
            <img src="/img/pareja-h.jpg" alt="" loading="eager" />
          </picture>
          <div className="pareja-hero-velo" aria-hidden="true" />
          <div className="pareja-hero-contenido">
            <span className="pareja-etiqueta">💘 Doctor Amor · Chat de pareja</span>
            <h1>Consigue tu objetivo</h1>
            <p className="pareja-gancho">Tu chat con esa persona ya tiene la respuesta. El Doctor Amor te dice lo cerca que estás, qué cambiar y qué escribir.</p>
            <button type="button" className="pareja-boton pareja-cta" onClick={() => empezar('/register')}>Empezar · desde {precios.price}</button>
            <button type="button" className="pareja-enlace claro" onClick={() => empezar('/login')}>Ya tengo cuenta</button>
          </div>
        </header>
      ) : (
        <header className="pareja-cabecera">
          <span className="pareja-etiqueta">💘 Doctor Amor · Chat de pareja</span>
          <h1>Consigue tu objetivo</h1>
        </header>
      )}

      {error && <div className="pareja-error">{error}</div>}

      {paso === 'intro' && (
        <section className="pareja-intro">
          <div className="pareja-pasos-grid">
            <div><span>📲</span><h3>1. Sube el chat</h3><p>La conversación de WhatsApp con esa persona, sin medios. Se anonimiza en tu navegador.</p></div>
            <div><span>🎯</span><h3>2. Di qué quieres</h3><p>Saber si le gustas, que avance, mejorar, recuperar o saber si dejarlo.</p></div>
            <div><span>💌</span><h3>3. Recibe tu plan</h3><p>Puntuación, tus mejores y peores momentos, el tono que te conviene y mensajes listos para enviar.</p></div>
          </div>
          <p className="pareja-intro-nota">Desde {precios.price} por análisis · {precios.pack} con un mes de seguimiento y consejos a los 14 y 28 días</p>
        </section>
      )}

      {paso === 'subir' && (
        <section className="pareja-tarjeta pareja-subida">
          <UploadBox
            onFileUpload={(e) => subir(e.target.files[0])}
            skipIA={false}
            onSkipIAChange={() => {}}
            showAnalysis={false}
            titulo={cargando ? 'Leyendo el chat…' : 'Sube el chat con esa persona'}
            subtitulo="Exporta la conversación desde WhatsApp sin medios. Solo chats de dos personas."
            sinPrivacidad
          />
        </section>
      )}

      {paso === 'quien' && (
        <section className="pareja-tarjeta">
          <h2>¿Quién eres tú en este chat?</h2>
          <div className="pareja-opciones dos">
            {estado.participantes.map((p) => (
              <button key={p} type="button" className="pareja-opcion" onClick={() => actualizar({ usuarioNombre: p })}>{p}</button>
            ))}
          </div>
          <button type="button" className="pareja-enlace" onClick={nuevo}>Subir otro chat</button>
        </section>
      )}

      {paso === 'objetivo' && (
        <section className="pareja-tarjeta">
          <p className="pareja-confirmacion">Perfecto. Vamos a analizar tu chat con <strong>{otraNombre}</strong>.</p>
          <h2>¿Qué quieres con {otraNombre}?</h2>
          <div className="pareja-opciones">
            {OBJETIVOS.map((o) => (
              <button key={o.id} type="button" className="pareja-opcion" onClick={() => actualizar({ objetivo: o.id })}>
                <span>{o.emoji}</span> {textoObjetivo(o.id, otraNombre)}
              </button>
            ))}
          </div>
          <button type="button" className="pareja-enlace" onClick={() => actualizar({ usuarioNombre: null })}>Cambiar quién soy</button>
        </section>
      )}

      {paso === 'paywall' && (
        <section className="pareja-tarjeta">
          <h2>{anterior ? `Tu seguimiento con ${otraNombre}` : `Tu análisis con ${otraNombre} está listo`}</h2>
          <p className="pareja-objetivo">Objetivo: {textoObjetivo(estado.objetivo, otraNombre)} · <button type="button" className="pareja-enlace" onClick={() => actualizar({ objetivo: null })}>cambiar</button></p>
          {anterior && (
            <p className="pareja-anterior">
              Tu último análisis fue el {anterior.fecha} con {anterior.puntuacion}/100
              {diasDesde(anterior.fecha) !== null && diasDesde(anterior.fecha) < 14 ? '. Te recomendamos esperar a los 14 días para ver cambios reales.' : '. Vamos a ver cómo ha evolucionado.'}
            </p>
          )}
          <ul className="pareja-candados">
            <li>🔒 Lo cerca que estás de tu objetivo: <span className="pareja-tapado">██</span>/100</li>
            <li>🔒 Varios momentos en los que podrías haberlo dicho mejor</li>
            <li>🔒 Tu tono actual y el tono que te conviene</li>
            <li>🔒 Tu plan para las próximas 2 semanas y mensajes listos para enviar</li>
          </ul>
          {credito === null ? null : credito.canUse ? (
            <button type="button" className="pareja-boton" onClick={analizar} disabled={cargando}>
              {cargando ? '⏳ Analizando tu chat… (puede tardar un minuto)' : anterior ? 'Ver mi seguimiento' : 'Ver mi análisis'}
            </button>
          ) : (
            <div className="pareja-comprar">
              <button type="button" className="pareja-boton secundario" onClick={() => comprar('pareja')} disabled={cargando}>Ver mi análisis · {precios.price}</button>
              <button type="button" className="pareja-boton" onClick={() => comprar('pareja_pack')} disabled={cargando}>
                ⭐ Recomendado: 1 mes de seguimiento · {precios.pack}
                <small>Análisis + 2 seguimientos con consejos a los 14 y 28 días</small>
              </button>
            </div>
          )}
          <p className="pareja-privacidad">Tu chat se anonimiza en tu navegador antes de enviarse. Para el seguimiento guardamos tu puntuación, la fecha y tu plan; nunca los mensajes.</p>
        </section>
      )}

      {paso === 'resultado' && <Resultado a={estado.resultado} otra={otraNombre} onNuevo={nuevo} />}
    </div>
  );
};

export default ParejaPage;
