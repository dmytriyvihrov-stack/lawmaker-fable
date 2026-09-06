export interface Point { x: number; y: number }

const p = (x: number, y: number): Point => ({ x, y });
export const HOME = p(774, 424);

// Footpaths meet at the gate, square and crossing. The far bank is reached
// at the existing crossing, even before anyone has paid for a stone bridge.
export const CROSSING = [p(1040, 440), p(1090, 482), p(1150, 530)];
const NODES = [
  p(200, 440), p(350, 440), p(520, 420), p(600, 400),
  p(700, 424), HOME, p(850, 452), p(940, 420), ...CROSSING,
  p(1240, 552), p(1320, 526), p(590, 300), p(756, 248),
  p(770, 340), p(940, 308), p(1090, 290), p(1190, 300),
  p(1270, 350), p(1120, 380), p(480, 300), p(388, 250),
  p(420, 528), p(258, 604), p(610, 500),
];
const EDGES = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7],
  [7, 8], [8, 9], [9, 10], [10, 11], [11, 12], [3, 13],
  [13, 14], [14, 15], [15, 5], [15, 16], [16, 17], [17, 18],
  [18, 19], [17, 20], [20, 7], [13, 21], [21, 22], [2, 21],
  [1, 23], [23, 24], [23, 25], [25, 4],
];

const BENDS = [
  [1440, 380, 1300, 402, 1180, 436, 1090, 482],
  [1090, 482, 1000, 528, 930, 556, 850, 584],
  [850, 584, 790, 606, 746, 684, 716, 820],
];
// Sample the same cubic as the drawing. This is scenery geometry, not RNG.
const WATER = BENDS.flatMap(([x0, y0, x1, y1, x2, y2, x3, y3]) =>
  Array.from({ length: 81 }, (_, i) => {
    const t = i / 80, u = 1 - t;
    return p(u ** 3 * x0 + 3 * u ** 2 * t * x1 + 3 * u * t ** 2 * x2 + t ** 3 * x3,
      u ** 3 * y0 + 3 * u ** 2 * t * y1 + 3 * u * t ** 2 * y2 + t ** 3 * y3);
  }),
);
export const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
export const inWater = (at: Point) => WATER.some((b) => distance(at, b) < 32);
export const atCrossing = (at: Point) => distance(at, CROSSING[1]) < 76;
/** Some old scene pins mark the water itself. Feet stop on its nearest bank. */
export function onFoot(at: Point): Point {
  if (!inWater(at)) return p(at.x, at.y);
  for (let radius = 6; radius <= 90; radius += 3) {
    for (let angle = 0; angle < 16; angle++) {
      const t = angle * Math.PI / 8;
      const candidate = p(at.x + Math.sin(t) * radius, at.y - Math.cos(t) * radius);
      if (!inWater(candidate)) return candidate;
    }
  }
  return p(at.x, at.y);
}
export function drySegment(a: Point, b: Point): boolean {
  const steps = Math.max(1, Math.ceil(distance(a, b) / 6));
  for (let i = 0; i <= steps; i++) {
    const at = p(a.x + (b.x - a.x) * i / steps, a.y + (b.y - a.y) * i / steps);
    if (inWater(at)) return false;
  }
  return true;
}

/** Shortest walk along the lanes, with short, dry paths to the actual door. */
export function route(from: Point, to: Point): Point[] {
  if (distance(from, to) < 60 && drySegment(from, to)) return [from, to];
  const nodes = [...NODES, from, to];
  const start = nodes.length - 2, end = nodes.length - 1;
  const links = nodes.map(() => [] as number[]);
  const link = (a: number, b: number) => { links[a].push(b); links[b].push(a); };
  for (const [a, b] of EDGES) link(a, b);
  for (const idx of [start, end]) {
    const nearby = NODES.map((at, i) => ({ i, length: distance(nodes[idx], at) }))
      .sort((a, b) => a.length - b.length)
      .filter(({ i }) => drySegment(nodes[idx], nodes[i])).slice(0, 2);
    for (const { i } of nearby) link(idx, i);
    // A scene actually on the crossing can connect to its deck.
    if (nearby.length === 0 && atCrossing(nodes[idx])) link(idx, 9);
  }
  const costs = nodes.map(() => Infinity), prev = nodes.map(() => -1);
  const unseen = new Set(nodes.map((_, i) => i));
  costs[start] = 0;
  while (unseen.size) {
    let at = -1;
    for (const i of unseen) if (at < 0 || costs[i] < costs[at]) at = i;
    if (at === end || !Number.isFinite(costs[at])) break;
    unseen.delete(at);
    for (const next of links[at]) {
      const cost = costs[at] + distance(nodes[at], nodes[next]);
      if (cost < costs[next]) { costs[next] = cost; prev[next] = at; }
    }
  }
  if (!Number.isFinite(costs[end])) return [from];
  const result: Point[] = [];
  for (let i = end; i !== -1; i = prev[i]) result.unshift(nodes[i]);
  return result;
}

export function pathLength(points: Point[]): number {
  return points.slice(1).reduce((sum, at, i) => sum + distance(points[i], at), 0);
}
export function along(points: Point[], travelled: number): Point {
  let left = Math.max(0, travelled);
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i], span = distance(a, b);
    if (left <= span && span > 0) return p(a.x + (b.x - a.x) * left / span, a.y + (b.y - a.y) * left / span);
    left -= span;
  }
  const end = points[points.length - 1] ?? HOME;
  return p(end.x, end.y);
}
