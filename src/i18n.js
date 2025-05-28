import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

// Obtener el idioma guardado en localStorage o usar español como fallback
// const savedLanguage = localStorage.getItem('i18nextLng') || 'es'; // Se maneja mejor por LanguageDetector

i18n
  // Cargar traducciones usando http
  .use(Backend)
  // Detectar idioma automáticamente
  .use(LanguageDetector)
  // Inicializar react-i18next
  .use(initReactI18next)
  // Inicializar i18next
  .init({
    supportedLngs: ['it', 'es', 'fr', 'de', 'pt', 'en'], // Definir todos los idiomas soportados
    fallbackLng: 'es',
    // lng: savedLanguage, // LanguageDetector se encargará de esto y de la persistencia
    debug: true, // Activar debug para ver logs en la consola
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
      order: ['localStorage', 'navigator', 'htmlTag'], // Añadir htmlTag como opción
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
      // checkWhitelist: true // Esta opción está obsoleta, se usa supportedLngs
    }
  });

// Asegurar que el idioma se guarde en localStorage cuando cambie
// i18n.on('languageChanged', (lng) => { // LanguageDetector ya lo hace si se configura caches: ['localStorage']
//   localStorage.setItem('i18nextLng', lng);
// });

export default i18n; 