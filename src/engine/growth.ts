import { CONFIG } from './config';
import { allTechs } from './registry';
import { OPENABLE_BOARDS, yearlyChange } from './simulation';
import { GROWTH_MARKS } from '../content/growth-marks';
import type { GameState, StatId, TechDef } from './types';

/**
 * One rung of the ladder the place climbs by getting bigger.
 *
 * The tree above it is paid for out of good years; this is paid for out of
 * nothing at all. Two of its rungs are the only place in the game where growing
 * is a decision rather than a number: at the first count the place can carry
 * one more board, at the second it can carry the other, and which one comes
 * first is what kind of settlement this is on the way up.
 */
export interface GrowthStep {
  /** Souls the place needs to stand on this rung. */
  at: number;
  title: string;
  line: string;
  /** The same rung at the width of a tick on the bar: two or three words. */
  short: string;
  /** Boards the place gains here. */
  boards: StatId[];
  /** True when those boards are an either/or rather than a gift. */
  choose: boolean;
  /**
   * The place has been here and the question is settled. A rung that asked
   * something once has to say what the answer was afterwards: a card still
   * offering both boards to a town that took the watch in year eleven and the
   * songs in year twenty is the screen calling the reign a liar.
   */
  taken?: boolean;
  /** What becomes thinkable at this count. */
  techs: TechDef[];
  reached: boolean;
  /**
   * The two rungs where the place stops being what it was.
   *
   * A charter and a crown are not the same kind of news as a rota, and the
   * ladder used to draw all nine rungs as one row of equal cards with the
   * biggest two somewhere in the middle of it.
   */
  stage?: 'town' | 'kingdom';
}

/**
 * The whole ladder, built out of the rules rather than typed out beside them:
 * the counts the config owns, plus one rung for every distinct crowd a thing on
 * the tree is waiting for. Rungs that land on the same count are one rung,
 * because the place only arrives there once.
 */
export function growthLadder(s: GameState): GrowthStep[] {
  const steps = new Map<number, GrowthStep>();

  const put = (at: number, title: string, line: string, short = title): GrowthStep => {
    const found = steps.get(at);
    if (found) return found;
    const step: GrowthStep = {
      at,
      title,
      line,
      short,
      boards: [],
      choose: false,
      techs: [],
      reached: false,
    };
    steps.set(at, step);
    return step;
  };

  /* Not the rumour. The cog fades up over the bar from `hintFrom` souls and
     that is a fact about the bar, not a rung: nothing opens at eight of you,
     and a bar of what the count opens had a tick on it that opened nothing
     (T-LADDER-1). The first rung is the count the screen actually opens at. */
  const M = GROWTH_MARKS;
  put(CONFIG.research.openAt, M.open.title, M.open.line, M.open.short);

  /* The two rungs the player actually decides, and what they decided.

     Before the count is reached these are a question: both boards, pick one.
     Afterwards they are a record, and the record is what the place did, in
     the order it did it. `s.boards` is written in the order they were opened,
     which is the only place that order is kept. */
  const first = put(CONFIG.boards.firstAt, M.first.title, M.first.line, M.first.short);
  const took = s.boards;
  if (took.length >= 1) {
    first.boards = [took[0]];
    first.taken = true;
  } else {
    first.boards = [...OPENABLE_BOARDS];
    first.choose = true;
  }

  const second = put(CONFIG.boards.secondAt, M.second.title, M.second.line, M.second.short);
  if (took.length >= 2) {
    second.boards = [took[1]];
    second.taken = true;
  } else {
    const left = OPENABLE_BOARDS.filter((b) => !took.includes(b));
    second.boards = left.length > 0 ? left : [...OPENABLE_BOARDS];
  }

  const charter = put(CONFIG.town.at, M.charter.title, M.charter.line, M.charter.short);
  charter.stage = 'town';

  /* And the last rung, which was on nobody's ladder. A place of three
     hundred is a kingdom with neighbours on a map, three things a year of
     work can be spent abroad and a stage of its own, and the one screen in
     the game that says what a count opens did not mention it. */
  const crown = put(CONFIG.kingdom.at, M.crown.title, M.crown.line, M.crown.short);
  crown.stage = 'kingdom';

  for (const tech of allTechs()) {
    if (tech.needsSouls === undefined) continue;
    const step = put(tech.needsSouls, tech.name, tech.line);
    step.techs.push(tech);
    // two things thinkable at one count are one tick with two names on it
    if (step.techs.length > 1) step.short = step.techs.map((t) => t.name).join(', ');
  }

  const ladder = [...steps.values()].sort((a, b) => a.at - b.at);
  for (const step of ladder) step.reached = s.population >= step.at;
  return ladder;
}

/** The rung the place is walking towards, or null when it is on the last one. */
export function nextRung(s: GameState): GrowthStep | null {
  return growthLadder(s).find((step) => !step.reached) ?? null;
}

/**
 * Roughly how many years to the next rung at this year's rate. Null when the
 * place is not growing towards it at all, which is a real answer and a colder
 * one than a large number.
 */
export function yearsToRung(s: GameState, step: GrowthStep): number | null {
  const perYear = yearlyChange(s);
  if (perYear <= 0) return null;
  return Math.max(1, Math.ceil((step.at - s.population) / perYear));
}
