import { diasIntensos, records, equilibrio, antesYAhora, dinamicaGrupo } from './analisisExtra';
import { parseChat } from '../libro/parser';

const msg = (dia, hhmm, autor, texto = 'hola') => ({ fecha: new Date(`${dia}T${hhmm}:00`), dia, autor, tipo: 'text', texto });

test('días más intensos: los que más mensajes tienen, con quién escribió más', () => {
  const ms = [
    msg('2025-01-01', '10:00', 'Eva'),
    msg('2025-01-02', '10:00', 'Eva'), msg('2025-01-02', '10:01', 'Marcos'), msg('2025-01-02', '10:02', 'Marcos'),
    msg('2025-01-03', '10:00', 'Eva'), msg('2025-01-03', '10:01', 'Eva'),
  ];
  expect(diasIntensos(ms, 2)).toEqual([
    { dia: '2025-01-02', mensajes: 3, quien: 'Marcos' },
    { dia: '2025-01-03', mensajes: 2, quien: 'Eva' },
  ]);
});

test('récords: racha, silencio, mensaje largo y madrugada', () => {
  const largo = Array.from({ length: 25 }, (_, i) => `palabra${i}`).join(' ');
  const ms = [
    msg('2025-01-01', '10:00', 'Eva'), msg('2025-01-02', '10:00', 'Marcos'), msg('2025-01-03', '02:40', 'Eva'),
    msg('2025-01-10', '09:00', 'Marcos', largo), msg('2025-01-11', '01:15', 'Eva'),
  ];
  const r = records(ms);
  expect(r.racha).toEqual({ dias: 3, desde: '2025-01-01', hasta: '2025-01-03' });
  expect(r.silencio).toEqual({ dias: 6, desde: '2025-01-03', hasta: '2025-01-10' });
  expect(r.mensajeLargo).toEqual({ autor: 'Marcos', palabras: 25, dia: '2025-01-10' });
  expect(r.madrugada).toEqual({ autor: 'Eva', dia: '2025-01-03', hora: '02:40' });
  expect(r.diasHablando).toBe(5);
});

test('un solo día sin hablar no cuenta como silencio', () => {
  expect(records([msg('2025-01-01', '10:00', 'Eva'), msg('2025-01-03', '10:00', 'Marcos')]).silencio).toBeNull();
});

test('equilibrio y grupos: quien casi no escribe no cuenta', () => {
  const ms = [];
  for (let d = 1; d <= 9; d++) for (let i = 0; i < 12; i++) ms.push(msg(`2025-03-0${d}`, `10:${String(i * 2).padStart(2, '0')}`, i % 2 ? 'Eva' : 'Marcos'));
  ms.push(msg('2025-03-09', '23:00', 'evita'));
  expect(equilibrio(ms).map((p) => p.nombre)).toEqual(['Marcos', 'Eva']);
  expect(dinamicaGrupo(ms)).toBeNull();
});

test('récords: sin silencios ni mensajes largos no inventa nada', () => {
  const r = records([msg('2025-01-01', '10:00', 'Eva'), msg('2025-01-02', '11:00', 'Marcos')]);
  expect(r.silencio).toBeNull();
  expect(r.mensajeLargo).toBeNull();
  expect(r.madrugada).toBeNull();
  expect(records([])).toBeNull();
});

test('equilibrio: porcentaje de mensajes, quién empieza y cuánto tarda en contestar', () => {
  const ms = [];
  for (let d = 1; d <= 6; d++) {
    const dia = `2025-02-0${d}`;
    ms.push(msg(dia, '09:00', 'Eva'), msg(dia, '09:04', 'Marcos'), msg(dia, '09:05', 'Eva'));
  }
  const [eva, marcos] = equilibrio(ms);
  expect(eva).toMatchObject({ nombre: 'Eva', pctMensajes: 67, pctInicia: 100, respuestaMin: 1 });
  expect(marcos).toMatchObject({ nombre: 'Marcos', pctMensajes: 33, pctInicia: 0, respuestaMin: 4 });
});

