import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://chatsalsa.com',
  base: '',
  integrations: [mdx()],
  output: 'static',
  // Ocultar la barra flotante de herramientas de Astro en desarrollo
  devToolbar: {
    enabled: false,
  },
});
