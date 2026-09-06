import { MOMENTS, MOMENT_SOURCE } from '../content/moments';
import type { Moment } from '../content/moments';
import { rand01 } from './rng';
import type { GameState, Season } from './types';

/**
 * Which of the small things are out there this year.
 *
 * Two of them, never four, so the map is never a row of buttons and a year is
 * never the same year twice. Which two comes off the seed and the turn, so a
 * reign reloaded from a save finds the same two where it left them.
 *
 * "Already done" is read off the ledger rather than kept in the save: taking
 * one writes a line under `MOMENT_SOURCE` in the year it happened, and that
 * line is the record. Nothing new goes into `GameState` for this, which is
 * also why an old save opens with all of them waiting.
 */
export const MOMENTS_PER_YEAR = 2;

export function momentTaken(s: GameState, id: string): boolean {
  return s.ledger.some(
    (line) => line.turn === s.turn && line.source === `${MOMENT_SOURCE}: ${id}`,
  );
}

/** Everything the weather and the year allow, before anybody has done any of it. */
export function momentsOfYear(s: GameState, season: Season): Moment[] {
  const fit = MOMENTS.filter((m) => m.seasons === undefined || m.seasons.includes(season));
  if (fit.length <= MOMENTS_PER_YEAR) return fit;
  // deal them off the seed: sort by a number that is stable for this year
  return [...fit]
    .sort(
      (a, b) =>
        rand01(s.seed, 'moment', s.turn, a.id) - rand01(s.seed, 'moment', s.turn, b.id),
    )
    .slice(0, MOMENTS_PER_YEAR);
}

/** And of those, the ones still standing there waiting. */
export function momentsNow(s: GameState, season: Season): Moment[] {
  return momentsOfYear(s, season).filter((m) => !momentTaken(s, m.id));
}

export function getMoment(id: string): Moment | undefined {
  return MOMENTS.find((m) => m.id === id);
}
