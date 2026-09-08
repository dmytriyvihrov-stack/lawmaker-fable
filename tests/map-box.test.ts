import { describe, expect, it } from 'vitest';
import { fitToScreen, mapViewport } from '../src/ui/useMapFit';
import type { MapFit } from '../src/ui/useMapFit';
import { MAP } from '../src/ui/components/town/sites';
import { ACTS, touchedBy } from '../src/ui/hand/acts';

/**
 * One box, for the picture and for everything laid over it.
 *
 * The town is an `<svg>` and so is the layer the near scenes are drawn on, and
 * the mark, the thread and every finger are worked out in HTML against
 * `useMapFit`. All three have to be the same mapping. They were not: the town
 * went to a fitted viewBox on a narrow window and the scene layer kept
 * `xMidYMax slice`, so on a phone the camera flew to a spot the fit knew about
 * and the scene was drawn three times too big and half a screen to the left of
 * it. Nothing was under the finger, and nothing was on the screen either.
 *
 * These are the two mappings written out separately and checked against each
 * other, which is the only way to catch it without a browser.
 */

const fitOf = (w: number, h: number): MapFit => {
  const narrow = w < 1000;
  const scale = narrow ? w / MAP.w : Math.max(w / MAP.w, h / MAP.h);
  return {
    scale,
    ox: (w - MAP.w * scale) / 2,
    oy: narrow ? -120 * scale : h - MAP.h * scale,
    w,
    h,
  };
};

/** Where an `<svg>` given this viewBox actually draws a point in its box. */
function drawnAt(fit: MapFit, m: { x: number; y: number }): { x: number; y: number } {
  const box = mapViewport(fit);
  const [vx, vy, vw, vh] = box.viewBox.split(' ').map(Number);
  if (box.preserveAspectRatio === 'none') {
    return { x: ((m.x - vx) * fit.w) / vw, y: ((m.y - vy) * fit.h) / vh };
  }
  // xMidYMax slice: cover the box, centred across, hung from the bottom
  const s = Math.max(fit.w / vw, fit.h / vh);
  return {
    x: (m.x - vx) * s + (fit.w - vw * s) / 2,
    y: (m.y - vy) * s + (fit.h - vh * s),
  };
}

/** Phones, tablets held either way, and windows on a desk. */
const BOXES: [number, number][] = [
  [360, 600],
  [390, 694],
  [414, 746],
  [768, 900],
  [999, 700],
  [1000, 700],
  [1280, 724],
  [1440, 824],
  [1920, 950],
];

/** Somewhere in the sky, the settlement, the near meadow, and both edges. */
const POINTS = [
  { x: 0, y: 0 },
  { x: 604, y: 258 },
  { x: 1018, y: 440 },
  { x: MAP.w, y: MAP.h },
];

describe('the box the town is drawn in', () => {
  it('draws a point where the fit says it is, on every window', () => {
    for (const [w, h] of BOXES) {
      const fit = fitOf(w, h);
      for (const m of POINTS) {
        const said = fitToScreen(fit, m.x, m.y);
        const drawn = drawnAt(fit, m);
        expect(drawn.x, `${w}x${h} at ${m.x},${m.y}`).toBeCloseTo(said.x, 6);
        expect(drawn.y, `${w}x${h} at ${m.x},${m.y}`).toBeCloseTo(said.y, 6);
      }
    }
  });

  it('crops the sides on a wide window and fits across on a narrow one', () => {
    expect(mapViewport(fitOf(1440, 824)).narrow).toBe(false);
    expect(mapViewport(fitOf(1440, 824)).preserveAspectRatio).toBe('xMidYMax slice');
    expect(mapViewport(fitOf(390, 694)).narrow).toBe(true);
    expect(mapViewport(fitOf(390, 694)).preserveAspectRatio).toBe('none');
  });

  it('answers with a whole picture before anything has been measured', () => {
    const unmeasured = mapViewport({ scale: 0, ox: 0, oy: 0, w: 0, h: 0 });
    expect(unmeasured.viewBox).toBe(`0 0 ${MAP.w} ${MAP.h}`);
    expect(unmeasured.w).toBe(MAP.w);
  });

  it('gives the four numbers of whatever it is showing, for a curtain', () => {
    for (const [w, h] of BOXES) {
      const box = mapViewport(fitOf(w, h));
      expect(box.viewBox).toBe(`${box.x} ${box.y} ${box.w} ${box.h}`);
    }
  });
});

describe('what the camera has to hold', () => {
  it('names every thing an answer to a case will ask the hand to touch', () => {
    const cases = [...new Set(Object.keys(ACTS).map((key) => key.split(':')[0]))];
    for (const id of cases) {
      const named = touchedBy(id);
      expect(named.length, id).toBeGreaterThan(0);
      // whatever any of that case's acts names is in the list, chains included
      for (const [key, act] of Object.entries(ACTS)) {
        if (!key.startsWith(`${id}:`)) continue;
        for (let step: typeof act | undefined = act; step; step = step.then) {
          const wanted =
            step.kind === 'carry' ? step.steps.flatMap((s) => [s.item, s.to]) : [step.target];
          for (const thing of wanted) expect(named, key).toContain(thing);
        }
      }
    }
  });

  it('does not name a thing no act of that case ever touches', () => {
    expect(touchedBy('v1_idle_hand')).not.toContain('bucket');
    expect(touchedBy('v2_well')).not.toContain('loaf');
    expect(touchedBy('a_case_with_no_scene_at_all')).toEqual([]);
  });
});
