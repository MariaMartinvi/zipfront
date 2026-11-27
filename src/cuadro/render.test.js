import { htmlCuadro, tamanoFrase, autorVisible, PLANTILLAS, IDS_PLANTILLAS, MAX_FRASES } from './render';
import { ajustarTitular, arteKandinsky, dibujitos, azar, LISTA_DESDE } from './estilos';
import { EJEMPLOS, EJEMPLOS_LISTA } from './ejemplos';

const frases = (n, texto = 'Contigo hasta los lunes molan') => Array.from({ length: n }, (_, i) => ({ texto: `${texto} ${i}`, autor: i % 2 ? 'Eva Pan' : 'marcos' }));
const cuantas = (html) => (html.match(/<li class="b[ "]|<li><span class="l">/g) || []).length;

test('se ofrecen tres estilos: Moderno, Tipográfico y Tierno, cada uno con sus ejemplos inventados', () => {
  expect(IDS_PLANTILLAS).toEqual(['moderno', 'tipografico', 'tierno']);
  expect(IDS_PLANTILLAS.map((id) => PLANTILLAS[id].nombre)).toEqual(['Moderno', 'Tipográfico', 'Tierno']);
  IDS_PLANTILLAS.forEach((id) => {
    expect(htmlCuadro(EJEMPLOS[id])).toContain(`p-${id}`);
    expect(EJEMPLOS[id].frases.length).toBeLessThan(LISTA_DESDE);
    expect(EJEMPLOS_LISTA[id].frases.length).toBeGreaterThanOrEqual(LISTA_DESDE);
    expect(htmlCuadro(EJEMPLOS_LISTA[id])).toContain(`p-${id}`);
  });
  expect(htmlCuadro({ plantilla: 'no-existe', titulo: 'T', frases: frases(2) })).toContain('p-moderno');
});

test('de 1 a 12 frases en los tres estilos; las vacías no salen', () => {
  IDS_PLANTILLAS.forEach((id) => {
    [1, 4, 5, 12].forEach((n) => expect(cuantas(htmlCuadro({ plantilla: id, titulo: 'T', frases: frases(n) }))).toBe(n));
    expect(cuantas(htmlCuadro({ plantilla: id, titulo: 'T', frases: [...frases(15), { texto: '   ' }] }))).toBe(MAX_FRASES);
  });
});

test('autor: nombre de pila, inicial o nada', () => {
  expect(autorVisible('Eva Pan')).toBe('Eva');
  expect(autorVisible('eva pan', 'inicial')).toBe('E.');
  expect(autorVisible('Eva Pan', 'ninguno')).toBe('');
  expect(autorVisible('', 'nombre')).toBe('');
  IDS_PLANTILLAS.forEach((id) => {
    const con = htmlCuadro({ plantilla: id, titulo: 'T', frases: frases(3), autores: 'inicial' });
    expect(con).toMatch(/class="aut">(— )?E\.</);
    expect(con).not.toContain('Eva');
    expect(htmlCuadro({ plantilla: id, titulo: 'T', frases: frases(3), autores: 'ninguno' })).not.toContain('class="aut"');
  });
});

test('letra grande: la mayor que cabe, partida en líneas sin cortar palabras', () => {
  const corta = ajustarTitular('Hoy es mañana', { ancho: 84, alto: 100, max: 34 });
  const larga = ajustarTitular('Si te pierdes, quédate quieta, que voy yo a buscarte donde haga falta', { ancho: 84, alto: 100, max: 34 });
  expect(corta.s).toBeGreaterThan(larga.s);
  expect(corta.lineas.join(' ')).toBe('Hoy es mañana');
  expect(larga.lineas.join(' ')).toBe('Si te pierdes, quédate quieta, que voy yo a buscarte donde haga falta');
  larga.lineas.forEach((l) => expect([...l].length * 0.58 * larga.s).toBeLessThanOrEqual(84));
  expect(larga.lineas.length * larga.s).toBeLessThanOrEqual(100);
  // menos sitio (más frases en el cuadro) → letra más pequeña
  expect(ajustarTitular('Hoy es mañana', { ancho: 84, alto: 8 }).s).toBeLessThan(corta.s);
  expect(ajustarTitular('', { ancho: 84, alto: 8 }).lineas).toEqual([]);
});

