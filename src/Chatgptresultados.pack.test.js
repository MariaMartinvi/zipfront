import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import fs from 'fs';
import Chatgptresultados from './Chatgptresultados';

jest.mock('./AuthContext', () => ({ useAuth: () => ({ user: { uid: 'prueba' } }) }));
jest.mock('./shareAnalysisResults', () => ({ ShareAnalysisButton: () => null }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k) => k, i18n: { language: 'es' } }) }));

const respuesta = process.env.RESPUESTA_PACK ? fs.readFileSync(process.env.RESPUESTA_PACK, 'utf8') : `## Análisis de personalidades

### Eva
- **Rasgos principales:**
  🏡 **Soñadora práctica** – Imagina proyectos y los aterriza.

---

## Análisis de la relación

### 💡 **Recomendaciones**

- 🗓️ **Calendario común** – Una frase.

---

## De qué habláis

- 🏘️ **Viviendas y reformas** – Comparan casas y pisos.

---

## Momentos memorables

- 🏡 **Imaginando las casitas** (febrero de 2026) – Imaginan cómo reformarlas.

---

## Frases descriptivas-literales`;

test('el análisis pinta "De qué habláis" y "Momentos memorables" como tarjetas', async () => {
  const div = document.createElement('div');
  document.body.appendChild(div);
  await act(async () => { createRoot(div).render(<Chatgptresultados chatGptResponse={respuesta} />); });
  const html = div.innerHTML;
  if (process.env.SALIDA_PACK) fs.writeFileSync(process.env.SALIDA_PACK, html);
  expect(div.querySelectorAll('.pk-rejilla').length).toBe(2);
  expect(html).toContain('Imaginando las casitas');
  expect(div.querySelector('.pk-tarjeta small').textContent).toBe('febrero de 2026');
});

test('la línea COMPARATIVA_DATA del final no se pinta', async () => {
  const div = document.createElement('div');
  document.body.appendChild(div);
  const conDatos = `${respuesta}\n\nCOMPARATIVA_DATA:{"temas":["planes"],"nota":8}`;
  await act(async () => { createRoot(div).render(<Chatgptresultados chatGptResponse={conDatos} />); });
  expect(div.innerHTML).not.toContain('COMPARATIVA_DATA');
  expect(div.innerHTML).toContain('Imaginando las casitas');
});
