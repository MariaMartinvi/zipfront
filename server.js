const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware para establecer los encabezados correctos para habilitar la PWA
app.use((req, res, next) => {
  // Habilitar HTTPS
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // Para archivos JavaScript, asegurar el tipo MIME correcto
  if (req.path.endsWith('.js')) {
    res.setHeader('Content-Type', 'application/javascript');
  }
  
  next();
});

// Servir archivos estáticos desde la carpeta build
app.use(express.static(path.join(__dirname, 'build')));

// Manejar el resto de las rutas como la aplicación React
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});