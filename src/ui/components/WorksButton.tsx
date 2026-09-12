import { useState } from 'react';
import { UI } from '../../content/ui-strings';
import { hasSeenNote, markNoteSeen } from '../../engine/save';
import { buildableNow, workSpent } from '../../engine/simulation';
import type { GameState } from '../../engine/types';
import { TYPE } from '../type';

interface Props {
  state: GameState;
  onOpen: () => void;
  /** The box it is drawn in, which belongs to the row or column it sits in. */
  className: string;
  disabled?: boolean;
}

/**
 * The mark that opens the shelf.
 *
 * The year of work used to be a card that came up when the year reached it
 * and at no other time, so the one question a player asks all year, "what
 * could I put up, and what would it cost", had no answer until the autumn.
 * This opens the same shelf in any season. Three things are on the mark
 * itself: a count, a slow breath on the year that is waiting to be spent, and
 * a dimming when the year is already spent, because then the shelf can be
 * read and nothing on it taken.
 *
 * **The count is how many things the store could pay for today**
 * (`buildableNow`). It used to be how many of them were *new* since the shelf
 * was last opened, which is a fact about the reader's memory and not about
 * the place: a hamlet with four affordable works and nothing new since April
 * wore no mark at all, and the year went by. Since the year no longer stops
 * and waits to be spent, this mark is the whole of what says a year is still
 * there to spend, so it says the useful number. Asked for by the user, who
 * put the reason plainly: it is their choice and their responsibility to
 * look.
 *
 * It waits on the money either way. A red number is an errand, and an errand
 * nobody can run is the kind of mark a player learns to stop looking at.
 *
 * The first time a year ever waits on it the note underneath says what the
 * mark is for, once per browser, the same terms as the other two notes in
 * `save.ts`.
 */
export function WorksButton({ state, onOpen, className, disabled = false }: Props) {
  const open = buildableNow(state);
  const spent = workSpent(state);
  /** The year has come round to it and nothing has been picked yet. */
  const waiting = state.phase === 'works';
  const [note, setNote] = useState(() => !hasSeenNote('shelf'));
  const what = spent
    ? UI.works.spentShort
    : open.length > 1
      ? UI.works.canBuild.replace('{n}', String(open.length))
      : open.length === 1
        ? UI.works.canBuildOne
        : waiting
          ? UI.works.waitingShort
          : UI.works.canBuildNone;
  const title = what ? `${UI.works.open}: ${what}` : UI.works.open;

  return (
    <button
      type="button"
      onClick={() => {
        if (note) {
          markNoteSeen('shelf');
          setNote(false);
        }
        onOpen();
      }}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={`relative ${className} ${spent ? 'opacity-60' : ''} ${
        waiting && !spent ? 'shelf-waiting' : ''
      }`}
    >
      <span aria-hidden>{UI.works.openIcon}</span>
      <span className="sr-only">{title}</span>
      {open.length > 0 && (
        <span
          aria-hidden
          className="shelf-news absolute -right-1.5 -top-1.5 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-seal px-1 text-[10px] leading-none tabular-nums text-parchment"
        >
          {open.length}
        </span>
      )}

      {/* What this mark is, said once, on the first year that waits on it.
          It hangs off the bar into the top of the valley with a corner
          pointing back up at the mark, which is the same shape the note over
          the first small thing on the map uses. */}
      {note && waiting && !spent && (
        <span
          aria-hidden
          className="drift-in pointer-events-none absolute right-0 top-full z-50 mt-2 block w-[230px] rounded-md border border-seal/40 bg-ink/95 px-3 py-2 text-left shadow-lg"
        >
          <span className={`block ${TYPE.label} text-seal`}>{UI.works.firstHeading}</span>
          <span className={`mt-1 block ${TYPE.note} leading-relaxed text-parchment-dim`}>
            {UI.works.firstLine}
          </span>
          <span className="absolute right-4 top-0 block h-[9px] w-[9px] -translate-y-[5px] rotate-45 border-l border-t border-seal/40 bg-ink" />
        </span>
      )}
    </button>
  );
}
