// "De qué habláis" y "Momentos memorables" del análisis IA: la IA las escribe como lista en markdown
// ("- 🏡 **Título** (febrero de 2026) – texto") y aquí se convierten en una rejilla de tarjetas.
const escapar = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const tarjeta = (linea) => {
  const m = linea.match(/^-\s*(.*?)\s*\*\*(.+?)\*\*\s*(?:\(([^)]+)\))?\s*[–—-]?\s*(.*)$/);
  if (!m) return null;
  const [, emoji, titulo, fecha, texto] = m;
  return `<div class="pk-tarjeta"><span class="pk-emoji">${escapar(emoji)}</span>`
    + `<b>${escapar(titulo)}</b>${fecha ? `<small>${escapar(fecha)}</small>` : ''}`
    + `${texto ? `<p>${escapar(texto)}</p>` : ''}</div>`;
};

export function seccionesPackEnTarjetas(md) {
  if (!md) return md;
  return md.replace(/^## (De qué habláis|Momentos memorables)[^\n]*\n([\s\S]*?)(?=\n---|\n## |(?![\s\S]))/gm, (todo, titulo, cuerpo) => {
    const tarjetas = cuerpo.split('\n').map((l) => l.trim()).filter((l) => l.startsWith('- ')).map(tarjeta).filter(Boolean);
    if (!tarjetas.length) return todo;
    return `## ${titulo}\n\n<div class="pk-rejilla">${tarjetas.join('')}</div>\n`;
  });
}
