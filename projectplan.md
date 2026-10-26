# Plan: Arreglar anonimización antes del análisis IA (+ subir de modelo)

Fecha: 2026-09-28
Rama: `fix/anonimizacion-participantes`

## Problema

Chat Maria / Eva Pan (2 personas). El análisis psicológico devuelve 3 participantes.

Causa raíz (confirmada por el log de consola):
- `anonymizationService.anonymizeParticipants` usa dos regex propias y estrictas
  (coma obligatoria entre fecha y hora, año de 2 cifras, segundos obligatorios en iOS).
- La exportación de Maria no encaja → casi ninguna línea se anonimiza.
- El texto viaja a OpenAI con **nombres reales** ("Maria:", "Eva Pan:").
  El log lo confirma: `PARTICIPANTES QUE APARECEN EN TEXTO FINAL: []`.
- Como en el chat se habla de "Claude" en tercera persona, la IA lo toma por
  un tercer participante. La regla del prompt "no inventes nombres" solo
  funciona si los nombres llegan como "Participante N".

Consecuencias: análisis erróneo **y fuga de privacidad** (la app promete anonimizar).

Pista clave: el análisis estadístico ya acierta (2 personas) porque usa
`formatDetector.js` (`PATRON_IOS`, `PATRON_ANDROID`), que sí es tolerante:
coma opcional, año 2–4 cifras, segundos opcionales, AM/PM. La anonimización
no reutiliza esos patrones.

## Suposiciones

- El fichero `.txt` de Maria tiene un formato que `PATRON_IOS`/`PATRON_ANDROID`
  ya reconocen (lo demuestra que las estadísticas salen bien). Se verificará
  con las primeras líneas reales del fichero.
- El prompt y el modelo viven en el backend Python (otro repo, no está en este Mac).
  Cambiar de modelo requiere acceso a ese repo.

## TODOs

- [x] 1. Test que reproduce el bug: líneas con el formato real de la exportación de
      Maria (con y sin coma, año de 4 cifras, prefijo invisible `U+200E` (marca invisible de WhatsApp)) pasadas a
      `anonymizeParticipants` deben devolver "Participante 1" / "Participante 2".
      → verificar: el test **falla** con el código actual.

- [x] 2. `anonymizeParticipants` reutiliza `PATRON_IOS` y `PATRON_ANDROID` de
      `formatDetector.js` en lugar de sus regex propias. Se quita el carácter
      `U+200E` (marca invisible de WhatsApp) al inicio de cada línea antes de comparar.
      → verificar: test del TODO 1 pasa; `formatDetector.test.js` sigue pasando;
        los formatos que ya funcionaban (iOS con coma, Android) siguen anonimizando.

- [x] 3. Guardia antes de llamar a la IA en `fileService.js`: si el texto final no
      contiene ningún "Participante N:", **no se envía** y se devuelve un error
      claro al usuario ("No se ha reconocido el formato del chat").
      Esto cierra la fuga de privacidad para cualquier formato futuro desconocido.
      → verificar: test con un texto de formato inventado devuelve `success: false`
        y no llama a `unifiedAIService.getResponse`.

- [ ] 4. Verificación manual con el zip real de Eva Pan en local:
      la consola muestra 2 participantes en "TEXTO FINAL" y el análisis IA
      describe solo a 2 personas.

## Subir de modelo (fuera de este repo)

El modelo se elige en el backend Python. Hoy: `gpt-4o-mini`, temperatura 0.7,
fallback `mistral-small-latest`.

Propuesta cuando tengamos el repo del backend:
- Subir a un modelo de la gama media-alta de OpenAI (un escalón por encima de mini).
- Bajar temperatura a 0.2–0.3: el formato Markdown/JSON que espera el front es rígido
  y la temperatura alta lo rompe.
- Confirmar precio en la página de precios de OpenAI antes de decidir; el coste por
  análisis se multiplica por la longitud del chat (hasta 20.000 caracteres).

Importante: el modelo **no arregla** el bug de este plan. Con nombres reales sin
anonimizar, cualquier modelo puede confundirse. Primero TODOs 1–4, luego modelo.

## Fuera de alcance

- Tocar el prompt (está en el backend).
- Cambiar el resto de la anonimización (personas mencionadas, teléfonos, etc.).
- Refactorizar `Chatgptresultados.js`.

## Review (parcial: falta la verificación manual del TODO 4)

Hecho:
- `anonymizationService.anonymizeParticipants` usa ahora `PATRON_IOS` / `PATRON_ANDROID`
  de `formatDetector.js` (los mismos que el análisis estadístico). Quita la marca
  invisible U+200E al inicio de línea. La línea resultante conserva fecha y mensaje.
- Guardia en `getMistralResponse`: si ningún "Participante N:" aparece en el texto
  final, devuelve `success:false` con mensaje claro y no llama a la IA. El crédito
  no se descuenta (solo se descuenta tras éxito).
- Tests: `anonymizationService.test.js` (9) y `fileService.test.js` (2). Suite completa: 27/27.
- Build de producción compila y pasa `es-check`.

Aprendizajes:
- El bug de "3 participantes" no era del modelo: era que los nombres reales llegaban
  a la IA y el chat hablaba de "Claude" en tercera persona.
- `processContentForAzure` tiene un `catch` que devuelve el contenido **original**
  si algo falla: otra vía de fuga. La guardia nueva la cubre también.
- `anonymizationService.js` exporta con `module.exports`; hay que usar `require`
  y no `import` dentro de él, o webpack rompe el bundle.

## Pendiente en el backend: regla dura de participantes en el prompt

La app envía a la IA los nombres ya sustituidos por la palabra del idioma del usuario
(`getParticipantWord`): es "Participante", en "Participant", de "Teilnehmer",
it "Partecipante", fr "Participant", pt "Participante". El prompt de cada idioma
debe añadir, justo después de la línea "INICIO TÉCNICO REQUERIDO", esta regla:

