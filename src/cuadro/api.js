// Llamadas al servidor del cuadro regalo (zipback/cuadro_routes.py). El «pase» es el id de la sesión de Stripe pagada.
import { getAiPackPricing } from '../utils/pricing';

const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000';
export const PRECIO_DEFECTO = { label: '5,99 €', payments: true };
const region = () => getAiPackPricing().region; // 'es' | 'mx' | 'latam' | 'default', por zona horaria

async function json(r) {
  let d = {};
  try { d = await r.json(); } catch (e) { /* sin cuerpo */ }
  if (!r.ok) { const err = new Error(d.error || 'No se ha podido completar. Vuelve a intentarlo.'); err.status = r.status; err.code = d.code; throw err; }
  return d;
}

export async function cargarPrecio() {
  try { return await json(await fetch(`${API_URL}/api/cuadro/config?region=${region()}`)); } catch (e) { return PRECIO_DEFECTO; }
}

/** Lleva al pago de Stripe. Al volver, Stripe abre /cuadro/crear?session_id=… */
export async function pagar() {
  const d = await json(await fetch(`${API_URL}/api/cuadro/checkout`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ region: region() }),
  }));
  window.location.assign(d.url);
}

export const estadoPago = async (sid) => json(await fetch(`${API_URL}/api/cuadro/estado?session_id=${encodeURIComponent(sid)}`));

/** La IA elige las frases. El chat viaja en el cuerpo de la petición (nunca en la URL) y el servidor no lo guarda. */
export const pedirFrases = async (sid, chat) => json(await fetch(`${API_URL}/api/cuadro/frases`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ session_id: sid, chat, consentimiento: true }),
}));

export async function descargarPdf(sid, html, nombre) {
  const r = await fetch(`${API_URL}/api/cuadro/pdf`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ session_id: sid, html }),
  });
  if (!r.ok) await json(r);
  const url = URL.createObjectURL(await r.blob());
  const a = document.createElement('a');
  a.href = url; a.download = nombre;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
