import { useEffect } from 'react';
import type { EpithetDef } from '../../content/epithets';
import { UI } from '../../content/ui-strings';
import { PersonPortrait } from './PersonPortrait';
import { reducedMotion } from '../motion';

interface Props {
  epithet: EpithetDef;
  onDone: () => void;
}

/** Long enough to read the name and the reason for it, twice, and no longer. */
const HOLD_MS = 4800;

/**
 * Somewhere between one year and the next, the place stopped describing you
 * and started naming you. You were not asked, you cannot refuse it, and it is
 * going to follow you, so it happens in the middle of the screen. The Fool
 * brings it, the way the Treasurer brings the winter: gossip about the throne
 * is a fool's trade before it is anybody else's.
 */
export function EpithetMoment({ epithet, onDone }: Props) {
  useEffect(() => {
    const delay = reducedMotion() ? 0 : HOLD_MS;
    const id = window.setTimeout(onDone, delay);
    return () => window.clearTimeout(id);
  }, [onDone]);

  return (
    <button
      type="button"
      onClick={onDone}
      aria-label={UI.epithet.heading}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 px-5 backdrop-blur-sm"
    >
      <div className="drift-in w-full max-w-sm rounded-lg border border-seal bg-ink-soft p-5 text-left shadow-lg">
        <div className="flex items-center gap-3">
          <PersonPortrait character="fool" size={48} />
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.2em] text-seal">
              {UI.epithet.speaker}
            </div>
            <h2 className="text-lg leading-tight tracking-wide">{UI.epithet.heading}</h2>
          </div>
        </div>
        <h2 className="mt-3 border-t border-ink-line pt-3 text-2xl leading-tight tracking-wide">
          {epithet.name}
        </h2>
        <p className="mt-3 text-[14px] leading-relaxed text-parchment/90">{epithet.line}</p>
        <p className="mt-2 text-[13px] leading-relaxed text-parchment-dim">{epithet.aside}</p>
        <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-parchment-dim">
          {UI.epithet.kicker}
        </p>
      </div>
    </button>
  );
}
