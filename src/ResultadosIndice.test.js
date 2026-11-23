import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import ResultadosIndice from './ResultadosIndice';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k) => ({ 'app.upload.done_another': 'Subir otro chat' }[k] || k) }) }));

async function pintar(props) {
  document.body.innerHTML = '<div data-ri="resumen"></div><div data-ri="perfiles"></div><div id="raiz"></div>';
  await act(async () => { createRoot(document.getElementById('raiz')).render(<ResultadosIndice {...props} />); });
  return document.querySelector('nav.ri');
}

test('el menú de secciones lleva «Subir otro chat» al final y lo abre al pulsarlo', async () => {
  const onSubirOtro = jest.fn();
  const nav = await pintar({ onSubirOtro });
  const botones = [...nav.querySelectorAll('button')];
  expect(botones.map((b) => b.textContent)).toEqual(['results_nav.resumen', 'results_nav.perfiles', '＋ Subir otro chat']);
  await act(async () => { botones[2].click(); });
  expect(onSubirOtro).toHaveBeenCalledTimes(1);
});

test('sin la función, no sale el botón', async () => {
  const nav = await pintar({});
  expect(nav.textContent).not.toContain('Subir otro chat');
});
