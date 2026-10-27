// Barra fija inferior con el pack de IA. Solo se ve cuando el candado (targetRef) NO está en pantalla,
// para que el único producto de la portada esté siempre a un clic sin molestar cuando ya se ve.
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './UnlockBar.css';

export default function UnlockBar({ targetRef, price, onUnlock }) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = targetRef?.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setVisible(true); return; }
    const io = new IntersectionObserver(([e]) => setVisible(!e.isIntersecting), { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, [targetRef]);
  if (!visible) return null;
  const ir = () => { targetRef?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  return (
    <div className="unlock-bar" role="region" aria-label="Análisis con IA">
      <div className="unlock-bar-text">
        <b>{t('unlock_bar.title', '🧠 Análisis psicológico con IA')}</b>
        <span>{t('unlock_bar.subtitle', 'Quién manda, quién calla y qué dice el chat de cada uno')}</span>
      </div>
      <button className="unlock-bar-ghost" onClick={ir}>{t('unlock_bar.see', 'Ver qué incluye')}</button>
      <button className="unlock-bar-btn" onClick={onUnlock}>{t('unlock_bar.unlock', 'Desbloquear · {{price}}', { price })}</button>
    </div>
  );
}
