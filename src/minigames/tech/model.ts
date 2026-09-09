import { CONFIG } from '../../engine/config';
import { PATHS, TECHS } from './content';
import type { Effect, PathId, SphereId, TechDef, TechId } from './content';

/**
 * The tree as a choice: the years.
 *
 * Pure functions, state in and state out, the way the engine is written. The
 * bench keeps its own small state rather than a `GameState`, because the only
 * things it has to know are the year, the count, what is known, what is being
 * worked out and what is waiting in the pot. The numbers a reign already owns
 * (where the count starts, the ground rate, the charter, the crown, the room
 * the valley has before anybody improves it, how often the long winter comes)
 * are read off `CONFIG` so the bench and the game agree about them.
 */

export type Stage = 'hamlet' | 'town' | 'kingdom';

export type LogLine =
  | { year: number; kind: 'learned'; tech: TechId }
  | { year: number; kind: 'winter'; lost: number; had: number }
  | { year: number; kind: 'stage'; stage: Stage };

export interface TechState {
  year: number;
  /** A float, like the engine's own count. Rounded at the edge, in the component. */
  souls: number;
  /** The highest the place has been. A winter can empty a town; it cannot take the charter back. */
  stage: Stage;
  known: TechId[];
  /** The year each thing landed. */
  learnedIn: Partial<Record<TechId, number>>;
  /** What is being worked out, or nothing. */
  focus: TechId | null;
  /** Points already spent on a thing not yet known. Kept when the focus moves. */
  progress: Partial<Record<TechId, number>>;
  /** Points nobody is spending. They pour into the focus next spring. */
  pot: number;
  log: LogLine[];
}

export const BENCH = {
  start: CONFIG.population.start,
  /** Percent a year, before anything is worked out: the engine's ground rate. */
  growth: Math.round((CONFIG.village.growthNoLaw - 1) * 100),
  births: CONFIG.village.births,
  /**
   * Points a year: `base` for the year itself, one for every `per` souls up
   * to `bendsAt`, and one for every `perPast` beyond it. The bend is the same
   * idea as the crowd's: the difference between four hundred and five
   * hundred people is not the difference between four and a hundred and four.
   */
  minds: { base: 3, per: 15, bendsAt: 100, perPast: 25 },
  winter: { every: CONFIG.winter.every, loss: 18 },
  room: CONFIG.population.room.base,
  town: CONFIG.town.at,
  kingdom: CONFIG.kingdom.at,
  logKeep: 14,
} as const;

export function techOf(id: TechId): TechDef {
  return TECHS.find((t) => t.id === id)!;
}

export function pathTechs(path: PathId): TechDef[] {
  return TECHS.filter((t) => t.path === path);
}

export function spherePaths(sphere: SphereId) {
  return PATHS.filter((p) => p.sphere === sphere);
}

/** 0 for the first step of a path, 1 for the second, and so on. */
export function tierOf(id: TechId): number {
  return pathTechs(techOf(id).path).findIndex((t) => t.id === id);
}

/** The step before this one on the same path, or null for a first step. */
export function needOf(id: TechId): TechDef | null {
  const chain = pathTechs(techOf(id).path);
  const at = chain.findIndex((t) => t.id === id);
  return at > 0 ? chain[at - 1] : null;
}

/** The step after this one on the same path, or null at the end of it. */
export function nextOnPath(id: TechId): TechDef | null {
  const chain = pathTechs(techOf(id).path);
  const at = chain.findIndex((t) => t.id === id);
  return at >= 0 && at + 1 < chain.length ? chain[at + 1] : null;
}

export function isKnown(s: TechState, id: TechId): boolean {
  return s.known.includes(id);
}

/** Not known yet, and nothing on its path is in the way. */
export function isOpen(s: TechState, id: TechId): boolean {
  if (isKnown(s, id)) return false;
  const need = needOf(id);
  return need === null || isKnown(s, need.id);
}

export function openTechs(s: TechState): TechDef[] {
  return TECHS.filter((t) => isOpen(s, t.id));
}

/** Everything the known things add up to. */
export function effectsOf(s: TechState): Required<Effect> {
  const out = { room: 0, growth: 0, minds: 0, shelter: 0 };
  for (const id of s.known) {
    const e = techOf(id).effect;
    out.room += e.room ?? 0;
    out.growth += e.growth ?? 0;
    out.minds += e.minds ?? 0;
    out.shelter += e.shelter ?? 0;
  }
  return out;
}

export function roomOf(s: TechState): number {
  return BENCH.room + effectsOf(s).room;
}

