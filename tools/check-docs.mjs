// The pages' own validator. Run from the repo root: node tools/check-docs.mjs
// Fails on a long dash in any page, and on a root page that names a document
// which does not exist. With --strict it also fails on a live page over its
// size cap. Prints every page's size either way.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const strict = process.argv.includes('--strict');
const CAPS = { 'CLAUDE.md': 4000, 'DESK.md': 4000, 'AGENTS.md': 18000, 'README.md': 6000, 'PROGRESS.md': 72000 };

const md = (dir) => (existsSync(join(root, dir)) ? readdirSync(join(root, dir)).filter((f) => f.endsWith('.md')).map((f) => (dir === '.' ? f : `${dir}/${f}`)) : []);
const pages = [...md('.'), ...md('history'), 'tools/README.md', 'tests/README.md'].filter((f) => existsSync(join(root, f)));

let failed = 0;
const fail = (msg) => { failed++; console.log(`FAIL  ${msg}`); };

for (const page of pages) {
  const text = readFileSync(join(root, page), 'utf8');
  text.split('\n').forEach((line, i) => {
    if (/[\u2013\u2014]/.test(line)) fail(`${page}:${i + 1} long dash`);
  });
  // A spec names pages it is asking for, so its references are not checked.
  if (!page.startsWith('history/') && !/^SPEC-/.test(page)) {
    for (const m of text.matchAll(/`((?:[A-Za-z0-9_.-]+\/)?[A-Za-z0-9_.-]+\.md)`/g)) {
      if (!existsSync(join(root, m[1]))) fail(`${page} names ${m[1]}, which does not exist`);
    }
  }
  const size = statSync(join(root, page)).size;
  const over = CAPS[page] && size > CAPS[page] ? `over its cap of ${CAPS[page]}` : '';
  console.log(`${String(size).padStart(7)}  ${page}${over ? '  ' + over : ''}`);
  if (over && strict) fail(`${page} is ${over}`);
}
console.log(failed ? `\n${failed} problem(s)` : '\nall pages fine');
process.exit(failed ? 1 : 0);
