import { renderHTML } from './render';

const mensajes = [
  { id: 0, fecha: new Date('2026-02-13T10:00:00'), dia: '2026-02-13', autor: 'Eva', texto: 'hola', tieneTexto: true, tipo: 'text' },
  { id: 1, fecha: new Date('2026-02-13T10:02:00'), dia: '2026-02-13', autor: 'Maria', texto: 'qué tal', tieneTexto: true, tipo: 'text' },
];
const man = { titulo: 'Eva & Maria', capitulos: [{ titulo: 'El cumple', desde: '2026-02-13', hasta: '2026-02-13', on: true, mensajes: [0, 1] }] };

test('por defecto el libro lleva la página de personajes', () => {
  expect(renderHTML(mensajes, man).body).toContain('class="people"');
});

test('se puede quitar la página de personajes', () => {
  const { body } = renderHTML(mensajes, man, { conPersonajes: false });
  expect(body).not.toContain('class="people"');
  expect(body).toContain('El cumple');
});