test('equilibrio: una hora desordenada no da tiempos negativos', () => {
  const ms = [msg('2025-02-01', '12:00', 'Eva'), msg('2025-02-01', '10:00', 'Marcos')];
  expect(equilibrio(ms).every((p) => p.respuestaMin === null)).toBe(true);
});

test('antes y ahora: solo con chats de al menos 180 días', () => {
  expect(antesYAhora([msg('2025-01-01', '10:00', 'Eva'), msg('2025-03-01', '10:00', 'Eva')])).toBeNull();
  const ms = [];
  for (let i = 0; i < 90; i++) ms.push({ ...msg('2025-01-01', '09:00', 'Eva'), fecha: new Date(2025, 0, 1 + i, 9, 0) }, { ...msg('2025-01-01', '09:05', 'Marcos'), fecha: new Date(2025, 0, 1 + i, 9, 5) }, { ...msg('2025-01-01', '09:06', 'Eva'), fecha: new Date(2025, 0, 1 + i, 9, 6) });
  for (let i = 0; i < 90; i++) ms.push({ ...msg('2025-09-01', '22:00', 'Marcos'), fecha: new Date(2025, 8, 1 + i, 22, 0) });
  const r = antesYAhora(ms);
  expect(r.antes).toEqual({ porDia: 3, horaPunta: '9:00', quien: 'Eva', pctQuien: 67 });
  expect(r.ahora).toEqual({ porDia: 1, horaPunta: '22:00', quien: 'Marcos', pctQuien: 100 });
});

test('grupos: quién contesta a quién y quién reaviva; en parejas no sale', () => {
  expect(dinamicaGrupo([msg('2025-01-01', '10:00', 'Eva'), msg('2025-01-01', '10:01', 'Marcos')])).toBeNull();
  const ms = [
    msg('2025-01-01', '10:00', 'Eva'), msg('2025-01-01', '10:01', 'Marcos'), msg('2025-01-01', '10:02', 'Eva'), msg('2025-01-01', '10:03', 'Marcos'),
    msg('2025-01-01', '10:04', 'Sara'),
    msg('2025-01-05', '18:00', 'Sara'), msg('2025-01-09', '18:00', 'Sara'), msg('2025-01-12', '18:00', 'Eva'),
  ];
  const r = dinamicaGrupo(ms);
  expect(r.pares[0]).toEqual({ quien: 'Marcos', aQuien: 'Eva', veces: 2 });
  expect(r.reaviva[0]).toEqual({ nombre: 'Sara', veces: 2 });
});

// Grupo de iPhone creado en 2011 y exportado en 2026: la línea «X creó el grupo» lleva la fecha de 2011
// y salía «5171 días de silencio, el más largo» (23-11-2026). Los avisos del grupo no son conversación.
test('los avisos de creación del grupo no cuentan para el silencio más largo', () => {
  const L = '‎';
  const chat = [
    `[3/12/11, 17:02:51] Amigas: ${L}Los mensajes y las llamadas están cifrados de extremo a extremo.`,
    `[3/12/11, 17:02:51] Noemí: ${L}Noemí creó este grupo.`,
    `[3/12/11, 17:02:51] Amigas: ${L}Se te añadió al grupo.`,
    `[3/12/11, 17:02:52] Eva Pan: ${L}Eva Pan creó el grupo “Amigas”`,
    '[14/4/26, 10:00:00] Eva Pan: Hola',
    '[15/4/26, 10:00:00] Noemí: Hola!',
    '[20/4/26, 10:00:00] Maria: Ey',
  ].join('\n');
  const rec = records(parseChat(chat));
  expect(rec.silencio).toEqual({ dias: 4, desde: '2026-04-15', hasta: '2026-04-20' });
});
