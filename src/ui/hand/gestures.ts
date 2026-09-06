import type { ActDef, Resist } from './acts';
import type { ActHooks, Fig, Scene, Thing } from './scenes';
import { isFig } from './scenes';

/**
 * The six things a hand can do on the scene, in map units.
 *
 * Every gesture gets the pointer in the picture's own coordinates and decides
 * for itself when it is done. What the picture does about each step is the
 * scene's business (the hooks); what the camera does is the app's (the ctx).
 *
 * A punishment is not handed over. Anything taken off somebody who would
 * rather keep it resists the hand, and the resistance is where the answer
 * stops being a button: bread has to be pulled out of a man's fingers, a
 * child does not stand still to be burned, and a body is heavy and slips.
 */
export interface PointerLike {
  clientX: number;
  clientY: number;
  timeStamp: number;
}

export interface GestureCtx {
  /** How many map units one screen pixel is right now. */
  unitsPerPx(): number;
  /** Drag the camera by screen pixels. */
  pan(dxPx: number, dyPx: number): void;
  /** What the box is showing, in map units. */
  view(): { x: number; y: number; w: number; h: number };
  swingTool(): void;
  /** 0 to 1: how close the hand is to losing what it is carrying. */
  strainTool(v: number): void;
}

export interface Gesture {
  down(p: { x: number; y: number }, e: PointerLike): void;
  move(p: { x: number; y: number }, e: PointerLike): void;
  up(p: { x: number; y: number }, e: PointerLike): void;
  frame?(dt: number): void;
}

/** A shake is a shake at this pace; slower is a drag. */
const SHAKE_MS = 300;
const SHAKE_PX = 18;
const TAP_MS = 250;
/** How far past the stretch a yank has to go to count as a yank. */
const YANK_PX = 26;
/** How far the torch may stray from what it is burning. */
const HOLD_SLACK = 4;

/* what a body does to the hand carrying it */
const HEAVY_TAU = 165;
const HEAVY_SPEED = 95;
const GRIP_EASE = 5;
const GRIP_DRAIN = 0.13;
const GRIP_BACK = 0.3;

const dist = (a: { x: number; y: number }, b: { x: number; y: number }): number =>
  Math.hypot(a.x - b.x, a.y - b.y);
const clamp = (v: number, a: number, b: number): number => Math.max(a, Math.min(b, v));

/**
 * `base` is how many steps the acts before this one in a chain already took,
 * so a scene hears "step 1" for the carry that follows a cut and not a second
 * "step 0".
 */
