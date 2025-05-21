import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

// Obtener el idioma guardado en localStorage o usar español como fallback
const savedLanguage = localStorage.getItem('i18nextLng') || 'es';

i18n
  // Cargar traducciones usando http
  .use(Backend)
  // Detectar idioma automáticamente
  .use(LanguageDetector)
  // Inicializar react-i18next
  .use(initReactI18next)
  // Inicializar i18next
  .init({
    fallbackLng: 'es',
    lng: savedLanguage, // Usar el idioma guardado
    debug: false, // Desactivado en producción
    interpolation: {
      escapeValue: false, // No es necesario escapar los valores con React
    },
    // Backend configuración
    backend: {
      // Ruta a los archivos de traducción
      loadPath: '/locales/{{lng}}/translation.json',
    },
    // Opciones de detección
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
      checkWhitelist: true
    }
  });

// Asegurar que el idioma se guarde en localStorage cuando cambie
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('i18nextLng', lng);
});

export default i18n; 