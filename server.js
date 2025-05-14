const express = require('express');
const path = require('path');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 3000;

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

// Proxy para peticiones a Hugging Face para evitar problemas de CORS
app.use('/hf-proxy', async (req, res) => {
  try {
    // Obtener la URL objetivo de los parámetros
    const targetUrl = req.query.url;
    
    if (!targetUrl || !targetUrl.includes('huggingface.co')) {
      return res.status(400).json({ error: 'URL inválida o no permitida' });
    }
    
    console.log(`Proxy de Hugging Face solicitado para: ${targetUrl}`);
    
    // Realizar la petición a Hugging Face desde el servidor
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Accept': 'application/json, */*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    // Si la respuesta es un JSON, devolverla como tal
    if (response.headers.get('content-type')?.includes('application/json')) {
      const data = await response.json();
      return res.json(data);
    }
    
    // Para otros tipos de contenido, transmitir la respuesta
    response.body.pipe(res);
  } catch (error) {
    console.error('Error en el proxy de Hugging Face:', error);
    res.status(500).json({ error: 'Error al acceder al recurso solicitado' });
  }
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
  console.log(`Proxy de Hugging Face disponible en http://localhost:${PORT}/hf-proxy`);
});