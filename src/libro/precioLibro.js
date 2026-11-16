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

// Países donde se imprime (los decide el servidor: donde Gelato imprime cerca y sale a cuenta). El navegador no
// sabe el país; lo deducimos de la zona horaria solo para esos países.
export const PAISES_IMPRESION_DEFECTO = ['ES', 'PT', 'FR', 'IT', 'DE', 'GB', 'US'];
const ZONAS_PAIS = [
  [/^(Europe\/Madrid|Atlantic\/Canary|Africa\/Ceuta)$/, 'ES'],
  [/^(Europe\/Lisbon|Atlantic\/Madeira|Atlantic\/Azores)$/, 'PT'],
  [/^Europe\/Paris$/, 'FR'],
  [/^(Europe\/Rome|Europe\/Vatican|Europe\/San_Marino)$/, 'IT'],
  [/^(Europe\/Berlin|Europe\/Busingen)$/, 'DE'],
  [/^(Europe\/London|Europe\/Belfast)$/, 'GB'],
  [/^(America\/(New_York|Chicago|Denver|Los_Angeles|Phoenix|Anchorage|Detroit|Boise|Juneau|Sitka|Nome|Adak|Yakutat|Metlakatla|Menominee|Indiana\/.+|Kentucky\/.+|North_Dakota\/.+)|Pacific\/Honolulu|US\/.+)$/, 'US'],
];

export function paisPorZona(tz) {
  if (tz === undefined) {
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { tz = ''; }
  }
  const z = ZONAS_PAIS.find(([re]) => re.test(tz));
  return z ? z[1] : null;
}

/** ¿Se le ofrece el libro impreso? Solo si su zona horaria es de un país donde imprimimos. */
export const puedeImprimir = (paises, tz) => (paises || PAISES_IMPRESION_DEFECTO).includes(paisPorZona(tz));

/** { labels: {libro, pdf}, currency } del servidor; si falla, los precios por defecto en euros. */
export async function cargarPreciosLibro() {
  try {
    const c = await fetch(`${API_URL}/api/book/config?region=${regionLibro()}`).then((r) => r.json());
    if (c && c.labels) return { labels: c.labels, currency: c.currency || 'EUR', tramos: c.tramos || null, paises: c.countries || PAISES_IMPRESION_DEFECTO };
  } catch (e) { /* sin red: precios por defecto */ }
  return { labels: PRECIOS_LIBRO_DEFECTO, currency: 'EUR', tramos: null, paises: PAISES_IMPRESION_DEFECTO };
}

/** Precio del impreso para un libro de `paginas` páginas de imprenta (el servidor cobra por tramos). */
export function etiquetaImpreso(labels, tramos, paginas) {
  const t = (tramos || []).find((x) => paginas <= x.hasta);
  return t ? t.label : labels.libro;
}
