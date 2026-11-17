// Estadísticas gratis que se calculan en el navegador (sin IA): días más intensos, récords, equilibrio,
// antes y ahora y, en grupos, quién contesta a quién. De momento solo en castellano.
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { parseChat } from './libro/parser';
import { diasIntensos, records, equilibrio, antesYAhora, dinamicaGrupo } from './utils/analisisExtra';
import { trackProductoClick } from './utils/analytics';
import './AnalisisExtra.css';

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
export const fechaLarga = (dia) => { const [a, m, d] = dia.split('-').map(Number); return `${d} de ${MESES[m - 1]} de ${a}`; };
const diaSemana = (dia) => DIAS[new Date(`${dia}T12:00:00`).getDay()];
export const duracion = (min) => (min < 1 ? 'menos de 1 min' : min < 60 ? `${Math.round(min)} min` : `${(min / 60).toFixed(1).replace('.', ',')} h`);
const n = (x) => x.toLocaleString('es-ES');

export default function AnalisisExtra({ chatData }) {
  const navigate = useNavigate();
  const datos = useMemo(() => {
    try {
      const ms = parseChat(typeof chatData === 'string' ? chatData : '');
      if (ms.length < 20) return null;
      return { intensos: diasIntensos(ms, 5), rec: records(ms), eq: equilibrio(ms), aya: antesYAhora(ms), grupo: dinamicaGrupo(ms) };
    } catch (e) { return null; }
  }, [chatData]);
  if (!datos || !datos.rec) return null;
  const { intensos, rec, eq, aya, grupo } = datos;
  const max = intensos[0]?.mensajes || 1;

  return (
    <div className="ax">
      <span className="analysis-badge">Vuestros momentos</span>
      <h2 className="analysis-title">Récords y días más intensos</h2>
      <p className="analysis-description">Lo que cuentan las fechas y las horas de vuestra conversación.</p>

      <div className="ax-rejilla">
        <section className="ax-tarjeta ax-ancha">
          <h3>Vuestros días más intensos</h3>
          <ol className="ax-dias">
            {intensos.map((d) => (
              <li key={d.dia}>
                <div><b>{fechaLarga(d.dia)}</b><span>{diaSemana(d.dia)} · quien más escribió: {d.quien}</span></div>
                <div className="ax-barra"><i style={{ width: `${Math.max(8, (d.mensajes / max) * 100)}%` }} /></div>
                <strong>{n(d.mensajes)}</strong>
              </li>
            ))}
          </ol>
          <button type="button" className="ax-libro" onClick={() => { trackProductoClick('libro', 'resultados'); navigate('/libro'); }}>
            Esos días pueden ser los capítulos de vuestro libro →
          </button>
        </section>

        <section className="ax-tarjeta">
          <h3>Récords del chat</h3>
          <ul className="ax-records">
            <li><strong>{n(rec.racha.dias)}</strong><div><b>días seguidos hablando</b><span>del {fechaLarga(rec.racha.desde)} al {fechaLarga(rec.racha.hasta)}</span></div></li>
            {rec.silencio && <li><strong>{n(rec.silencio.dias)}</strong><div><b>días de silencio, el más largo</b><span>después del {fechaLarga(rec.silencio.desde)}</span></div></li>}
            {rec.mensajeLargo && <li><strong>{n(rec.mensajeLargo.palabras)}</strong><div><b>palabras, el mensaje más largo</b><span>de {rec.mensajeLargo.autor}, el {fechaLarga(rec.mensajeLargo.dia)}</span></div></li>}
            {rec.madrugada && <li><strong>{rec.madrugada.hora}</strong><div><b>el mensaje más trasnochador</b><span>de {rec.madrugada.autor}, el {fechaLarga(rec.madrugada.dia)}</span></div></li>}
          </ul>
        </section>

        <section className="ax-tarjeta">
          <h3>El equilibrio</h3>
          <ul className="ax-equilibrio">
            {eq.slice(0, 6).map((p) => (
              <li key={p.nombre}>
                <div className="ax-eq-nombre"><b>{p.nombre}</b><span>{p.pctMensajes} % de los mensajes</span></div>
                <div className="ax-barra"><i style={{ width: `${Math.max(4, p.pctMensajes)}%` }} /></div>
                <p>Empieza el {p.pctInicia} % de las conversaciones{p.respuestaMin != null && <> · suele contestar en {duracion(p.respuestaMin)}</>}</p>
              </li>
            ))}
          </ul>
        </section>

        {aya && (
          <section className="ax-tarjeta">
            <h3>Antes y ahora</h3>
            <div className="ax-aya">
              {[['Los primeros 3 meses', aya.antes], ['Los últimos 3 meses', aya.ahora]].map(([titulo, t]) => (
                <div key={titulo}>
                  <span>{titulo}</span>
                  <strong>{n(t.porDia)}</strong>
                  <p>mensajes al día</p>
                  <p>Hora punta: <b>{t.horaPunta}</b></p>
                  <p>Quien más escribe: <b>{t.quien}</b> ({t.pctQuien} %)</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {grupo && (grupo.pares.length > 0 || grupo.reaviva.length > 0) && (
          <section className="ax-tarjeta">
            <h3>La dinámica del grupo</h3>
            {grupo.pares.length > 0 && <>
              <h4>Quién contesta a quién</h4>
              <ul className="ax-lista">{grupo.pares.map((p) => <li key={p.quien + p.aQuien}><b>{p.quien}</b> a <b>{p.aQuien}</b><span>{n(p.veces)} veces</span></li>)}</ul>
            </>}
            {grupo.reaviva.length > 0 && <>
              <h4>Quién reaviva el grupo tras un día de silencio</h4>
              <ul className="ax-lista">{grupo.reaviva.map((p) => <li key={p.nombre}><b>{p.nombre}</b><span>{n(p.veces)} veces</span></li>)}</ul>
            </>}
          </section>
        )}
      </div>
    </div>
  );
}
