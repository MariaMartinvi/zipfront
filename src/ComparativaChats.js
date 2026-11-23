// «Tu chat frente al resto»: compara este chat con todos los analizados en ChatSalsa (gratis, sin IA).
// Manda la ficha anónima de este chat (una vez) y pinta la comparación con los totales agregados.
// Solo se enseña cada dato cuando hay chats suficientes (20, también para chico/chica). De momento solo en castellano.
// La parte de IA sale de la línea COMPARATIVA_DATA del análisis IA: solo la ve quien lo tiene (ha pagado), desde 10 chats.
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { parseChat } from './libro/parser';
import { fichaAnonima, fichaIA, enviarFicha, percentil } from './utils/comparativa';
import { duracion } from './AnalisisExtra';
import './AnalisisExtra.css';
import './ComparativaChats.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000';
const n = (x) => x.toLocaleString('es-ES');

// Cómo contar cada número: [título, cómo se ve tu valor, frase si estáis por encima, frase si estáis por debajo]
export const NUMEROS = {
  msgDiaMiembro: ['Mensajes al día por persona', (v) => n(v), 'Habláis más que el', 'Habláis menos que el'],
  recordDiaMiembro: ['Récord de un día, por persona', (v) => n(v), 'Vuestro récord supera al del', 'Vuestro récord es menor que el del'],
  racha: ['Días seguidos hablando', (v) => n(v), 'Una racha más larga que la del', 'Una racha más corta que la del'],
  silencio: ['El silencio más largo', (v) => (v ? `${n(v)} días` : 'ninguno'), 'Un silencio más largo que el del', 'Un silencio más corto que el del'],
  respuestaMin: ['Tiempo de respuesta', (v) => duracion(v), 'Contestáis más despacio que el', 'Contestáis más rápido que el'],
  madrugadaPct: ['Mensajes de madrugada', (v) => `${n(v)} %`, 'Trasnocháis más que el', 'Trasnocháis menos que el'],
  palabrasMsg: ['Palabras por mensaje', (v) => n(v), 'Mensajes más largos que los del', 'Mensajes más cortos que los del'],
  emojis100: ['Emojis cada 100 mensajes', (v) => n(v), 'Más emojis que el', 'Menos emojis que el'],
  palabrotas100: ['Palabrotas cada 100 mensajes', (v) => n(v), 'Más malhablados que el', 'Más finos que el'],
  risas100: ['Risas cada 100 mensajes', (v) => n(v), 'Os reís más que el', 'Os reís menos que el'],
};

export const GENERO = {
  masEscribe: 'Quien más escribe',
  empieza: 'Quien empieza las conversaciones',
  masMalhablado: 'Quien dice más palabrotas',
  comico: 'Quien más hace reír',
  carinoso: 'Quien pone más cariño',
  tardaMas: 'Quien más tarda en contestar',
  trasnochador: 'Quien más trasnocha',
};

/** Filas que se pueden enseñar con los totales que hay. Separado del componente para poder probarlo. */
export function filasComparativa(ficha, totales) {
  if (!ficha || !totales) return { numeros: [], genero: [] };
  const numeros = Object.entries(NUMEROS).flatMap(([k, [titulo, valor, mas, menos]]) => {
    const v = ficha.numeros[k];
    const cuentas = totales.numeros[k] || [];
    const total = cuentas.reduce((a, b) => a + b, 0);
    if (v == null || total < totales.minimos.numeros) return [];
    const p = percentil(v, totales.tramos[k], cuentas);
    const arriba = p >= 50;
    return [{ clave: k, titulo, valor: valor(v), pct: p, frase: `${arriba ? mas : menos} ${arriba ? p : 100 - p} % de los chats` }];
  });
  const genero = Object.entries(GENERO).flatMap(([k, titulo]) => {
    const { chico = 0, chica = 0 } = totales.genero[k] || {};
    if (chico + chica < totales.minimos.genero) return [];
    const pctChica = Math.round((chica / (chico + chica)) * 100);
    return [{ clave: k, titulo, tuyo: ficha.genero[k] || null, pctChica, pctChico: 100 - pctChica }];
  });
  return { numeros, genero };
}

