// Tarjeta compacta que sustituye a la caja de subida cuando ya hay un chat analizado:
// "¡Listo! Mira tu análisis a continuación · Subir otro chat". Lo mismo que hacen WhatsAnalyze y
// similares: la subida siempre arriba, y los resultados debajo.
import React from 'react';
import { useTranslation } from 'react-i18next';
import './UploadDone.css';

export default function UploadDone({ onAnother, onReport, reportLocked }) {
  const { t } = useTranslation();
  return (
    <div className="upload-done">
      <div className="upload-done-icon">✓</div>
      <div className="upload-done-text">
        <b>{t('app.upload.done_title', '¡Listo!')}</b>
        <span>{t('app.upload.done_text', 'Tu análisis está aquí abajo.')}</span>
      </div>
      {onReport && <button className="upload-done-btn upload-done-report" onClick={onReport} title={reportLocked ? t('app.upload.report_locked', 'Incluido en el pack de IA') : ''}>
        {reportLocked ? '🔒 ' : '⬇ '}{t('app.upload.report', 'Informe PDF')}
      </button>}
      <button className="upload-done-btn" onClick={onAnother}>{t('app.upload.done_another', 'Subir otro chat')}</button>
    </div>
  );
}
