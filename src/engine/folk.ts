import { AGES, CASE_DOING, CHOICE_DOING, STATIONS, WINTER_DOING, folkLook } from '../content/folk';
import type { Doing } from '../content/folk';
import { characterMeta } from '../content/meta';
import { getCase } from './registry';
import type { GameState, Season } from './types';

/**
 * What became of everybody you have heard.
 *
 * Read straight off the log, the same way the register is, so nothing new goes
 * into the save and an old reign loaded back shows the town it earned. The
 * last scene a person appeared in is the one that decides what they are doing
 * now: meet the Cooper twice and it is the second evening that is standing in
 * the picture, not the first.
 */

/** One person, where they stand, and what they are doing there. */
export interface FolkPin {
  character: string;
  /** What the register calls them, for the tooltip on a wordless picture. */
  label: string;
  doing: Doing;
  x: number;
  y: number;
  /** The year you last had them in front of you. */
  turn: number;
  /** Their own pace, so a street of named people is not a chorus line. */
  dur: string;
  delay: string;
  span: string;
}

/**
 * The town band draws itself and the wolf draws itself, and you are not
 * somebody you have met. The square is a crowd rather than a person, and a
 * crowd cannot stand in one spot with a basket.
 */
const NOT_IN_THE_PICTURE = ['monarch', 'crowd', 'wolf'];

/** The last scene each person was in, and what they answered to it. */
function lastScene(s: GameState): Map<string, { caseId: string; choiceId: string; turn: number }> {
  const out = new Map<string, { caseId: string; choiceId: string; turn: number }>();
  for (const entry of s.log) {
    if (entry.kind !== 'case') continue;
    const event = getCase(entry.refId);
    if (!event?.character) continue;
    out.set(event.character, { caseId: entry.refId, choiceId: entry.choiceId, turn: entry.turn });
  }
  return out;
}

/**
 * What each person you have met is doing now: the doing of the last scene they
 * were in, with the handful of answers that change a life taken into account,
 * and then whatever the weather allows.
 *
 * The season is optional because two callers want different things from it.
 * The town band knows the season and should draw it; a test asking what a
 * reign left somebody doing does not care what month it is.
 */
export function doingsNow(s: GameState, season?: Season): Map<string, Doing> {
  const out = new Map<string, Doing>();
  for (const [character, scene] of lastScene(s)) {
    const settled =
      CHOICE_DOING[`${scene.caseId}:${scene.choiceId}`] ??
      CASE_DOING[scene.caseId] ??
      folkLook(character).doing;
    // Winter moves the work, never the person who has stopped working: the
    // table has no entry for sitting down, so sitting down survives the frost.
    out.set(character, season === 'winter' ? (WINTER_DOING[settled] ?? settled) : settled);
  }
  return out;
}

/**
 * How old everybody is this year.
 *
 * The age they were the year they walked in, plus every year since. Somebody
 * who is gone stops counting on the year they went, which is the one place in
 * this game where a number is allowed to stand still.
 */
export function agesNow(s: GameState): Map<string, number> {
  const first = new Map<string, number>();
  for (const entry of s.log) {
    if (entry.kind !== 'case') continue;
    const event = getCase(entry.refId);
    if (!event?.character) continue;
    if (!first.has(event.character)) first.set(event.character, entry.turn);
  }

  const doings = doingsNow(s);
  const scenes = lastScene(s);
  const out = new Map<string, number>();
  for (const [character, met] of first) {
    const born = AGES[character];
    if (born === undefined || born === 0) continue;
    const until = doings.get(character) === 'gone' ? (scenes.get(character)?.turn ?? met) : s.turn;
    out.set(character, born + Math.max(0, until - met));
  }
  return out;
}

/**
 * Everybody who is out there, and where.
 *
 * Two people who ended up doing the same thing do not stand in the same
 * footprint: they are spread across the width of the station by the order they
 * arrived in it, which is stable, so meeting somebody new never shuffles the
 * people already in the picture.
 */
export function townFolk(s: GameState, season?: Season): FolkPin[] {
  const doings = doingsNow(s, season);

  /** When you last saw each of them, for the spread and for the tooltip. */
  const lastSeen = new Map<string, number>();
  for (const [character, scene] of lastScene(s)) lastSeen.set(character, scene.turn);

  const standing = [...doings.entries()].filter(
    ([character, doing]) => doing !== 'gone' && !NOT_IN_THE_PICTURE.includes(character),
  );

  const atStation = new Map<Doing, number>();
  const pins: FolkPin[] = [];

  standing.forEach(([character, doing], i) => {
    const station = STATIONS[doing];
    const nth = atStation.get(doing) ?? 0;
    atStation.set(doing, nth + 1);
    // the first one takes the spot, the rest step to alternate sides of it
    const step = Math.ceil(nth / 2) * (nth % 2 === 1 ? -1 : 1);
    const spread = station.span > 0 ? Math.min(20, station.span / 2) : 15;

    pins.push({
      character,
      label: characterMeta(character).label,
      doing,
      x: station.x + step * spread,
      y: station.y + ((i * 5) % 7),
      turn: lastSeen.get(character) ?? 0,
      dur: `${11 + ((i * 7) % 9)}s`,
      delay: `-${(i * 1.9) % 8}s`,
      span: `${station.span}px`,
    });
  });

  return pins;
}
