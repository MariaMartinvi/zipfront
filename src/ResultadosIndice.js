// Índice fijo de la página de resultados: salta a cada sección y marca en cuál estás.
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './ResumenWrapped.css';

export const SECCIONES = ['resumen', 'perfiles', 'momentos', 'psicologico', 'libro', 'graficos'];

export default function ResultadosIndice() {
  const { t } = useTranslation();
  const [presentes, setPresentes] = useState([]);
  const [activa, setActiva] = useState('resumen');

  useEffect(() => {
    // Las secciones van apareciendo según carga el análisis: se revisa cuáles hay y cuál está en pantalla
    const revisar = () => {
      const hay = SECCIONES.filter((s) => document.querySelector(`[data-ri="${s}"]`));
      setPresentes((p) => (p.join() === hay.join() ? p : hay));
      const limite = window.innerHeight * 0.4;
      let actual = hay[0];
      hay.forEach((s) => { if (document.querySelector(`[data-ri="${s}"]`).getBoundingClientRect().top < limite) actual = s; });
      if (actual) setActiva(actual);
    };
    revisar();
    const reloj = setInterval(revisar, 1500);
    window.addEventListener('scroll', revisar, { passive: true });
    return () => { clearInterval(reloj); window.removeEventListener('scroll', revisar); };
  }, []);

  if (presentes.length < 2) return null;
  return (
    <nav className="ri" aria-label={t('results_nav.label')}>
      {presentes.map((s) => (
        <button key={s} type="button" className={`ri-btn ${s === activa ? 'on' : ''}`}
          onClick={() => document.querySelector(`[data-ri="${s}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
          {t(`results_nav.${s}`)}
        </button>
      ))}
    </nav>
  );
}
