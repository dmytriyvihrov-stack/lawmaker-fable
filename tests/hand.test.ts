import { describe, expect, it } from 'vitest';
import { ACTS, actFor } from '../src/ui/hand/acts';
import type { ActDef } from '../src/ui/hand/acts';
import { makeGesture } from '../src/ui/hand/gestures';
import type { GestureCtx } from '../src/ui/hand/gestures';
import { HAND_INSTRUCTIONS } from '../src/content/hand';
import type { ActHooks, Fig, Scene, Thing } from '../src/ui/hand/scenes';
import { CASES } from '../src/content/cases';

/**
 * The hand, without a browser.
 *
 * The prototype's gestures are the one part of it that is physics rather than
 * layout, and the physics is what decides whether taking bread off a man
 * feels like taking it. These drive the gestures against a scene made of
 * plain objects, so the thresholds are checked rather than felt.
 */

const CASE_IDS = ['v1_idle_hand', 'v2_well', 'd1_pies', 'v6_road_dead'];

function fig(x: number, y: number, r = 8): Fig {
  const moved: { x: number; y: number; ms: number }[] = [];
  const f = {
    g: {} as SVGGElement,
    inner: {} as SVGGElement,
    x,
    y,
    r,
    w: r * 2,
    h: r * 2,
    visible: true,
    home: { x, y, pose: 'p', flip: false, hidden: false },
    moved,
    set(nx: number, ny: number) {
      f.x = nx;
      f.y = ny;
      return f;
    },
    setPose() {
      return f;
    },
    setFlip() {
      return f;
    },
    offset() {},
    show() {
      return f;
    },
    hl() {},
    moveTo(nx: number, ny: number, ms: number) {
      moved.push({ x: nx, y: ny, ms });
    },
    lift() {},
    drop() {},
    reset() {},
  };
  return f as unknown as Fig & { moved: typeof moved };
}

function zone(x: number, y: number, r = 14): Thing {
  return { x, y, r, w: r * 2, h: r * 2, visible: true, hl() {}, reset() {} };
}

function scene(things: Record<string, Thing>): Scene {
  return {
    home: { x: 0, y: 0 },
    anchorAt() {},
    build() {},
    reset() {},
    setVisible() {},
    get: (id) => things[id],
    strokeAt() {},
    acts: {},
  };
}

function ctxWith(strain: { v: number }): GestureCtx {
  return {
    unitsPerPx: () => 0.25,
    pan: () => {},
    view: () => ({ x: 700, y: 300, w: 360, h: 205 }),
    swingTool: () => {},
    strainTool: (v) => {
      strain.v = v;
    },
  };
}

const ev = (t = 0) => ({ clientX: 0, clientY: 0, timeStamp: t });

/** Drag the hand from a to b in `steps` moves, running `ms` of frames per move. */
function drag(
  g: ReturnType<typeof makeGesture>,
  a: { x: number; y: number },
  b: { x: number; y: number },
  steps: number,
  msPerStep: number,
) {
  g.down(a, ev(0));
  for (let i = 1; i <= steps; i++) {
    const p = { x: a.x + ((b.x - a.x) * i) / steps, y: a.y + ((b.y - a.y) * i) / steps };
    g.move(p, ev(i * msPerStep));
    for (let t = 0; t < msPerStep; t += 16) g.frame?.(16);
  }
  g.up(b, ev(steps * msPerStep));
}

