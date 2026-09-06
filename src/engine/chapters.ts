import { newGame } from './reducer';
import { rand01 } from './rng';
import { openWorld } from './world';
import { FIRST_WORDS, SECOND_WORDS, joinTownName } from '../content/town-names';
import type { GameState, Stage } from './types';

/**
 * A reign that never happened, opened at the chapter you want to look at.
 *
 * The three stages of this game are ten years apart from each other, which is
 * right for a player and useless for anybody who has to see whether the town
 * reads at a hundred and fifty souls or whether the map is the right size. The
 * dev switch on the title screen and `?chapter=` on the URL both come here.
 *
 * These are fixtures and not playthroughs: the fields are set rather than
 * earned, so nothing here is evidence about whether the rules work. What they
 * do guarantee is that the engine cannot tell the difference: every one of
 * them is a legal state the scheduler can find a next event in, and the reign
 * plays on from it. `tests/chapters.test.ts` is what holds that true.
 *
 * All three carry `kingdom_open`, so a dev reign started at the hamlet grows
 * all the way through on its own.
 */

/** The name the place would have given itself on this seed. */
function nameFor(seed: number): string {
  const first = FIRST_WORDS[Math.floor(rand01(seed, 'name', 'first') * FIRST_WORDS.length)];
  const second = SECOND_WORDS[Math.floor(rand01(seed, 'name', 'second') * SECOND_WORDS.length)];
  return joinTownName(first.text, second.text);
}

/** A hamlet on its first spring, with the road to the crown left open. */
function hamlet(seed: number): GameState {
  const base = newGame(seed);
  return { ...base, flags: [...base.flags, 'kingdom_open'] };
}

/**
 * The middle of a reign: a chartered town of a hundred and thirty, three laws
 * standing, half a dozen years of work behind it, in the autumn where a year
 * is spent.
 */
function town(seed: number): GameState {
  const base = hamlet(seed);
  return {
    ...base,
    turn: 12,
    phase: 'works',
    // the store sits under its own lid: `storeCap` is 15 plus 35 a granary, and
    // a fixture that starts over it gets snapped down by the first thing that
    // touches the store, which then wears the whole drop in the ledger
    stats: { crownSanity: 62, mood: 74, health: 58, economy: 44, army: 44, culture: 51 },
    population: 130,
    stage: 'town',
    townSince: 9,
    townName: nameFor(seed),
    boards: ['army', 'culture'],
    buildings: { ...base.buildings, well: 2, granary: 1, hall: 1, fields: 2 },
    declaredTag: 'egalitarian',
    lastLawTurn: 11,
    lastWorkTurn: 11,
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
    ],
  };
}

/**
 * A kingdom in its first years: three hundred and twenty souls, a fourth law,
 * and five neighbours who have been there all along.
 */
function kingdom(seed: number): GameState {
  const base = town(seed);
  const grown: GameState = {
    ...base,
    turn: 20,
    population: 320,
    stage: 'kingdom',
    kingdomSince: 20,
    lastLawTurn: 19,
    lastWorkTurn: 19,
    flags: [...base.flags, 'became_town', 'became_kingdom'],
    laws: [
      ...base.laws,
      { subject: 'strangers', action: 'welcomed', label: 'A stranger at this gate is welcomed', turn: 15, status: 'active' },
    ],
  };
  return { ...grown, world: openWorld(grown) };
}

/** One fabricated reign per stage, and the only place any of them is written. */
export function beginAt(chapter: Stage, seed: number): GameState {
  if (chapter === 'town') return town(seed);
  if (chapter === 'kingdom') return kingdom(seed);
  return hamlet(seed);
}
