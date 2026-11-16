// Landing de "Tu chat en un libro" (/libro-recuerdo), estilo editorial: explica el producto, enseña 4 páginas
// reales de muestra, precios por región y una comparación con lo que cuesta un fotolibro en otras tiendas.
// Tiene su propia caja de subida que lleva directamente al editor (/libro), sin pasar por el análisis.
// El zip se lee en el navegador: ni el chat ni las fotos salen de aquí.
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UploadBox from '../UploadBox';
import { libroStore } from './store';
import { paginasMuestra } from './muestra';
import { COMPARATIVA, FECHA_COMPARATIVA } from './comparativa';
import './LibroLanding.css';

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

const irASubir = () => document.getElementById('subir')?.scrollIntoView({ behavior: 'smooth' });

export default function LibroLanding() {
  const navigate = useNavigate();
  const [precios, setPrecios] = useState({ libro: '29 €', pdf: '12,99 €' });
  const [moneda, setMoneda] = useState('EUR');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const paginas = useMemo(() => paginasMuestra(), []);

  useEffect(() => {
    fetch(`${API_URL}/api/book/config?region=${region()}`).then(r => r.json()).then(c => {
      if (c && c.labels) setPrecios(c.labels);
      if (c && c.currency) setMoneda(c.currency);
    }).catch(() => {});
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
    <div className="ll">
      <section className="ll-hero">
        <div className="ll-hero-texto">
          <p className="ll-kicker">ChatSalsa · Libro regalo</p>
          <h1>Vuestra historia, <em>en papel.</em></h1>
          <p className="ll-entradilla">Vuestro chat de WhatsApp convertido en un libro de verdad: los mejores días de la conversación, tal cual fueron, con vuestras fotos y los personajes de cada uno.</p>
          <div className="ll-acciones">
            <button className="ll-boton-cta" onClick={irASubir}>Crea tu libro gratis</button>
            <span>Lo ves entero antes de pagar · impreso {precios.libro}</span>
          </div>
        </div>
        <figure className="ll-hero-libro">
          <iframe title="Portada de un libro de ejemplo" srcDoc={paginas[0].html} tabIndex={-1} loading="lazy" />
          <figcaption>Portada de un libro de ejemplo, 20 × 20 cm</figcaption>
        </figure>
      </section>

      <p className="ll-ocasiones">Para un aniversario · San Valentín · un cumpleaños · una boda · Navidad · el Día de la Madre · una despedida · <em>o porque sí</em></p>

      <section className="ll-bloque">
        <header className="ll-cabecera"><span>01</span><h2>Así es por dentro</h2><p>Cuatro páginas de un libro de ejemplo, hechas con la misma plantilla que el tuyo. El chat es inventado.</p></header>
        <div className="ll-muestra">
          {paginas.map((p, i) => (
            <figure key={p.titulo}>
              <iframe title={`Página de ejemplo: ${p.titulo}`} srcDoc={p.html} tabIndex={-1} loading="lazy" />
              <figcaption><span>{String(i + 1).padStart(2, '0')}</span>{p.titulo}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="ll-bloque">
        <header className="ll-cabecera"><span>02</span><h2>Cómo funciona</h2></header>
        <ol className="ll-pasos">
          <li><b>Sube el chat</b><p>Expórtalo desde WhatsApp con archivos (para que salgan las fotos). Dos minutos.</p></li>
          <li><b>Edítalo a tu gusto</b><p>Te proponemos capítulos con los mejores días, enteros. Quita capítulos o mensajes sueltos y pon título, portada y dedicatoria.</p></li>
          <li><b>Recíbelo en casa</b><p>Tapa blanda, 20 × 20 cm, papel fotográfico. En pocos días, o el PDF al momento.</p></li>
        </ol>
      </section>

      <section className="ll-bloque">
        <header className="ll-cabecera"><span>03</span><h2>Precio</h2></header>
        <div className="ll-precios">
          <div><em>El libro impreso</em><b>{precios.libro}</b><p>Tapa blanda 20 × 20 cm · papel fotográfico · envío incluido · PDF incluido</p></div>
          <div><em>Solo el PDF</em><b>{precios.pdf}</b><p>Descarga inmediata, para leerlo ya o imprimirlo donde quieras</p></div>
        </div>
        {moneda === 'EUR' && COMPARATIVA.length > 0 && (
          <div className="ll-comparativa">
            <h3>¿Y en una tienda de fotolibros?</h3>
            <p>Un fotolibro parecido (tapa blanda, unos 21 × 21 cm, unas 60 páginas, un ejemplar) cuesta esto en otras tiendas. Y ahí tendrías que elegir, copiar y maquetar tú cada mensaje.</p>
            <table>
              <thead><tr><th>Tienda</th><th>Producto</th><th>Con envío</th></tr></thead>
              <tbody>
                {COMPARATIVA.map(c => (
                  <tr key={c.tienda}><td><a href={c.url} target="_blank" rel="noopener noreferrer">{c.tienda}</a></td><td>{c.producto}</td><td>{c.total}</td></tr>
                ))}
                <tr className="ll-nosotros"><td>ChatSalsa</td><td>Tapa blanda 20 × 20 cm, maquetado con tu chat</td><td>{precios.libro}</td></tr>
              </tbody>
            </table>
            <small>Precios públicos consultados el {FECHA_COMPARATIVA}. Pueden cambiar.</small>
          </div>
        )}
      </section>

      <section className="ll-subida" id="subir">
        <UploadBox onFileUpload={subir} titulo="Sube tu chat y mira tu libro gratis" subtitulo="Exporta el chat CON archivos (para que salgan las fotos) y sube el zip. No pagas nada hasta que lo veas entero y te guste." sinPrivacidad avisoMedios={<>📸 Para el libro, exporta <b>CON medios</b> si quieres incluir fotos.</>} />
        {cargando && <p className="ll-nota">Leyendo el chat…</p>}
        {error && <p className="ll-error">{error}</p>}
        <p className="ll-nota">El chat y las fotos se quedan en tu navegador. Para imprimir solo viaja el PDF, cifrado, y se borra al cabo de unos días.</p>
      </section>

      <section className="ll-bloque">
        <header className="ll-cabecera"><span>04</span><h2>Qué hay dentro</h2></header>
        <dl className="ll-incluye">
          <div><dt>Capítulos</dt><dd>Los días más intensos de la conversación, tal cual fueron, sin cortes.</dd></div>
          <div><dt>Vuestras fotos</dt><dd>Dentro de la conversación, donde las mandasteis.</dd></div>
          <div><dt>Los personajes</dt><dd>Quién es El Cómico, El Rollero, La Amorosa… según el análisis de ChatSalsa. Se puede quitar.</dd></div>
          <div><dt>En números</dt><dd>Mensajes, días, risas, corazones y vuestra hora punta.</dd></div>
          <div><dt>A tu gusto</dt><dd>Portada, título y dedicatoria.</dd></div>
        </dl>
      </section>

      <section className="ll-bloque">
        <header className="ll-cabecera"><span>05</span><h2>Preguntas</h2></header>
        <div className="ll-faq">
          <details><summary>¿Cómo exporto el chat con las fotos?</summary><p>En WhatsApp, abre el chat → menú → Más → Exportar chat → <b>Incluir archivos</b>. Te genera un zip; súbelo aquí tal cual. Los chats muy grandes pueden tardar en exportarse; si WhatsApp falla, exporta sin archivos y tendrás el libro sin fotos.</p></details>
          <details><summary>¿Quién elige lo que sale?</summary><p>Las reglas eligen los días más intensos; dentro de cada capítulo va la conversación entera de esos días, sin cortes. Tú quitas capítulos o mensajes sueltos antes de pedir. No usamos IA para decidir ni para escribir nada.</p></details>
          <details><summary>¿Y los vídeos y audios?</summary><p>En esta versión no van en el libro. Estamos preparando códigos QR para verlos desde el papel.</p></details>
          <details><summary>¿Guardáis mi chat?</summary><p>No. Todo se procesa en tu navegador. Solo el PDF final se guarda cifrado, unos días, para imprimirlo o descargarlo, y luego se borra.</p></details>
          <details><summary>¿A dónde enviáis?</summary><p>España, México, Estados Unidos, Colombia, Argentina, Perú y varios países de Europa. En Venezuela y otros, el PDF.</p></details>
        </div>
      </section>

      <section className="ll-final">
        <p>El regalo que nadie más puede hacer.</p>
        <button className="ll-boton-cta" onClick={irASubir}>Crea tu libro gratis</button>
      </section>
    </div>
  );
}
