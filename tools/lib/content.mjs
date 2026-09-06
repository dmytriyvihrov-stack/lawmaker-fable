/**
 * Loads the game content straight out of the TypeScript sources, without a
 * build step. Every source is parsed once; the console reads the values and
 * writes single values back through tools/lib/patch.mjs.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseModule, toValue } from './parse.mjs';

/** key -> { path, roots } . The key is what the browser sends back on a patch. */
export const SOURCES = {
  config: { path: 'src/engine/config.ts', roots: ['CONFIG'] },
  proposals: { path: 'src/content/proposals.ts', roots: ['PROPOSALS'] },
  cases: { path: 'src/content/cases.ts', roots: ['CASES', 'IVA_MET'] },
  aftermaths: { path: 'src/content/aftermaths.ts', roots: ['AFTERMATHS'] },
  /* The delayed consequences used to live in their own file. They are written
     into the cases themselves now, so the file is gone and this entry stays
     optional: the console draws no loops and everything else still opens. */
  loops: { path: 'src/content/loops.ts', roots: ['LOOPS'], optional: true },
  meta: {
    path: 'src/content/meta.ts',
    roots: ['SUBJECTS', 'ACTIONS', 'ADVISORS', 'CHARACTERS', 'STATS', 'CITY_LABELS'],
  },
  monarchs: { path: 'src/content/monarchs.ts', roots: ['MONARCHS'] },
  readings: { path: 'src/content/town-readings.ts', roots: ['READINGS'] },
  lawWords: {
    path: 'src/content/law-words.ts',
    roots: ['SUBJECT_WORDS', 'PREDICATE_WORDS', 'PREDICATE_OVERRIDES', 'FLOURISHES'],
  },
  verdicts: {
    path: 'src/content/verdict-words.ts',
    roots: ['VERDICT_VERBS', 'VERDICT_OBJECTS', 'CASE_VERDICTS'],
  },
};

export function readSource(root, key) {
  const spec = SOURCES[key];
  if (!spec) throw new Error('unknown source ' + key);
  const full = join(root, spec.path);
  if (spec.optional && !existsSync(full)) return { spec, full, src: null };
  return { spec, full, src: readFileSync(full, 'utf8') };
}

/** Parses every source and evaluates the roots the console needs. */
export function loadContent(root) {
  const parsed = {};
  for (const key of Object.keys(SOURCES)) {
    const { spec, src } = readSource(root, key);
    parsed[key] = {
      path: spec.path,
      src,
      missing: src === null,
      decls: src === null ? new Map() : parseModule(src, spec.path),
    };
  }

  const env = {};
  const missing = [];
  const config = valueOf(parsed, 'config', 'CONFIG', env, missing);
  env.CONFIG = config;

  const data = {
    config,
    proposals: valueOf(parsed, 'proposals', 'PROPOSALS', env, missing),
    cases: valueOf(parsed, 'cases', 'CASES', localEnv(parsed, 'cases', env), missing),
    aftermaths: valueOf(parsed, 'aftermaths', 'AFTERMATHS', env, missing),
    loops: valueOf(parsed, 'loops', 'LOOPS', env, missing),
    monarchs: valueOf(parsed, 'monarchs', 'MONARCHS', env, missing),
    readings: valueOf(parsed, 'readings', 'READINGS', env, missing),
    meta: {
      subjects: valueOf(parsed, 'meta', 'SUBJECTS', env, missing),
      actions: valueOf(parsed, 'meta', 'ACTIONS', env, missing),
      advisors: valueOf(parsed, 'meta', 'ADVISORS', env, missing),
      characters: valueOf(parsed, 'meta', 'CHARACTERS', env, missing),
      stats: valueOf(parsed, 'meta', 'STATS', env, missing),
      cityLabels: valueOf(parsed, 'meta', 'CITY_LABELS', env, missing),
    },
    lawWords: {
      subjectWords: valueOf(parsed, 'lawWords', 'SUBJECT_WORDS', env, missing),
      predicateWords: valueOf(parsed, 'lawWords', 'PREDICATE_WORDS', env, missing),
      predicateOverrides: valueOf(parsed, 'lawWords', 'PREDICATE_OVERRIDES', env, missing),
      flourishes: valueOf(parsed, 'lawWords', 'FLOURISHES', env, missing),
    },
    verdicts: {
      verbs: valueOf(parsed, 'verdicts', 'VERDICT_VERBS', env, missing),
      objects: valueOf(parsed, 'verdicts', 'VERDICT_OBJECTS', env, missing),
      cases: valueOf(parsed, 'verdicts', 'CASE_VERDICTS', env, missing),
    },
    /** What the console looked for and did not find. Drawn on the page. */
    missing,
    sources: Object.fromEntries(
      Object.entries(SOURCES).map(([k, v]) => [k, { path: v.path, roots: v.roots }]),
    ),
  };
  return data;
}

/** Module local consts, so cases.ts can resolve IVA_MET and friends. */
function localEnv(parsed, key, base) {
  const scope = { ...base };
  for (const [name, node] of parsed[key].decls) {
    if (name in scope) continue;
    try {
      scope[name] = toValue(node, scope);
    } catch {
      // a declaration the console does not need
    }
  }
  return scope;
}

/**
 * One declaration, evaluated.
 *
 * A source the game no longer has, or a name inside one it no longer exports,
 * reads as nothing rather than as a dead console. The content moves faster
 * than this tool does, and a page that opens with one table missing is worth
 * a great deal more than a page that does not open. What went missing is
 * collected in `missing` and said out loud on the page.
 */
function valueOf(parsed, key, rootName, env, missing) {
  if (parsed[key].missing) {
    if (missing) missing.push(parsed[key].path);
    return [];
  }
  const node = parsed[key].decls.get(rootName);
  if (!node) {
    if (missing) missing.push(rootName + ' in ' + parsed[key].path);
    return [];
  }
  return toValue(node, env);
}
