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
- [x] Bloques difuminados del preview de IA recortados a ~3 líneas con desvanecido (`.blurred-content` en `AppPreview.css`). Verificación manual: subir un chat sin créditos y comprobar que cada bloque borroso ocupa la mitad.

## 2026-11-16 — Eliminar Doctor Amor (`/pareja`)

Motivo (GA4, 90 días; la página existe desde el 21-oct): 78 personas en la landing, 9 s de media,
5 llegan al muro de pago, 0 `pareja_click` y 0 `pareja_resultado`. Maria da el OK a eliminarla del todo.

Suposiciones: no hay compras (pendiente de que Maria lo confirme en Stripe); solo front en este repo,
el backend (`zipback`: `/api/pareja-analysis` y productos `pareja*`) queda para después.

- [x] D1. Quitar el enlace del menú (escritorio y móvil) y la tarjeta de precios.
      → verificar: en el navegador, ni el menú ni `/plans` muestran "Doctor Amor".
- [x] D2. Borrar `ParejaPage` (js/css/test), `utils/pareja` (js/test) e imágenes `public/img/pareja-{h,v}.jpg`;
      `/pareja` redirige a la portada. `public/libro/pareja.jpg` se queda (la usa el libro).
      → verificar: abrir `/pareja` en el navegador acaba en `/`.
- [x] D3. Limpiar huérfanos: funciones de créditos/seguimiento (`firebase_auth.js`), `prepararChatPareja` y
      `getParejaAnalysis` (`fileService.js`), `getParejaPricing`, vuelta del pago, `doctor_amor` en analítica,
      línea de la política de privacidad y selectores CSS `.pareja`.
      → verificar: `grep -ri pareja src` solo devuelve lo que no es Doctor Amor; eslint 0 errores.
- [x] D4. Tests en verde y el servidor de desarrollo compila (no se ha lanzado el build de producción).

### Review
- Hecho (sin commit ni deploy): fuera del menú y de precios; borrados `ParejaPage`, `utils/pareja` y sus imágenes;
  `/pareja` redirige a `/`; limpiados créditos, precios, vuelta del pago, analítica, privacidad y CSS.
- Verificado: 16 suites / 123 tests en verde; eslint sin errores en los archivos tocados; en el navegador
  `/pareja` acaba en `/`, y ni el menú ni `/plans` muestran Doctor Amor.
- Se queda a propósito: `destinoTrasLogin` (`despues_login`) y la opción `conservarFechas` de `fileService.js`
  (mecanismos genéricos que ya nadie usa), y los eventos `pareja_*` / `doctor_amor` en la regex del test, porque
  reflejan el activador de GTM, que no ha cambiado.
- Pendiente: backend `zipback` (`/api/pareja-analysis`, productos `pareja*`), archivar los productos en Stripe,
  y los campos `parejaCredits` / `parejaSeguimientos` de Firestore si alguien llegó a tenerlos.
- Visto de paso: `Header.js` llama a `trackProductoClick('libro', 'menu')` pero `libro` no está en `PRODUCTOS`,
  así que el clic del menú al libro no se está midiendo.

## 2026-11-16 — Libro: arreglos del editor y landing nueva

Contexto: Maria ha recibido su libro impreso y le ha gustado. La landing `/libro-recuerdo` no le gusta.

### A. Fallos del editor (`/libro`)
- [x] A1. El pie de la web tapa el editor: la vista previa y la lista de capítulos ocupan una pantalla
      y debajo va el footer; al hacer scroll quedan cortados. Quitar el footer en `/libro` (es una
      herramienta a pantalla completa). → verificar: test de que `/libro` no pinta el footer + captura.
- [x] A2. "El Pistolero · responde en -5492 s": tiempo de respuesta negativo cuando los mensajes no
      están en orden de hora (`personajes.js`). Ignorar diferencias negativas.
      → verificar: test con dos mensajes desordenados → nunca sale un tiempo negativo.

### B. Editor más claro
- [x] B1. Poder quitar la página de personajes (interruptor como los capítulos).
      → verificar: test de `renderHTML` sin personajes + captura.
- [x] B2. Que se vea que se puede editar: hoy la × solo aparece al pasar el ratón (en el móvil no
      sale nunca). Mostrarla siempre, discreta, y un aviso arriba de la vista previa.
      → verificar: captura en escritorio y móvil.

Notas de A/B (hecho, sin commit):
- A1: el pie tampoco sale en `/libro/` (al recargar llega con barra final); test `Footer.test.js`.
- A2: `personajes.test.js` reproducía −58,5 min; ahora se ignoran las diferencias negativas.
- B1: interruptor "Los personajes" en el panel (sección Páginas), se recuerda al recargar; test `render.test.js`.
- B2: en vez de una × en cada mensaje (muy cargado), aviso amarillo arriba de la vista previa y la ×
  sale al pasar el ratón o, en el móvil, al tocar el mensaje. Verificado en el navegador (escritorio y móvil).
- Visto y no tocado: en el móvil la vista previa es más ancha que la pantalla (dos páginas por fila
  con zoom mínimo 0,3) y los títulos del panel ("PORTADA"…) salen grandes por estilos globales.

### C. Landing `/libro-recuerdo` (estilo elegido por Maria: editorial)
- [x] C1. 4 páginas de muestra (portada, personajes, capítulo, conversación con foto) con la plantilla real
      (`renderHTML`) y un chat inventado de Eva y Marcos (`muestra.js`), cada una en su iframe.
      → `muestra.test.js` comprueba que cada iframe enseña solo su página (primero salía la portada en las 4).
- [x] C2. Comparación con tiendas de fotolibros (`comparativa.js`, solo en euros): CEWE 55,90 € (62 pág.) y
      Hofmann 65,56 € (60 pág., su máximo), tapa blanda ~21 × 21, con envío, consultado el 16-11-2026.
      Fuera: Saal (no muestra envío), Fotoprix (no muestra precio por página), Lulu (imprenta en papel
      estucado, no fotolibro, ~23-28 €). → `comparativa.test.js`; verificado en escritorio y móvil.
