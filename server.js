/**
 * Servidor de producción (Render): sirve site-dist (web React) y reenvía /blog/*
 * al blog gestionado por RankCoworker, que se ve en chatsalsa.com/blog.
 * Sustituye a `serve site-dist -s`: mismo comportamiento (SPA fallback) + proxy.
 */
const path = require("path");
const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");

const PORT = process.env.PORT || 10000;
const SITE_DIST = path.join(__dirname, "site-dist");
// Origen del blog (RankCoworker). La ruta /__pub/{host}/blog le dice bajo qué
// dominio público se sirve para que enlaces y canonical lleven chatsalsa.com/blog.
const BLOG_ORIGIN = process.env.BLOG_ORIGIN || "https://chatsalsa-5.rankcoworker.com";
const BLOG_PUBLIC_HOST = process.env.BLOG_PUBLIC_HOST || "chatsalsa.com";

const app = express();
app.disable("x-powered-by");

app.use(
  "/blog",
  createProxyMiddleware({
    target: BLOG_ORIGIN,
    changeOrigin: true,
    xfwd: false,
    pathRewrite: (p) => `/__pub/${BLOG_PUBLIC_HOST}/blog${p.replace(/\/+$/, "")}`,
  })
);

app.use(
  express.static(SITE_DIST, {
    extensions: ["html"],
    setHeaders(res, filePath) {
      if (filePath.endsWith("service-worker.js") || filePath.endsWith("index.html")) {
        res.setHeader("Cache-Control", "no-cache");
      }
    },
  })
);

// SPA fallback (equivale a `serve -s`).
app.get("*", (_req, res) => res.sendFile(path.join(SITE_DIST, "index.html")));

app.listen(PORT, () => console.log(`chatsalsa listening on ${PORT}`));
