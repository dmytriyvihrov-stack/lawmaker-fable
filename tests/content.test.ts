import { describe, expect, it } from 'vitest';
import { AFTERMATHS } from '../src/content/aftermaths';
import { CASES } from '../src/content/cases';
import { WORKS } from '../src/content/works';
import { PATHS, SPHERES, TECHS } from '../src/content/techs';
import { MONARCHS } from '../src/content/monarchs';
import { CASE_VERDICTS, VERDICT_OBJECTS, VERDICT_VERBS } from '../src/content/verdict-words';
import { lawGatedChoiceIds } from '../src/engine/verdict';
import { PROPOSALS } from '../src/content/proposals';
import { ALSO_IN_SCENE, CHARACTERS, CITY_LABELS, MOOD_FACES, moodFace } from '../src/content/meta';
import { CHOICE_BOND_OTHERS } from '../src/content/bonds';
import {
  AGES,
  CASE_DOING,
  CHOICE_DOING,
  CHOICE_DOING_OTHERS,
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
import { newGame } from '../src/engine/reducer';
import { researchGain } from '../src/engine/simulation';
import type {
  ActionId,
  CaseChoice,
  CaseEvent,
  CityFlag,
  Condition,
  WorkId,
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

/** The people a text says the age of out loud, rather than writing a number. */
function ageIn(text: string): string[] {
  return [...text.matchAll(/\{\{age:([a-z0-9_]+)\}\}/g)].map((m) => m[1]);
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
      if (cond.kind === 'since') {
        expect(caseIds.has(cond.caseId), cond.caseId).toBe(true);
        expect(cond.years, JSON.stringify(cond)).toBeGreaterThan(0);
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
        // a scene that says how old somebody is reads it off the register,
        // because the same scene is played in year three and in year twenty
        for (const who of ageIn(t)) {
          expect(AGES[who], `${c.id}: nobody called ${who} has an age`).toBeGreaterThan(0);
        }
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
    /* Four boards can reach their floor and each has a scene waiting there.
       The square is the fifth and it never gets that far: it walks out at
       `walkOut.at`, twenty six, or at ten behind a full watch, and the reign
       is over. So the mood collapse is not a collapse at all - it is the
       deputation, injected by the reducer at that line, and `x_flight` is the
       warning fired in the band above it. A scene written at `mood lte 0` was
       a scene no reign in twelve seeds and seven players ever saw. */
    expect([...collapseBoards].sort()).toEqual(
      ['army', 'crownSanity', 'economy', 'health'].sort(),
    );
    expect(caseIds.has('x_square'), 'the square has nowhere to say so').toBe(true);
    expect(CASES.find((c) => c.id === 'x_square')!.trigger, 'x_square is injected').toBeNull();
    const flight = CASES.find((c) => c.id === 'x_flight')!;
    const flightConds: Condition[] = [];
    walkConditions(flight.trigger, flightConds);
    const moodBand = flightConds.find((c) => c.kind === 'stat' && c.stat === 'mood');
    expect(moodBand, 'x_flight no longer watches the square').toBeDefined();
    expect(
      (moodBand as { value: number }).value,
      'x_flight fires below the line the square walks out at, so never',
    ).toBeGreaterThan(CONFIG.walkOut.at);
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
        /* A hamlet law waits for nothing a hamlet will not reach: a year of
           the place existing, or something that has actually happened in it,
           or a law the hamlet writes earlier in the order, or any combination
           of those. It may never wait for a crowd or a charter it will not
           see, or for a law of a later act. `pv3_dead` is the reason this is
           not simply "turn": the law about burying people arrives the year
           somebody is buried, with a year as the long stop behind it.
           `pv2_strangers` is the reason a standing law counts: the fence
           waits on the work, which is act 1 and comes to every reign. */
        const earlier = new Set(
          PROPOSALS.filter(
            (q) => q.act < p.act && VILLAGE_SUBJECTS.includes(q.options[0].subject),
          ).flatMap((q) => q.options.map((o) => o.subject)),
        );
        const gate = p.unlockedBy;
        const reachable = (c: typeof gate): boolean =>
          c === undefined ||
          c.kind === 'turn' ||
          c.kind === 'flag' ||
          ((c.kind === 'lawActive' || c.kind === 'lawEver') &&
            c.subject !== undefined &&
            earlier.has(c.subject)) ||
          ((c.kind === 'any' || c.kind === 'all') &&
            c.conds.every((inner) => reachable(inner)));
        expect(reachable(gate), `${p.id} waits on more than a hamlet can reach`).toBe(true);
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
      /* The row is the price the engine charges, and the stage number is the
         ceiling rather than the answer: a thing that is worth less than a
         year of work may say so (the woodcutter's cabin is eight), and
         nothing may quietly cost more than the stage it stands in. */
      if (w.stage === 'both') {
        expect(w.cost, `${w.id} is dearer than its stage`).toBeLessThanOrEqual(
          CONFIG.works.costVillage,
        );
        expect(w.townCost, `${w.id} has no town price`).toBe(CONFIG.works.costTown);
      } else {
        const ceiling =
          w.stage === 'village' ? CONFIG.works.costVillage : CONFIG.works.costTown;
        expect(w.cost, `${w.id} is dearer than its stage`).toBeLessThanOrEqual(ceiling);
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

  /**
   * And no law has one answer that is simply the best one.
   *
   * A player reads three predicates and a line of boards under each, and the
   * whole of the decision is which cost they are willing to carry. Four of the
   * nine laws had an answer with a gain on every line of that card and a loss
   * on none of them, which is not a decision, and one of the nine had an
   * answer that was better than its neighbour on every line at once. The
   * reading below is the card itself, line by line: what it moves the day it
   * is sealed, what it moves every year at each of the three scales the game
   * has, and how many people come. Every answer has to be the best of the
   * three at something and the worst of the three at something, and none of
   * them may beat another everywhere.
   */
  it('26b. no law has a dominant answer: each one is best at something and worst at something', () => {
    const scales = (o: LawOption) => {
      const town = o.perTurnTown ?? o.perTurn;
      return { year: o.perTurn, town, watch: o.perTurnWatch ?? town };
    };
    /** One option as one number per line of its card. */
    const card = (o: LawOption): Record<string, number> => {
      const out: Record<string, number> = { growth: o.growth ?? 1 };
      const by = scales(o);
      for (const stat of STAT_IDS) {
        out[`once ${stat}`] = o.effects[stat] ?? 0;
        for (const [when, trend] of Object.entries(by)) out[`${when} ${stat}`] = trend?.[stat] ?? 0;
      }
      return out;
    };

    for (const p of PROPOSALS) {
      const cards = p.options.map(card);
      const lines = Object.keys(cards[0]);
      p.options.forEach((o, i) => {
        const best = lines.filter((k) => cards.every((c, j) => j === i || c[k] < cards[i][k]));
        const worst = lines.filter((k) => cards.every((c, j) => j === i || c[k] > cards[i][k]));
        expect(best.length, `${p.id}/${o.action} is the best answer at nothing`).toBeGreaterThan(0);
        expect(worst.length, `${p.id}/${o.action} costs nothing nobody else costs`).toBeGreaterThan(0);
      });
      for (let i = 0; i < cards.length; i++) {
        for (let j = 0; j < cards.length; j++) {
          if (i === j) continue;
          const never = lines.every((k) => cards[i][k] >= cards[j][k]);
          const somewhere = lines.some((k) => cards[i][k] > cards[j][k]);
          expect(
            never && somewhere,
            `${p.id}: ${p.options[i].action} beats ${p.options[j].action} on every line`,
          ).toBe(false);
        }
      }
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
      /* It waits. Either on a plain year, which is honest for a scene that
         always happens in the first three springs, or on years since the scene
         it is about, which is the only clock that works for one that can
         arrive in year eleven or in year twenty five. */
      const waits = conds.some(
        (k) => (k.kind === 'turn' && k.op === 'gte') || k.kind === 'since',
      );
      expect(waits, `${c.id} comes back at once`).toBe(true);
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

  /**
   * A word a law puts on the bench has to do something no plain word on that
   * bench does.
   *
   * The promise of the whole mechanic is that writing a law *changes the
   * bench*: it makes one of the three plain answers cost something (17b) and
   * it adds a word of its own. What twenty of them did instead was say a plain
   * word again in legal language. Under a law that turns strangers away, the
   * man in the hay could be HIDDEN or he could have BEEN NEVER HERE, with the
   * same numbers to the point and the same flag, and the only difference was
   * which line the Codex wrote it on. That is a receipt, not a choice.
   *
   * So: same flags, same layers on the town, same kind of extra (souls, a
   * return, a decree, a step of Iva's, a verdict, somebody thinking better of
   * you), no board moving in opposite directions, and every board within six
   * points, and the two are the same answer. Whether one of them is lawful and
   * the other is a breach does NOT save the pair: that difference is the
   * crown's bill, and a bill is not a dilemma.
   *
   * A granted word earns its place with a flag none of the plain words sets, a
   * layer on the town, a person coming back, souls, a decree, a bond, a board
   * none of them touches, or a sign none of them has.
   */
  it('35. no word a law puts on a bench is a plain word said again in law', () => {
    /* The ones that stay, and why. Each of these is the law's own sentence
       read back to the person standing there, which is the point of the law
       having been written, and each one lands somewhere the numbers cannot
       show. */
    const ALLOWED: Record<string, string> = {
      'c1_lark:two_coats':
        'the law says twice, and his mother sews the second one out of a blanket',
      'c1_lark:spare_the_child':
        'the rope refused for a child, under a decree that names the rope: one of the two benches a reign can end on',
      'c2_toll:pays_it_twice': 'the law says twice, and the second half is read out at the fountain',
      'c2_toll:hangs_for_coins':
        'the sentence the crossroads decree actually names, carried out where the box is',
    };

    const near = (a: number, b: number) => Math.abs(a - b) <= 6;
    const marks = (ch: CaseChoice) =>
      [
        [...(ch.setFlags ?? [])].sort().join(','),
        [...(ch.cityFlagsOn ?? [])].sort().join(','),
        [...(ch.cityFlagsOff ?? [])].sort().join(','),
        ch.souls ?? 0,
        ch.schedule?.caseId ?? '',
        ch.enactLaw ? 'decree' : '',
        ch.setIva ?? '',
        ch.verdict ?? '',
        ch.bond ?? 0,
      ].join('|');

    const twin = (a: CaseChoice, b: CaseChoice): boolean => {
      if (marks(a) !== marks(b)) return false;
      for (const stat of STAT_IDS) {
        const x = a.effects[stat] ?? 0;
        const y = b.effects[stat] ?? 0;
        if (x * y < 0) return false;
        if (!near(x, y)) return false;
      }
      return true;
    };

    for (const c of CASES) {
      const grammar = CASE_VERDICTS[c.id];
      if (!grammar) continue;
      const byId = new Map(c.choices.map((ch) => [ch.id, ch]));
      for (const granted of grammar.rulings) {
        if (granted.needsLaw === undefined) continue;
        const g = byId.get(granted.choiceId);
        if (!g) continue;
        for (const plain of grammar.rulings) {
          if (plain.needsLaw !== undefined || plain.choiceId === granted.choiceId) continue;
          const p = byId.get(plain.choiceId);
          if (!p || !twin(g, p)) continue;
          const key = `${c.id}:${granted.choiceId}`;
          expect(
            ALLOWED[key],
            `${key} is ${c.id}:${plain.choiceId} in legal language, and nothing else`,
          ).toBeTruthy();
        }
      }
    }
  });

  /**
   * 36. Nothing at the door is about a building this place has not raised.
   *
   * Not every noun: a valley has a way in, a fence round a yard, a track out
   * and the corner of ground the five of them were found voting in, and the
   * picture draws the well and that corner from the first spring for exactly
   * that reason. What it does not have is the six that are somebody's year of
   * work and nothing else, each of them a silhouette on the map that is either
   * standing there or is not. A scene that opens on a granary in a place with
   * no granary is the game contradicting its own picture, and it has done it
   * four times: a trial that sent a man to work at one, two songs judged in a
   * hall, and a plague named after a long room.
   *
   * The one exemption is written down rather than pattern-matched, because
   * every way of spotting it automatically also hides a real one.
   */
  it('36. no scene names a building the place may not have built', () => {
    const NAMED: [WorkId, RegExp][] = [
      ['granary', /\bthe granary\b/i],
      ['long_room', /\blong room\b/i],
      ['hall', /\bthe hall\b/i],
      ['mine', /\bthe (mine|adit|shaft)\b/i],
      ['bridge', /\bthe bridge\b/i],
      ['watch_house', /\bthe watch[ -]house\b/i],
      /* The fence is the seventh, and it was left out of this list on the
         grounds that a valley has a fence round a yard whether or not
         anybody has spent a year on one. That is true of "a fence" and not
         of "the fence", which is the run along the lane the picture only
         draws once the year is spent: two scenes opened on a night of wind
         taking every post in the valley, in valleys that had never raised
         one. Asked for by the user. */
      ['fence', /\b(the|every) fence\b/i],
    ];
    /** Somebody else's hall, three valleys away, which this place never built. */
    const ELSEWHERE: Record<string, RegExp> = { wv_hearth: /hall of the lord/i };

    const gatedOn = (cond: Condition | null | undefined, work: WorkId): boolean => {
      if (!cond) return false;
      if (cond.kind === 'built') return cond.work === work;
      if (cond.kind === 'all' || cond.kind === 'any') return cond.conds.some((c) => gatedOn(c, work));
      return false;
    };

    for (const event of CASES) {
      const said = [
        event.title,
        event.question ?? '',
        ...(event.scene ?? []),
        ...event.choices.map((c) => c.text),
      ].join(' ');
      const spoken = ELSEWHERE[event.id] ? said.replace(ELSEWHERE[event.id], '') : said;
      for (const [work, names] of NAMED) {
        if (!names.test(spoken)) continue;
        expect(
          gatedOn(event.trigger, work),
          `${event.id} names ${work} and does not wait for one to be built`,
        ).toBe(true);
      }
    }
  });

  it('37. the tree is three spheres, and every path is a chain of two or three', () => {
    // every sphere is worked on, and none of them is one lane in a coat
    for (const sphere of SPHERES) {
      const paths = PATHS.filter((p) => p.sphere === sphere.id);
      expect(paths.length, `${sphere.id} has no paths`).toBeGreaterThanOrEqual(2);
      expect(paths.length, `${sphere.id} has too many paths to read`).toBeLessThanOrEqual(3);
      expect(sphere.name.length, sphere.id).toBeGreaterThan(0);
      expect(sphere.line.length, sphere.id).toBeGreaterThan(0);
    }
    expect(new Set(PATHS.map((p) => p.id)).size, 'two paths under one name').toBe(PATHS.length);

    for (const path of PATHS) {
      expect(SPHERES.map((s) => s.id), `${path.id} hangs off no sphere`).toContain(path.sphere);
      const chain = TECHS.filter((t) => t.path === path.id);
      expect(chain.length, `${path.id} is not a chain`).toBeGreaterThanOrEqual(2);
      expect(chain.length, `${path.id} is a chain nobody finishes`).toBeLessThanOrEqual(3);
      // the first step grows from the place itself, and every one after it
      // waits on the one before, which is what makes a path a path
      expect(chain[0].requires ?? [], `${path.id} starts halfway up`).toEqual([]);
      for (let i = 1; i < chain.length; i++) {
        expect(chain[i].requires, `${chain[i].id} waits on nothing`).toEqual([chain[i - 1].id]);
        expect(
          chain[i].cost,
          `${chain[i].id} is cheaper than the step under it`,
        ).toBeGreaterThan(chain[i - 1].cost);
        expect(chain[i].era, chain[i].id).toBe(chain[i - 1].era + 1);
      }
    }

    // and every step belongs to a sphere and a path that exist
    for (const tech of TECHS) {
      expect(SPHERES.map((s) => s.id), `${tech.id} is in no sphere`).toContain(tech.sphere);
      const path = PATHS.find((p) => p.id === tech.path);
      expect(path, `${tech.id} walks no path`).toBeDefined();
      expect(path?.sphere, `${tech.id} is filed under two spheres`).toBe(tech.sphere);
    }
  });

  it('38. no reign works out the whole tree, and each sphere is worth a reign', () => {
    /* The tree is a choice because it is longer than a reign. Play the years
       out at the rate the rules give a place that has filled its valley, and
       the whole tree has to still be out of reach at the hard cap. */
    /* The rate a place that has filled its valley makes, and not a point
       more. The surplus is deliberately left out: it wants the store at
       seventy and fires in about one played year in eleven, so a reign that
       earns it every spring is not a hard player, it is an impossible one. */
    const full = { ...newGame(7), population: CONFIG.population.room.base };
    const perYear = researchGain(full);
    const whole = TECHS.reduce((n, t) => n + t.cost, 0);
    expect(whole, 'the whole tree fits in a reign').toBeGreaterThan(perYear * CONFIG.hardCapTurn);

    // and no one sphere is so dear that a reign could never finish a path in it
    for (const sphere of SPHERES) {
      const cheapest = Math.min(
        ...PATHS.filter((p) => p.sphere === sphere.id).map((p) =>
          TECHS.filter((t) => t.path === p.id).reduce((n, t) => n + t.cost, 0),
        ),
      );
      expect(cheapest, `${sphere.id} has no path a reign could walk`).toBeLessThan(
        perYear * CONFIG.hardCapTurn,
      );
    }
  });

  it('39. what a step does off the boards is a number the engine already had', () => {
    /* room, answers and shelter are the ceiling, the crowd and the winter,
       reached from the tree. Each of them has to be worth something and none
       of them may be so large that one card rewrites the place. */
    for (const tech of TECHS) {
      for (const [field, cap] of [['room', 60], ['answers', 40], ['shelter', 6]] as const) {
        const value = tech[field];
        if (value === undefined) continue;
        expect(value, `${tech.id} ${field}`).toBeGreaterThan(0);
        expect(value, `${tech.id} ${field} is a whole new game`).toBeLessThanOrEqual(cap);
      }
    }
    // the ground raises the ceiling, the body answers for the crowd. If those
    // two ever swap, the three spheres stop meaning anything.
    const roomFrom = new Set(TECHS.filter((t) => t.room).map((t) => t.sphere));
    const answersFrom = new Set(TECHS.filter((t) => t.answers).map((t) => t.sphere));
    expect([...roomFrom].sort()).toEqual(['body', 'ground']);
    expect([...answersFrom]).toEqual(['body']);
    // and what the tree can add to the ceiling never doubles the valley
    const allRoom = TECHS.reduce((n, t) => n + (t.room ?? 0), 0);
    expect(allRoom, 'the tree is a bigger valley than the valley').toBeLessThan(
      CONFIG.population.room.base,
    );
  });

  /**
   * 40. No answer is a worse copy of another one on the same bench.
   *
   * The reading of a bench is in three parts: what happened, which law of
   * yours is standing, and what each word costs under it. A player reads
   * the three and picks; a player who cannot tell two words apart clicks.
   * So under every law that can be standing (and under none), for every two
   * answers the bench can reach at once, if one of them is at least as good
   * on every board once the crown's bill for breaking or bending the law is
   * added in, and better on one, then the worse one has to be *about*
   * something else: a flag none of the others sets, a layer on the town,
   * somebody coming back, souls, a decree, a step of Iva's, a verdict, or a
   * bond. Or it crosses the law harder, which is the one way a worse answer
   * is meant to be worse: the kind word that goes against the law pays the
   * crown for it, and the law's own word does not.
   *
   * What this found, before the numbers were moved: the healer thanked and
   * the healer within the law were the same answer with one of them eight
   * points warmer; the hunter asked was the widow acquitted with sixteen
   * points on top and nothing against it; the lever man pardoned beat the
   * law's own word under every law about lives; and the herd on the common
   * had three answers that were all free.
   */
  it('40. no answer is a worse copy of another under the same law', () => {
    const marks = (ch: CaseChoice): string =>
      [
        [...(ch.setFlags ?? [])].sort().join(','),
        [...(ch.cityFlagsOn ?? [])].sort().join(','),
        [...(ch.cityFlagsOff ?? [])].sort().join(','),
        ch.souls ?? 0,
        ch.schedule?.caseId ?? '',
        ch.enactLaw ? 'decree' : '',
        ch.setIva ?? '',
        ch.verdict ?? '',
        ch.bond ?? 0,
      ].join('|');

    /** How hard a word goes against a standing law: 0 clean, 1 bends, 2 breaks. */
    const crossing = (caseId: string, ch: CaseChoice, law: string | null): number => {
      if (ch.exceptionToLaw) return 2;
      if (!law) return 0;
      const ruling = CASE_VERDICTS[caseId]?.rulings.find((r) => r.choiceId === ch.id);
      const against = ruling?.against?.find((a) => a.law === law);
      return against?.how === 'breaks' ? 2 : against?.how === 'bends' ? 1 : 0;
    };
    const billed = (caseId: string, ch: CaseChoice, law: string | null): Effects => {
      const out: Effects = { ...ch.effects };
      const cost = [0, CONFIG.exceptionCost * CONFIG.bendShare, CONFIG.exceptionCost][
        crossing(caseId, ch, law)
      ];
      if (cost) out.crownSanity = (out.crownSanity ?? 0) - cost;
      return out;
    };
    const reachable = (event: CaseEvent, law: string | null): CaseChoice[] => {
      const grammar = CASE_VERDICTS[event.id];
      if (!grammar) return event.choices;
      return event.choices.filter((ch) =>
        grammar.rulings.some((r) => r.choiceId === ch.id && (!r.needsLaw || r.needsLaw === law)),
      );
    };

    for (const event of CASES) {
      const subject = subjectOf(event.id);
      const laws: (string | null)[] =
        subject && /^[vdcs]\d/.test(event.id)
          ? PROPOSALS.flatMap((p) => p.options).filter((o) => o.subject === subject).map(lawIdOf)
          : [null];
      for (const law of laws) {
        const rows = reachable(event, law).map((ch) => ({
          ch,
          fx: billed(event.id, ch, law),
          how: crossing(event.id, ch, law),
        }));
        for (const a of rows) {
          for (const b of rows) {
            if (a === b) continue;
            let atLeast = true;
            let better = false;
            for (const stat of STAT_IDS) {
              const x = a.fx[stat] ?? 0;
              const y = b.fx[stat] ?? 0;
              if (x < y) atLeast = false;
              if (x > y) better = true;
            }
            if (!atLeast || !better) continue;
            if (marks(a.ch) !== marks(b.ch)) continue;
            if (b.how > a.how) continue;
            expect.fail(
              `${event.id} under ${law ?? 'no law'}: ${b.ch.id} is ${a.ch.id} with worse numbers and nothing else`,
            );
          }
        }
      }
    }
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

  /**
   * The second person in a scene is a real person, in a real scene, and the
   * ruling that lands on them is a real answer. Everything that reads the log
   * to work out who you have met now reads this table as well, so a name
   * misspelled here is somebody who never gets remembered.
   */
  it('knows who else was standing in the room', () => {
    for (const [caseId, others] of Object.entries(ALSO_IN_SCENE)) {
      const event = CASES.find((c) => c.id === caseId);
      expect(event, `${caseId} is not a scene`).toBeDefined();
      for (const who of others) {
        expect(FOLK[who], `no look for ${who}`).toBeDefined();
        expect(AGES[who], `no age for ${who}`).toBeDefined();
        expect(CHARACTERS[who], `nothing to call ${who}`).toBeDefined();
        expect(who, `${caseId} lists the one at the door as well`).not.toBe(event!.character);
        // and they are actually named in it, or nobody could tell they were there
        const said = [event!.title, event!.question ?? '', ...event!.scene].join(' ');
        expect(said, `${caseId} never names ${who}`).toContain(CHARACTERS[who].label);
      }
    }
    for (const [key, doings] of Object.entries(CHOICE_DOING_OTHERS)) {
      const [caseId, choiceId] = key.split(':');
      const event = CASES.find((c) => c.id === caseId)!;
      expect(event, `${caseId} is not a scene`).toBeDefined();
      expect(event.choices.some((c) => c.id === choiceId), `${key} is not an answer`).toBe(true);
      for (const [who, doing] of Object.entries(doings)) {
        expect(ALSO_IN_SCENE[caseId] ?? [], `${key}: ${who} is not in that room`).toContain(who);
        expect(DOINGS, `${key} does something nobody can draw`).toContain(doing);
      }
    }
    for (const [key, moves] of Object.entries(CHOICE_BOND_OTHERS)) {
      const [caseId, choiceId] = key.split(':');
      const event = CASES.find((c) => c.id === caseId)!;
      expect(event, `${caseId} is not a scene`).toBeDefined();
      expect(event.choices.some((c) => c.id === choiceId), `${key} is not an answer`).toBe(true);
      for (const [who, delta] of Object.entries(moves)) {
        /* Only the ones who were not doing the talking. What the person at the
           door made of a ruling is read off the answer's own weight, and
           naming them here as well moves them twice. */
        expect(ALSO_IN_SCENE[caseId] ?? [], `${key}: ${who} spoke for themselves`).toContain(who);
        expect(Math.abs(delta), `${key} moves ${who} more than a reign should`)
          .toBeLessThanOrEqual(2);
        expect(delta, `${key} moves ${who} not at all`).not.toBe(0);
      }
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

describe('what has to be standing before a scene can happen', () => {
  /**
   * A scene cannot name a thing the place has not built.
   *
   * The hole in the fence comes after the fence, and a law about strangers is
   * not a fence. Every word below is a year of work somebody has to have
   * spent, so a scene that says one waits on the work in its own trigger, or
   * on the trigger of whatever puts it on the calendar. The list is short on
   * purpose: it holds the words that mean the built thing and nothing else.
   */
  const NEEDS_A_WORK: { work: WorkId; words: string[] }[] = [
    { work: 'well', words: ['the well'] },
    { work: 'fence', words: ['the gate', 'the gatepost', 'the fence line', 'the wall'] },
    { work: 'granary', words: ['the granary'] },
    { work: 'mine', words: ['the mine'] },
    { work: 'bridge', words: ['the bridge'] },
    { work: 'long_room', words: ['the long room'] },
    { work: 'watch_house', words: ['the watch house'] },
  ];

  /**
   * The three scenes that say one of those words about something else. A new
   * one needs a line here saying which other thing it means, which is the
   * whole point: it is cheaper to rewrite the sentence than to earn a row.
   */
  const MEANS_SOMETHING_ELSE: Record<string, string> = {
    t_town: 'the wall is what the charter asks for and what the place has not got round to',
    w_wolf_back: 'the gate is the one on the top pen, shut behind whatever came through it',
    w_brother_fire: 'the wall is the store\'s own, and it is still warm at dawn',
    /* Iva's gate is the mouth of the valley, which this place has called the
       gate since before anything hung there, and it is where the road comes
       in and where a girl of nine can sell a pie to somebody arriving. The
       fence's gate is a thing you shut; hers is a place you stand. She was
       moved to a market row once and put back, at the user's word. */
    d1_pies: 'the gate is the mouth of the road, and she sells pies at it',
    r3_iva_stall: 'the same gate, and the stall she was given at it',
    r3_iva_basket: 'the same gate, and the basket she is not selling at it',
  };

  /** Whether a trigger cannot be true unless this work stands. */
  const implies = (cond: Condition | null, work: WorkId): boolean => {
    if (cond === null) return false;
    if (cond.kind === 'built') return cond.work === work;
    if (cond.kind === 'all') return cond.conds.some((c) => implies(c, work));
    if (cond.kind === 'any') return cond.conds.every((c) => implies(c, work));
    return false;
  };

  /** Who puts a scene on the calendar, for the ones with no trigger of their own. */
  const parents = new Map<string, string[]>();
  for (const c of CASES) {
    for (const choice of c.choices) {
      if (!choice.schedule) continue;
      const list = parents.get(choice.schedule.caseId) ?? [];
      list.push(c.id);
      parents.set(choice.schedule.caseId, list);
    }
  }

  const waitsOn = (id: string, work: WorkId, seen = new Set<string>()): boolean => {
    if (seen.has(id)) return false;
    seen.add(id);
    const c = CASES.find((x) => x.id === id);
    if (!c) return false;
    if (implies(c.trigger, work)) return true;
    const up = parents.get(id) ?? [];
    return up.length > 0 && up.every((parent) => waitsOn(parent, work, seen));
  };

  it('never says a thing the place could not have built yet', () => {
    for (const c of CASES) {
      if (MEANS_SOMETHING_ELSE[c.id] !== undefined) continue;
      const said = [
        c.title,
        c.question ?? '',
        ...c.scene,
        ...c.choices.flatMap((choice) => [choice.text, choice.result]),
      ]
        .join(' ')
        .toLowerCase();
      for (const { work, words } of NEEDS_A_WORK) {
        const named = words.filter((w) => said.includes(w));
        if (named.length === 0) continue;
        expect(
          waitsOn(c.id, work),
          `${c.id} says "${named[0]}" without waiting on ${work}`,
        ).toBe(true);
      }
    }
  });

  it('keeps the four scenes that are about a building on that building', () => {
    const about: [string, WorkId][] = [
      ['v2_well', 'well'],
      ['rr_gate', 'fence'],
      ['d3_cart', 'mine'],
      ['d4_bridge', 'bridge'],
    ];
    for (const [id, work] of about) {
      const c = CASES.find((x) => x.id === id);
      expect(c, `${id} is gone`).toBeDefined();
      expect(implies(c!.trigger, work), `${id} stopped waiting on ${work}`).toBe(true);
    }
  });

  it('names an exception only for a scene that is still there', () => {
    for (const id of Object.keys(MEANS_SOMETHING_ELSE)) {
      expect(CASES.some((c) => c.id === id), `${id} is excused and does not exist`).toBe(true);
    }
  });
});
