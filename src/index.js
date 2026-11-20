import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from './AuthContext';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import reportWebVitals from './reportWebVitals';
// Importar i18n
import i18n from './i18n';

const root = ReactDOM.createRoot(document.getElementById('root'));
// Montar con las traducciones ya cargadas: hasta entonces sigue en pantalla la portada que viene en el
// HTML (scripts/shell.js) en vez de pasar por una pantalla en blanco.
const montar = () => root.render(
  <React.StrictMode>
    <Suspense fallback="">
      <AuthProvider>
        <App />
      </AuthProvider>
    </Suspense>
  </React.StrictMode>
);
if (i18n.isInitialized) montar(); else i18n.on('initialized', montar);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. This comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
serviceWorkerRegistration.register();

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();