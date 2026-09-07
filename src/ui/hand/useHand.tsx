import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react';
import { HAND_INSTRUCTIONS, HAND_STRIP } from '../../content/hand';
import { MAP } from '../components/town/sites';
import type { MapFit } from '../useMapFit';
import { actFor } from './acts';
import type { ActDef, Tool } from './acts';
import { Camera, WIDE } from './camera';
import { makeGesture } from './gestures';
import type { Gesture, GestureCtx } from './gestures';
import { DEFS, SCENES } from './scenes';
import type { ActHooks } from './scenes';
import { play } from '../audio/sound';

/**
 * The step between the word and the ruling.
 *
 * Some cases have a scene: a place in the town drawn close up, with the people
 * and the things the answer is about in it. For those, the camera comes in
 * when the door is opened, and the answer is not given by the tile alone. The
 * tile chooses; the hand then has to do it, on the scene, and only when it is
 * done does the reign hear about it.
 *
 * A case with no scene is ruled the way every case always was. That is the
 * fallback and it is silent: nothing in the rest of the game knows this layer
 * exists.
 */
export type HandStage = 'wide' | 'zooming' | 'decide' | 'act' | 'hold' | 'after';

/** How close the camera comes, and where in the frame the spot sits. */
const ZOOM = 4;
const FRAME = { decide: 0.28, act: 0.5, after: 0.3 };
const MS = { in: 700, settle: 300, out: 1100, hold: 600, back: 400 };
/** The thread never lands closer to a corner of the card than this. */
const TAIL_INSET = 44;

const TOOL_SYMBOL: Record<string, string> = {
  hand: '#mgHand',
  knife: '#mgKnife',
  torch: '#mgTorch',
  stick: '#mgStick',
  bucket: '#mgToolBucket',
};

interface Acting {
  caseId: string;
  choiceId: string;
  ruling?: string;
  text: string;
  hooks: ActHooks;
}

interface Props {
  mapRef: MutableRefObject<HTMLDivElement | null>;
  fit: MapFit;
  /** The case in front of the player, or null when it is anything else. */
  caseId: string | null;
  /** Where in the town it is happening, in map units. */
  spot: { x: number; y: number } | null;
  /** The case is actually in front of the player: no drift, no other screen. */
  ready: boolean;
  /** Where the card is on the box, so the thread can run down to it. */
  anchor: { left: number; top: number; width: number } | null;
  tone: 'seal' | 'bench';
  /** The ruling, once the hand has actually done it. */
  onAnswer: (choiceId: string, ruling?: string) => void;
}

export interface Hand {
  stage: HandStage;
  /** Where the thread lands on the card, in pixels from its left edge. */
  tailX: number | null;
  /** The camera is in on a scene, so the town's own mark and thread stand down. */
  zoomed: boolean;
  /** The hand is at work: no card, and nothing else may open. */
  busy: boolean;
  zoomRef: (el: HTMLDivElement | null) => void;
  overlay: ReactNode;
  strip: ReactNode;
  /** Take the ruling as an act. False when this answer has none. */
  choose: (caseId: string, choiceId: string, text: string, ruling?: string) => boolean;
  /** Go back out to the whole town, then carry on. False when it was never in. */
  leave: (then: () => void) => boolean;
}

