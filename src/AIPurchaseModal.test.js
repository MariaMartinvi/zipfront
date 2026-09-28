import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import es from '../public/locales/es/translation.json';
import en from '../public/locales/en/translation.json';

// t() devuelve el texto real del JSON del idioma elegido
let mockTextos = es;
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (clave) => clave.split('.').reduce((o, k) => (o ? o[k] : undefined), mockTextos) ?? clave,
  }),
}));

// eslint-disable-next-line import/first
import AIPurchaseModal from './AIPurchaseModal';

const pintar = () =>
  renderToStaticMarkup(<AIPurchaseModal isOpen onClose={() => {}} onPurchase={() => {}} />);

test('en español el modal anuncia Bizum junto al botón de compra', () => {
  mockTextos = es;
  const html = pintar();
  expect(html).toContain('Paga con tarjeta, Bizum, PayPal, Apple Pay o Google Pay');
  // aparece después del botón de comprar
  expect(html.indexOf('Bizum')).toBeGreaterThan(html.indexOf('ai-purchase-button'));
});

test('en otros idiomas no se anuncia Bizum (solo funciona para clientes en España)', () => {
  mockTextos = en;
  const html = pintar();
  expect(html).toContain('Pay by card, PayPal, Apple Pay or Google Pay');
  expect(html).not.toContain('Bizum');
});
