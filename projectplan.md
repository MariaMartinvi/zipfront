# Plan: Fix pantalla en blanco en iPhone + Rediseño moderno de la landing

Fecha: 2026-07-27

## Contexto

### Bug iPhone (prioritario)
El bundle de producción (`main.2618839d.js`, 1,48 MB) contiene sintaxis **ES2022
sin transpilar** (campos de clase: `class cn{options;rules;lexer;...}`),
proveniente de la librería `marked` v15. Un Safari/iOS anterior a **14.5** no
puede ni parsear el archivo → error de sintaxis → React nunca se monta →
pantalla en blanco. En Android, Chrome se actualiza solo y lo soporta.

- `marked` solo se usa en `src/Chatgptresultados.js` (renderizar el análisis IA),
  pero va dentro del bundle principal, así que rompe TODA la web.
- Verificado con `es-check`: el bundle falla como ES2015/ES2017/ES2020/ES2021 y
  solo pasa como ES2022. No hay otra sintaxis más moderna (0 `static{}`, 0 `#privados`).

### Rediseño landing
- Stack: React 18 + CRA, CSS propio (sin Tailwind), i18next (6 idiomas, textos en
  `public/locales/{lng}/translation.json`).
- Landing = `HeroSection.js/.css`, `AppPreview.js` (features, proceso, demo,
  testimonios, seguridad) + `AppPreview.css` (3.281 líneas), `Header`, `Footer`,
  `CookieBanner`.
- Problemas actuales: 3 sistemas de variables CSS en conflicto (variables.css con
  nombres de Canva, `:root` duplicados en Header.css/HeroSection.css, colores
  hardcodeados como el morado `#7122AC` del hero), parche global
  `fix-font-sizes.css` con `!important`, sin tipografía propia (system font),
  banner de cookies gigante que tapa el hero y el CTA, sin sección de precios ni
  CTA final en la home.
- El blog (Astro) duplica header/footer a mano → cualquier cambio hay que
  replicarlo en `blog/src/styles/`.

## Fase 1 — Fix iPhone (bloqueante, antes del rediseño)

- [x] 1.1 Bajar `marked` a **4.2.12** (la 4.3.0 aún traía campos de clase en su
      hooks). Sin cambios de código: `marked.parse()` existe en v4 (smoke test OK,
      sin vulnerabilidades en npm audit).
      → verificado: bundle nuevo pasa `es-check es2020` (antes solo ES2022).
      Nota: no se pudo bajar de ES2020 porque `i18next` (spread ES2018) y
      `@emailjs/browser` (optional chaining ES2020) tampoco transpilan; ES2020 =
      Safari/iOS 13.4+, cubre iPhone 6s (2015) en adelante. El chunk lazy de
      `@xenova/transformers` (anonimización) sigue siendo ES2022, pero al ser
      carga bajo demanda no bloquea el arranque de la web.
- [x] 1.2 Guardia añadida: script `verify:es` (`es-check es2020` sobre
      `build/static/js/main.*.js`) encadenado a `build` y `build:render`
      (y por tanto a `build:site`, el de Render). `es-check` como devDependency.
      → verificado: `npm run verify:es` pasa en ~10 s; fallaría el build si se
      reintroduce sintaxis moderna en el bundle de entrada.
- [ ] 1.3 Deploy y verificación manual: abrir www.chatsalsa.com en el iPhone
      afectado (y confirmar qué versión de iOS tiene).
      → verificar: la home carga en el iPhone.

## Fase 2 — Base de diseño (tokens unificados)

- [x] 2.1 Tokens unificados en `src/variables.css` (nombres de componente
      --primary-green/--accent-purple/--radius-*/--shadow-* movidos ahí);
      eliminados los `:root` duplicados de `Header.css`, `HeroSection.css`,
      `App.css` y los duplicados base de `Analisis_primer_chat.css`.
      → verificado: build OK + capturas sin regresiones.
- [x] 2.2 Webfont Inter variable self-hosted (`public/fonts/*.woff2` +
      `public/fonts/inter.css` enlazada con preload desde `public/index.html`;
      así el blog puede reutilizarla). `--font-family-base` actualizada.
      Nota: `fix-font-sizes.css` NO se retiró aún (riesgo de regresión amplia;
      candidato a limpieza posterior).
      → verificado: capturas muestran Inter aplicada.

## Fase 3 — Rediseño de la landing (conversión)

- [x] 3.1 Hero nuevo: gradiente moderno (--hero-gradient) en vez del morado
      plano #7122AC, CTA primario verde WhatsApp destacado (antes botón blanco),
      badge glass, título con letter-spacing ajustado, mockup con rotación
      suave. Sin prueba social inventada (no hay datos reales que mostrar).
      → verificado: capturas desktop 1440px y móvil 390px.
- [x] 3.2 Secciones de AppPreview modernizadas (features, proceso, demo,
      testimonios, seguridad): tarjetas radius 24px, bordes #e5e7eb, sombras
      suaves con hover -4px, títulos weight 800, CTAs pill verdes, fondos
      alternos blanco/#f8f9fa/#faf5ff.
      → verificado: captura de página completa, sin errores de consola.
- [x] 3.3 Nueva sección `PricingPreview` en la home (2 tarjetas: estadísticas
      gratis ilimitadas + Pack IA 5€) + CTA final con gradiente antes del
      footer. Reutiliza claves i18n de freemium; 4 claves nuevas `pricing_home`
      añadidas y verificadas en los 6 idiomas.
      → verificado: captura full-page; botón "Ver Pack IA" navega a /plans.
