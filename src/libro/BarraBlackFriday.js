// Barra de Black Friday 2026 en toda la web (solo en castellano: el libro solo se vende en castellano).
// El código BLACK26 está en Stripe (cuenta ChatSalsa) y solo se puede usar en el pago del libro.
import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const FIN_BLACK_FRIDAY = 1796079600000; // 1-dic-2026 00:00 (Madrid)

export default function BarraBlackFriday() {
  const { i18n } = useTranslation();
  if (!(i18n.language || 'es').startsWith('es') || Date.now() >= FIN_BLACK_FRIDAY) return null;
  return (
    <Link to="/libro-recuerdo" className="barra-black-friday"
      style={{ display: 'block', background: '#0e1318', color: '#fff', textAlign: 'center', padding: '8px 14px', fontSize: '.9rem', fontWeight: 600, textDecoration: 'none' }}>
      🖤 Black Friday: 10 % de descuento en el libro de vuestro chat con el código BLACK26 · hasta el lunes 30
    </Link>
  );
}
