import { shareGameResult } from './ChatTopGame';

const URL_JUEGO = 'https://www.chatsalsa.com/chat-game?d=abc';

afterEach(() => {
  delete navigator.share;
  jest.restoreAllMocks();
});

test('en móvil usa la hoja nativa de compartir con texto y enlace', async () => {
  navigator.share = jest.fn().mockResolvedValue();
  const open = jest.spyOn(window, 'open').mockImplementation(() => {});

  expect(await shareGameResult('He acertado 2 de 7', URL_JUEGO)).toBe('native');
  expect(navigator.share).toHaveBeenCalledWith({ text: 'He acertado 2 de 7', url: URL_JUEGO });
  expect(open).not.toHaveBeenCalled();
});

test('sin hoja nativa abre WhatsApp con el texto y el enlace', async () => {
  const open = jest.spyOn(window, 'open').mockImplementation(() => {});

  expect(await shareGameResult('He acertado 2 de 7', URL_JUEGO)).toBe('whatsapp');
  const abierta = open.mock.calls[0][0];
  expect(abierta).toMatch(/^https:\/\/wa\.me\/\?text=/);
  expect(decodeURIComponent(abierta)).toContain(`He acertado 2 de 7 ${URL_JUEGO}`);
});

test('si el usuario cancela, no abre WhatsApp', async () => {
  navigator.share = jest.fn().mockRejectedValue(Object.assign(new Error('x'), { name: 'AbortError' }));
  const open = jest.spyOn(window, 'open').mockImplementation(() => {});

  expect(await shareGameResult('t', URL_JUEGO)).toBe('cancelled');
  expect(open).not.toHaveBeenCalled();
});
