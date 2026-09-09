import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname, basename } from 'node:path';

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
 * The build number, lifted out of the page vite just wrote rather than out of
 * the script. It is in the page and not in the bundle on purpose: a timestamp
 * inside a hashed chunk means an unchanged source tree builds a different file
 * every time. See the note in `vite.config.ts`.
 */
const built = readFileSync(join(here, 'dist', 'index.html'), 'utf8');
const buildTag = (built.match(/<meta name="lawmaker-build"[^>]*>/) ?? [''])[0];

/**
 * Any recorded music. `assets/music/*.mp3`, each one sewn in as a base64
 * data URI, keyed by its filename without the extension. There are no sound
 * files in `src/` and no network request in the finished page either way:
 * `music.ts` looks for `window.__lawmakerMusic` at the moment somebody asks
 * for music, and plays the synthesised pad instead when it finds nothing,
 * which is every dev server run and every build with an empty folder. See
 * `AUDIO.md` for how a track gets made and what it has to sound like.
 */
const musicDir = join(here, 'assets', 'music');
const musicFiles = existsSync(musicDir)
  ? readdirSync(musicDir).filter((f) => extname(f).toLowerCase() === '.mp3')
  : [];
const music = {};
for (const file of musicFiles) {
  const key = basename(file, extname(file));
  const bytes = readFileSync(join(musicDir, file));
  music[key] = `data:audio/mpeg;base64,${bytes.toString('base64')}`;
}
/* The closing tag is the one string a data URI could contain by accident
   that would end the script early. JSON never writes it, so escaping the
   slash is enough. */
const musicScript = musicFiles.length
  ? `<script>window.__lawmakerMusic = ${JSON.stringify(music).replace(/<\//g, '<\\/')};</script>\n`
  : '';

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
${buildTag}
<title>Lawmaker Fable</title>
<style>
${css}
/* the artifact frame paints its own ground behind the page */
html, body { background: #14110d; color-scheme: dark; }
</style>
<div id="root"></div>
${musicScript}<script type="module">
${js}
</script>
`;

const out = join(here, 'lawmaker-fable.html');
writeFileSync(out, page, 'utf8');
const kb = page.length / 1024;
console.log(`${out}  ${kb.toFixed(0)} kB`);
if (musicFiles.length) {
  console.log(`  music: ${musicFiles.map((f) => basename(f, extname(f))).join(', ')}`);
}
if (kb > 12 * 1024) {
  console.log(`  WARNING: the page is over 12 MB (${(kb / 1024).toFixed(1)} MB). A cold open from`);
  console.log('  file:/// holds the whole thing in memory before the first frame. See AUDIO.md.');
}
