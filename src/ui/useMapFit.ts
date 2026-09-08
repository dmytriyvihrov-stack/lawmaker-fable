import { useLayoutEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { MAP } from './components/town/sites';

/**
 * How the picture sits in the window.
 *
 * The town is drawn once, at 1440 by 820, and then covers whatever window it
 * is given: the same rule an SVG uses for `xMidYMax slice`, worked out here as well so
 * that anything laid on top of the picture in HTML lands on the same spot the
 * picture drew. Without this the mark on the town and the card under it are
 * two coordinate systems that only agree on one window width.
 */
export interface MapFit {
  scale: number;
  ox: number;
  oy: number;
  /** The size of the box the picture is filling, for anything measured in it. */
  w: number;
  h: number;
}

export function fitToScreen(fit: MapFit, x: number, y: number): { x: number; y: number } {
  return { x: fit.ox + x * fit.scale, y: fit.oy + y * fit.scale };
}

export function fitToMap(fit: MapFit, x: number, y: number): { x: number; y: number } {
  if (fit.scale === 0) return { x: 0, y: 0 };
  return { x: (x - fit.ox) / fit.scale, y: (y - fit.oy) / fit.scale };
}

/**
 * A window too narrow to hang the whole picture in. Below this the town is
 * fitted across instead of cropped to the sides, which is a different frame
 * and not a smaller one.
 */
export const NARROW = 1000;

/**
 * How the picture is put into its box, for an `<svg>` to be told directly.
 *
 * Every svg laid over the town has to be given *these two* and not its own
 * guess at them. A wide window is `xMidYMax slice`, which is what the fit
 * above works out by hand; a narrow one is not, and an overlay that kept the
 * slice while the town went to a fitted viewBox was a second coordinate
 * system on the same pixels. That is exactly what happened to the near
 * scenes on a phone: the camera flew to a spot the fit knew about and the
 * scene was drawn three times too big and half a screen to the left of it,
 * so there was nothing under the finger and nothing on the screen either.
 */
export interface MapViewport {
  viewBox: string;
  preserveAspectRatio: string;
  /** The picture is fitted rather than cropped, so it has ground to spare. */
  narrow: boolean;
  /** The same four numbers, for anything that has to cover the whole of it. */
  x: number;
  y: number;
  w: number;
  h: number;
}

export function mapViewport(fit: MapFit): MapViewport {
  if (fit.scale <= 0 || fit.w >= NARROW) {
    return {
      viewBox: `0 0 ${MAP.w} ${MAP.h}`,
      preserveAspectRatio: 'xMidYMax slice',
      narrow: false,
      x: 0,
      y: 0,
      w: MAP.w,
      h: MAP.h,
    };
  }
  const x = -fit.ox / fit.scale;
  const y = -fit.oy / fit.scale;
  const w = fit.w / fit.scale;
  const h = fit.h / fit.scale;
  return {
    viewBox: `${x} ${y} ${w} ${h}`,
    preserveAspectRatio: 'none',
    narrow: true,
    x,
    y,
    w,
    h,
  };
}

/** Watches a box and says how the town is sitting inside it, right now. */
export function useMapFit(ref: RefObject<HTMLElement | null>): MapFit {
  const [fit, setFit] = useState<MapFit>({ scale: 1, ox: 0, oy: 0, w: MAP.w, h: MAP.h });
  /**
   * The box as it was when this fit was worked out.
   *
   * The whole of the fit is a function of these two numbers, so this is the
   * comparison, and it is made *before* the state is touched rather than
   * inside the updater. That is not a tidying: the effect below runs after
   * every render, and a `setState` inside a layout effect counts as a nested
   * update whether or not it changes anything. Fifty of those in one commit
   * and React tears the whole tree down with "maximum update depth exceeded",
   * which is a blank window and a lost reign. It took turning the dev switch
   * on over a busy frame to see it, because that is a commit with enough else
   * moving in it that the eager bail-out React normally applies does not.
   */
  const measured = useRef<{ w: number; h: number } | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const write = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w === 0 || h === 0) return;
      const was = measured.current;
      if (was && was.w === w && was.h === h) return;
      measured.current = { w, h };
      const narrow = w < NARROW;
      const scale = narrow ? w / MAP.w : Math.max(w / MAP.w, h / MAP.h);
      // the same rule the picture uses: centred across, hung from the bottom
      setFit({
        scale,
        ox: (w - MAP.w * scale) / 2,
        oy: narrow ? -120 * scale : h - MAP.h * scale,
        w,
        h,
      });
    };
    write();
    const observer = new ResizeObserver(write);
    observer.observe(el);
    return () => observer.disconnect();
    /* No dependency list on purpose. The box only exists on some screens, so a
       hook that measured once on mount measured a box that was not there yet
       and never looked again, which left every mark on the town a screen away
       from where the picture drew it. */
  });

  return fit;
}
