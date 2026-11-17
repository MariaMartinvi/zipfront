import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import LibroEntrada, { fechaLarga } from './LibroEntrada';

const libro = { portada: '<p>portada</p>', dobles: [{ izq: '<p>a</p>', dcha: '<p>b</p>' }, { izq: '<p>c</p>', dcha: '<p>d</p>' }] };

test('primero se ve su libro cerrado, con un resumen y un solo botón al editor', async () => {
  const onAbrir = jest.fn(), onEditar = jest.fn();
  const div = document.createElement('div');
  await act(async () => {
    createRoot(div).render(<LibroEntrada libro={libro} titulo="Eva & Marcos" paginas={120} capitulos={5} desde="2026-02-13"
      sinFotos precioPdf="12,99 €" onAbrir={onAbrir} onEditar={onEditar} onSubir={() => {}} />);
  });
  expect(div.querySelector('h1').textContent).toBe('Eva & Marcos');
  expect(div.textContent).toContain('120 páginas · 5 capítulos · desde el 13 de febrero de 2026');
  expect(div.textContent).toContain('¿Con fotos?');
  expect(div.querySelectorAll('.lx-cta').length).toBe(1);

  await act(async () => { div.querySelector('.lx-uno').click(); });
  expect(onAbrir).toHaveBeenCalled();
  expect(div.querySelector('.la')).not.toBeNull();  // abierto en el sitio

  await act(async () => { div.querySelector('.lx-cta').click(); });
  expect(onEditar).toHaveBeenCalled();
});

test('fecha larga', () => { expect(fechaLarga('2025-07-02')).toBe('2 de julio de 2025'); });
