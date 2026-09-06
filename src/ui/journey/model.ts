import type { Moment } from '../../content/moments';
import { along, HOME, pathLength, route } from './routes';
import type { Point } from './routes';

export type Job = 'lanes' | 'fields' | 'wood';
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
  station: number;
  errands: Errand[];
  completed: Errand[];
  visit: Visit | null;
}
const JOBS: Record<Job, Point[]> = {
  lanes: [HOME, { x: 600, y: 400 }, { x: 756, y: 300 }],
  fields: [{ x: 440, y: 398 }, { x: 365, y: 445 }],
  wood: [{ x: 1240, y: 334 }, { x: 1280, y: 358 }],
};
export const WALK_SPEED = 108;
export const ACTION_SECONDS = 2.2;
export function newJourney(): Journey {
  return { at: HOME, callerAt: null, mode: 'working', path: [HOME], elapsed: 0, job: 'lanes', station: 0, errands: [], completed: [], visit: null };
}
function walk(s: Journey, to: Point, mode: Mode): Journey {
  return { ...s, mode, elapsed: 0, path: route(s.at, to) };
}
function nextTask(s: Journey): Journey {
  if (s.errands.length) return walk(s, s.errands[0].moment, 'collect-walk');
  if (s.visit) return { ...s, mode: 'caller', elapsed: 0, callerAt: s.visit.at, path: route(s.visit.at, { x: s.at.x - 20, y: s.at.y }) };
  return walk(s, JOBS[s.job][s.station % JOBS[s.job].length], 'work-walk');
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
  const length = pathLength(s.path), travelled = elapsed * WALK_SPEED;
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
