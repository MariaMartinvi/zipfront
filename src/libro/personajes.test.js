import { personajes } from './personajes';

const msg = (id, autor, hhmm, texto = 'hola') => {
  const fecha = new Date(`2026-02-13T${hhmm}:00`);
  return { id, fecha, dia: '2026-02-13', autor, texto, tipo: 'text' };
};

test('un mensaje con la hora desordenada no da tiempos de respuesta negativos', () => {
  // Pasa en chats reales (cambio de hora, mensajes reenviados en bloque): Eva "responde" antes de que le escriban
  const mensajes = [msg(0, 'Maria', '12:00'), msg(1, 'Eva', '10:00'), msg(2, 'Maria', '10:02'), msg(3, 'Eva', '10:05')];
  const { datos, porPersona } = personajes(mensajes);
  expect(datos.Eva.respuesta).toBe(3);
  expect(datos.Maria.respuesta).toBe(2);
  const textos = Object.values(porPersona).flat().map((c) => c.dato).join(' | ');
  expect(textos).not.toMatch(/-\d/);
});
