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

/**
 * The one tag this file cannot do without.
 *
 * Everything the chrome is made of is an emoji, and they go into this file as
 * raw UTF-8 bytes. With nothing saying so, the encoding is a guess: over http
 * with a `Content-Type` that carries no charset, a browser falls back to the
 * page's locale and every mark in the game turns to mojibake. It costs one
 * line and it is not a guess after it.
 */
const page = `<meta charset="utf-8">
<title>Lawmaker Fable</title>
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
