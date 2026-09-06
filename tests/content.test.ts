import { describe, expect, it } from 'vitest';
import { AFTERMATHS } from '../src/content/aftermaths';
import { CASES } from '../src/content/cases';
import { WORKS } from '../src/content/works';
import { TECHS } from '../src/content/techs';
import { MONARCHS } from '../src/content/monarchs';
import { CASE_VERDICTS, VERDICT_OBJECTS, VERDICT_VERBS } from '../src/content/verdict-words';
import { lawGatedChoiceIds } from '../src/engine/verdict';
import { PROPOSALS } from '../src/content/proposals';
import { CHARACTERS, CITY_LABELS, MOOD_FACES, moodFace } from '../src/content/meta';
import {
  AGES,
  CASE_DOING,
  CHOICE_DOING,
  DOING_LINES,
  FOLK,
  STATIONS,
  WINTER_DOING,
} from '../src/content/folk';
import { RIVALS } from '../src/content/scoreboard';
import type { Doing } from '../src/content/folk';
import { TRIAL_LEANS } from '../src/content/trials';
import { TAVERN_LINES } from '../src/content/portrait-text';
import { CONFIG } from '../src/engine/config';
import type {
  ActionId,
  CaseChoice,
  CityFlag,
  Condition,
  Effects,
  IvaStep,
  LawOption,
  StatId,
  SubjectId,
} from '../src/engine/types';

const SUBJECT_IDS: SubjectId[] = [
  'work',
  'strangers',
  'dead',
  'mushrooms',
  'trade',
  'lives',
  'truth',
  'crime',
  'song',
];
const VILLAGE_SUBJECTS: SubjectId[] = ['work', 'strangers', 'dead', 'mushrooms'];
const TOWN_SUBJECTS: SubjectId[] = ['trade', 'lives', 'truth', 'crime', 'song'];
const ACTION_IDS: ActionId[] = [
  'shared',
  'ruled',
  'owned',
  'welcomed',
  'earned',
  'turned_away',
  'with_a_day',
  'by_the_house',
  'at_the_edge',
  'finders',
  'weighed',
  'for_the_cart',
  'free',
  'taxed',
  'licensed',
  'by_count',
  'by_lot',
  'untouchable',
  'mandatory',
  'kind_lies',
  'forgiven',
  'repaid',
  'hanged',
  'worthy',
  'by_crowd',
  'by_hat',
];
const STAT_IDS: StatId[] = ['crownSanity', 'mood', 'health', 'economy', 'army', 'culture'];
const IVA_STEPS: IvaStep[] = ['met', 'helped', 'wronged', 'advocate'];

const caseIds = new Set(CASES.map((c) => c.id));
const aftermathIds = new Set(AFTERMATHS.map((a) => a.id));
const lawIdOf = (o: { subject: SubjectId; action: ActionId }) => `${o.subject}_${o.action}`;

/** Every law option in the game, decrees issued from cases included. */
const allOptions: LawOption[] = [
  ...PROPOSALS.flatMap((p) => p.options),
  ...CASES.flatMap((c) => c.choices.map((ch) => ch.enactLaw)).filter(
    (o): o is LawOption => Boolean(o),
  ),
];

const allChoices: CaseChoice[] = CASES.flatMap((c) => c.choices);

function walkConditions(cond: Condition | null | undefined, out: Condition[]): void {
  if (!cond) return;
  out.push(cond);
  if (cond.kind === 'not') walkConditions(cond.cond, out);
  if (cond.kind === 'all' || cond.kind === 'any') {
    for (const c of cond.conds) walkConditions(c, out);
  }
}

/** Conditions that count as an echo of a law: triggers, extras, unlocks. */
function echoConditions(): Condition[] {
  const out: Condition[] = [];
  for (const c of CASES) walkConditions(c.trigger, out);
  for (const a of AFTERMATHS) for (const e of a.extra ?? []) walkConditions(e.when, out);
  for (const p of PROPOSALS) walkConditions(p.unlockedBy, out);
  return out;
}

function templatesIn(text: string): string[] {
  return [...text.matchAll(/\{\{law:([a-z_]+)\}\}/g)].map((m) => m[1]);
}

/** The scenes a text says "you did this to me {{ago:...}}" about. */
function agoIn(text: string): string[] {
  return [...text.matchAll(/\{\{ago:([a-z0-9_]+)\}\}/g)].map((m) => m[1]);
}

