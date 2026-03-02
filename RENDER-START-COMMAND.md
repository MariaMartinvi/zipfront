# Importante: Start Command en Render

Para que el blog se vea bien (1 cabecera, 1 footer) y no 3 cabeceras, el servicio del front **debe** usar este **Start Command**:

```bash
npm run start:prod
```

Así se sirve la carpeta `site-dist` (CRA + blog estático). Si en su lugar está `npm start`, Render arranca el servidor de desarrollo de React y todas las rutas devuelven la misma app → se ven 3 cabeceras.

## Qué hacer en Render

1. Entra en el **dashboard** de Render.
2. Abre el servicio del **front** (el que tiene tu dominio, ej. zip-extractor-pwa o zip-extractor-fronend).
3. Ve a **Settings** (Configuración).
4. En **Start Command** pon exactamente: `npm run start:prod`
5. Guarda y haz **Manual Deploy** (o espera al siguiente deploy).

Comprueba que **Build Command** sea: `npm install --legacy-peer-deps && npm run build:site`  
y **Publish Directory** sea: `site-dist`.
