// Evento para GA4 vía GTM. El nombre debe estar en el activador de GTM para llegar a GA4.
export const trackEvent = (name) => {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: name });
  if (window.gtag) window.gtag('event', name);
};
