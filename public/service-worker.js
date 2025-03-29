
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import AppRouter from './AppRouter';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>
);

// Si deseas medir el rendimiento en tu app, pasa una función
// para registrar resultados (por ejemplo: reportWebVitals(console.log))
// o enviar a un punto de análisis. Más información: https://bit.ly/CRA-vitals
reportWebVitals();

// Registrar el Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registrado correctamente:', registration.scope);
      })
      .catch(error => {
        console.error('Error al registrar el Service Worker:', error);
      });
  });
}