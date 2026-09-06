import { rand01 } from '../engine/rng';
import type { Season, Stage } from '../engine/types';

/**
 * What a season is doing while nobody is at your door.
 *
 * The year of work is spent in autumn, which for a long time made autumn the
 * only season that happened. These are the other three: not decisions, and not
 * boards moving, just the place getting on with a year in a way that is
 * different in April from the way it is different in August. Picked from the
 * seed and the year, so the same reign always has the same weather in it.
 */

interface SeasonLines {
  /** Everything a season might be doing. */
  any: string[];
  /** And what it is doing in a place of five, when that is a different thing. */
  hamlet?: string[];
  /** And in a place of five hundred. */
  town?: string[];
}

const LINES: Record<Season, SeasonLines> = {
  spring: {
    any: [
      'The ground is soft enough to argue about where one field ends.',
      'Somebody has planted a hedge slightly to the left of where it was.',
      'The stream comes up over the low path and takes a fence with it.',
      'Every roof in the place is being complained about at once.',
    ],
    hamlet: [
      'Five people plant a field in four days and spend the fifth looking at it.',
      'The first lamb of the year is named after you, which is not entirely kind.',
    ],
    town: [
      'The carts come back to the road and the road remembers why it hates them.',
      'Two hundred people plant at once and nobody agrees on the day to start.',
    ],
  },
  summer: {
    any: [
      'It is too hot to work and everybody works anyway, badly, and says so.',
      'The well is the most important place in the world for about six weeks.',
      'Somebody counts the store twice and gets two answers, both of them fine.',
      'Somebody sleeps outside for a week and reports back on it, at length.',
    ],
    hamlet: [
      'Five people sit out after dark because the huts are unbearable, and talk.',
      'The one shaded wall in the place has a rota nobody wrote down.',
    ],
    town: [
      'The square smells of the tannery and everyone has agreed not to mention it.',
      'Somebody sells cold water at a price and is not quite forgiven for it.',
    ],
  },
  autumn: {
    any: [
      'The year is counted, and the counting takes longer than the harvest.',
      'Everything that can be dried is drying, on every surface there is.',
      'The good weather holds one week longer than anybody planned for.',
      'The last cart in from the field goes past slowly, to be looked at.',
    ],
    hamlet: [
      'Five people bring in a harvest and eat a third of it that evening.',
      'The store is full for eleven days, which is the best part of the year.',
    ],
    town: [
      'The granary queue is orderly, which the Captain finds slightly suspicious.',
      'The market runs late every night and nobody official closes it.',
    ],
  },
  winter: {
    any: [
      'Nothing is done, everything is mended, and the mending is not enough.',
      'The days are short and every argument in the place is had indoors.',
      'A wolf is heard, discussed for a month, and never seen by anybody.',
      'Somebody works out how far the store goes and does not say the number.',
    ],
    hamlet: [
      'Five people spend a month in one room and come out still speaking.',
      'The fire is banked, the door is shut, and the year is simply endured.',
    ],
    town: [
      'The bell is rung for the dark days, and rung again because it helps.',
      'Firewood costs what firewood costs, and the square says so all winter.',
    ],
  },
};

/**
 * One line for this season of this year. Deterministic: the same seed and the
 * same year always give the same line, so a reign is a reign and not a shuffle.
 */
export function seasonLine(seed: number, turn: number, season: Season, stage: Stage): string {
  const set = LINES[season];
  const pool = [...set.any, ...(stage === 'village' ? (set.hamlet ?? []) : (set.town ?? []))];
  const roll = rand01(seed, 'season-line', turn, season, stage);
  return pool[Math.floor(roll * pool.length) % pool.length];
}
