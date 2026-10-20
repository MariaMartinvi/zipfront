import { muestrearChat } from '../fileService';

jest.mock('../services/anonymizationService', () => ({ anonymizationService: {} }));
jest.mock('../services/UnifiedAIService', () => ({}));
jest.mock('../utils/userSession', () => ({ userSession: {} }));

const chat = Array.from({ length: 5000 }, (_, i) => `Participante ${(i % 3) + 1}: mensaje número ${i}`).join('\n');

test('un chat corto se envía entero', () => {
  expect(muestrearChat('hola\nadiós', 1000)).toBe('hola\nadiós');
});

test('un chat largo se reduce al tamaño pedido con trozos de toda la historia, no solo del final', () => {
  const m = muestrearChat(chat, 20000, 10);
  expect(m.length).toBeLessThanOrEqual(20000 + 10 * 60);
  expect(m).toContain('mensaje número 0');
  expect(m).toContain('mensaje número 2500');
  expect(m).toContain('\n...\n');
  expect(m).not.toContain('mensaje número 4999');
});