export function makeGesture(
  act: ActDef,
  sc: Scene,
  hooks: ActHooks,
  ctx: GestureCtx,
  onDone: () => void,
  base = 0,
): Gesture {
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    onDone();
  };
  const target = (): Thing => sc.get((act as { target: string }).target);

  switch (act.kind) {
    case 'carry': {
      let i = 0;
      let held: Fig | null = null;
      let off = { x: 0, y: 0 };
      /** Where the hand is holding it, which is not where it has got to. */
      let goal: { x: number; y: number } | null = null;
      /** Yanks so far on this step, and whether the fingers have opened. */
      let pulls = 0;
      let free = false;
      let armed = true;
      let grip = 1;

      /** Where the hand was last frame, so a rope can tell a pull from a hold. */
      let was: { x: number; y: number } | null = null;
      /** Every step is done: a stray pointer event after the last one is nothing. */
      const spent = () => i >= act.steps.length;
      const stepNow = () => act.steps[i];
      const resist = (): Resist | undefined => stepNow().resist;

      const advance = () => {
        const step = base + i;
        i += 1;
        pulls = 0;
        free = false;
        armed = true;
        grip = 1;
        hooks.step?.(step);
        if (i >= act.steps.length) finish();
      };

      return {
        down(p) {
          if (spent()) return;
          const it = sc.get(stepNow().item);
          if (!it.visible || !isFig(it)) return;
          if (dist(p, it) > it.r + 3) return;
          held = it;
          off = { x: it.x - p.x, y: it.y - p.y };
          goal = { x: it.x, y: it.y };
          was = { x: it.x, y: it.y };
          grip = 1;
          it.lift();
          hooks.grab?.(base + i);
        },
        move(p) {
          if (!held || spent()) return;
          const it = held;
          const r = resist();
          goal = { x: p.x + off.x, y: p.y + off.y };

          if (r?.kind === 'held' && !free) {
            // It is in somebody's hand. It stretches that far and no further,
            // and a yank past the stretch is a yank: he keeps it, and you
            // feel exactly how much of it you did not get.
            const home = it.home;
            const dx = goal.x - home.x;
            const dy = goal.y - home.y;
            const d = Math.hypot(dx, dy) || 0.0001;
            const slack = r.slack ?? 7;
            const reach = Math.min(d, slack);
            it.set(home.x + (dx / d) * reach, home.y + (dy / d) * reach);
            const yank = YANK_PX * ctx.unitsPerPx();
            if (armed && d > slack + yank) {
              pulls += 1;
              armed = false;
              if (pulls >= r.pulls) {
                free = true;
                it.set(goal.x, goal.y);
                hooks.freed?.(base + i);
              } else {
                it.set(home.x, home.y);
                hooks.pull?.(pulls);
              }
            } else if (!armed && d < slack + yank * 0.45) {
              armed = true;
            }
          } else if (!r || r.kind === 'held') {
            it.set(goal.x, goal.y);
          }

          const to = sc.get(stepNow().to);
          const judge = r?.kind === 'drag' ? { x: it.x, y: it.y } : goal;
          to.hl(dist(judge, to) <= to.r);
        },
        frame(dt) {
          if (!held || !goal || spent()) return;
          const it = held;
          const r = resist();
          // whatever travels with what is being carried travels now
          hooks.frame?.(dt, true);
          if (!r || r.kind === 'held') return;
          const dx = goal.x - it.x;
          const dy = goal.y - it.y;
          const d = Math.hypot(dx, dy) || 0.0001;
          if (r.kind === 'heavy' && d > 0.01) {
            // dead weight: it comes along behind the hand, and never faster
            const k = 1 - Math.exp(-dt / HEAVY_TAU);
            const step = Math.min(d, Math.min(d * k, HEAVY_SPEED * (dt / 1000)));
            it.set(it.x + (dx / d) * step, it.y + (dy / d) * step);
          }

          if (r.kind === 'drag') {
            // A rope, not a magnet: she moves the distance the hand takes up,
            // and the moment the hand stops she has the ground back.
            const hand = Math.hypot(goal.x - (was?.x ?? goal.x), goal.y - (was?.y ?? goal.y));
            const leash = r.leash ?? 6;
            if (d > leash && hand > 0) {
              const take = Math.min(d - leash, hand);
              it.set(it.x + (dx / d) * take, it.y + (dy / d) * take);
            }
            const hx = it.home.x - it.x;
            const hy = it.home.y - it.y;
            const hd = Math.hypot(hx, hy);
            const back = (r.back ?? 26) * (dt / 1000);
            if (hd > back) it.set(it.x + (hx / hd) * back, it.y + (hy / hd) * back);
            was = { x: goal.x, y: goal.y };
            const to = sc.get(stepNow().to);
            to.hl(dist(it, to) <= to.r);
            return;
          }

          // heavy: the further it hangs behind the hand, the sooner it goes
          const strain = Math.hypot(goal.x - it.x, goal.y - it.y);
          grip = clamp(
            grip + (dt / 1000) * (strain > GRIP_EASE ? -(strain - GRIP_EASE) * GRIP_DRAIN : GRIP_BACK),
            0,
            1,
          );
          ctx.strainTool(1 - grip);
          if (grip <= 0) {
            it.drop();
            hooks.slip?.(it.x, it.y);
            sc.get(stepNow().to).hl(false);
            held = null;
            goal = null;
            ctx.strainTool(0);
          }
        },
        up(p) {
          if (!held || spent()) return;
          const it = held;
          const r = resist();
          const to = sc.get(stepNow().to);
          held = null;
          goal = null;
          to.hl(false);
          it.drop();
          ctx.strainTool(0);
          if (r?.kind === 'held' && !free) {
            it.set(it.home.x, it.home.y);
            return;
          }
          // where the hand let go, except for somebody who has to be got there
          const judge = r?.kind === 'drag' ? { x: it.x, y: it.y } : { x: p.x + off.x, y: p.y + off.y };
          if (dist(judge, to) <= to.r) {
            it.set(judge.x, judge.y);
            advance();
          } else {
            it.moveTo(it.home.x, it.home.y, r?.kind === 'drag' ? 600 : 200);
          }
        },
      };
    }
    case 'stroke': {
      let on = false;
      let x0 = 0;
      let y0 = 0;
      return {
        down(p) {
          const tg = target();
          if (Math.abs(p.x - tg.x) <= tg.w / 2 + 4 && Math.abs(p.y - tg.y) <= tg.h / 2 + 5) {
            on = true;
            x0 = p.x;
            y0 = p.y;
            sc.strokeAt(p.x, p.y, p.x, p.y);
          }
        },
        move(p) {
          if (!on) return;
          const tg = target();
          sc.strokeAt(x0, y0, p.x, p.y);
          const proj = act.axis === 'x' ? Math.abs(p.x - x0) : Math.abs(p.y - y0);
          const need = act.axis === 'x' ? tg.w : tg.h;
          if (proj >= 0.6 * need) {
            on = false;
            sc.strokeAt(null);
            hooks.step?.(base);
            finish();
          }
        },
        up() {
          if (on) {
            on = false;
            sc.strokeAt(null);
          }
        },
      };
    }
    case 'shake': {
      let hold = false;
      let count = 0;
      let dir = 0;
      let ext = 0;
      let downX = 0;
      let lastT = 0;
      return {
        down(p, e) {
          const tg = target();
          if (dist(p, tg) <= tg.r + 3) {
            hold = true;
            downX = p.x;
            ext = p.x;
            dir = 0;
            lastT = e.timeStamp;
          }
        },
        move(p, e) {
          if (!hold) return;
          const tg = target();
          const th = SHAKE_PX * ctx.unitsPerPx();
          if (dir === 0) {
            if (Math.abs(p.x - ext) >= th) {
              dir = Math.sign(p.x - ext);
              ext = p.x;
              lastT = e.timeStamp;
            }
          } else if ((p.x - ext) * dir > 0) {
            ext = p.x;
          } else if ((ext - p.x) * dir >= th) {
            const fast = e.timeStamp - lastT <= SHAKE_MS;
            dir = -dir;
            ext = p.x;
            lastT = e.timeStamp;
            if (fast) {
              count += 1;
              hooks.step?.(count, act.spill[count - 1]);
              if (count >= act.count) {
                hold = false;
                if (isFig(tg)) tg.offset(0);
                finish();
                return;
              }
            }
          }
          if (isFig(tg)) tg.offset(clamp(p.x - downX, -10, 10) * 0.6);
        },
        up() {
          hold = false;
          const tg = target();
          if (isFig(tg)) tg.offset(0);
        },
      };
    }
    case 'hold': {
      let on = false;
      let prog = 0;
      let at = { x: 0, y: 0 };
      const onIt = () => dist(at, target()) <= target().r + HOLD_SLACK;
      return {
        down(p) {
          at = p;
          if (dist(p, target()) <= target().r + 4) on = true;
        },
        move(p) {
          at = p;
          if (on && !onIt()) on = false;
        },
        up() {
          on = false;
        },
        frame(dt) {
          if (done) return;
          // the scene gets its say first: what is being burned may run
          hooks.frame?.(dt, on);
          if (on && !onIt()) on = false;
          const step = dt / (act.seconds * 1000);
          // let go early and the fire dies twice as fast as it grew
          prog = on ? Math.min(1, prog + step) : Math.max(0, prog - 2 * step);
          hooks.progress?.(prog);
          if (prog >= 1) finish();
        },
      };
    }
    case 'taps': {
      let count = 0;
      let lastT = -1e9;
      return {
        down(p, e) {
          const tg = target();
          if (dist(p, tg) <= tg.r + 3 && e.timeStamp - lastT >= TAP_MS) {
            lastT = e.timeStamp;
            count += 1;
            ctx.swingTool();
            hooks.step?.(count);
            if (count >= act.count) finish();
          }
        },
        move() {},
        up() {},
      };
    }
    case 'turn_away': {
      let pan = false;
      let cx = 0;
      let cy = 0;
      return {
        down(_p, e) {
          pan = true;
          cx = e.clientX;
          cy = e.clientY;
        },
        move(_p, e) {
          if (!pan) return;
          ctx.pan(e.clientX - cx, e.clientY - cy);
          cx = e.clientX;
          cy = e.clientY;
        },
        up() {
          if (!pan) return;
          pan = false;
          const tg = target();
          const v = ctx.view();
          const out =
            tg.x + tg.r < v.x || tg.x - tg.r > v.x + v.w || tg.y + tg.r < v.y || tg.y - tg.r > v.y + v.h;
          if (out) finish();
        },
      };
    }
  }
}
