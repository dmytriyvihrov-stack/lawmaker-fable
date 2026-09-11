import { useEffect } from 'react';
import { characterTitle } from '../../content/meta';
import { UI } from '../../content/ui-strings';
import { PersonPortrait } from './PersonPortrait';
import { TYPE } from '../type';
import { reducedMotion } from '../motion';

interface Props {
  onDone: () => void;
}

/** Long enough to read and to look up at the corner it points to. */
const HOLD_MS = 6400;

/**
 * The year the workshops open, said out loud by the one person who would
 * notice.
 *
 * A cog appeared in the top bar somewhere around fifteen souls and nothing in
 * the game ever mentioned it. A whole screen arrived without a word, which is
 * the one thing this game is not supposed to do to a player: everything else
 * that opens - the charter, the boards, the crown, the name of the place -
 * arrives as somebody standing in front of you saying so.
 *
 * It sits under the bar rather than in the middle of the window, with its
 * point up at the cog, because the sentence is about that corner and a card in
 * the middle of the screen is about nothing in particular.
 */
export function TechOpened({ onDone }: Props) {
  useEffect(() => {
    const delay = reducedMotion() ? 0 : HOLD_MS;
    const id = window.setTimeout(onDone, delay);
    return () => window.clearTimeout(id);
  }, [onDone]);


  return (
    <button
      type="button"
      onClick={onDone}
      aria-label={UI.techs.opened}
      className="fixed inset-0 z-50 flex items-start justify-end bg-ink/70 p-4 backdrop-blur-sm"
    >
      <div className="drift-in relative mr-1 mt-1 w-full max-w-sm text-left">
        {/* the point, up at the cog in the bar it is talking about */}
        <span
          aria-hidden
          className="absolute -top-[7px] right-10 block h-3.5 w-3.5 rotate-45 border-l border-t border-seal bg-ink-soft"
        />
        <div className="rounded-lg border border-seal bg-ink-soft p-5 shadow-lg">
          <div className="flex items-center gap-3">
            <PersonPortrait character="clerk" size={52} />
            <div className="min-w-0">
              <div className={`${TYPE.label} text-seal`}>{UI.techs.opened}</div>
              <div className={`${TYPE.title} leading-tight text-parchment`}>
                {characterTitle('clerk')}
              </div>
            </div>
          </div>
          <p className={`mt-3 ${TYPE.body} leading-relaxed text-parchment/90`}>
            {UI.techs.openedLine}
          </p>
          <p className={`mt-3 flex items-center gap-2 ${TYPE.note} text-parchment-dim`}>
            <span aria-hidden>{UI.techs.openIcon}</span>
            {UI.techs.openedWhere}
          </p>
        </div>
      </div>
    </button>
  );
}
