import { useEffect } from 'react';
import { UI } from '../../content/ui-strings';
import type { TechDef } from '../../engine/types';
import { MovedBoards } from './MovedBoards';
import { reducedMotion } from '../motion';

interface Props {
  tech: TechDef;
  onDone: () => void;
}

/** Long enough to read and notice, short enough that it is not a screen. */
const HOLD_MS = 4200;

/**
 * Somebody in the place worked something out. You did not ask for it, you
 * cannot refuse it, and it is going to be true for the rest of your reign, so
 * it happens in the middle of the screen rather than in a list you never open.
 */
export function TechMoment({ tech, onDone }: Props) {
  useEffect(() => {
    const delay = reducedMotion() ? 0 : HOLD_MS;
    const id = window.setTimeout(onDone, delay);
    return () => window.clearTimeout(id);
  }, [onDone]);

  return (
    <button
      type="button"
      onClick={onDone}
      aria-label={UI.techs.worked}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 px-5 backdrop-blur-sm"
    >
      <div className="drift-in w-full max-w-sm rounded-lg border border-seal bg-ink-soft p-5 text-left shadow-lg">
        <div className="flex items-center gap-3">
          <span aria-hidden className="text-3xl leading-none">
            ⚙️
          </span>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.2em] text-seal">
              {UI.techs.worked}
            </div>
            <h2 className="text-lg leading-tight tracking-wide">{tech.name}</h2>
          </div>
        </div>
        <p className="mt-3 text-[14px] leading-relaxed text-parchment/90">{tech.line}</p>
        <div className="mt-3 border-t border-ink-line pt-2">
          <MovedBoards every={tech.trend} />
        </div>
        <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-parchment-dim">
          {UI.techs.workedKicker}
        </p>
      </div>
    </button>
  );
}