const RAW_CONTENT = import.meta.glob('../src/content/*.ts', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const RAW_UI = import.meta.glob('../src/ui/components/**/*.tsx', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function contentFiles(): { name: string; text: string }[] {
  return Object.entries(RAW_CONTENT).map(([name, text]) => ({ name, text }));
}

/** The subject a case waits on, read straight off its trigger. */
function subjectOf(caseId: string): SubjectId | null {
  const event = CASES.find((c) => c.id === caseId)!;
  const conds: Condition[] = [];
  walkConditions(event.trigger, conds);
  const found = conds.find((c) => c.kind === 'lawActive' && c.subject !== undefined);
  return found && found.kind === 'lawActive' ? found.subject! : null;
}

describe('content validator', () => {
  it('1. every id is unique', () => {
    const ids = [
      ...PROPOSALS.map((p) => p.id),
      ...CASES.map((c) => c.id),
      ...AFTERMATHS.map((a) => a.id),
    ];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('2. every proposal has 2 or 3 options and exactly one bad idea', () => {
    for (const p of PROPOSALS) {
      expect(p.options.length, p.id).toBeGreaterThanOrEqual(2);
      expect(p.options.length, p.id).toBeLessThanOrEqual(3);
      expect(p.options.filter((o) => o.isBadIdea).length, p.id).toBe(1);
    }
  });

  it('3. every aftermathId exists and every aftermath is used', () => {
    const used = new Set(allOptions.map((o) => o.aftermathId));
    for (const id of used) expect(aftermathIds.has(id), id).toBe(true);
    for (const a of AFTERMATHS) expect(used.has(a.id), a.id).toBe(true);
  });

  it('4. the bad idea scene is longer than every sibling scene', () => {
    const length = (id: string) => AFTERMATHS.find((a) => a.id === id)!.paragraphs.length;
    for (const p of PROPOSALS) {
      const bad = p.options.find((o) => o.isBadIdea)!;
      const badLen = length(bad.aftermathId);
      for (const o of p.options) {
        if (o === bad) continue;
        expect(badLen, `${p.id}: ${bad.aftermathId} vs ${o.aftermathId}`).toBeGreaterThan(
          length(o.aftermathId),
        );
      }
    }
  });

  it('4b. every case says what it is about in one line, before the detail', () => {
    // The rail leads with `question` and dims the scene under it, so a case
    // without one is a dilemma a player has to read in full or not at all.
    // One line, and short enough to be read at a glance rather than skimmed.
    for (const c of CASES) {
      expect(c.question?.trim(), `${c.id}: no gist line`).toBeTruthy();
      expect(c.question!.length, `${c.id}: gist line too long`).toBeLessThanOrEqual(120);
    }
  });

  it('5. effects and trends use known boards and stay inside their range', () => {
    const check = (e: Effects | undefined, where: string, min: number, max: number) => {
      if (!e) return;
      for (const [key, value] of Object.entries(e)) {
        expect(STAT_IDS, where).toContain(key as StatId);
        expect(value, where).toBeGreaterThanOrEqual(min);
        expect(value, where).toBeLessThanOrEqual(max);
      }
    };
    for (const o of allOptions) {
      check(o.effects, `${o.label} effects`, CONFIG.effectMin, CONFIG.effectMax);
      check(o.perTurn, `${o.label} perTurn`, CONFIG.trendMin, CONFIG.trendMax);
      check(o.perTurnTown, `${o.label} perTurnTown`, CONFIG.trendMin, CONFIG.trendMax);
    }
    for (const c of CASES) {
      for (const ch of c.choices) {
        check(ch.effects, `${c.id}/${ch.id}`, CONFIG.effectMin, CONFIG.effectMax);
      }
    }
    for (const w of WORKS) {
      check(w.trend, `${w.id} trend`, CONFIG.trendMin, CONFIG.trendMax);
      check(w.once, `${w.id} once`, CONFIG.effectMin, CONFIG.effectMax);
    }
  });

  it('6. every condition points at things that exist', () => {
    for (const cond of echoConditions()) {
      if (cond.kind === 'caseShown') {
        expect(caseIds.has(cond.caseId), cond.caseId).toBe(true);
      }
      if (cond.kind === 'lawActive' || cond.kind === 'lawEver') {
        expect(
          cond.subject !== undefined || cond.action !== undefined,
          JSON.stringify(cond),
        ).toBe(true);
        if (cond.subject !== undefined) expect(SUBJECT_IDS).toContain(cond.subject);
        if (cond.action !== undefined) expect(ACTION_IDS).toContain(cond.action);
      }
      if (cond.kind === 'stat') expect(STAT_IDS).toContain(cond.stat);
      if (cond.kind === 'stage') expect(['village', 'town']).toContain(cond.stage);
      if (cond.kind === 'souls') {
        expect(['lte', 'gte']).toContain(cond.op);
        expect(cond.value, JSON.stringify(cond)).toBeGreaterThan(0);
      }
    }
  });

  it('7. scheduled and injected cases exist and are injection only', () => {
    // the last two are injected by the bench rather than by a choice: the
    // engine schedules <trial>_wrong and <trial>_again by name
    const injected = new Set<string>([
      't_town', 'wv_hearth', 'w_grain', 'w_cold',
      'tr_accused_wrong', 'tr_accused_again',
    ]);
    for (const ch of allChoices) {
      if (ch.schedule) injected.add(ch.schedule.caseId);
    }
    for (const id of injected) {
      expect(caseIds.has(id), id).toBe(true);
      expect(CASES.find((c) => c.id === id)!.trigger, id).toBeNull();
    }
  });

  it('8. every exception names its beneficiary and the law it breaks', () => {
    const knownLawIds = new Set(allOptions.map(lawIdOf));
    for (const ch of allChoices) {
      if (!ch.exceptionToLaw) continue;
      expect(ch.beneficiary, ch.id).toBeTruthy();
      expect(knownLawIds, ch.id).toContain(ch.exceptionToLaw);
    }
  });

  it('9. an exception is only reachable while the law it breaks is standing', () => {
    for (const c of CASES) {
      const grammar = CASE_VERDICTS[c.id];
      if (!grammar) continue;
      for (const ch of c.choices) {
        if (!ch.exceptionToLaw) continue;
        const rulings = grammar.rulings.filter((r) => r.choiceId === ch.id);
        expect(rulings.length, `${c.id}/${ch.id} is not reachable at all`).toBeGreaterThan(0);
        for (const r of rulings) {
          expect(r.needsLaw, `${c.id}/${ch.id} can break a law that is not standing`).toBe(
            ch.exceptionToLaw,
          );
        }
      }
    }
  });

  it('10. cases have 2 or 3 answers that always stand, plus the law given ones', () => {
    const knownLawIds = new Set(allOptions.map(lawIdOf));
    for (const c of CASES) {
      const gated = lawGatedChoiceIds(c.id);
      const open = c.choices.filter((ch) => !gated.has(ch.id));
      expect(open.length, `${c.id} answers that always stand`).toBeGreaterThanOrEqual(2);
      expect(open.length, `${c.id} answers that always stand`).toBeLessThanOrEqual(3);
      expect(gated.size, `${c.id} law given answers`).toBeLessThanOrEqual(3);
      const texts = [
        ...c.scene,
        ...(c.question ? [c.question] : []),
        ...c.choices.map((ch) => ch.result),
        ...c.choices.map((ch) => ch.text),
      ];
      for (const t of texts) {
        for (const law of templatesIn(t)) expect(knownLawIds.has(law), `${c.id}: ${law}`).toBe(true);
        for (const id of agoIn(t)) expect(caseIds.has(id), `${c.id}: ago ${id}`).toBe(true);
        expect(t.includes('{{casualty}}'), c.id).toBe(false);
      }
    }
    for (const a of AFTERMATHS) {
      const texts = [...a.paragraphs, ...(a.extra ?? []).map((e) => e.paragraph)];
      for (const t of texts) {
        for (const law of templatesIn(t)) expect(knownLawIds.has(law), `${a.id}: ${law}`).toBe(true);
      }
    }
  });

  it('11. every law echoes at least once outside its own proposal and its own scene', () => {
    const conds = echoConditions();
    const caseTexts = CASES.flatMap((c) => [
      ...c.scene,
      ...c.choices.map((ch) => ch.result),
      ...c.choices.map((ch) => ch.text),
    ]);
    const tavernTexts = Object.values(TAVERN_LINES).filter((t): t is string => Boolean(t));

    for (const p of PROPOSALS) {
      for (const option of p.options) {
        const lawId = lawIdOf(option);
        const byCondition = conds.some(
          (c) =>
            (c.kind === 'lawActive' || c.kind === 'lawEver') &&
            (c.subject === undefined || c.subject === option.subject) &&
            (c.action === undefined || c.action === option.action),
        );
        const otherScenes = AFTERMATHS.filter((a) => a.id !== option.aftermathId).flatMap((a) => [
          ...a.paragraphs,
          ...(a.extra ?? []).map((e) => e.paragraph),
        ]);
        const byTemplate = [...caseTexts, ...otherScenes, ...tavernTexts].some((t) =>
          templatesIn(t).includes(lawId),
        );
        expect(byCondition || byTemplate, `${p.id}: ${lawId} has no echo`).toBe(true);
      }
    }
  });

  it('12. the forbidden words appear nowhere in the content', () => {
    for (const file of contentFiles()) {
      expect(/justice|sandel/i.test(file.text), file.name).toBe(false);
    }
  });

  it('13. no long dashes anywhere in the content', () => {
    for (const file of contentFiles()) {
      expect(/[–—]/.test(file.text), file.name).toBe(false);
    }
  });

  it('14. two cases per law, a winter for each stage, and a collapse for five boards', () => {
    // Two *chain* dilemmas per law. A case can hang off a standing law without
    // being one of its two, the way a trial does: the law says what happens to
    // a hand that takes, and the trial is the separate question of whose hand.
    for (const subject of SUBJECT_IDS) {
      const forSubject = CASES.filter(
        (c) => /^[vdcs]\d/.test(c.id) && subjectOf(c.id) === subject,
      );
      expect(forSubject.length, subject).toBe(2);
    }
    for (const id of ['t_town', 'wv_hearth', 'w_grain', 'w_cold']) {
      expect(caseIds.has(id), id).toBe(true);
    }
    const collapseBoards = new Set<string>();
    for (const c of CASES) {
      if (!c.id.startsWith('x_')) continue;
      const conds: Condition[] = [];
      walkConditions(c.trigger, conds);
      for (const cond of conds) {
        if (cond.kind === 'stat' && cond.op === 'lte' && cond.value === 0) {
          collapseBoards.add(cond.stat);
        }
      }
    }
    expect([...collapseBoards].sort()).toEqual(
      ['army', 'crownSanity', 'economy', 'health', 'mood'].sort(),
    );
    for (const step of IVA_STEPS) {
      expect(
        allChoices.some((ch) => ch.setIva === step),
        step,
      ).toBe(true);
    }
  });

  it('15. every dilemma states its question in one line', () => {
    for (const c of CASES.filter((c) => /^[vdcs]\d/.test(c.id))) {
      expect(c.question, c.id).toBeTruthy();
      expect(c.question!.length, c.id).toBeGreaterThan(20);
    }
  });

  it('16. the law comes first: every dilemma waits for a standing law of its chain', () => {
    for (const c of CASES.filter((c) => /^[vdcs]\d/.test(c.id))) {
      expect(subjectOf(c.id), `${c.id} can arrive before any law does`).not.toBeNull();
    }
  });

  it('17. every law of a chain puts a word on the bench of every case in it', () => {
    for (const c of CASES.filter((c) => /^[vdcs]\d/.test(c.id))) {
      const subject = subjectOf(c.id)!;
      const grammar = CASE_VERDICTS[c.id];
      const laws = PROPOSALS.flatMap((p) => p.options).filter((o) => o.subject === subject);
      expect(laws.length, subject).toBe(3);
      for (const law of laws) {
        const lawId = lawIdOf(law);
        const usable = grammar.rulings.filter(
          (r) => r.needsLaw === undefined || r.needsLaw === lawId,
        );
        expect(usable.length, `${c.id} is unrulable under ${lawId}`).toBeGreaterThanOrEqual(3);
      }
    }
  });

  /**
   * The three words that were always on a bench were written before any law
   * was, and a law changes what they mean. Every law of a chain has to make
   * at least one of the plain words in each of its cases a breach or a grey
   * answer, or the law is a fourth word on the bench and nothing else: the
   * point of writing it down is that the old answers stop being free.
   */
  it('17b. every standing law makes a plain word on each of its benches cost something', () => {
    const knownLawIds = new Set(PROPOSALS.flatMap((p) => p.options).map(lawIdOf));
    for (const c of CASES.filter((c) => /^[vdcs]\d/.test(c.id))) {
      const subject = subjectOf(c.id)!;
      const grammar = CASE_VERDICTS[c.id];
      const laws = PROPOSALS.flatMap((p) => p.options).filter((o) => o.subject === subject);
      const plain = grammar.rulings.filter((r) => r.needsLaw === undefined);
      for (const law of laws) {
        const lawId = lawIdOf(law);
        const crossed = plain.filter((r) => (r.against ?? []).some((a) => a.law === lawId));
        expect(crossed.length, `${c.id}: nothing on the bench costs anything under ${lawId}`)
          .toBeGreaterThanOrEqual(1);
        // and never all of them: a bench with no clean plain word is a trap, not a dilemma
        expect(crossed.length, `${c.id}: every plain word crosses ${lawId}`).toBeLessThan(
          plain.length,
        );
      }
      for (const r of grammar.rulings) {
        for (const a of r.against ?? []) {
          expect(knownLawIds, `${c.id}/${r.choiceId} crosses a law nobody can seal`).toContain(a.law);
          expect(a.law.startsWith(`${subject}_`), `${c.id}/${r.choiceId} crosses another chain`).toBe(true);
          // a word a law put on the bench cannot also be against a law of the same subject
          expect(r.needsLaw, `${c.id}/${r.choiceId} is granted and against at once`).toBeUndefined();
          expect(['breaks', 'bends'], `${c.id}/${r.choiceId}`).toContain(a.how);
          expect(a.result.length, `${c.id}/${r.choiceId} crosses ${a.law} silently`).toBeGreaterThan(30);
          if (a.how === 'breaks') {
            expect(a.beneficiary, `${c.id}/${r.choiceId} breaks ${a.law} for nobody`).toBeTruthy();
          }
          // an answer that already carries its own breach is not read twice
          const choice = c.choices.find((ch) => ch.id === r.choiceId)!;
          expect(choice.exceptionToLaw, `${c.id}/${r.choiceId} breaks a law twice over`).toBeUndefined();
        }
        // one law of a subject stands at a time, so one entry per law is all that can apply
        const seen = new Set((r.against ?? []).map((a) => a.law));
        expect(seen.size, `${c.id}/${r.choiceId} lists a law twice`).toBe((r.against ?? []).length);
      }
    }
  });

  /**
   * The people who come back. A returning scene is gated on the flag the first
   * scene left, waits some years, names the first scene by `{{ago}}` so the
   * player is told what they did and when, and is about the same person. A
   * return that could arrive before the thing it returns about, or without
   * saying what it returns about, is a wanderer with a familiar face.
   */
  it('34. the ones who come back wait on what you did to them, and say so', () => {
    const returning = CASES.filter((c) => /^r\d/.test(c.id));
    expect(returning.length, 'nobody comes back').toBeGreaterThanOrEqual(4);
    const setBy = (flag: string) =>
      CASES.filter((c) => c.choices.some((ch) => (ch.setFlags ?? []).includes(flag as never)));
    for (const c of returning) {
      const conds: Condition[] = [];
      walkConditions(c.trigger, conds);
      const flags = conds.filter((k) => k.kind === 'flag');
      expect(flags.length, `${c.id} waits on no memory`).toBeGreaterThanOrEqual(1);
      expect(conds.some((k) => k.kind === 'turn' && k.op === 'gte'), `${c.id} comes back at once`).toBe(true);
      const remembered = c.scene.join(' ');
      const named = agoIn(remembered);
      expect(named.length, `${c.id} never says when it was`).toBeGreaterThanOrEqual(1);
      for (const flag of flags) {
        if (flag.kind !== 'flag') continue;
        const setters = setBy(flag.flag);
        expect(setters.length, `${c.id} waits on ${flag.flag}, which nothing sets`).toBeGreaterThan(0);
        // the scene it names is the scene that set the flag, and the person
        // coming back was in that scene: at the door, or named in it (Marta
        // was on her plot while the mill-wright did the talking)
        const who = CHARACTERS[c.character ?? ''];
        for (const first of setters) {
          expect(named, `${c.id} remembers the wrong scene`).toContain(first.id);
          const inIt =
            first.character === c.character ||
            (who !== undefined && [first.title, ...first.scene].join(' ').includes(who.label));
          expect(inIt, `${c.id}: ${c.character} was not in ${first.id}`).toBe(true);
        }
      }
      // it is keen, not urgent: never lost in the lottery, never ahead of a decree
      expect(c.priority, `${c.id} can be crowded out for ever`).toBeLessThanOrEqual(CONFIG.keenPriority);
      expect(c.priority, `${c.id} would push a decree back a year`).toBeGreaterThan(CONFIG.urgentPriority);
    }
  });

  it('18. every monarch is unique, described, and actually changes a rule', () => {
    const ids = MONARCHS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(MONARCHS.length).toBeGreaterThanOrEqual(3);
    for (const m of MONARCHS) {
      expect(m.name.length, m.id).toBeGreaterThan(0);
      expect(m.emoji.length, m.id).toBeGreaterThan(0);
      expect(m.traitName.length, m.id).toBeGreaterThan(0);
      expect(m.traitLine.length, m.id).toBeGreaterThan(0);
      expect(m.portraitLine.length, m.id).toBeGreaterThan(0);
      expect(STAT_IDS, m.id).toContain(m.touches);
      const knobs = Object.values(m.trait).filter((v) => v !== undefined);
      expect(knobs.length, `${m.id} has no mechanical trait`).toBeGreaterThan(0);
    }
  });

  it('19. every case can be ruled on in words, and every outcome is reachable', () => {
    const verbIds = new Set(VERDICT_VERBS.map((v) => v.id));
    const objectIds = new Set(VERDICT_OBJECTS.map((o) => o.id));

    for (const event of CASES) {
      const grammar = CASE_VERDICTS[event.id];
      expect(grammar, `${event.id} has no ruling grammar`).toBeDefined();
      if (!grammar) continue;

      expect(grammar.subject.length, event.id).toBeGreaterThan(0);
      for (const verb of grammar.verbs) expect(verbIds, `${event.id}/${verb}`).toContain(verb);
      for (const obj of grammar.objects) expect(objectIds, `${event.id}/${obj}`).toContain(obj);

      const knownLawIds = new Set(
        PROPOSALS.flatMap((p) => p.options).map((o) => `${o.subject}_${o.action}`),
      );
      const reachable = new Set<string>();
      for (const ruling of grammar.rulings) {
        if (ruling.needsLaw === undefined) {
          expect(grammar.verbs, `${event.id} rules on an unavailable verb`).toContain(ruling.verb);
        } else {
          expect(verbIds, `${event.id} grants an unknown word`).toContain(ruling.verb);
          expect(knownLawIds, `${event.id} waits on a law that cannot be sealed`).toContain(
            ruling.needsLaw,
          );
        }
        expect(
          event.choices.map((c) => c.id),
          `${event.id} rules into a missing choice`,
        ).toContain(ruling.choiceId);
        reachable.add(ruling.choiceId);
      }

      for (const choice of event.choices) {
        expect([...reachable], `${event.id}/${choice.id} is unreachable`).toContain(choice.id);
      }
    }
  });

  it('20. no word on the bench is decoration, and no sentence rules two ways', () => {
    for (const event of CASES) {
      const grammar = CASE_VERDICTS[event.id];
      if (!grammar) continue;
      const used = new Set(grammar.rulings.map((r) => r.verb));
      for (const verb of grammar.verbs) {
        expect(used.has(verb), `${event.id}: ${verb} rules nothing`).toBe(true);
      }
      const seen = new Set<string>();
      for (const r of grammar.rulings) {
        const key = `${r.verb}|${r.object ?? ''}|${r.needsLaw ?? ''}`;
        expect(seen.has(key), `${event.id}: ${key} rules two ways`).toBe(false);
        seen.add(key);
      }
    }
  });

  it('21. no ruling grammar is authored for a case that does not exist', () => {
    const ids = CASES.map((c) => c.id);
    for (const id of Object.keys(CASE_VERDICTS)) {
      expect(ids, `grammar for unknown case ${id}`).toContain(id);
    }
  });

  it('22. acts run 1 to 9, one decree each, the hamlet first and ungated', () => {
    const acts = PROPOSALS.map((p) => p.act).sort((a, b) => a - b);
    expect(acts).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    // the hamlet writes its own four before the charter is mentioned
    expect(PROPOSALS.filter((p) => p.act <= 4).map((p) => p.id)).toEqual([
      'pv1_work',
      'pv2_strangers',
      'pv3_dead',
      'pv4_mushrooms',
    ]);
    expect(PROPOSALS.filter((p) => p.act <= 2).map((p) => p.id)).toEqual([
      'pv1_work',
      'pv2_strangers',
    ]);
    for (const p of PROPOSALS) {
      const village = VILLAGE_SUBJECTS.includes(p.options[0].subject);
      if (village) {
        // a hamlet law waits for nothing except, at most, a year of the place
        // existing: it may never wait for a crowd or a charter it will not see
        const gate = p.unlockedBy;
        if (gate !== undefined) {
          expect(gate.kind, `${p.id} waits on more than a year`).toBe('turn');
        }
        continue;
      }
      expect(TOWN_SUBJECTS).toContain(p.options[0].subject);
      // an argument arrives when the place is big enough to have it: either at
      // the charter, or at a count of souls it names
      const gate = p.unlockedBy;
      expect(gate, `${p.id} is not gated at all`).toBeDefined();
      const gated =
        (gate!.kind === 'stage' && gate!.stage === 'town') ||
        (gate!.kind === 'souls' && gate!.op === 'gte' && gate!.value > CONFIG.population.start);
      expect(gated, `${p.id} is gated on something a hamlet already has`).toBe(true);
    }
  });

  it('23. every board is moved, every law sets a trend, the hamlet laws turn at scale', () => {
    for (const stat of STAT_IDS) {
      const byLaw = allOptions.some(
        (o) =>
          o.effects[stat] !== undefined ||
          o.perTurn?.[stat] !== undefined ||
          o.perTurnTown?.[stat] !== undefined,
      );
      const byCase = allChoices.some((ch) => ch.effects[stat] !== undefined);
      const byWork = WORKS.some((w) => w.trend[stat] !== undefined || w.once?.[stat] !== undefined);
      expect(byLaw || byCase || byWork, `${stat} is decoration`).toBe(true);
    }
    for (const p of PROPOSALS) {
      for (const o of p.options) {
        expect(o.perTurn, `${o.label} sets no trend`).toBeDefined();
        if (VILLAGE_SUBJECTS.includes(o.subject)) {
          expect(o.perTurnTown, `${o.label} does not change at scale`).toBeDefined();
        }
        if (o.subject === 'strangers') {
          expect(o.growth, `${o.label} does not say who comes`).toBeDefined();
        }
      }
    }
  });

  it('24. the works are buildable, priced by stage, and one of them shelters a winter', () => {
    const ids = WORKS.map((w) => w.id);
    expect(new Set(ids).size).toBe(ids.length);
    const rest = WORKS.find((w) => w.id === 'rest')!;
    expect(rest.cost).toBe(0);
    expect(rest.maxLevel).toBe(0);

    for (const w of WORKS) {
      expect(w.name.length, w.id).toBeGreaterThan(0);
      expect(w.line.length, w.id).toBeGreaterThan(10);
    }

    // A year that can be spent the same way again leaves nothing standing, so
    // it has no floors, no stage of its own and nothing to trend with. What it
    // has is the thing it does on the day, and a price, if it has one.
    for (const w of WORKS.filter((w) => w.maxLevel === 0)) {
      expect(
        Object.keys(w.once ?? {}).length,
        `${w.id} is a year that does nothing at all`,
      ).toBeGreaterThan(0);
      expect(Object.keys(w.trend).length, `${w.id} trends without standing`).toBe(0);
      expect(w.cost, `${w.id} cannot cost less than nothing`).toBeGreaterThanOrEqual(0);
      expect(w.winterShelter, `${w.id} shelters a winter it is not there for`).toBeUndefined();
    }

    // Everything else is a building: floors, a price for the stage it belongs
    // to, and a trend that runs for as long as it stands.
    for (const w of WORKS.filter((w) => w.maxLevel > 0)) {
      expect(w.cost, w.id).toBeGreaterThan(0);
      expect(w.maxLevel, w.id).toBeLessThanOrEqual(3);
      expect(Object.keys(w.trend).length, `${w.id} has no trend`).toBeGreaterThan(0);
      // A work a hamlet can also raise carries both prices: the village one to
      // build it with, and the town one for when the same year costs more.
      if (w.stage === 'both') {
        expect(w.cost, `${w.id} is priced for the wrong stage`).toBe(CONFIG.works.costVillage);
        expect(w.townCost, `${w.id} has no town price`).toBe(CONFIG.works.costTown);
      } else {
        const expected =
          w.stage === 'village' ? CONFIG.works.costVillage : CONFIG.works.costTown;
        expect(w.cost, `${w.id} is priced for the wrong stage`).toBe(expected);
      }
    }

    expect(WORKS.filter((w) => w.winterShelter !== undefined).length).toBe(1);
  });

  it('25. every work has something to show for itself in the town picture', () => {
    const city = Object.values(RAW_UI).join('\n');
    for (const w of WORKS) {
      if (w.id === 'rest') continue;
      expect(city.includes(w.id), `${w.id} is invisible in the town`).toBe(true);
    }
  });
  /**
   * A layer nothing can switch on is a drawing nobody will ever see.
   *
   * Six of them sat in the picture for nine acts: the camp outside the wall,
   * the fence on the meadow, the goats on it, the bread queue, the boards over
   * the tavern and the thing on the roof. They were all drawn, and no law and
   * no answer anywhere in the game turned any of them on.
   */
  it('25b. every layer in the town picture has something that switches it on', () => {
    // the fair is a year of work rather than a sentence, so its bunting is the
    // one layer the picture puts up by itself
    const switched = new Set<CityFlag>(['bunting']);
    const collect = (on?: CityFlag[], off?: CityFlag[]) => {
      for (const f of on ?? []) switched.add(f);
      for (const f of off ?? []) switched.add(f);
    };
    for (const p of PROPOSALS) for (const o of p.options) collect(o.cityFlagsOn, o.cityFlagsOff);
    for (const c of CASES) for (const ch of c.choices) collect(ch.cityFlagsOn, ch.cityFlagsOff);

    for (const flag of Object.keys(CITY_LABELS) as CityFlag[]) {
      expect(switched.has(flag), `nothing in the game turns on ${flag}`).toBe(true);
    }
  });

  // A law may be all cost (a closed door curdles at scale, and should); what it
  // may never be is all gift.
  it('26. no law is a free lunch: every trend it sets costs the place something', () => {
    for (const p of PROPOSALS) {
      for (const o of p.options) {
        const trends = [o.perTurn, o.perTurnTown, o.perTurnWatch].filter(
          (t): t is Effects => t !== undefined,
        );
        for (const trend of trends) {
          const values = Object.values(trend);
          expect(
            values.some((v) => (v as number) < 0),
            `${o.label} has a trend that only gives`,
          ).toBe(true);
        }
      }
    }
  });

  it('28. no answer moves more than four boards at once', () => {
    const sets: { where: string; effects: Effects | undefined }[] = [];
    for (const c of CASES) {
      for (const ch of c.choices) sets.push({ where: `${c.id}/${ch.id}`, effects: ch.effects });
    }
    for (const p of PROPOSALS) {
      for (const o of p.options) {
        sets.push({ where: `${p.id}/${o.action}`, effects: o.effects });
        sets.push({ where: `${p.id}/${o.action} per turn`, effects: o.perTurn });
        sets.push({ where: `${p.id}/${o.action} in a town`, effects: o.perTurnTown });
        sets.push({ where: `${p.id}/${o.action} with a watch`, effects: o.perTurnWatch });
      }
    }
    for (const w of WORKS) {
      sets.push({ where: `${w.id} trend`, effects: w.trend });
      sets.push({ where: `${w.id} once`, effects: w.once });
    }
    for (const t of TECHS) sets.push({ where: t.id, effects: t.trend });
    for (const m of MONARCHS) sets.push({ where: m.id, effects: m.trait.yearly });

    // Five numbers moving at once is not a decision, it is a receipt. Four is
    // the most a player can hold in their head while reading a sentence.
    for (const set of sets) {
      const touched = Object.keys(set.effects ?? {}).length;
      expect(touched, `${set.where} moves ${touched} boards`).toBeLessThanOrEqual(4);
    }
  });

  it('27. the tree is a tree: every branch grows from something that exists', () => {
    const ids = new Set(TECHS.map((t) => t.id));
    expect(ids.size, 'two things worked out under one name').toBe(TECHS.length);
    const seen = new Set<string>();
    for (const tech of TECHS) {
      expect(Object.keys(tech.trend).length, `${tech.id} does nothing`).toBeGreaterThan(0);
      expect(tech.cost, tech.id).toBeGreaterThan(0);
      for (const need of tech.requires ?? []) {
        expect(ids, `${tech.id} grows from nothing`).toContain(need);
        expect(seen.has(need), `${tech.id} comes before what it grows from`).toBe(true);
      }
      seen.add(tech.id);
    }
    // one root per branch, so the tree is not one lane in a coat
    const roots = TECHS.filter((t) => (t.requires ?? []).length === 0);
    expect(roots.length, 'the tree has no branches').toBeGreaterThanOrEqual(2);
    // and the crowd branch waits for a crowd
    expect(TECHS.some((t) => t.needsSouls !== undefined), 'nothing waits on people').toBe(true);
  });

  it('32. a law pays out nothing on the day but a mood', () => {
    for (const option of allOptions) {
      for (const key of Object.keys(option.effects ?? {})) {
        expect(key, `${option.label} hands out ${key} the day it is sealed`).toBe('mood');
      }
      // and it has to do something standing, or it is not a rule at all
      const standing = Object.keys(option.perTurn ?? {}).length;
      expect(standing, `${option.label} is a decree that changes nothing`).toBeGreaterThan(0);
    }
  });

  it('33. every question has somebody with an opinion about it', () => {
    for (const p of PROPOSALS) {
      expect(p.advice, `${p.id} has nobody leaning either way`).toBeDefined();
      const advice = p.advice!;
      expect(p.options[advice.option], `${p.id} leans on an option it does not have`).toBeDefined();
      expect(advice.line.length, `${p.id} leans without saying why`).toBeGreaterThan(20);
      // an advisor who recommends the bad idea is a different game
      expect(
        p.options[advice.option].isBadIdea,
        `${p.id}: the advisor is recommending the bad idea`,
      ).not.toBe(true);
    }
  });

  it('30. every trial leans, and has somewhere for the truth to surface', () => {
    for (const c of CASES) {
      const verdicts = c.choices.filter((ch) => ch.verdict);
      if (verdicts.length === 0) {
        expect(c.accused, `${c.id} names an accused but never rules on them`).toBeUndefined();
        continue;
      }
      expect(c.accused, `${c.id} rules on a person it never names`).toBeDefined();
      // both ways out, or it is not a question
      expect(verdicts.map((ch) => ch.verdict)).toContain('guilty');
      expect(verdicts.map((ch) => ch.verdict)).toContain('innocent');
      // and one way that refuses to say, which records nothing and comes back never
      expect(
        c.choices.some((ch) => ch.verdict === undefined),
        `${c.id} forces a verdict`,
      ).toBe(true);

      const pair = TRIAL_LEANS[c.id];
      expect(pair, `${c.id} has no leaning detail`).toBeDefined();
      expect(c.scene.join(' '), `${c.id} never writes its leaning detail in`).toContain(
        '{{lean}}',
      );
      expect(pair.guilty).not.toBe(pair.innocent);

      for (const suffix of ['_wrong', '_again']) {
        const id = c.id + suffix;
        expect(caseIds.has(id), `${c.id} has no ${suffix} scene`).toBe(true);
        expect(CASES.find((x) => x.id === id)!.trigger, `${id} must be injection only`).toBeNull();
      }
    }
  });

  it('31. a leaning detail never says which way it leans', () => {
    for (const [id, pair] of Object.entries(TRIAL_LEANS)) {
      expect(caseIds.has(id), `a lean for the missing case ${id}`).toBe(true);
      for (const text of [pair.guilty, pair.innocent]) {
        expect(/guilty|innocent|did it|stole/i.test(text), `${id} gives it away`).toBe(false);
      }
    }
  });

  it('29. the square has three faces and wears the right one', () => {
    // sour, even and pleased, and no gaps: every value a mood can hold has a face
    expect(MOOD_FACES.length).toBe(3);
    expect(new Set(MOOD_FACES.map((f) => f.emoji)).size).toBe(3);
    expect(MOOD_FACES[MOOD_FACES.length - 1].upTo).toBe(CONFIG.statMax);
    for (let i = 1; i < MOOD_FACES.length; i++) {
      expect(MOOD_FACES[i].upTo, 'the bands run upwards').toBeGreaterThan(MOOD_FACES[i - 1].upTo);
    }
    expect(moodFace(CONFIG.statMin)).toBe(MOOD_FACES[0].emoji);
    expect(moodFace(CONFIG.statMax)).toBe(MOOD_FACES[2].emoji);
    expect(moodFace(50)).toBe(MOOD_FACES[1].emoji);
    // the face has to change on the way up, or it is a decoration
    const worn = new Set([0, 20, 40, 60, 80, 100].map(moodFace));
    expect(worn.size).toBe(3);
  });
});

describe('the people in the picture', () => {
  const DOINGS = Object.keys(DOING_LINES) as Doing[];

  it('has a look for everybody who ever comes to the door', () => {
    for (const event of CASES) {
      if (!event.character) continue;
      expect(FOLK[event.character], `no look for ${event.character}`).toBeDefined();
    }
  });

  it('gives every doing a line and a place to stand', () => {
    for (const doing of DOINGS) {
      expect(DOING_LINES[doing], `no line for ${doing}`).toBeTruthy();
      expect(STATIONS[doing], `no station for ${doing}`).toBeDefined();
    }
  });

  it('stands everybody on ground that is in the picture', () => {
    for (const doing of DOINGS) {
      if (doing === 'gone') continue;
      const { x, y } = STATIONS[doing];
      // the picture is 1440 by 820; the ground starts at the hills on 200 and
      // the strip below 600 is the near meadow, which the card floats over
      expect(x, `${doing} is off the side`).toBeGreaterThan(-40);
      expect(x, `${doing} is off the side`).toBeLessThan(1480);
      expect(y, `${doing} is in the sky`).toBeGreaterThan(200);
      expect(y, `${doing} is under the card`).toBeLessThan(600);
    }
  });

  it('points every scene at a doing that exists', () => {
    for (const [caseId, doing] of Object.entries(CASE_DOING)) {
      expect(CASES.some((c) => c.id === caseId), `${caseId} is not a scene`).toBe(true);
      expect(DOINGS, `${caseId} does something nobody can draw`).toContain(doing);
    }
  });

  it('points every answer that changes a life at a real answer', () => {
    for (const [key, doing] of Object.entries(CHOICE_DOING)) {
      const [caseId, choiceId] = key.split(':');
      const event = CASES.find((c) => c.id === caseId);
      expect(event, `${caseId} is not a scene`).toBeDefined();
      expect(
        event?.choices.some((c) => c.id === choiceId),
        `${caseId} has no answer called ${choiceId}`,
      ).toBe(true);
      expect(DOINGS, `${key} does something nobody can draw`).toContain(doing);
    }
  });

  it('leaves nobody standing in the same footprint as somebody else', () => {
    // two people at one station are stepped apart by the engine; two stations
    // on top of each other cannot be
    const spots = DOINGS.filter((d) => d !== 'gone').map((d) => STATIONS[d]);
    for (let i = 0; i < spots.length; i++) {
      for (let k = i + 1; k < spots.length; k++) {
        const apart =
          Math.abs(spots[i].x - spots[k].x) > 14 || Math.abs(spots[i].y - spots[k].y) > 8;
        expect(apart, `two stations sit on top of each other at ${spots[i].x}`).toBe(true);
      }
    }
  });
});

describe('the seasons, the ages and the reckoning', () => {
  const DOINGS = Object.keys(DOING_LINES) as Doing[];

  it('only moves work with the weather, never somebody who has sat down', () => {
    // whoever stopped working stopped working, and no frost changes that
    const SAT_DOWN: Doing[] = ['resting', 'pouring', 'mending', 'gone'];
    for (const [from, to] of Object.entries(WINTER_DOING)) {
      expect(DOINGS, `${from} is not a doing`).toContain(from as Doing);
      expect(DOINGS, `${from} turns into something nobody can draw`).toContain(to);
      expect(SAT_DOWN, `winter should not move ${from}`).not.toContain(from as Doing);
      expect(from, 'winter should not turn a doing into itself').not.toBe(to);
    }
  });

  it('knows how old everybody was when they walked in', () => {
    for (const event of CASES) {
      if (!event.character) continue;
      expect(AGES[event.character], `no age for ${event.character}`).toBeDefined();
    }
    // the three the scenes say out loud have to match what the scenes say
    expect(AGES.iva).toBe(9);
    expect(AGES.lark).toBe(12);
    expect(AGES.aunt).toBe(71);
  });

  it('gives the other seals distinct scores, in order, with a shape each', () => {
    const scores = RIVALS.map((r) => r.score);
    expect(new Set(scores).size, 'two rivals share a score').toBe(scores.length);
    expect([...scores].sort((a, b) => a - b)).toEqual(scores);
    for (const rival of RIVALS) {
      expect(rival.line.length, `${rival.id} has no line`).toBeGreaterThan(20);
      expect(DOINGS, `${rival.id} does something nobody can draw`).toContain(rival.look.doing);
    }
  });
});
