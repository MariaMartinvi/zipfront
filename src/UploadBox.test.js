import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const mockTextos = require('../public/locales/es/translation.json');

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (clave, fallback) => clave.split('.').reduce((o, k) => (o ? o[k] : undefined), mockTextos) ?? (typeof fallback === 'string' ? fallback : clave),
  }),
}));
jest.mock('./InstallPWA', () => () => require('react').createElement('div', { className: 'install-pwa-container' }, 'INSTALAR'));

let mockPlatform = 'desktop';
jest.mock('./WhatsappInstructions', () => {
  const real = jest.requireActual('./WhatsappInstructions');
  return { __esModule: true, default: real.default, detectPlatform: () => mockPlatform };
});

// eslint-disable-next-line import/first
import UploadBox from './UploadBox';

const pintar = (props = {}) =>
  renderToStaticMarkup(<UploadBox onFileUpload={() => {}} skipIA={false} onSkipIAChange={() => {}} showAnalysis={false} {...props} />);

test('en PC: título "Sube tu chat", cajón de arrastrar y ayuda plegada', () => {
  mockPlatform = 'desktop';
  const html = pintar();
  expect(html).toContain('Sube tu chat de WhatsApp');
  expect(html).toContain('upload-dropzone');
  expect(html).toContain('Arrastra aquí tu archivo .zip');
  expect(html).toContain('<details class="upload-help">');
  expect(html).toContain('¿Cómo exporto el chat?');
  expect(html).not.toContain('upload-card-android');
});

test('en Android: tarjeta de compartir desde WhatsApp con instalar y enlace al zip', () => {
  mockPlatform = 'android';
  const html = pintar();
  expect(html).toContain('upload-card-android');
  expect(html).toContain('Comparte el chat desde WhatsApp');
  expect(html).toContain('INSTALAR');
  expect(html).toContain('¿Ya tienes el .zip? Súbelo aquí');
  expect(html).not.toContain('upload-dropzone');
});

test('con análisis hecho, el título invita a subir otro chat', () => {
  mockPlatform = 'desktop';
  expect(pintar({ showAnalysis: true })).toContain('¿Quieres analizar otro chat?');
});
