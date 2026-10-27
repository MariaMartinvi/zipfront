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
      libroStore.set({ chatText, zip, fileName: file.name, file });
      navigate('/libro');
    } catch (err) { setError(err.message || 'No se ha podido leer el archivo'); }
    setCargando(false);
  }

  return (
    <div className="libro-landing">
      <section className="ll-hero2">
        <div className="ll-hero2-texto">
          <span className="ll-etiqueta">🎁 El regalo que nadie más puede hacer</span>
          <h1>Vuestro chat de WhatsApp, <em>convertido en libro</em></h1>
          <p className="ll-gancho">Los mejores días de vuestra conversación, con vuestras fotos y los personajes de cada uno, impresos en un libro de verdad.</p>
          <div className="ll-hero-cta">
            <button onClick={() => document.getElementById('subir')?.scrollIntoView({ behavior: 'smooth' })}>Crea tu libro gratis</button>
            <span>Lo ves entero antes de pagar · desde {precios.pdf}</span>
          </div>
        </div>
        <div className="ll-hero2-libro" aria-hidden="true">
          <div className="ll3d">
            <div className="ll3d-paginas" />
            <div className="ll3d-tapa" style={{ backgroundImage: 'url(/libro/pareja.jpg)' }}>
              <b>Eva &amp; Marcos</b><span>2024 – 2026</span>
            </div>
          </div>
          <div className="ll3d-abierto">
            <div className="ll3d-pag izq"><small>Capítulo 3</small><strong>Aquel verano en Roma</strong></div>
            <div className="ll3d-pag der">
              <div className="b l">¿Ya has aterrizado? ✈️</div>
              <div className="b r">Sí!! Esto es precioso 😍</div>
              <div className="foto" style={{ backgroundImage: 'url(/libro/pareja.jpg)' }} />
              <div className="b l">Te echo de menos</div>
            </div>
          </div>
        </div>
      </section>

      <section className="ll-ocasiones">
        <span>Aniversario</span><span>San Valentín</span><span>Cumpleaños</span><span>Boda</span><span>Navidad</span><span>Día de la madre</span><span>Despedida</span><span>Porque sí</span>
      </section>

      <section className="ll-ejemplos">
        <h2>Un libro para cada historia</h2>
        <div className="ll-ejemplos-grid">
          <div className="ll-ejemplo"><div className="ll-libro" style={{ backgroundImage: 'url(/libro/pareja.jpg)' }}><b>Eva &amp; Marcos</b><span>2024 – 2026</span></div><p><b>Para tu pareja</b><br />Desde el primer "hola" hasta hoy. 68 páginas.</p></div>
          <div className="ll-ejemplo"><div className="ll-libro" style={{ backgroundImage: 'url(/libro/hermanas.jpg)' }}><b>Las Hermanas Sánchez</b><span>2021 – 2026</span></div><p><b>Para tus hermanas</b><br />Cinco años de grupo, con sus personajes. 84 páginas.</p></div>
          <div className="ll-ejemplo"><div className="ll-libro" style={{ backgroundImage: 'url(/libro/familia.jpg)' }}><b>Familia Matutes</b><span>2019 – 2026</span></div><p><b>Para la familia</b><br />Los abuelos, los primos, las comidas de domingo. 96 páginas.</p></div>
          <div className="ll-ejemplo"><div className="ll-libro" style={{ backgroundImage: 'url(/libro/amigas.jpg)' }}><b>Las de siempre</b><span>2018 – 2026</span></div><p><b>Para el grupo de amigas</b><br />Ocho años de planes, dramas y risas. 102 páginas.</p></div>
        </div>
      </section>

      <section className="ll-pasos">
        <div><span>1</span><b>Sube el chat</b><p>Exportado desde WhatsApp con archivos. Dos minutos.</p></div>
        <div><span>2</span><b>Revisa y edita tu libro</b><p>Te proponemos capítulos con los mejores días, enteros. Quita lo que quieras, pon título, portada y dedicatoria.</p></div>
        <div><span>3</span><b>Recíbelo en casa</b><p>Impreso en tapa blanda en pocos días, o el PDF al momento. Pago seguro con Stripe.</p></div>
      </section>

      <section className="ll-precios-sec">
        <div className="ll-precios">
          <div className="ll-destacado"><em>El regalo</em><b>{precios.libro}</b><span>Libro impreso · tapa blanda 20×20 cm, papel fotográfico · envío incluido · PDF incluido</span></div>
          <div><em>Para leer ya</em><b>{precios.pdf}</b><span>Solo PDF · descarga inmediata</span></div>
        </div>
      </section>

      <section className="ll-subida" id="subir">
        <UploadBox onFileUpload={subir} titulo="Sube tu chat y mira tu libro gratis" subtitulo="Exporta el chat CON archivos (para que salgan las fotos) y sube el zip. No pagas nada hasta que lo veas entero y te guste." sinPrivacidad avisoMedios={<>📸 Para el libro, exporta <b>CON medios</b> si quieres incluir fotos.</>} />
        {cargando && <p className="ll-nota">Leyendo el chat…</p>}
        {error && <p className="ll-error">{error}</p>}
        <p className="ll-nota">🔒 El chat y las fotos se quedan en tu navegador. Para imprimir solo viaja el PDF, cifrado, y se borra al cabo de unos días.</p>
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

      <section className="ll-faq">
        <h2>Preguntas</h2>
        <details><summary>¿Cómo exporto el chat con las fotos?</summary><p>En WhatsApp, abre el chat → menú → Más → Exportar chat → <b>Incluir archivos</b>. Te genera un zip; súbelo aquí tal cual. Los chats muy grandes pueden tardar en exportarse; si WhatsApp falla, exporta sin archivos y tendrás el libro sin fotos.</p></details>
        <details><summary>¿Quién elige lo que sale?</summary><p>Las reglas eligen los días más intensos; dentro de cada capítulo va la conversación entera de esos días, sin cortes. Tú quitas capítulos o mensajes sueltos antes de pedir. No usamos IA para decidir ni para escribir nada.</p></details>
        <details><summary>¿Y los vídeos y audios?</summary><p>En esta versión no van en el libro. Estamos preparando códigos QR para verlos desde el papel.</p></details>
        <details><summary>¿Guardáis mi chat?</summary><p>No. Todo se procesa en tu navegador. Solo el PDF final se guarda cifrado, unos días, para imprimirlo o descargarlo, y luego se borra.</p></details>
        <details><summary>¿A dónde enviáis?</summary><p>España, México, Estados Unidos, Colombia, Argentina, Perú y varios países de Europa. En Venezuela y otros, el PDF.</p></details>
      </section>

      <section className="ll-cta">
        <button onClick={() => document.getElementById('subir')?.scrollIntoView({ behavior: 'smooth' })}>Crea tu libro gratis</button>
      </section>
    </div>
  );
}
