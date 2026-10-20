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
  expect(htmlPreguntas('G', 'halloween')).toContain('EL JUEGO DE HALLOWEEN');
  expect(htmlPreguntas('G', 'halloween')).toContain('#ff7a00');
  expect(htmlPreguntas('G', 'navidad')).toContain('EL JUEGO DE NAVIDAD');
  expect(htmlPreguntas('G', 'navidad')).not.toContain('#ff7a00');
});

test('el acta lleva nombres y datos de las dos rondas', () => {
  const r1 = respuestasRonda1({ mensajes_por_usuario: { Marta: 10 }, categorias: { vampiro: { nombre: 'Luis', mensajes_noche: 3 } } });
  const r2 = respuestasRonda2([{ id: 11, nombre: 'Eva', frase: 'Cuñao total.', cita: 'yo eso lo sé' }], 'navidad');
  const html = htmlRespuestas('Familia', r1, r2, true, 'navidad');
  expect(html).toContain('Grupo: Familia');
  expect(html).toContain('<span class="resp">Marta</span>');
  expect(html).toContain('<span class="resp">Luis</span>');
  expect(html).toContain('<span class="resp">Eva</span>');
  expect(html).toContain('Cuñao total. «yo eso lo sé»');
  expect(html).toContain('Respuesta real · La prueba');
});

test('sin IA el acta lo dice en la Ronda 2 y escapa HTML en los nombres', () => {
  const html = htmlRespuestas('<b>x</b>', respuestasRonda1(null), respuestasRonda2(null, 'halloween'), false, 'halloween');
  expect(html).toContain('Sin análisis de IA en este chat');
  expect(html).toContain('&lt;b&gt;x&lt;/b&gt;');
  expect(html).not.toContain('<b>x</b>');
});
