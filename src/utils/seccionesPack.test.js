import { seccionesPackEnTarjetas } from './seccionesPack';

const respuesta = `### 💡 **Recomendaciones**

- 🗓️ **Algo** – Una frase.

---

## De qué habláis

- 🏘️ **Viviendas y reformas** – Comparan casas y pisos.
- 💻 **Proyectos con IA** – Comparten materiales.

---

## Momentos memorables

(una instrucción que la IA haya copiado por error)
- 🏡 **Imaginando las casitas** (febrero de 2026) – Imaginan cómo reformarlas.
- 🪟 **Llegan las ventanas** – Por fin llegan.

---

## Frases descriptivas-literales`;

test('convierte las dos secciones en tarjetas y deja el resto igual', () => {
  const r = seccionesPackEnTarjetas(respuesta);
  expect(r).toContain('- 🗓️ **Algo** – Una frase.');
  expect(r).toContain('## De qué habláis\n\n<div class="pk-rejilla">');
  expect(r).toContain('<span class="pk-emoji">🏘️</span><b>Viviendas y reformas</b><p>Comparan casas y pisos.</p>');
  expect(r).toContain('<b>Imaginando las casitas</b><small>febrero de 2026</small><p>Imaginan cómo reformarlas.</p>');
  expect(r).toContain('<b>Llegan las ventanas</b><p>Por fin llegan.</p>');
  expect(r).not.toContain('una instrucción');
  expect(r).toContain('## Frases descriptivas-literales');
  expect((r.match(/pk-tarjeta/g) || []).length).toBe(4);
});

test('sin las secciones (análisis antiguo u otro idioma) no cambia nada, y escapa el HTML', () => {
  expect(seccionesPackEnTarjetas('## Análisis de personalidades\n\n- algo')).toBe('## Análisis de personalidades\n\n- algo');
  expect(seccionesPackEnTarjetas('## De qué habláis\n\n- 🎯 **<img src=x>** – a<b')).toContain('<b>&lt;img src=x&gt;</b><p>a&lt;b</p>');
});
