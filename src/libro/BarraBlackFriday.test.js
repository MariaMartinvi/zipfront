import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import BarraBlackFriday, { FIN_BLACK_FRIDAY } from './BarraBlackFriday';

let mockIdioma = 'es';
jest.mock('react-i18next', () => ({ useTranslation: () => ({ i18n: { language: mockIdioma } }) }));

const pintar = () => renderToStaticMarkup(<MemoryRouter><BarraBlackFriday /></MemoryRouter>);
afterEach(() => { jest.restoreAllMocks(); mockIdioma = 'es'; });

test('hasta el 30-nov anuncia BLACK26 y deja claro que es para el libro', () => {
  jest.spyOn(Date, 'now').mockReturnValue(FIN_BLACK_FRIDAY - 1);
  const html = pintar();
  expect(html).toContain('BLACK26');
  expect(html).toContain('en el libro');
  expect(html).toContain('href="/libro-recuerdo"');
});

test('desaparece el 1-dic y en otros idiomas (el libro solo se vende en castellano)', () => {
  jest.spyOn(Date, 'now').mockReturnValue(FIN_BLACK_FRIDAY);
  expect(pintar()).toBe('');
  jest.spyOn(Date, 'now').mockReturnValue(FIN_BLACK_FRIDAY - 1);
  mockIdioma = 'en';
  expect(pintar()).toBe('');
});
