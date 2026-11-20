/**
 * Portada visible sin esperar al JS (LCP): mete en build/index.html la cabecera y el hero ya pintados.
 * Un script en línea los coloca en #root solo en "/", en español y sin sesión guardada; React los
 * sustituye al montar. Los textos salen de public/locales/es, así que no hay que mantenerlos a mano.
 * El marcado del hero tiene que ser el de src/components/HeroSection.js (lo vigila src/shell.test.js).
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// t('hero.title.discover', 'por defecto') sobre el JSON de traducciones, como i18next
const crearT = (textos) => (clave, porDefecto) => {
  const v = clave.split('.').reduce((o, k) => (o == null ? o : o[k]), textos);
  return esc(typeof v === 'string' ? v : (porDefecto != null ? porDefecto : clave));
};

const heroHtml = (t) =>
  '<section class="hero-section"><div class="hero-content"><div class="hero-text">' +
  `<button type="button" class="new-hero-badge">${t('hero.badge', 'ANÁLISIS DE WHATSAPP')}</button>` +
  `<h1 class="hero-title">${t('hero.title.discover', '¿Quién habla más en tu grupo?')}` +
  `<span class="gradient-text"> ${t('hero.title.conversations', 'Descubre los secretos ocultos')}</span>` +
  `<span class="whatsapp-text"> ${t('hero.title.whatsapp', 'de WhatsApp')}</span> ${t('hero.title.conversations_suffix', '')}</h1>` +
  `<p class="hero-description">${t('hero.description', '🔥 Análisis psicológico + estadísticas detalladas de tus chats. ¿Quién es el más gracioso? ¿El más intenso? ¡Descúbrelo en 30 segundos!')}</p>` +
  '<div class="hero-actions">' +
  `<button class="cta-primary">${t('hero.buttons.analyze', 'Analizar mi chat')}</button>` +
  `<button class="cta-secondary">${t('hero.buttons.how_it_works', 'Cómo funciona')}</button>` +
  '</div>' +
  '<div class="security-badge"><div class="security-icons">' +
  '<div class="security-icon-circle security-icon-green">🔒</div>' +
  '<div class="security-icon-circle security-icon-purple">📊</div>' +
  '<div class="security-icon-circle security-icon-green-alt">🧠</div>' +
  '</div><div class="security-text">' +
  `<strong>${t('hero.security.title', '100% Privado y Seguro')}</strong>` +
  `<span>${t('hero.security.subtitle', 'Los datos no salen de tu dispositivo')}</span>` +
  '</div></div></div>' +
  '<div class="hero-preview"><div class="phone-mockup"><div class="phone-header"><div class="phone-indicators">' +
  `<span class="indicator green">●</span><span class="phone-title">${t('hero.mockup.title', 'Resultados instantáneos')}</span>` +
  '</div></div><div class="phone-content"><div class="analysis-card"><div class="participant-card">' +
  '<div class="participant-avatar">L</div><div class="participant-info">' +
  `<h4>${t('hero.mockup.profile', 'Extrovertida, líder natural del grupo.')}</h4>` +
  `<p>${t('hero.mockup.description', 'Suele iniciar la mayoría de las conversaciones.')}</p>` +
  '</div></div></div><div class="chart-placeholder">' +
  '<div class="chart-bar" style="--height:80%;--color:var(--primary-green)"></div>' +
  '<div class="chart-bar" style="--height:60%;--color:var(--accent-purple)"></div>' +
  '<div class="chart-bar" style="--height:40%;--color:var(--accent-pink)"></div>' +
  '<div class="chart-bar" style="--height:25%;--color:var(--accent-orange)"></div>' +
  `</div><button class="view-analysis-btn">${t('hero.mockup.view_analysis', 'Ver análisis completo')} →</button>` +
  '</div></div></div></div></section>';

// Cabecera de visitante sin sesión (src/Header.js), con el selector de idioma: sin él la cabecera mide menos en ordenador
const headerHtml = (t) =>
  '<header class="app-header"><div class="header-container"><a class="logo" href="/"><div class="logo-container"><div class="logo-icon">' +
  '<svg xmlns="http://www.w3.org/2000/svg" class="logo-clipboard-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">' +
  '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>' +
  '</div><span class="logo-chatsalsa">ChatSalsa</span></div></a><div class="nav-container"><nav class="desktop-nav">' +
  `<a class="nav-link" href="/">${t('header.home')}</a>` +
  '<a class="nav-link" href="/libro-recuerdo"><span class="nav-nuevo">Nuevo</span> Libro regalo</a>' +
  `<a class="nav-link" href="/plans">${t('header.pricing')}</a>` +
  `<a class="nav-link" href="/login">${t('header.login')}</a>` +
  `<a class="nav-link sign-up" href="/register">${t('header.free_trial')}</a>` +
  `<div class="language-switcher"><select class="language-select" aria-label="${t('language.select')}">` +
  ['es', 'en', 'fr', 'de', 'it', 'pt'].map((l) => `<option value="${l}">${t('language.' + l)}</option>`).join('') +
  '</select></div>' +
  '</nav><button class="mobile-menu-button" aria-label="Toggle menu"><span class="menu-icon">☰</span></button></div></div></header>';

// Misma detección de idioma que el preload de traducciones de public/index.html
const SCRIPT =
  '<script>!function(){try{if("/"!==location.pathname||"1"===localStorage.getItem("cs_sesion"))return;' +
  'var l=new URLSearchParams(location.search).get("lang")||localStorage.getItem("i18nextLng")||navigator.language||"es";' +
  'if("es"!==String(l).slice(0,2).toLowerCase())return;' +
  'document.getElementById("root").innerHTML=document.getElementById("cs-shell").innerHTML}catch(e){}}()</script>';

const shellHtml = (textos) => {
  const t = crearT(textos);
  return '<template id="cs-shell"><div class="app-container" data-shell><div class="App">' + headerHtml(t) +
    '<main class="App-main"><div class="modern-preview-container">' + heroHtml(t) + '</div></main></div></div></template>' + SCRIPT;
};

function main() {
  const destino = path.join(ROOT, 'build', 'index.html');
  const textos = JSON.parse(fs.readFileSync(path.join(ROOT, 'public', 'locales', 'es', 'translation.json'), 'utf8'));
  const html = fs.readFileSync(destino, 'utf8');
  const RAIZ = '<div id="root"></div>';
  if (html.split(RAIZ).length !== 2) {
    console.error('shell.js: no encuentro ' + RAIZ + ' en build/index.html');
    process.exit(1);
  }
  fs.writeFileSync(destino, html.replace(RAIZ, () => RAIZ + shellHtml(textos)));
  console.log('shell.js: portada inyectada en build/index.html');
}

if (require.main === module) main();

module.exports = { crearT, heroHtml, headerHtml, shellHtml };
