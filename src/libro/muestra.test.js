import { paginasMuestra, libroAbierto } from './muestra';

// Qué secciones se ven de verdad al pintar el HTML (con todas sus reglas CSS), no lo que dice el texto
const seccionesVisibles = (html) => {
  document.open(); document.write(html); document.close();
  return [...document.querySelectorAll('section')].filter((s) => getComputedStyle(s).display !== 'none').map((s) => s.className);
};

test('cuatro páginas de muestra, y cada una enseña solo su página', () => {
  const paginas = paginasMuestra();
  expect(paginas.map((p) => p.titulo)).toEqual(['Portada', 'Capítulo', 'La conversación', 'Con vuestras fotos']);
  expect(paginas.map((p) => seccionesVisibles(p.html))).toEqual([['cover'], ['chapter-open'], ['chapter-body'], ['chapter-body']]);
  // las dos conversaciones son de capítulos distintos: la segunda es la de la foto
  document.open(); document.write(paginas[3].html); document.close();
  const visible = [...document.querySelectorAll('section')].find((s) => getComputedStyle(s).display !== 'none');
  expect(visible.querySelector('img')).not.toBeNull();
});

test('la muestra lleva título, capítulos y la foto, y no los personajes', () => {
  const html = paginasMuestra('/foto.jpg')[0].html;
  expect(html).toContain('Eva &amp; Marcos');
  expect(html).toContain("url('/foto.jpg')");
  expect(html).not.toContain('class="people"');
  expect(html).toContain('El día que salió bien');
  expect(html).toContain('Aquel verano en Roma');
  expect(html).toContain('<img src="/foto.jpg"/>');
  expect(html).toContain('Volveremos');
});

test('libro abierto: portada y tres dobles páginas, cada página con su sección', () => {
  const { portada, dobles } = libroAbierto();
  expect(seccionesVisibles(portada)).toEqual(['cover']);
  expect(dobles.map((d) => [seccionesVisibles(d.izq)[0], seccionesVisibles(d.dcha)[0]])).toEqual([
    ['chapter-open', 'chapter-body'], ['chapter-open', 'chapter-body'], ['stats', 'back'],
  ]);
  expect(dobles[1].dcha).toContain('<img src="/libro/pareja.jpg"/>');
});
