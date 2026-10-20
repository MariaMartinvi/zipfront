import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

jest.mock('./usePorra', () => ({
  usePorra: ({ tema }) => ({
    tema: { id: tema, emoji: tema === 'halloween' ? '🎃' : '🎄' },
    credito: tema === 'halloween' ? { canUse: true } : { canUse: false },
    estado: 'idle', error: '', accion: () => {},
  }),
}));
jest.mock('./utils/pricing', () => ({ getPorraPricing: () => ({ region: 'es', price: '2,99€' }) }));

// eslint-disable-next-line import/first
import JuegosBarra from './JuegosBarra';

test('un botón por juego: el comprado dice listo, el otro muestra el precio', () => {
  const html = renderToStaticMarkup(<JuegosBarra user={{ uid: 'u1' }} chatData="chat" skipIA={false} />);
  expect(html).toContain('🎃 Descargar juego de Halloween');
  expect(html).toContain('🎄 Comprar juego de Navidad · 2,99€');
  expect(html).toContain('Comprado · dos PDFs listos para imprimir');
  expect(html).toContain('Pago único por chat');
  expect(html).not.toContain('¿Quién');
});
