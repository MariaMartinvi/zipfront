// Landing de "Tu chat en un libro" (/libro-recuerdo), estilo editorial: explica el producto, enseña 4 páginas
// reales de muestra, precios por región y una comparación con lo que cuesta un fotolibro en otras tiendas.
// Tiene su propia caja de subida que lleva directamente al editor (/libro), sin pasar por el análisis.
// El zip se lee en el navegador: ni el chat ni las fotos salen de aquí.
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { detectPlatform } from '../WhatsappInstructions';
import { libroStore } from './store';
import { librosEjemplo } from './muestra';
import LibroAbierto from './LibroAbierto';
import { COMPARATIVA, FECHA_COMPARATIVA } from './comparativa';
import { cargarPreciosLibro, puedeImprimir, PRECIOS_LIBRO_DEFECTO, PAISES_IMPRESION_DEFECTO } from './precioLibro';
import './LibroLanding.css';

const irASubir = () => document.getElementById('subir')?.scrollIntoView({ behavior: 'smooth' });

// Cómo exportar CON fotos (el componente de subida de la portada explica exportar sin medios, para el análisis)
const EXPORTAR = {
  android: { nombre: 'Android', pasos: ['Abre el chat en WhatsApp y toca ⋮ → Más → Exportar chat.', 'Elige Incluir archivos.', 'Guárdalo en Archivos o en Drive y súbelo aquí.'] },
  ios: { nombre: 'iPhone', pasos: ['Abre el chat y toca el nombre de arriba.', 'Baja hasta Exportar chat y elige Adjuntar archivos.', 'Guárdalo en Archivos y súbelo aquí.'] },
  desktop: { nombre: 'Ordenador', pasos: ['WhatsApp de escritorio no exporta chats: hazlo en el móvil, con archivos.', 'Envíate el zip por email o Drive.', 'Descárgalo y arrástralo aquí.'] },
};

