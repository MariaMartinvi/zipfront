// Precio del pack de IA según la región del usuario.
// La región sale de la zona horaria del navegador (lista cerrada: EE. UU., Canadá
// y Puerto Rico NO están). El backend decide el precio real con la misma región.

// Requiere que el backend tenga el price ID de Latinoamérica (pricing.py en zipback).
export const LATAM_PRICE_ACTIVE = true;

const LATAM_TIMEZONES = new Set([
  // Venezuela
  'America/Caracas',
  // México
  'America/Mexico_City', 'America/Cancun', 'America/Merida', 'America/Monterrey',
  'America/Matamoros', 'America/Chihuahua', 'America/Ciudad_Juarez', 'America/Ojinaga',
  'America/Mazatlan', 'America/Bahia_Banderas', 'America/Hermosillo', 'America/Tijuana',
  // Colombia, Perú, Ecuador, Bolivia, Paraguay, Uruguay
  'America/Bogota', 'America/Lima', 'America/Guayaquil', 'Pacific/Galapagos',
  'America/La_Paz', 'America/Asuncion', 'America/Montevideo',
  // Chile
  'America/Santiago', 'America/Punta_Arenas', 'Pacific/Easter',
  // Argentina (además del prefijo America/Argentina/)
  'America/Buenos_Aires', 'America/Cordoba', 'America/Mendoza', 'America/Catamarca', 'America/Jujuy',
  // Centroamérica y Caribe hispano
  'America/Guatemala', 'America/Tegucigalpa', 'America/El_Salvador', 'America/Managua',
  'America/Costa_Rica', 'America/Panama', 'America/Santo_Domingo', 'America/Havana',
  // Brasil
  'America/Sao_Paulo', 'America/Bahia', 'America/Fortaleza', 'America/Recife', 'America/Belem',
  'America/Maceio', 'America/Araguaina', 'America/Manaus', 'America/Cuiaba', 'America/Campo_Grande',
  'America/Porto_Velho', 'America/Boa_Vista', 'America/Rio_Branco', 'America/Eirunepe',
  'America/Santarem', 'America/Noronha',
]);

export const isLatamTimeZone = (timeZone) =>
  typeof timeZone === 'string' &&
  (LATAM_TIMEZONES.has(timeZone) || timeZone.startsWith('America/Argentina/'));

const getUserTimeZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  } catch (e) {
    return '';
  }
};

const DEFAULT_PRICING = { region: 'default', price: '5€', original: '10€', perAnalysis: '0,50€' };
const LATAM_PRICING = { region: 'latam', price: '1,99€', original: '5€', perAnalysis: '0,20€' };

/** Precios a mostrar y región a enviar al backend. */
export const getAiPackPricing = (timeZone = getUserTimeZone(), latamActive = LATAM_PRICE_ACTIVE) =>
  latamActive && isLatamTimeZone(timeZone) ? LATAM_PRICING : DEFAULT_PRICING;
