import {
  CASE_VERDICTS,
  VERDICT_OBJECTS,
  VERDICT_VERBS,
  formatRuling,
  type CaseVerdict,
  type Ruling,
  type WordTile,
} from '../content/verdict-words';
import { CONFIG } from './config';
import { rand01 } from './rng';
import type { CaseChoice, CaseEvent, GameState, LawId, Verdict } from './types';

/**
 * Parsing the bench. The player writes a sentence out of tiles; this turns it
 * back into one of the case's authored outcomes. A sentence with an object
 * beats a sentence without one, so "PAYS IN BUNS" and "PAYS" can rule
 * differently while sharing a verb.
 *
 * Some sentences are only available while one of your own laws is standing.
 * Those words carry the number of the law that granted them.
 */

/** A standing law, named the way the bench names it: the decree and its number. */
export interface NamedLaw {
  law: LawId;
  label: string;
  index: number;
}

/** What a word on the bench does to a law of yours that is standing right now. */
export interface Breach extends NamedLaw {
  how: 'breaks' | 'bends';
  beneficiary: string;
  result: string;
}

export interface GrantedWord extends WordTile {
  /** The law that put this word on the bench, when one did. */
  grantedBy?: NamedLaw;
  /**
   * The law this word goes against, when one of yours is standing that it
   * does. A word that was always on the bench can still be a breach: the law
   * came after the word and changed what it means.
   */
  against?: Breach;
}

/**
 * Whether the person standing there actually did it. Deterministic from the
 * seed, never stored, never shown. The scene leans one way by a hair and that
 * is the whole of what anybody gets. Two reigns on one seed convict the same
 * innocents, which is what makes this a fact about the place and not a coin.
 */
export function truthOf(seed: number, caseId: string): Verdict {
  return rand01(seed, 'truth', caseId) < CONFIG.trial.guiltyChance ? 'guilty' : 'innocent';
}

/** Convictions that were wrong, counted off the seed rather than off the save. */
export function wrongfulConvictions(s: GameState): number {
  return s.verdicts.filter(
    (v) => v.ruled === 'guilty' && truthOf(s.seed, v.caseId) === 'innocent',
  ).length;
}

/** The guilty you let walk. They tend to come back. */
export function mistakenAcquittals(s: GameState): number {
  return s.verdicts.filter(
    (v) => v.ruled === 'innocent' && truthOf(s.seed, v.caseId) === 'guilty',
  ).length;
}

export interface ParsedVerdict {
  choiceId: string;
  sentence: string;
  /** The standing law this sentence crosses, if it crosses one. */
  against?: Breach;
}

export function verdictFor(caseId: string): CaseVerdict | undefined {
  return CASE_VERDICTS[caseId];
}

/** The standing law behind a granted word, with its number in the Codex. */
function activeLaw(s: GameState, law: LawId): { label: string; index: number } | null {
  for (let i = s.laws.length - 1; i >= 0; i--) {
    const entry = s.laws[i];
    if (entry.status !== 'active') continue;
    if (`${entry.subject}_${entry.action}` !== law) continue;
    return { label: entry.label, index: i + 1 };
  }
  return null;
}

/** Rulings the bench can actually write down right now. */
export function availableRulings(caseId: string, s: GameState): Ruling[] {
  const grammar = CASE_VERDICTS[caseId];
  if (!grammar) return [];
  return grammar.rulings.filter((r) => !r.needsLaw || activeLaw(s, r.needsLaw) !== null);
}

/**
 * The law a ruling goes against, given what is standing today.
 *
 * A ruling lists what it is under each law of its subject; one law of a
 * subject stands at a time, so at most one entry applies, and none applies in
 * a place that has written no law about it yet.
 */
function breachOf(ruling: Ruling, s: GameState): Breach | null {
  for (const entry of ruling.against ?? []) {
    const law = activeLaw(s, entry.law);
    if (!law) continue;
    return {
      law: entry.law,
      label: law.label,
      index: law.index,
      how: entry.how,
      beneficiary: entry.beneficiary ?? 'someone',
      result: entry.result,
    };
  }
  return null;
}

/**
 * What ruling this way does to a law of yours, right now. Read by the reducer
 * when the answer lands, so the bench and the bill agree.
 */
