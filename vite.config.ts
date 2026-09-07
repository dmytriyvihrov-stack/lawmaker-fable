import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * The build number, written into the page rather than into the script.
 *
 * It used to be a `define`, which put the timestamp inside the bundle and
 * therefore inside the bundle's content hash: three builds off an unchanged
 * source tree produced three different file names and three different files,
 * so every deploy committed a fresh 750 kB of identical minified JavaScript
 * and no build was ever reproducible. As a meta tag it does the same job -
 * a shared link can be checked against what is actually running - and the
 * script is byte for byte the same until the source changes.
 */
const BUILD_ID = new Date().toISOString().slice(0, 16).replace('T', ' ');

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'lawmaker-build-id',
      transformIndexHtml: {
        order: 'pre' as const,
        handler: (html: string) =>
        /* After the charset and not before it: the encoding declaration wants
           to be the first thing in the head, and a build number is not. */
          html.replace(
            /(<meta charset=[^>]*>)/i,
            `$1\n    <meta name="lawmaker-build" content="${BUILD_ID}">`,
          ),
      },
    },
  ],
  base: './',
  cacheDir: '.vite-cache',
});
