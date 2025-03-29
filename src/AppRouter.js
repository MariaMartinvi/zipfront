import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import ShareConfirmation from './ShareConfirmation';

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/share" element={<ShareConfirmation />} />
        {/* Añadir una ruta comodín para debugging */}
        <Route path="*" element={<div>Ruta no encontrada. URL: {window.location.href}</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;