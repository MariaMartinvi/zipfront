import { paginasMuestra } from './muestra';

// Qué secciones se ven de verdad al pintar el HTML (con todas sus reglas CSS), no lo que dice el texto
const seccionesVisibles = (html) => {
  document.open(); document.write(html); document.close();
  return [...document.querySelectorAll('section')].filter((s) => getComputedStyle(s).display !== 'none').map((s) => s.className);
};

test('cuatro páginas de muestra, y cada una enseña solo su página', () => {
  const paginas = paginasMuestra();
  expect(paginas.map((p) => p.titulo)).toEqual(['Portada', 'Los personajes', 'Capítulo', 'La conversación']);
  expect(paginas.map((p) => seccionesVisibles(p.html))).toEqual([['cover'], ['people'], ['chapter-open'], ['chapter-body']]);
});

test('la muestra lleva título, personajes, capítulo y la foto en la conversación', () => {
  const html = paginasMuestra('/foto.jpg')[0].html;
  expect(html).toContain('Eva &amp; Marcos');
  expect(html).toContain("url('/foto.jpg')");
  expect(html).toContain('La Pistolera');
  expect(html).toContain('Aquel verano en Roma');
  expect(html).toContain('<img src="/foto.jpg"/>');
  expect(html).toContain('Volveremos');
  expect(html).not.toMatch(/responde en -|tarda -/);
});