- [x] C3. Landing editorial nueva (`LibroLanding.js` + `LibroLanding.css`): papel cálido, Instrument Serif,
      secciones numeradas con filetes. Quitadas de `libro.css` las 99 reglas de la landing antigua.
      Verificado en el navegador, escritorio y móvil (sin scroll lateral).
- Hecho de paso: precio por defecto 39 € → 29 € (`LibroLanding`, `LibroPage`, `LibroCard`): el servidor
  devuelve 29 € en España y por defecto; los 39 € solo se veían si fallaba esa llamada.
- Quitado: "Un libro para cada historia" (4 portadas de stock con nº de páginas inventados) y sus fotos
  `amigas/familia/hermanas.jpg`. `pareja.jpg` se queda (la usa la muestra).

### Review (libro, 2026-11-16)
- Hecho (sin commit ni deploy): A1-A2, B1-B2, C1-C3. 21 suites / 131 tests en verde; eslint sin errores.
- Aprendizajes: `fix-font-sizes.css` fuerza tamaños de h1-h3 con `!important` y `:not()`; una landing con
  títulos grandes necesita su excepción ahí. En las muestras, ocultar con `section:not(X)` + `!important`,
  porque `.cover{display:flex}` gana a `section{display:none}`. El test de muestra pinta el HTML en jsdom y
  mira qué se ve, no el texto del CSS: así detecta ese fallo.
- Pendiente de revisar: los precios de la comparación caducan (promos de las tiendas); revisarlos cada pocos meses.

## 2026-11-16 — Precios solo con el libro, muestra sin personajes y subida editorial
- [x] Precios (`/plans`): fuera "Juegos para fiestas" (Doctor Amor ya estaba fuera); tarjeta "Libro regalo"
      con el precio del servidor (`libro/precioLibro.js`, compartido con la landing). Quitada la clave
      `games_title` de las traducciones y el CSS de los botones de juegos. → `precioLibro.test.js`.
- [x] Muestra de la landing sin personajes: portada, capítulo, conversación y conversación con foto.
      → `muestra.test.js`.
- [x] Subida propia en la landing (en vez de `UploadBox`, que explica exportar SIN medios y enseña capturas
      del análisis): pasos para exportar CON archivos por plataforma y zona para soltar el zip.
      Verificado en móvil: subir el zip lleva a `/libro`.

## 2026-11-17 — Página de resultados: rediseño y análisis nuevos (plan acordado con Maria)

Orden que pide Maria: **primero que quede más bonito y moderno**; los análisis nuevos y la IA, después.
Antes de subir a producción, se mira en local. Versión anterior: etiqueta `resultados-antes-del-rediseno`.

### 1. Rediseño (en curso)
- [x] R1. Arranque con los datos en grande (`ResumenWrapped.css`, `AnalisisResumenGeneral.js`) e índice fijo
      (`ResultadosIndice.js`). En producción desde el 16-11; comprobado con sesión real y un chat inventado.
- [ ] R2. Mismo estilo en perfiles, análisis psicológico, juegos y gráficos (`ResultadosTema.css`, ya
      importada en `App.js`, sin subir). Falta verla sobre un análisis real (hace falta la sesión de Maria)
      y ajustar. → verificar: capturas en ordenador y móvil; Maria da el OK antes de subir.
- [ ] R3. Números y fechas pulidos: "146 al día" (no "145.62"), "30 de enero de 2026" (no "enero 30, 26").
- [ ] R4. Análisis psicológico: abrir con la nota en grande y una frase resumen; quitar los "---" sueltos.
- No se toca: los perfiles se muestran todos (los vacíos casi no pasan); el género de los perfiles se queda.

### 2. Análisis nuevos, en la parte gratis (después del rediseño)
Cálculos ya hechos y probados en `src/utils/analisisExtra.js` (7 tests); falta la sección en pantalla.
- [x] N1. Vuestros días más intensos (enlaza con el libro: "conviértelos en capítulos").
- [x] N2. Récords del chat: racha más larga, silencio más largo, mensaje más largo, madrugada más tardía.
- [x] N3. El equilibrio: % de mensajes, quién empieza y cuánto tarda cada uno en contestar.
- [x] N4. Antes y ahora: primeros 90 días frente a los últimos 90 (chats de 180 días o más).
- [x] N5. Grupos: quién contesta a quién y quién reaviva el grupo.
- En producción desde el 17-11 (`AnalisisExtra.js`, commit ba16c25), solo en castellano. Sin silencios de 1 día
  y sin quien escribe menos del 1 %.

### 3. IA (después)
- [x] I1. Prompt v2 (serio, sin citas salvo en el juego) y modelo gpt-6.1-terra, activos en Render.
- [ ] I2. Probar SIN publicar, con chats de Maria: "de qué habláis" y "momentos memorables". Solo se
      publican si quedan bien (su miedo es que queden mal). Descartados: premios, frase del año, mejor excusa.

### 4. Pack de pago: "De qué habláis" y "Momentos memorables" (plan, 17-11)

**Cómo funciona hoy:** el análisis psicológico ya es de pago. Se desbloquea con el Pack Análisis IA
(10 análisis: 2,99 € en España, 1,99 US$ Latam, 39 MX$ México). Antes de pagar se ve una vista previa
borrosa, con botones "Desbloquear". Lo que hace la IA lo decide el prompt del servidor (`prompt_v2.py`).

**Propuesta (la más simple):** no crear un producto nuevo. Las dos secciones pasan a formar parte del
análisis IA que ya se paga: mismo precio, mismo botón, más contenido. Solo castellano, como el prompt v2.

**Probado sin publicar** con el chat de Eva y uno de familia (`scripts/comparar_prompts.py --pack`).
Funciona bien si la IA recibe trozos repartidos de los 5 días con más mensajes de toda la historia,
además del final del chat. El tamaño enviado es el mismo de siempre (20.000 caracteres), así que el coste
no sube.

TODOs (en orden; cada uno se prueba antes de pasar al siguiente):
- [x] P1. Web: al preparar el texto para la IA (`fileService.js`, `processContentForAzure`, solo castellano),
      poner delante los 5 días más intensos con su fecha (4 trozos repartidos por día, unos 2.000 caracteres
      cada día) y después la conversación reciente.
      → verificar: test con un chat inventado (salen los días, con fecha y anonimizados, y en total ≤ 20.000).
