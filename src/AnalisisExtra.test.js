import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import AnalisisExtra, { fechaLarga, duracion } from './AnalisisExtra';

const p = (x) => String(x).padStart(2, '0');
const chat = (personas) => {
  const l = [];
  for (let d = 1; d <= 40; d++) {
    const fecha = new Date(2025, 0, d <= 20 ? d : d + 15, 9, 0);
    for (let i = 0; i < 6; i++) {
      const t = new Date(fecha.getTime() + i * 3 * 60000);
      l.push(`${p(t.getDate())}/${p(t.getMonth() + 1)}/${String(t.getFullYear()).slice(2)}, ${p(t.getHours())}:${p(t.getMinutes())} - ${personas[(d + i) % personas.length]}: hola ${i}`);
    }
  }
  return l.join('\n');
};
const pintar = (texto) => renderToStaticMarkup(<MemoryRouter><AnalisisExtra chatData={texto} /></MemoryRouter>);

test('pinta días intensos, récords y equilibrio, y enlaza al libro', () => {
  const html = pintar(chat(['Eva', 'Marcos']));
  expect(html).toContain('Vuestros días más intensos');
  expect(html).toContain('días seguidos hablando');
  expect(html).toContain('El equilibrio');
  expect(html).toContain('capítulos de vuestro libro');
  expect(html).not.toContain('La dinámica del grupo');
});

test('en grupos sale la dinámica del grupo', () => {
  expect(pintar(chat(['Eva', 'Marcos', 'Sara']))).toContain('La dinámica del grupo');
});

test('con un chat vacío o raro no pinta nada ni rompe', () => {
  expect(pintar('')).toBe('');
  expect(pintar('esto no es un chat')).toBe('');
});

test('fechas y duraciones en castellano', () => {
  expect(fechaLarga('2026-01-30')).toBe('30 de enero de 2026');
  expect(duracion(0.5)).toBe('menos de 1 min');
  expect(duracion(4)).toBe('4 min');
  expect(duracion(90)).toBe('1,5 h');
});