- **es**: 🔒 REGLA ABSOLUTA: los únicos participantes válidos son los que aparecen
  como "Participante 1", "Participante 2", etc. al inicio de una línea seguido de dos
  puntos. Cualquier otro nombre que aparezca en el texto (personas mencionadas,
  marcas, asistentes de IA, etc.) NO es un participante: no lo analices ni lo cites
  como tal bajo ningún concepto.
- **en**: 🔒 ABSOLUTE RULE: the only valid participants are those appearing as
  "Participant 1", "Participant 2", etc. at the start of a line followed by a colon.
  Any other name in the text (people mentioned, brands, AI assistants, etc.) is NOT a
  participant: never analyze or list it as one.
- **de**: 🔒 ABSOLUTE REGEL: Die einzigen gültigen Teilnehmer sind diejenigen, die als
  "Teilnehmer 1", "Teilnehmer 2" usw. am Zeilenanfang gefolgt von einem Doppelpunkt
  erscheinen. Jeder andere Name im Text (erwähnte Personen, Marken, KI-Assistenten
  usw.) ist KEIN Teilnehmer: niemals analysieren oder als solchen aufführen.
- **it**: 🔒 REGOLA ASSOLUTA: gli unici partecipanti validi sono quelli che compaiono
  come "Partecipante 1", "Partecipante 2", ecc. all'inizio di una riga seguiti da due
  punti. Qualsiasi altro nome nel testo (persone menzionate, marchi, assistenti IA,
  ecc.) NON è un partecipante: non analizzarlo né citarlo come tale in nessun caso.
- **fr**: 🔒 RÈGLE ABSOLUE : les seuls participants valides sont ceux qui apparaissent
  comme « Participant 1 », « Participant 2 », etc. en début de ligne suivis de deux
  points. Tout autre nom dans le texte (personnes mentionnées, marques, assistants
  IA, etc.) N'EST PAS un participant : ne l'analyse jamais et ne le cite jamais comme tel.
- **pt**: 🔒 REGRA ABSOLUTA: os únicos participantes válidos são os que aparecem como
  "Participante 1", "Participante 2", etc. no início de uma linha seguidos de dois
  pontos. Qualquer outro nome no texto (pessoas mencionadas, marcas, assistentes de
  IA, etc.) NÃO é um participante: nunca o analises nem o cites como tal.

Además, en el mismo cambio del backend: bajar temperatura de 0.7 a 0.2–0.3.
Verificar: analizar el chat de Eva Pan → exactamente 2 participantes.

### Estado backend (2026-09-28) — hecho en `/Users/maria/zipback`, rama `main`, sin commit
- [x] Regla absoluta de participantes en los 6 prompts (`services/constants.py`), antes de "🎯".
- [x] Italiano: "Participante" → "Partecipante" (el front envía "Partecipante").
- [x] Temperatura 0.7 → 0.3 en `openai_service.py` y `mistral_service.py`.
- [x] Modelo `gpt-4o-mini` → `gpt-4.1` en `openai_service.py`.
- [x] Test `tests/test_prompts.py` (`python3 -m unittest tests.test_prompts`): 3/3 OK.
- Precio confirmado en developers.openai.com (por 1M tokens): 4o-mini 0,15$/0,60$; 4.1 2$/8$.
  Un análisis (~8k tokens entrada, ~2k salida) pasa de ~0,002$ a ~0,03$. El pack cobra 0,50€/análisis.
- Pendiente: verificación manual con el chat de Eva Pan tras desplegar (exactamente 2 participantes).
- ⚠️ Seguridad: `service-account.json` (credenciales admin de Firebase) está commiteado en zipback.
  Rotar clave y sacarlo del repo. Fuera del alcance de hoy.

## Cierre 2026-09-28

- Desplegado front (anonimización + guardia) y backend (prompt 6 idiomas, gpt-4.1, temp 0.3, pack 10 créditos). Maria hizo los push.
- Hotfix extra desplegado: `App.js` rompía en iPhone cuando `navigator.serviceWorker` no existe
  (navegación privada / navegadores in-app). Bug desde mayo 2025. Verificado por Maria en iPhone.
- Botones de compartir: funcionan en iPhone y Android (hoja nativa). En escritorio solo salen las
  apps del sistema; no es un fallo. Sin cambios.
- Pendiente: rotar y sacar `service-account.json` del repo zipback; rotar SECRET_KEY de render.yaml.
- Modal de compra: línea "Paga con tarjeta, Bizum, PayPal, Apple Pay o Google Pay" bajo el botón (Bizum solo en ES).
  Test `AIPurchaseModal.test.js`. Subir SOLO cuando Bizum aparezca de verdad en el checkout de Stripe.
- Página de planes: botón de compra movido arriba del todo + "Ahora también puedes pagar con PayPal o Bizum" (6 idiomas).
- Evento de compra GA4 arreglado: `trackPurchase` en PaymentSuccess.js (sin depender de window.gtag, sin email, valor 5 €)
  + backend success_url con `?session_id={CHECKOUT_SESSION_ID}` (antes nunca llegaba). Tests en ambos lados.
- ⚠️ Pendiente de decisión: la página de planes muestra cifras inventadas (15.8xx compradores, 4.8/5, contador y stock falsos).

# Plan: precio reducido para Latinoamérica (2026-09-28)

Decidido con Maria: 1,99 € (pago único, EUR) para LatAm hispanohablante + Brasil. Resto: 5 €.
Adaptive Pricing (activo) convierte 1,99 € a moneda local donde puede (MX, CO, PE, CL, BR...).
VE y AR ven 1,99 € (PayPal disponible). EE. UU., Canadá y Puerto Rico: 5 €.

Región por zona horaria del navegador (lista cerrada, no "America/*"). Riesgo de falseo asumido.
El precio lo elige el BACKEND según la región; deja de aceptar priceId del cliente.

