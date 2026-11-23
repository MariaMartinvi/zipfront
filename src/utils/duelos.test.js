import { duelo, otroDeLaPareja, duracionCorta, DUELO } from './duelos';

const pareja = {
  usuarios: { Rocío: { mensajes: 300 }, Ariel: { mensajes: 200 } },
  categorias: {
    vampiro: { nombre: 'Rocío', porcentaje: 32.4, media_porcentaje_resto: 12.1 },
    pistolero: { nombre: 'Ariel', tiempo_respuesta_promedio: 3, media_tiempo_respuesta_resto: 12 },
    cafeconleche: { nombre: 'Ariel', hora_formateada: '08:15', hora_formateada_resto: '10:40' },
    comico: { nombre: 'Rocío', porcentaje: 8, media_porcentaje_resto: undefined },
  },
};

test('en una pareja, cada perfil enfrenta a quien destaca con la otra persona', () => {
  expect(duelo(pareja, 'vampiro')).toEqual({
    etiqueta: 'app.top_profiles.vampire.percentage', formato: 'pct',
    gana: { nombre: 'Rocío', valor: 32.4 }, otro: { nombre: 'Ariel', valor: 12.1 },
  });
  expect(duelo(pareja, 'pistolero').otro).toEqual({ nombre: 'Rocío', valor: 12 });
  expect(duelo(pareja, 'cafeconleche').otro.valor).toBe('10:40');
});

test('sin el dato de la otra persona, o en un grupo, no hay duelo', () => {
  expect(duelo(pareja, 'comico')).toBeNull();
  expect(duelo(pareja, 'mala_influencia')).toBeNull();
  const grupo = { ...pareja, usuarios: { ...pareja.usuarios, Marta: { mensajes: 50 } } };
  expect(duelo(grupo, 'vampiro')).toBeNull();
  expect(otroDeLaPareja(grupo, 'Rocío')).toBeNull();
  expect(duelo({ categorias: pareja.categorias }, 'vampiro')).toBeNull(); // sin usuarios (datos del servidor)
});

test('otroDeLaPareja', () => {
  expect(otroDeLaPareja(pareja, 'Ariel')).toBe('Rocío');
  expect(otroDeLaPareja(pareja, 'Desconocido')).toBeNull();
});

test('todos los perfiles con duelo usan una etiqueta que existe en las traducciones', () => {
  const fs = require('fs');
  ['es', 'en', 'fr', 'de', 'it', 'pt'].forEach((idioma) => {
    const tr = JSON.parse(fs.readFileSync(`public/locales/${idioma}/translation.json`, 'utf8'));
    Object.values(DUELO).forEach(([, , , clave]) => {
      const valor = clave.split('.').reduce((o, k) => (o ? o[k] : undefined), tr);
      expect([idioma, clave, typeof valor]).toEqual([idioma, clave, 'string']);
    });
  });
});

test('duración corta para que quepa en la tarjeta', () => {
  expect(duracionCorta(12.4)).toBe('12 min');
  expect(duracionCorta(199)).toBe('3 h 19 min');
  expect(duracionCorta(120)).toBe('2 h');
  expect(duracionCorta(8123)).toBe('5.6 d');
});
