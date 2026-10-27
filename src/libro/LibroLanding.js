// Landing de "Tu chat en un libro" (/libro-recuerdo): explica el producto, enseña precios por región
// y tiene su propia caja de subida que lleva directamente al editor (/libro), sin pasar por el análisis.
// El zip se lee en el navegador: ni el chat ni las fotos salen de aquí.
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UploadBox from '../UploadBox';
import { libroStore } from './store';
import './libro.css';

const API_URL = process.env.REACT_APP_API_URL || 'https://zipcd-backend-andand-gunicorn-app-app.onrender.com';

function region() {
  let tz = '';
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { /* nada */ }
  if (/^America\/(Mexico_City|Cancun|Merida|Monterrey|Matamoros|Chihuahua|Ciudad_Juarez|Ojinaga|Mazatlan|Bahia_Banderas|Hermosillo|Tijuana)$/.test(tz)) return 'mx';
  if (/^America\/(Caracas|Bogota|Lima|Guayaquil|La_Paz|Asuncion|Montevideo|Santiago|Buenos_Aires|Cordoba|Argentina\/|Guatemala|Tegucigalpa|El_Salvador|Managua|Costa_Rica|Panama|Santo_Domingo|Havana|Sao_Paulo)/.test(tz)) return 'latam';
  if (/^(Europe\/Madrid|Atlantic\/Canary|Africa\/Ceuta)$/.test(tz)) return 'es';
  if (/^America\//.test(tz)) return 'us';
  return 'default';
}

export default function LibroLanding() {
  const navigate = useNavigate();
  const [precios, setPrecios] = useState({ libro: '39 €', pdf: '12,99 €' });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/book/config?region=${region()}`).then(r => r.json()).then(c => { if (c && c.labels) setPrecios(c.labels); }).catch(() => {});
    window.scrollTo(0, 0);
  }, []);

  async function subir(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setError(''); setCargando(true);
    try {
      const JSZip = (await import('jszip')).default;
      const zip = await new JSZip().loadAsync(file);
      const entrada = Object.keys(zip.files).find(n => /(^|\/)_chat\.txt$/i.test(n)) || Object.keys(zip.files).find(n => /\.txt$/i.test(n));
      if (!entrada) throw new Error('El zip no contiene el chat (archivo .txt). Exporta el chat desde WhatsApp y sube el zip tal cual.');
      const chatText = await zip.files[entrada].async('string');
      libroStore.set({ chatText, zip, fileName: file.name });
      navigate('/libro');
    } catch (err) { setError(err.message || 'No se ha podido leer el archivo'); }
    setCargando(false);
  }

  return (
    <div className="libro-landing">
      <section className="ll-hero">
        <span className="ll-badge">Nuevo · Impreso o PDF</span>
        <h1>Tu chat de WhatsApp,<br />en un libro de verdad</h1>
        <p>Elegimos los mejores días de vuestra conversación y los convertimos en un libro con capítulos, vuestras fotos y los personajes de cada uno. Tú lo revisas, quitas lo que quieras y lo recibes en casa.</p>
        <div className="ll-precios">
          <div><b>{precios.libro}</b><span>Libro impreso · tapa blanda 14×21,5 cm · envío incluido · PDF incluido</span></div>
          <div><b>{precios.pdf}</b><span>Solo PDF · descarga inmediata</span></div>
        </div>
      </section>

      <section className="ll-subida" id="subir">
        <UploadBox onFileUpload={subir} titulo="Sube tu chat para ver tu libro" subtitulo="Exporta el chat CON archivos (para que salgan las fotos) y sube el zip. Ves el libro entero gratis antes de pedirlo." sinPrivacidad />
        {cargando && <p className="ll-nota">Leyendo el chat…</p>}
        {error && <p className="ll-error">{error}</p>}
        <p className="ll-nota">🔒 El chat y las fotos se quedan en tu navegador. Para imprimir solo viaja el PDF, cifrado, y se borra al cabo de unos días.</p>
      </section>

      <section className="ll-pasos">
        <div><span>1</span><b>Sube el chat</b><p>Exportado desde WhatsApp con archivos. Grupos, parejas, familia, amigos.</p></div>
        <div><span>2</span><b>Revisa tu libro</b><p>Capítulos propuestos con los mejores días, enteros. Quita capítulos o mensajes, pon título, portada y dedicatoria.</p></div>
        <div><span>3</span><b>Pídelo</b><p>Impreso en casa en pocos días, o el PDF al momento. Pago seguro con Stripe.</p></div>
      </section>

      <section className="ll-incluye">
        <h2>Qué hay dentro</h2>
        <ul>
          <li>📖 <b>Capítulos</b> con los días más intensos de la conversación, tal cual fueron</li>
          <li>📸 <b>Vuestras fotos</b>, integradas en la conversación</li>
          <li>🎭 <b>Los personajes</b>: quién es El Cómico, El Rollero, El Amoroso… según el análisis de ChatSalsa</li>
          <li>📊 <b>En números</b>: mensajes, días, risas, corazones, hora punta</li>
          <li>✍️ Portada, título y dedicatoria a tu gusto</li>
        </ul>
      </section>

      <section className="ll-ejemplos">
        <h2>Ejemplos</h2>
        <div className="ll-ejemplos-grid">
          <div className="ll-libro" style={{ background: 'linear-gradient(135deg,#2f3e46,#1d1d1b)' }}><b>Eva &amp; Noemí</b><span>2024 – 2026</span></div>
          <div className="ll-libro" style={{ background: 'linear-gradient(135deg,#5b3a4a,#1d1d1b)' }}><b>Las Gemeles</b><span>2025 – 2026</span></div>
          <div className="ll-libro" style={{ background: 'linear-gradient(135deg,#2b4a6f,#1d1d1b)' }}><b>Familia Martín</b><span>2019 – 2026</span></div>
        </div>
        <p className="ll-nota">Pronto: vídeos de libros reales.</p>
      </section>

      <section className="ll-faq">
        <h2>Preguntas</h2>
        <details><summary>¿Cómo exporto el chat con las fotos?</summary><p>En WhatsApp, abre el chat → menú → Más → Exportar chat → <b>Incluir archivos</b>. Te genera un zip; súbelo aquí tal cual. Los chats muy grandes pueden tardar en exportarse; si WhatsApp falla, exporta sin archivos y tendrás el libro sin fotos.</p></details>
        <details><summary>¿Quién elige lo que sale?</summary><p>Las reglas eligen los días más intensos; dentro de cada capítulo va la conversación entera de esos días, sin cortes. Tú quitas capítulos o mensajes sueltos antes de pedir. No usamos IA para decidir ni para escribir nada.</p></details>
        <details><summary>¿Y los vídeos y audios?</summary><p>En esta versión no van en el libro. Estamos preparando códigos QR para verlos desde el papel.</p></details>
        <details><summary>¿Guardáis mi chat?</summary><p>No. Todo se procesa en tu navegador. Solo el PDF final se guarda cifrado, unos días, para imprimirlo o descargarlo, y luego se borra.</p></details>
        <details><summary>¿A dónde enviáis?</summary><p>España, México, Estados Unidos, Colombia, Argentina, Perú y varios países de Europa. En Venezuela y otros, el PDF.</p></details>
      </section>

      <section className="ll-cta">
        <button onClick={() => document.getElementById('subir')?.scrollIntoView({ behavior: 'smooth' })}>Sube tu chat y mira tu libro gratis</button>
      </section>
    </div>
  );
}
