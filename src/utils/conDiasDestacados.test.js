import { conDiasDestacados } from '../fileService';

jest.mock('../services/anonymizationService', () => ({ anonymizationService: {} }));
jest.mock('../services/UnifiedAIService', () => ({}));
jest.mock('../utils/userSession', () => ({ userSession: {} }));

const limpiar = (t) => t.replace(/\d{1,2}\/\d{1,2}\/\d{2}/g, '').replace(/\d{1,2}:\d{2}(:\d{2})?/g, '').replace(/[[\]]/g, '').replace(/\s*-\s*/g, ' ');

// Un chat de 60 días con 10 mensajes al día, salvo dos días muy intensos al principio
const chat = () => {
  const ls = [];
  for (let d = 1; d <= 60; d += 1) {
    const fecha = new Date(2026, 0, d);
    const f = `${fecha.getDate()}/${fecha.getMonth() + 1}/26`;
    const veces = d === 3 ? 200 : d === 10 ? 150 : 10;
    for (let i = 0; i < veces; i += 1) ls.push(`${f}, 10:${String(i % 60).padStart(2, '0')} - Participante ${(i % 2) + 1}: mensaje ${i} del día ${d}`);
  }
  return ls.join('\n');
};

test('pone delante los días más intensos, con la fecha en letra, y detrás lo reciente, sin pasarse del límite', () => {
  const t = conDiasDestacados(chat(), limpiar, 20000);
  expect(t.length).toBeLessThanOrEqual(20000);
  expect(t.startsWith('=== DÍA DESTACADO (')).toBe(true);
  expect((t.match(/=== DÍA DESTACADO/g) || []).length).toBe(5);
  const tres = t.indexOf('=== DÍA DESTACADO (3 de enero de 2026) ===');
  expect(tres).toBeGreaterThanOrEqual(0);
  expect(t.indexOf('=== DÍA DESTACADO (10 de enero de 2026) ===')).toBeGreaterThan(tres); // en orden de fecha
  expect(t).toContain('=== CONVERSACIÓN RECIENTE ===');
  expect(t).toContain('mensaje 9 del día 60'); // el último mensaje está
  expect(t).not.toMatch(/\d{1,2}\/\d{1,2}\/26|10:\d\d/); // sin fechas ni horas en las líneas
});

test('de cada día destacado coge trozos repartidos, no solo el principio', () => {
  const t = conDiasDestacados(chat(), limpiar, 20000);
  const bloque = t.split('=== DÍA DESTACADO (3 de enero de 2026) ===')[1].split('===')[0];
  expect(bloque).toContain('mensaje 0 del día 3');
  expect(bloque).toContain('mensaje 100 del día 3');
  expect(bloque).toContain('mensaje 150 del día 3');
});
