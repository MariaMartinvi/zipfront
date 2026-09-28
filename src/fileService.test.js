// Guardia de privacidad: si el chat no se ha podido anonimizar, no se llama a la IA.

jest.mock('./utils/userSession', () => ({ userSession: {} }));

const mockGetResponse = jest.fn();
jest.mock('./services/UnifiedAIService', () => ({
  __esModule: true,
  default: { getResponse: (...args) => mockGetResponse(...args) },
}));

import { getMistralResponse } from './fileService';
import { anonymizationService } from './services/anonymizationService';

beforeEach(() => {
  anonymizationService.reset();
  mockGetResponse.mockReset();
  mockGetResponse.mockResolvedValue({ success: true, response: '## Análisis de personalidades\n### Participante 1' });
});

test('formato desconocido: devuelve error y NO llama a la IA', async () => {
  const chat = ['Maria dijo a las 10: Hola', 'Eva Pan dijo a las 11: Qué tal'].join('\n');

  const result = await getMistralResponse(chat, 'es');

  expect(result.success).toBe(false);
  expect(result.error).toMatch(/formato del chat/);
  expect(mockGetResponse).not.toHaveBeenCalled();
});

test('formato reconocido: llama a la IA solo con nombres anonimizados', async () => {
  const chat = ['[30/1/26 13:56:06] Maria: Hola', '[30/1/26 13:56:10] Eva Pan: Qué tal'].join('\n');

  const result = await getMistralResponse(chat, 'es');

  expect(result.success).toBe(true);
  expect(mockGetResponse).toHaveBeenCalledTimes(1);
  const textoEnviado = mockGetResponse.mock.calls[0][0];
  expect(textoEnviado).toContain('Participante 1:');
  expect(textoEnviado).toContain('Participante 2:');
  expect(textoEnviado).not.toMatch(/Maria|Eva Pan/);
});
