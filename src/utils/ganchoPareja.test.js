import { ganchoPareja } from './ganchoPareja';

const msg = (dia, hhmm, autor) => ({ fecha: new Date(`${dia}T${hhmm}:00`), dia, autor, tipo: 'text', texto: 'hola' });

// 10 días: Lucía abre cada día y escribe 2 de cada 3 mensajes; Marcos contesta en 5 min, Lucía en 1 min.
function pareja() {
  const ms = [];
  for (let d = 1; d <= 10; d++) {
    const dia = `2025-03-${String(d).padStart(2, '0')}`;
    ms.push(msg(dia, '10:00', 'Lucía'), msg(dia, '10:05', 'Marcos'), msg(dia, '10:06', 'Lucía'));
  }
  return ms;
}

test('frase con quién escribe más, quién empieza y cuánto tarda cada uno', () => {
  expect(ganchoPareja(pareja())).toBe('Lucía escribe el 67 % de los mensajes y empieza el 100 % de las conversaciones; Lucía contesta en 1 min y Marcos en 5 min.');
});

test('si empieza más la otra persona, se nombra', () => {
  const ms = [];
  for (let d = 1; d <= 10; d++) {
    const dia = `2025-03-${String(d).padStart(2, '0')}`;
    ms.push(msg(dia, '10:00', 'Marcos'), msg(dia, '10:01', 'Lucía'), msg(dia, '10:02', 'Lucía'), msg(dia, '10:05', 'Marcos'), msg(dia, '10:06', 'Lucía'));
  }
  expect(ganchoPareja(ms)).toMatch(/^Lucía escribe el 60 % de los mensajes; Marcos empieza el 100 % de las conversaciones/);
});

test('grupos y chats cortos: nada', () => {
  const grupo = pareja().concat(pareja().map((m) => ({ ...m, autor: 'Eva' })));
  expect(ganchoPareja(grupo)).toBeNull();
  expect(ganchoPareja(pareja().slice(0, 10))).toBeNull();
});
