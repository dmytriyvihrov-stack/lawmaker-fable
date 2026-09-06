import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

/**
 * Sews the minigames prototype into one HTML file, the way bundle.mjs does
 * for the game. Run after `vite build --config vite.minigames.config.ts`.
 */
const here = dirname(fileURLToPath(import.meta.url));
const assets = join(here, 'dist-minigames', 'assets');
const files = readdirSync(assets);

const css = readFileSync(join(assets, files.find((f) => f.endsWith('.css'))), 'utf8');
const js = readFileSync(join(assets, files.find((f) => f.endsWith('.js'))), 'utf8');

const page = `<title>Lawmaker Fable, minigames</title>
<style>
${css}
html, body { background: #14110d; color-scheme: dark; }
</style>
<div id="root"></div>
<script type="module">
${js}
</script>
`;

const out = join(here, 'minigames-v1.html');
writeFileSync(out, page, 'utf8');
console.log(`${out}  ${(page.length / 1024).toFixed(0)} kB`);
