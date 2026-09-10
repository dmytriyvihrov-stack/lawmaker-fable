import type { Moment } from '../../content/moments';
import { along, HOME, pathLength, route } from './routes';
import type { Point } from './routes';

export type Job = 'lanes' | 'fields' | 'water' | 'wood';
export type Mode = 'working' | 'work-walk' | 'collect-walk' | 'collect-work' | 'caller' | 'briefing' | 'event-walk' | 'arrived';
export interface Visit { key: string; id: string; character?: string; at: Point }
export interface Errand { key: string; turn: number; moment: Moment }
export interface Journey {
  at: Point;
  callerAt: Point | null;
  mode: Mode;
  path: Point[];
  elapsed: number;
  job: Job;
  /**
   * The jobs this valley actually has right now, in the order they come round.
   * A field is a year of work somebody has to spend before there is one, and
   * until then nobody is in the furrows - not the folk, who are posted off
   * `buildings.fields` already, and not the ruler, who used to walk out to bare
   * grass twice a day and bow at it.
   */
  open: Job[];
  station: number;
  errands: Errand[];
  completed: Errand[];
  visit: Visit | null;
}
const JOBS: Record<Job, Point[]> = {
  lanes: [HOME, { x: 600, y: 400 }, { x: 756, y: 300 }],
  fields: [{ x: 440, y: 398 }, { x: 365, y: 445 }],
  /* The near bank, in two places the water is worth standing at: the bend
     below the square, and the stretch upstream of it where the rods are. A
     body's width back from every seat on `FISH_SPOTS`, so the ruler stands
     beside whoever is fishing and not on them, and both are dry ground
     sixty units from the middle of the river. */
  water: [{ x: 960, y: 470 }, { x: 1092, y: 414 }],
  wood: [{ x: 1240, y: 334 }, { x: 1280, y: 358 }],
};
/**
 * The day, and who decides it.
 *
 * It used to be a dropdown: the ruler stood at the door until somebody chose
 * "walking the lanes" or "tending the field" for them, and then walked two
 * stops and stood there again. A person with a valley to run does not wait to
 * be told which way to walk. The stops of one job run out and the next job
 * starts, round and round, all day, and the only thing that interrupts it is
 * somebody coming to find you or a small thing waiting to be done. Choosing
 * is still possible - `chooseJob` is what the tests and the dev switch use -
 * it is simply not something the game asks a player to do.
 */
/* Round the valley the way the ground lies: the lanes north, the field west,
   the water south-east and the wood east, and home again. The water was not
   in the round for a long time, which left the ruler's day the same three
   walks from the first spring to the last, and the one thing in the valley
   the place was founded for never visited. The bank is there before anything
   is built, so it needs no year of work to open it. */
export const JOB_ORDER: Job[] = ['lanes', 'fields', 'water', 'wood'];
/** The one job that is not there until a year of work has cleared the ground. */
const JOB_NEEDS_WORK: Partial<Record<Job, string>> = { fields: 'fields' };

/**
 * Which of the three the place can actually offer, given what it has built.
 *
 * Takes the buildings rather than the whole reign so it stays a function of
 * one fact, and so the thing that decides where the ruler spends the day can
 * be tested without a game around it.
 */
export function openJobs(buildings: Partial<Record<string, number>> | undefined): Job[] {
  return JOB_ORDER.filter((job) => {
    const needs = JOB_NEEDS_WORK[job];
    return needs === undefined || (buildings?.[needs] ?? 0) > 0;
  });
}
export const WALK_SPEED = 108;
/**
 * And the two legs with a person at the end of them.
 *
 * A round of the day is the day passing and is watched at the pace of one;
 * somebody coming across the valley to find you, and the walk out to whatever
 * they came about, are the game waiting to start. Both are half again as
 * quick, which is the same lane, the same corners and the same river, walked
 * by somebody with a reason.
 */
export const ERRAND_SPEED = WALK_SPEED * 1.7;
/** How fast the feet move in this mode. Presentation only; see `tickJourney`. */
export function speedOf(mode: Mode): number {
  return mode === 'caller' || mode === 'event-walk' ? ERRAND_SPEED : WALK_SPEED;
}
export const ACTION_SECONDS = 2.2;
export function newJourney(open: Job[] = JOB_ORDER): Journey {
  const jobs = open.length ? open : ['lanes' as Job];
  return { at: HOME, callerAt: null, mode: 'working', path: [HOME], elapsed: 0, job: jobs[0], open: jobs, station: 0, errands: [], completed: [], visit: null };
}

