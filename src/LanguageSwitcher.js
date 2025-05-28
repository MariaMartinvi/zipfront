import React from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.css';

const LanguageSwitcher = () => {
  const { t, i18n } = useTranslation();
  
  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  // Lista de idiomas disponibles
  const languages = [
    { code: 'es', name: t('language.es') },
    { code: 'en', name: t('language.en') },
    { code: 'fr', name: t('language.fr') },
    { code: 'de', name: t('language.de') },
    { code: 'it', name: t('language.it') },
    { code: 'pt', name: t('language.pt') }
  ];

  return (
    <div className="language-switcher">
      <select 
        className="language-select"
        value={i18n.language}
        onChange={(e) => changeLanguage(e.target.value)}
        aria-label={t('language.select')}
      >
        {languages.map((lang) => (
          <option 
            key={lang.code} 
            value={lang.code}
          >
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSwitcher; 