export function useHand({ mapRef, fit, caseId, spot, ready, anchor, tone, onAnswer }: Props): Hand {
  const [stage, setStage] = useState<HandStage>('wide');
  const [acting, setActing] = useState<Acting | null>(null);
  const [tool, setTool] = useState<Tool>(null);

  const nearEl = useRef<SVGGElement | null>(null);
  const toolRef = useRef<SVGGElement | null>(null);
  const toolInRef = useRef<SVGGElement | null>(null);
  const camera = useRef(new Camera()).current;
  const gesture = useRef<Gesture | null>(null);
  /** The scene on screen, and how far it was moved from where it was drawn. */
  const open = useRef<{
    id: string;
    spot: { x: number; y: number };
    off: { x: number; y: number };
    /** The camera is on its way back out, so nothing should tidy it away. */
    leaving?: boolean;
  } | null>(null);
  /** A hand under strain shakes; this is the shake, and it is nobody's dice. */
  const wobble = useRef(0);

  /**
   * The camera drives the zoom wrapper, and the near layer fades up inside it.
   *
   * Both are taken as the element arrives rather than on mount: the town is
   * not on the screen when the game starts, so a hook that reaches for the box
   * once and keeps whatever it found reaches for nothing at all.
   */
  const zoomRef = useCallback(
    (el: HTMLDivElement | null) => {
      camera.onApply = (z) => {
        const near = Math.max(0, Math.min(1, (z - 2.2) / 0.4));
        nearEl.current?.setAttribute('opacity', String(near));
      };
      camera.attach(el);
    },
    [camera],
  );

  /* every scene is built once, into the overlay, and hidden until it is wanted */
  const nearRef = useCallback((el: SVGGElement | null) => {
    nearEl.current = el;
    if (!el || el.childElementCount > 0) return;
    for (const id of Object.keys(SCENES)) SCENES[id].build(el);
  }, []);

  /* The camera works in the box the picture is actually sitting in. It is set
     here rather than in an effect because a flight can be started in the same
     commit the box is first measured in, and a frame worked out for a box that
     was never on the screen puts the scene above the top of the window. */
  camera.fit = fit;

  useEffect(() => {
    camera.fit = fit;
    const at = open.current?.spot;
    // a window that changes size under a scene keeps the scene in the frame
    if (at && (stage === 'decide' || stage === 'after')) {
      camera.set(camera.frameFor(at, 0.5, stage === 'decide' ? FRAME.decide : FRAME.after, ZOOM));
    } else {
      camera.apply();
    }
  }, [camera, fit, stage]);

  /* the hand, frame by frame, while there is an act to do */
  useEffect(() => {
    if (stage !== 'act') return;
    let last = -1;
    let id = 0;
    const loop = (now: number) => {
      const dt = last < 0 ? 16 : Math.min(50, now - last);
      last = now;
      gesture.current?.frame?.(dt);
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [stage]);

  const shut = useCallback(() => {
    camera.halt();
    gesture.current = null;
    setTool(null);
    setActing(null);
    if (open.current) SCENES[open.current.id].setVisible(false);
    open.current = null;
    setStage('wide');
    camera.set(WIDE);
  }, [camera]);

  /**
   * A scene is up only while its case is. The reign moving on takes it down,
   * and so does the card going away without an answer: the years can start
   * drifting again in the same frame a case becomes current, and a town zoomed
   * in on somebody nobody has answered the door to yet is a lie about where
   * the player is.
   */
  useEffect(() => {
    const o = open.current;
    if (!o) return;
    if (o.id !== caseId) {
      shut();
      return;
    }
    if (o.leaving) return;
    if (!ready && (stage === 'zooming' || stage === 'decide')) shut();
  }, [caseId, ready, stage, shut]);

  const toScene = (p: { x: number; y: number }) => {
    const off = open.current?.off ?? { x: 0, y: 0 };
    return { x: p.x - off.x, y: p.y - off.y };
  };

  const ctx: GestureCtx = {
    unitsPerPx: () => camera.unitsPerPx(),
    pan: (dx, dy) => camera.pan(dx, dy),
    view: () => {
      const v = camera.view();
      const off = open.current?.off ?? { x: 0, y: 0 };
      return { x: v.x - off.x, y: v.y - off.y, w: v.w, h: v.h };
    },
    swingTool: () => {
      const g = toolInRef.current;
      if (!g) return;
      g.setAttribute('transform', 'rotate(-40)');
      window.setTimeout(() => g.setAttribute('transform', ''), 90);
    },
    /* The hand shakes before it loses what it is holding, so a body going
       down is something you felt coming and not something that happened. */
    strainTool: (v) => {
      const g = toolInRef.current;
      if (!g) return;
      if (v < 0.05) {
        wobble.current = 0;
        g.setAttribute('transform', '');
        return;
      }
      wobble.current += 1;
      const a = Math.sin(wobble.current * 2.1) * v * 9;
      g.setAttribute('transform', `rotate(${a.toFixed(1)}) translate(0 ${(v * 1.2).toFixed(2)})`);
    },
  };

  const frameFor = (at: { x: number; y: number }, fy: number) =>
    camera.frameFor(at, 0.5, fy, ZOOM);

  function finishAct(a: Acting) {
    play('rustle');
    gesture.current = null;
    setTool(null);
    setStage('hold');
    a.hooks.done?.();
    // the scene holds for a beat, and only then does the reign hear of it
    window.setTimeout(() => {
      setActing(null);
      setStage('after');
      const at = open.current?.spot;
      if (at) camera.flyTo(frameFor(at, FRAME.after), MS.settle);
      onAnswer(a.choiceId, a.ruling);
    }, MS.hold);
  }

  function beginAct(a: Acting, act: ActDef, base = 0) {
    const sc = SCENES[a.caseId];
    setTool(act.tool);
    const contact = () => play(act.tool === 'bucket' ? 'water'
      : act.tool === 'torch' ? 'fire'
      : act.kind === 'taps' ? 'wood'
      : act.kind === 'shake' ? 'stone' : 'rustle', .14);
    let heat = 0;
    const hooks: ActHooks = {
      ...a.hooks,
      grab: (i) => { contact(); a.hooks.grab?.(i); },
      step: (i, kind) => { contact(); a.hooks.step?.(i, kind); },
      pull: (n) => { play('strain', .18); a.hooks.pull?.(n); },
      freed: (i) => { play('rustle'); a.hooks.freed?.(i); },
      slip: (x, y) => { play('wood'); a.hooks.slip?.(x, y); },
      progress: (p) => {
        if (p > heat + .1) { contact(); heat = p; }
        if (p < heat) heat = p;
        a.hooks.progress?.(p);
      },
    };
    gesture.current = makeGesture(
      act,
      sc,
      hooks,
      ctx,
      () => {
        if (act.then) {
          const next = act.then;
          const taken = act.kind === 'carry' ? act.steps.length : 1;
          gesture.current = null;
          window.setTimeout(() => beginAct(a, next, base + taken), 250);
          return;
        }
        finishAct(a);
      },
      base,
    );
  }

  const putDown = () => {
    const at = open.current?.spot;
    if (!acting || !at) return;
    gesture.current = null;
    setTool(null);
    SCENES[acting.caseId].reset();
    setActing(null);
    setStage('zooming');
    camera.flyTo(frameFor(at, FRAME.decide), MS.back, () => setStage('decide'));
  };

  /* ---------- what the app calls ---------- */

  /**
   * A case with a scene opens it as soon as it is in front of the player,
   * however it got there: the door knocked and was answered, a reign was
   * loaded back in the middle of one, or a year simply arrived at it. Before
   * paint, so the card never shows for a frame over the wide town first.
   */
  useLayoutEffect(() => {
    if (!ready || !caseId || !spot || stage !== 'wide' || open.current) return;
    const sc = SCENES[caseId];
    if (!sc) return;
    sc.reset();
    sc.anchorAt(spot);
    sc.setVisible(true);
    open.current = { id: caseId, spot, off: { x: spot.x - sc.home.x, y: spot.y - sc.home.y } };
    setStage('zooming');
    camera.flyTo(frameFor(spot, FRAME.decide), MS.in, () => setStage('decide'));
  });

  const choose = (id: string, choiceId: string, text: string, ruling?: string): boolean => {
    const at = open.current?.spot;
    const act = actFor(id, choiceId);
    if (!act || !at || open.current?.id !== id || stage !== 'decide') return false;
    const sc = SCENES[id];
    sc.reset();
    const hooks = sc.acts[choiceId] ?? {};
    hooks.arm?.();
    const a: Acting = { caseId: id, choiceId, ruling, text, hooks };
    setActing(a);
    setStage('act');
    camera.flyTo(frameFor(at, sc.actFy ?? FRAME.act), MS.settle);
    beginAct(a, act);
    return true;
  };

  const leave = (then: () => void): boolean => {
    if (stage !== 'after' || !open.current) return false;
    const id = open.current.id;
    open.current.leaving = true;
    setStage('zooming');
    camera.flyTo(WIDE, MS.out, () => {
      SCENES[id].setVisible(false);
      open.current = null;
      setStage('wide');
      then();
    });
    return true;
  };

  /* ---------- the pointer, on the scene ---------- */

  const toMap = (e: ReactPointerEvent) => {
    const b = mapRef.current?.getBoundingClientRect();
    if (!b) return { x: 0, y: 0 };
    return camera.boxToMap(e.clientX - b.left, e.clientY - b.top);
  };
  const placeTool = (p: { x: number; y: number }) => {
    toolRef.current?.setAttribute('transform', `translate(${p.x} ${p.y})`);
  };
  const onPointerDown = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (stage !== 'act' || !gesture.current) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* a pointer the browser does not know still counts */
    }
    const p = toMap(e);
    placeTool(p);
    gesture.current.down(toScene(p), e.nativeEvent);
  };
  const onPointerMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (stage !== 'act' || !gesture.current) return;
    const p = toMap(e);
    placeTool(p);
    gesture.current.move(toScene(p), e.nativeEvent);
  };
  const onPointerUp = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (stage !== 'act' || !gesture.current) return;
    gesture.current.up(toScene(toMap(e)), e.nativeEvent);
  };

  const zoomed = stage !== 'wide';
  const busy = stage === 'zooming' || stage === 'act' || stage === 'hold';

  /* Both ends of the thread, through the camera rather than through the fit:
     the scene is inside the zoom and the card is not, so the wide mapping the
     town uses would land it somewhere else entirely. */
  const tailX =
    zoomed && anchor && spot
      ? Math.max(
          TAIL_INSET,
          Math.min(anchor.width - TAIL_INSET, camera.mapToBox(spot).x - anchor.left),
        )
      : null;
  const tailTo =
    zoomed && anchor && tailX !== null ? camera.boxToMap(anchor.left + tailX, anchor.top) : null;

  const overlay = (
    <svg
      viewBox={`0 0 ${MAP.w} ${MAP.h}`}
      preserveAspectRatio="xMidYMax slice"
      className="absolute inset-0 h-full w-full"
      style={{
        pointerEvents: stage === 'act' ? 'auto' : 'none',
        cursor: stage === 'act' && tool ? 'none' : 'default',
        touchAction: 'none',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <defs dangerouslySetInnerHTML={{ __html: DEFS }} />
      <g ref={nearRef} opacity="0" />
      {/* while the camera is in, the curtain and the thread are drawn here,
          because the town's own are laid out for the whole picture */}
      {zoomed && !busy && <rect width={MAP.w} height={MAP.h} fill="#14110d" opacity=".34" />}
      {zoomed && !busy && spot && tailTo && (
        <path
          d={`M${spot.x} ${spot.y + 30} L${tailTo.x} ${tailTo.y}`}
          stroke={tone === 'bench' ? 'var(--color-bench)' : 'var(--color-seal)'}
          strokeWidth="8"
          strokeLinecap="round"
          opacity=".4"
        />
      )}
      <g ref={toolRef} style={{ display: tool ? undefined : 'none' }} pointerEvents="none">
        <g ref={toolInRef}>
          <use href={tool ? TOOL_SYMBOL[tool] : '#mgHand'} />
        </g>
      </g>
    </svg>
  );

  const strip =
    stage === 'act' && acting ? (
      <div className="pointer-events-auto relative grid w-full max-w-[1140px] grid-cols-[minmax(0,300px)_1fr_auto] items-center gap-5 rounded-2xl border border-bench bg-ink-soft/95 px-6 py-3 shadow-[0_20px_44px_rgba(0,0,0,0.5)] backdrop-blur-[2px]">
        {/* The ground fading into the bar rather than being cut by it. At 4x
            the scene fills the frame and whoever is standing in the last strip
            of it met a hard edge halfway up their body: a digger sliced off at
            the waist, which reads as a drawing error and not as depth. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-12 block h-12 bg-gradient-to-b from-transparent to-ink-soft/95"
        />
        <div className="min-w-0">
          <div className="text-[9px] uppercase tracking-[0.2em] text-parchment-dim">
            {HAND_STRIP.kicker}
          </div>
          <div className="truncate text-[12px] italic leading-snug text-parchment-dim">
            {acting.ruling ?? acting.text}
          </div>
        </div>
        <div className="text-center text-[17px] tracking-wide text-parchment">
          {HAND_INSTRUCTIONS[`${acting.caseId}:${acting.choiceId}`]}
        </div>
        <button
          type="button"
          onClick={putDown}
          className="rounded-full border border-ink-line px-4 py-1.5 text-[11px] uppercase tracking-[0.15em] text-parchment-dim hover:border-parchment-dim hover:text-parchment"
        >
          {HAND_STRIP.putDown}
        </button>
      </div>
    ) : null;

  return { stage, tailX, zoomed, busy, zoomRef, overlay, strip, choose, leave };
}