- [x] P2. Servidor: las dos secciones dentro de `PROMPT_V2_ES` (hoy están aparte, en `SECCIONES_PACK_ES`).
      → verificar: test de Python que comprueba que el prompt pide las dos secciones y sin citas.
- [x] P3. Web: pintar "De qué habláis" y "Momentos memorables" en el análisis (`Chatgptresultados.js`), como
      tarjetas con el estilo nuevo.
      → verificar: test con una respuesta de ejemplo; captura en local.
- [x] P4. Vista previa de pago: añadir las dos secciones borrosas, para que se vea que entran en el pack.
      → verificar: captura en local sin créditos.
- [ ] P5. Subir el servidor primero (P2) y la web después (P1, P3 y P4), juntos. Comprobar en producción
      con un análisis real de Maria y en los logs de Render.

**Riesgos:**
- Si la web nueva sale antes que el servidor, el análisis llega sin las secciones. No se rompe nada:
  simplemente no aparecen.
- Con el prompt v1 (vuelta atrás), las secciones no aparecen.
- Otros idiomas: siguen igual hasta que se traduzca el prompt v2.

**Decidido por Maria (17-11):** van dentro del pack actual, al mismo precio, y se enseñan borrosas en la
vista previa de pago.

Hecho: `conDiasDestacados` en `fileService.js`, `utils/seccionesPack.js` (tarjetas `.pk-*` en
`ResultadosTema.css`), sección 5 de la vista previa en `App.js`. Tests: `conDiasDestacados.test.js`,
`seccionesPack.test.js`, `Chatgptresultados.pack.test.js` y `tests/test_prompt_v2.py`. En local, las tarjetas se
han comprobado con la respuesta real del chat de Eva, en ordenador y en móvil.

## 2026-11-17 — Libro: que no se vayan al llegar desde los resultados (hecho el 17-11)

**Lo que dice Clarity (16 y 17 de noviembre):**
- Llegan más personas al libro: ~8 % de las visitas a la portada, frente a ~0,5 % en los 5 días anteriores.
  Sin contar las pruebas desde España con ordenador, son 4 personas reales en día y medio (EE. UU., Chile, Perú
  y Nicaragua), frente a ~3 en los 10 días anteriores. Todas entran por «Ver mi libro gratis →» de los
  resultados. El menú superior no trae a nadie.
- Nadie interactúa con el libro: no hay clics en el mapa de calor y nadie empieza un libro. Se van enseguida.
- Grabación de EE. UU., en móvil: al pulsar ve su título, 4 botones de compra seguidos, un aviso amarillo («se
  puede editar…») y otro azul («sale sin fotos…»). El libro queda por debajo y no llega a bajar. Un minuto
  después vuelve a los resultados.

**Diagnóstico:** en el móvil, la primera pantalla es un formulario de compra con avisos y no un libro. Lo que les
llevó hasta ahí (ver *su* libro) no aparece sin bajar.

**Propuesta: primera pantalla = su libro, bonito; las herramientas, después**
- [x] L1. Arriba, su libro cerrado (portada con sus nombres, como los libros de muestra de /libro-recuerdo)
      y, al tocarlo, se abre en el sitio y enseña 3 o 4 páginas de su chat (lo mismo que gustó en la landing).
      → verificar: captura en móvil con un chat inventado; el libro se ve sin bajar.
- [x] L2. Debajo, una sola línea con lo que contiene: «N páginas · M capítulos · desde el 13 de febrero de 2026».
      Los capítulos, con los días más intensos que ya calculamos (enlaza con las estadísticas gratis).
- [x] L3. Un único botón principal: «Ver y editar el libro entero» (abre el editor de ahora). La compra
      (PDF / impreso) se queda en el editor y en una barra fija abajo, más discreta: no es lo primero que ven.
- [x] L4. Los dos avisos, en una sola línea pequeña: «Puedes quitar mensajes y capítulos · ¿Con fotos? Exporta
      con archivos». Sin el tono de «sale sin fotos».
- [x] L5. Medir: eventos de GA `libro_abierto` (toca el libro) y `libro_editor` (entra al editor), para comparar
      con `libro_creado` y los pagos.
      → verificar: los eventos se ven en tiempo real en GA.

**Fuera de esta propuesta (lo apunto, no lo toco):** en los resultados, en el 41 % de las sesiones hay clics que
no hacen nada, sobre todo en las etiquetas del análisis psicológico («Áreas de mejora», «Tendencia a la
sobrecarga»…).

**Hecho (17-11):** `LibroEntrada.js` (entrada con su libro 3D, que se abre en el sitio con `LibroAbierto`, y un solo
botón). Quien ya estaba editando un libro va directo al editor. Los dos avisos del editor están ahora en una sola
línea. Los eventos `libro_abierto` y `libro_editor` llegan a Clarity (`trackEvent` también los manda allí). Para
que lleguen a GA, hay que cambiar en el activador de GTM `libro_creado` por `libro_(creado|abierto|editor)`.
El número de páginas de la entrada es aproximado («unas 30») hasta que el editor pagina de verdad.
Comprobado en local con un chat inventado, en móvil y en ordenador. Tests: `LibroEntrada.test.js` y
`analytics.test.js`.

## 2026-11-20 — Portada: LCP de 3 s en móvil (Core Web Vitals «No superada»)

**Lo que dice PageSpeed (usuarios reales, 28 días, móvil):** LCP 3 s, FCP 3 s, TTFB 0,8 s. INP y CLS, bien.
Solo falla el LCP (el límite es 2,5 s).

**Diagnóstico:** FCP y LCP son iguales, así que el problema es que la página tarda en pintar *lo primero*:
- El HTML llega vacío (`<div id="root">`). No se ve nada hasta bajar y ejecutar 273 KB de JS (921 KB sin
  comprimir) y el JSON de traducciones. El elemento LCP es el título del hero (texto).
