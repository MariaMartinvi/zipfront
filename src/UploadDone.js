// Enlace discreto al final de los resultados para analizar otro chat
// (la caja de subida completa reaparece arriba al pulsarlo).
import React from 'react';
import { useTranslation } from 'react-i18next';
import './UploadDone.css';

export default function UploadDone({ onAnother }) {
  const { t } = useTranslation();
  return (
    <div className="upload-done">
      <button className="upload-done-btn" onClick={onAnother}>{t('app.upload.done_another', 'Subir otro chat')}</button>
    </div>
  );
}
