import { UI } from '../content/ui-strings';
import { CONFIG } from './config';
import { bump } from './reducer';
import { isActiveStat, storeCap } from './simulation';
import type { GameState, StatId } from './types';

/**
 * A hand on the dials, while the reign is running.
 *
 * Everything in this file is dev only and nothing in the game reaches it. It
 * exists because the one question a playtester asks that the game cannot
 * answer is "what does this screen look like when the square has had enough" -
 * and the honest way to find out took eleven years of play, or a fixture, or
 * the console.
 *
 * It turns dials. It does not invent rules for them: a board still moves
 * through `bump`, which means it is still held between nought and a hundred,
 * the store is still under its lid, and every turn of a dial leaves its line
 * in the ledger saying a hand did it. A board the place is too small to have
 * is refused here exactly as it is refused everywhere else; the panel offers
 * to open it instead, which is the move the place itself would make.
 *
 * The three that are not boards are set rather than bumped, because they are
 * counts and not feelings, and none of them has a ledger to write to.
 */

/** Everything the panel can turn: the six boards, and three counts. */
export type DialId = StatId | 'population' | 'research' | 'turn';

/** The counts, which are whole numbers and have no ledger. */
const COUNTS: DialId[] = ['population', 'research', 'turn'];

export function isCount(dial: DialId): boolean {
  return COUNTS.includes(dial);
}

export function dialValue(s: GameState, dial: DialId): number {
  if (dial === 'population') return s.population;
  if (dial === 'research') return s.research;
  if (dial === 'turn') return s.turn;
  return s.stats[dial];
}

/**
 * The lid on a dial, when it has one worth showing. The store is the only
 * board that stops short of a hundred, and a granary is what lifts it; a panel
 * that does not say so looks broken the first time a dial refuses to move.
 */
export function dialCeiling(s: GameState, dial: DialId): number | null {
  if (dial === 'economy') return storeCap(s);
  if (isCount(dial)) return null;
  return CONFIG.statMax;
}

/**
 * Turn one dial by hand.
 *
 * A board goes through `bump`, so it obeys every rule a board obeys and says
 * in the ledger that it was turned rather than earned. The year is the one
 * dial that moves the calendar without living through it: nothing is applied
 * for the years skipped, which is the point - it is for arriving at the long
 * winter this afternoon, not for pretending eight years happened.
 */
export function turnDial(s: GameState, dial: DialId, delta: number): GameState {
  if (delta === 0) return s;

  if (isCount(dial)) {
    const key = dial as 'population' | 'research' | 'turn';
    const next = Math.max(0, Math.round(dialValue(s, dial) + delta));
    return next === dialValue(s, dial) ? s : { ...s, [key]: next };
  }

  const stat = dial as StatId;
  if (!isActiveStat(s, stat)) return s;
  /* Only the two things `bump` writes to are copied. It is a mutating call on
     purpose - the reducer drafts a whole state and bumps it a dozen times -
     and one dial is not a reason to deep copy a reign. */
  const draft: GameState = { ...s, stats: { ...s.stats }, ledger: [...s.ledger] };
  bump(draft, stat, delta, UI.dev.hand);
  return draft;
}
