import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import LibroCard from './LibroCard';

test('la tarjeta del final del análisis ofrece el libro como opción, con precio y botón', () => {
  const html = renderToStaticMarkup(<MemoryRouter><LibroCard /></MemoryRouter>);
  expect(html).toContain('¿Y si este chat fuera un libro?');
  expect(html).toContain('Si te apetece');
  expect(html).toContain('PDF 12,99 €');
  expect(html).toContain('Ver mi libro gratis');
});
