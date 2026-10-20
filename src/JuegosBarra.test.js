import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

let mockGenerado = null;
jest.mock('./usePorra', () => ({
  usePorra: ({ tema }) => ({
    tema: { id: tema, emoji: tema === 'halloween' ? '🎃' : '🎄' },
    credito: tema === 'halloween' ? { canUse: true } : { canUse: false },
    estado: 'idle', error: '', accion: () => {}, descargar: () => {},
    generado: tema === 'navidad' ? mockGenerado : null,
  }),
}));
jest.mock('./utils/pricing', () => ({ getPorraPricing: () => ({ region: 'es', price: '2,99€' }) }));

// eslint-disable-next-line import/first
import JuegosBarra from './JuegosBarra';

test('un botón por juego: el comprado dice listo, el otro muestra el precio', () => {
  const html = renderToStaticMarkup(<JuegosBarra user={{ uid: 'u1' }} chatData="chat" skipIA={false} />);
  expect(html).toContain('🎃 Generar juego de Halloween');
  expect(html).toContain('🎄 Comprar juego de Navidad · 2,99€');
  expect(html).toContain('Comprado');
  expect(html).not.toContain('Pago único');
  expect(html).not.toContain('¿Quién');
});

test('juego ya generado para este chat: botón de descarga del PDF completo, sin pedir pago', () => {
  mockGenerado = { grupo: 'G', ronda1: [], ronda2: [], conIA: true };
  const html = renderToStaticMarkup(<JuegosBarra user={{ uid: 'u1' }} chatData="chat" skipIA={false} operationId="op1" />);
  expect(html).toContain('📥 Descargar juego de Navidad (PDF)');
  expect(html).toContain('solo para el moderador');
  expect(html).not.toContain('Comprar juego de Navidad');
  mockGenerado = null;
});
