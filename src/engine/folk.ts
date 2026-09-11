import {
  AGES, CASE_DOING, CHOICE_DOING, CHOICE_DOING_OTHERS, FOUNDING_HAIR, FOUNDING_HEADS,
  KIT_DOING, LEAVING_KIT, STATIONS, WINTER_DOING, folkLook,
} from '../content/folk';
import type { Doing, FolkLook } from '../content/folk';
import { ALSO_IN_SCENE, characterTitle } from '../content/meta';
import { getCase } from './registry';
import { rand01 } from './rng';
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

/** One appearance: the scene, the answer, the year, and whether they spoke. */
interface Appearance {
  caseId: string;
  choiceId: string;
  turn: number;
  /** False for somebody the scene was about who was not doing the talking. */
  atDoor: boolean;
}

/** Everybody a logged scene put in the room, the one at the door first. */
function inScene(caseId: string): { character: string; atDoor: boolean }[] {
  const event = getCase(caseId);
  if (!event) return [];
  const out = event.character ? [{ character: event.character, atDoor: true }] : [];
  for (const other of ALSO_IN_SCENE[caseId] ?? []) {
    if (other === event.character) continue;
    out.push({ character: other, atDoor: false });
  }
  return out;
}

/** The last scene each person was in, and what they answered to it. */
function lastScene(s: GameState): Map<string, Appearance> {
  const out = new Map<string, Appearance>();
  for (const entry of s.log) {
    if (entry.kind !== 'case') continue;
    for (const { character, atDoor } of inScene(entry.refId)) {
      out.set(character, {
        caseId: entry.refId,
        choiceId: entry.choiceId,
        turn: entry.turn,
        atDoor,
      });
    }
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
    const key = `${scene.caseId}:${scene.choiceId}`;
    /* The scene's own doing belongs to whoever was at the door. The one who
       was standing in the field goes on doing what they were doing, unless
       the ruling was the kind that changes a life. */
    const settled = scene.atDoor
      ? CHOICE_DOING[key] ?? CASE_DOING[scene.caseId] ?? folkLook(character).doing
      : CHOICE_DOING_OTHERS[key]?.[character] ?? folkLook(character).doing;
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
    for (const { character } of inScene(entry.refId)) {
      if (!first.has(character)) first.set(character, entry.turn);
    }
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
      label: characterTitle(character),
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

/**
 * The five who walked out of the old place, drawn out of the reign's own seed.
 *
 * The founding used to be five fixed faces, which meant every reign that has
 * ever been played opened on the same photograph. It is the one picture a
 * player sees before anything has happened, so it is the one picture that
 * should say *this* reign rather than *the* reign: the seed picks the heads,
 * the hair and what is in the four pairs of hands, and picks them without
 * repeating, so nobody stands next to their own twin.
 *
 * You are the one with the seal, because on the second night the others voted
 * in a field with their hands up and it was you. Everything else about you is
 * the seed's business.
 */
export function foundingLooks(seed: number): { you: FolkLook; others: FolkLook[] } {
  /** Take one out of the bag and do not put it back. */
  const draw = <T,>(bag: T[], salt: string, i: number): T =>
    bag.splice(Math.floor(rand01(seed, 'founding', salt, i) * bag.length), 1)[0];

  const heads = [...FOUNDING_HEADS];
  const hairs = [...FOUNDING_HAIR];
  const kit = [...LEAVING_KIT];

  const [yr, yy] = draw(heads, 'head', 0);
  const you: FolkLook = {
    r: yr,
    y: yy,
    hair: draw(hairs, 'hair', 0),
    seal: true,
    cloth: 'work',
    doing: 'writing',
  };

  const others: FolkLook[] = [];
  for (let i = 1; i <= 4; i++) {
    const [r, y] = draw(heads, 'head', i);
    const prop = draw(kit, 'kit', i);
    others.push({
      r,
      y,
      hair: draw(hairs, 'hair', i),
      prop,
      // nobody walking out of anywhere is rich, and half of them are not even
      // working: two coats between four people is what leaving looks like
      cloth: rand01(seed, 'founding', 'coat', i) > 0.5 ? 'work' : 'poor',
      doing: KIT_DOING[prop] ?? 'hauling',
    });
  }

  return { you, others };
}
