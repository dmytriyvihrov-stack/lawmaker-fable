import { MONARCHS, type MonarchDef, type MonarchTrait } from '../content/monarchs';
import { rand01 } from './rng';

/**
 * The monarch of a reign is a pure function of the seed: no new state field,
 * no extra save data, and the same seed always crowns the same person.
 */
export function monarchOf(seed: number): MonarchDef {
  const roll = rand01(seed, 'monarch');
  const index = Math.min(MONARCHS.length - 1, Math.floor(roll * MONARCHS.length));
  return MONARCHS[index];
}

export function traitOf(seed: number): MonarchTrait {
  return monarchOf(seed).trait;
}

/**
 * Nobody upstairs is getting any younger. A year of your reign is a year of
 * theirs, so the age is the age they were crowned at plus the years you have
 * been holding the seal. Turn 0 is the opening, before the first spring.
 */
export function monarchAge(seed: number, turn: number): number {
  return monarchOf(seed).age + Math.max(0, turn - 1);
}
