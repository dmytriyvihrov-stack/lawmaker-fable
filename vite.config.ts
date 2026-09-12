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

/**
 * And the other thing the page says about itself: whether it is the build a
 * stranger opens.
 *
 * `vite build --mode player` writes `<meta name="lawmaker-player">` into the
 * head, and `PLAYER_BUILD` in `App.tsx` reads the same mode and leaves the dev
 * switch, the strip behind it and the chapter doors out of the bundle. The tag
 * is there so a packing script can read the finished page back and refuse one
 * that still has the switch in it, instead of trusting that the right command
 * was run. A meta tag and not a `define`, for the reason above.
 */
export default defineConfig(({ mode }) => {
  const player = mode === 'player';
  const tags =
    `$1\n    <meta name="lawmaker-build" content="${BUILD_ID}">` +
    (player ? `\n    <meta name="lawmaker-player" content="1">` : '');
  return {
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
            html.replace(/(<meta charset=[^>]*>)/i, tags),
        },
      },
    ],
    base: './',
    cacheDir: '.vite-cache',
  };
});