/** Percent a year, while there is room. */
export function growthOf(s: TechState): number {
  return BENCH.growth + effectsOf(s).growth;
}

export function shelterOf(s: TechState): number {
  return effectsOf(s).shelter;
}

/** Points the year puts on the table. The count is the driver; the tree adds to it. */
export function mindsOf(s: TechState): number {
  const M = BENCH.minds;
  const souls = Math.floor(s.souls);
  const near = Math.min(souls, M.bendsAt);
  const past = Math.max(0, souls - M.bendsAt);
  return M.base + Math.floor(near / M.per) + Math.floor(past / M.perPast) + effectsOf(s).minds;
}

export function stageOf(souls: number): Stage {
  if (souls >= BENCH.kingdom) return 'kingdom';
  if (souls >= BENCH.town) return 'town';
  return 'hamlet';
}

const STAGE_ORDER: Stage[] = ['hamlet', 'town', 'kingdom'];

function higher(a: Stage, b: Stage): Stage {
  return STAGE_ORDER.indexOf(a) >= STAGE_ORDER.indexOf(b) ? a : b;
}

export function newTechState(): TechState {
  return {
    year: 1,
    souls: BENCH.start,
    stage: 'hamlet',
    known: [],
    learnedIn: {},
    focus: null,
    progress: {},
    pot: 0,
    log: [],
  };
}

/**
 * Point the place at something. Only a thing that is open can be picked, and
 * nothing lands on the click: the pot and the year's points pour in next
 * spring, so a thing is always worked out in a year and not in a moment.
 */
export function setFocus(s: TechState, id: TechId): TechState {
  if (!isOpen(s, id) || s.focus === id) return s;
  return { ...s, focus: id };
}

/**
 * Roughly how many springs until this thing is known, if it were the focus
 * from now on at this year's rate: what is left of its cost, less what is
 * already on it and what is waiting in the pot. Never less than one, because
 * nothing lands on the click.
 */
export function yearsToFinish(s: TechState, id: TechId): number {
  const left = techOf(id).cost - (s.progress[id] ?? 0) - s.pot;
  return Math.max(1, Math.ceil(left / Math.max(1, mindsOf(s))));
}

/** One spring. The thinking first, then the count, then what the count means. */
export function advanceYear(s: TechState): TechState {
  const year = s.year + 1;
  const known = [...s.known];
  const learnedIn = { ...s.learnedIn };
  const progress = { ...s.progress };
  const log = [...s.log];
  let focus = s.focus;

  // 1. The thinking. The pot pours into the focus with the year's points.
  //    Nothing lands twice in one spring: a thing that is worked out hands
  //    the focus to the next step of its path and what was left over goes
  //    back to the pot, to pour in next year. A pot that could pay for three
  //    things at once still buys them one spring at a time.
  let pot = 0;
  const points = mindsOf(s) + s.pot;
  if (focus === null) {
    pot = points;
  } else {
    const tech = techOf(focus);
    const have = (progress[focus] ?? 0) + points;
    if (have < tech.cost) {
      progress[focus] = have;
    } else {
      pot = have - tech.cost;
      delete progress[focus];
      known.push(focus);
      learnedIn[focus] = year;
      log.push({ year, kind: 'learned', tech: focus });
      const next = nextOnPath(focus);
      focus = next ? next.id : null;
    }
  }

  // 2. The count. A long winter is a year the count does not grow: it takes
  //    its share and the shelter on the tree answers for some of it. Every
  //    other year the count grows toward the room and stops at it.
  const settled: TechState = { ...s, known };
  const before = s.souls;
  let souls = before;
  if (year % BENCH.winter.every === 0) {
    const share = Math.max(0, BENCH.winter.loss - shelterOf(settled)) / 100;
    const lost = Math.round(before * share);
    souls = Math.max(1, before - lost);
    log.push({ year, kind: 'winter', lost, had: Math.round(before) });
  } else {
    const room = roomOf(settled);
    const slack = Math.max(0, 1 - before / room);
    const gain = before * (growthOf(settled) / 100) * slack + BENCH.births;
    souls = Math.min(room, before + gain);
  }

  // 3. What the count means. A charter is not taken back by a bad winter.
  const stage = higher(s.stage, stageOf(souls));
  if (stage !== s.stage) log.push({ year, kind: 'stage', stage });

  return {
    year,
    souls,
    stage,
    known,
    learnedIn,
    focus,
    progress,
    pot,
    log: log.slice(-BENCH.logKeep),
  };
}
