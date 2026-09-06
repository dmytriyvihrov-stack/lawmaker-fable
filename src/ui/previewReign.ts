import { newGame } from '../engine/reducer';
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
  const base = newGame(20260904);
  return {
    ...base,
    turn: 22,
    phase: 'portrait',
    stats: { crownSanity: 62, mood: 74, health: 58, economy: 66, army: 44, culture: 51 },
    population: 110,
    stage: 'town',
    townSince: 12,
    townName: 'Beckhold',
    boards: ['army', 'culture'],
    buildings: { ...base.buildings, well: 2, granary: 1, hall: 1, fields: 2 },
    declaredTag: 'egalitarian',
    laws: [
      { subject: 'work', action: 'shared', label: 'The work of this place is shared', turn: 2, status: 'active' },
      { subject: 'trade', action: 'free', label: 'All trade in this town is free', turn: 6, status: 'active' },
      { subject: 'crime', action: 'forgiven', label: 'A hand that takes is forgiven', turn: 11, status: 'active' },
    ],
    exceptions: [{ law: 'trade_free', beneficiary: 'the bakers', turn: 9 }],
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
