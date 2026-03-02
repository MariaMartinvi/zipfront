/**
 * En desarrollo: /api/* → backend en Render.
 * /blog y /en los sirve el CRA (rutas React); el contenido del blog se carga en iframe desde REACT_APP_BLOG_DEV_ORIGIN.
 */
const { createProxyMiddleware } = require('http-proxy-middleware');

const backendUrl = process.env.REACT_APP_API_URL || 'https://zipcd-backend-andand-gunicorn-app-app.onrender.com';

module.exports = function (app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: backendUrl,
      changeOrigin: true,
      secure: true,
    })
  );
};
