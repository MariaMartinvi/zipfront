// Página de vuelta de Stripe (/libro/pedido?session_id=...): confirma el pago y crea el pedido
// en imprenta. No guardamos nada: la referencia es el id de sesión de Stripe.
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './libro.css';

const API_URL = process.env.REACT_APP_API_URL || 'https://zipcd-backend-andand-gunicorn-app-app.onrender.com';

export default function LibroPedido() {
  const navigate = useNavigate();
  const [estado, setEstado] = useState('confirmando'); // confirmando | ok | error
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const sid = new URLSearchParams(window.location.search).get('session_id');
    if (!sid) { setEstado('error'); setError('Falta la referencia del pago.'); return; }
    let intentos = 0;
    const confirmar = async () => {
      try {
        const r = await fetch(`${API_URL}/api/book/confirm?session_id=${encodeURIComponent(sid)}`);
        const d = await r.json().catch(() => ({}));
        if (r.status === 402 && intentos++ < 5) return setTimeout(confirmar, 2000); // Stripe aún no ha marcado el pago
        if (!r.ok) throw new Error(d.error || 'No se pudo confirmar el pedido');
        setDatos(d); setEstado('ok');
      } catch (e) { setError(e.message); setEstado('error'); }
    };
    confirmar();
  }, []);

  if (estado === 'confirmando') return <div className="libro-empty"><h2>Confirmando tu pedido…</h2><div className="libro-spinner" /></div>;
  if (estado === 'error') return (
    <div className="libro-empty"><h2>Ha habido un problema</h2>
      <p>{error}</p>
      <p>Si el pago se ha realizado, no te preocupes: escríbenos a info@comartinvi.com con el email del pago y lo resolvemos.</p>
      <button onClick={() => navigate('/')}>Volver</button></div>
  );
  const esPdf = datos.product === 'pdf';
  return (
    <div className="libro-empty">
      <h2>{esPdf ? '¡Tu libro en PDF está listo! 📖' : '¡Tu libro está en marcha! 📖'}</h2>
      {datos.downloadUrl && <p><a className="libro-descarga" href={datos.downloadUrl} download="libro.pdf">Descargar el PDF</a></p>}
      {datos.downloadUrl && <p className="libro-nota">El enlace funciona durante {datos.downloadDays || 7} días; guárdate el archivo.</p>}
      {!esPdf && <p>Hemos enviado tu libro a imprenta. Recibirás el recibo de pago por email{datos.email ? ` (${datos.email})` : ''} y te avisaremos cuando salga de camino.</p>}
      {!esPdf && <p>Referencia del pedido: <b>{datos.orderId}</b></p>}
      <p className="libro-nota">Tu chat no se ha guardado en ningún sitio: solo este PDF, cifrado, hasta que caduque.</p>
      <button onClick={() => navigate('/')}>Volver a ChatSalsa</button>
    </div>
  );
}
