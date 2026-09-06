import { beginAt } from '../engine/chapters';
import type { GameState } from '../engine/types';

/**
 * A reign that never happened, for looking at the closing screen with.
 *
 * The last screen in this game is twenty two years away from the first one,
 * which is right for a player and useless for anybody who wants to see whether
 * the thing at the bottom of it is the right size. `?see=end` on the built file
 * opens it on this.
 *
 * It is a fixture and not a playthrough: the fields are set rather than earned,
 * so nothing here is evidence about whether the rules work. It never touches
 * the save, because the screen it feeds is returned before the reducer this
 * app runs on ever holds a state, and the save is written from that state.
 */
export function previewReign(): GameState {
  // the same fabricated town every chapter door opens on, carried to its last
  // year: one fixture in the engine, and this is the closing screen's view of it
  const base = beginAt('town', 20260904);
  return {
    ...base,
    turn: 22,
    phase: 'portrait',
    population: 110,
    townSince: 12,
    townName: 'Beckhold',
    log: [
      { turn: 2, kind: 'case', refId: 'v1_idle_hand', choiceId: 'feed_him', tags: ['communitarian'] },
      { turn: 3, kind: 'case', refId: 'd1_pies', choiceId: 'reward', tags: ['communitarian'] },
      { turn: 5, kind: 'case', refId: 'v5_winter_ground', choiceId: 'burn_the_wood', tags: ['utilitarian'] },
      { turn: 8, kind: 'case', refId: 'd6_door', choiceId: 'acquit', tags: ['kantian'] },
      { turn: 12, kind: 'case', refId: 'w_grain', choiceId: 'open_stores', tags: ['egalitarian'] },
      { turn: 16, kind: 'case', refId: 'c1_lark', choiceId: 'coat_back', tags: ['kantian'] },
      { turn: 19, kind: 'case', refId: 'w_corner', choiceId: 'she_is_asked', tags: ['kantian'] },
    ],
  };
}
