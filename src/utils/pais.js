// País para las estadísticas de «Tu chat frente al resto», sacado de la zona horaria del navegador.
// No usa IP ni pregunta nada: solo dice desde qué país se sube el chat. Zona desconocida → 'otros'.
// La lista de códigos es la misma que PAISES en zipback/services/comparativa.py.

const ZONAS = {
  ES: 'Europe/Madrid Atlantic/Canary Africa/Ceuta',
  CL: 'America/Santiago America/Punta_Arenas Pacific/Easter',
  MX: 'America/Mexico_City America/Cancun America/Merida America/Monterrey America/Matamoros America/Chihuahua America/Ciudad_Juarez America/Ojinaga America/Mazatlan America/Bahia_Banderas America/Hermosillo America/Tijuana',
  AR: 'America/Buenos_Aires America/Cordoba America/Mendoza',
  CO: 'America/Bogota',
  PE: 'America/Lima',
  VE: 'America/Caracas',
  EC: 'America/Guayaquil Pacific/Galapagos',
  UY: 'America/Montevideo',
  PY: 'America/Asuncion',
  BO: 'America/La_Paz',
  CR: 'America/Costa_Rica',
  DO: 'America/Santo_Domingo',
  GT: 'America/Guatemala',
  HN: 'America/Tegucigalpa',
  SV: 'America/El_Salvador',
  NI: 'America/Managua',
  PA: 'America/Panama',
  CU: 'America/Havana',
  PR: 'America/Puerto_Rico',
  BR: 'America/Sao_Paulo America/Bahia America/Fortaleza America/Recife America/Manaus America/Belem',
  US: 'America/New_York America/Chicago America/Denver America/Los_Angeles America/Phoenix America/Detroit America/Anchorage Pacific/Honolulu',
  GB: 'Europe/London',
  IE: 'Europe/Dublin',
  FR: 'Europe/Paris',
  PT: 'Europe/Lisbon Atlantic/Madeira Atlantic/Azores',
  IT: 'Europe/Rome',
  DE: 'Europe/Berlin',
  NL: 'Europe/Amsterdam',
  BE: 'Europe/Brussels',
  CH: 'Europe/Zurich',
  AT: 'Europe/Vienna',
  AD: 'Europe/Andorra',
};
const PAIS_DE_ZONA = {};
Object.entries(ZONAS).forEach(([pais, zonas]) => zonas.split(' ').forEach((z) => { PAIS_DE_ZONA[z] = pais; }));

/** Código del país ('ES', 'CL'…) o 'otros'. Las zonas de Argentina van todas por America/Argentina/*. */
export function paisDeZona(zona) {
  if (typeof zona !== 'string') return 'otros';
  if (zona.startsWith('America/Argentina/')) return 'AR';
  return PAIS_DE_ZONA[zona] || 'otros';
}

export function paisDelNavegador() {
  try { return paisDeZona(Intl.DateTimeFormat().resolvedOptions().timeZone); } catch (e) { return 'otros'; }
}
