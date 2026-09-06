import type { MapFit } from '../useMapFit';

/**
 * The camera over the town.
 *
 * The picture is drawn once, at 1440 by 820, and sits in its box the way
 * useMapFit says. The camera is a CSS transform on the box's contents: a zoom
 * and an offset, flown from the whole place to one spot and back. Nothing in
 * the picture knows it is being looked at closer.
 */
export interface CamState {
  z: number;
  tx: number;
  ty: number;
}

export const WIDE: CamState = { z: 1, tx: 0, ty: 0 };
export const ZOOM = 4;

const easeInOut = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export class Camera {
  z = 1;
  tx = 0;
  ty = 0;
  fit: MapFit = { scale: 1, ox: 0, oy: 0, w: 1440, h: 820 };
  /** Called after every change, with the zoom, so the layers can fade. */
  onApply: ((z: number) => void) | null = null;
  private el: HTMLElement | null = null;
  private stop: (() => void) | null = null;

  attach(el: HTMLElement | null): void {
    this.el = el;
    this.apply();
  }

  apply(): void {
    if (this.el) this.el.style.transform = `translate(${this.tx}px, ${this.ty}px) scale(${this.z})`;
    if (this.onApply) this.onApply(this.z);
  }

  /** The frame that puts a spot at a fraction of the box, at this zoom. */
  frameFor(spot: { x: number; y: number }, fx: number, fy: number, z = ZOOM): CamState {
    const f = this.fit;
    const target = {
      z,
      tx: fx * f.w - z * (f.ox + spot.x * f.scale),
      ty: fy * f.h - z * (f.oy + spot.y * f.scale),
    };
    return this.clamped(target);
  }

  clamped(c: CamState): CamState {
    const f = this.fit;
    return {
      z: c.z,
      tx: Math.min(0, Math.max(f.w - c.z * f.w, c.tx)),
      ty: Math.min(0, Math.max(f.h - c.z * f.h, c.ty)),
    };
  }

  set(c: CamState): void {
    this.z = c.z;
    this.tx = c.tx;
    this.ty = c.ty;
    this.apply();
  }

  flyTo(target: CamState, ms: number, done?: () => void): void {
    this.halt();
    const from = { z: this.z, tx: this.tx, ty: this.ty };
    let stopped = false;
    let t0 = -1;
    let raf = 0;
    let timer = 0;
    // A flight is a state change as much as a picture: it has to land even
    // in a tab the browser has stopped painting, so a timer backs the frame.
    const frame = (now: number) => {
      if (stopped) return;
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      if (t0 < 0) t0 = now;
      const t = Math.min(1, (now - t0) / ms);
      const k = easeInOut(t);
      this.z = from.z + (target.z - from.z) * k;
      this.tx = from.tx + (target.tx - from.tx) * k;
      this.ty = from.ty + (target.ty - from.ty) * k;
      this.apply();
      if (t < 1) schedule();
      else {
        this.stop = null;
        if (done) done();
      }
    };
    const schedule = () => {
      raf = requestAnimationFrame(frame);
      timer = window.setTimeout(() => frame(performance.now()), 48);
    };
    this.stop = () => {
      stopped = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
    schedule();
  }

  halt(): void {
    if (this.stop) this.stop();
    this.stop = null;
  }

  /** Drag the picture by a distance in screen pixels. */
  pan(dxPx: number, dyPx: number): void {
    this.set(this.clamped({ z: this.z, tx: this.tx + dxPx, ty: this.ty + dyPx }));
  }

  /** How many map units one screen pixel is, right now. */
  unitsPerPx(): number {
    return 1 / (this.fit.scale * this.z);
  }

  boxToMap(bx: number, by: number): { x: number; y: number } {
    const f = this.fit;
    return { x: ((bx - this.tx) / this.z - f.ox) / f.scale, y: ((by - this.ty) / this.z - f.oy) / f.scale };
  }

  mapToBox(m: { x: number; y: number }): { x: number; y: number } {
    const f = this.fit;
    return { x: (f.ox + m.x * f.scale) * this.z + this.tx, y: (f.oy + m.y * f.scale) * this.z + this.ty };
  }

  /** The part of the map the box is showing, in map units. */
  view(): { x: number; y: number; w: number; h: number } {
    const a = this.boxToMap(0, 0);
    const b = this.boxToMap(this.fit.w, this.fit.h);
    return { x: a.x, y: a.y, w: b.x - a.x, h: b.y - a.y };
  }
}
