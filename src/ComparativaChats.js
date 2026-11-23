// «Tu chat frente al resto»: compara este chat con todos los analizados en ChatSalsa (gratis, sin IA).
// Manda la ficha anónima de este chat (una vez) y pinta la comparación con los totales agregados.
// Solo se enseña cada dato cuando hay chats suficientes (20; 50 para chico/chica). De momento solo en castellano.
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { parseChat } from './libro/parser';
import { fichaAnonima, enviarFicha, percentil } from './utils/comparativa';
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

export default function ComparativaChats({ chatData }) {
  const ficha = useMemo(() => {
    try { return fichaAnonima(parseChat(typeof chatData === 'string' ? chatData : '')); } catch (e) { return null; }
  }, [chatData]);
  const [totales, setTotales] = useState(null);

  useEffect(() => {
    if (!ficha) return undefined;
    let vivo = true;
    (async () => {
      await enviarFicha(ficha, chatData, { apiUrl: API_URL });
      try {
        const r = await fetch(`${API_URL}/api/comparativa`);
        if (r.ok && vivo) setTotales(await r.json());
      } catch (e) { /* sin servidor no hay comparativa: la sección no se enseña */ }
    })();
    return () => { vivo = false; };
  }, [ficha, chatData]);

  const { numeros, genero } = filasComparativa(ficha, totales);
  if (!numeros.length && !genero.length) return null;

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
      </div>
      <p className="cmp-pie">
        Basado en {n(totales.chats)} chats. Solo guardamos contadores anónimos, nunca nombres ni mensajes. <Link to="/privacy">Más información</Link>
      </p>
    </div>
  );
}