- `ResumenWrapped.css` y `LibroLanding.css` hacen `@import` de Instrument Serif desde Google Fonts. Acaba dentro
  de `main.css`, que bloquea el pintado: en un móvil es una conexión más (DNS + TLS) antes de ver nada.
- El TTFB desde aquí es de 40 ms (Cloudflare lo tiene en caché). Los 0,8 s reales son red móvil y redirecciones
  (`chatsalsa.com` → `www`, enlaces de anuncios); desde el código no se puede tocar.

**Plan**
- [x] P1. Instrument Serif alojada en `public/fonts/` (como Inter) y fuera los `@import` a Google.
      → verificar: en la portada no sale ninguna petición a fonts.googleapis.com.
- [x] P2. Cabecera y hero pintados desde el HTML, sin esperar al JS: `scripts/shell.js` los genera tras el build
      con los textos de `locales/es`. Solo en `/`, en español y sin sesión guardada.
      → verificar: test que compara ese HTML con el de `HeroSection` de verdad; con el JS bloqueado se ve el hero.
- [x] P3. React se monta cuando las traducciones están cargadas, para no pasar por una pantalla en blanco
      entre el hero del HTML y el de React. De paso, `debug: false` en i18n (escribía en consola cada clave).
      → verificar: FCP/LCP medidos en el navegador antes y después; captura.

**Fuera de este plan (lo apunto, no lo toco):** el bundle principal carga de entrada Firebase, los juegos y los
componentes de resultados; partirlo mejoraría el tiempo hasta poder tocar, no el LCP. El píxel de TikTok y el
iframe de Firebase Auth se cargan en la portada para visitantes sin sesión.

### Review (20-11)
- Hecho: P1, P2 y P3. `scripts/shell.js` se ejecuta tras `react-scripts build` (en `build` y `build:render`).
- Comprobado con el build en local: el HTML servido ya trae el titular; cabecera y hero del HTML ocupan
  exactamente lo mismo que los de React a 375, 1024 y 1440 px (sin salto al montar); en `/plans` y con
  `?lang=en` no se coloca; ninguna petición a Google Fonts. Tests: `src/shell.test.js` (28 suites en verde).
- No medido: FCP/LCP en milisegundos (el navegador de pruebas no da tiempos de pintado y en local no hay
  red móvil). El dato real de PageSpeed es una media de 28 días: tardará unas semanas en reflejarlo; el
  apartado «Diagnostica problemas de rendimiento» (laboratorio) sí cambia al momento.
- Aprendizaje: si se cambia el marcado de `HeroSection.js`, hay que cambiarlo también en `scripts/shell.js`
  (el test falla si no coinciden). Los textos no: salen del JSON de traducciones.
- Los botones del hero no responden hasta que React monta (1-2 s en móvil); antes en ese rato no se veía nada.

---

# Plan: «Tu chat frente al resto» — comparativa con el conjunto de chats (2026-11-23)

Estado: **fases 1 y 2 subidas a producción el 2026-11-23**.

## Objetivo

Enseñar en los resultados cómo queda tu chat frente a todos los chats subidos
(«habláis 43 mensajes al día; la media es 18»; «el más malhablado es un chico; en el
80 % de los chats es una chica»). Ninguna app de la competencia revisada lo anuncia.

## Cómo funciona (alto nivel)

1. El navegador ya calcula las estadísticas. Al terminar, rellena una **ficha anónima**:
   solo números y casillas (sin nombres, sin texto, sin usuario, sin id de chat).
2. La ficha se envía a un endpoint nuevo de zipback, que **solo suma contadores** en
   Firestore (un documento de totales por tipo de chat). La ficha no se guarda.
3. Otro endpoint devuelve los totales; el navegador pinta la comparativa.

Los valores numéricos se guardan en **tramos** (p. ej. 0-5, 5-10, 10-20… mensajes al día),
no como media suelta. Con tramos se puede decir «habláis más que el 82 % de los chats»,
que engancha más que una media y no la distorsiona un chat gigante.

## Suposiciones

- Las estadísticas gratis se calculan en el navegador (`src/utils/analisisExtra.js`,
  `src/Analisis_top.js`), así que hace falta backend nuevo: hoy no se guarda nada.
- Parejas (2 personas) y grupos se comparan **por separado**; mezclarlos no tiene sentido
  (un grupo de 30 siempre gana en mensajes al día). El umbral de 20 chats es por tipo.
- Si el usuario marca «Sólo análisis local», **no se envía ficha**.
- El género se deduce en el navegador con una lista de nombres; al servidor solo llega
  «chico / chica». Nombre ambiguo o desconocido → ese chat no cuenta para esa métrica.
- El mismo chat subido dos veces en el mismo dispositivo cuenta una vez (marca en
  localStorage; la huella del chat no sale del dispositivo).

## Estadísticas propuestas

### Fase 1 — sin IA (todo se calcula ya, o casi)

| Bloque | Métrica | Cómo se enseña |
|---|---|---|
| Ritmo | Mensajes al día (media) | «Más que el X % de los chats» |
| Ritmo | Récord de mensajes en un día | Percentil |
| Ritmo | Días seguidos hablando (racha) | Percentil |
| Ritmo | Silencio más largo | Percentil |
| Ritmo | Hora punta y % de mensajes de madrugada | «El X % de los chats son más nocturnos» |
| Equilibrio | % de mensajes de quien más escribe | «En el chat medio, quien más escribe pone el X %» |
| Equilibrio | Tiempo medio de respuesta | Percentil |
| Estilo | Palabras por mensaje | Percentil |
| Estilo | Emojis por cada 100 mensajes | Percentil |
| Estilo | Palabrotas por cada 100 mensajes | «Más malhablados que el X %» |
| Estilo | Risas por cada 100 mensajes | «Os reís más que el X %» |
| Chico/chica | Quién es el más malhablado | «En el X % de los chats es una chica» |
| Chico/chica | Quién escribe más | ídem |
| Chico/chica | Quién empieza las conversaciones | ídem |
| Chico/chica | Quién es el cómico (provoca más risas) | ídem |
| Chico/chica | Quién es el más cariñoso | ídem |
| Chico/chica | Quién deja en visto / tarda más en contestar | ídem |
| Chico/chica | Quién trasnocha más | ídem |

