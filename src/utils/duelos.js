// Perfiles en modo pareja: en un chat de dos personas, «los otros» de cada perfil es una sola persona,
// así que la «media del resto» que ya calcula Analisis_top.js es exactamente el valor de la otra.
// Con eso cada tarjeta enseña a los dos, uno frente al otro, sin recalcular nada.

// perfil → [campo de quien destaca, campo del resto, formato, etiqueta (clave de traducción ya existente)]
export const DUELO = {
  profesor: ['ratio', 'media_ratio_resto', 'decimal', 'app.top_profiles.professor.unique_ratio'],
  rollero: ['palabras_por_mensaje', 'media_palabras_por_mensaje_resto', 'decimal', 'app.top_profiles.verbose.words_per_message'],
  pistolero: ['tiempo_respuesta_promedio', 'media_tiempo_respuesta_resto', 'minutos', 'app.top_profiles.gunslinger.response_time'],
  dejaenvisto: ['tiempo_respuesta_promedio', 'media_tiempo_respuesta_resto', 'minutos', 'app.top_profiles.ghost.response_time'],
  vampiro: ['porcentaje', 'media_porcentaje_resto', 'pct', 'app.top_profiles.vampire.percentage'],
  cafeconleche: ['hora_formateada', 'hora_formateada_resto', 'texto', 'app.top_profiles.morning.avg_time'],
  narcicista: ['porcentaje', 'media_porcentaje_resto', 'pct', 'app.top_profiles.narcissist.percentage'],
  chismoso: ['porcentaje', 'media_porcentaje_resto', 'pct', 'app.top_profiles.gossip.percentage'],
  happyflower: ['emojis_por_mensaje', 'media_emojis_por_mensaje_resto', 'decimal', 'app.top_profiles.emoji.emojis_per_message'],
  amoroso: ['emojis_amor', 'media_emojis_amor_resto', 'entero', 'app.top_profiles.amoroso.love_emojis'],
  puntofinal: ['conversaciones_terminadas', 'media_conversaciones_terminadas_resto', 'entero', 'app.top_profiles.finisher.conversations_ended'],
  fosforo: ['conversaciones_iniciadas', 'media_conversaciones_iniciadas_resto', 'entero', 'app.top_profiles.initiator.conversations_started'],
  menosesmas: ['longitud_promedio', 'media_longitud_resto', 'decimal', 'app.top_profiles.concise.avg_length'],
  bombardero: ['max_mensajes_seguidos', 'media_mensajes_seguidos_resto', 'entero', 'app.top_profiles.bombardero.record'],
  comico: ['porcentaje', 'media_porcentaje_resto', 'pct', 'app.stats_labels.funny_percentage'],
  agradecido: ['porcentaje', 'media_porcentaje_resto', 'pct', 'app.stats_labels.thanks_percentage'],
  disculpon: ['porcentaje', 'media_porcentaje_resto', 'pct', 'app.stats_labels.apologies_percentage'],
  curioso: ['porcentaje', 'media_porcentaje_resto', 'pct', 'app.stats_labels.questions_percentage'],
};

/** Nombre de la otra persona si el chat es de exactamente dos; si no, null. */
export function otroDeLaPareja(datos, nombre) {
  const nombres = datos && datos.usuarios && !Array.isArray(datos.usuarios) ? Object.keys(datos.usuarios) : [];
  if (nombres.length !== 2 || !nombres.includes(nombre)) return null;
  return nombres.find((n) => n !== nombre);
}

/** { etiqueta, formato, gana: { nombre, valor }, otro: { nombre, valor } } o null si no es pareja o faltan datos. */
export function duelo(datos, categoria) {
  const def = DUELO[categoria];
  const cat = datos && datos.categorias && datos.categorias[categoria];
  if (!def || !cat) return null;
  const otro = otroDeLaPareja(datos, cat.nombre);
  const [campo, campoOtro, formato, etiqueta] = def;
  const a = cat[campo], b = cat[campoOtro];
  const vale = (v) => (formato === 'texto' ? typeof v === 'string' && v : typeof v === 'number' && Number.isFinite(v));
  if (!otro || !vale(a) || !vale(b)) return null;
  return { etiqueta, formato, gana: { nombre: cat.nombre, valor: a }, otro: { nombre: otro, valor: b } };
}

/** Duración corta para la tarjeta: «12 min», «3 h 19 min», «5,6 d». */
export function duracionCorta(min) {
  if (!Number.isFinite(min)) return '';
  if (min < 60) return `${Math.round(min)} min`;
  if (min < 1440) { const h = Math.floor(min / 60), m = Math.round(min % 60); return m ? `${h} h ${m} min` : `${h} h`; }
  return `${(min / 1440).toFixed(1)} d`;
}
