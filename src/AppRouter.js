import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import ShareConfirmation from './ShareConfirmation';
import './index.css';

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/share" element={<ShareConfirmation />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;