### Fase 2 — con IA (solo chats con análisis de pago)

Hoy la IA escribe texto libre, que no se puede contar. Hay que cambiar el prompt para
que además elija de **listas cerradas**:

- Tema principal del chat (planes, trabajo, familia, amor, cotilleo, humor, dinero…) → % por tema
- Tipo de momento memorable (reconciliación, viaje, celebración, bronca, confesión…)
- Tipo de recomendación más habitual (escuchar más, repartir la iniciativa…)
- Rasgo principal de cada persona (lista de ~15 etiquetas)
- Nota de la relación (1-10): «vuestra nota es 8; la media es 6,7»
- Dinámica predominante (cooperación, apoyo mutuo, tensión…)

Va después porque depende del prompt (6 idiomas) y la muestra crece despacio: solo
cuentan los chats de pago.

## Privacidad

- Contadores agregados sin identificador = no son datos personales. Aun así, se añade
  un párrafo a la política de privacidad (hoy dice que nada sale del dispositivo salvo
  el análisis IA; dejará de ser exacto).
- No se muestra ninguna métrica con menos de 20 chats de ese tipo; debajo de cada dato,
  «basado en N chats» (cifra real).
- Endpoint público: límite de peticiones y validación de rangos para que nadie infle
  los contadores.

## TODOs (se detallan tras el OK)

- [x] 1. `fichaAnonima(mensajes)` en el navegador: devuelve solo números y casillas.
      → verificar: test con un chat de ejemplo; la ficha no contiene ningún nombre ni texto.
- [x] 2. Detector chico/chica por nombre (lista por idioma, ambiguos fuera).
      → verificar: tests con nombres claros, ambiguos y apodos.
- [x] 3. zipback: `POST /api/comparativa` suma contadores por tramos; `GET` los devuelve.
      → verificar: tests de suma, de rangos inválidos (400) y de límite de peticiones.
- [x] 4. Envío de la ficha al terminar el análisis (una vez por chat y dispositivo;
      nunca en «Sólo análisis local»).
      → verificar: test de que no se envía dos veces ni en modo local.
- [x] 5. Sección «Tu chat frente al resto» en resultados, oculta con menos de 20 chats.
      → verificar: test con 19 y con 20 chats; captura en local.
- [x] 6. Párrafo en la política de privacidad (la página solo tiene castellano e inglés) y en la FAQ en castellano.
- [x] 7. Security Gate del endpoint nuevo.
- [x] 8. (Fase 2) Prompt con listas cerradas + contadores de IA.

## Dudas abiertas para Maria

1. ¿Parejas y grupos por separado? (recomendado: sí)
2. ¿La comparativa es gratis? (recomendado: sí; es el gancho y cada subida gratis alimenta los datos)
3. ¿Empezamos por la fase 1 y dejamos la IA para después? (recomendado: sí)
4. Umbral: 20 chats para las métricas numéricas; ¿50 para las de chico/chica? Con 20,
   un «80 %» son 16 chats y baila mucho.

## Decisiones de Maria (2026-11-23) — sustituyen a lo anterior donde choquen

- Parejas y grupos **no** se separan: un solo conjunto. Las métricas de volumen se
  normalizan por miembro (mensajes al día / miembros).
- El bloque «Estilo» no convence tal como está: pendiente de concretar qué se queda.
- Comparativa sin IA: gratis. Comparativa de IA: solo pagando.
- Umbrales: 20 chats (numéricas), 50 (chico/chica), 10 (IA).
- Género no reconocido: el chat se descarta solo para esas métricas, no entero.
- La ficha se envía siempre, también en «Sólo análisis local» (solo lleva datos anónimos).
- Chats repetidos: marca en el navegador.
- Base de datos: Firestore (la que ya usa zipback), colección `comparativa`.
- **No empezar a programar hasta que Maria dé el OK a la arquitectura.**

## Review (2026-11-23)

Hecho (fase 1, gratis, solo con la web en castellano, igual que «Vuestros momentos»):
- Navegador: `src/utils/comparativa.js` (ficha anónima, tramos, percentil, envío una vez por chat),
  `src/utils/generoNombre.js` (chico/chica por la primera palabra del nombre; ambiguo → no cuenta),
  `src/ComparativaChats.js` (sección debajo de «Vuestros momentos»).
- zipback: `services/comparativa.py` (validación, tramos, contadores) y `routes/comparativa.py`
  (`POST`/`GET /api/comparativa`, 20 envíos/hora por IP en el POST, caché de 10 min en el GET).
- Firestore: colección `comparativa`, documento `totales`. Se crea solo con el primer chat.
- Privacidad: párrafo nuevo en la política (es/en) y la FAQ en castellano.

Métricas: 10 numéricas (se ven con 20 chats) y 7 de chico/chica (con 50 chats con género reconocido).
«% de mensajes de quien más escribe» se quitó: no se compara bien entre parejas y grupos.

Aprendizajes:
- En desarrollo React monta los efectos dos veces y la ficha salía dos veces: hace falta marcar
  el envío «en curso» antes de la petición, no solo guardar la huella al terminar.
- Los cortes de los tramos no se pueden cambiar sin descuadrar los contadores ya guardados:
  para cambiar una métrica, crear otra con nombre nuevo.

Fase 2 (IA, mismo día):
- El prompt en castellano (v1 y v2, también Mistral) acaba con `COMPARATIVA_DATA:{...}`: temas (1-3),
  tipo de momento, recomendación, rasgo de cada persona, nota y dinámica, de listas cerradas
  (`LISTAS_IA` en zipback `services/comparativa.py`, copiadas en `src/utils/comparativa.js`).
- La web quita esa línea antes de pintar el análisis (`quitarComparativaData`), la lee, se queda solo
  con valores de las listas y la manda a `POST /api/comparativa/ia` (documento `totales_ia`).
- Tarjeta «Según el análisis IA» solo si el chat tiene análisis IA (la IA solo se ejecuta con créditos,
  o sea, pagando) y hay 10 chats con IA.