test('Moderno: el mismo chat da siempre el mismo dibujo, y chats distintos, dibujos distintos', () => {
  expect(azar('a')()).toBe(azar('a')());
  const a = arteKandinsky({ semilla: 'lucia-marc' });
  expect(arteKandinsky({ semilla: 'lucia-marc' })).toBe(a);
  expect(arteKandinsky({ semilla: 'otro-chat' })).not.toBe(a);
  expect(arteKandinsky({ semilla: 'lucia-marc', oscuro: true })).toContain('mix-blend-mode:screen');
  // un círculo de color por cada tramo del chat (más el halo y el de contorno del fondo)
  const datos = [{ a: 0, p: 1 }, { a: 1, p: 0.2 }, { a: 0, p: 0.5 }];
  expect(arteKandinsky({ semilla: 'x', datos }).match(/mix-blend-mode/g)).toHaveLength(3);
  expect(arteKandinsky({ semilla: 'x', datos: Array(40).fill({ a: 1, p: 1 }) }).match(/mix-blend-mode/g)).toHaveLength(24);
  expect(htmlCuadro(EJEMPLOS.moderno)).toContain('<svg class="arte"');
});

test('Tierno: dibujitos repetibles; Tipográfico: con pocas frases alterna lados, en lista todas a la izquierda', () => {
  expect(dibujitos('s')).toBe(dibujitos('s'));
  expect(dibujitos('s')).not.toBe(dibujitos('t'));
  expect(htmlCuadro(EJEMPLOS.tierno)).toContain('class="dibujitos"');
  expect(htmlCuadro(EJEMPLOS.tipografico)).toContain('<li class="b der">');
  expect(htmlCuadro(EJEMPLOS.tipografico)).toContain('¿MAÑANA?');            // la primera, en mayúsculas
  expect(htmlCuadro(EJEMPLOS_LISTA.tipografico)).not.toContain('<li class="b der">');
});

test('el texto del usuario va escapado (título, frases y autor) en los tres estilos', () => {
  IDS_PLANTILLAS.forEach((id) => {
    const html = htmlCuadro({
      plantilla: id, titulo: '<script>alert(1)</script>', sobretitulo: '"><img src=x onerror=alert(1)>', pie: '<b>pie</b>',
      frases: [{ texto: '<b>hola</b> & adiós', autor: '<i>Eva</i>' }],
    });
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).not.toContain('<img src=x');
    expect(html).not.toContain('<b>');
    expect(html.toLowerCase()).toContain('&lt;b&gt;hola&lt;/b&gt;');
    expect(html).toContain('&lt;i&gt;Eva&lt;/i&gt;');
  });
});

test('vista previa en vw; PDF con tamaño de página A4 o A3', () => {
  expect(htmlCuadro(EJEMPLOS.moderno)).toContain('font-size: 1vw');
  expect(htmlCuadro(EJEMPLOS.moderno, { formato: 'A4' })).toContain('@page { size: 210mm 297mm');
  expect(htmlCuadro(EJEMPLOS.tierno, { formato: 'A3' })).toContain('font-size: 2.97mm');
});

test('las plantillas de lista aparcadas siguen funcionando, pero no se ofrecen', () => {
  ['amorosa', 'clasica', 'minimal', 'divertida'].forEach((id) => {
    expect(IDS_PLANTILLAS).not.toContain(id);
    expect(htmlCuadro({ plantilla: id, titulo: 'T', frases: frases(6) })).toContain(`p-${id}`);
    expect(tamanoFrase(frases(5), id)).toBeGreaterThan(tamanoFrase(frases(12), id));
  });
});
