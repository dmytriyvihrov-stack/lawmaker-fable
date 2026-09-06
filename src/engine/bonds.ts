import { CONFIG } from './config';
import { doingsNow } from './folk';
import type { Bond, BondLevel, CaseChoice, GameState } from './types';

/**
 * What stands between the person holding the seal and everybody who has stood
 * in front of it.
 *
 * Every other number in this game is about the place. This one is about one
 * person at a time, and it is the only number a lawmaker can spend on somebody
 * rather than on something. Two levers and no more: a thing put in their hands
 * every other year, and the one that is not a lever at all, because it is only
 * open once it has already happened.
 */

/** The square, the crown and the animals are not people you can be liked by. */
const NOT_A_PERSON = ['monarch', 'crowd', 'wolf'];

export function isPerson(character: string | undefined): character is string {
  return character !== undefined && !NOT_A_PERSON.includes(character);
}

const NEUTRAL: Bond = { level: 0 };

export function bondOf(s: GameState, character: string): Bond {
  return s.bonds?.[character] ?? NEUTRAL;
}

export function bondLevel(s: GameState, character: string): BondLevel {
  return bondOf(s, character).level;
}

/** Whoever is gone is gone. A reign does not keep loving an empty house. */
export function loverOf(s: GameState): string | null {
  const who = s.lover ?? null;
  if (who === null) return null;
  return doingsNow(s).get(who) === 'gone' ? null : who;
}

export function isLover(s: GameState, character: string | undefined): boolean {
  return character !== undefined && loverOf(s) === character;
}

const clamp = (n: number): BondLevel =>
  Math.max(-2, Math.min(2, Math.round(n))) as BondLevel;

/**
 * Move one person's opinion of you, in place, on a draft the reducer owns.
 * Nothing else in the engine writes to `bonds`.
 */
export function nudgeBond(draft: GameState, character: string, delta: number): void {
  if (!isPerson(character) || delta === 0) return;
  const bonds = draft.bonds ?? {};
  const now = bonds[character] ?? NEUTRAL;
  const next = clamp(now.level + delta);
  if (next === now.level && draft.bonds !== undefined) return;
  draft.bonds = { ...bonds, [character]: { ...now, level: next } };
  // somebody who has stopped loving you has stopped being yours, on the day
  if (next < 2 && draft.lover === character) draft.lover = null;
}

/**
 * What an answer says about the person who brought it, when content has not
 * said so itself.
 *
 * A verdict is the plainest case in the game: the bench either believed them
 * or did not, and they were standing there for it. Everything else is read off
 * the weight of the answer, because a place reads a ruling by whether it was
 * hard on somebody or not, and the square is the board that says so.
 *
 * Bending your own law is deliberately not read as anything. It looked like
 * the loudest kindness a lawmaker has until you notice that half the exceptions
 * in this game are bent against the person standing there: cutting Tam's share
 * breaks the law that says work is shared, and it is not a favour to Tam. The
 * store is not read either, for the same reason in reverse: an answer that
 * fills the store is very often an answer somebody paid for.
 */
export function bondFromChoice(choice: CaseChoice): number {
  if (choice.bond !== undefined) return choice.bond;
  if (choice.verdict === 'guilty') return -1;
  if (choice.verdict === 'innocent') return 1;
  const mood = choice.effects.mood ?? 0;
  const felt = mood !== 0 ? mood : (choice.effects.health ?? 0);
  return felt > 0 ? 1 : felt < 0 ? -1 : 0;
}

/** Why a gift cannot be given, or null when it can. */
export type GiftBlock = 'gone' | 'top' | 'waiting' | 'poor' | null;

export function giftBlock(s: GameState, character: string): GiftBlock {
  if (!isPerson(character)) return 'gone';
  if (doingsNow(s).get(character) === 'gone') return 'gone';
  const bond = bondOf(s, character);
  if (bond.level >= 2) return 'top';
  if (bond.giftTurn !== undefined && s.turn - bond.giftTurn < CONFIG.bond.giftEvery) {
    return 'waiting';
  }
  if (s.stats.economy < CONFIG.bond.giftCost) return 'poor';
  return null;
}

/** The year the same person could be given something again. */
export function giftAgainAt(s: GameState, character: string): number {
  return (bondOf(s, character).giftTurn ?? s.turn) + CONFIG.bond.giftEvery;
}

/** Why you cannot take somebody, or null when you can. */
export type LoverBlock = 'gone' | 'needs' | 'taken' | 'poor' | null;

export function loverBlock(s: GameState, character: string): LoverBlock {
  if (!isPerson(character)) return 'gone';
  if (doingsNow(s).get(character) === 'gone') return 'gone';
  const held = loverOf(s);
  if (held !== null && held !== character) return 'taken';
  if (held === character) return null;
  if (bondLevel(s, character) < 2) return 'needs';
  if (s.stats.economy < CONFIG.bond.loverCost) return 'poor';
  return null;
}