Pendiente:
- Si se toca una lista de IA, cambiarla en los dos repos (no hay test que lo cruce).
- Cualquiera puede mandar fichas falsas (hasta 20 por hora y IP). Aceptado: son contadores sin datos.

---

# Perfiles en modo pareja (2026-11-23)

Por qué: en Clarity (84 sesiones con chat subido, 17-23 nov.) el 93 % de los chats con dato eran de
2 personas, y las tarjetas de perfiles son lo más pulsado después de la subida (99 de 432 clics).

Hecho:
- En chats de exactamente dos personas, cada tarjeta de perfil enseña a los dos con el dato del perfil
  (`src/utils/duelos.js`). Usa la «media del resto» que ya calculaba `Analisis_top.js`, que en una
  pareja es el valor de la otra persona: no se recalcula nada y el ganador siempre cuadra.
- En el detalle de cada perfil, «Los otros» pasa a ser el nombre de la otra persona.
- Arreglos de traducción que salieron al probar: en francés las etiquetas `stats_labels` estaban
  fuera de `app` (salían en castellano) y en italiano faltaba el perfil «El Chismoso».

Aprendizaje: «El Profesor» se decide por palabras únicas por mensaje, no por el total; comparar el
total hacía que el ganador saliera con menos. Cada duelo usa el mismo campo que decide el perfil.
Sin duelo (falta el dato de la otra persona): Chismoso, Cómico, Disculpón cuando la otra no tiene
casos, y Mala Influencia (mezcla vicios y palabrotas).

# Aviso de pago con datos de la pareja (2026-11-23)

Por qué: en Clarity, 79 de 84 sesiones con chat subido ven el aviso de pago y compran 4; el texto era
genérico («personalidad de cada uno…»). En chats de dos personas (web en castellano), el aviso abre
ahora con datos reales y gratis de su chat (`src/utils/ganchoPareja.js`): quién escribe más, quién
empieza las conversaciones y cuánto tarda cada uno, y luego qué desbloquea la IA. «Relación» y no
«pareja»: un chat de dos también puede ser de madre e hija o de amigos.

Sin verificar en pantalla: el aviso solo sale con sesión iniciada y sin créditos. Para medir el
efecto, comparar en Clarity `paywall_click` y `checkout_iniciado` frente a `paywall_visto`
antes y después del 23-11-2026.

## Pendiente: letra de los resultados más legible (Maria, 23-11-2026)

Maria: la letra de los títulos y cifras es «demasiado estrecha y fina»; cambiar las tres cosas. **Prioridad: que se lea bien** (por encima de la estética).
Los cambios ya están hechos en local, **sin subir** (AnalisisExtra.css, ComparativaChats.css, ResultadosTema.css, ResumenWrapped.css).

