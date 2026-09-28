// Solo se prueba trackPurchase: se simulan Firebase y Stripe para no cargarlos
jest.mock('./firebase_auth', () => ({ auth: {} }));
jest.mock('./stripe_integration', () => ({ getUserPlan: jest.fn() }));

// eslint-disable-next-line import/first
import { trackPurchase } from './PaymentSuccess';

beforeEach(() => {
  localStorage.clear();
  window.dataLayer = [];
  delete window.gtag;
});

test('envía purchase_completed a GTM aunque no exista window.gtag', () => {
  expect(trackPurchase('cs_test_123', 'uid1')).toBe(true);
  expect(window.dataLayer).toEqual([
    { event: 'purchase_completed', user_id: 'uid1', value: 5, currency: 'EUR', transaction_id: 'cs_test_123' },
  ]);
});

test('no envía el email del usuario (GA4 prohíbe datos personales)', () => {
  trackPurchase('cs_test_123', 'uid1');
  expect(JSON.stringify(window.dataLayer)).not.toMatch(/email|@/);
});

test('no duplica el evento si el usuario recarga la página', () => {
  trackPurchase('cs_test_123', 'uid1');
  expect(trackPurchase('cs_test_123', 'uid1')).toBe(false);
  expect(window.dataLayer).toHaveLength(1);
});

test('sin session_id no envía nada', () => {
  expect(trackPurchase(null, 'uid1')).toBe(false);
  expect(window.dataLayer).toHaveLength(0);
});
