import { useLayoutEffect, useState } from 'react';
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

/** Watches a box and says how the town is sitting inside it, right now. */
export function useMapFit(ref: RefObject<HTMLElement | null>): MapFit {
  const [fit, setFit] = useState<MapFit>({ scale: 1, ox: 0, oy: 0, w: MAP.w, h: MAP.h });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const write = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w === 0 || h === 0) return;
      const scale = Math.max(w / MAP.w, h / MAP.h);
      setFit((old) => {
        // the same rule the picture uses: centred across, hung from the bottom
        const next = {
          scale,
          ox: (w - MAP.w * scale) / 2,
          oy: h - MAP.h * scale,
          w,
          h,
        };
        // a state write per resize frame is fine; a write per identical frame
        // is a render loop, and a ResizeObserver will happily supply those
        return old.scale === next.scale && old.ox === next.ox && old.oy === next.oy && old.h === next.h
          ? old
          : next;
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
