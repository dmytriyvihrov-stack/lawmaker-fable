import { useCallback, useEffect, useRef, useState } from 'react';
import { along, pathLength } from './routes';
import { canAnswer, chooseJob, followVisitor, newJourney, queueErrand, requestVisit, skipJourney, tickJourney, WALK_SPEED } from './model';
import type { Errand, Job, Journey, Visit } from './model';

export function useJourney({ reign, visit, speed, paused, instant, onComplete }: {
  reign: number | null;
  visit: Visit | null;
  speed: number;
  paused: boolean;
  instant: boolean;
  onComplete: (errand: Errand) => void;
}) {
  const live = useRef(newJourney());
  const [snapshot, setSnapshot] = useState(live.current);
  const rulerRef = useRef<SVGGElement>(null);
  const callerRef = useRef<SVGGElement>(null);
  const progressRef = useRef<SVGCircleElement>(null);
  const delivered = useRef(new Set<string>());
  const options = useRef({ speed, paused, instant, onComplete });
  options.current = { speed, paused, instant, onComplete };

  const paint = useCallback((s: Journey) => {
    rulerRef.current?.setAttribute('transform', `translate(${s.at.x} ${s.at.y})`);
    const caller = s.mode === 'event-walk'
      ? along(s.path, s.elapsed * WALK_SPEED + 24)
      : s.mode === 'arrived' ? { x: s.at.x + 22, y: s.at.y - 3 } : s.callerAt;
    if (caller) callerRef.current?.setAttribute('transform', `translate(${caller.x} ${caller.y})`);
    const length = pathLength(s.path);
    const progress = s.mode === 'collect-work' ? s.elapsed / 2.2
      : length > 0 ? s.elapsed * WALK_SPEED / length : 0;
    progressRef.current?.setAttribute('stroke-dashoffset', String(100 * (1 - Math.min(1, progress))));
  }, []);

  const update = useCallback((next: Journey, always = false) => {
    const before = live.current;
    live.current = next;
    paint(next);
    if (always || next.mode !== before.mode || next.errands !== before.errands || next.visit !== before.visit || next.job !== before.job || next.path !== before.path) setSnapshot(next);
    for (const errand of next.completed) {
      if (delivered.current.has(errand.key)) continue;
      delivered.current.add(errand.key);
      options.current.onComplete(errand);
    }
  }, [paint]);

  useEffect(() => {
    delivered.current.clear();
    update(newJourney(), true);
  }, [reign, update]);

  useEffect(() => {
    update(requestVisit(live.current, visit));
    // The key is the identity of a visit; weather and ledger changes are not.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visit?.key, update]);

  useEffect(() => { paint(live.current); });

  useEffect(() => {
    if (reign === null) return;
    let frame = 0, previous = 0;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const tick = (now: number) => {
      const dt = previous ? Math.min(.1, (now - previous) / 1000) : 0;
      previous = now;
      const { paused: hold, speed: rate, instant: quick } = options.current;
      if (!hold) {
        const s = live.current;
        const skip = (quick || reduced.matches) && !['working', 'briefing', 'arrived'].includes(s.mode);
        update(skip ? skipJourney(s) : tickJourney(s, dt * rate));
      }
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [reign, update]);

  return {
    snapshot, rulerRef, callerRef, progressRef,
    collect: (errand: Errand) => update(queueErrand(live.current, errand)),
    follow: () => update(followVisitor(live.current)),
    job: (next: Job) => update(chooseJob(live.current, next)),
    skip: () => update(skipJourney(live.current)),
    ready: (key: string) => canAnswer(snapshot, key),
  };
}
export type JourneyControl = ReturnType<typeof useJourney>;
