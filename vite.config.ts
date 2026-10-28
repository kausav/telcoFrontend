import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(({ command }) => {
  return {
    // Where the app is served from. This deployment sits behind a shared load balancer that gives it only /source and /source/*, so
    // a production build defaults to '/source/' (the page's file addresses are written into index.html at build time). The dev server
    // stays at '/'. Override with VITE_BASE_PATH, e.g. VITE_BASE_PATH=/ for an app served from the root of its own address.
    base: process.env.VITE_BASE_PATH || (command === 'build' ? '/source/' : '/'),
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});