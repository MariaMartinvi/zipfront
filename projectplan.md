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
