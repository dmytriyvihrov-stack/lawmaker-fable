/**
 * Prints the whole design console's reading, everything one JSON: every law,
 * every case in full, every year of work, the dependency tree between them
 * (the same graph the console's Tree tab draws), every number in the game
 * with what moves what (the Rates tab), and a played snapshot of the reign
 * simulator (the Reign tab, run once here rather than on demand: a static
 * page cannot spawn the engine on a click the way the console does).
 *
 *   npx vite-node tools/audit-console.ts > console.json
 *
 * Nothing here writes anything. It is a reading, not an edit.
 */
import { CASES } from '../src/content/cases';
import { PROPOSALS } from '../src/content/proposals';
import { WORKS } from '../src/content/works';
import { CONFIG } from '../src/engine/config';
import type {
  CaseChoice,
  CaseEvent,
  Condition,
  LawOption,
  Proposal,
  StatId,
  WorkId,
} from '../src/engine/types';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

/* ------------------------------------------------------------- conditions */

interface Need {
  kind: string;
  text: string;
  work?: string;
  caseId?: string;
  flag?: string;
}

function needs(cond: Condition | null, out: Need[] = [], no = false): Need[] {
  if (cond === null) return out;
  const not = (s: string): string => (no ? 'not ' + s : s);
  switch (cond.kind) {
    case 'always':
      break;
    case 'lawActive':
      out.push({ kind: 'law', text: not('a law on ' + (cond.subject ?? 'anything') + (cond.action ? ' / ' + cond.action : '') + ' stands') });
      break;
    case 'lawEver':
      out.push({ kind: 'law', text: not('a law on ' + (cond.subject ?? 'anything') + ' was ever sealed') });
      break;
    case 'built':
      out.push({ kind: 'work', work: cond.work, text: not('the ' + label(cond.work) + ' is built' + (cond.level && cond.level > 1 ? ' twice' : '')) });
      break;
    case 'stat':
      out.push({ kind: 'board', text: not(cond.stat + ' ' + (cond.op === 'lte' ? 'at or under ' : 'at or over ') + cond.value) });
      break;
    case 'souls':
      out.push({ kind: 'count', text: not((cond.op === 'lte' ? 'at most ' : 'at least ') + cond.value + ' souls') });
      break;
    case 'stage':
      out.push({ kind: 'stage', text: not('the place is a ' + cond.stage) });
      break;
    case 'flag':
      out.push({ kind: 'flag', flag: cond.flag, text: not('the reign carries ' + cond.flag) });
      break;
    case 'caseShown':
      out.push({ kind: 'scene', caseId: cond.caseId, text: not(titleOf(cond.caseId) + ' has happened') });
      break;
    case 'since':
      out.push({ kind: 'scene', caseId: cond.caseId, text: not(cond.years + ' years since ' + titleOf(cond.caseId)) });
      break;
    case 'turn':
      out.push({ kind: 'year', text: not('year ' + (cond.op === 'lte' ? 'at most ' : 'at least ') + cond.value) });
      break;
    case 'not':
      needs(cond.cond, out, !no);
      break;
    case 'all':
      for (const c of cond.conds) needs(c, out, no);
      break;
    case 'any': {
      const inner: Need[] = [];
      for (const c of cond.conds) needs(c, inner, no);
      out.push({ kind: 'either', text: inner.map((n) => n.text).join(', or ') });
      break;
    }
  }
  return out;
}

const SHORT: Record<string, string> = {
  house: 'house', woodcutter: "woodcutter's cabin", fields: 'cleared field', well: 'well',
  fence: 'fence and its gate', mine: 'cut in the crag', granary: 'granary',
  watch_house: 'watch house', long_room: 'long room', hall: 'hall', road: 'road',
  bridge: 'bridge', fair: 'fair', rest: 'year of rest',
};
const label = (id: WorkId): string => SHORT[id] ?? id;
const titleOf = (id: string): string => CASES.find((c) => c.id === id)?.title ?? id;

const band = (c: CaseEvent): string =>
  c.priority <= CONFIG.urgentPriority ? 'urgent' : c.priority >= CONFIG.year.warmFrom ? 'warm' : 'written';

