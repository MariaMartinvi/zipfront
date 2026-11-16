import { librosEjemplo } from './muestra';

// Qué secciones se ven de verdad al pintar el HTML (con todas sus reglas CSS), no lo que dice el texto
const seccionesVisibles = (html) => {
  document.open(); document.write(html); document.close();
  return [...document.querySelectorAll('section')].filter((s) => getComputedStyle(s).display !== 'none').map((s) => s.className);
};

test('tres libros de ejemplo, cada uno con portada y dos dobles páginas de chat', () => {
  const libros = librosEjemplo();
  expect(libros.map((l) => l.titulo)).toEqual(['Familia Pérez', 'Te echaremos de menos', 'Eva & Marcos']);
  libros.forEach((l) => {
    expect(seccionesVisibles(l.portada)).toEqual(['cover']);
    expect(l.dobles.map((d) => [seccionesVisibles(d.izq), seccionesVisibles(d.dcha)])).toEqual([
      [['chapter-open'], ['chapter-body']], [['chapter-open'], ['chapter-body']],
    ]);
  });
});

test('solo chat: sin personajes ni "En números", y con la foto en el segundo capítulo', () => {
  librosEjemplo().forEach((l) => {
    const todo = l.portada + l.dobles.map((d) => d.izq + d.dcha).join('');
    expect(todo).not.toContain('class="people"');
    expect(todo).not.toContain('class="stats"');
    expect(l.dobles[1].dcha).toMatch(/<img src="\/libro\/(familia|companeras|pareja)\.jpg"\/>/);
  });
});

test('los textos de cada libro', () => {
  const [familia, trabajo, pareja] = librosEjemplo();
  expect(familia.dobles[0].izq).toContain('La comida de Navidad');
  expect(trabajo.portada).toContain('Para Carmen, después de 32 años');
  expect(trabajo.dobles[1].izq).toContain('La despedida');
  expect(pareja.dobles[1].dcha).toContain('Volveremos');
});
