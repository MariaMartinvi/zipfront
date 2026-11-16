import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import Footer from './Footer';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k, d) => d || k, i18n: { language: 'es' } }) }));

const pintar = (ruta) => renderToStaticMarkup(<MemoryRouter initialEntries={[ruta]}><Footer /></MemoryRouter>);

test('el pie sale en las páginas normales', () => {
  expect(pintar('/')).toContain('app-footer');
  expect(pintar('/libro-recuerdo')).toContain('app-footer');
});

test('en el editor del libro no hay pie: taparía la vista previa y los capítulos', () => {
  expect(pintar('/libro')).toBe('');
  expect(pintar('/libro/')).toBe('');  // al recargar la página llega con barra final
  expect(pintar('/libro/pedido')).toContain('app-footer');
});