## TODOs
- [x] 1. Backend `pricing.py`: PLANS (normal + latam, ambos 10 créditos) y `select_price_id(region)`.
      Latam inactivo hasta tener price ID (cae al normal). → tests unitarios.
- [x] 2. Backend `create_checkout_session` usa `select_price_id(data.region)`, ignora priceId del cliente.
      Webhook reconoce ambos precios (ya itera PLANS). → test AST + tests pricing.
- [x] 3. Front `src/utils/pricing.js`: región por zona horaria + precios a mostrar; flag LATAM_PRICE_ACTIVE.
      → tests (Caracas/Bogotá/São Paulo → latam; Nueva York/Madrid/Puerto Rico → default; flag off → 5 €).
- [x] 4. Front: textos de precio con {{price}}/{{original}}/{{perAnalysis}} en 6 idiomas; modal, planes,
      portada y botones de desbloqueo leen de pricing.js; `purchaseAICredits` envía la región.
      Corrige "0,05 €/análisis" → valor real. → tests + build.
- [x] 5. Maria crea el precio 1,99 € en Stripe y pasa el price ID → activar en backend y front.
- [x] 6. Verificación: Stripe con email `+location_VE` / `+location_MX`; zona horaria simulada en Chrome.

## Review (precio Latinoamérica, 2026-09-28)

Hecho y verificado por Maria en producción (zona horaria simulada + VPN Brasil):
- LatAm ve 1,99 € (Stripe ofrece moneda local o EUR; PayPal aparece pagando en EUR). España sigue en 5 €.
- El servidor elige el precio por región; ya no acepta priceId del cliente (hueco cerrado).
- Corregido texto falso "0,05 € por análisis" → 0,50 € (0,20 € en LatAm).

Aprendizajes:
- Stripe decide moneda y métodos por la IP del cliente; nuestra web decide el precio por zona horaria.
- PayPal vía Stripe no admite BRL/MXN/COP/CLP/PEN: solo aparece si el cliente elige EUR.
- En el JS minificado el "€" va escapado: buscar "1,99" sin símbolo al verificar el bundle.
- Orden de despliegue: backend antes que front cuando el front depende de él.

Pendientes:
- Stripe (Maria): renombrar producto "Basic Plan" y nombre público "ChatSalsa" en vez de "Comartinvi".
- Decidir qué hacer con las cifras inventadas de la página de planes (15.8xx compradores, 4,8/5, contador, stock).
- Seguridad: rotar y sacar service-account.json de zipback; SECRET_KEY de render.yaml.
- Confirmar purchase_completed en GA4 con la próxima venta real.
- Botón compartir resultado también en el juego de titulares (si se quiere).

# Plan: 2,99 € para España + Bizum más visible (2026-10-02)

Mismo patrón que Latam: el backend elige el precio por región; el front muestra el precio
y envía la región. Región 'es' = zona horaria Europe/Madrid, Atlantic/Canary o Africa/Ceuta.
El 2,99 € solo se activa cuando exista el price ID en Stripe (hasta entonces, 5 €).

## TODOs
- [x] 1. Backend `pricing.py`: pack `ai_pack_10_es` (2,99 €, 10 créditos, env `STRIPE_PRICE_ID_ES`,
      vacío = inactivo) y `select_price_id('es')`. → tests unitarios.
- [x] 2. Front `pricing.js`: región 'es' (2,99 €, 5 € tachado, 0,30 €/análisis) tras flag
      `ES_PRICE_ACTIVE` (activado: price ID `price_1UM7JLF4OlRGsz647pAGLKHy`); `isSpainTimeZone`. → tests.
- [x] 3. Front: aviso Bizum destacado solo para usuarios en España (modal de compra y página
      de planes). → test del modal + build.
- [x] 4. Maria crea el precio 2,99 € en Stripe y pasa el price ID → activar backend y front.

## Review (2,99 € España + Bizum, 2026-10-02)

- Backend: pack `ai_pack_10_es` 2,99 € (10 créditos), `STRIPE_PRICE_ID_ES` con el price ID por defecto;
  vaciar la variable en Render desactiva el precio. `select_price_id` acepta 'latam', 'es' o normal.
- Front: Madrid/Canarias/Ceuta → región 'es' (2,99 €, 5 € tachado, 0,30 €/análisis). Resto Europa/EE. UU.: 5 €.
- Bizum: aviso verde "En España puedes pagar con Bizum" en el modal de compra (encima del botón) y en la
  página de planes, solo para usuarios con zona horaria de España (antes dependía del idioma, y los
  latinoamericanos en español veían Bizum aunque no les funciona).
- Tests: backend 14 OK; front 84 OK; build + es-check OK.

Verificar en producción (Maria): desde España, modal muestra 2,99 € y el aviso de Bizum; Stripe cobra 2,99 €
y el pack suma 10 créditos. Desde fuera de España (zona horaria simulada en Chrome): 5 € y sin aviso Bizum.

# Plan: Latam en dólares + aviso PayPal (2026-10-03)

Decidido con Maria: Latam pasa de 1,99 € a 1,99 US$ (price ID `price_1UMOBqF4OlRGsz64Bx0gSkxY`),
y la web muestra "US$" (no "$", que en Latam significa pesos). Aviso destacado de PayPal para Latam,
como el de Bizum en España.

## TODOs
- [x] 1. Backend `pricing.py`: pack Latam usa el price ID en USD. → tests.
- [x] 2. Front `pricing.js`: Latam muestra 1,99 US$ / 5 US$ tachado / 0,20 US$ por análisis. → tests.
- [x] 3. Front: aviso de pago por región (`getPaymentHighlightKey`): Bizum en España, PayPal en Latam,
      nada en el resto. Modal y página de planes. Textos es/en/pt. → test del modal + build.

## Review (Latam en dólares + PayPal, 2026-10-03)

- Latam se cobra en 1,99 US$ (Maria eligió la cifra redonda frente a 2,29 US$ ≈ 1,99 €). Stripe sigue
  convirtiendo a moneda local donde puede; en VE/AR verán dólares, que allí es moneda habitual.
