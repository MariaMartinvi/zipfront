# Blog ChatSalsa (Astro)

Blog estático integrado en el mismo dominio que la web principal (ChatSalsa). Contenido en Markdown/MDX, sin backend ni base de datos.

## Rutas

- **ES:** `https://chatsalsa.com/blog` (listado) y `https://chatsalsa.com/blog/<slug>/` (post)
- **EN:** `https://chatsalsa.com/en/blog` (listado) y `https://chatsalsa.com/en/blog/<slug>/` (post)

## Estructura del contenido

- **Español:** `src/content/blog/es/*.mdx`
- **Inglés:** `src/content/blog/en/*.mdx`

Frontmatter mínimo por post:

```yaml
title: "Título"
description: "Descripción corta"
date: 2025-03-01
draft: false   # opcional
image: "/ruta/imagen.jpg"   # opcional
```

## Desarrollo

```bash
# Instalar dependencias (desde la raíz del repo)
cd blog && npm install

# Servidor de desarrollo (solo blog)
npm run dev
```

Abre `http://localhost:4321/blog` y `http://localhost:4321/en/blog` para ver listado y posts.

## Build

```bash
# Solo el blog
cd blog && npm run build
```

Salida en `blog/dist/`. Para generar la carpeta unificada para Render (CRA + blog), desde la **raíz del repo**:

```bash
npm run build:site
```

Esto genera `site-dist/` con:

- Contenido de `build/` (Create React App)
- `blog/` con el listado y posts en español
- `en/blog/` con el listado y posts en inglés

En **Render** (Static Site), configura el **Publish Directory** como `site-dist`.

## Añadir un post

1. Crea un `.mdx` en `src/content/blog/es/` o `src/content/blog/en/`.
2. Añade el frontmatter (`title`, `description`, `date`; opcional: `draft`, `image`).
3. Escribe el cuerpo en Markdown/MDX.
4. Vuelve a hacer build; el post aparecerá en el listado (si no es `draft`).