const NOMBRES_IA = {
  temas: { planes: 'Planes y quedadas', trabajo_estudios: 'Trabajo y estudios', familia: 'Familia', amor_pareja: 'Amor y pareja', amistad: 'Amistad', humor: 'Humor y memes', cotilleo: 'Cotilleos', ocio: 'Ocio: series, música, deporte', comida: 'Comida', viajes: 'Viajes', dinero_compras: 'Dinero y compras', desahogo: 'Desahogos' },
  momento: { celebracion: 'Una celebración', viaje: 'Un viaje', reencuentro: 'Un reencuentro', noticia_importante: 'Una noticia importante', plan_especial: 'Un plan especial', reconciliacion: 'Una reconciliación', apoyo: 'Un momento de apoyo', broma: 'Una broma épica', declaracion: 'Una declaración' },
  recomendacion: { escuchar_mas: 'Escuchar más', repartir_iniciativa: 'Repartir la iniciativa', expresar_carino: 'Expresar más el cariño', hablar_claro: 'Hablar más claro', resolver_conflictos: 'Resolver los conflictos', mas_planes_juntos: 'Hacer más planes juntos', respetar_espacio: 'Respetar el espacio', responder_antes: 'Contestar antes' },
  rasgos: { divertido: 'Divertido', carinoso: 'Cariñoso', organizador: 'Organizador', protector: 'Protector', ironico: 'Irónico', reflexivo: 'Reflexivo', impulsivo: 'Impulsivo', positivo: 'Positivo', critico: 'Crítico', reservado: 'Reservado', hablador: 'Hablador', detallista: 'Detallista', independiente: 'Independiente', empatico: 'Empático', competitivo: 'Competitivo' },
  dinamica: { apoyo_mutuo: 'Apoyo mutuo', complicidad: 'Complicidad', cooperacion: 'Cooperación', rutina: 'Rutina', tension: 'Tensión', desconexion: 'Desconexión' },
};

/** Filas de la parte de IA. Vacía si este chat no tiene análisis IA o aún no hay 10 chats con IA. */
export function filasIA(ficha, ia) {
  if (!ficha || !ia || ia.chats < ia.minimo) return [];
  const pct = (x, total) => Math.round((x / (total || 1)) * 100);
  const top = (campo, total, n = 3) => Object.entries(ia[campo] || {}).filter(([k, v]) => v > 0 && NOMBRES_IA[campo][k])
    .sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => `${NOMBRES_IA[campo][k]} (${pct(v, total)} %)`).join(', ');
  const filas = [];
  const simple = (campo, titulo, frase, total = ia.n[campo]) => {
    const v = ficha[campo];
    if (!v || !NOMBRES_IA[campo][v] || !total) return;
    filas.push({ clave: campo, titulo, tuyo: NOMBRES_IA[campo][v], frase: frase(pct(ia[campo][v] || 0, total)), extra: `Lo más habitual: ${top(campo, total)}` });
  };
  if (ficha.temas && ia.n.temas) {
    const [t] = ficha.temas;
    filas.push({ clave: 'temas', titulo: 'De qué habláis', tuyo: ficha.temas.map((x) => NOMBRES_IA.temas[x]).join(' · '),
      frase: `«${NOMBRES_IA.temas[t]}» sale entre los temas principales del ${pct(ia.temas[t] || 0, ia.n.temas)} % de los chats`,
      extra: `Lo más hablado en todos los chats: ${top('temas', ia.n.temas)}` });
  }
  if (ficha.nota && ia.n.nota) {
    const cuentas = Array.from({ length: 10 }, (_, i) => ia.nota[String(i + 1)] || 0);
    const p = percentil(ficha.nota, [2, 3, 4, 5, 6, 7, 8, 9, 10], cuentas);
    const media = cuentas.reduce((a, c, i) => a + c * (i + 1), 0) / ia.n.nota;
    filas.push({ clave: 'nota', titulo: 'Nota de la relación', tuyo: `${ficha.nota}/10`,
      frase: p >= 50 ? `Más alta que la del ${p} % de los chats` : `Más baja que la del ${100 - p} % de los chats`,
      extra: `Media de todos los chats: ${media.toFixed(1).replace('.', ',')}` });
  }
  simple('dinamica', 'Vuestra dinámica', (p) => `Como en el ${p} % de los chats`);
  if (ficha.momento !== 'ninguno') simple('momento', 'Vuestro momento más memorable', (p) => `Como en el ${p} % de los chats`);
  if (ficha.rasgos && ia.personas) {
    const unicos = [...new Set(ficha.rasgos)];
    filas.push({ clave: 'rasgos', titulo: 'Vuestros rasgos principales', tuyo: unicos.map((x) => NOMBRES_IA.rasgos[x]).join(' · '),
      frase: `«${NOMBRES_IA.rasgos[unicos[0]]}» es el rasgo principal del ${pct(ia.rasgos[unicos[0]] || 0, ia.personas)} % de las personas`,
      extra: `Los rasgos más comunes: ${top('rasgos', ia.personas)}` });
  }
  simple('recomendacion', 'Lo que os recomendamos', (p) => `Se lo recomendamos al ${p} % de los chats`);
  return filas;
}

