import fs from 'fs';
import path from 'path';
import { trackEvent } from './analytics';

// Debe coincidir con el "Nombre del evento" (regex) del activador de GTM GTM-P4PTW3CH.
const GTM_ACTIVADOR =
  'chat_subido|analisis_devuelto|paywall_visto|paywall_click|checkout_iniciado|' +
  'juego_ver_titulares|juego_ver_personalidad|juego_compartir_titulares|juego_compartir_personalidad|' +
  'juego_jugado|juego_resultado_compartir|compartir_top_perfiles|compartir_analisis_ia';

const eventosEnElCodigo = () => {
  const src = path.join(__dirname, '..');
  const nombres = new Set();
  const recorrer = (dir) => {
    fs.readdirSync(dir, { withFileTypes: true }).forEach((e) => {
      const ruta = path.join(dir, e.name);
      if (e.isDirectory()) return recorrer(ruta);
      if (!/\.js$/.test(e.name) || /\.test\.js$/.test(e.name)) return;
      const codigo = fs.readFileSync(ruta, 'utf8');
      for (const m of codigo.matchAll(/trackEvent\('([a-z_]+)'\)/g)) nombres.add(m[1]);
    });
  };
  recorrer(src);
  return nombres;
};

beforeEach(() => {
  window.dataLayer = [];
  delete window.gtag;
});

test('envía el evento al dataLayer de GTM', () => {
  trackEvent('juego_jugado');
  expect(window.dataLayer).toEqual([{ event: 'juego_jugado' }]);
});

test('todos los eventos del código están en el activador de GTM', () => {
  const permitidos = new Set(GTM_ACTIVADOR.split('|'));
  const usados = eventosEnElCodigo();
  expect(usados.size).toBe(13);
  [...usados].forEach((nombre) => expect(permitidos.has(nombre)).toBe(true));
});
