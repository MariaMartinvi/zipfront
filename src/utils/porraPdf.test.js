import { htmlPreguntas, htmlRespuestas } from './porraPdf';
import { PREGUNTAS_RONDA_1, preguntasRonda2, respuestasRonda1, respuestasRonda2 } from './porra';

const todas = (tema) => [...PREGUNTAS_RONDA_1, ...preguntasRonda2(tema)];

test.each(['halloween', 'navidad'])('la hoja de jugador (%s) lleva sus 20 preguntas, el grupo y la marca, sin respuestas', (tema) => {
  const html = htmlPreguntas('Los de siempre', tema);
  todas(tema).forEach((p) => expect(html).toContain(p.texto.replace(/"/g, '&quot;')));
  expect(html).toContain('Grupo: Los de siempre');
  expect(html).toContain('chatsalsa.com');
  expect(html).not.toContain('class="resp"');
});

test('cada tema tiene su cabecera y su color', () => {
  expect(htmlPreguntas('G', 'halloween')).toContain('El Juego de Halloween');
  expect(htmlPreguntas('G', 'halloween')).toContain('Creepster');
  expect(htmlPreguntas('G', 'halloween')).toContain('porra-halloween-h.jpg');
  expect(htmlPreguntas('G', 'halloween')).toContain('#ff7a00');
  expect(htmlPreguntas('G', 'navidad')).toContain('El Juego de Navidad');
  expect(htmlPreguntas('G', 'navidad')).toContain('Mountains of Christmas');
  expect(htmlPreguntas('G', 'navidad')).not.toContain('#ff7a00');
});

test('el acta lleva nombres y datos de las dos rondas', () => {
  const r1 = respuestasRonda1({ mensajes_por_usuario: { Marta: 10 }, categorias: { vampiro: { nombre: 'Luis', mensajes_noche: 3 } } });
  const r2 = respuestasRonda2([{ id: 11, nombre: 'Eva', frase: 'Cuñao total.', cita: 'yo eso lo sé' }], 'navidad');
  const html = htmlRespuestas('Familia', r1, r2, true, 'navidad').join('');
  expect(html).toContain('Grupo: Familia');
  expect(html).toContain('<span class="resp">Marta</span>');
  expect(html).toContain('<span class="resp">Luis</span>');
  expect(html).toContain('<span class="resp">Eva</span>');
  expect(html).toContain('Cuñao total. «yo eso lo sé»');
  expect(html).toContain('Respuesta real · La prueba');
});

test('sin IA el acta lo dice en la Ronda 2 y escapa HTML en los nombres', () => {
  const html = htmlRespuestas('<b>x</b>', respuestasRonda1(null), respuestasRonda2(null, 'halloween'), false, 'halloween').join('');
  expect(html).toContain('Sin análisis de IA en este chat');
  expect(html).toContain('&lt;b&gt;x&lt;/b&gt;');
  expect(html).not.toContain('<b>x</b>');
});

test('el acta sale en dos páginas: Ronda 1 en la primera, Ronda 2 y marcador en la segunda', () => {
  const [p1, p2] = htmlRespuestas('G', respuestasRonda1(null), respuestasRonda2(null, 'navidad'), true, 'navidad');
  expect(p1).toContain('RONDA 1');
  expect(p1).not.toContain('RONDA 2');
  expect(p2).toContain('RONDA 2');
  expect(p2).toContain('MARCADOR FINAL');
});
