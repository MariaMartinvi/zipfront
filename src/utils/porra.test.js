import { nombreGrupoDesdeArchivo, PREGUNTAS_RONDA_1, TEMAS, preguntasRonda2, temaValido, temaSugerido, respuestasRonda1, respuestasRonda2 } from './porra';

const datos = {
  mensajes_por_usuario: { Marta: 2341, Luis: 900, Eva: 15 },
  categorias: {
    vampiro: { nombre: 'Luis', mensajes_noche: 120 },
    cafeconleche: { nombre: 'Eva', hora_formateada: '07:12' },
    dejaenvisto: { nombre: 'Marta', tiempo_respuesta_promedio: 5400 },
    pistolero: { nombre: 'Luis', tiempo_respuesta_promedio: 42 },
    rollero: { nombre: 'Eva', palabras_por_mensaje: 38.6 },
    bombardero: { nombre: 'Marta', max_mensajes_seguidos: 9 },
    narcicista: { nombre: 'Luis', menciones_yo: 300 },
    chismoso: { nombre: 'Eva', menciones_otros: 77 },
    happyflower: { nombre: '--', emojis_totales: 0 },
  },
};

test('hay 10 preguntas de datos y 10 de Ronda 2 por tema, con ids 1-20 y preguntas distintas', () => {
  expect(PREGUNTAS_RONDA_1.map((p) => p.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  expect(Object.keys(TEMAS).sort()).toEqual(['halloween', 'navidad']);
  Object.keys(TEMAS).forEach((tema) => {
    expect(preguntasRonda2(tema).map((p) => p.id)).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
  });
  expect(preguntasRonda2('halloween')[0].texto).not.toBe(preguntasRonda2('navidad')[0].texto);
});

test('tema desconocido cae a navidad; sugerido: halloween hasta el 2 de noviembre', () => {
  expect(temaValido('pascua')).toBe('navidad');
  expect(preguntasRonda2('x')).toBe(preguntasRonda2('navidad'));
  expect(temaSugerido(new Date(2026, 9, 20))).toBe('halloween');
  expect(temaSugerido(new Date(2026, 10, 2))).toBe('halloween');
  expect(temaSugerido(new Date(2026, 10, 3))).toBe('navidad');
  expect(temaSugerido(new Date(2026, 11, 24))).toBe('navidad');
});

test('Ronda 1: nombre y dato real con gracia para cada pregunta', () => {
  const r = respuestasRonda1(datos);
  expect(r).toHaveLength(10);
  expect(r[0]).toMatchObject({ id: 1, nombre: 'Marta' });
  expect(r[0].dato).toMatch(/2\.?341 mensajes/);
  expect(r[1]).toMatchObject({ nombre: 'Luis' });
  expect(r[2].dato).toContain('07:12');
  expect(r[3].dato).toContain('1 h');
  expect(r[4].dato).toContain('1 min');
  expect(r[5].dato).toContain('39 palabras');
  expect(r[6].dato).toContain('9 mensajes seguidos');
  expect(r[7].dato).toContain('300 veces');
  expect(r[8].dato).toContain('77 menciones');
});

test('Ronda 1: categoría sin datos o datos vacíos → guion, sin romper', () => {
  const r = respuestasRonda1(datos);
  expect(r[9]).toMatchObject({ id: 10, nombre: '—' });
  expect(respuestasRonda1(null).every((x) => x.nombre === '—')).toBe(true);
  expect(respuestasRonda1({}).every((x) => x.nombre === '—')).toBe(true);
});

test('Ronda 2: junta frase y cita, y sin IA deja las preguntas sin responder', () => {
  const ia = [{ id: 11, nombre: 'Eva', frase: 'Cuñao nivel experto.', cita: 'eso lo arreglo yo' }, { id: 20, nombre: 'Luis', frase: 'El alma.', cita: '' }];
  const r = respuestasRonda2(ia, 'navidad');
  expect(r).toHaveLength(10);
  expect(r[0]).toMatchObject({ id: 11, nombre: 'Eva', dato: 'Cuñao nivel experto. «eso lo arreglo yo»', pregunta: preguntasRonda2('navidad')[0].texto });
  expect(respuestasRonda2(ia, 'halloween')[0].pregunta).toBe(preguntasRonda2('halloween')[0].texto);
  expect(r[9]).toMatchObject({ id: 20, nombre: 'Luis', dato: 'El alma.' });
  expect(r[1]).toMatchObject({ id: 12, nombre: '—' });
  expect(respuestasRonda2(null).every((x) => x.nombre === '—')).toBe(true);
});

test('nombre del grupo a partir del fichero exportado', () => {
  expect(nombreGrupoDesdeArchivo('WhatsApp Chat - Los de siempre.zip')).toBe('Los de siempre');
  expect(nombreGrupoDesdeArchivo('WhatsApp Chat - Los de siempre (2).zip')).toBe('Los de siempre');
  expect(nombreGrupoDesdeArchivo('Chat de WhatsApp con Familia Pérez.txt')).toBe('Familia Pérez');
  expect(nombreGrupoDesdeArchivo('WhatsApp Chat with Office.zip')).toBe('Office');
  // iOS: el zip trae el nombre y el txt interno es "_chat.txt"
  expect(nombreGrupoDesdeArchivo('WhatsApp Chat - Cena.zip', '_chat.txt')).toBe('Cena');
  expect(nombreGrupoDesdeArchivo('_chat.txt', 'Chat de WhatsApp con Primos.txt')).toBe('Primos');
  expect(nombreGrupoDesdeArchivo('archivo.zip', '_chat.txt')).toBe('Mi grupo');
  expect(nombreGrupoDesdeArchivo(null, undefined)).toBe('Mi grupo');
});
