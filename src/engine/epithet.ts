import { EPITHETS, type EpithetDef } from '../content/epithets';
import type { GameState, WorkId } from './types';

/**
 * What the place calls you, worked out from what you have actually done.
 *
 * A pure function of the state, like the monarch is a pure function of the
 * seed: nothing is stored, nothing can drift out of step with the record, and
 * a reign that goes back on itself loses the name again. The list in content
 * is read in order and the first test that holds wins, so the strongest claim
 * on you is the one at the top of it.
 */
export function epithetOf(s: GameState): EpithetDef | null {
  const bent = s.exceptions.length;
  const sealed = s.laws.length;
  // a year of rest is a year spent on nothing, on purpose, and nothing is left
  // standing to point at afterwards
  const built = (Object.entries(s.buildings) as [WorkId, number][])
    .filter(([id]) => id !== 'rest')
    .reduce((sum, [, level]) => sum + level, 0);

  for (const epithet of EPITHETS) {
    if (epithet.id === 'open_hand' && bent >= 2) return epithet;
    if (epithet.id === 'unbending' && sealed >= 3 && bent === 0) return epithet;
    if (epithet.id === 'builder' && built >= 2) return epithet;
  }
  return null;
}