- La web muestra "1,99 US$", "5 US$" tachado y "0,20 US$ por análisis" en los 6 idiomas (interpolación).
- Aviso de pago destacado unificado en `getPaymentHighlightKey()`: Bizum (España) / PayPal (Latam) / nada.
- Línea pequeña de métodos de pago por región: `payment_methods_bizum` (6 idiomas) solo en España; el resto sin Bizum.
- Página de planes: segundo botón de compra debajo del precio (el de arriba se mantiene); `renderPurchaseButton()`.
- Tests: backend 14 OK; front 86 OK; build + es-check OK.

# Plan: reducir ancho de banda en Render (2026-10-19)

Render (plan con 5 GB/mes incluidos) iba a 4,14 GB el día 19 → proyección ~6,5–7 GB. ~55 % lo gasta este
static site. Causa: 3 vídeos tutoriales en `public/` (83 MB: iOS 43,5 MB, desktop 21,3 MB, Android 18,1 MB);
los picos de 43–68 MB/h en Render coinciden con reproducciones del vídeo de iOS.

## TODOs
- [x] 1. Comprimir los 3 vídeos con ffmpeg (H.264, máx. 720p, sin audio si no lo tiene útil, faststart).
      → verificar: tamaño total < 12 MB, duración igual a la original, se reproducen en el navegador.
- [x] 2. `preload="none"` en el `<video>` de `WhatsappInstructions.js` (no descarga nada hasta pulsar play).
      → verificar: test del componente + build.

## Review (ancho de banda Render, 2026-10-19)

- Vídeos: 83 MB → 2,8 MB (desktop 21,3→0,6; iOS 43,5→1,6; Android 18,1→0,55). 720×1280, H.264 CRF 28,
  faststart. Se quitó la pista de audio: era silencio (-91 dB). Duraciones idénticas; fotograma comparado a ojo:
  el texto se lee igual.
- `preload="none"` en el `<video>`: no se descarga nada hasta pulsar play. Test nuevo
  `WhatsappInstructions.test.js` (falla sin el cambio, pasa con él).
- Tests: front 88 OK; build + es-check OK.
- Aprendizaje: Render solo factura lo que sale (respuestas), no lo que suben los usuarios. Un único fichero
  estático pesado multiplicado por visitas pesa más que toda la app.
- [x] 3. Source maps públicos (12,6 MB, exponen el código fuente): `GENERATE_SOURCEMAP=false` en `build:render`.
      → verificar: `npm run build:render` no genera ningún `.map` ni `sourceMappingURL`; tests y es-check OK.

Verificar en producción (Maria): tras el deploy, abrir Instrucciones → Vídeo en móvil y escritorio y ver que se
reproduce; en unos días, en Render → Metrics de zip-extractor-fronend no deberían aparecer picos de 40–60 MB/h.
- Source maps desactivados en `build:render`: build sin ningún `.map` (de ~24 MB a 11 MB); tests 88 OK; es-check OK.

# Plan: paywall IA más arriba + mensaje "desbloquear todo" (2026-10-19)

## Contexto

Embudo actual (datos de otra sesión, dados por Maria): ~224 usuarios llegan al paywall al mes, 8 ventas. Orden de
pantalla en `App.js` (líneas ~2180-2440): Resumen general → Perfiles destacados (~20 tarjetas con nombres reales) →
Juegos → Análisis psicológico (IA, bloqueado sin créditos) → resto de estadística. El usuario llega al paywall
tras un scroll enorme y ya saciado.

Decisiones de Maria:
- **Toda la estadística sigue gratis**, perfiles destacados incluidos. No se tapan nombres.
- **No** se pone marca de agua ni se bloquea el compartir.
- Sí: subir el bloque IA y vender "desbloquear todo", no "créditos".
- Medición: antes/después 14 días con el embudo que ya existe. Sin A/B.

## Suposiciones

- "Un solo desbloqueo" es un cambio de **mensaje**, no de producto: el pack de Stripe ya es una compra única
  (10 análisis). No se toca backend ni precios.
- `paywall_visto` se deja **tal cual** para que el antes/después sea comparable. Para medir "en pantalla" de verdad
  se añade un evento nuevo. Las ratios a comparar se calculan sobre `chat_subido`, que no cambia.
- Textos en los 6 idiomas (`public/locales/{es,en,fr,de,it,pt}`).
- No hay test de render de `App.js` (Firebase, etc.); el cambio de orden se verifica a mano.

## TODOs

- [x] 1. Mover el bloque "Análisis psicológico" (`chat-analysis-section`) justo después de `AnalisisTop`, antes de
      `Juegos`. Solo cambia la posición del JSX, nada dentro.
      → verificar: `npm test` y `npm run build` OK; a mano, con un usuario sin créditos, el bloque IA bloqueado
      aparece justo debajo de la última tarjeta de perfil y los juegos debajo; con créditos/admin el flujo de
      análisis IA sigue igual.
- [x] 2. Evento nuevo `paywall_en_pantalla`: hook `useTrackOnceVisible(ref, evento, clave)` en `src/utils/`
      con `IntersectionObserver`; dispara una vez por `operationId` cuando el bloque bloqueado entra en pantalla.
      Sin `IntersectionObserver` (navegadores in-app viejos) no hace nada. Añadirlo al regex de
      `analytics.test.js`. **Maria: añadirlo al activador de GTM `GTM-P4PTW3CH`.**
      → verificar: test del hook (dispara una vez, no repite al re-entrar, vuelve a disparar con otra clave);
      `analytics.test.js` pasa.