- [x] 3.4 Header limpio (blur, borde sutil, nav 600, pill de registro
      refinada, language switcher compacto; de paso quedó arreglado un bug
      preexistente por el que el hover verde del nav no se aplicaba) y footer
      oscuro #0e1318 (sustituye el SVG multicolor con texto negro).
      → verificado: capturas.
- [x] 3.5 Banner de cookies compacto: barra inferior discreta (~70px desktop),
      botones pill verdes de marca. Se eliminó un bloque muerto de
      `AppPreview.css` que lo convertía en tarjeta gigante sobre el hero.
      Lógica de consentimiento (cookieService + GTM) intacta.
      → verificado: captura desktop y móvil; botón "Aceptar todas" funciona.
- [x] 3.6 Blog Astro sincronizado: Inter enlazada en `BlogLayout.astro`,
      header translúcido con blur, footer oscuro #0e1318, botones pill con el
      gradiente nuevo (`blog/src/styles/header-footer.css` y `chatsalsa.css`).
      Arreglado además el icono de Android del footer (era negro invisible
      sobre fondo oscuro; ahora `fill: currentColor` verde).
      → verificado: build de Astro OK (14 páginas) + capturas de /blog/.

## Fase 4 — Cierre

- [ ] 4.1 Pasada responsive completa + revisión de textos i18n afectados
      (actualizar `public/locales/*/translation.json` si cambia algún copy).
- [ ] 4.2 Security Gate (npm audit, gitleaks, revisión de headers) antes de
      subir a producción.

## Review

### Qué se hizo (2026-07-27)

1. **Fix iPhone en blanco**: `marked` 15 → 4.2.12 (el bundle exigía ES2022 =
   iOS 14.5+; ahora ES2020 = iOS 13.4+, iPhone 6s en adelante). Guardia
   `verify:es` (es-check) encadenada a todos los builds.
2. **Base de diseño**: tokens unificados en `variables.css` (antes 3 paletas en
   conflicto en 4 archivos), Inter variable self-hosted.
3. **Landing rediseñada**: hero con gradiente y CTA verde, secciones con
   tarjetas modernas, nueva sección de precios + CTA final, header limpio,
   footer oscuro, banner de cookies compacto (se eliminó CSS muerto que lo
   rompía).
4. **Blog Astro** sincronizado con el mismo diseño.

### Verificación
- `npm run build:render` pasa con la guardia ES2020.
- Build Astro del blog pasa (14 páginas).
- Capturas desktop (1440px) y móvil (390px) de la home completa y del blog.
- Claves i18n nuevas (`pricing_home`) verificadas en los 6 idiomas.

### Pendiente antes de desplegar
- [ ] Security Gate (sección 8 de CLAUDE.md): npm audit / gitleaks / headers.
- [ ] **Rotar la SECRET_KEY expuesta en `render.yaml`** y moverla a variables
      de entorno de Render (está commiteada en texto plano en el repo).
- [ ] Commit + push (deploy automático en Render) — decisión de Maria.
- [ ] Verificar en el iPhone real tras el deploy (y anotar modelo/iOS si sigue
      fallando: si es anterior a iOS 13.4 el fix no le alcanza).
- [ ] Maria quería pasar "keywords actuales" para el copy del hero — no
      llegaron; ajustar textos cuando las envíe.

### Extra: fix "Formato de chat no reconocido" (27/07/2026)

El detector y los 4 analizadores solo aceptaban `d/m/aa` con año de 2 dígitos,
hora 24h y líneas empezando exactamente por `[`. Los exports reales de WhatsApp
traen años de 4 dígitos, horas "9:06 p. m." (con espacio estrecho U+202F) y
caracteres invisibles U+200E al inicio de línea (iPhone) → caían en
"desconocido".

- Patrones flexibles centralizados en `formatDetector.js` (`PATRON_IOS`,
  `PATRON_ANDROID`, `PATRON_INICIO_MENSAJE`, `limpiarLineaChat`).
- `dateUtils.parseDateTime` convierte 12h→24h y acepta separadores `.` y `-`.
- Los 4 analizadores (`AnalisisEstadistico`, `Analisis_primer_chat`,
  `Analisis_top`, `AnalisisResumenGeneral`) importan los patrones compartidos.
- Test primero (regla de bugs): `src/formatDetector.test.js`, 12 tests
  (8 fallaban antes del fix, 12/12 pasan después).
- Pendiente menor: las regex de `anonymizationService.js` (limpieza de
  timestamps para la IA) siguen siendo estrictas; no bloquean el análisis
  pero convendría alinearlas igual.
- **Causa raíz adicional**: `anonimizarChat` en `App.js` trataba "26 13"
  (fin de fecha + inicio de hora en exports iOS SIN coma) como número de
  teléfono y corrompía el timestamp a "26XX" antes del análisis. Añadidos
  patrones protectores para timestamps sin coma (y con separadores . -).
  Verificado de punta a punta con el archivo real de Maria: formato "ios",
  8721/8794 líneas reconocidas. 13/13 tests pasan.

### Aprendizajes
- CRA 5 no transpila `node_modules`: cualquier dependencia que publique
  sintaxis moderna rompe Safari viejo. La guardia es-check lo detecta en build.
- El bloque `.cookie-banner` de `AppPreview.css` era de un markup antiguo y
  pisaba al componente real por compartir nombres de clase.
- Un build local necesita las env vars `REACT_APP_FIREBASE_*` (aunque sean
  dummy) o React revienta al montar con pantalla en blanco.
- `fix-font-sizes.css` (parche global con !important) sigue activo; retirarlo
  es candidato a tarea futura con revisión visual amplia.