/* ------------------------------------------------------------------ cases */

function choiceOut(ch: CaseChoice) {
  return {
    id: ch.id,
    text: ch.text,
    result: ch.result,
    tags: ch.tags,
    effects: ch.effects,
    souls: ch.souls ?? null,
    exceptionToLaw: ch.exceptionToLaw ?? null,
    beneficiary: ch.beneficiary ?? null,
    verdict: ch.verdict ?? null,
    setFlags: ch.setFlags ?? [],
    setIva: ch.setIva ?? null,
    schedule: ch.schedule ? { caseId: ch.schedule.caseId, caseTitle: titleOf(ch.schedule.caseId), inTurns: ch.schedule.inTurns } : null,
    enactLaw: ch.enactLaw ? { label: ch.enactLaw.label, subject: ch.enactLaw.subject, action: ch.enactLaw.action } : null,
    cityFlagsOn: ch.cityFlagsOn ?? [],
    cityFlagsOff: ch.cityFlagsOff ?? [],
    bond: ch.bond ?? null,
  };
}

/** A story flag connects two scenes as surely as a schedule does: one choice
 * sets it, another scene's trigger reads it. Built once, both directions. */
const flagSetters = new Map<string, { caseId: string; title: string; choiceText: string }[]>();
for (const c of CASES) {
  for (const ch of c.choices) {
    for (const f of ch.setFlags || []) {
      const list = flagSetters.get(f) ?? [];
      list.push({ caseId: c.id, title: c.title, choiceText: ch.text });
      flagSetters.set(f, list);
    }
  }
}
const flagReaders = new Map<string, { caseId: string; title: string }[]>();
for (const c of CASES) {
  for (const n of needs(c.trigger)) {
    if (n.kind !== 'flag' || !n.flag) continue;
    const list = flagReaders.get(n.flag) ?? [];
    list.push({ caseId: c.id, title: c.title });
    flagReaders.set(n.flag, list);
  }
}

const scenes = CASES.map((c) => {
  const after: { text: string; caseId?: string }[] = [];
  for (const other of CASES) {
    if (other.id === c.id) continue;
    for (const n of needs(other.trigger)) {
      if (n.caseId === c.id) after.push({ text: other.title, caseId: other.id });
    }
  }
  for (const ch of c.choices) {
    if (ch.schedule) {
      after.push({ text: titleOf(ch.schedule.caseId) + ', ' + ch.schedule.inTurns + ' years on', caseId: ch.schedule.caseId });
    }
    for (const f of ch.setFlags || []) {
      for (const reader of flagReaders.get(f) ?? []) {
        if (reader.caseId === c.id) continue;
        after.push({ text: reader.title + ', once ' + f + ' is set', caseId: reader.caseId });
      }
    }
  }
  const putHere: string[] = [];
  for (const other of CASES) {
    for (const ch of other.choices) {
      if (ch.schedule?.caseId === c.id) putHere.push(other.title);
    }
  }
  const cNeeds = needs(c.trigger);
  for (const n of cNeeds) {
    if (n.kind === 'flag' && n.flag) {
      const setters = flagSetters.get(n.flag) ?? [];
      if (setters.length) {
        n.text += ' (set by ' + setters.map((s) => s.title + ' / "' + s.choiceText + '"').join(', or ') + ')';
      }
    }
  }
  return {
    id: c.id,
    title: c.title,
    question: c.question ?? null,
    priority: c.priority,
    band: band(c),
    kind: c.trigger === null ? 'called' : 'waits',
    character: c.character ?? null,
    accused: c.accused ?? null,
    season: c.season ?? null,
    scene: c.scene,
    choices: c.choices.map(choiceOut),
    needs: cNeeds,
    putHere: [...new Set(putHere)],
    after: after.filter((a, i, list) => list.findIndex((x) => x.caseId === a.caseId) === i),
  };
});

/* -------------------------------------------------------------------- laws */

