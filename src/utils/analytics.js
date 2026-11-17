// Evento para GA4 vía GTM. El nombre debe estar en el activador de GTM para llegar a GA4.
export const trackEvent = (name) => {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: name });
  if (window.gtag) window.gtag('event', name);
  // También a Clarity, para poder filtrar las grabaciones por evento
  if (typeof window.clarity === 'function') window.clarity('event', name);
};

// Clics hacia los productos de pago, para comparar en GA4 qué se pulsa más y desde dónde.
// Nombre del evento: click_<producto>_<origen>, p. ej. click_libro_menu.
export const PRODUCTOS = ['libro'];
export const ORIGENES = ['menu', 'banda', 'precios', 'landing', 'footer', 'resultados'];
export const trackProductoClick = (producto, origen) => {
  if (!PRODUCTOS.includes(producto) || !ORIGENES.includes(origen)) return;
  trackEvent(`click_${producto}_${origen}`);
};
