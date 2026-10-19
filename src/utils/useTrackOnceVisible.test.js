import React, { useRef, act } from 'react';
import { createRoot } from 'react-dom/client';
import { useTrackOnceVisible } from './useTrackOnceVisible';

// IntersectionObserver falso: guardamos el callback para simular la entrada en pantalla
let callbacks = [];
let disconnects = 0;
beforeEach(() => {
  callbacks = [];
  disconnects = 0;
  window.dataLayer = [];
  global.IntersectionObserver = class {
    constructor(cb) { callbacks.push(cb); }
    observe() {}
    disconnect() { disconnects += 1; }
  };
});

const Bloque = ({ clave, activo = true }) => {
  const ref = useRef(null);
  useTrackOnceVisible(ref, 'paywall_en_pantalla', clave, activo);
  return activo ? <div ref={ref}>bloqueado</div> : null;
};

const montar = (props) => {
  const div = document.createElement('div');
  const root = createRoot(div);
  act(() => root.render(<Bloque {...props} />));
  return { root, rerender: (p) => act(() => root.render(<Bloque {...p} />)) };
};

const entraEnPantalla = () => act(() => callbacks.forEach((cb) => cb([{ isIntersecting: true }])));
const eventos = () => window.dataLayer.map((e) => e.event);

test('envía el evento una sola vez cuando el bloque entra en pantalla', () => {
  montar({ clave: 'op1' });
  expect(eventos()).toEqual([]);
  entraEnPantalla();
  entraEnPantalla();
  expect(eventos()).toEqual(['paywall_en_pantalla']);
  expect(disconnects).toBeGreaterThan(0);
});

test('no repite el evento si el bloque se vuelve a montar con la misma clave', () => {
  const { rerender } = montar({ clave: 'op1' });
  entraEnPantalla();
  rerender({ clave: 'op1', activo: false });
  rerender({ clave: 'op1', activo: true });
  entraEnPantalla();
  expect(eventos()).toEqual(['paywall_en_pantalla']);
});

test('con otra clave (otro chat) vuelve a enviarlo', () => {
  const { rerender } = montar({ clave: 'op1' });
  entraEnPantalla();
  rerender({ clave: 'op2' });
  entraEnPantalla();
  expect(eventos()).toEqual(['paywall_en_pantalla', 'paywall_en_pantalla']);
});

test('no observa nada mientras el bloque no está activo', () => {
  montar({ clave: 'op1', activo: false });
  expect(callbacks).toHaveLength(0);
});

test('sin IntersectionObserver no rompe ni envía nada', () => {
  delete global.IntersectionObserver;
  montar({ clave: 'op1' });
  expect(eventos()).toEqual([]);
});
