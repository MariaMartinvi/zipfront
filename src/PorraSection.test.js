import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

let mockCredito = { canUse: false, porraCredits: 0 };
jest.mock('./firebase_auth', () => ({
  canUsePorra: jest.fn(() => Promise.resolve(mockCredito)),
  decrementPorraCredit: jest.fn(),
  purchasePorra: jest.fn(),
}));
jest.mock('./fileService', () => ({ getPorraResponse: jest.fn() }));
jest.mock('./utils/porraPdf', () => ({ htmlPreguntas: jest.fn(), htmlRespuestas: jest.fn(), descargarPdf: jest.fn() }));
jest.mock('./utils/pricing', () => ({ getPorraPricing: () => ({ region: 'es', price: '2,99€' }) }));

// eslint-disable-next-line import/first
import PorraSection from './PorraSection';

const pintar = (props = {}) =>
  renderToStaticMarkup(<PorraSection user={{ uid: 'u1' }} chatData="chat" {...props} />);

test('presenta cada juego con su nombre, sin enseñar preguntas ni respuestas', () => {
  const navidad = pintar({ tema: 'navidad' });
  expect(navidad).toContain('El Juego de Navidad');
  expect(navidad).toContain('Hoja de jugador');
  expect(navidad).not.toContain('¿Quién');
  const halloween = pintar({ tema: 'halloween' });
  expect(halloween).toContain('El Juego de Halloween');
  expect(halloween).toContain('porra-halloween');
  expect(halloween).not.toContain('¿Quién');
});

test('sin IA avisa de que solo habrá Ronda 1', () => {
  expect(pintar({ skipIA: true })).toContain('solo Ronda 1');
  expect(pintar({ skipIA: false })).not.toContain('solo Ronda 1');
});

test('mientras no se sabe el crédito no muestra ningún botón (el crédito llega async)', () => {
  // renderToStaticMarkup no ejecuta effects: credito === null → sin botón de compra ni de descarga
  const html = pintar();
  expect(html).not.toContain('Crear El Juego');
  expect(html).not.toContain('Generar y descargar');
});