export default function ComparativaChats({ chatData, aiResponse }) {
  const ficha = useMemo(() => {
    try { return fichaAnonima(parseChat(typeof chatData === 'string' ? chatData : '')); } catch (e) { return null; }
  }, [chatData]);
  const fichaIa = useMemo(() => fichaIA(aiResponse), [aiResponse]);
  const [totales, setTotales] = useState(null);

  useEffect(() => {
    if (!ficha && !fichaIa) return undefined;
    let vivo = true;
    (async () => {
      await enviarFicha(ficha, chatData, { apiUrl: API_URL });
      await enviarFicha(fichaIa, chatData, { apiUrl: API_URL, ia: true });
      try {
        const r = await fetch(`${API_URL}/api/comparativa`);
        if (r.ok && vivo) setTotales(await r.json());
      } catch (e) { /* sin servidor no hay comparativa: la sección no se enseña */ }
    })();
    return () => { vivo = false; };
  }, [ficha, fichaIa, chatData]);

  const { numeros, genero } = filasComparativa(ficha, totales);
  const ia = filasIA(fichaIa, totales && totales.ia);
  if (!numeros.length && !genero.length && !ia.length) return null;

  return (
    <div className="ax cmp">
      <span className="analysis-badge">Comparativa</span>
      <h2 className="analysis-title">Tu chat frente al resto</h2>
      <p className="analysis-description">Cómo es vuestra conversación comparada con todos los chats analizados en ChatSalsa.</p>

      <div className="ax-rejilla">
        {numeros.length > 0 && (
          <section className="ax-tarjeta ax-ancha">
            <h3>Vuestros números</h3>
            <ul className="cmp-numeros">
              {numeros.map((f) => (
                <li key={f.clave}>
                  <div className="cmp-titulo"><b>{f.titulo}</b><strong>{f.valor}</strong></div>
                  <div className="cmp-escala" aria-hidden="true"><i style={{ left: `${f.pct}%` }} /></div>
                  <p>{f.frase}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {genero.length > 0 && (
          <section className="ax-tarjeta ax-ancha">
            <h3>¿Chico o chica?</h3>
            <p className="cmp-nota">Lo deducimos por el nombre del contacto; si no está claro, ese chat no cuenta aquí.</p>
            <ul className="cmp-genero">
              {genero.map((f) => (
                <li key={f.clave}>
                  <div className="cmp-titulo">
                    <b>{f.titulo}</b>
                    {f.tuyo && <span>En tu chat: <b>{f.tuyo === 'chico' ? 'un chico' : 'una chica'}</b></span>}
                  </div>
                  <div className="cmp-reparto" aria-label={`${f.pctChico} % chicos, ${f.pctChica} % chicas`}>
                    <i className="chico" style={{ width: `${f.pctChico}%` }} /><i className="chica" style={{ width: `${f.pctChica}%` }} />
                  </div>
                  <p>En todos los chats: {f.pctChico} % un chico · {f.pctChica} % una chica</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {ia.length > 0 && (
          <section className="ax-tarjeta ax-ancha">
            <h3>Según el análisis IA</h3>
            <ul className="cmp-ia">
              {ia.map((f) => (
                <li key={f.clave}>
                  <div className="cmp-titulo"><b>{f.titulo}</b><strong>{f.tuyo}</strong></div>
                  <p className="cmp-frase">{f.frase}</p>
                  <p>{f.extra}</p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
      <p className="cmp-pie">
        Basado en {n(totales.chats)} chats{ia.length > 0 && <> ({n(totales.ia.chats)} con análisis IA)</>}. Solo guardamos contadores anónimos, nunca nombres ni mensajes. <Link to="/privacy">Más información</Link>
      </p>
    </div>
  );
}
