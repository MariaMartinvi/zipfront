import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import HeroSection from './components/HeroSection';

const textos = require('../public/locales/es/translation.json');
const { crearT, heroHtml, shellHtml } = require('../scripts/shell');

jest.mock('react-i18next', () => {
  const es = require('../public/locales/es/translation.json');
  const t = (clave, porDefecto) => {
    const v = clave.split('.').reduce((o, k) => (o == null ? o : o[k]), es);
    return typeof v === 'string' ? v : (porDefecto != null ? porDefecto : clave);
  };
  return { useTranslation: () => ({ t, i18n: { language: 'es' } }) };
});

// Pasar por el DOM iguala las diferencias de escapado y de formato de los estilos
const normalizar = (html) => { const d = document.createElement('div'); d.innerHTML = html; return d.innerHTML; };

test('el hero que se pinta desde el HTML es idéntico al de React (si no, la portada daría un salto al montar)', () => {
  expect(normalizar(heroHtml(crearT(textos)))).toBe(normalizar(renderToStaticMarkup(<HeroSection />)));
});

test('la portada del HTML va en un <template> y solo se coloca en "/", en español y sin sesión', () => {
  const html = shellHtml(textos);
  expect(html).toContain('<template id="cs-shell"><div class="app-container" data-shell>');
  expect(html).toContain('<h1 class="hero-title">');
  document.body.innerHTML = '<div id="root"></div>' + html.replace(/<script>[\s\S]*<\/script>/, '');
  const script = html.match(/<script>([\s\S]*)<\/script>/)[1];
  const probar = () => { document.getElementById('root').innerHTML = ''; window.eval(script); return document.getElementById('root').innerHTML; };

  localStorage.clear();
  localStorage.setItem('i18nextLng', 'es');
  expect(probar()).toContain('hero-title');

  localStorage.setItem('cs_sesion', '1');
  expect(probar()).toBe('');
  localStorage.removeItem('cs_sesion');

  localStorage.setItem('i18nextLng', 'en');
  expect(probar()).toBe('');
  localStorage.setItem('i18nextLng', 'es');

  window.history.pushState({}, '', '/plans');
  expect(probar()).toBe('');
  window.history.pushState({}, '', '/');
});