interface LawRow {
  key: string;
  id: string;
  origin: 'proposal' | 'decree';
  act: number | null;
  subject: string;
  action: string;
  label: string;
  option: LawOption;
  proposalId?: string;
  caseId?: string;
}

function lawOptions(): LawRow[] {
  const out: LawRow[] = [];
  for (const p of PROPOSALS) {
    p.options.forEach((o, oi) => {
      out.push({
        key: 'law:' + p.id + ':' + oi,
        id: o.subject + '_' + o.action,
        origin: 'proposal',
        act: p.act,
        subject: o.subject,
        action: o.action,
        label: o.label,
        option: o,
        proposalId: p.id,
      });
    });
  }
  for (const c of CASES) {
    c.choices.forEach((ch) => {
      if (!ch.enactLaw) return;
      out.push({
        key: 'decree:' + c.id + ':' + ch.id,
        id: ch.enactLaw.subject + '_' + ch.enactLaw.action,
        origin: 'decree',
        act: null,
        subject: ch.enactLaw.subject,
        action: ch.enactLaw.action,
        label: ch.enactLaw.label,
        option: ch.enactLaw,
        caseId: c.id,
      });
    });
  }
  return out;
}
const LAW_ROWS = lawOptions();

/**
 * Whether a trigger is satisfied by this law standing, walked off the real
 * condition tree rather than off the flattened words `needs()` prints: most
 * scenes gate on a subject alone ("a law on work stands", any action), and a
 * text search for "work / shared" never finds "a law on work stands", so a
 * naive match here leaves every "opens" list empty. `not` is read but a
 * negated match never counts as opening anything; that is a block.
 */
function triggerWantsLaw(cond: Condition | null, subject: string, action: string, negated = false): boolean {
  if (cond === null) return false;
  switch (cond.kind) {
    case 'lawActive':
    case 'lawEver':
      return !negated && (cond.subject === undefined || cond.subject === subject) && (cond.action === undefined || cond.action === action);
    case 'not':
      return triggerWantsLaw(cond.cond, subject, action, !negated);
    case 'all':
    case 'any':
      return cond.conds.some((c) => triggerWantsLaw(c, subject, action, negated));
    default:
      return false;
  }
}

function lawOptionOut(row: LawRow) {
  const opens = CASES.filter((c) => triggerWantsLaw(c.trigger, row.subject, row.action)).map((c) => ({ id: c.id, title: c.title }));
  return {
    key: row.key,
    label: row.option.label,
    subject: row.subject,
    action: row.action,
    tags: row.option.tags,
    effects: row.option.effects,
    perTurn: row.option.perTurn ?? null,
    perTurnTown: row.option.perTurnTown ?? null,
    perTurnWatch: row.option.perTurnWatch ?? null,
    isBadIdea: row.option.isBadIdea ?? false,
    cityFlagsOn: row.option.cityFlagsOn ?? [],
    cityFlagsOff: row.option.cityFlagsOff ?? [],
    origin: row.origin,
    caseId: row.caseId ?? null,
    caseTitle: row.caseId ? titleOf(row.caseId) : null,
    opens,
  };
}

const proposals = PROPOSALS.map((p) => ({
  id: p.id,
  act: p.act,
  advisor: p.advisor,
  title: p.title,
  needs: needs(p.unlockedBy ?? null),
  advice: p.advice ? { option: p.advice.option, line: p.advice.line } : null,
  problem: p.problem,
  options: p.options.map((_o, oi) => lawOptionOut(LAW_ROWS.find((r) => r.proposalId === p.id && r.key === 'law:' + p.id + ':' + oi)!)),
}));

const decrees = LAW_ROWS.filter((r) => r.origin === 'decree').map(lawOptionOut);

/* ------------------------------------------------------------------ works */

const works = WORKS.map((w) => ({
  id: w.id,
  name: w.name,
  line: w.line,
  stage: w.stage,
  cost: w.cost,
  townCost: w.townCost ?? null,
  maxLevel: w.maxLevel,
  needsWork: w.needsWork ? w.needsWork.id : null,
  needsBoard: w.needsBoard ?? null,
  needsLaw: w.needsLaw ?? null,
  trend: w.trend,
  opens: CASES.filter((c) => needs(c.trigger).some((n) => n.work === w.id)).map((c) => ({ id: c.id, title: c.title })),
}));

