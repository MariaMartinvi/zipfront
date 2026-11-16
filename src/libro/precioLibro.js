// Precio del libro según la región (lo decide el servidor). Lo usan la landing del libro y la página de precios.
const API_URL = process.env.REACT_APP_API_URL || 'https://zipcd-backend-andand-gunicorn-app-app.onrender.com';

export const PRECIOS_LIBRO_DEFECTO = { libro: '29 €', pdf: '12,99 €' };

export function regionLibro(tz) {
  if (tz === undefined) {
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { tz = ''; }
  }
  if (/^America\/(Mexico_City|Cancun|Merida|Monterrey|Matamoros|Chihuahua|Ciudad_Juarez|Ojinaga|Mazatlan|Bahia_Banderas|Hermosillo|Tijuana)$/.test(tz)) return 'mx';
  if (/^America\/(Caracas|Bogota|Lima|Guayaquil|La_Paz|Asuncion|Montevideo|Santiago|Buenos_Aires|Cordoba|Argentina\/|Guatemala|Tegucigalpa|El_Salvador|Managua|Costa_Rica|Panama|Santo_Domingo|Havana|Sao_Paulo)/.test(tz)) return 'latam';
  if (/^(Europe\/Madrid|Atlantic\/Canary|Africa\/Ceuta)$/.test(tz)) return 'es';
  if (/^America\//.test(tz)) return 'us';
  return 'default';
}

/** { labels: {libro, pdf}, currency } del servidor; si falla, los precios por defecto en euros. */
export async function cargarPreciosLibro() {
  try {
    const c = await fetch(`${API_URL}/api/book/config?region=${regionLibro()}`).then((r) => r.json());
    if (c && c.labels) return { labels: c.labels, currency: c.currency || 'EUR', tramos: c.tramos || null };
  } catch (e) { /* sin red: precios por defecto */ }
  return { labels: PRECIOS_LIBRO_DEFECTO, currency: 'EUR', tramos: null };
}

/** Precio del impreso para un libro de `paginas` páginas de imprenta (el servidor cobra por tramos). */
export function etiquetaImpreso(labels, tramos, paginas) {
  const t = (tramos || []).find((x) => paginas <= x.hasta);
  return t ? t.label : labels.libro;
}
