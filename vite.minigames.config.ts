import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * The minigames prototype: the same game, built from its own entry into its
 * own folder, so `npm run bundle` and the file it makes are never touched.
 * Run with `npm run bundle:minigames`.
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
  cacheDir: '.vite-cache-minigames',
  build: {
    outDir: 'dist-minigames',
    rollupOptions: { input: 'minigames.html' },
  },
});
