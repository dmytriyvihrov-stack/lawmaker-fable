/**
 * Prints the order of the game as JSON: every scene, what has to be true
 * before it can happen, and what waits on it afterwards.
 *
 *   npx vite-node tools/audit-order.ts > order.json
 *
 * It is the same reading the console's Cases tab draws, in a form a page can
 * be built out of. Nothing here writes anything.
 */
import { CASES } from '../src/content/cases';
import { PROPOSALS } from '../src/content/proposals';
import { WORKS } from '../src/content/works';
import { CONFIG } from '../src/engine/config';
import type { CaseEvent, Condition, WorkId } from '../src/engine/types';

interface Need {
  kind: string;
  text: string;
  work?: string;
  caseId?: string;
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
      out.push({ kind: 'flag', text: not('the reign carries ' + cond.flag) });
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

/** What the place calls the thing, once it stands. */
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
  }
  const putHere: string[] = [];
  for (const other of CASES) {
    for (const ch of other.choices) {
      if (ch.schedule?.caseId === c.id) putHere.push(other.title);
    }
  }
  return {
    id: c.id,
    title: c.title,
    priority: c.priority,
    band: band(c),
    kind: c.trigger === null ? 'called' : 'waits',
    needs: needs(c.trigger),
    putHere: [...new Set(putHere)],
    after: after.filter((a, i, list) => list.findIndex((x) => x.caseId === a.caseId) === i),
  };
});

const works = WORKS.map((w) => ({
  id: w.id,
  name: w.name,
  line: w.line,
  stage: w.stage,
  cost: w.cost,
  needsWork: w.needsWork ? w.needsWork.id : null,
  opens: CASES.filter((c) => needs(c.trigger).some((n) => n.work === w.id)).map((c) => ({ id: c.id, title: c.title })),
}));

const proposals = PROPOSALS.map((p) => ({
  id: p.id,
  act: p.act,
  title: p.title,
  needs: needs(p.unlockedBy ?? null),
}));

console.log(JSON.stringify({ scenes, works, proposals }, null, 1));
