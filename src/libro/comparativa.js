// Precios públicos de fotolibros parecidos en otras tiendas (solo España, en euros), para la landing del libro.
// Solo fotolibros comparables (tapa blanda, ~21 × 21 cm, unas 60 páginas, 1 ejemplar) con precio Y envío vistos
// en la web de cada tienda, sin cupones. Si un precio cambia, actualízalo aquí y la fecha.
// Fuera a propósito: Saal Digital (no muestra el envío), Fotoprix (no muestra el precio por página extra) y
// Lulu (imprenta bajo demanda en papel estucado, no un fotolibro, y sin IVA).
export const FECHA_COMPARATIVA = '16 de noviembre de 2026';
export const COMPARATIVA = [
  {
    tienda: 'CEWE',
    producto: 'Álbum cuadrado, tapa blanda, 62 páginas',
    total: '55,90 €',
    url: 'https://www.cewe.es/servicios/lista-de-precios-album-digital-cewe.html',
  },
  {
    tienda: 'Hofmann',
    producto: 'Álbum cuadrado grande 21 × 21, tapa blanda, 60 páginas (su máximo)',
    total: '65,56 €',
    url: 'https://www.hofmann.es/album-de-fotos/square-l-softcover',
  },
];