- [x] 3. Mensaje "desbloquear todo" en los 6 idiomas. Propuesta (es):
      - `ai_preview.unlock_button`: "🔓 Desbloquear todo el análisis IA de este chat · {{price}}"
      - `ai_preview.unlock_note`: "Pack de 10 análisis · solo {{perAnalysis}} cada uno"
      - `ai_purchase.modal_title` / `title`: "Desbloquea todo lo que la IA ha visto en este chat"
      - `ai_purchase.full_chat_notice`: "✨ Personalidad de cada persona + señales de alerta + nota de la
        relación + consejos"
      - `ai_purchase.buy_button`: "Desbloquear ahora (pago seguro con Stripe)"
      Se mantiene "Pack de 10 análisis" visible: es lo que se vende y no hay que prometer otra cosa.
      → verificar: `AIPurchaseModal.test.js` y `pricingTexts.test.js` pasan (ajustar los textos esperados).
- [ ] 4. Anotar aquí la fecha del deploy y la línea base de los 14 días anteriores (`chat_subido`,
      `paywall_click`, `checkout_iniciado`, ventas en Stripe). A los 14 días, comparar `paywall_click/chat_subido`
      y `checkout_iniciado/chat_subido`, y ventas.

Fuera de alcance: tapar perfiles, marca de agua al compartir, A/B, backend/precios.

Riesgo a vigilar: los juegos bajan de posición → `juego_jugado` y los `juego_compartir_*` pueden bajar.

## Review (paywall IA más arriba, 2026-10-19)

- Orden nuevo: Resumen → Perfiles destacados → **Análisis IA** → Juegos → resto de estadística. Solo cambió de sitio
  el bloque de Juegos (12 líneas); nada dentro de los bloques.
- Evento nuevo `paywall_en_pantalla` (hook `useTrackOnceVisible`, `IntersectionObserver`, una vez por `operationId`).
  `paywall_visto` se mantiene igual para no romper la comparación antes/después. 5 tests nuevos.
- Textos "desbloquear todo" en es/en/fr/de/it/pt (6 claves por idioma). `ai_purchase.title`, `ai_purchase.price` y
  `ai_purchase.unlock_button` no se usan en el código (traducciones muertas); `title` se cambió por coherencia.
- Tests: front 93 OK (12 suites); `npm run build` + es-check OK. Las advertencias de lint del build son previas.
- Aprendizaje: un desbloqueo ya cubre el chat entero (1 crédito = 1 análisis con todas las personas), así que
  "todo el análisis IA de este chat" es literal; el pack de 10 es el extra para más chats.

Pendiente de Maria (TODO 4):
- Añadir `paywall_en_pantalla` al activador de GTM `GTM-P4PTW3CH` (regex de "Nombre del evento").
- Comprobar en local/producción con un usuario sin créditos: bloque IA bloqueado justo bajo los perfiles, juegos
  debajo; con créditos el análisis IA sigue funcionando.
- Anotar aquí fecha de deploy y línea base de los 14 días previos: `chat_subido`, `paywall_click`,
  `checkout_iniciado`, ventas Stripe. A los 14 días: `paywall_click/chat_subido`, `checkout_iniciado/chat_subido`,
  ventas, y vigilar `juego_jugado`.


# Plan: "La Porra del Grupo", juego para las cenas de Navidad (2026-10-19)

## Decisiones de Maria

1. Producto **separado** del pack de IA: 2,99 € el juego. Los dos precios actuales de la IA no cambian.
2. Al pagar se descargan **dos PDFs**: el de preguntas (hoja de jugador) y el de respuestas contestadas (acta
   del moderador rellena), con respuestas creativas y graciosas.
3. Promoción: vídeo de gente jugando y preguntas/respuestas sueltas en la landing.
4. Entrada propia en el menú y guiño en la landing.
5. **Solo en castellano**: el producto y su enlace existen solo cuando el idioma es `es`.
6. Mismo chat, mismo proceso y misma privacidad que el análisis actual.
7. Objetivo: en producción el 1 de diciembre.

## Lo que ya existe y se reutiliza (sin cambios)

- Privacidad: anonimización en el navegador (`anonimizarChat`), nombres sustituidos antes de la IA y restaurados
  al pintar (`lastNameMapping`), opción del usuario de no enviar a la IA (`skipAIPsychologicalAnalysis`),
  borrado de ficheros tras el análisis (`tryDeleteFiles`), chat guardado en localStorage (sobrevive a Stripe).
- Pago: checkout por región (`select_price_id`), webhook que reconoce el `price_id` y escribe créditos en
  Firestore (`stripe_handler.py:380-410`), `canUseAI` / `decrementAICredits` en `firebase_auth.js`.
- Ronda 1: 9 de 10 preguntas salen de perfiles ya calculados (`lastAnalysisTopData`). Pregunta 10
  ("palabrotas") pasa a "¿Quién llena el chat de emojis?" (Happy Flower).
- `jspdf` y `html2canvas` ya están en `package.json`.

## Suposiciones (corregir si no)

- **Una compra = un chat** (`porraCredits` en el perfil, igual que `aiCredits`). Latam: 2,99 US$.
- La Ronda 2 la responde la IA con una llamada propia (prompt de vacile, con cita del chat como prueba). Si el
  usuario rechazó enviar el chat a la IA, el juego se vende igual pero **solo con la Ronda 1** (10 preguntas de
  estadísticas); los PDFs salen sin Ronda 2 y se avisa antes de comprar.
- Los PDFs se generan en el navegador desde dos plantillas HTML con el diseño del PDF que ya tienes
  (`html2canvas` + `jspdf`, A4). No pasan por el servidor ni se guardan.
