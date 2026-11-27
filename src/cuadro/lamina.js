// La lámina se dibuja y se descarga EN EL NAVEGADOR (Maria, 27-11-2026): las frases elegidas y los nombres
// no pasan por nuestro servidor ni un instante, y no se guarda nada. Antes la generaba el servidor.
// Se pinta el mismo HTML de la vista previa, a 3000 px de ancho, y se mete en un PDF del tamaño pedido.
import { htmlCuadro, FORMATOS, PLANTILLAS, urlFuentes } from './render';

export const ANCHO_PX = 3000;                       // 3000 × 4243 px: cabe en el límite de lienzo de un iPhone
const ALTO_PX = Math.round(ANCHO_PX * 1.4142);
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Espera a que el documento tenga cargadas las letras del estilo. No basta con `fonts.ready`: se resuelve
 * antes de que llegue la hoja de Google Fonts y el cuadro saldría con una letra de sustitución.
 */
async function cargarLetras(doc, letras, muestra) {
  for (let i = 0; i < 60; i += 1) { // hasta 6 s a que la hoja de las fuentes esté lista
    const hojas = [...doc.querySelectorAll('link[rel="stylesheet"][href*="fonts.googleapis"]')];
    if (hojas.every((l) => l.sheet)) break;
    await espera(100);
  }
  const texto = muestra || (doc.body && doc.body.innerText) || 'Aa';
  await Promise.race([Promise.all((letras || []).map((l) => doc.fonts.load(l, texto).catch(() => null))), espera(8000)]);
  if (doc.fonts.ready) await Promise.race([doc.fonts.ready, espera(3000)]);
}

/** Dibuja el cuadro en un lienzo de 3000 px de ancho. Todo ocurre en este dispositivo. */
export async function dibujarLamina(cuadro) {
  const { default: html2canvas } = await import('html2canvas');
  const marco = document.createElement('iframe');
  marco.setAttribute('aria-hidden', 'true');
  marco.style.cssText = `position:fixed;left:-99999px;top:0;width:${ANCHO_PX}px;height:${ALTO_PX}px;border:0;visibility:hidden`;
  marco.srcdoc = htmlCuadro(cuadro, { anchoPx: ANCHO_PX });
  document.body.appendChild(marco);
  try {
    await new Promise((ok, mal) => { marco.onload = ok; marco.onerror = mal; setTimeout(ok, 8000); });
    const doc = marco.contentDocument;
    const estilo = PLANTILLAS[cuadro.plantilla] || {};
    const letras = estilo.letras;
    await cargarLetras(doc, letras);
    // html2canvas pinta el texto en un lienzo de ESTA página: aquí también tienen que estar las letras
    if (estilo.fuentes && !document.querySelector(`link[data-cuadro="${cuadro.plantilla}"]`)) {
      const hoja = document.createElement('link');
      hoja.rel = 'stylesheet'; hoja.href = urlFuentes(estilo.fuentes); hoja.setAttribute('data-cuadro', cuadro.plantilla);
      document.head.appendChild(hoja);
    }
    await cargarLetras(document, letras, doc.body.innerText);
    // el cuadro reajusta el tamaño de la letra cuando llegan las fuentes y avisa con data-listo
    for (let i = 0; i < 40 && doc.documentElement.getAttribute('data-listo') !== '1'; i += 1) await espera(100);
    await espera(400);
    marco.style.visibility = 'visible';
    return await html2canvas(doc.querySelector('.cuadro'), {
      scale: 1, width: ANCHO_PX, height: ALTO_PX, windowWidth: ANCHO_PX, windowHeight: ALTO_PX, useCORS: true, logging: false, backgroundColor: '#ffffff',
      onclone: (copia) => cargarLetras(copia, letras), // la copia que pinta html2canvas también tiene que tenerlas
    });
  } finally {
    marco.remove();
  }
}

/** Dibuja la lámina y la descarga como archivo para imprimir en A4 o A3. */
export async function descargarLamina(cuadro, formato = 'A4', nombre = 'lamina-chatsalsa') {
  const lienzo = await dibujarLamina(cuadro);
  const { jsPDF } = await import('jspdf');
  const { w, h } = FORMATOS[formato] || FORMATOS.A4;
  const pdf = new jsPDF({ unit: 'mm', format: [w, h], orientation: 'portrait', compress: true });
  pdf.addImage(lienzo.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, w, h, undefined, 'FAST');
  pdf.save(`${nombre}-${formato}.pdf`);
}
