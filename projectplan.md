# Plan: Desplegar pack de 10 + medir el embudo de pago

Fecha: 2026-09-14
Rama: `fix/pack-5-analisis`
Contexto: `DIAGNOSTICO-2026-09-14.md`. 673 usuarios analizan, 9 pagan (1,3%).
No sabemos en qué paso entre "analiza" y "paga" se pierden. Eso es lo que se mide.

## Objetivo

En 2 semanas poder responder: ¿el 98,7% se pierde **antes de mirar** el paywall,
**al ver el precio**, o **en Stripe**?

## Eventos (GA4 vía `dataLayer.push` — la página solo carga GTM, no hay `gtag` propio)

| Evento | Dónde | Cuándo |
|---|---|---|
| `chat_subido` | `App.js` — `processZipFile`, al generar `operationId` | Empieza a procesarse un archivo (cubre botón, compartir Android y archivo corregido) |
| `analisis_devuelto` | `App.js` — `processZipFile`, tras `setChatData` | El chat se ha extraído y se muestra el análisis estadístico |
| `paywall_visto` | `App.js` — bloque `ai-analysis-locked` (~2224) | Se renderiza la sección IA borrosa. **Una vez por análisis** (keyed a `operationId`). |
| `paywall_click` | `App.js:1340` — `startAIAnalysis` sin créditos | Se abre el modal de compra |
| `checkout_iniciado` | `App.js` — `handleAIPurchase` | Pulsa "Comprar", justo antes de ir a Stripe |
| (pago) | Ya existe: `PaymentSuccess.js:64` `conversion` | — |

Sin backend, sin Firestore, sin dependencias nuevas.

## TODOs

- [x] 1. Helper `trackEvent(name)` (`dataLayer.push({event})` + `gtag` si existe) y
      evento `paywall_visto` con `useEffect` sobre `[operationId, userCredits]`.
      → verificar: en local, `window.dataLayer` recibe el evento **una sola vez**
      al terminar un análisis sin créditos; no se repite al hacer scroll/re-render.
      Nota: `chatData` va en las deps porque se asigna DESPUÉS de `operationId` (App.js:579→593).
- [x] 2. `paywall_click` y `checkout_iniciado`.
      → verificar: al pulsar "desbloquear" aparece `paywall_click`; al pulsar
      "Comprar" aparece `checkout_iniciado` antes de la redirección.
- [x] 3. UTM en URL de compartir (`utm_source=share&utm_medium=social`; no `whatsapp`, la hoja de compartir puede ir a cualquier app):
      `shareAnalysisResults.js:669,768,791` y `shareTopProfiles.js:160,304,336,363`
      → `?lang=..&utm_source=share&utm_medium=social`.
      → verificar: `grep` no deja ninguna URL sin utm; compartir en local genera la URL correcta.
- [x] 3b. (añadido por María tras ver el primer evento en GA4) `chat_subido` y `analisis_devuelto`.
      → verificado: build OK; ambos en `dataLayer` al subir un chat. Requiere ampliar la regex del
      trigger de GTM. Nota: `handleZipExtraction` (App.js ~1088) también hace `setChatData` pero
      nadie la llama — código muerto, no tocado.
- [ ] 4. `npm run build` OK (incluye guardia `verify:es`), merge a `main`, push → Render despliega.
      → verificar en producción: el modal dice "10 análisis"; GA4 → Realtime muestra
      `paywall_visto` al hacer un análisis con una cuenta sin créditos.
- [ ] 5. Nota en `DIAGNOSTICO-2026-09-14.md` §8: pack de 10 desplegado + cómo leer el
      embudo en GA4 (Explorar → Embudo: `chat_subido` → `analisis_devuelto` → `paywall_visto` → `paywall_click` →
      `checkout_iniciado` → `conversion`). Fecha de revisión: **28 sept 2026**.

## Cambio sobre la marcha

María: el pack pasa a decir **10 análisis** (no 5) por los mismos 5€. Backend sigue dando 100.

## Fuera de alcance (explícitamente)

- Muestra real gratis del análisis IA — en la nevera hasta tener datos del embudo.
- Quitar urgencia falsa — pendiente, no en este plan.
- Rama `fix/calidad-analisis-ia` — no se toca.

## Verificación

No hay tests automáticos para `gtag` (es un efecto sobre un objeto global externo).
Verificación manual reproducible: DevTools → consola → `window.dataLayer` tras cada acción,
y GA4 Realtime tras el deploy. `npm run build` como red de seguridad de que nada se rompe.