/**
 * The valley built something, or has not built it yet, and the round changes.
 *
 * The ruler is not pulled off what they are doing for it: a job that has just
 * closed is walked out of at the end of its own round, which is the same way
 * every other job here ends.
 */
export function setOpenJobs(s: Journey, open: Job[]): Journey {
  const jobs = open.length ? open : ['lanes' as Job];
  if (jobs.length === s.open.length && jobs.every((j, i) => j === s.open[i])) return s;
  return { ...s, open: jobs };
}
function walk(s: Journey, to: Point, mode: Mode): Journey {
  return { ...s, mode, elapsed: 0, path: route(s.at, to) };
}
/** The stops of a job run out, and the next job the place has starts. Nobody is asked. */
function onRound(s: Journey): Journey {
  const round = s.open.length ? s.open : ['lanes' as Job];
  const here = round.indexOf(s.job);
  if (here >= 0 && s.station < JOBS[s.job].length) return s;
  return { ...s, job: round[(here + 1) % round.length], station: 0 };
}
function nextTask(s: Journey): Journey {
  if (s.errands.length) return walk(s, s.errands[0].moment, 'collect-walk');
  if (s.visit) return { ...s, mode: 'caller', elapsed: 0, callerAt: s.visit.at, path: route(s.visit.at, { x: s.at.x - 20, y: s.at.y }) };
  const next = onRound(s);
  return walk(next, JOBS[next.job][next.station], 'work-walk');
}
export function queueErrand(s: Journey, errand: Errand): Journey {
  if ([...s.errands, ...s.completed].some((e) => e.key === errand.key)) return s;
  if (['caller', 'briefing', 'event-walk', 'arrived'].includes(s.mode)) return s;
  const next = { ...s, errands: [...s.errands, errand] };
  return s.errands.length ? next : nextTask(next);
}
export function requestVisit(s: Journey, visit: Visit | null): Journey {
  if (s.visit?.key === visit?.key) return s;
  const next = { ...s, visit, callerAt: null };
  if (s.errands.length) return next;
  return nextTask(next);
}
export function followVisitor(s: Journey): Journey {
  return s.mode === 'briefing' && s.visit ? walk(s, s.visit.at, 'event-walk') : s;
}
export function chooseJob(s: Journey, job: Job): Journey {
  const next = { ...s, job, station: 0 };
  return s.errands.length || s.visit ? next : nextTask(next);
}
/** Only presentation time moves here. The reign receives completed errands. */
export function tickJourney(s: Journey, seconds: number): Journey {
  if (s.mode === 'briefing' || s.mode === 'arrived') return s;
  const elapsed = s.elapsed + Math.max(0, seconds);
  if (s.mode === 'working') {
    return elapsed < 7 ? { ...s, elapsed } : nextTask({ ...s, station: s.station + 1, elapsed: 0 });
  }
  if (s.mode === 'collect-work') {
    if (elapsed < ACTION_SECONDS) return { ...s, elapsed };
    const [finished, ...rest] = s.errands;
    return nextTask({ ...s, elapsed: 0, errands: rest, completed: [...s.completed, finished] });
  }
  const length = pathLength(s.path), travelled = elapsed * speedOf(s.mode);
  const at = along(s.path, travelled);
  const next = s.mode === 'caller' ? { ...s, elapsed, callerAt: at } : { ...s, elapsed, at };
  if (travelled < length) return next;
  if (s.mode === 'caller') return { ...next, mode: 'briefing', elapsed: 0 };
  if (s.mode === 'event-walk') return { ...next, mode: 'arrived', elapsed: 0 };
  if (s.mode === 'collect-walk') return { ...next, mode: 'collect-work', elapsed: 0 };
  return { ...next, mode: 'working', elapsed: 0 };
}
/** Dev and reduced motion finish a leg, but never choose a ruling. */
export function skipJourney(s: Journey): Journey {
  if (s.mode === 'briefing') return tickJourney(followVisitor(s), 1000);
  return tickJourney(s, 1000);
}
export function canAnswer(s: Journey, key: string): boolean {
  return s.visit?.key === key && s.mode === 'arrived' && s.errands.length === 0;
}
