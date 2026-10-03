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

let mockAviso = null;
jest.mock('./utils/pricing', () => ({
  ...jest.requireActual('./utils/pricing'),
  getPaymentHighlightKey: () => mockAviso,
}));

// eslint-disable-next-line import/first
import AIPurchaseModal from './AIPurchaseModal';

const pintar = () =>
  renderToStaticMarkup(<AIPurchaseModal isOpen onClose={() => {}} onPurchase={() => {}} />);

test('en español el modal anuncia Bizum junto al botón de compra', () => {
  mockTextos = es;
  mockAviso = null;
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

test('a un usuario en España se le destaca Bizum antes del botón de compra', () => {
  mockTextos = es;
  mockAviso = 'hero.ai_purchase.bizum_badge';
  const html = pintar();
  expect(html).toContain('En España puedes pagar con Bizum');
  expect(html.indexOf('ai-payment-badge')).toBeLessThan(html.indexOf('ai-purchase-button'));
});

test('fuera de España no se destaca Bizum aunque el idioma sea español', () => {
  mockTextos = es;
  mockAviso = null;
  const html = pintar();
  expect(html).not.toContain('ai-payment-badge');
});

test('a un usuario de Latinoamérica se le destaca PayPal', () => {
  mockTextos = es;
  mockAviso = 'hero.ai_purchase.paypal_badge';
  const html = pintar();
  expect(html).toContain('<p class="ai-payment-badge">✅ Puedes pagar con PayPal</p>');
});
