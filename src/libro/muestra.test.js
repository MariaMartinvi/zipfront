import { librosEjemplo, recortar } from './muestra';

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

test('vista previa: lo que corta el borde de la página se esconde, sin dejar una fecha suelta al final', () => {
  document.head.innerHTML = ''; // los tests de arriba dejan en el documento el CSS de las páginas
  document.body.innerHTML = '<section class="chapter-body"><div class="day">1</div><div class="msg">a</div><div class="day">2</div><div class="msg">b</div><div class="msg">c</div></section>';
  const s = document.querySelector('section');
  s.style.paddingBottom = '10px';
  Object.defineProperty(s, 'offsetHeight', { value: 200 });
  s.getBoundingClientRect = () => ({ top: 0, bottom: 200, height: 200 });
  const bajos = [20, 60, 195, 205, 240]; // la fecha «2» cabe (aunque entre en el margen), pero su mensaje «b» corta el borde
  [...s.children].forEach((el, i) => { el.getBoundingClientRect = () => ({ bottom: bajos[i] }); });
  recortar(document);
  expect([...s.children].map((el) => el.style.visibility)).toEqual(['', '', 'hidden', 'hidden', 'hidden']);
});

test('vista previa: si todo cabe no se esconde nada; y el script va dentro de cada página', () => {
  document.head.innerHTML = '';
  document.body.innerHTML = '<section><div class="msg">a</div></section>';
  const s = document.querySelector('section');
  Object.defineProperty(s, 'offsetHeight', { value: 200 });
  s.getBoundingClientRect = () => ({ top: 0, bottom: 200, height: 200 });
  s.children[0].getBoundingClientRect = () => ({ bottom: 50 });
  recortar(document);
  expect(s.children[0].style.visibility).toBe('');
  expect(librosEjemplo()[0].dobles[0].dcha).toContain('var recortar=function recortar(doc)');
});
