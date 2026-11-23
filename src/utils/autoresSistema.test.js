import { quitarAutoresSistema } from './autoresSistema';

const LRM = '‎';
const m = (nombre, mensaje) => ({ nombre, mensaje });

// Grupo exportado desde iPhone (castellano): los avisos van firmados con el nombre del grupo (23-11-2026).
test('el nombre del grupo, que solo firma avisos del sistema, no cuenta como persona', () => {
  const mensajes = [
    m('Regalo cumpleaños Sara', `${LRM}Los mensajes y las llamadas están cifrados de extremo a extremo.`),
    m('Regalo cumpleaños Sara', `${LRM}Raquel Vaz creó el grupo “Regalo cumpleaños Sara”.`),
    m('Regalo cumpleaños Sara', `${LRM}Raquel Vaz te añadió.`),
    m('Raquel Vaz', 'Hola! qué le regalamos?'),
    m('Rocio', `${LRM}imagen omitida`),
    m('Rocio', 'Esto?'),
  ];
  expect([...new Set(quitarAutoresSistema(mensajes).map((x) => x.nombre))]).toEqual(['Raquel Vaz', 'Rocio']);
});

test('en un chat de dos, el aviso de cifrado va con el nombre del otro: se queda', () => {
  const mensajes = [
    m('Marcos', `${LRM}Los mensajes y las llamadas están cifrados de extremo a extremo.`),
    m('Marcos', 'Hola'),
    m('Lucía', 'Hola!'),
  ];
  expect(quitarAutoresSistema(mensajes)).toHaveLength(3);
});

test('alguien que solo mandó fotos o audios sigue siendo una persona', () => {
  const mensajes = [
    m('Ana', `${LRM}imagen omitida`),
    m('Ana', `${LRM}audio omitido`),
    m('Pedro', 'Qué foto!'),
  ];
  expect(quitarAutoresSistema(mensajes)).toHaveLength(3);
});
