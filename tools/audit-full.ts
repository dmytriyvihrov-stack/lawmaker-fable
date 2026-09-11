/**
 * Prints every scene, in full, as JSON: the trigger in words, the whole
 * scene text, every answer with its full result and effects, and what waits
 * on it before and after (the same reading tools/audit-order.ts gives, kept
 * here so the two can be read side by side).
 *
 *   npx vite-node tools/audit-full.ts > full.json
 *
 * It is the same text the console's Cases tab shows, one case at a time;
 * this prints all fifty eight in one file. Nothing here writes anything.
 */
import { CASES } from '../src/content/cases';
import { WORKS } from '../src/content/works';
import { CONFIG } from '../src/engine/config';
import type { CaseChoice, CaseEvent, Condition, WorkId } from '../src/engine/types';

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

/**
 * A story flag connects two scenes just as surely as a schedule does: one
 * choice sets it, and it is the whole reason another scene can arrive at
 * all. Neither triggers list read the other, so this is built once, both
 * directions, before the scenes below use it.
 */
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
    triggerRaw: c.trigger,
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

console.log(JSON.stringify({ scenes, works }, null, 1));
