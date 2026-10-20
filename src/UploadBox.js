import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import WhatsappInstructions, { detectPlatform } from './WhatsappInstructions';
import InstallPWA from './InstallPWA';
import './UploadBox.css';

// Cajón de subida: en Android el chat se comparte desde WhatsApp; en iOS y PC se sube el .zip.
// Las instrucciones detalladas van plegadas debajo.
const UploadBox = ({ onFileUpload, skipIA, onSkipIAChange, showAnalysis, titulo, subtitulo, sinPrivacidad = false }) => {
  const { t } = useTranslation();
  const [platform, setPlatform] = useState(detectPlatform());
  const [arrastrando, setArrastrando] = useState(false);
  const inputRef = useRef(null);

  const soltar = (e) => {
    e.preventDefault();
    setArrastrando(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) onFileUpload({ target: { files: [file] } });
  };

  const inputArchivo = (
    <input
      ref={inputRef}
      type="file"
      className="file-upload-input"
      accept=".zip,application/zip,application/x-zip,application/x-zip-compressed,application/octet-stream,*/*"
      onChange={onFileUpload}
    />
  );

  return (
    <div className="upload-box">
      <h2 className="upload-box-title">
        {titulo || (showAnalysis ? t('app.upload.another') : t('app.upload.hero_title'))}
      </h2>
      <p className="upload-box-sub">{subtitulo || t('app.upload.hero_subtitle')}</p>

      <div className="upload-platforms" role="tablist">
        {['android', 'ios', 'desktop'].map((p) => (
          <button
            key={p}
            type="button"
            role="tab"
            aria-selected={platform === p}
            className={`upload-platform ${platform === p ? 'active' : ''}`}
            onClick={() => setPlatform(p)}
          >
            {t(`whatsapp.platforms.${p}`)}
          </button>
        ))}
      </div>

      {platform === 'android' ? (
        <div className="upload-card upload-card-android">
          <div className="upload-card-icon">💬</div>
          <h3>{t('app.upload.android_title')}</h3>
          <ol className="upload-android-steps">
            <li><strong>{t('whatsapp.simplified_steps.android.0.title')}.</strong> {t('whatsapp.simplified_steps.android.0.description')}</li>
            <li><strong>{t('whatsapp.simplified_steps.android.1.title')}</strong> {t('whatsapp.simplified_steps.android.1.description')}</li>
          </ol>
          <InstallPWA />
          <label className="upload-android-zip">
            {inputArchivo}
            <span>{t('app.upload.android_or_zip')}</span>
          </label>
        </div>
      ) : (
        <label
          className={`upload-card upload-dropzone ${arrastrando ? 'arrastrando' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setArrastrando(true); }}
          onDragLeave={() => setArrastrando(false)}
          onDrop={soltar}
        >
          {inputArchivo}
          <div className="upload-card-icon">📂</div>
          <h3>{t('app.upload.button')}</h3>
          <p>{t('app.upload.drop')}</p>
        </label>
      )}

      {!sinPrivacidad && (
        <label className="upload-privacy">
          <input type="checkbox" checked={skipIA} onChange={(e) => onSkipIAChange(e.target.checked)} />
          <span>{t('app.privacy.no_ai_analysis')}</span>
        </label>
      )}

      <details className="upload-help">
        <summary>{t('app.upload.how_export')}</summary>
        <WhatsappInstructions platform={platform} compact />
      </details>
    </div>
  );
};

export default UploadBox;