/* -------------------------------------------------------------------- tree */

interface Node {
  id: string;
  type: 'proposal' | 'law' | 'decree' | 'case' | 'work' | 'flag';
  label: string;
  sub: string;
  act: number;
}
interface Edge {
  from: string;
  to: string;
  kind: string;
  label: string;
}

const nodes = new Map<string, Node>();
const edges: Edge[] = [];
const addNode = (id: string, n: Node): void => {
  if (!nodes.has(id)) nodes.set(id, n);
};
const link = (from: string, to: string, kind: string, edgeLabel = ''): void => {
  if (!nodes.has(from) || !nodes.has(to)) return;
  edges.push({ from, to, kind, label: edgeLabel });
};

for (const p of PROPOSALS) {
  addNode('p:' + p.id, { id: 'p:' + p.id, type: 'proposal', label: p.title, sub: 'act ' + p.act + ' / ' + p.advisor, act: p.act });
}
for (const row of LAW_ROWS) {
  addNode('l:' + row.key, {
    id: 'l:' + row.key,
    type: row.origin === 'decree' ? 'decree' : 'law',
    label: row.option.label,
    sub: row.id + (row.option.isBadIdea ? ' / bad idea' : ''),
    act: row.act ?? 0,
  });
  if (row.origin === 'proposal' && row.proposalId) link('p:' + row.proposalId, 'l:' + row.key, 'option');
}
for (const c of CASES) {
  addNode('c:' + c.id, { id: 'c:' + c.id, type: 'case', label: c.title, sub: c.id + ' / p' + c.priority + (c.trigger === null ? ' / called' : ''), act: 0 });
}
for (const w of WORKS) {
  addNode('w:' + w.id, { id: 'w:' + w.id, type: 'work', label: w.name, sub: w.id + ' / ' + w.stage + ' / ' + w.cost + ' points', act: 0 });
}
const flagIds = new Set<string>();
for (const c of CASES) {
  for (const ch of c.choices) for (const f of ch.setFlags || []) flagIds.add(f);
}
for (const c of CASES) for (const n of needs(c.trigger)) if (n.kind === 'flag' && n.flag) flagIds.add(n.flag);
for (const f of flagIds) addNode('f:' + f, { id: 'f:' + f, type: 'flag', label: f, sub: 'story flag', act: 0 });

const lawMatches = (subject?: string, action?: string): LawRow[] =>
  LAW_ROWS.filter((r) => (subject === undefined || r.subject === subject) && (action === undefined || r.action === action));

// `needs()` above flattens a trigger into words, which is fine for a chip but
// loses the structure a link needs, so law, flag, case and work edges are
// drawn straight off the raw trigger tree instead.
function walkTrigger(cond: Condition | null, targetId: string, negated = false): void {
  if (cond === null) return;
  switch (cond.kind) {
    case 'lawActive':
    case 'lawEver':
      for (const row of lawMatches(cond.subject, cond.action)) {
        link('l:' + row.key, targetId, negated ? 'blocks' : 'unlocks', (cond.subject ?? 'any') + '/' + (cond.action ?? 'any'));
      }
      break;
    case 'flag':
      link('f:' + cond.flag, targetId, negated ? 'blocks' : 'unlocks');
      break;
    case 'caseShown':
    case 'since':
      link('c:' + cond.caseId, targetId, negated ? 'blocks' : 'unlocks');
      break;
    case 'built':
      link('w:' + cond.work, targetId, negated ? 'blocks' : 'needs');
      break;
    case 'not':
      walkTrigger(cond.cond, targetId, !negated);
      break;
    case 'all':
    case 'any':
      for (const c of cond.conds) walkTrigger(c, targetId, negated);
      break;
    default:
      break;
  }
}
for (const c of CASES) walkTrigger(c.trigger, 'c:' + c.id);
for (const p of PROPOSALS) walkTrigger(p.unlockedBy ?? null, 'p:' + p.id);

