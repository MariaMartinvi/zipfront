import { detectarFormatoChat } from './formatDetector';
import { parseDateTime } from './dateUtils';

// Genera 6 líneas de chat con la plantilla dada (el detector exige >3 coincidencias)
const lineas = (plantilla) =>
  Array.from({ length: 6 }, (_, i) => plantilla.replace('{i}', String(i + 1)));

describe('detectarFormatoChat: variantes reales de exports de WhatsApp', () => {
  test('Android clásico dd/mm/aa 24h (formato ya soportado)', () => {
    expect(detectarFormatoChat(lineas('26/7/24, 21:0{i} - Daniel: Hola {i}')))
      .toBe('android');
  });

  test('iOS clásico [dd/mm/aa, hh:mm:ss] (formato ya soportado)', () => {
    expect(detectarFormatoChat(lineas('[26/7/24, 21:06:0{i}] Daniel: Hola {i}')))
      .toBe('ios');
  });

  test('Android con año de 4 dígitos', () => {
    expect(detectarFormatoChat(lineas('26/07/2024, 21:0{i} - Daniel: Hola {i}')))
      .toBe('android');
  });

  test('iOS sin coma entre fecha y hora ("[30/1/26 13:56:06]")', () => {
    expect(detectarFormatoChat(lineas('[30/1/26 13:56:0{i}] Daniel: Hola {i}')))
      .toBe('ios');
  });

  test('iOS con carácter invisible U+200E delante del corchete', () => {
    expect(detectarFormatoChat(lineas('\u200E[26/7/24, 21:06:0{i}] Daniel: Hola {i}')))
      .toBe('ios');
  });

  test('iOS con hora a.m./p.m. y espacio estrecho U+202F', () => {
    expect(detectarFormatoChat(lineas('[26/7/24, 9:06:0{i} p. m.] Daniel: Hola {i}')))
      .toBe('ios');
  });

  test('Android con hora "p. m."', () => {
    expect(detectarFormatoChat(lineas('26/7/24, 9:0{i} p. m. - Daniel: Hola {i}')))
      .toBe('android');
  });

  test('Android con fecha con puntos (locale alemán)', () => {
    expect(detectarFormatoChat(lineas('26.07.24, 21:0{i} - Daniel: Hallo {i}')))
      .toBe('android');
  });
});

describe('parseDateTime: horas con a.m./p.m.', () => {
  test('convierte "9:06 p. m." a las 21:06', () => {
    const fecha = parseDateTime('26/7/24', '9:06 p. m.', 'android');
    expect(fecha.getHours()).toBe(21);
    expect(fecha.getMinutes()).toBe(6);
  });

  test('convierte "12:15 a. m." a las 00:15', () => {
    const fecha = parseDateTime('26/7/24', '12:15 a. m.', 'android');
    expect(fecha.getHours()).toBe(0);
  });

  test('convierte "12:15 p. m." a las 12:15', () => {
    const fecha = parseDateTime('26/7/24', '12:15 p. m.', 'android');
    expect(fecha.getHours()).toBe(12);
  });

  test('hora 24h sigue funcionando igual', () => {
    const fecha = parseDateTime('26/7/24', '21:06:15', 'android');
    expect(fecha.getHours()).toBe(21);
    expect(fecha.getSeconds()).toBe(15);
  });

  test('fecha con puntos como separador', () => {
    const fecha = parseDateTime('26.07.2024', '21:06', 'android');
    expect(fecha.getDate()).toBe(26);
    expect(fecha.getMonth()).toBe(6);
    expect(fecha.getFullYear()).toBe(2024);
  });
});
