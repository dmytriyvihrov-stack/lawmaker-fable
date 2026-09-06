/**
 * Loads the game content straight out of the TypeScript sources, without a
 * build step. Every source is parsed once; the console reads the values and
 * writes single values back through tools/lib/patch.mjs.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseModule, toValue } from './parse.mjs';

/** key -> { path, roots } . The key is what the browser sends back on a patch. */
export const SOURCES = {
  config: { path: 'src/engine/config.ts', roots: ['CONFIG'] },
  proposals: { path: 'src/content/proposals.ts', roots: ['PROPOSALS'] },
  cases: { path: 'src/content/cases.ts', roots: ['CASES', 'IVA_MET'] },
  aftermaths: { path: 'src/content/aftermaths.ts', roots: ['AFTERMATHS'] },
  loops: { path: 'src/content/loops.ts', roots: ['LOOPS'] },
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
  return { spec, full, src: readFileSync(full, 'utf8') };
}

/** Parses every source and evaluates the roots the console needs. */
export function loadContent(root) {
  const parsed = {};
  for (const key of Object.keys(SOURCES)) {
    const { spec, src } = readSource(root, key);
    parsed[key] = { path: spec.path, src, decls: parseModule(src, spec.path) };
  }

  const env = {};
  const config = valueOf(parsed, 'config', 'CONFIG', env);
  env.CONFIG = config;

  const data = {
    config,
    proposals: valueOf(parsed, 'proposals', 'PROPOSALS', env),
    cases: valueOf(parsed, 'cases', 'CASES', localEnv(parsed, 'cases', env)),
    aftermaths: valueOf(parsed, 'aftermaths', 'AFTERMATHS', env),
    loops: valueOf(parsed, 'loops', 'LOOPS', env),
    monarchs: valueOf(parsed, 'monarchs', 'MONARCHS', env),
    readings: valueOf(parsed, 'readings', 'READINGS', env),
    meta: {
      subjects: valueOf(parsed, 'meta', 'SUBJECTS', env),
      actions: valueOf(parsed, 'meta', 'ACTIONS', env),
      advisors: valueOf(parsed, 'meta', 'ADVISORS', env),
      characters: valueOf(parsed, 'meta', 'CHARACTERS', env),
      stats: valueOf(parsed, 'meta', 'STATS', env),
      cityLabels: valueOf(parsed, 'meta', 'CITY_LABELS', env),
    },
    lawWords: {
      subjectWords: valueOf(parsed, 'lawWords', 'SUBJECT_WORDS', env),
      predicateWords: valueOf(parsed, 'lawWords', 'PREDICATE_WORDS', env),
      predicateOverrides: valueOf(parsed, 'lawWords', 'PREDICATE_OVERRIDES', env),
      flourishes: valueOf(parsed, 'lawWords', 'FLOURISHES', env),
    },
    verdicts: {
      verbs: valueOf(parsed, 'verdicts', 'VERDICT_VERBS', env),
      objects: valueOf(parsed, 'verdicts', 'VERDICT_OBJECTS', env),
      cases: valueOf(parsed, 'verdicts', 'CASE_VERDICTS', env),
    },
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

function valueOf(parsed, key, rootName, env) {
  const node = parsed[key].decls.get(rootName);
  if (!node) throw new Error('missing ' + rootName + ' in ' + parsed[key].path);
  return toValue(node, env);
}
