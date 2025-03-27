module.exports = {
  globDirectory: "build/",
  globPatterns: [
    "**/*.{html,js,css,png,jpg,jpeg,gif,svg,ico,json}"
  ],
  swDest: "build/service-worker.js",
  swSrc: "public/service-worker.js",
  // Use dontCacheBustURLsMatching instead of ignoreURLParametersMatching
  dontCacheBustURLsMatching: /\.[0-9a-f]{8}\./,
  // Los parámetros runtimeCaching no son válidos en injectManifest
  // Se deben definir directamente en el archivo service-worker.js
  // Eliminar la sección runtimeCaching por completo
};