import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// The dependency cache lives inside this build, not in the shared node_modules,
// so this variant and the main project can run side by side.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
  cacheDir: '.vite-cache',
  define: {
    // There is no git repo here to pull a hash from, so the build number is
    // the moment this config was read: once per `vite build`, once per `vite
    // dev` start. It exists so a shared link can be checked against what is
    // actually running, instead of trusted on faith.
    __BUILD_ID__: JSON.stringify(new Date().toISOString().slice(0, 16).replace('T', ' ')),
  },
});
