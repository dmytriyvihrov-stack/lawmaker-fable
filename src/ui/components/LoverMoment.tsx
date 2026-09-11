import { useEffect } from 'react';
import { BOND_UI } from '../../content/bonds';
import { characterTitle } from '../../content/meta';
import { monarchOf } from '../../engine/monarch';
import type { GameState } from '../../engine/types';
import { MonarchPortrait } from './MonarchPortrait';
import { PersonPortrait } from './PersonPortrait';
import { reducedMotion } from '../motion';

interface Props {
  state: GameState;
  character: string;
  onDone: () => void;
}

/** Long enough to watch it happen, and not long enough to be a cutscene. */
const HOLD_MS = 4200;

/**
 * The one you took, come up to the house.
 *
 * Every other moment in this game is something arriving at you: a name the
 * place has settled on, a thing the place has worked out, a winter. This one
 * is the only one you ask for. The two faces lean into the gap between them,
 * the gap fills with what a gap between two faces fills with, and the crown is
 * four points better for the rest of the year.
 */
export function LoverMoment({ state, character, onDone }: Props) {
  useEffect(() => {
    const delay = reducedMotion() ? 0 : HOLD_MS;
    const id = window.setTimeout(onDone, delay);
    return () => window.clearTimeout(id);
  }, [onDone]);

  const monarch = monarchOf(state.seed);
  const them = characterTitle(character);

  return (
    <button
      type="button"
      onClick={onDone}
      aria-label={BOND_UI.kissHeading}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 px-5 backdrop-blur-sm"
    >
      <div className="drift-in w-full max-w-sm rounded-lg border border-seal bg-ink-soft p-5 text-center shadow-lg">
        <h2 className="text-lg leading-tight tracking-wide">{BOND_UI.kissHeading}</h2>

        {/* the two of them, leaning in, with the hearts going up between */}
        <div className="relative mt-4 flex items-end justify-center">
          <div className="lover-lean lover-lean-left">
            <MonarchPortrait monarch={monarch} mood={state.stats.crownSanity} size={84} />
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-8 flex justify-center">
            <span aria-hidden className="lover-heart" style={{ animationDelay: '0s' }}>
              {BOND_UI.loverMark}
            </span>
            <span aria-hidden className="lover-heart" style={{ animationDelay: '.5s' }}>
              {BOND_UI.loverMark}
            </span>
            <span aria-hidden className="lover-heart" style={{ animationDelay: '1s' }}>
              {BOND_UI.loverMark}
            </span>
          </div>
          <div className="lover-lean lover-lean-right">
            <PersonPortrait character={character} size={84} />
          </div>
        </div>

        <p className="mt-4 text-[14px] leading-relaxed text-parchment/90">{them}</p>
        <p className="mt-2 text-[13px] leading-relaxed text-parchment-dim">{BOND_UI.kissAside}</p>
      </div>
    </button>
  );
}