- [x] Títulos y cifras: Instrument Serif → Inter en negrita (ya se carga; la landing del libro no se toca), tamaños algo menores porque Inter es más ancha
- [x] Textos grises más oscuros (#656b73 → #4b5259)
- [x] Textos pequeños más grandes (.82–.88rem → .95rem; 12–13px → 14px)
- [ ] Verificar en local con capturas (ordenador y móvil): resumen, perfiles, récords, comparativa, psicológico, gráficos
- [ ] Enseñar las capturas a Maria y subir solo con su OK

## Plan: estadísticas por país para notas de prensa (Maria, 27-11-2026) — OK de Maria, hecho en local, SIN SUBIR

Objetivo: titulares tipo «los chilenos son los más Mala Influencia» o «ellas son más Vampiro».
Maria: «exactamente el mismo cálculo que las características, y comparar países». País = zona horaria del navegador (sin IP).

Cada chat manda además (sin nombres; el servidor suma en `totales` y en `pais_XX`, nunca guarda la ficha):
- **Características** (las 19 de Analisis_top.js, `analizarPerfilesCompleto`, sin tocar el cálculo):
  chico/chica de quien gana cada una + los contadores por persona de la app, sumados (chat entero y por chico/chica).
- **Lo que las características no miden:** madrugadores (6-9 h), constancia (días con mensajes), audios, fotos, stickers, borrados.
- Quitadas mis versiones propias (palabrotas, vicios, cariño, risas, emojis, madrugada) para no tener dos cifras de lo mismo.

- [x] Web: país por zona horaria (src/utils/pais.js) → pais.test.js
- [x] Web: `perfilesDelChat` (Analisis_top.js) = el mismo resultado que ve el usuario, calculado una vez por chat
- [x] Web: `fichaCaracteristicas` + sumas propias en la ficha → comparativa.test.js (incluye test con el cálculo real)
- [x] Servidor: valida país, sumas y características (listas cerradas, enteros, topes por mensaje, chico+chica ≤ chat) → test_comparativa.py
- [x] Servidor: scripts/estadisticas_paises.py → tablas por país/LATAM/Europa sin España/Todos ⚠️ si < 10 chats (Maria: 10 por país es suficiente; antes 100) → test_estadisticas_paises.py
- [x] Política de privacidad: país, sumas por chico/chica y ganador de cada característica
- [x] Parte de IA por país (temas, dinámica, momento, recomendación, rasgos, nota): la ficha de IA lleva `pais`,
      el servidor suma también en `pais_XX_ia` y la tabla saca % por país y nota media → tests
- [x] Política de privacidad: menciona también la parte de IA (antes no salía)
- [x] Todos los idiomas (Maria): la sección manda los datos en cualquier idioma (solo se enseña en castellano,
      sus textos lo están); las características usan el idioma de la web para sus listas (también en la sección
      que ve el usuario); el bloque de IA va en todos los prompts (en inglés fuera del castellano, mismos códigos)
- [x] Tests: 224 web OK, 95 servidor OK
- [ ] Subir (zipback primero, luego web) — con OK de Maria

## Review (27-11-2026)
- Orden de subida: **primero zipback**. Si sube antes la web, el servidor viejo rechaza las fichas nuevas y esos chats no cuentan.
- Las fichas viejas (sin país ni características) se siguen aceptando; también las de IA sin país.
- La parte de IA solo existe en chats con análisis IA: habrá muchos menos chats que en el resto.
- Listas por idioma de la app: palabrotas en 8 idiomas, vicios solo es/en, primera persona es/en/fr/de/it; lo que falta cae al castellano.
- Dentro de un chat la app premia al que tiene más en total (Amoroso, Mala Influencia…). Entre países eso no vale
  (ganaría el país con chats más largos), así que la tabla divide los mismos contadores entre los mensajes.
- La hora de los mensajes es la local del móvil que exporta y el país sale de la zona horaria del mismo dispositivo:
  Vampiro/madrugadores se comparan bien. Excepción: chats entre gente de países distintos.
- Límites a decir en las notas: género según el nombre; país según la zona horaria de quien sube el chat;
  solo chats analizados en ChatSalsa desde el día de la subida.
- Riesgo que queda: fichas inventadas pero coherentes (límite 20/hora por IP; topes por mensaje).

## Plan: cuadro regalo con las frases míticas del chat (Maria, 27-11-2026) — PENDIENTE DE OK

Producto nuevo: un cuadro para regalar con las frases míticas de un chat. Decidido con Maria:
1. El usuario ve las plantillas con **frases de ejemplo inventadas** (nunca de chats de usuarios).
2. **Paga.**
3. **La IA lee su chat** y le propone 15 frases (Maria: la selección por estadísticas no vale; la hace la IA).
4. El usuario marca cuáles salen, puede **buscar y añadir frases a mano** y editar el texto; nombre, inicial o sin nombre.
5. Se genera su cuadro. Si no le gustan las frases de la IA, elige a mano (no se vuelve a pedir a la IA).

**Supuestos (cambiables):**
- Formato: solo **PDF descargable** al principio (A4 y A3 vertical). Cuadro impreso con marco (Gelato), más adelante si se vende.
- Precio provisional 4,99–6,99 € (y su equivalente Latam/México), a fijar tras medir el coste de IA por chat (fase 0).
- Empezamos con **4 plantillas** (moderna amorosa, clásica, minimalista, divertida) y ampliamos a 10 si funciona.
- Solo usuarios con sesión iniciada (como el pack de IA).

**Qué se reaprovecha:** lector de chats (`src/libro/parser.js`), HTML → PDF del libro (`/api/book/pdf`, Gotenberg),
pago con Stripe como en el libro (`book_routes.py`, precios por región de `pricing.py`), y el servicio de IA de zipback.

### Fase 0 — Comprobar que la IA elige bien (antes de construir nada)
- [x] Script de prueba en zipback (`services/cuadro_frases.py`, `scripts/probar_frases_cuadro.py`, 6 tests): chat de prueba → 15 frases con IA (chat casi entero: solo se quitan multimedia,
      enlaces y mensajes del sistema; en trozos si es muy largo) → verificar: salida con 15 frases literales que existen en el chat
- [ ] Probar con 2-3 chats de Maria con modelo grande y pequeño; apuntar coste y tiempo por chat → verificar: Maria da el OK a la calidad
      - 27-11-2026, chat «Eva Pan» (1,4 MB, 22.346 mensajes, 14 llamadas, ~278.000 tokens de entrada):
        gpt-4.1 → 15 frases cortas y buenas en 41 s; gpt-4.1-mini → 13 frases, más flojas y con textos pegados (un anuncio), 91 s.
        Coste estimado con las tarifas que conozco (a confirmar): ~0,55 € con gpt-4.1, ~0,11 € con mini. Conclusión provisional: modelo grande.
      - Criterios de Maria ya en el prompt: graciosas, bonitas/amorosas, ingeniosas o filosóficas; cortas (3-15 palabras); memorables, «dignas de un cuadro».
      - Falta: probar otro tipo de chat (pareja, familia) y que Maria dé el OK a la calidad.
- [ ] Fijar el precio con ese coste → verificar: Maria lo confirma

### Fase 1 — Plantillas y landing (sin pago)
**Cambio de Maria (27-11-2026), tras ver las primeras plantillas y enseñar su lienzo «Cuadros de chats — muestra geométrica»:**
tres estilos, **todos de 1 a 4 frases**:
1. **Kandinsky-Miró**: composición geométrica abstracta generada con el chat (como su lienzo), con las frases debajo.
2. **Tipográfico**: las frases tal cual, en letra enorme tipo póster (como su tercer diseño).
3. **Alegre** («rollo Mr. Wonderful», con diseño propio: no se copian sus dibujos ni su letra): pastel, letra a mano, corazones y dibujitos.
Las cuatro plantillas de lista del primer intento (amorosa, clásica, minimalista, divertida; 5-12 frases) quedan aparcadas en el código, sin enseñarse.
**Ajuste posterior de Maria (mismo día):** los estilos se llaman **Moderno, Tipográfico y Tierno**; admiten **de 1 a 12 frases**.
Con 1-4 frases manda el dibujo o la letra enorme; con 5-12 (chats de grupo) el mismo estilo pasa a lista y el texto gana protagonismo.
En chats de grupo la IA elige al menos una frase de cada persona (ya en el prompt de `cuadro_frases.py`).
- [x] Estilo Moderno (Kandinsky-Miró; `arteKandinsky` en src/cuadro/estilos.js) → tests (mismo chat = mismo dibujo) + visto en /cuadro
- [x] Estilo Tipográfico → tests de ajuste de letra + visto en /cuadro
- [x] Estilo Tierno → tests + visto en /cuadro
- [x] Los tres en formato lista (9 frases) → vistos en /cuadro. 9 tests de src/cuadro, 233 en total.
- [ ] Maria da el OK a los tres estilos (verlos en localhost:3005/cuadro)
- [ ] El dibujo del Moderno con datos reales del chat (un círculo por tramo, color por persona): hoy sale de una semilla
(lo de abajo es el plan inicial de esta fase)
- [ ] Plantilla 1 «moderna amorosa» en HTML/CSS, A4 y A3, con frases inventadas (emojis como imagen) → test de render + captura
- [ ] Plantillas 2-4 (clásica, minimalista, divertida) → test de render + capturas para Maria
- [ ] Reparto automático de 5 a 12 frases sin que se corten ni se salgan → tests con frases cortas y largas
- [ ] Landing `/cuadro` con la galería de plantillas de ejemplo y el precio → captura en ordenador y móvil

### Fase 2 — Pago
- [ ] Producto y precios en Stripe (es / latam / mx) y `POST /api/cuadro/checkout` → tests: sin sesión 401, precio según región
- [ ] Confirmación y webhook: el pago da derecho a **un** cuadro (un chat) → tests: sin pago 403, pago usado no vale dos veces

### Fase 3 — Frases
- [ ] `POST /api/cuadro/frases` (sesión + pago comprobados): recibe el chat con consentimiento explícito, la IA devuelve 15 frases,
      el servidor comprueba que cada una existe literalmente en el chat y no guarda el chat → tests (401/403, frase inventada descartada)
- [ ] Pantalla de selección: marcar/desmarcar, editar texto, nombre / inicial / sin nombre → tests
- [ ] Buscador en el chat para añadir frases a mano (en el navegador, sin IA) → tests

### Fase 4 — Generar el cuadro
- [ ] Vista previa con sus frases y cambio de plantilla en directo → captura
- [ ] PDF final por el generador del libro, descarga y enlace para volver a descargar → test + PDF real revisado por Maria

### Fase 5 — Antes de subir
- [ ] Security Gate (validación, auth en cada endpoint, límites de uso, sin frases en logs, gitleaks, npm audit)
- [ ] Política de privacidad: el chat se envía a la IA tras el pago para elegir frases y no se guarda
- [ ] Eventos de medición (landing vista, pago iniciado, pago hecho, cuadro descargado) y enlace desde resultados y menú

**Dudas abiertas para Maria:**
- ~~¿Cuántas frases caben en un cuadro?~~ Maria (27-11-2026): de 1 a 4 en los tres estilos.
- ~~¿Descuento a quien ya pagó el pack de IA?~~ Maria (27-11-2026): **sin descuento**, el cuadro va aparte.
- Reembolso si alguien paga y su chat es demasiado corto para sacar frases: propuesta, avisar antes del pago si el chat tiene pocos mensajes.

### Cuadro regalo — hecho el 27-11-2026 (Maria: «hazlo todo sin pedir permiso»)
Decisiones tomadas por el camino (cambiables):
- **Precio provisional: 5,99 € / 3,99 US$ (Latam) / $99 MXN.** Se cambia sin tocar código con la variable `CUADRO_PRICES` de Render.
- **Sin cuenta:** el «pase» es la sesión de Stripe pagada (como en el libro). Un pago = dos peticiones a la IA como mucho (la 2.ª por si falla la 1.ª); descargas ilimitadas.
- **Modelo:** gpt-4.1 (`CUADRO_MODELO`). Tope de coste: de un chat enorme se leen 20 trozos repartidos por su historia (~0,80 US$ como mucho). Los trozos van en paralelo.
- **Modo ejemplo:** `/cuadro/crear` sin pago enseña el editor con frases inventadas (no deja descargar). Sirve de «pruébalo antes».
- **Promoción:** se AÑADE el cuadro donde está el libro (menú superior y tarjeta en los resultados); el libro no se quita (Black Friday en marcha hasta el lunes 30).
- **El dibujo del Moderno ya usa el chat:** un círculo por tramo de tiempo, color por persona y tamaño por lo hablado.

- [x] Servidor (zipback): `cuadro_routes.py` (config, checkout, estado, frases, pdf) + `services/cuadro_frases.py` → 111 tests
- [x] Web: `/cuadro` (landing con pago), `/cuadro/crear` (subir chat con consentimiento, elegir/editar/ordenar, buscar a mano, PDF A4/A3) → 241 tests
- [x] Menú superior «Cuadro regalo», tarjeta en resultados, política de privacidad, eventos `cuadro_(pago|comprado|frases|descargado)` y `click_cuadro_*`
- [x] Security Gate: importe decidido en servidor; frases y PDF solo con pago comprobado en Stripe (400/402/403); consentimiento obligatorio;
      texto escapado en el cuadro (tests XSS); errores sin detalles internos; sin chat ni frases en logs; límite 40 POST/hora por IP; gitleaks limpio
- [ ] **Sin probar con un pago real**: falta una compra de prueba en producción (pago → frases → PDF). El PDF depende del Gotenberg del libro.
- [ ] Maria: añadir en GTM `cuadro_(pago|comprado|frases|descargado)` y `cuadro` en la regex de `click_(…)`; confirmar el precio.
- [ ] Más adelante: cuadro impreso con marco (Gelato), más estilos, dos columnas en lista.

### Cuadro — anonimización igual que el análisis (Maria, 27-11-2026)
Maria: «tiene que ser exactamente la misma manera» que el resto: el chat no puede salir sin anonimizar.
La primera versión mandaba el chat tal cual a nuestro servidor (que lo anonimizaba antes de la IA). Corregido el mismo día:
- [x] `src/cuadro/anonimo.js`: en el navegador, con las funciones del análisis (`anonimizarChat`, `anonymizeParticipants`,
      `anonymizeWithPatterns`), mensaje a mensaje. Solo sale «Participante N: mensaje», sin fechas ni horas.
- [x] Servidor: rechaza (400) todo chat que no llegue así; devuelve alias y el navegador repone los nombres.
- [x] Probado en local con un chat real de 21.204 mensajes: todas las líneas con alias, 0 nombres de participantes, 0 teléfonos.
- [x] Pantalla de subida sin casilla, con las instrucciones de exportación de la portada, solo .zip, y sin «IA» en los textos.
- Va algo más allá que el análisis: tapa también el nombre de quien escribe cuando aparece dentro de un mensaje.
- **Hallazgo sobre el análisis de IA (no tocado):** `anonymizeParticipants` no reconoce algunas líneas (3 de 22.863 en la prueba)
  y `anonymizeWithPatterns` junta a veces una línea con la siguiente; en esas líneas el nombre puede salir sin tapar.
  Tampoco tapa nombres de participantes dentro de los mensajes. Pendiente de decidir con Maria si se arregla.
