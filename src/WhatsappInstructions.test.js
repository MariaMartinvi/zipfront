// Los vídeos tutoriales se sirven desde Render y cuentan en el ancho de banda: solo deben descargarse al pulsar play
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key }) }));
jest.mock('./InstallPWA', () => () => null);

// eslint-disable-next-line import/first
import WhatsappInstructions from './WhatsappInstructions';

test('el vídeo tutorial no se precarga hasta que el usuario pulsa play', () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement('div');
  act(() => createRoot(container).render(<WhatsappInstructions />));

  const videoTab = [...container.querySelectorAll('button')].find((b) => b.textContent === 'whatsapp.video');
  act(() => videoTab.click());

  expect(container.querySelector('video').getAttribute('preload')).toBe('none');
});