for (const c of CASES) {
  for (const ch of c.choices) {
    for (const f of ch.setFlags || []) link('c:' + c.id, 'f:' + f, 'sets', ch.text);
    if (ch.schedule) link('c:' + c.id, 'c:' + ch.schedule.caseId, 'schedules', '+' + ch.schedule.inTurns + ' turns');
    if (ch.enactLaw) {
      const row = LAW_ROWS.find((r) => r.origin === 'decree' && r.caseId === c.id && r.key.endsWith(':' + ch.id));
      if (row) link('c:' + c.id, 'l:' + row.key, 'decrees', ch.text);
    }
  }
}
for (const w of WORKS) {
  if (w.needsWork) link('w:' + w.needsWork.id, 'w:' + w.id, 'needs', 'first');
}

const tree = { nodes: [...nodes.values()], edges };

/* ------------------------------------------------------------------- rates */

const STAT_IDS: StatId[] = ['crownSanity', 'mood', 'health', 'economy', 'army', 'culture'];

interface NumberRow {
  kind: 'law' | 'decree' | 'case';
  when: 'on seal' | 'per turn' | 'on choice';
  stat: StatId;
  value: number;
  ownerId: string;
  ownerLabel: string;
  detail: string;
  tags: string[];
  act: number | null;
  badIdea: boolean;
}

/** Every number in the game that moves a board, law by law and case by
 * case. The one table a balance pass actually reads. */
const numbers: NumberRow[] = [];
for (const p of PROPOSALS) {
  for (const o of p.options) {
    for (const stat of STAT_IDS) {
      if (o.effects[stat] !== undefined) {
        numbers.push({ kind: 'law', when: 'on seal', stat, value: o.effects[stat]!, ownerId: p.id, ownerLabel: p.title, detail: o.label, tags: o.tags, act: p.act, badIdea: o.isBadIdea === true });
      }
      if (o.perTurn?.[stat] !== undefined) {
        numbers.push({ kind: 'law', when: 'per turn', stat, value: o.perTurn[stat]!, ownerId: p.id, ownerLabel: p.title, detail: o.label, tags: o.tags, act: p.act, badIdea: o.isBadIdea === true });
      }
    }
  }
}
for (const c of CASES) {
  for (const ch of c.choices) {
    for (const stat of STAT_IDS) {
      if (ch.effects[stat] !== undefined) {
        numbers.push({ kind: 'case', when: 'on choice', stat, value: ch.effects[stat]!, ownerId: c.id, ownerLabel: c.title, detail: ch.text, tags: ch.tags, act: null, badIdea: false });
      }
      if (ch.enactLaw?.effects[stat] !== undefined) {
        numbers.push({ kind: 'decree', when: 'on seal', stat, value: ch.enactLaw.effects[stat]!, ownerId: c.id, ownerLabel: c.title, detail: ch.enactLaw.label, tags: ch.enactLaw.tags, act: null, badIdea: false });
      }
    }
  }
}

/** One line per board: how many numbers touch it, which way they lean, and
 * the standing per-turn drift while a law that moves it stands. */
const statSummary = STAT_IDS.map((stat) => {
  const rows = numbers.filter((n) => n.stat === stat);
  const up = rows.filter((n) => n.value > 0).reduce((a, n) => a + n.value, 0);
  const down = rows.filter((n) => n.value < 0).reduce((a, n) => a + n.value, 0);
  const perTurn = rows.filter((n) => n.when === 'per turn').reduce((a, n) => a + n.value, 0);
  return { stat, count: rows.length, up, down, net: up + down, perTurn };
});

/** Where a board opens the door for another: a stat threshold in a trigger
 * gates a scene, and that scene's answers move other boards. Every such path
 * is one link, and the matrix is just those links counted from -> to. */