export default function LibroLanding() {
  const navigate = useNavigate();
  const [precios, setPrecios] = useState(PRECIOS_LIBRO_DEFECTO);
  const [moneda, setMoneda] = useState('EUR');
  const [tramos, setTramos] = useState(null);
  const [paises, setPaises] = useState(PAISES_IMPRESION_DEFECTO);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [plataforma, setPlataforma] = useState(detectPlatform);
  const [arrastrando, setArrastrando] = useState(false);
  const libros = useMemo(() => librosEjemplo(), []);
  const [abierto, setAbierto] = useState(null);  // índice del libro de ejemplo abierto

  useEffect(() => {
    cargarPreciosLibro().then(({ labels, currency, tramos: t, paises: p }) => { setPrecios(labels); setMoneda(currency); setTramos(t); setPaises(p); });
    window.scrollTo(0, 0);
  }, []);

  const imprime = puedeImprimir(paises);  // fuera de los países donde imprime Gelato, solo el PDF

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
            <span>Lo ves entero antes de pagar · PDF {precios.pdf}{imprime && <> · impreso desde {precios.libro}</>}</span>
          </div>
        </div>
        <figure className="ll-hero-libro">
          <div className={`ll-libros ${abierto !== null ? 'con-abierto' : ''}`}>
            {libros.map((l, n) => (
              <button type="button" key={l.titulo} className={`ll-libro3d l${n + 1}`} onClick={() => setAbierto(n)} aria-label={`Abrir el libro de ejemplo ${l.titulo}`}>
                <span className="ll-libro3d-tapa">
                  <iframe title={`Libro de ejemplo: ${l.titulo}`} srcDoc={l.portada} tabIndex={-1} loading="lazy" />
                </span>
                <span className="ll-libro3d-canto" />
              </button>
            ))}
            {abierto !== null && <LibroAbierto key={abierto} libro={libros[abierto]} onCerrar={() => setAbierto(null)} />}
          </div>
          <figcaption>{abierto === null ? 'Pulsa un libro para abrirlo' : 'Chat inventado'} · tapa blanda 20 × 20 cm · papel fotográfico</figcaption>
        </figure>
      </section>

      <p className="ll-ocasiones">Para un aniversario · San Valentín · un cumpleaños · una boda · Navidad · el Día de la Madre · una despedida · <em>o porque sí</em></p>

      <section className="ll-bloque">
        <header className="ll-cabecera"><span>01</span><h2>Cómo funciona</h2></header>
        <ol className="ll-pasos">
          <li><b>Sube el chat</b><p>Expórtalo desde WhatsApp con archivos (para que salgan las fotos). Dos minutos.</p></li>
          <li><b>Edítalo a tu gusto</b><p>Te proponemos capítulos con los mejores días, enteros. Quita capítulos o mensajes sueltos y pon título, portada y dedicatoria.</p></li>
          <li><b>Recíbelo en casa</b><p>Tapa blanda, 20 × 20 cm, papel fotográfico. En pocos días, o el PDF al momento.</p></li>
        </ol>
      </section>

      <section className="ll-bloque">
        <header className="ll-cabecera"><span>02</span><h2>Precio</h2></header>
        <div className="ll-precios">
          <div><em>En PDF</em><b>{precios.pdf}</b><p>Descarga inmediata, para leerlo ya o imprimirlo donde quieras</p></div>
          {imprime ? <div><em>El libro impreso, desde</em><b>{precios.libro}</b><p>Tapa blanda 20 × 20 cm · papel fotográfico · envío incluido · PDF incluido</p>
            {tramos && <ul className="ll-tramos">{tramos.map(t => <li key={t.hasta}><span>Hasta {t.hasta} páginas</span><span>{t.label}</span></li>)}</ul>}</div>
            : <div><em>El libro impreso</em><p>Por ahora solo lo enviamos a España, Portugal, Francia, Italia, Alemania, Reino Unido y Estados Unidos. Desde tu país puedes descargarlo en PDF e imprimirlo donde quieras.</p></div>}
        </div>
        {imprime && moneda === 'EUR' && COMPARATIVA.length > 0 && (
          <div className="ll-comparativa">
            <h3>¿Y en una tienda de fotolibros?</h3>
            <p>Un fotolibro parecido (tapa blanda, unos 21 × 21 cm, unas 60 páginas, un ejemplar) cuesta esto en otras tiendas. Y ahí tendrías que elegir, copiar y maquetar tú cada mensaje.</p>
            <table>
              <thead><tr><th>Tienda</th><th>Producto</th><th>Con envío</th></tr></thead>
              <tbody>
                {COMPARATIVA.map(c => (
                  <tr key={c.tienda}><td><a href={c.url} target="_blank" rel="noopener noreferrer">{c.tienda}</a></td><td>{c.producto}</td><td>{c.total}</td></tr>
                ))}
                <tr className="ll-nosotros"><td>ChatSalsa</td><td>Tapa blanda 20 × 20 cm, hasta 60 páginas, maquetado con tu chat</td><td>{precios.libro}</td></tr>
              </tbody>
            </table>
            <small>Precios públicos consultados el {FECHA_COMPARATIVA}. Pueden cambiar.</small>
          </div>
        )}
      </section>

      <section className="ll-bloque" id="subir">
        <header className="ll-cabecera"><span>03</span><h2>Empieza</h2><p>Sube el chat y mira tu libro entero, gratis. No pagas nada hasta que te guste.</p></header>
        <div className="ll-subir">
          <div className="ll-exportar">
            <div className="ll-plataformas" role="tablist">
              {Object.entries(EXPORTAR).map(([p, { nombre }]) => (
                <button key={p} type="button" role="tab" aria-selected={plataforma === p} className={plataforma === p ? 'on' : ''} onClick={() => setPlataforma(p)}>{nombre}</button>
              ))}
            </div>
            <ol>{EXPORTAR[plataforma].pasos.map(p => <li key={p}>{p}</li>)}</ol>
            <p className="ll-nota">Con archivos, para que salgan las fotos. Los chats muy grandes tardan un poco en exportarse.</p>
          </div>
          <label className={`ll-soltar ${arrastrando ? 'arrastrando' : ''}`}
            onDragOver={e => { e.preventDefault(); setArrastrando(true); }} onDragLeave={() => setArrastrando(false)}
            onDrop={e => { e.preventDefault(); setArrastrando(false); subir({ target: { files: e.dataTransfer.files } }); }}>
            <input type="file" accept=".zip,application/zip" onChange={subir} />
            <b>{cargando ? 'Leyendo el chat…' : 'Suelta aquí el zip'}</b>
            <span className="ll-boton-cta">Elegir archivo</span>
            <small>El chat y las fotos se quedan en tu navegador. El PDF se descarga en tu dispositivo; si lo pides impreso, viaja cifrado a la imprenta y lo borramos en cuanto ella lo recibe.</small>
          </label>
        </div>
        {error && <p className="ll-error">{error}</p>}
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
          <details><summary>¿Y si WhatsApp no consigue exportar con archivos?</summary><p>Pasa con chats muy grandes. Exporta sin archivos y tendrás el libro sin fotos; puedes poner una foto tuya en la portada.</p></details>
          <details><summary>¿Quién elige lo que sale?</summary><p>Las reglas eligen los días más intensos; dentro de cada capítulo va la conversación entera de esos días, sin cortes. Tú quitas capítulos o mensajes sueltos antes de pedir. No usamos IA para decidir ni para escribir nada.</p></details>
          <details><summary>¿Y los vídeos y audios?</summary><p>En esta versión no van en el libro.</p></details>
          <details><summary>¿Guardáis mi chat?</summary><p>No. Todo se procesa en tu navegador. El libro se crea al pagar y se descarga en tu dispositivo. Si lo pides impreso, el PDF viaja cifrado a la imprenta y lo borramos en cuanto ella lo recibe.</p></details>
          <details><summary>¿A dónde enviáis?</summary><p>El libro impreso, a España, Portugal, Francia, Italia, Alemania, Reino Unido y Estados Unidos. Desde cualquier otro país, el PDF: lo descargas al momento y lo imprimes donde quieras.</p></details>
        </div>
      </section>

      <section className="ll-final">
        <p>El regalo que nadie más puede hacer.</p>
        <button className="ll-boton-cta" onClick={irASubir}>Crea tu libro gratis</button>
      </section>
    </div>
  );
}
