import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

/**
 * Sews the built game into one HTML file with nothing outside it: the whole
 * reign, its stylesheet and its bundle, in a single document that can be
 * dropped anywhere. Run after `vite build`.
 */
const here = dirname(fileURLToPath(import.meta.url));
const assets = join(here, 'dist', 'assets');
const files = readdirSync(assets);

const css = readFileSync(join(assets, files.find((f) => f.endsWith('.css'))), 'utf8');
const js = readFileSync(join(assets, files.find((f) => f.endsWith('.js'))), 'utf8');

const page = `<title>Lawmaker Fable</title>
<style>
${css}
/* the artifact frame paints its own ground behind the page */
html, body { background: #14110d; color-scheme: dark; }
</style>
<div id="root"></div>
<script type="module">
${js}
</script>
`;

const out = join(here, 'lawmaker-fable.html');
writeFileSync(out, page, 'utf8');
console.log(`${out}  ${(page.length / 1024).toFixed(0)} kB`);