interface InfluenceLink {
  from: StatId;
  to: StatId;
  gateOp: 'lte' | 'gte';
  gateValue: number;
  eventId: string;
  eventKind: 'case' | 'proposal';
  eventLabel: string;
  via: string;
  value: number;
}
const influence: InfluenceLink[] = [];
function gatesOf(cond: Condition | null, out: { stat: StatId; op: 'lte' | 'gte'; value: number }[] = []): typeof out {
  if (cond === null) return out;
  if (cond.kind === 'stat') out.push({ stat: cond.stat, op: cond.op, value: cond.value });
  else if (cond.kind === 'all' || cond.kind === 'any') for (const c of cond.conds) gatesOf(c, out);
  else if (cond.kind === 'not') gatesOf(cond.cond, out);
  return out;
}
for (const c of CASES) {
  const gates = gatesOf(c.trigger);
  for (const g of gates) {
    for (const ch of c.choices) {
      for (const stat of STAT_IDS) {
        const v = ch.effects[stat];
        if (v === undefined || v === 0) continue;
        influence.push({ from: g.stat, to: stat, gateOp: g.op, gateValue: g.value, eventId: c.id, eventKind: 'case', eventLabel: c.title, via: ch.text, value: v });
      }
    }
  }
}
for (const p of PROPOSALS) {
  const gates = gatesOf(p.unlockedBy ?? null);
  for (const g of gates) {
    for (const o of p.options) {
      for (const stat of STAT_IDS) {
        const v = o.effects[stat];
        if (v === undefined || v === 0) continue;
        influence.push({ from: g.stat, to: stat, gateOp: g.op, gateValue: g.value, eventId: p.id, eventKind: 'proposal', eventLabel: p.title, via: o.label, value: v });
      }
    }
  }
}
const matrix = STAT_IDS.map((from) => STAT_IDS.map((to) => influence.filter((l) => l.from === from && l.to === to).length));

/** The engine dials from config.ts, flattened to path/value. Only the plain
 * numbers: an object nests, an array of numbers prints as one row, anything
 * else (a function, an object of objects the dial table has no room for) is
 * left out rather than guessed at. */
interface Dial { path: string; value: number | string }
function flattenConfig(obj: unknown, prefix: string, out: Dial[]): void {
  if (obj === null || obj === undefined) return;
  if (typeof obj === 'number') { out.push({ path: prefix, value: obj }); return; }
  if (Array.isArray(obj)) {
    if (obj.every((x) => typeof x === 'number')) out.push({ path: prefix, value: obj.join(', ') });
    return;
  }
  if (typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) flattenConfig(v, prefix ? prefix + '.' + k : k, out);
  }
}
const dials: Dial[] = [];
flattenConfig(CONFIG, '', dials);

const rates = { statSummary, numbers, influence, matrix, statIds: STAT_IDS, dials };

/* ------------------------------------------------------------------- reign */

/**
 * A played snapshot rather than a live simulator: the console spawns
 * `tools/reign.ts` as a child process on every click, which a static page
 * cannot do, so this runs the same command once, at generation time, the
 * same way and with the same defaults `npm run reign` uses, and keeps the
 * JSON it prints. `npx vite-node tools/reign.ts` in the repo still runs
 * any seed range or player live; `reign.ts` is never imported here, the
 * same reason the console does not either (see its own comment: it reads
 * `process.argv` at module scope with no guard, because it is meant to be
 * spawned, not imported).
 */
const VITE_NODE = join(process.cwd(), 'node_modules', 'vite-node', 'vite-node.mjs');
const reignOut = execFileSync(
  process.execPath,
  [VITE_NODE, 'tools/reign.ts', '--json', '--seeds', '12', '--no-timeline'],
  { cwd: process.cwd(), encoding: 'utf8', maxBuffer: 1024 * 1024 * 32 },
);
const reignLine = reignOut.split('\n').reverse().find((l) => l.trim().startsWith('{'));
if (!reignLine) throw new Error('the reign simulator printed nothing that parses as JSON');
const reignParsed = JSON.parse(reignLine) as { summary: unknown; never: string[] };

const reign = {
  seeds: '1-12',
  summary: reignParsed.summary,
  neverReached: reignParsed.never,
};

console.log(JSON.stringify({ scenes, works, proposals, decrees, tree, rates, reign }, null, 0));