export function breachFor(caseId: string, choiceId: string, s: GameState): Breach | null {
  const grammar = CASE_VERDICTS[caseId];
  if (!grammar) return null;
  for (const ruling of grammar.rulings) {
    if (ruling.choiceId !== choiceId) continue;
    const found = breachOf(ruling, s);
    if (found) return found;
  }
  return null;
}

/** Verb tiles for this case, base words first, law granted words after. */
export function availableVerbs(caseId: string, s: GameState): GrantedWord[] {
  const grammar = CASE_VERDICTS[caseId];
  if (!grammar) return [];

  const out: GrantedWord[] = [];
  for (const tile of VERDICT_VERBS) {
    if (!grammar.verbs.includes(tile.id)) continue;
    // a base word can cross a law that was written after it
    const ruling = grammar.rulings.find((r) => r.verb === tile.id && !r.needsLaw);
    const against = ruling ? breachOf(ruling, s) : null;
    out.push(against ? { ...tile, against } : { ...tile });
  }

  const seen = new Set(out.map((w) => w.id));
  for (const ruling of grammar.rulings) {
    if (!ruling.needsLaw || seen.has(ruling.verb)) continue;
    const law = activeLaw(s, ruling.needsLaw);
    if (!law) continue;
    const tile = VERDICT_VERBS.find((v) => v.id === ruling.verb);
    if (!tile) continue;
    seen.add(tile.id);
    out.push({ ...tile, grantedBy: { law: ruling.needsLaw, label: law.label, index: law.index } });
  }
  return out;
}

export function availableObjects(caseId: string): WordTile[] {
  const grammar = CASE_VERDICTS[caseId];
  if (!grammar) return [];
  return VERDICT_OBJECTS.filter((o) => grammar.objects.includes(o.id));
}

export function parseVerdict(
  caseId: string,
  verbId: string | null,
  objectId: string | null,
  s: GameState,
): ParsedVerdict | null {
  const grammar = CASE_VERDICTS[caseId];
  if (!grammar || !verbId) return null;

  const rulings = availableRulings(caseId, s);
  const exact =
    objectId === null
      ? undefined
      : rulings.find((r) => r.verb === verbId && r.object === objectId);
  const loose = rulings.find((r) => r.verb === verbId && r.object === undefined);
  const match = exact ?? loose;
  if (!match) return null;

  const against = breachOf(match, s);
  return {
    choiceId: match.choiceId,
    sentence: formatRuling(caseId, verbId, objectId ?? undefined),
    ...(against ? { against } : {}),
  };
}

/** The outcome a sentence resolves to, so the bench can show what it will do. */
export function choiceOf(event: CaseEvent, parsed: ParsedVerdict | null): CaseChoice | undefined {
  if (!parsed) return undefined;
  return event.choices.find((c) => c.id === parsed.choiceId);
}

/** Objects that decide an outcome rather than just colouring one. */
export function decisiveObjects(caseId: string): Set<string> {
  const grammar = CASE_VERDICTS[caseId];
  if (!grammar) return new Set();
  return new Set(grammar.rulings.map((r) => r.object).filter((o): o is string => o !== undefined));
}

/**
 * Whether an object may sit next to this verb. A decisive object belongs to the
 * verb it rules with, so "GOES FREE IN BUNS" can never be written down.
 */
export function objectAllowed(caseId: string, verbId: string | null, objectId: string): boolean {
  const grammar = CASE_VERDICTS[caseId];
  if (!grammar) return false;
  if (!verbId) return true;
  if (!decisiveObjects(caseId).has(objectId)) return true;
  return grammar.rulings.some((r) => r.verb === verbId && r.object === objectId);
}

/** Every choice a case can reach through its grammar. Used by the validator. */
export function reachableChoiceIds(caseId: string): string[] {
  const grammar = CASE_VERDICTS[caseId];
  if (!grammar) return [];
  return [...new Set(grammar.rulings.map((r) => r.choiceId))];
}

/** Choices that need one of your laws standing before they can be ruled. */
export function lawGatedChoiceIds(caseId: string): Set<string> {
  const grammar = CASE_VERDICTS[caseId];
  if (!grammar) return new Set();
  const free = new Set(
    grammar.rulings.filter((r) => !r.needsLaw).map((r) => r.choiceId),
  );
  return new Set(
    grammar.rulings
      .filter((r) => r.needsLaw !== undefined && !free.has(r.choiceId))
      .map((r) => r.choiceId),
  );
}
