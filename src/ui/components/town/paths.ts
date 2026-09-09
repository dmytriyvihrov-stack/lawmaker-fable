import { CROSSING } from '../../journey/routes';

/**
 * The ground under a walk.
 *
 * Everybody in this picture who goes anywhere used to go there in a straight
 * line, which is fine between a door and a furrow and is not fine between a
 * door and the far bank: a straight line from the huts to the beeches is a
 * line through the river. These are the three facts a walk needs to be a
 * walk and not a flight. Which side of the water a point is on; the way over,
 * once there is one; and a polyline cut into equal steps, because a CSS
 * animation moves at one speed between one stop and the next and a route
 * whose stops are the corners would crawl across the bridge and sprint
 * across the meadow.
 *
 * Pure arithmetic, no React and no paint, so the tests can walk it.
 */
export interface Pt {
  x: number;
  y: number;
}

/**
 * The river, as the same three cubics the picture draws (`atmosphere.tsx`)
 * and the ruler's walk avoids (`journey/routes.ts`). Sampled once.
 */
const BENDS = [
  [1440, 380, 1300, 402, 1180, 436, 1090, 482],
  [1090, 482, 1000, 528, 930, 556, 850, 584],
  [850, 584, 790, 606, 746, 684, 716, 820],
];

const WATER: Pt[] = BENDS.flatMap(([x0, y0, x1, y1, x2, y2, x3, y3]) =>
  Array.from({ length: 41 }, (_, i) => {
    const t = i / 40;
    const u = 1 - t;
    return {
      x: u ** 3 * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t ** 3 * x3,
      y: u ** 3 * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t ** 3 * y3,
    };
  }),
);

export type Bank = 'near' | 'far';

/** How far a point is from the middle of the river. The water is thirty wide each way. */
export function waterDistance(p: Pt): number {
  let best = Infinity;
  for (const w of WATER) best = Math.min(best, Math.hypot(w.x - p.x, w.y - p.y));
  return best;
}

/** The half width of the water itself, which is what a foot has to stay out of. */
export const WATER_HALF = 30;

/**
 * Which side of the water a point is on.
 *
 * The town is on the near bank. The river runs in at the right edge and out
 * through the bottom of the meadow, so "near" is everything up and to the
 * left of it, which is where every roof, furrow and rod in the place stands,
 * and "far" is the beeches and the ground the bridge opens.
 */
export function bankOf(p: Pt): Bank {
  let at = 0;
  let best = Infinity;
  for (let i = 0; i < WATER.length; i++) {
    const d = (WATER[i].x - p.x) ** 2 + (WATER[i].y - p.y) ** 2;
    if (d < best) {
      best = d;
      at = i;
    }
  }
  const a = WATER[Math.max(0, at - 1)];
  const b = WATER[Math.min(WATER.length - 1, at + 1)];
  const cross = (b.x - a.x) * (p.y - WATER[at].y) - (b.y - a.y) * (p.x - WATER[at].x);
  return cross >= 0 ? 'near' : 'far';
}

/** The deck, bank to bank, in the order somebody leaving the town walks it. */
export const DECK: Pt[] = CROSSING.map((p) => ({ x: p.x, y: p.y }));

/**
 * The way from here to there on foot.
 *
 * On one bank it is a straight line, the way it always was. Across the water
 * it is the bridge, and only the bridge: there is no ford in this picture
 * for anybody but the ruler, so with nothing built the answer is that nobody
 * goes. The crossing is walked bank to bank in whichever direction the walk
 * needs it.
 */
export function walkOver(from: Pt, to: Pt, bridge: boolean): Pt[] | null {
  if (bankOf(from) === bankOf(to)) return [from, to];
  if (!bridge) return null;
  const deck = bankOf(from) === 'near' ? DECK : [...DECK].reverse();
  return [from, ...deck, to];
}

/** How long a polyline is, end to end. */
export function lengthOf(points: Pt[]): number {
  let sum = 0;
  for (let i = 1; i < points.length; i++) sum += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  return sum;
}

/**
 * The same route as `n` stops an equal distance apart, ends included.
 *
 * A keyframe animation gives every stop the same share of the clock, so
 * stops the same distance apart are the one arrangement that walks at one
 * speed. The stops all lie on the route; what a step between two of them
 * cuts off a corner is small, and the bridge corners are checked against the
 * water in the tests.
 */
export function resample(points: Pt[], n: number): Pt[] {
  if (points.length === 0) return [];
  if (points.length === 1 || n <= 1) return Array.from({ length: Math.max(1, n) }, () => ({ ...points[0] }));
  const total = lengthOf(points);
  const out: Pt[] = [];
  let seg = 1;
  let walked = 0;
  for (let k = 0; k < n; k++) {
    const want = (total * k) / (n - 1);
    while (seg < points.length - 1) {
      const span = Math.hypot(points[seg].x - points[seg - 1].x, points[seg].y - points[seg - 1].y);
      if (walked + span >= want) break;
      walked += span;
      seg++;
    }
    const a = points[seg - 1];
    const b = points[seg];
    const span = Math.hypot(b.x - a.x, b.y - a.y);
    const t = span === 0 ? 0 : Math.min(1, Math.max(0, (want - walked) / span));
    out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  }
  return out;
}

/**
 * The stops of a route as the offsets a CSS animation wants, from the point
 * the figure is actually drawn at. Seven stops, because that is what the two
 * keyframe sets in `index.css` read (`--w0` to `--w6`).
 */
export const STOPS = 7;

export function stopsFrom(route: Pt[], drawnAt: Pt): Record<string, string> {
  const stops = resample(route, STOPS);
  const vars: Record<string, string> = {};
  stops.forEach((p, i) => {
    vars[`--w${i}`] = `${Math.round(p.x - drawnAt.x)}px ${Math.round(p.y - drawnAt.y)}px`;
  });
  return vars;
}