describe('the minigame layer', () => {
  it('has an act and an instruction for every answer of the three cases', () => {
    for (const id of CASE_IDS) {
      const event = CASES.find((c) => c.id === id);
      expect(event, id).toBeDefined();
      for (const choice of event!.choices) {
        expect(actFor(id, choice.id), `${id}:${choice.id} act`).toBeDefined();
        expect(HAND_INSTRUCTIONS[`${id}:${choice.id}`], `${id}:${choice.id} words`).toBeTruthy();
      }
    }
  });

  it('writes no act for an answer that does not exist', () => {
    for (const key of Object.keys(ACTS)) {
      const [caseId, choiceId] = key.split(':');
      const event = CASES.find((c) => c.id === caseId);
      expect(event?.choices.some((c) => c.id === choiceId), key).toBe(true);
    }
  });

  it('keeps every instruction short enough to read in one look', () => {
    for (const line of Object.values(HAND_INSTRUCTIONS)) {
      expect(line.split(' ').length, line).toBeLessThanOrEqual(10);
      expect(line.includes('—'), line).toBe(false);
    }
  });

  /**
   * Turning away, which is the one act with nothing in the hand.
   *
   * It reads the frame rather than the pointer, so this needs a camera:
   * a view of the map that moves when it is panned and stops at the edge
   * of the picture the way the real one does. What is checked is the thing
   * that was wrong with it, which is that a whole screen of dragging left
   * the man exactly where he was and the act could not be finished at all.
   */
  describe('turning away', () => {
    const act: ActDef = ACTS['v1_idle_hand:his_own_field'];
    /** A frame over the 1440 by 820 picture, at the closeness a scene uses. */
    const camera = () => {
      const w = 360;
      const h = 205;
      /* centred on Tam, which is where the act starts */
      const at = { x: 604 - w / 2, y: 264 - h / 2 };
      const ctx: GestureCtx = {
        /* A wide window at the closeness a scene is played at: the picture
           is drawn 1440 across and hung over about two thousand pixels of
           glass, so a map unit is nearly six pixels and a whole screen of
           dragging is a good deal less ground than it sounds like. */
        unitsPerPx: () => 0.174,
        pan: (dx, dy) => {
          at.x = Math.max(0, Math.min(1440 - w, at.x - dx * 0.174));
          at.y = Math.max(0, Math.min(820 - h, at.y - dy * 0.174));
        },
        view: () => ({ x: at.x, y: at.y, w, h }),
        swingTool: () => {},
        strainTool: () => {},
      };
      return ctx;
    };
    const tam = () => fig(604, 264, 12);

    /** Drag the picture by `px` screen pixels, in `steps` moves. */
    const swipe = (g: ReturnType<typeof makeGesture>, px: number, steps = 12) => {
      g.down({ x: 0, y: 0 }, { clientX: 0, clientY: 0, timeStamp: 0 });
      for (let i = 1; i <= steps; i++) {
        g.move({ x: 0, y: 0 }, { clientX: (px * i) / steps, clientY: 0, timeStamp: i * 16 });
      }
      g.up({ x: 0, y: 0 }, { clientX: px, clientY: 0, timeStamp: steps * 16 });
    };

    it('takes one decisive drag, and not a nudge', () => {
      const small = { done: false };
      const a = makeGesture(act, scene({ tam: tam() }), {}, camera(), () => {
        small.done = true;
      });
      swipe(a, 120);
      expect(small.done, 'a nudge is not turning away').toBe(false);

      const big = { done: false };
      const b = makeGesture(act, scene({ tam: tam() }), {}, camera(), () => {
        big.done = true;
      });
      swipe(b, 900);
      expect(big.done, 'a screen of dragging and he is still there').toBe(true);
    });

    it('lands the moment he leaves the frame, without waiting for the finger', () => {
      const state = { done: false };
      const g = makeGesture(act, scene({ tam: tam() }), {}, camera(), () => {
        state.done = true;
      });
      g.down({ x: 0, y: 0 }, { clientX: 0, clientY: 0, timeStamp: 0 });
      for (let i = 1; i <= 12 && !state.done; i++) {
        g.move({ x: 0, y: 0 }, { clientX: i * 100, clientY: 0, timeStamp: i * 16 });
      }
      expect(state.done, 'it waited for the finger to come up').toBe(true);
    });
  });

  describe('bread in a fist', () => {
    const act: ActDef = ACTS['v1_idle_hand:no_work_no_bread'];

    it('does not come away in one drag', () => {
      const loaf = fig(611.5, 269, 7);
      const cart = zone(470, 268, 16);
      const sc = scene({ loaf, cart });
      let done = false;
      const g = makeGesture(act, sc, {}, ctxWith({ v: 0 }), () => {
        done = true;
      });
      drag(g, { x: 611.5, y: 269 }, { x: 470, y: 268 }, 8, 16);
      expect(done).toBe(false);
      // it is back in his hand, not on the ground where you let go
      expect(loaf.x).toBe(611.5);
      expect(loaf.y).toBe(269);
    });

    it('comes away on the third yank, and then it is only a carry', () => {
      const loaf = fig(611.5, 269, 7);
      const cart = zone(470, 268, 16);
      const sc = scene({ loaf, cart });
      const pulls: number[] = [];
      let freed = false;
      let done = false;
      const hooks: ActHooks = {
        pull: (n) => pulls.push(n),
        freed: () => {
          freed = true;
        },
      };
      const g = makeGesture(act, sc, hooks, ctxWith({ v: 0 }), () => {
        done = true;
      });
      const home = { x: 611.5, y: 269 };
      g.down(home, ev(0));
      for (let k = 0; k < 3; k++) {
        g.move({ x: home.x - 30, y: home.y }, ev(0));
        // and the hand comes back, so the next yank is a yank
        if (k < 2) g.move(home, ev(0));
      }
      expect(pulls).toEqual([1, 2]);
      expect(freed).toBe(true);
      g.move({ x: 470, y: 268 }, ev(0));
      g.up({ x: 470, y: 268 }, ev(0));
      expect(done).toBe(true);
    });

    it('lets him take it back if it is dropped anywhere else', () => {
      const loaf = fig(611.5, 269, 7) as Fig & { moved: { x: number }[] };
      const sc = scene({ loaf, cart: zone(470, 268, 16) });
      const g = makeGesture(act, sc, {}, ctxWith({ v: 0 }), () => {});
      const home = { x: 611.5, y: 269 };
      g.down(home, ev(0));
      for (let k = 0; k < 3; k++) {
        g.move({ x: home.x - 30, y: home.y }, ev(0));
        if (k < 2) g.move(home, ev(0));
      }
      g.up({ x: 560, y: 300 }, ev(0));
      expect(loaf.moved[loaf.moved.length - 1]?.x).toBe(611.5);
    });
  });

  /**
   * And the same loaf under the answer that used to be two answers.
   *
   * "Gets half a share" and "has his share cut" were one ruling written twice
   * and are one now, and the knife came across with the name: the loaf is cut
   * where the four can see it and the half goes back on the cart, rather than
   * being wrestled out of his hand, which is what the hardest answer already
   * did. Two steps in order, and no yanking in either of them.
   */
  describe('a loaf cut in the open', () => {
    const act: ActDef = ACTS['v1_idle_hand:cut_his_share'];

    it('cuts on one stroke down the loaf, then carries the half away', () => {
      const loaf = fig(611.5, 269, 7);
      const half = fig(610, 269, 5);
      const cart = zone(470, 268, 16);
      const sc = scene({ loaf, half, cart });
      const steps: number[] = [];
      let done = false;
      const hooks: ActHooks = { step: (i) => steps.push(i) };
      // the chain is the caller's job: the cut hands the scene to the carry,
      // and the carry counts from where the cut left off
      let carry: ReturnType<typeof makeGesture> | null = null;
      const cut = makeGesture(act, sc, hooks, ctxWith({ v: 0 }), () => {
        carry = makeGesture(act.then!, sc, hooks, ctxWith({ v: 0 }), () => {
          done = true;
        }, 1);
      });

      // a stroke across the loaf, not along it: nothing happens
      drag(cut, { x: 605, y: 269 }, { x: 640, y: 269 }, 6, 16);
      expect(steps, 'cut the wrong way and it is still a whole loaf').toEqual([]);

      // and down it, which is the cut
      cut.down({ x: 611.5, y: 265 }, ev(0));
      cut.move({ x: 611.5, y: 285 }, ev(16));
      expect(steps, 'the loaf is two halves').toEqual([0]);
      expect(carry, 'and the half is there to be carried').not.toBeNull();

      // then it is only a carry, with nobody holding on
      drag(carry!, { x: 610, y: 269 }, { x: 470, y: 268 }, 8, 16);
      expect(steps).toEqual([0, 1]);
      expect(done).toBe(true);
    });
  });

  describe('a body', () => {
    const act: ActDef = ACTS['v6_road_dead:ours_now'];
    const from = { x: 872, y: 380 };
    const to = { x: 940, y: 452 };

    it('goes down on the way if it is hurried, and the ground keeps the place', () => {
      const man = fig(from.x, from.y, 12);
      const sc = scene({ man, edge: zone(to.x, to.y, 15) });
      const slips: { x: number; y: number }[] = [];
      const strain = { v: 0 };
      let done = false;
      const g = makeGesture(act, sc, { slip: (x, y) => slips.push({ x, y }) }, ctxWith(strain), () => {
        done = true;
      });
      // the whole way in a third of a second, which is not how a body moves
      drag(g, from, to, 20, 16);
      expect(slips.length).toBeGreaterThan(0);
      expect(done).toBe(false);
      // it lies where it left the hand, short of the edge
      expect(Math.hypot(man.x - to.x, man.y - to.y)).toBeGreaterThan(15);
      expect(strain.v).toBe(0);
    });

    it('stays in the hand if it is carried', () => {
      const man = fig(from.x, from.y, 12);
      const sc = scene({ man, edge: zone(to.x, to.y, 15) });
      const slips: { x: number; y: number }[] = [];
      let done = false;
      const g = makeGesture(act, sc, { slip: (x, y) => slips.push({ x, y }) }, ctxWith({ v: 0 }), () => {
        done = true;
      });
      // the same way, taken at a walk
      drag(g, from, to, 40, 80);
      expect(slips).toEqual([]);
      expect(done).toBe(true);
    });

    it('can be picked up again where it fell', () => {
      const man = fig(from.x, from.y, 12);
      const sc = scene({ man, edge: zone(to.x, to.y, 15) });
      let done = false;
      const g = makeGesture(act, sc, {}, ctxWith({ v: 0 }), () => {
        done = true;
      });
      drag(g, from, to, 20, 16);
      expect(done).toBe(false);
      const fell = { x: man.x, y: man.y };
      drag(g, fell, to, 40, 80);
      expect(done).toBe(true);
    });
  });

  describe('a child who is not going', () => {
    const act: ActDef = ACTS['d1_pies:guild'];

    it('takes the ground back the moment the hand stops', () => {
      const iva = fig(752, 266, 9);
      const sc = scene({ iva, guild: zone(884, 302, 14) });
      const g = makeGesture(act, sc, {}, ctxWith({ v: 0 }), () => {});
      // the hand pulls, step by step, and she comes because it keeps pulling
      g.down({ x: 752, y: 266 }, ev(0));
      for (let i = 1; i <= 20; i++) {
        g.move({ x: 752 + i * 3, y: 266 + i }, ev(i * 16));
        g.frame?.(16);
      }
      const pulled = iva.x;
      expect(pulled).toBeGreaterThan(760);
      // the hand stops; she does not
      for (let t = 0; t < 600; t += 16) g.frame?.(16);
      expect(iva.x).toBeLessThan(pulled);
    });

    it('is judged by where she is, not by where the hand ended up', () => {
      const iva = fig(752, 266, 9);
      const sc = scene({ iva, guild: zone(884, 302, 14) });
      let done = false;
      const g = makeGesture(act, sc, {}, ctxWith({ v: 0 }), () => {
        done = true;
      });
      // the hand goes there at once and lets go: she is still at the gate
      g.down({ x: 752, y: 266 }, ev(0));
      g.move({ x: 884, y: 302 }, ev(0));
      g.up({ x: 884, y: 302 }, ev(0));
      expect(done).toBe(false);
    });
  });

  describe('a basket that will not stand still', () => {
    const act: ActDef = ACTS['d1_pies:barred'];

    it('burns only while the torch is on it, and the scene gets a say each frame', () => {
      const basket = fig(762, 273, 8);
      const sc = scene({ basket });
      let frames = 0;
      let last = 0;
      const g = makeGesture(
        act,
        sc,
        {
          frame: () => {
            frames += 1;
          },
          progress: (p) => {
            last = p;
          },
        },
        ctxWith({ v: 0 }),
        () => {},
      );
      g.down({ x: 762, y: 273 }, ev(0));
      for (let t = 0; t < 500; t += 16) g.frame?.(16);
      expect(frames).toBeGreaterThan(20);
      const lit = last;
      expect(lit).toBeGreaterThan(0.1);
      // she takes it out of reach: the fire goes out faster than it came
      basket.set(762 + 40, 273);
      for (let t = 0; t < 200; t += 16) g.frame?.(16);
      expect(last).toBeLessThan(lit);
    });

    it('follows her: the torch stays on the basket wherever it goes', () => {
      const basket = fig(762, 273, 8);
      const sc = scene({ basket });
      let last = 0;
      const g = makeGesture(
        act,
        sc,
        {
          // the scene runs, and the hand runs after it
          frame: () => basket.set(basket.x - 0.4, basket.y),
          progress: (p) => {
            last = p;
          },
        },
        ctxWith({ v: 0 }),
        () => {},
      );
      g.down({ x: 762, y: 273 }, ev(0));
      for (let t = 0; t < 320; t += 16) {
        g.move({ x: basket.x, y: basket.y }, ev(t));
        g.frame?.(16);
      }
      expect(last).toBeGreaterThan(0.1);
    });
  });
});