- Los textos graciosos de la Ronda 1 son plantillas mías con el dato real ("Marta: 2.341 mensajes. El grupo es
  su podcast").

## TODOs

### B. Backend (zipback)
- [x] B1. `pricing.py`: plan `porra` (2,99 €, `STRIPE_PRICE_ID_PORRA`, y Latam `STRIPE_PRICE_ID_PORRA_LATAM`)
      con `porra_credits: 1`. Checkout acepta `product: 'porra'`. Webhook suma `porraCredits` en vez de `aiCredits`.
      → verificar: `tests/test_pricing.py` y test del webhook con un evento de ejemplo.
      **Maria: crear los dos precios en Stripe y las variables en Render.**
- [x] B2. Endpoint `/api/porra-analysis`: misma auth, mismo rate limit y misma entrada anonimizada que
      `/api/mistral-analysis`; prompt que devuelve JSON con las 10 respuestas de la Ronda 2 (nombre, frase
      graciosa, cita). No guarda nada.
      → verificar: test con respuesta de Mistral simulada; prueba real con un chat.

### F. Front
- [x] F1. `pricing.js`: precio del juego por región; `firebase_auth.js`: `canUsePorra`, `decrementPorraCredit`,
      `purchasePorra`. → verificar: tests de pricing.
- [x] F2. `src/utils/porra.js`: preguntas de las dos rondas y función pura que rellena la Ronda 1 desde los datos
      de perfiles con frases graciosas. → verificar: tests unitarios.
- [x] F3. `src/utils/porraPdf.js`: genera los dos PDFs (A4) desde plantillas HTML; restaura nombres reales con
      `lastNameMapping`. → verificar: test de que el HTML contiene las 20 preguntas y los nombres; descarga a mano.
- [x] F4. Bloque en resultados (solo `es`, con chat subido): "La Porra del Grupo · 2,99 €" → checkout. Con
      `porraCredits`: botón "Generar mi Porra" → llama a B2, descuenta el crédito y descarga los dos PDFs.
      Eventos `porra_click`, `porra_checkout`, `porra_descargada` (regex de `analytics.test.js` + GTM).
      → verificar: tests del bloque (sin crédito / con crédito); flujo completo en Stripe modo test.
- [x] F5. Página `/porra-navidad`: vídeo, cómo se juega, preguntas de muestra, botón "Sube tu chat". Entrada en
      `Header.js` y guiño en la landing (`HeroSection.js`), ambos solo en `es`.
      → verificar: tests de render; a mano en móvil.

### Después (Maria)
- [ ] Vídeo de promoción. Activador GTM con los 3 eventos nuevos. Línea base y métricas: `porra_click`,
      `porra_checkout`, pagos del juego en Stripe.

Fuera de alcance: otros idiomas, cambios en el pack de IA o en la parte gratis, modo fiesta en pantalla.

## Review (La Porra del Grupo, 2026-10-19)

Hecho esta tarde, todo en local y con tests; **nada desplegado** (ni zipback ni front):

- **Backend (zipback, commits cd0d25b y e3961e0):** producto `porra` con precio propio por región, checkout con
  `product: 'porra'`, webhook que suma `porraCredits`, endpoint `/api/porra-analysis` (misma auth y misma entrada
  anonimizada que la IA; prompt de vacile en castellano; JSON validado). 31 tests OK.
- **Front:** `pricing.js` (2,99 € / 2,99 US$), `firebase_auth.js` (`canUsePorra`, `decrementPorraCredit`,
  `purchasePorra`), `fileService.getPorraResponse` (mismo camino de privacidad que `getMistralResponse`),
  `utils/porra.js` (20 preguntas + Ronda 1 con frases graciosas desde las estadísticas), `utils/porraPdf.js`
  (dos PDFs A4 en el navegador con la paleta de la web), `PorraSection` en resultados (solo `es`, tras los
  juegos; sin crédito → compra; con crédito → nombre del grupo + generar y descargar), página `/porra-navidad`
  con hueco para el vídeo, enlace "🎄 Juego de Navidad" en el menú y guiño en la landing (solo `es`).
  105 tests OK (15 suites); `npm run build` + es-check OK.
- **Cambio mínimo en lo existente:** `Analisis_top.js` expone `mensajes_por_usuario` (6 líneas);
  `SimplePaymentSuccess` vuelve a `/` cuando `product=porra`; el resto de la web no se toca.
- Sin pagar no se ve nada del juego salvo el bloque de venta (sin preguntas) y la página.

Pendiente de Maria antes de lanzar:
1. **Stripe:** dos precios de pago único, 2,99 € y 2,99 US$. **Render (zipback):** `STRIPE_PRICE_ID_PORRA` y
   `STRIPE_PRICE_ID_PORRA_LATAM`. Sin ellas el botón de compra responde "Producto no disponible".
2. **Deploy de zipback** (commits ya hechos) y push del front.
3. **Vídeo:** subir a `public/videos/porra.mp4` (la página lo oculta sola si no existe).
4. **GTM:** añadir `porra_click`, `porra_descargada` y `porra_pagina_cta` al activador.
5. **Prueba real:** chat de prueba → comprar en modo test → generar → abrir los dos PDFs en móvil.

Aprendizajes: el chat sobrevive a Stripe por localStorage, así que la compra puede hacerse desde los
resultados sin volver a subir nada; la Ronda 1 sale gratis de las estadísticas, la única llamada de pago es la
Ronda 2.

### Cambio del 20-oct: dos juegos independientes
- "La Porra de Halloween" (Ronda 2 tenebrosa) y "La Porra de Navidad" (Ronda 2 de familia), **los dos activos a la
  vez**, cada uno 2,99 € y con su propio crédito (`porraHalloweenCredits` / `porraNavidadCredits`). Ronda 1 común.
- Dos tarjetas en resultados, dos landings (`/porra-halloween` oscura y tenebrosa; `/porra-navidad` cena familiar),
  dos enlaces en el menú y dos guiños en la landing. Vídeos: `public/videos/porra-halloween.mp4` y
  `public/videos/porra-navidad.mp4`.
- Backend (zipback fa5e193, ab475c4): productos `porra_halloween` / `porra_navidad`, prompt y preguntas por tema.
- **Stripe (Maria):** dos productos, cada uno con 2,99 € y 2,99 US$. **Render (zipback):**
  `STRIPE_PRICE_ID_PORRA_HALLOWEEN`, `STRIPE_PRICE_ID_PORRA_HALLOWEEN_LATAM`, `STRIPE_PRICE_ID_PORRA_NAVIDAD`,
  `STRIPE_PRICE_ID_PORRA_NAVIDAD_LATAM`. (Las variables `STRIPE_PRICE_ID_PORRA*` sin tema ya no existen.)
- Tests: backend 34 OK; front 108 OK; build + es-check OK.

### Landings tipo póster (20-oct, tarde)
- `/porra-halloween` y `/porra-navidad`: hero a pantalla completa con las ilustraciones de Maria
  (`public/img/porra-{halloween,navidad}-{h,v}.jpg`, apaisada en escritorio y vertical en móvil), título en tipografía
  de fiesta (Creepster / Mountains of Christmas, cargadas solo en esas páginas), secciones sobre fondo del tema.
- `fix-font-sizes.css` forzaba h1/h2/h3/a/button con `!important`; las landings quedan excluidas con `:not(.porra-page …)`.
- Cajón de subida rediseñado (`UploadBox`): título "Sube tu chat de WhatsApp", Android comparte desde WhatsApp,
  iOS/PC arrastra el zip, instrucciones plegadas.

### Cierre 20-oct (noche)
- Precios: tres tarjetas (Gratis, Análisis IA, Juegos) y fuera urgencia y cifras inventadas.
- Juego: respuestas con GPT-4.1 (Mistral de reserva), muestra de 120.000 caracteres repartida por toda la historia
  del chat, pistas por pregunta y método prueba-primero; acta en dos páginas sin filas partidas; gunicorn timeout 120 s.
- Pendiente para medir negocio: evento de compra del juego en GA4 y píxel de Meta; decidir precio tachado del pack IA.

# Plan: "Consigue tu objetivo · Chat de pareja" (2026-10-21)

## Qué es
Pantalla nueva dentro de ChatSalsa para chats de DOS personas. El usuario dice quién es, qué quiere con la otra
persona, y recibe (tras pagar) un análisis orientado a ese objetivo: puntuación, momentos buenos y mejorables con
alternativa, tono, plan de 2 semanas y mensajes de ejemplo. Pack con seguimientos a los 14 y 28 días.
Origen: especificación pegada por Maria (pantallas, paywall, prompt y prompt de seguimiento).

## Decisiones tomadas
- Dentro de ChatSalsa, pantalla propia (ruta `/pareja`), no producto aparte.
- Nada se enseña antes de pagar salvo que el análisis "está listo": puntuación tapada y bloques con candado.
- Número de "momentos mejorables" antes del pago: texto genérico ("varios momentos"), sin ejecutar la IA antes de
  pagar. Se puede probar el número real más adelante si convierte bien.
- Persistencia en Firestore (perfil del usuario), no en metadatos de Stripe: puntuación, fecha y plan. Nunca mensajes.
- Mismo tratamiento de privacidad que el análisis: anonimización en el navegador, nombres restaurados en el navegador.
- Modelo: GPT-4.1 con Mistral de reserva, como el resto.

## Suposiciones (corregir si no)
- Solo castellano en el lanzamiento, igual que los juegos.
- Precios iguales en todas las regiones: 2,99 € análisis / 4,99 € pack con 2 seguimientos (US$ en Latam).
- Si el chat tiene más de 2 participantes, la pantalla avisa y sugiere el análisis de grupo normal.
- Los avisos por email (14 y 28 días) se dejan para el final y solo si Maria elige proveedor de correo.

## TODOs
- [~] P1. (código hecho; falta que Maria cree los productos en Stripe y pase los price IDs) Backend `pricing.py`: productos `pareja` (2,99) y `pareja_pack` (4,99, 3 créditos: análisis + 2
      seguimientos) con su campo de créditos; checkout y webhook. → tests `test_pricing.py`.
      **Maria: crear los dos productos en Stripe (€ y US$) y pasar los price IDs.**
- [x] P2. Backend: `services/pareja.py` con el prompt (y el de seguimiento), parser estricto del JSON y endpoint
      `/api/pareja-analysis` (misma auth, entrada anonimizada, no guarda nada). → tests del parser y del prompt.
- [x] P3. Front: ruta `/pareja` con cajón de subida (reutiliza `UploadBox`) y detección de 2 participantes.
      → test con chat de 2 y de 3 participantes.
- [x] P4. Pantallas 1 y 2: "¿Quién eres tú en este chat?" y "¿Qué quieres con {X}?" (5 objetivos).
      → test de render.
- [x] P5. Pantalla 3, paywall: bloques con candado y dos botones (2,99 € / ⭐ 4,99 €). Eventos GA4.
      → test de render; compra de prueba.
- [x] P6. Resultado: llamada a P2 con usuario, otra persona y objetivo; página de resultado con todos los bloques;
      alerta de seguridad destacada si viene a true (sin tácticas). → test de render con un JSON de ejemplo.
- [x] P7. Seguimiento: guardar puntuación, fecha y plan en Firestore tras el análisis; si el usuario tiene crédito
      de seguimiento y vuelve con el mismo chat, se usa el prompt de seguimiento con la comparación. → tests.
- [x] P8. Entrada: enlace en el menú y en la portada (solo es), texto de privacidad exacto ("guardamos tu
      puntuación y tu plan, nunca los mensajes") también en la política de privacidad.
- [ ] P9. (Opcional, tras decidir proveedor) avisos por email a los 14 y 28 días con tarea programada en Render.

Fuera de alcance: otros idiomas, chats de grupo, mostrar el número real de momentos antes de pagar.

### Estado 21-oct
- Hecho: backend (productos `pareja` 1 crédito / `pareja_pack` 3 créditos, `/api/pareja-analysis` con GPT-4.1 y
  Mistral de reserva, parser que vacía los mensajes si hay alerta de seguridad), página `/pareja` con subida,
  ¿quién eres?, objetivo, paywall, resultado y seguimiento (Firestore `parejaSeguimientos.{hash}`: fecha,
  puntuación, plan), menú "💘 Pareja", vuelta del pago y del login a `/pareja`, política de privacidad.
- Tests: backend 46 OK, front 124 OK; build + es-check OK.
- Pendiente Maria: 4 price IDs en Stripe → `STRIPE_PRICE_ID_PAREJA[_LATAM]`, `STRIPE_PRICE_ID_PAREJA_PACK[_LATAM]`;
  eventos `pareja_paywall|pareja_click|pareja_resultado` en el activador de GTM. P9 (emails) sin empezar.
- Observación: la política de privacidad aún habla de Azure; hoy la IA es OpenAI (GPT-4.1) y Mistral.

---

# Precios en pesos mexicanos (región `mx`) — plan 2026-10-21

## Contexto
Anuncios en Meta para México. Hoy México cae en la región `latam` y paga en US$. Objetivo: que un usuario
en México vea y pague en pesos (MX$), que convierte mejor y evita el aviso de "compra en el extranjero".

## Cómo funciona hoy
- Front `src/utils/pricing.js`: región por zona horaria (`latam` | `es` | `default`) y textos de precio.
- Backend `zipback/pricing.py`: `select_price_id(region, product)` elige el price ID de Stripe; el webhook
  reconoce la compra por price ID (`credits_for_price_id`). Producto por región = una entrada en `PLANS`.

## Precios propuestos (cambio ≈ 18-19 MX$/US$, redondeados a precio "bonito")
| Producto | Hoy Latam (US$) | Propuesta México (MX$) |
|---|---|---|
| Pack 10 análisis IA | 1,99 (antes 5) | 39 (antes 99) · 3,90/análisis |
| Porra Halloween / Navidad | 2,99 | 59 |
| Chat de pareja | 1,99 | 39 |
| Chat de pareja · seguimiento | 2,99 | 59 |

## Suposiciones (corregir si no)
- Maria crea en Stripe 5 precios de pago único en MXN (pack IA, porra Halloween, porra Navidad, pareja,
  pareja pack) y pasa los price IDs. Hasta entonces, México sigue pagando en US$ (nada se rompe).
- Mismos créditos que el resto de regiones. Solo cambia moneda e importe.
- Sin OXXO ni métodos de pago locales en esta tanda (es otra configuración de Stripe; se puede mirar después).
- Stripe convierte MXN a EUR al liquidar con una comisión extra (~2 %). Aceptable para probar.

## TODOs
- [x] M1. Backend `pricing.py`: entradas `*_mx` para los 5 productos (env `STRIPE_PRICE_ID_*_MX`, vacías =
      desactivado) y `select_price_id('mx', ...)` las elige, con caída a Latam y luego al normal.
      → verificar: `tests/test_pricing.py` (región mx con y sin variable; webhook reconoce el price ID mx).
- [x] M2. Front `pricing.js`: `isMexicoTimeZone` (zonas `America/Mexico_City`, `Cancun`, `Merida`, `Monterrey`,
      `Matamoros`, `Chihuahua`, `Ciudad_Juarez`, `Ojinaga`, `Mazatlan`, `Bahia_Banderas`, `Hermosillo`,
      `Tijuana`), región `mx` con textos "39 MX$" etc. en `getAiPackPricing`, `getPorraPricing`,
      `getParejaPricing`; `MX_PRICE_ACTIVE` como interruptor. Resto de Latam sigue en US$.
      → verificar: `pricing.test.js` (Mexico_City → mx; Bogotá sigue latam; interruptor apagado → latam).
- [x] M3. Comprobar que ninguna pantalla tiene "US$" escrito a mano para Latam (grep en `src` y locales).
      → verificar: grep sin resultados fuera de `pricing.js`; `npm test` y build OK.
- [ ] M4. Maria: crear los 5 precios en Stripe (MXN) y poner `STRIPE_PRICE_ID_MX`,
      `STRIPE_PRICE_ID_PORRA_HALLOWEEN_MX`, `STRIPE_PRICE_ID_PORRA_NAVIDAD_MX`, `STRIPE_PRICE_ID_PAREJA_MX`,
      `STRIPE_PRICE_ID_PAREJA_PACK_MX` en Render (zipback). Desplegar backend y front.
      → verificar: con zona horaria `America/Mexico_City` en DevTools, el modal muestra 39 MX$ y el
      checkout de Stripe cobra en pesos (compra de prueba y reembolso).

Fuera de alcance: píxel de Meta (plan aparte), OXXO/SPEI, español neutro de los textos.

## Review (2026-10-21)
- Hecho y desplegado (zipback 3c8a113, chatsalsa 6a4cefa): región `mx` por zona horaria, 5 precios en MXN
  como valor por defecto en `pricing.py` (sin variables nuevas en Render), textos "$39 MXN" / "$59 MXN".
- Tests: backend 52 OK (6 nuevos), front 136 OK; build OK. M4 pendiente de verificación manual en producción.
- Aprendizajes: todos los precios salen de `src/utils/pricing.js` (las traducciones solo interpolan), así que
  una región nueva son 3 funciones + tests. En México "$" son pesos, por eso el formato "$39 MXN" y no "39 MX$".
  Un price ID pegado por error era el de pareja Latam: conviene comparar con los existentes antes de aceptarlos.

## 2026-10-26 — Navidad fuera del menú
- [x] Quitado el banner `BandaJuegos` (ficheros .js y .css borrados, desmontado de `App.js`).
- [x] Quitado el enlace 🎄 Navidad del menú escritorio y móvil (`Header.js`). Halloween y Doctor Amor siguen.
- [x] Añadido "🎄 Juego de Navidad" en el footer, sección Navegación, solo en castellano (`Footer.js`).
- Verificado: eslint 0 errores, 19 suites / 136 tests en verde.
- [x] Quitada también la barra "Juegos para tu grupo" de encima de los resultados (`JuegosBarra` + CSS + test borrados). Tests: 18 suites / 134 en verde.
