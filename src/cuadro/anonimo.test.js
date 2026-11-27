import { anonimizar, chatParaEnviar, nombresReales } from './anonimo';

const CHAT = [
  '[1/3/23, 10:00:00] Eva Pan: Buenos días, desastre',
  '[1/3/23, 10:05:00] Marcos Ruiz: Si me pierdo, búscame en la nevera',
  '[1/3/23, 10:06:00] Marcos Ruiz: ‎imagen omitida',
  '[1/3/23, 10:07:00] Eva Pan: llámame al 600 123 456 o escribe a eva.pan@correo.com',
  '[1/3/23, 10:08:00] Marcos Ruiz: Eva Pan, eres la mejor. Mira https://maps.app.goo.gl/abc123',
  '[2/3/23, 09:00:00] Eva Pan: Mañana más',
].join('\n');

test('lo que sale del navegador no lleva nombres, teléfonos, correos, enlaces, fechas ni horas', () => {
  const { lineas } = chatParaEnviar(CHAT);
  ['Eva', 'Pan', 'Marcos', 'Ruiz', '600 123 456', '600123456', 'eva.pan', 'maps.app.goo.gl/abc123', '1/3/23', '10:05'].forEach((s) => expect(lineas).not.toContain(s));
  const ls = lineas.split('\n');
  expect(ls).toHaveLength(5);                                  // la imagen no va
  ls.forEach((l) => expect(l).toMatch(/^Participante \d+: \S/));
  expect(ls[1]).toBe('Participante 2: Si me pierdo, búscame en la nevera');
});

test('usa las mismas funciones que el análisis de IA: «Participante N», como allí', () => {
  const { texto, mapas } = anonimizar(CHAT);
  expect(mapas['Eva Pan']).toBe('Participante 1');
  expect(mapas['Marcos Ruiz']).toBe('Participante 2');
  expect(texto).toContain('Participante 1: Buenos días, desastre');
  expect(chatParaEnviar(CHAT).lineas).toContain('Participante 2: Participante 1, eres la mejor.'); // el nombre dentro del mensaje, tapado
  // cada chat empieza de cero: no arrastra alias de otro chat
  expect(anonimizar('[1/3/23, 10:00:00] Noe: hola\n[1/3/23, 10:01:00] Sara: hola').mapas).toMatchObject({ Noe: 'Participante 1', Sara: 'Participante 2' });
});

test('los nombres reales se reponen en el navegador', () => {
  const envio = chatParaEnviar(CHAT);
  const frases = nombresReales([
    { autor: 'Participante 2', texto: 'Si me pierdo, búscame en la nevera', tono: 'graciosa' },   // mensaje entero
    { autor: 'Participante 1', texto: 'Buenos días, desastre' },
    { autor: 'Participante 2', texto: 'eres la mejor.' },                                         // una oración de un mensaje
  ], envio);
  expect(frases).toEqual([
    { autor: 'Marcos Ruiz', texto: 'Si me pierdo, búscame en la nevera', tono: 'graciosa' },
    { autor: 'Eva Pan', texto: 'Buenos días, desastre' },
    { autor: 'Marcos Ruiz', texto: 'eres la mejor.' },
  ]);
  // un alias suelto dentro de una frase también vuelve a su nombre
  expect(nombresReales([{ autor: 'Participante 2', texto: 'Participante 1, eres la mejor.' }], envio)[0].texto).toBe('Eva Pan, eres la mejor.');
  expect(nombresReales(null, envio)).toEqual([]);
});
